# LLM Microservice Testing Guide

**Status:** Phase 9 of 13 Complete (69%)
**Last Updated:** 2024-12-16

This guide shows you how to test all implemented functionality.

---

## Quick Start

### 1. Start All Services

```bash
cd LLM_service
docker-compose up
```

**Expected Output:**
```
✔ Container llm-redis   - Ready
✔ Container llm-worker  - celery@... ready
✔ Container llm-flower  - Visit me at http://0.0.0.0:5555
✔ Container llm-api     - Application startup complete
```

**Services Available:**
- 🌐 API: http://localhost:8000
- 📊 Flower (Monitoring): http://localhost:5555
- 🔴 Redis: localhost:6379

---

## Phase 1: Core Infrastructure Tests

### Health Check Endpoint

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "celery_workers": 2,
  "timestamp": "2024-12-16T..."
}
```

### Swagger API Documentation

Open in browser: http://localhost:8000/docs

You should see:
- Interactive API documentation
- 3 endpoints: `/health`, `/api/v1/workflow`, `/api/v1/status/{job_id}`

---

## Phase 2: LLM Provider Tests

### Unit Tests

```bash
cd LLM_service
source venv/bin/activate
pytest tests/test_cost_calculator.py -v
```

**Expected:** 15/15 tests passing

### Integration Test (Real OpenRouter API)

```bash
pytest tests/test_openrouter_integration.py -v
```

**Expected:**
- 4/4 tests passing
- Real API calls to OpenRouter
- Token counts and costs displayed
- ~$0.002-0.005 total cost

---

## Phase 3-4: Workflow Engine + Transformations Tests

### Unit Tests

```bash
# Workflow engine tests (137 tests)
pytest tests/test_workflow_schema.py tests/test_context.py tests/test_prompt_loader.py tests/test_llm_executor.py tests/test_workflow_engine.py -v

# Transformation tests (68 tests)
pytest tests/test_transformations.py -v
```

**Expected:** 205 total tests passing

### Integration Test (Real Workflow Execution)

```bash
pytest tests/test_emergency_contacts_v2_integration.py -v
```

**Expected:**
- Workflow executes all 7 steps
- Real OpenRouter API call
- ~$0.01-0.02 cost
- Emergency contacts JSON output

---

## Phase 5: External API Integration Tests

### Cache Manager Tests

```bash
pytest tests/test_cache_manager.py -v
```

**Expected:** 22/22 tests passing (cache key generation, LRU eviction)

### Rate Limiter Tests

```bash
pytest tests/test_rate_limiter.py -v
```

**Expected:** 15/15 tests passing (sliding window, per-user limits)

### External Services Integration Tests

```bash
pytest tests/test_external_services_integration.py -v
```

**Expected:**
- Real API calls to WeatherAPI and Google Places
- Caching working (second call from cache)
- ~$0.05-0.10 cost (Google Places API)

---

## Phase 6: Workflow API Tests

### API Endpoint Tests

```bash
pytest tests/test_api_endpoints.py -v
```

**Expected:** 10/10 tests passing

### Submit Workflow via API

```bash
# Submit workflow
curl -X POST http://localhost:8000/api/v1/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "emergency_contacts",
    "user_id": "test-user-123",
    "input_data": {
      "lat": 40.7128,
      "lng": -74.0060,
      "city": "New York"
    },
    "webhook_url": "http://localhost:5001/webhook",
    "webhook_secret": "test-secret"
  }'
```

**Expected Response:**
```json
{
  "job_id": "uuid",
  "celery_task_id": "uuid",
  "status": "queued",
  "estimated_wait_seconds": 5,
  "status_url": "/api/v1/status/{job_id}"
}
```

### Check Job Status

```bash
# Replace {job_id} with actual ID from above
curl http://localhost:8000/api/v1/status/{job_id}
```

**Expected Response:**
```json
{
  "job_id": "uuid",
  "status": "completed",
  "workflow_name": "emergency_contacts",
  "result": {
    "contacts": [...],
    "cost_data": {
      "total_tokens": 2000,
      "cost_usd": 0.018
    }
  }
}
```

---

## Phase 7: Webhook System Tests

### Start Webhook Test Server

In a new terminal:

```bash
cd LLM_service/tests/webhook_test_server
source ../../venv/bin/activate
python app.py
```

**Output:** Server running on http://localhost:5001

**Web UI:** Open http://localhost:5001/ in browser

You'll see:
- Real-time webhook log
- HMAC signature validation status
- JSON payload viewer
- Auto-refresh every 5 seconds

### Submit Workflow with Webhook

```bash
curl -X POST http://localhost:8000/api/v1/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "emergency_contacts",
    "user_id": "test-user-123",
    "input_data": {"lat": 40.7128, "lng": -74.0060},
    "webhook_url": "http://localhost:5001/webhook",
    "webhook_secret": "test-secret"
  }'
```

**Expected:**
1. Workflow queued immediately
2. After ~20-30 seconds, webhook received
3. Test server shows webhook in UI
4. HMAC signature validated ✓
5. Payload includes result data and cost

### Webhook Retry Test

```bash
# Stop the webhook test server (Ctrl+C)
# Submit workflow (it will fail to deliver)
curl -X POST http://localhost:8000/api/v1/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "emergency_contacts",
    "user_id": "test-user-123",
    "input_data": {"lat": 40.7128, "lng": -74.0060},
    "webhook_url": "http://localhost:5001/webhook",
    "webhook_secret": "test-secret"
  }'

# Check database for retry attempts
psql $DATABASE_URL -c "SELECT * FROM llm_webhook_attempts ORDER BY created_at DESC LIMIT 5;"
```

**Expected:**
- 3 delivery attempts (5s, 15s, 45s delays)
- Email notification sent to ADMIN_EMAIL (if configured)
- Job marked as `webhook_permanently_failed`

---

## Phase 9: CLI Tools Tests

### 1. Workflow Validator

```bash
cd LLM_service
source venv/bin/activate
python -m cli validate workflows/definitions/emergency_contacts.json
```

**Expected Output:**
```
Validation Summary
─────────────────
Info      12
Warnings   4
Errors     0

✓ Validation PASSED
```

**What it checks:**
- JSON structure ✓
- Pydantic schema ✓
- Unique step IDs ✓
- External services registered ✓
- Transform operations exist ✓
- Variable references valid ✓

### 2. Dry-Run Executor

```bash
python -m cli dry-run workflows/definitions/emergency_contacts.json
```

**Expected Output:**
- Beautiful execution tree showing all 7 steps
- Variable flow table
- Resource estimates (1 LLM call, 4 API calls, 2 transforms)
- Cost estimate (~$0.018 for ~2,000 tokens)
- Total duration ~5s

**Sample Output:**
```
🎯 Workflow Execution
├── 1. fetch_weather (external_api)
│   ├── 🌐 Service: weatherapi
│   └── ⚡ Operation: current
├── 2. fetch_hospitals (external_api)
...

Cost Estimates:
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━┳━━━━━━━━━━━┓
┃ Step              ┃ Tokens ┃ Cost      ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━╇━━━━━━━━━━━┩
│ generate_contacts │ 2,000  │  $0.0180  │
└───────────────────┴────────┴───────────┘
```

### 3. Interactive Workflow Editor

```bash
python -m cli edit
```

**Interactive Menu:**
```
━━━ Workflow Editor ━━━

Workflow: (empty)

? Select action:
  > Edit Metadata
    Add Step
    View Workflow
    Save Workflow
    Exit
```

**Try:**
1. Edit Metadata → Enter name, version, description
2. Add Step → Select LLM type
3. Configure with prompt template or inline
4. View Workflow → See JSON
5. Save Workflow → Save to file

**Edit Existing Workflow:**
```bash
python -m cli edit workflows/definitions/emergency_contacts.json
```

### 4. Mermaid Diagram Generator

```bash
python -m cli diagram workflows/definitions/emergency_contacts.json
```

**Expected:**
- LLM call to Claude Sonnet 3.5 (~$0.002)
- Mermaid flowchart code generated
- Diagram saved to `workflows/diagrams/emergency_contacts.mmd`
- Instructions to view at https://mermaid.live/

**Sample Output:**
```
Generated Mermaid Diagram:
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ flowchart TD                           ┃
┃     A[Start] --> B((fetch_weather))   ┃
┃     B --> C[/format_data\\]            ┃
┃     C --> D((generate_contacts))      ┃
┃     ...                               ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

✓ Diagram saved to workflows/diagrams/emergency_contacts.mmd

How to view:
1. Visit https://mermaid.live/
2. Paste the diagram code
```

### CLI Help

```bash
python -m cli --help
python -m cli validate --help
python -m cli dry-run --help
python -m cli edit --help
python -m cli diagram --help
```

---

## Database Inspection

### Check Created Tables

```bash
psql $DATABASE_URL -c "\dt llm*"
```

**Expected Tables:**
- `llm_workflow_jobs` (job tracking)
- `llm_webhook_attempts` (webhook delivery log)
- `llm_provider_usage` (LLM cost tracking)
- `external_api_cache` (API response cache)

### View Recent Jobs

```bash
psql $DATABASE_URL -c "SELECT id, workflow_name, status, created_at FROM llm_workflow_jobs ORDER BY created_at DESC LIMIT 5;"
```

### View Cache Hits

```bash
psql $DATABASE_URL -c "SELECT service, operation, hit_count, last_accessed_at FROM external_api_cache ORDER BY hit_count DESC LIMIT 10;"
```

---

## Monitoring Dashboards

### Celery Flower

Open: http://localhost:5555

**Features:**
- Live worker status
- Task history
- Task details (args, result, duration)
- Worker pool size
- Queue depth

**Try:**
- Tasks → See completed workflows
- Workers → See 2 workers active
- Monitor → Real-time graphs

### Webhook Test Server UI

Open: http://localhost:5001/

**Features:**
- Real-time webhook log (last 50)
- HMAC signature validation
- JSON payload viewer
- Auto-refresh every 5 seconds

---

## Performance Benchmarks

### Run All Tests

```bash
cd LLM_service
source venv/bin/activate
pytest tests/ -v --tb=short
```

**Expected Results:**
- Total: 242+ tests
- Duration: ~30-60 seconds
- Passing: 100%
- Coverage: Core components covered

### Load Test (Simple)

```bash
# Submit 10 workflows concurrently
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/v1/workflow \
    -H "Content-Type: application/json" \
    -d "{
      \"workflow_name\": \"emergency_contacts\",
      \"user_id\": \"load-test-$i\",
      \"input_data\": {\"lat\": 40.7128, \"lng\": -74.0060},
      \"webhook_url\": \"http://localhost:5001/webhook\"
    }" &
done
wait
```

**Expected:**
- All 10 jobs queued immediately (<1s)
- Celery processes them concurrently (2 workers)
- Completion time: ~60-90s for all 10
- Check Flower for task distribution

---

## Troubleshooting

### Docker Won't Start

```bash
# Check logs
docker-compose logs api

# Common issue: Missing env vars
# Solution: Check .env.local exists with all required keys

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Tests Failing

```bash
# Check virtual environment
source venv/bin/activate
which python  # Should be in venv/bin/python

# Reinstall dependencies
pip install -r requirements.txt

# Run single test for details
pytest tests/test_specific.py::test_name -v -s
```

### CLI Commands Not Working

```bash
# Ensure virtual environment active
source venv/bin/activate

# Check module can be imported
python -c "import cli; print('OK')"

# Run with python -m
python -m cli --help
```

### Webhook Not Received

```bash
# Check webhook test server is running
curl http://localhost:5001/

# Check webhook URL in job
curl http://localhost:8000/api/v1/status/{job_id} | jq .webhook_url

# Check webhook attempts in database
psql $DATABASE_URL -c "SELECT * FROM llm_webhook_attempts WHERE job_id = '{job_id}';"
```

---

## ⚠️ Important: Standalone vs Integrated Mode

### Current Configuration (Phases 1-9)

The microservice is in **STANDALONE MODE** for testing:

- **Migration 004 Applied**: Foreign key constraint on `user_id` **DROPPED**
- **Reason**: Allows testing without access to `profiles` table
- **Testing**: Submit workflows without `user_id` field (will be NULL)

```bash
# ✅ Works in standalone mode (no user_id required)
curl -X POST http://localhost:8000/api/v1/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "emergency_contacts",
    "input_data": {"lat": 40.7128, "lng": -74.0060}
  }'
```

### Phase 10 Integration (Future)

**⚠️ BEFORE integrating with main app:**

You MUST apply **Migration 005** to restore foreign key constraint:

```sql
-- migrations/005_restore_user_constraints.sql
ALTER TABLE llm_workflow_jobs
    ADD CONSTRAINT llm_workflow_jobs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

**After Migration 005:**
- ✅ Data integrity enforced
- ✅ Only valid user IDs accepted
- ✅ Cascading deletes when users removed

See `PHASE_9_COMPLETE.md` for complete migration details.

---

## What's NOT Yet Implemented

❌ **Phase 10:** Main app integration (TypeScript client, webhook handler)
❌ **Phase 11:** Mission generation workflow
❌ **Phase 12:** Testing & documentation (comprehensive)
❌ **Phase 13:** Production deployment

**Current State:**
- ✅ Microservice fully functional standalone
- ✅ Can submit workflows via API
- ✅ Webhooks working with test server
- ✅ CLI tools for development
- ❌ Main Next.js app not yet integrated

---

## Summary of Available Tests

| Category | Command | Expected Result |
|----------|---------|-----------------|
| **Health Check** | `curl http://localhost:8000/health` | All services healthy |
| **Unit Tests** | `pytest tests/ -v` | 242+ tests passing |
| **API Submit** | `curl POST /api/v1/workflow` | Job queued, ID returned |
| **API Status** | `curl GET /api/v1/status/{id}` | Job status with results |
| **CLI Validate** | `python -m cli validate ...` | Validation passed |
| **CLI Dry-Run** | `python -m cli dry-run ...` | Execution preview |
| **CLI Editor** | `python -m cli edit` | Interactive workflow creation |
| **CLI Diagram** | `python -m cli diagram ...` | Mermaid diagram generated |
| **Webhook Test** | Start test server, submit workflow | Webhook received & validated |
| **Flower** | Open http://localhost:5555 | Worker dashboard |
| **Database** | `psql $DATABASE_URL -c "..."` | Tables and data visible |

---

## Next Steps

---

## Phase 9 Enhancement: Comprehensive Error Handling System

**Status:** Complete ✓
**Implementation Date:** 2025-12-16

### Overview

The LLM microservice now includes a comprehensive error handling system that provides structured error context, debugging information, and actionable suggestions for all workflow failures.

### Key Features

1. **Structured Error Context:** Every error includes type, category, service, operation, inputs, and suggestions
2. **Error Classification:** Automatic categorization (USER_ERROR, CONFIG_ERROR, SYSTEM_ERROR, EXTERNAL_ERROR)
3. **Debug Mode Support:** Toggle stack traces on/off via `DEBUG_MODE` configuration
4. **Retry Intelligence:** Errors marked as retryable/non-retryable with retry-after timing
5. **Sensitive Data Protection:** API keys and tokens automatically sanitized from error logs
6. **Enhanced Webhooks:** Webhook payloads include full error context for debugging

### Configuration

Enable debug mode in development (includes stack traces):

```ini
# settings.ini
DEBUG_MODE=true
```

Disable in production (excludes stack traces):

```ini
# settings.ini
DEBUG_MODE=false
```

### Testing Error Scenarios

#### 1. Missing API Key (Configuration Error)

```bash
# Remove Google Places API key temporarily
unset NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY

# Trigger workflow that uses Google Places
curl -X POST http://localhost:8000/api/v1/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "emergency_contacts",
    "input_data": {"location": "Seattle, WA"},
    "webhook_url": "https://webhook.site/your-unique-id"
  }'
```

**Expected Webhook Payload:**
```json
{
  "event": "workflow.failed",
  "error_message": "Missing required field: service",
  "error": {
    "type": "ConfigurationError",
    "category": "CONFIG_ERROR",
    "step_id": "fetch_places",
    "retryable": false,
    "details": {
      "suggestions": [
        "Verify GOOGLE_PLACES_API_KEY is set in environment variables",
        "Check API key permissions and quota limits"
      ]
    }
  }
}
```

#### 2. Rate Limit Error (External Error)

```bash
# Trigger multiple rapid requests to hit rate limit
for i in {1..15}; do
  curl -X POST http://localhost:8000/api/v1/workflow \
    -H "Content-Type: application/json" \
    -d '{"workflow_name": "emergency_contacts", "input_data": {"location": "NYC"}}'
done
```

**Expected Webhook Payload:**
```json
{
  "event": "workflow.failed",
  "error_message": "Rate limit exceeded",
  "error": {
    "type": "RateLimitExceeded",
    "category": "EXTERNAL_ERROR",
    "retryable": true,
    "details": {
      "retry_after": 60,
      "suggestions": [
        "Wait 60 seconds before retrying",
        "Consider implementing request throttling"
      ]
    }
  }
}
```

#### 3. Invalid User Input (User Error)

```bash
# Send invalid coordinates
curl -X POST http://localhost:8000/api/v1/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "emergency_contacts",
    "input_data": {"location": "invalid-coordinates"}
  }'
```

**Expected Error Category:** `USER_ERROR` with validation suggestions

### Verifying Error Context

Check the database for structured error storage:

```bash
# Connect to PostgreSQL
PGPASSWORD=Y53KI3KyAXVE1WfQ psql -h localhost -U postgres -d llm_workflow

# Query failed jobs with error context
SELECT
  id,
  workflow_name,
  status,
  error_message::json->>'type' as error_type,
  error_message::json->>'category' as error_category,
  error_message::json->'details'->>'retryable' as retryable
FROM workflow_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;
```

### Debug Mode Testing

#### Enable Debug Mode

```bash
# In settings.ini
DEBUG_MODE=true

# Restart services
docker-compose restart
```

#### Verify Stack Traces Included

```bash
# Trigger an error
curl -X POST http://localhost:8000/api/v1/workflow \
  -H "Content-Type: application/json" \
  -d '{"workflow_name": "invalid_workflow", "input_data": {}}'

# Check webhook - should include stack_trace field
```

#### Disable Debug Mode (Production)

```bash
# In settings.ini
DEBUG_MODE=false

# Restart services
docker-compose restart

# Verify stack traces excluded from webhooks
```

### Error Context Fields

All error responses include:

- **type:** Exception class name (e.g., "ExternalAPIError")
- **category:** Error classification (USER_ERROR, CONFIG_ERROR, SYSTEM_ERROR, EXTERNAL_ERROR)
- **message:** Human-readable error description
- **step_id:** Workflow step that failed
- **timestamp:** ISO 8601 timestamp of error occurrence
- **retryable:** Boolean indicating if retry is recommended
- **details:**
  - **service:** External service name (if applicable)
  - **operation:** API operation that failed
  - **inputs:** Request parameters (sanitized)
  - **config:** Step configuration (sanitized)
  - **retry_after:** Seconds to wait before retry (if applicable)
  - **suggestions:** Actionable debugging recommendations
  - **stack_trace:** Full stack trace (only in DEBUG_MODE)

### Monitoring Error Trends

Use Flower to monitor error patterns:

```bash
# Open Flower dashboard
open http://localhost:5555

# View failed tasks
# Click on "Tasks" → Filter by "Failed"
# Examine error details in task result
```

---

To continue development:

1. **Test everything above** to verify all phases 1-9 work
2. **Start Phase 10** when ready (main app integration)
3. **Report any issues** found during testing

**Ready to test?** Start with:
```bash
docker-compose up
curl http://localhost:8000/health
python -m cli validate workflows/definitions/emergency_contacts.json
```

🎉 **Happy Testing!**
