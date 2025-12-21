# LLM Service Webhook Security Analysis

**Date:** 2025-12-20
**Purpose:** Security analysis of LLM service callback mechanism and recommendations for secure webhook implementation

---

## 🔍 Current LLM Service Webhook Implementation

### Existing Security Features ✅

**The LLM service ALREADY implements strong security:**

1. **HMAC Signature Verification** (`webhook_sender.py`, lines 47-63)
   - Uses SHA-256 HMAC signatures
   - Format: `sha256=<hex_digest>`
   - Header: `X-Webhook-Signature`
   - Constant-time comparison to prevent timing attacks

2. **Signature Generation Process:**
   ```python
   # Serialize payload with compact JSON (no spaces)
   payload_json = json.dumps(payload, separators=(',', ':'))

   # Generate HMAC signature
   signature = hmac.new(
       secret.encode('utf-8'),
       payload_json.encode('utf-8'),
       hashlib.sha256
   ).hexdigest()

   # Send as header: "sha256=<hex_digest>"
   headers["X-Webhook-Signature"] = f"sha256={signature}"
   ```

3. **Verification Function Provided** (`webhook_sender.py`, lines 163-193)
   - `verify_webhook_signature(payload, signature, secret)` function available
   - Uses constant-time comparison (`hmac.compare_digest`)
   - Prevents timing attacks

### Webhook Payload Structure

The LLM service sends **three types of webhook events:**

#### 1. **Workflow Completed** (`workflow.completed`)
```json
{
  "event": "workflow.completed",
  "job_id": "uuid-string",
  "status": "completed",
  "workflow_name": "emergency_contacts",
  "result": { ... actual result data ... },
  "cost_data": {
    "total_tokens": 1234,
    "cost_usd": 0.05,
    "llm_calls": [...]
  },
  "duration_ms": 5000,
  "timestamp": "2025-12-20T10:30:00Z"
}
```

#### 2. **Workflow Failed** (`workflow.failed`)
```json
{
  "event": "workflow.failed",
  "job_id": "uuid-string",
  "status": "failed",
  "workflow_name": "emergency_contacts",
  "error_message": "Error description",
  "error": {
    "type": "ValidationError",
    "category": "input_validation",
    "retryable": false,
    "message": "Detailed error message"
  },
  "duration_ms": 2000,
  "created_at": "2025-12-20T10:28:00Z",
  "timestamp": "2025-12-20T10:30:00Z"
}
```

#### 3. **LLM Step Completed** (`llm.step.completed`) - Debug Mode Only
```json
{
  "event": "llm.step.completed",
  "job_id": "uuid-string",
  "workflow_name": "emergency_contacts",
  "step_id": "step_1",
  "result": { ... step result ... },
  "tokens": { "prompt": 100, "completion": 200 },
  "cost_usd": 0.01,
  "duration_ms": 1500,
  "timestamp": "2025-12-20T10:29:30Z",
  "debug": {
    "prompt": "...",
    "model": "anthropic/claude-3.5-sonnet",
    "temperature": 0.7
  }
}
```

### Headers Sent by LLM Service

```
Content-Type: application/json
X-Webhook-Signature: sha256=<hex_digest>
X-Webhook-Event: workflow.completed|workflow.failed|llm.step.completed
User-Agent: LLM Service API/1.0
```

---

## 🔐 Security Implementation Plan

### Frontend Webhook Endpoint Requirements

**File:** `src/app/api/webhooks/llm-callback/route.ts`

#### 1. **Signature Verification (MANDATORY)**
```typescript
import { createHmac } from 'crypto';

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expectedDigest = signature.substring(7); // Remove 'sha256=' prefix

  const actualDigest = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(
    Buffer.from(expectedDigest),
    Buffer.from(actualDigest)
  );
}
```

#### 2. **Environment Variable Required**
```bash
# .env.local
LLM_WEBHOOK_SECRET=<same-secret-as-LLM-service>
```

**CRITICAL:** This must match the `LLM_WEBHOOK_SECRET` in the LLM service's `.env.local` file.

#### 3. **Webhook Handler Pattern**
```typescript
export async function POST(request: Request): Promise<NextResponse> {
  // 1. Read raw body (needed for signature verification)
  const rawBody = await request.text();

  // 2. Get signature header
  const signature = request.headers.get('x-webhook-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature header' },
      { status: 401 }
    );
  }

  // 3. Verify signature
  const isValid = verifyWebhookSignature(
    rawBody,
    signature,
    process.env.LLM_WEBHOOK_SECRET!
  );

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // 4. Parse JSON (only after verification)
  const payload = JSON.parse(rawBody);

  // 5. Extract fields and store to database
  const callbackId = payload.job_id;
  const status = payload.status; // 'completed' or 'failed'
  const eventType = payload.event;

  // 6. Store to llm_callbacks table
  await createLLMCallback({
    callbackId,
    webhookSignature: signature,
    payload,
    status: mapStatusToOurEnum(status),
    errorMessage: payload.error_message || null,
    viewedBy: [],
  });

  // 7. Return success
  return NextResponse.json({ received: true }, { status: 200 });
}
```

---

## 🛡️ Security Recommendations

### ✅ RECOMMENDED: Implement Full Security

**Pros:**
- ✅ Prevents unauthorized webhook calls (attack protection)
- ✅ Verifies payload integrity (no tampering)
- ✅ Industry-standard approach (HMAC-SHA256)
- ✅ Already built into LLM service (no service changes needed)

**Cons:**
- ❌ Requires environment variable configuration
- ❌ Slightly more complex implementation

### ❌ NOT RECOMMENDED: Skip Signature Verification

**DO NOT** skip signature verification because:
- 🚨 Anyone could POST fake callbacks to your webhook
- 🚨 Attackers could trigger spam notifications to admins
- 🚨 Malicious payloads could cause database bloat
- 🚨 No way to verify data came from legitimate LLM service

---

## 📋 Implementation Checklist

### No LLM Service Changes Needed ✅
- [x] LLM service already implements HMAC signatures
- [x] Signature is sent in `X-Webhook-Signature` header
- [x] Verification function exists (`verify_webhook_signature`)
- [x] Payload structure is well-defined

### Frontend Implementation Required
- [ ] Add `LLM_WEBHOOK_SECRET` to `.env.local`
- [ ] Implement `verifyWebhookSignature()` function in webhook route
- [ ] Verify signature BEFORE parsing JSON payload
- [ ] Return 401 Unauthorized if signature invalid
- [ ] Store signature in `webhook_signature` column for audit trail
- [ ] Handle all three event types: `workflow.completed`, `workflow.failed`, `llm.step.completed`
- [ ] Map `job_id` to `callbackId` in database
- [ ] Map `status` to enum: `'completed' | 'failed'` → `'received' | 'processed' | 'error'`

### Testing
- [ ] Update `test_llm_service.bash` with correct webhook URL
- [ ] Verify signature validation works with real LLM service callbacks
- [ ] Test signature rejection for tampered payloads
- [ ] Test handling of all three event types

---

## 🔑 Secret Management

### Current Secret (from LLM service config):
```python
LLM_WEBHOOK_SECRET: str = "default-webhook-secret-change-in-production"
```

### For Development:
Use the same default secret in both services:
```bash
# LLM_service/.env.local
LLM_WEBHOOK_SECRET=default-webhook-secret-change-in-production

# frontend/.env.local (emergency-planner-v2)
LLM_WEBHOOK_SECRET=default-webhook-secret-change-in-production
```

### For Production:
Generate a strong random secret:
```bash
# Generate secure secret (64 characters, hex)
openssl rand -hex 32

# Set in both services' production environment variables
LLM_WEBHOOK_SECRET=<generated-secret>
```

---

## 📊 Security Comparison

| Approach | Security Level | Implementation Complexity | Recommendation |
|----------|----------------|---------------------------|----------------|
| **HMAC Signature Verification** | ⭐⭐⭐⭐⭐ High | Medium | ✅ **RECOMMENDED** |
| **IP Whitelist Only** | ⭐⭐⭐ Medium | Low | ⚠️ Not sufficient alone |
| **No Verification** | ⭐ Very Low | Very Low | ❌ **DO NOT USE** |

---

## 🎯 Final Recommendation

**IMPLEMENT FULL HMAC SIGNATURE VERIFICATION**

This provides:
- ✅ Strong security against unauthorized access
- ✅ Payload integrity verification
- ✅ No changes needed to LLM service
- ✅ Industry-standard approach
- ✅ Audit trail (signature stored in database)

**Next Steps:**
1. Add `LLM_WEBHOOK_SECRET` to frontend `.env.local`
2. Implement signature verification in webhook endpoint
3. Test with real callbacks from LLM service
4. Store all webhook attempts for debugging

---

*Generated: 2025-12-20*
*For: Task #065 - LLM Callback Webhook Implementation*
