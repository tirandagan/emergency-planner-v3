# Task 048: Fix Event Loop Conflicts in Celery Workers

## 1. Task Overview

### Task Title
**Title:** Fix Event Loop Management and HTTP Client Lifecycle in LLM Service Celery Workers

### Goal Statement
**Goal:** Eliminate event loop conflicts that cause "Event loop is closed" and "Cannot run the event loop while another loop is running" errors in the LLM service. These errors occur on fresh service restarts and during concurrent job execution, preventing reliable workflow processing. The fix will ensure proper HTTP client lifecycle management and eventlet-compatible event loop handling for stable, concurrent workflow execution.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The LLM service uses Celery with eventlet pool for async workflow execution. Currently, three critical issues exist:

1. **HTTP Client Lifecycle Issue**: `httpx.AsyncClient` instances are cached in `ExternalService._http_client` and persist across Celery task invocations, causing them to be tied to closed event loops from previous tasks

2. **Event Loop Cleanup Conflicts**: `WorkflowEngine.execute()` creates a new event loop per task and attempts cleanup in the finally block, but eventlet's existing loop causes "Cannot run the event loop while another loop is running" errors

3. **Concurrent Execution Failures**: When multiple jobs run simultaneously, they conflict over event loop ownership, causing the second job to fail immediately

This makes the service unreliable in production, especially after restarts and during high-load scenarios.

### Solution Options Analysis

#### Option 1: Fix HTTP Client Lifecycle Management + Eventlet-Aware Cleanup

**Approach:** Remove HTTP client caching, create fresh clients per request, ensure proper cleanup, and make event loop cleanup eventlet-aware

**Pros:**
- ✅ Addresses root cause of event loop conflicts (HTTP client lifecycle)
- ✅ Maintains modern async/await architecture
- ✅ Predictable resource management per task
- ✅ Handles both fresh-restart and concurrent-execution scenarios
- ✅ Minimal performance impact (connection pooling still works within httpx)

**Cons:**
- ❌ Requires changes across multiple files (3-4 files)
- ❌ Slightly more resource allocation per request (mitigated by httpx internal pooling)

**Implementation Complexity:** Medium - Multi-file changes but well-understood patterns
**Risk Level:** Low - Standard async resource management practices

#### Option 2: Replace httpx with Synchronous Requests Library

**Approach:** Replace all `httpx.AsyncClient` usage with synchronous `requests.Session`, rely on eventlet monkey-patching for concurrency

**Pros:**
- ✅ Simpler lifecycle management (no event loops)
- ✅ Better eventlet compatibility out-of-the-box
- ✅ Fewer async edge cases

**Cons:**
- ❌ Steps backward from modern Python async patterns
- ❌ Large refactor required (all service implementations)
- ❌ Loses benefits of native async/await (composability, cancellation, etc.)
- ❌ Makes future migration to async-first Celery pools harder

**Implementation Complexity:** High - Complete rewrite of external service layer
**Risk Level:** Medium - Large scope change with potential for new bugs

#### Option 3: Bandaid Fix - Skip Event Loop Cleanup Under Eventlet

**Approach:** Detect eventlet and skip problematic cleanup operations

**Pros:**
- ✅ Minimal code changes (only engine.py)
- ✅ Quick to implement

**Cons:**
- ❌ Doesn't fix underlying HTTP client lifecycle issue
- ❌ Only masks symptoms, not root cause
- ❌ First-job-after-restart issue would persist
- ❌ Resource leaks possible from skipped cleanup

**Implementation Complexity:** Low - Single file change
**Risk Level:** Medium - Masks problems rather than solving them

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Fix HTTP Client Lifecycle + Eventlet-Aware Cleanup

**Why this is the best choice:**
1. **Solves Root Cause**: Fixes the actual problem (HTTP clients outliving their event loops)
2. **Modern Architecture**: Maintains async/await patterns for future-proofing
3. **Production Ready**: Addresses all failure scenarios (restart, concurrency, cleanup)
4. **Best Practices**: Follows standard async resource management patterns
5. **Minimal Risk**: Well-understood changes with clear testing path

---

## 3. Current Codebase Analysis

### Files Involved

**Primary Files to Modify:**
1. `LLM_service/app/workflows/external_services.py` - Base ExternalService class with HTTP client management
2. `LLM_service/app/workflows/external_api_executor.py` - Service instantiation and cleanup
3. `LLM_service/app/workflows/engine.py` - Event loop creation and cleanup logic
4. `LLM_service/app/workflows/services/weatherapi.py` - Example service using HTTP client
5. `LLM_service/app/workflows/services/google_places.py` - Example service using HTTP client

### Current Implementation Issues

**Issue 1: HTTP Client Caching in ExternalService (external_services.py:160-173)**
```python
async def _get_http_client(self) -> httpx.AsyncClient:
    """Get or create HTTP client."""
    if self._http_client is None:  # ← PROBLEM: Caches client across tasks
        self._http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout),
            follow_redirects=True
        )
    return self._http_client
```

**Issue 2: Event Loop Cleanup in WorkflowEngine (engine.py:278-288)**
```python
finally:
    if loop:
        try:
            # Shutdown async generators
            loop.run_until_complete(loop.shutdown_asyncgens())  # ← PROBLEM: Conflicts with eventlet
            loop.close()
        except Exception as e:
            logger.warning(f"Error during event loop cleanup: {e}")
```

**Issue 3: Service Cleanup Not Always Called (external_api_executor.py:215-216)**
```python
# Close service connection
await service.close()  # ← Only called on success path, not guaranteed on errors
```

### Architecture Context

- **Celery Configuration**: Uses eventlet pool (`--pool=eventlet --concurrency=10`)
- **Event Loop Strategy**: Creates new loop per task in `WorkflowEngine.execute()`
- **Service Pattern**: Plugin-style external services inheriting from `ExternalService`
- **HTTP Library**: Uses httpx for async HTTP requests
- **Deployment**: Render.com with Gunicorn + Celery worker separation

---

## 4. Implementation Plan

### Phase 1: Fix HTTP Client Lifecycle (Core Fix)

**Goal:** Ensure HTTP clients are scoped to single requests and don't persist across tasks

#### Step 1.1: Modify ExternalService Base Class

**File:** `LLM_service/app/workflows/external_services.py`

**Changes:**
1. Remove `_get_http_client()` method entirely
2. Remove `self._http_client` instance variable
3. Add context manager support via `__aenter__` and `__aexit__`
4. Create HTTP client in context manager, ensure cleanup

**New Pattern:**
```python
class ExternalService(ABC):
    def __init__(self, ...):
        # Remove self._http_client = None
        pass

    async def __aenter__(self):
        """Create HTTP client for this context."""
        self._http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(self.timeout),
            follow_redirects=True
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up HTTP client."""
        if hasattr(self, '_http_client') and self._http_client:
            await self._http_client.aclose()
            delattr(self, '_http_client')
        return False

    # Remove _get_http_client method
    # Remove close method (handled by context manager)
```

#### Step 1.2: Update Service Implementations

**Files:** `weatherapi.py`, `google_places.py`

**Changes:**
1. Remove all `await self._get_http_client()` calls
2. Access `self._http_client` directly (created by context manager)
3. Update docstrings to note context manager usage

**Example Change in weatherapi.py:236:**
```python
# OLD:
client = await self._get_http_client()

# NEW:
# Access client directly (created by context manager)
client = self._http_client
```

#### Step 1.3: Update External API Executor

**File:** `LLM_service/app/workflows/external_api_executor.py`

**Changes:**
1. Use service as async context manager
2. Remove explicit `service.close()` call
3. Ensure cleanup happens even on errors

**Code Change (lines 178-216):**
```python
try:
    # Get service instance
    service_class = service_registry.get_service(service_name)

    # Use service as context manager for proper lifecycle
    async with service_class() as service:
        # Execute API request
        response: ExternalServiceResponse = await service.call(
            operation=operation,
            params=resolved_params,
            user_id=user_id,
            cache_ttl=cache_ttl
        )

        # Return response
        if response.success:
            return {
                'success': True,
                'data': response.data,
                'cached': response.cached,
                'metadata': response.metadata
            }
        # ... error handling
```

### Phase 2: Make Event Loop Cleanup Eventlet-Aware

**Goal:** Prevent "Cannot run the event loop while another loop is running" during cleanup

#### Step 2.1: Detect Eventlet Environment

**File:** `LLM_service/app/workflows/engine.py`

**Changes:**
1. Add eventlet detection at module level
2. Conditionally skip problematic cleanup when eventlet is active
3. Add detailed logging for debugging

**Code Change (lines 22-42):**
```python
# Detect if running under eventlet
try:
    import eventlet
    RUNNING_UNDER_EVENTLET = True
except ImportError:
    RUNNING_UNDER_EVENTLET = False

# Existing nest_asyncio logic remains...
```

#### Step 2.2: Update Event Loop Cleanup

**Code Change (lines 278-290):**
```python
finally:
    # Proper event loop cleanup
    if loop:
        try:
            if not RUNNING_UNDER_EVENTLET:
                # Safe to do full cleanup when not using eventlet
                loop.run_until_complete(loop.shutdown_asyncgens())
                loop.close()
            else:
                # Under eventlet, just close the loop
                # eventlet handles its own event loop lifecycle
                if not loop.is_closed():
                    loop.close()
                logger.debug("Event loop closed (eventlet mode)")
        except Exception as e:
            logger.warning(f"Error during event loop cleanup: {e}")
```

### Phase 3: Testing & Validation

#### Test 3.1: Fresh Restart Test
**Command:**
```bash
# Restart worker and immediately submit job
curl -X POST https://llm-service-api.onrender.com/api/v1/workflows/execute \
  -H "Content-Type: application/json" \
  -d '{"workflow_name": "emergency_contacts", "input_data": {...}}'
```

**Expected:** Job completes successfully without "Event loop is closed" error

#### Test 3.2: Concurrent Execution Test
**Command:**
```bash
# Submit 3 jobs simultaneously
for i in {1..3}; do
  curl -X POST https://llm-service-api.onrender.com/api/v1/workflows/execute \
    -H "Content-Type: application/json" \
    -d '{"workflow_name": "emergency_contacts", "input_data": {...}}' &
done
wait
```

**Expected:** All 3 jobs complete successfully without event loop conflicts

#### Test 3.3: Sequential Job Test
**Command:**
```bash
# Submit 10 jobs sequentially
for i in {1..10}; do
  curl -X POST https://llm-service-api.onrender.com/api/v1/workflows/execute \
    -H "Content-Type: application/json" \
    -d '{"workflow_name": "emergency_contacts", "input_data": {...}}'
  sleep 2
done
```

**Expected:** All 10 jobs complete successfully, no resource leaks

#### Test 3.4: Log Analysis
**Check Render logs for:**
- ✅ No "Event loop is closed" errors
- ✅ No "Cannot run the event loop while another loop is running" errors
- ✅ Successful job completions
- ✅ Proper cleanup messages

---

## 5. Code Quality Standards

### Python Standards
- **Type Hints**: All new methods must have complete type annotations
- **Async Patterns**: Proper use of async context managers (`async with`)
- **Error Handling**: Comprehensive try/except with specific exception types
- **Logging**: Debug-level logs for lifecycle events, warning for cleanup issues
- **Docstrings**: Update docstrings to reflect context manager usage

### Architecture Compliance
- **Single Responsibility**: Each class manages its own resources
- **RAII Pattern**: Resource Acquisition Is Initialization (context managers)
- **No Global State**: No shared mutable state across tasks
- **Clean Separation**: Event loop lifecycle separate from business logic

---

## 6. Implementation Checklist

### Pre-Implementation
- [x] Analyze logs to confirm root cause
- [x] Review recent commits related to event loops
- [x] Document all error scenarios
- [x] Create comprehensive task document

### Phase 1: HTTP Client Lifecycle
- [ ] Modify `ExternalService` to use context manager pattern
- [ ] Remove `_get_http_client()` and `close()` methods
- [ ] Update `weatherapi.py` to use context manager
- [ ] Update `google_places.py` to use context manager
- [ ] Update `external_api_executor.py` to use `async with`
- [ ] Test locally with pytest

### Phase 2: Eventlet-Aware Cleanup
- [ ] Add eventlet detection in `engine.py`
- [ ] Update event loop cleanup logic
- [ ] Add debug logging for cleanup path
- [ ] Test locally with Celery eventlet worker

### Phase 3: Testing & Validation
- [ ] Deploy to Render staging/production
- [ ] Run fresh restart test
- [ ] Run concurrent execution test (3 jobs)
- [ ] Run sequential test (10 jobs)
- [ ] Monitor logs for 24 hours
- [ ] Verify no event loop errors in logs

### Post-Implementation
- [ ] Update service documentation
- [ ] Document context manager pattern for future services
- [ ] Add integration test for concurrent workflows
- [ ] Close this task document

---

## 7. Success Criteria

### Functional Requirements
- ✅ No "Event loop is closed" errors on fresh service restarts
- ✅ No "Cannot run the event loop while another loop is running" errors during concurrent execution
- ✅ All workflow jobs complete successfully under concurrent load
- ✅ No resource leaks (HTTP connections properly closed)

### Performance Requirements
- ✅ No performance degradation from HTTP client changes
- ✅ Worker memory usage remains stable over 24 hours
- ✅ Job execution time remains within expected range

### Code Quality Requirements
- ✅ All modified code has proper type hints
- ✅ Context manager pattern properly implemented
- ✅ Comprehensive error handling maintained
- ✅ Logging provides clear debugging information

---

## 8. Risk Assessment

### Technical Risks
- **Risk:** Context manager pattern introduces new bugs
  - **Mitigation:** Comprehensive local testing before deployment
  - **Probability:** Low
  - **Impact:** Medium

- **Risk:** Performance impact from creating new HTTP clients
  - **Mitigation:** httpx uses internal connection pooling; minimal impact expected
  - **Probability:** Very Low
  - **Impact:** Low

### Deployment Risks
- **Risk:** Production issues during rollout
  - **Mitigation:** Deploy during low-traffic period, monitor logs closely
  - **Probability:** Low
  - **Impact:** Medium

---

## 9. Related Context

### Recent Commits
- `05957b6` - Fix nest_asyncio import-time conflict with uvloop
- `19e6c34` - Fix nest_asyncio compatibility with uvloop in Render deployment
- `ba23add` - Refactor event loop management in WorkflowEngine

### Error Logs
- Job `c3da11a4-54e0-4ba0-ba60-6786e35fca97`: "Event loop is closed" on fresh restart
- Job `51ae443f-a355-4bc4-8ddb-d8450edb2a49`: "Cannot run the event loop while another loop is running" during concurrent execution

### Documentation
- Celery eventlet pool: https://docs.celeryq.dev/en/stable/userguide/concurrency/eventlet.html
- httpx async client: https://www.python-httpx.org/async/
- Python async context managers: https://docs.python.org/3/reference/datamodel.html#async-context-managers

---

## 10. Notes & Observations

### Key Insights
1. The issue is a classic async resource lifecycle problem - HTTP clients surviving across event loop boundaries
2. Eventlet's monkey-patching creates a global event loop that conflicts with asyncio's per-task loop creation
3. Context managers are the idiomatic Python solution for resource lifecycle management

### Alternative Approaches Considered
- **Option 2 (Synchronous requests)**: Rejected due to stepping backward from modern async patterns
- **Option 3 (Bandaid fix)**: Rejected because it doesn't solve root cause

### Future Improvements
- Consider migrating to Celery's async pool when it matures (currently experimental)
- Evaluate gevent pool as alternative to eventlet
- Add automated integration tests for concurrent workflow execution

---

**Task Status:** Ready for Implementation
**Priority:** High - Blocks production reliability
**Estimated Effort:** 4-6 hours
**Created:** 2025-12-17
**Last Updated:** 2025-12-17
