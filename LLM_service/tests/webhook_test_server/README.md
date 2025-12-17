# Webhook Test Server - Phase 7 Testing Tool

⚠️ **THIS IS A TESTING TOOL ONLY - NOT PART OF PRODUCTION SERVICE**

Simple Flask application for testing webhook delivery from the LLM microservice during Phase 7 development.

## Features

- ✅ Receives webhooks on `POST /webhook`
- ✅ Validates HMAC SHA-256 signatures
- ✅ Stores last 50 webhooks in memory
- ✅ Web UI with Bootstrap for viewing webhook history
- ✅ Auto-refresh every 5 seconds
- ✅ Color-coded valid/invalid signatures
- ✅ JSON payload formatting and syntax highlighting

## Quick Start

### 1. Install Dependencies

```bash
pip install flask
```

### 2. Start Test Server

```bash
# From LLM_service directory
python tests/webhook_test_server/app.py
```

Server starts on `http://localhost:5001/`

### 3. View Webhooks

Open browser: `http://localhost:5001/`

### 4. Configure LLM Microservice

When testing with LLM microservice, submit workflow with:

```json
{
  "workflow_name": "emergency_contacts",
  "user_id": "test-user-123",
  "input_data": {...},
  "webhook_url": "http://localhost:5001/webhook",
  "webhook_secret": "default-webhook-secret-change-in-production"
}
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Web UI showing webhook history |
| POST | `/webhook` | Webhook receiver endpoint |
| POST | `/clear` | Clear webhook history |

## Webhook Signature Verification

The test server validates HMAC SHA-256 signatures using the secret:

```
default-webhook-secret-change-in-production
```

### Signature Format

Header: `X-Webhook-Signature: sha256=<hex_digest>`

### Verification Algorithm

```python
signature = hmac.new(
    secret.encode('utf-8'),
    payload.encode('utf-8'),
    hashlib.sha256
).hexdigest()
```

## Example Webhook Events

### Workflow Completed

```json
{
  "event": "workflow.completed",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "workflow_name": "emergency_contacts",
  "result": {...},
  "cost_data": {
    "total_tokens": 8000,
    "cost_usd": 0.24
  },
  "duration_ms": 23000,
  "timestamp": "2024-12-16T10:00:25Z"
}
```

### Workflow Failed

```json
{
  "event": "workflow.failed",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "failed",
  "workflow_name": "emergency_contacts",
  "error_message": "Step 'generate_contacts' failed...",
  "timestamp": "2024-12-16T10:00:20Z"
}
```

### LLM Step Completed (debug_mode=true)

```json
{
  "event": "llm.step.completed",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "workflow_name": "emergency_contacts",
  "step_id": "generate_contacts",
  "debug": {
    "prompt": "Full prompt sent to LLM...",
    "model": "anthropic/claude-3.5-sonnet",
    "temperature": 0.7
  },
  "result": "LLM response...",
  "tokens": {"input": 1000, "output": 500},
  "cost_usd": 0.012,
  "duration_ms": 1500,
  "timestamp": "2024-12-16T10:00:15Z"
}
```

## Console Output

The server prints webhook details to console:

```
================================================================================
📥 Webhook Received: workflow.completed
   Timestamp: 2024-12-16T10:00:25Z
   Signature Valid: ✅ YES
   Job ID: 123e4567-e89b-12d3-a456-426614174000
   Status: completed
================================================================================
```

## Web UI Features

- **Stats Dashboard**: Total webhooks, valid/invalid signature counts
- **Webhook Cards**: Color-coded by signature validity (green=valid, red=invalid)
- **JSON Formatting**: Pretty-printed payload and headers
- **Auto-Refresh**: Page reloads every 5 seconds
- **Clear History**: Button to reset webhook storage

## Testing Checklist

Phase 7 webhook testing:

- [ ] Workflow completes successfully → webhook delivered
- [ ] Workflow fails → failure webhook delivered
- [ ] Signature validation passes (green badge)
- [ ] Invalid signature detected (red badge)
- [ ] Retry logic works (3 attempts with delays: 5s, 15s, 45s)
- [ ] Admin email sent after permanent failure
- [ ] Webhook attempts tracked in `llm_webhook_attempts` table
- [ ] `webhook_permanently_failed` flag set after retries exhausted

## Troubleshooting

**Webhook not received:**
- Check LLM microservice logs for delivery attempts
- Verify `webhook_url` is `http://localhost:5001/webhook`
- Ensure test server is running on port 5001

**Invalid signature:**
- Verify `webhook_secret` matches in both services
- Check payload is sent as JSON (not form-encoded)
- Ensure signature format is `sha256=<hex_digest>`

**Port conflict:**
- Change port in `app.py`: `app.run(port=5002)`
- Update `webhook_url` in workflow submission

## Cleanup

To stop the test server:
```bash
Ctrl+C
```

No persistent data - all webhooks stored in memory only.
