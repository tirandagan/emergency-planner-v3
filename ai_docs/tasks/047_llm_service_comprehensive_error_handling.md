# AI Task Template

> **Task 047: LLM Service Comprehensive Error Handling Enhancement**

---

## 1. Task Overview

### Task Title
**Title:** Comprehensive Error Handling and Debugging System for LLM_service

### Goal Statement
**Goal:** Implement a robust error handling and reporting system for the LLM microservice that provides detailed error context, stack traces, error classification, and actionable debugging information to both webhooks and internal logging systems. This enhancement will transform vague error messages like "Event loop is closed" into structured, debuggable error reports that accelerate troubleshooting and improve system reliability.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The LLM_service currently has poor error trapping and minimal error context propagation. When errors occur during workflow execution (particularly in external API steps), the webhook receives only a basic error message without critical debugging information such as:
- Stack traces for developer debugging
- Input parameters that caused the failure
- Service configuration at time of error
- Error classification (retryable vs. permanent)
- Actionable suggestions for resolution

This lack of context makes debugging production issues extremely difficult and time-consuming.

### Solution Options Analysis

#### Option 1: Comprehensive Structured Error System
**Approach:** Implement a complete error handling framework with custom exception classes, error context capture, structured webhook payloads, and debug mode support.

**Pros:**
- ✅ Complete visibility into error conditions across all system layers
- ✅ Structured error data enables automated monitoring and alerting
- ✅ Debug mode provides detailed information for development without exposing sensitive data in production
- ✅ Error classification enables intelligent retry logic and user-facing messaging
- ✅ Stack traces dramatically reduce time-to-resolution for bugs

**Cons:**
- ❌ Higher initial implementation effort (4-6 hours)
- ❌ Requires updates across multiple modules (engine, executors, tasks, webhooks)
- ❌ Need to carefully handle sensitive data in error logs

**Implementation Complexity:** Medium-High - Requires systematic updates across 5-6 files but follows clear patterns
**Risk Level:** Low - Error handling improvements are inherently low-risk (fail-safe)

#### Option 2: Basic Error Message Enhancement
**Approach:** Simply improve error message strings to include more context without restructuring the error handling architecture.

**Pros:**
- ✅ Quick to implement (1-2 hours)
- ✅ Minimal code changes
- ✅ Immediate improvement in error visibility

**Cons:**
- ❌ Doesn't provide machine-readable error classification
- ❌ No stack trace capture for debugging
- ❌ Limited ability to build automated error handling logic
- ❌ Still difficult to debug complex multi-step workflow failures
- ❌ No debug mode support for development vs production

**Implementation Complexity:** Low - Simple string formatting changes
**Risk Level:** Low - Minimal changes to existing code

#### Option 3: Logging-Only Enhancement
**Approach:** Improve internal logging without changing webhook payloads, relying on log aggregation for debugging.

**Pros:**
- ✅ No changes to webhook contract
- ✅ Detailed logs available for internal debugging
- ✅ Lower risk of exposing sensitive data

**Cons:**
- ❌ Webhook consumers still receive minimal error information
- ❌ Requires log aggregation infrastructure to be useful
- ❌ Doesn't help external consumers debug their integrations
- ❌ No programmatic error handling by webhook consumers

**Implementation Complexity:** Low - Logging improvements only
**Risk Level:** Low - Internal-only changes

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Comprehensive Structured Error System

**Why this is the best choice:**
1. **Long-term Maintainability** - As the system grows, structured error handling becomes increasingly valuable. The upfront investment pays dividends every time an error occurs.
2. **Developer Experience** - Stack traces and error context reduce debugging time from hours to minutes, dramatically improving developer productivity.
3. **Production Observability** - Structured errors enable proper monitoring, alerting, and automated error classification in production environments.
4. **External Integration Support** - Webhook consumers can programmatically handle different error types and provide better user experiences.
5. **Debug Mode Flexibility** - Ability to toggle detailed vs. sanitized errors based on environment prevents sensitive data leaks while maintaining debugging capability.

**Key Decision Factors:**
- **Performance Impact:** Minimal - Error context capture adds <10ms overhead only during error conditions
- **User Experience:** Dramatically improves debugging experience for both internal developers and webhook consumers
- **Maintainability:** Creates foundation for future enhancements (retry logic, error recovery, monitoring)
- **Scalability:** Structured errors enable automated error analysis and trend detection
- **Security:** Debug mode allows detailed errors in development, sanitized errors in production

**Alternative Consideration:**
Option 2 (Basic Error Message Enhancement) could be viable if implementation time is extremely constrained, but it provides only 30% of the value for 40% of the effort. The incremental investment in Option 1 delivers exponentially more value.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 1 - Comprehensive Structured Error System), or would you prefer a different approach?

**Questions for you to consider:**
- Does the recommended solution align with your priorities for production observability?
- Are you comfortable with the 4-6 hour implementation time for comprehensive error handling?
- Would you prefer a phased approach (basic improvements first, advanced features later)?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan and present you with next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Python 3.9+, FastAPI, Celery for async task execution
- **Language:** Python with type hints
- **Database & ORM:** PostgreSQL via SQLAlchemy ORM
- **Task Queue:** Celery with Redis broker
- **Key Architectural Patterns:**
  - Workflow engine pattern for multi-step LLM workflows
  - Service registry pattern for external API integrations
  - Webhook delivery system for async status notifications
  - Plugin architecture for external services (Google Places, WeatherAPI)
- **Relevant Existing Components:**
  - `app/workflows/engine.py` - Main workflow orchestration
  - `app/workflows/external_api_executor.py` - External API step execution
  - `app/tasks/workflows.py` - Celery task wrapper for workflows
  - `app/services/webhook_sender.py` - Webhook delivery with HMAC signing

### Current State
**Current Error Handling:**
- Generic exception catching with minimal context
- Error messages stored as simple strings in database
- Webhook payloads contain only basic `error_message` field
- No stack trace capture for debugging
- No error classification (user error vs. system error)
- No distinction between retryable and permanent errors
- Missing input context (what parameters caused the failure)
- No debug mode support for development

**Example Current Error Message:**
```json
{
  "event": "workflow.failed",
  "job_id": "...",
  "status": "failed",
  "error_message": "Step 'fetch_weather' execution failed: Unexpected error in external API step: Event loop is closed"
}
```

**Problems with Current Approach:**
1. No stack trace - can't identify code location of error
2. No input context - can't reproduce the error
3. No service configuration - don't know which API endpoint failed
4. No error classification - don't know if retry would help
5. No debugging suggestions - developer must investigate from scratch

**What's Working:**
- Basic error propagation from executors to workflow engine
- Error mode support (fail/continue) at step level
- Webhook delivery on job failure
- Error message storage in database

### Existing Context Providers Analysis
N/A - This is a microservice with no React context providers. Error handling is server-side only.

**🔍 Context Coverage Analysis:**
Not applicable for this microservice implementation.

---

## 4. Context & Problem Definition

### Problem Statement
When workflow execution fails in the LLM microservice, developers and webhook consumers receive minimal error information that makes debugging extremely difficult. Critical information such as stack traces, input parameters, service configuration, and error classification is lost during error propagation. This results in:

**Pain Points:**
1. **Time-Consuming Debugging:** Developers spend hours reproducing errors due to lack of input context
2. **Production Blind Spots:** No visibility into why production workflows fail without access to server logs
3. **Poor User Experience:** Webhook consumers can't provide helpful error messages to end users
4. **No Automated Recovery:** Lack of error classification prevents intelligent retry logic
5. **Security Risks:** Can't distinguish between auth failures, rate limits, and code bugs

**User Impact:**
- External service timeouts appear identical to code bugs
- Rate limit errors don't indicate retry-after timing
- Authentication failures don't suggest checking API keys
- Event loop errors don't suggest worker configuration issues

**Why This Needs to Be Solved Now:**
As the LLM service grows in complexity with more external integrations (Google Places, WeatherAPI, future services), the current error handling becomes increasingly inadequate. Every new integration multiplies the potential failure modes, making comprehensive error handling critical for maintainability.

### Success Criteria
- [ ] All errors include structured error objects with type, category, and context
- [ ] Stack traces captured and included in debug mode
- [ ] Input parameters logged with all errors (sanitized for sensitive data)
- [ ] Error classification system distinguishes user errors, config errors, system errors, and external errors
- [ ] Webhook payloads include comprehensive error details with debug mode support
- [ ] Actionable suggestions provided for common error types
- [ ] Retry recommendations included for transient errors
- [ ] Error context preserved through all propagation layers (executor → engine → task → webhook)

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is the LLM microservice in active development**
- **No backwards compatibility concerns** - can restructure error handling completely
- **Data loss acceptable** - existing error logs can be migrated or discarded
- **Users are developers/testers** - detailed error information is desired
- **Priority: Comprehensive debugging information** over backwards compatibility
- **Aggressive refactoring allowed** - can add new fields to error structures

---

## 6. Technical Requirements

### Functional Requirements
- **Error Context Capture:** Every error must capture stack trace, timestamp, service name, operation, and input parameters
- **Error Classification System:** Errors categorized as USER_ERROR, CONFIG_ERROR, SYSTEM_ERROR, EXTERNAL_ERROR with sub-types
- **Structured Error Objects:** All errors represented as structured dictionaries with consistent schema
- **Debug Mode Support:** Environment variable `DEBUG_MODE` controls detailed vs. sanitized error output
- **Webhook Enhancement:** Webhook payloads include full error object with classification and suggestions
- **Sensitive Data Filtering:** Sanitize API keys, tokens, and PII from error logs
- **Retry Recommendations:** Include `retryable` flag and `retry_after` timing for transient errors
- **Actionable Suggestions:** Provide specific debugging suggestions based on error type
- **Error Propagation:** Maintain error context through all layers without wrapping/losing information

### Non-Functional Requirements
- **Performance:** Error context capture adds <10ms overhead during error conditions
- **Security:** Never log API keys, authentication tokens, or PII in error messages
- **Usability:** Error messages clear enough for non-developers to understand issue category
- **Compatibility:** Existing webhook consumers continue to work (additive changes only)

### Technical Constraints
- Must work with existing Celery async task architecture
- Cannot break existing workflow JSON definitions
- Must maintain HMAC webhook signature compatibility
- Error objects must be JSON-serializable for database storage and webhook delivery

---

## 7. Data & Database Changes

### Database Schema Changes
```sql
-- No database schema changes required
-- Existing error_message TEXT field in workflow_jobs table can store structured JSON
-- Example: error_message column will contain JSON string instead of plain text
```

### Data Model Updates
```python
# No new tables or columns needed
# However, we'll enhance the error_message storage format:
#
# Current format:
#   error_message = "Step 'fetch_weather' execution failed: Event loop is closed"
#
# New format (JSON string stored in same TEXT column):
#   error_message = json.dumps({
#     "type": "ExternalAPIError",
#     "category": "SYSTEM_ERROR",
#     "message": "Event loop is closed",
#     "step_id": "fetch_weather",
#     "service": "weatherapi",
#     "operation": "current",
#     "timestamp": "2025-12-16T21:40:00Z",
#     "retryable": false,
#     "suggestions": ["Check Celery worker pool configuration"],
#     "context": {...},
#     "stack_trace": "..." (only if debug_mode=true)
#   })
```

### Data Migration Plan
- [ ] No migration required - new error format is backward compatible (consumers can check for JSON vs string)
- [ ] Old error messages (plain strings) continue to work
- [ ] New errors automatically use structured format
- [ ] Optional: Create database view to parse JSON error messages for querying

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

This is a microservice - no Server Actions or Next.js patterns apply.

#### **Error Handling Strategy**
- [ ] **Custom Exception Classes** - Create exception hierarchy for different error types
- [ ] **Error Context Objects** - Structured error data with all debugging information
- [ ] **Error Propagation** - Preserve context through all layers without information loss
- [ ] **Webhook Enhancement** - Include structured error in webhook payloads

### New Exception Classes (app/workflows/errors.py)
```python
# New file: app/workflows/errors.py

class WorkflowErrorContext:
    """Structured error context for comprehensive debugging"""
    def __init__(
        self,
        error_type: str,
        category: str,
        message: str,
        step_id: Optional[str] = None,
        service: Optional[str] = None,
        operation: Optional[str] = None,
        inputs: Optional[Dict] = None,
        config: Optional[Dict] = None,
        stack_trace: Optional[str] = None,
        retryable: bool = False,
        retry_after: Optional[int] = None,
        suggestions: Optional[List[str]] = None,
    ):
        self.error_type = error_type
        self.category = category
        self.message = message
        self.step_id = step_id
        self.service = service
        self.operation = operation
        self.inputs = inputs
        self.config = config
        self.stack_trace = stack_trace
        self.retryable = retryable
        self.retry_after = retry_after
        self.suggestions = suggestions or []
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """Convert to dictionary, optionally sanitizing sensitive data"""
        ...

class WorkflowErrorBase(Exception):
    """Base exception with error context support"""
    def __init__(self, message: str, context: Optional[WorkflowErrorContext] = None):
        super().__init__(message)
        self.context = context or self._build_default_context(message)

    def _build_default_context(self, message: str) -> WorkflowErrorContext:
        """Build default context if none provided"""
        ...

# Specific error types
class ExternalAPIError(WorkflowErrorBase):
    """External API call failed"""
    pass

class ConfigurationError(WorkflowErrorBase):
    """Configuration issue (missing API key, invalid config)"""
    pass

class UserInputError(WorkflowErrorBase):
    """Invalid user input"""
    pass

class SystemError(WorkflowErrorBase):
    """System-level error (event loop, memory, etc.)"""
    pass
```

### Error Handling Updates

**Files to Modify:**
- `app/workflows/external_api_executor.py` - Capture full error context in try/except blocks
- `app/workflows/engine.py` - Propagate error context through workflow execution
- `app/tasks/workflows.py` - Store structured error in database and trigger enhanced webhook
- `app/services/webhook_sender.py` - Include error context in webhook payload
- `app/workflows/external_services.py` - Enhance exception classes with context

**Enhanced Error Capture Pattern:**
```python
# In external_api_executor.py
try:
    response = await service.call(...)
except Exception as e:
    # Build comprehensive error context
    error_context = WorkflowErrorContext(
        error_type=type(e).__name__,
        category=classify_error(e),
        message=str(e),
        step_id=step.id,
        service=service_name,
        operation=operation,
        inputs=sanitize_inputs(resolved_params),
        config=sanitize_config(step.config),
        stack_trace=traceback.format_exc() if DEBUG_MODE else None,
        retryable=is_retryable_error(e),
        retry_after=get_retry_after(e),
        suggestions=get_error_suggestions(e, service_name)
    )

    raise ExternalAPIError(
        f"External API call failed: {service_name}.{operation}",
        context=error_context
    )
```

### Webhook Payload Enhancement

**Current Webhook Payload:**
```json
{
  "event": "workflow.failed",
  "job_id": "...",
  "status": "failed",
  "error_message": "Step 'fetch_weather' execution failed: Unexpected error in external API step: Event loop is closed"
}
```

**Enhanced Webhook Payload:**
```json
{
  "event": "workflow.failed",
  "job_id": "uuid-here",
  "status": "failed",
  "error_message": "Step 'fetch_weather' execution failed: Event loop is closed",
  "error": {
    "type": "ExternalAPIError",
    "category": "SYSTEM_ERROR",
    "step_id": "fetch_weather",
    "message": "Event loop is closed",
    "details": {
      "service": "weatherapi",
      "operation": "current",
      "inputs": {
        "lat": 40.7128,
        "lng": -74.006
      },
      "config": {
        "cache_ttl": 3600
      },
      "stack_trace": "Traceback (most recent call last):\n  File ...",
      "timestamp": "2025-12-16T21:40:50Z",
      "retryable": false,
      "retry_after": null,
      "suggestions": [
        "Check Celery worker pool configuration (should be eventlet or gevent)",
        "Ensure async HTTP client is properly initialized",
        "Verify worker restart policies in Celery configuration"
      ]
    }
  }
}
```

### Configuration Changes

**New Environment Variable:**
```bash
# .env / settings.ini
DEBUG_MODE=true  # Include stack traces and detailed context in errors
```

---

## 9. Frontend Changes

### New Components
N/A - This is a backend microservice with no frontend components.

### Page Updates
N/A - No web pages in this microservice.

### State Management
N/A - No client-side state management.

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**Current Error Handling in external_api_executor.py (lines 200-209):**
```python
except Exception as e:
    error_msg = f"Unexpected error in external API step: {str(e)}"

    if error_mode == 'fail':
        raise Exception(error_msg)

    return {
        'success': False,
        'error': error_msg
    }
```

**Current Error Handling in workflows.py (lines 186-201):**
```python
except WorkflowExecutionError as e:
    logger.error(f"Workflow execution failed: {job_id}", exc_info=e)

    # Update job status to FAILED
    job.status = JobStatus.FAILED.value
    job.error_message = str(e)  # <-- Lost all context here
    job.completed_at = datetime.now(timezone.utc)

    if job.started_at:
        duration = (job.completed_at - job.started_at).total_seconds() * 1000
        job.duration_ms = int(duration)

    db.commit()

    raise  # Re-raise to trigger Celery retry logic
```

**Current Webhook Delivery in webhooks.py:**
```python
# Missing error context - only sends basic job data
payload = {
    "event": event_type,
    "job_id": str(job.id),
    "status": job.status,
    "error_message": job.error_message,  # <-- Plain string, no structure
    ...
}
```

### 📂 **After Refactor**

**New Error Handling in external_api_executor.py:**
```python
except Exception as e:
    # Build comprehensive error context
    error_context = WorkflowErrorContext(
        error_type=type(e).__name__,
        category=classify_error(e),  # USER_ERROR, CONFIG_ERROR, SYSTEM_ERROR, EXTERNAL_ERROR
        message=str(e),
        step_id=step.id,
        service=service_name,
        operation=operation,
        inputs=sanitize_inputs(resolved_params),  # Remove API keys, tokens
        config=sanitize_config(step.config),
        stack_trace=traceback.format_exc() if settings.DEBUG_MODE else None,
        retryable=is_retryable_error(e),
        retry_after=get_retry_after(e),
        suggestions=get_error_suggestions(e, service_name, operation)
    )

    if error_mode == 'fail':
        raise ExternalAPIError(
            f"External API call failed: {service_name}.{operation}",
            context=error_context
        )

    return {
        'success': False,
        'error': str(e),
        'error_context': error_context.to_dict(include_sensitive=settings.DEBUG_MODE)
    }
```

**Enhanced Error Handling in workflows.py:**
```python
except WorkflowExecutionError as e:
    logger.error(f"Workflow execution failed: {job_id}", exc_info=e)

    # Store structured error context in database
    error_dict = None
    if hasattr(e, 'context') and isinstance(e.context, WorkflowErrorContext):
        error_dict = e.context.to_dict(include_sensitive=False)  # Never store sensitive data in DB
        job.error_message = json.dumps(error_dict)
    else:
        job.error_message = str(e)

    job.status = JobStatus.FAILED.value
    job.completed_at = datetime.now(timezone.utc)

    if job.started_at:
        duration = (job.completed_at - job.started_at).total_seconds() * 1000
        job.duration_ms = int(duration)

    db.commit()

    raise  # Re-raise to trigger Celery retry logic
```

**Enhanced Webhook Delivery in webhooks.py:**
```python
# Build enhanced webhook payload with error context
payload = {
    "event": event_type,
    "job_id": str(job.id),
    "status": job.status,
    "workflow_name": job.workflow_name,
    "created_at": job.created_at.isoformat(),
    "completed_at": job.completed_at.isoformat() if job.completed_at else None,
    "duration_ms": job.duration_ms
}

# Add error context for failed jobs
if event_type == "workflow.failed" and job.error_message:
    try:
        # Try to parse as JSON (new structured format)
        error_obj = json.loads(job.error_message)
        payload["error_message"] = error_obj.get("message", job.error_message)
        payload["error"] = error_obj  # Full structured error
    except (json.JSONDecodeError, TypeError):
        # Fallback for old plain string errors
        payload["error_message"] = job.error_message
```

### 🎯 **Key Changes Summary**
- [ ] **New File Created:** `app/workflows/errors.py` - Custom exception hierarchy and WorkflowErrorContext class
- [ ] **New Utility Functions:** Error classification, input sanitization, suggestion generation
- [ ] **Enhanced Exception Handling:** All try/except blocks now capture full error context
- [ ] **Structured Error Storage:** Database error_message field stores JSON instead of plain strings
- [ ] **Webhook Enhancement:** Webhook payloads include comprehensive error objects
- [ ] **Debug Mode Support:** Environment variable controls stack trace inclusion
- [ ] **Backward Compatibility:** Old webhook consumers continue to work with error_message field

**Files Modified:**
1. `app/workflows/errors.py` - NEW FILE (custom exceptions)
2. `app/workflows/external_api_executor.py` - Enhanced error capture
3. `app/workflows/engine.py` - Error context propagation
4. `app/tasks/workflows.py` - Structured error storage
5. `app/tasks/webhooks.py` - Enhanced webhook payloads
6. `app/config.py` - Add DEBUG_MODE setting
7. `settings.ini` - Add DEBUG_MODE configuration

**Impact:**
This refactor transforms opaque error messages into comprehensive debugging reports, reducing time-to-resolution for production issues from hours to minutes.

---

## 11. Implementation Plan

### Phase 1: Custom Exception Classes and Error Context
**Goal:** Create foundational error handling infrastructure

- [x] **Task 1.1:** Create `app/workflows/errors.py` with custom exception hierarchy ✓ 2025-12-16
  - Files: `app/workflows/errors.py` (new file) ✓
  - Details: Implemented `WorkflowErrorContext`, `WorkflowErrorBase`, and specific exception types (ExternalAPIError, ConfigurationError, UserInputError, SystemError) ✓
- [x] **Task 1.2:** Add error classification and suggestion utilities ✓ 2025-12-16
  - Files: `app/workflows/errors.py` ✓
  - Details: Implemented `classify_error()`, `is_retryable_error()`, `get_retry_after()`, `get_error_suggestions()` helper functions ✓
- [x] **Task 1.3:** Add input/config sanitization functions ✓ 2025-12-16
  - Files: `app/workflows/errors.py` ✓
  - Details: Implemented `sanitize_inputs()` and `sanitize_config()` to remove API keys, tokens, and PII from error logs ✓

### Phase 2: Enhanced Error Capture in Executors
**Goal:** Capture comprehensive error context at the source

- [x] **Task 2.1:** Update `external_api_executor.py` error handling ✓ 2025-12-16
  - Files: `app/workflows/external_api_executor.py` ✓
  - Details: Replaced generic exception handling with structured `WorkflowErrorContext` capture in all try/except blocks - covers RateLimitExceeded, ExternalServiceError, configuration errors, and unexpected exceptions ✓
- [x] **Task 2.2:** Update `external_services.py` exception classes ✓ 2025-12-16
  - Files: `app/workflows/external_services.py` ✓
  - Details: Existing exception classes work with new error context system - no changes needed (errors are wrapped at executor level) ✓
- [x] **Task 2.3:** Update service implementations (Google Places, WeatherAPI) ✓ 2025-12-16
  - Files: `app/workflows/services/google_places.py`, `app/workflows/services/weatherapi.py` ✓
  - Details: Service implementations use existing exception classes - error context captured at executor level ✓

### Phase 3: Error Propagation Through Workflow Engine
**Goal:** Preserve error context through all workflow execution layers

- [x] **Task 3.1:** Update `engine.py` step execution error handling ✓ 2025-12-16
  - Files: `app/workflows/engine.py` ✓
  - Details: Modified `_execute_step()` method to preserve error context when re-raising exceptions - WorkflowErrorBase exceptions now pass through unchanged ✓
- [x] **Task 3.2:** Enhance workflow result error storage ✓ 2025-12-16
  - Files: `app/workflows/engine.py` ✓
  - Details: Updated workflow exception handler to extract and store structured error_context in WorkflowResult metadata ✓

### Phase 4: Celery Task Error Handling
**Goal:** Store structured errors in database and trigger enhanced webhooks

- [x] **Task 4.1:** Update Celery task error handling ✓ 2025-12-16
  - Files: `app/tasks/workflows.py` ✓
  - Details: Modified all exception handlers (WorkflowExecutionError, unexpected errors, workflow result failures) to extract and store WorkflowErrorContext as JSON in database ✓
- [x] **Task 4.2:** Update `WorkflowTask.on_failure()` callback ✓ 2025-12-16
  - Files: `app/tasks/workflows.py` ✓
  - Details: Enhanced failure callback to store structured error context with proper fallback for legacy exceptions ✓

### Phase 5: Webhook Enhancement
**Goal:** Deliver comprehensive error information to webhook consumers

- [x] **Task 5.1:** Update webhook payload builder ✓ 2025-12-16
  - Files: `app/tasks/webhooks.py` ✓
  - Details: Enhanced `build_webhook_payload` to parse structured error JSON from database and include full error object in webhook payload with backward compatibility ✓
- [x] **Task 5.2:** Add debug mode support to webhook delivery ✓ 2025-12-16
  - Files: `app/tasks/webhooks.py` ✓
  - Details: Stack traces included/excluded based on DEBUG_MODE setting (handled by WorkflowErrorContext.to_dict(include_sensitive) in Phase 1) ✓

### Phase 6: Configuration and Documentation
**Goal:** Add configuration support and update documentation

- [x] **Task 6.1:** Add DEBUG_MODE configuration setting ✓ 2025-12-16
  - Files: `app/config.py`, `settings.ini` ✓
  - Details: Added DEBUG_MODE boolean setting with comprehensive documentation (default: false for production) ✓
- [x] **Task 6.2:** Update TESTING_GUIDE.md documentation ✓ 2025-12-16
  - Files: `LLM_service/TESTING_GUIDE.md` ✓
  - Details: Added complete Phase 9 documentation section with error testing scenarios, configuration guide, and monitoring instructions ✓

### Phase 7: Testing and Validation
**Goal:** Verify error handling improvements work correctly

- [x] **Task 7.1:** Create test utilities for error generation ✓ 2025-12-16
  - Files: `tests/test_error_handling.py` (new file) ✓
  - Details: Implemented comprehensive test suite for WorkflowErrorContext, custom exceptions, error classification, retry logic, error suggestions, and input/config sanitization. Includes ErrorTestHelpers utility class for other test files ✓
- [x] **Task 7.2:** Test external API error scenarios ✓ 2025-12-16
  - Files: `tests/test_external_api_error_handling.py` (new file) ✓
  - Details: Created tests for timeout errors, authentication errors, rate limit errors, network errors, validation errors, system errors, and error context propagation through external_api_executor ✓
- [x] **Task 7.3:** Verify webhook payload structure ✓ 2025-12-16
  - Files: `tests/test_webhook_error_payloads.py` (new file) ✓
  - Details: Implemented tests for webhook payload structure, backward compatibility, JSON serialization, error categories, sensitive data sanitization, and payload completeness validation ✓
- [x] **Task 7.4:** Test debug mode on/off scenarios ✓ 2025-12-16
  - Files: `tests/test_debug_mode.py` (new file) ✓
  - Details: Created comprehensive tests verifying stack traces included when DEBUG_MODE=true and excluded when DEBUG_MODE=false, including configuration tests, real-world use cases, and edge case handling ✓

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - You must confirm you actually did what you said
  - [ ] **Provides user visibility** - Clear progress tracking throughout implementation
  - [ ] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [ ] **Creates audit trail** - Documentation of what was actually completed
  - [ ] **Enables better debugging** - If issues arise, easy to see what was changed

---

## 13. File Structure & Organization

### New Files to Create
```
LLM_service/
├── app/
│   ├── workflows/
│   │   └── errors.py                          # NEW: Custom exception classes and error context
├── tests/
│   ├── test_error_handling.py                 # NEW: Error handling test suite
│   ├── test_external_api_error_handling.py    # NEW: External API error tests
│   ├── test_webhook_error_payloads.py         # NEW: Webhook payload validation tests
│   └── test_debug_mode.py                     # NEW: Debug mode toggle tests
```

### Files to Modify
- [ ] **`app/config.py`** - Add DEBUG_MODE setting
- [ ] **`settings.ini`** - Add DEBUG_MODE configuration value
- [ ] **`app/workflows/external_api_executor.py`** - Enhanced error capture in try/except blocks
- [ ] **`app/workflows/external_services.py`** - Enhance exception classes with error context support
- [ ] **`app/workflows/services/google_places.py`** - Update Google Places service error handling
- [ ] **`app/workflows/services/weatherapi.py`** - Update WeatherAPI service error handling
- [ ] **`app/workflows/engine.py`** - Error context propagation in workflow execution
- [ ] **`app/tasks/workflows.py`** - Structured error storage in database, enhanced Celery error handling
- [ ] **`app/tasks/webhooks.py`** - Enhanced webhook payload with structured error objects
- [ ] **`LLM_service/TESTING_GUIDE.md`** - Document new error handling system

### Dependencies to Add
No new dependencies required - uses standard library modules (traceback, json, datetime).

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** External API timeout with rate limit header
  - **Code Review Focus:** `external_api_executor.py` timeout handling, `get_retry_after()` utility
  - **Potential Fix:** Extract Retry-After header from HTTP 429 responses, include in error context
- [ ] **Error Scenario 2:** Missing API key configuration
  - **Code Review Focus:** Service initialization in `external_services.py`, environment variable validation
  - **Potential Fix:** Classify as CONFIG_ERROR, suggest checking environment variables
- [ ] **Error Scenario 3:** Invalid user input (malformed coordinates)
  - **Code Review Focus:** Input validation in `external_api_executor.py` parameter resolution
  - **Potential Fix:** Classify as USER_ERROR, provide specific validation error message
- [ ] **Error Scenario 4:** Event loop closed error (async context issues)
  - **Code Review Focus:** Celery worker configuration, async client lifecycle
  - **Potential Fix:** Classify as SYSTEM_ERROR, suggest worker pool configuration check

### Edge Cases to Consider
- [ ] **Edge Case 1:** Error occurs during error context building (avoid error-handling-error loop)
  - **Analysis Approach:** Wrap error context building in try/except with fallback to simple error message
  - **Recommendation:** Implement defensive error context creation with graceful degradation
- [ ] **Edge Case 2:** Sensitive data in error inputs (API keys passed as parameters)
  - **Analysis Approach:** Review `sanitize_inputs()` function for common sensitive field patterns
  - **Recommendation:** Maintain blacklist of sensitive parameter names (key, token, secret, password)
- [ ] **Edge Case 3:** Very large error context (stack traces, large input payloads)
  - **Analysis Approach:** Check error context size limits for database storage and webhook delivery
  - **Recommendation:** Truncate stack traces to last 50 lines, limit input context to 1KB
- [ ] **Edge Case 4:** JSON serialization failures in error context
  - **Analysis Approach:** Ensure all error context fields are JSON-serializable
  - **Recommendation:** Convert non-serializable objects (datetime, bytes) to strings in `to_dict()`

### Security & Access Control Review
- [ ] **Sensitive Data Exposure:** Are API keys, tokens, or credentials sanitized from error logs?
  - **Check:** `sanitize_inputs()` and `sanitize_config()` functions in `errors.py`
- [ ] **Stack Trace Exposure:** Are stack traces only included in debug mode?
  - **Check:** `DEBUG_MODE` flag usage in `WorkflowErrorContext.to_dict()`
- [ ] **PII Protection:** Is personally identifiable information (emails, names) removed from error context?
  - **Check:** Input sanitization in `external_api_executor.py`
- [ ] **Production vs Development:** Is debug mode disabled by default in production?
  - **Check:** `settings.ini` default value for DEBUG_MODE

### AI Agent Analysis Approach
**Focus:** Review existing error handling code to identify gaps in context capture, ensure sensitive data sanitization, and validate error classification logic. When issues are found, provide specific recommendations with file paths and code examples.

**Priority Order:**
1. **Critical:** Sensitive data exposure in error logs (API keys, tokens, PII)
2. **Important:** Missing error context that blocks debugging (stack traces, input parameters)
3. **Nice-to-have:** Enhanced error suggestions and retry recommendations

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# Add to .env or settings.ini
DEBUG_MODE=true   # Development: Include stack traces and detailed context
DEBUG_MODE=false  # Production: Sanitize stack traces and sensitive data (default)
```

### Configuration Updates
```ini
# settings.ini
[DEFAULT]
DEBUG_MODE = false  # Default to production mode (no stack traces)
```

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **EVALUATE STRATEGIC NEED** - Multiple approaches exist (comprehensive vs. basic vs. logging-only)
2. **STRATEGIC ANALYSIS** - Presented solution options with pros/cons ✅ COMPLETE
3. **CREATE A TASK DOCUMENT** in `ai_docs/tasks/` using this template ✅ COMPLETE
4. **GET USER APPROVAL** of the task document ⏳ WAITING FOR APPROVAL
5. **IMPLEMENT THE FEATURE** only after approval

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates during implementation
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)** ✅ COMPLETE
2. **STRATEGIC ANALYSIS SECOND (If needed)** ✅ COMPLETE
3. **CREATE TASK DOCUMENT THIRD (Required)** ✅ COMPLETE
4. **PRESENT IMPLEMENTATION OPTIONS (Required)** ⏳ NEXT STEP

**👤 IMPLEMENTATION OPTIONS:**

**A) Preview High-Level Code Changes**
Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

**B) Proceed with Implementation**
Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

**C) Provide More Feedback**
Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

### Code Quality Standards
- [ ] Follow Python best practices (PEP 8, type hints)
- [ ] Add proper error handling (defensive programming)
- [ ] **Use early returns to keep code clean and readable**
- [ ] **Use async/await instead of .then() chaining** (Python: already async/await)
- [ ] **NO FALLBACK BEHAVIOR - Always throw errors instead**
- [ ] **Never handle "legacy formats"** - expect current format or fail fast
- [ ] Use professional comments explaining business logic
- [ ] Remove unused code completely (no commented code)

### Architecture Compliance
- [ ] **✅ VERIFY: Python microservice patterns followed**
  - [ ] Custom exception hierarchy for structured errors
  - [ ] Error context propagation through all layers
  - [ ] Webhook delivery includes comprehensive error objects
- [ ] **🚨 VERIFY: Sensitive data sanitization implemented**
  - [ ] API keys removed from error logs
  - [ ] Stack traces only included in debug mode
  - [ ] PII filtered from error context

---

## 17. Notes & Additional Context

### Research Links
- [Python Exception Handling Best Practices](https://docs.python.org/3/tutorial/errors.html)
- [Celery Error Handling](https://docs.celeryproject.org/en/stable/userguide/tasks.html#error-handling)
- [Structured Logging in Python](https://www.structlog.org/)
- [Webhook Security Best Practices](https://webhooks.fyi/best-practices/webhook-security)

### Implementation Notes

★ **Insight ─────────────────────────────────────**
**Why Structured Errors Matter:**
When debugging production issues, the difference between "Event loop is closed" and a full error context with stack trace, inputs, and suggestions can reduce time-to-resolution from hours to minutes. The upfront investment in comprehensive error handling pays dividends every time an error occurs in production.

**Key Design Decisions:**
1. **JSON Storage Format:** Using JSON strings in existing TEXT column avoids database migration while enabling structured queries via PostgreSQL JSON operators
2. **Debug Mode Toggle:** Separating development (verbose) from production (sanitized) errors prevents sensitive data leaks while maintaining debugging capability
3. **Backward Compatibility:** Webhook consumers that expect `error_message` string continue to work; enhanced consumers can parse the `error` object
─────────────────────────────────────────────────

### Common Error Handling Pitfalls to Avoid

**❌ NEVER DO:**
- Log API keys, authentication tokens, or passwords in error messages
- Wrap exceptions without preserving the original exception context
- Use generic `Exception` catch-all without classifying error types
- Store full stack traces in production databases (use debug mode instead)
- Return sensitive error details to end users via webhooks

**✅ ALWAYS DO:**
- Capture error context at the source (where exception occurs)
- Classify errors into categories (USER, CONFIG, SYSTEM, EXTERNAL)
- Provide actionable suggestions for common error types
- Sanitize inputs and configuration before logging
- Include retry recommendations for transient errors
- Test error handling with realistic failure scenarios

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** Webhook payload structure is extended (additive changes only)
- [ ] **Database Dependencies:** No schema changes; existing error_message column stores JSON instead of plain text
- [ ] **Component Dependencies:** All exception handlers updated to use new error context system
- [ ] **Authentication/Authorization:** No impact

**Assessment:** No breaking changes. Old webhook consumers continue to work with `error_message` field. New consumers can parse `error` object for enhanced context.

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** Error propagation flow changes from simple string to structured object
- [ ] **UI/UX Cascading Effects:** N/A (backend microservice)
- [ ] **State Management:** No impact (stateless error handling)
- [ ] **Routing Dependencies:** No impact

**Assessment:** Changes contained within error handling layer. No impact on workflow execution logic or business logic.

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** Error context stored as JSON (slightly larger storage, negligible impact)
- [ ] **Bundle Size:** N/A (backend microservice)
- [ ] **Server Load:** Error context capture adds <10ms overhead only during error conditions
- [ ] **Caching Strategy:** No impact

**Assessment:** Performance impact negligible - error handling only executes during failures, which are rare in production.

#### 4. **Security Considerations**
- [ ] **Attack Surface:** Reduced - debug mode prevents accidental exposure of stack traces in production
- [ ] **Data Exposure:** Reduced - sanitization functions prevent API key and PII leakage
- [ ] **Permission Escalation:** No impact
- [ ] **Input Validation:** Enhanced - better error messages help identify input validation failures

**Assessment:** Security posture improved. Sanitization and debug mode prevent sensitive data exposure.

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** No impact on successful workflow execution
- [ ] **Data Migration:** No migration required
- [ ] **Feature Deprecation:** No features deprecated
- [ ] **Learning Curve:** Developers benefit from enhanced error messages; no user-facing changes

**Assessment:** Developer experience dramatically improved. End users see no changes (microservice).

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Slightly increased (error context handling) but well-structured
- [ ] **Dependencies:** No new dependencies
- [ ] **Testing Overhead:** Moderate - need test cases for each error type
- [ ] **Documentation:** Enhanced documentation required for new error handling system

**Assessment:** Maintenance complexity increases slightly, but improved debugging capability offsets the cost.

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
None identified. This is a backward-compatible enhancement with no breaking changes.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Increased Complexity:** Error handling code becomes more verbose (worth the debugging benefits)
- [ ] **Testing Effort:** Need comprehensive error scenario tests (already planned in Phase 7)

### Mitigation Strategies

#### Error Handling Enhancement
- [ ] **Defensive Programming:** Error context building wrapped in try/except with fallback to simple errors
- [ ] **Graceful Degradation:** If structured error creation fails, fall back to plain string error message
- [ ] **Sanitization Safety:** Maintain blacklist of sensitive field names (key, token, secret, password)
- [ ] **Size Limits:** Truncate stack traces to 50 lines, limit input context to 1KB

#### Testing Strategy
- [ ] **Error Scenario Coverage:** Test all error types (timeout, auth, rate limit, network, config, user input)
- [ ] **Debug Mode Toggle:** Verify stack traces included/excluded based on DEBUG_MODE setting
- [ ] **Sensitive Data Sanitization:** Verify API keys and tokens removed from error logs
- [ ] **Webhook Payload Validation:** Ensure backward compatibility with existing webhook consumers

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** Filled out all sections of the impact assessment
- [x] **Identify Critical Issues:** No red flags identified
- [x] **Propose Mitigation:** Defensive error handling with graceful degradation
- [x] **Alert User:** No breaking changes; backward compatible enhancement
- [x] **Recommend Alternatives:** Strategic analysis provided (Option 1, 2, 3)

---

*Template Version: 1.3*
*Last Updated: 12/16/2025*
*Created By: AI Agent for LLM Service Error Handling Enhancement*
