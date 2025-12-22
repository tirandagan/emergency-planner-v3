# Webhook Signature Debug Guide

## Problem
Webhook signatures from LLM service don't match verification on Next.js side.

## Diagnostic Endpoints

### Next.js (beprepared.ai)
```bash
curl https://beprepared.ai/api/debug/check-webhook-secret
```

**Expected Response:**
```json
{
  "configured": true,
  "secretLength": 44,
  "secretHash": "34b8a3bc40733831a1599d51c0c26f927bc1234b5f10f1fca1f8fbb1c9c4efd1",
  "secretPreview": "xAZd/X36nt...6r0=",
  "hasTrimmedDifference": false,
  "testPayload": "{\"test\":\"data\"}",
  "testSignature": "sha256=dc0661c3caca01e68062d31492f07fc6343c4471b26abe5d8932b84f6b940452"
}
```

### LLM Service (llm-service-api.onrender.com)
```bash
curl https://llm-service-api.onrender.com/api/v1/debug/webhook-config
```

**Expected Response:** (Should match Next.js values exactly)
```json
{
  "configured": true,
  "secret_length": 44,
  "secret_hash": "34b8a3bc40733831a1599d51c0c26f927bc1234b5f10f1fca1f8fbb1c9c4efd1",
  "secret_preview": "xAZd/X36nt...6r0=",
  "has_trimmed_difference": false,
  "test_payload": "{\"test\":\"data\"}",
  "test_signature": "sha256=dc0661c3caca01e68062d31492f07fc6343c4471b26abe5d8932b84f6b940452"
}
```

## What to Check

### 1. Both Services Configured
- Both should return `"configured": true`
- If either returns `false`, that service doesn't have `LLM_WEBHOOK_SECRET` set

### 2. Secret Length Matches
- Both should show `secretLength` / `secret_length` = 44
- Different lengths = different secrets

### 3. Secret Hash Matches (CRITICAL)
- Compare `secretHash` / `secret_hash` values
- **Must be identical** - if different, secrets don't match

### 4. Test Signature Matches (CRITICAL)
- Compare `testSignature` / `test_signature` values
- **Must be identical**: `sha256=dc0661c3caca01e68062d31492f07fc6343c4471b26abe5d8932b84f6b940452`
- If different, the services will never agree on webhook signatures

## Resolution Steps

### If Signatures Don't Match:

1. **Verify Environment Variables in Render Dashboard**
   - Go to each service's Environment settings
   - Confirm `LLM_WEBHOOK_SECRET` is **exactly** the same (no extra spaces/newlines)
   - Current value: `xAZd/X36nt1+U813leiiboWFgbm7+CsWxQYl8RON6r0=`

2. **Manual Redeploy (Both Services)**
   - Click "Manual Deploy" → "Deploy latest commit" in Render
   - Wait for both deployments to complete
   - Services only pick up new env vars on deployment

3. **Retest Diagnostic Endpoints**
   - Run both curl commands again
   - Verify `secret_hash` and `test_signature` now match

4. **Test Real Webhook**
   - Trigger a test webhook from LLM service
   - Check Next.js logs for signature verification
   - Should see `[LLM Webhook] Callback stored successfully`

## Local Testing Scripts

### Verify Local Configuration
```bash
node scripts/verify-webhook-config.js
```

### Dump Secret as Hex (for character-by-character comparison)
```bash
node scripts/dump-secret-hex.js
```

### Test Signature Generation
```bash
node scripts/test-webhook-signature.js
```

## Expected Log Messages (After Fix)

### Successful Webhook (Next.js logs)
```
[LLM Webhook] Body length: 75932, Signature: sha256=...
[LLM Webhook] Callback stored successfully: job-id-123
```

### Failed Webhook (Current State - Before Fix)
```
[LLM Webhook] Invalid signature verification failed
[LLM Webhook] Expected signature: sha256=...
[LLM Webhook] Received signature: sha256=...
```

## Technical Details

### How Signatures Work

1. **LLM Service** (Python):
   ```python
   signature = hmac.new(
       secret.encode('utf-8'),
       payload.encode('utf-8'),
       hashlib.sha256
   ).hexdigest()
   ```

2. **Next.js** (TypeScript):
   ```typescript
   const signature = createHmac('sha256', secret)
     .update(rawBody)
     .digest('hex');
   ```

3. **Comparison**: Uses `timingSafeEqual` for constant-time comparison (prevents timing attacks)

### Why Signatures Might Mismatch

- ❌ Different secrets (most common)
- ❌ Whitespace in secret (trailing newline, spaces)
- ❌ Base64 encoding issues
- ❌ Stale deployments (env var changed but service not redeployed)
- ❌ JSON serialization differences (Python uses compact format)

### Why Our Implementation Works

- ✅ Both use HMAC-SHA256
- ✅ Both use UTF-8 encoding
- ✅ Next.js verifies against **raw body** (exact bytes received)
- ✅ Python sends **exact payload** it signs
- ✅ No re-serialization between signing and verification
