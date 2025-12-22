# Webhook Signature Resolution Plan

## Current Status

### ✅ What's Working
1. Both services deployed successfully
2. Diagnostic endpoints show matching secrets:
   - Next.js: `sha256=dc0661c3caca01e68062d31492f07fc6343c4471b26abe5d8932b84f6b940452`
   - LLM Service: `sha256=dc0661c3caca01e68062d31492f07fc6343c4471b26abe5d8932b84f6b940452`
3. Both services use same secret preview: `xAZd/X36nt...6r0=`
4. Both services trim the secret

### ❌ What's Not Working
1. Real webhook signatures still fail
2. Celery worker diagnostic doesn't respond (task not registered or worker issue)
3. Webhook delivery logs not appearing in LLM service logs

### 🤔 Observations
1. **Diagnostic vs Reality Mismatch**: Diagnostics show matching secrets, but real webhooks fail
2. **Missing Logs**: Expected "Triggering webhook delivery" log not appearing
3. **Signature Mismatch**: Real webhooks generate completely different signatures than diagnostics

## Root Cause Hypothesis

**Most Likely**: The Celery worker process that sends webhooks loaded `LLM_WEBHOOK_SECRET` at a different time than the FastAPI app, and is using a different/old value.

**Evidence**:
- FastAPI diagnostic endpoint returns correct secret
- Celery worker diagnostic task doesn't respond
- Real webhooks fail with different signatures
- Both systems claim to use `xAZd/X36nt...` but generate different HMACs

## Resolution Steps

### Step 1: Force Complete Service Restart
**Goal**: Ensure ALL processes (FastAPI + Celery workers) reload environment variables

**Actions**:
1. Go to Render dashboard for `llm-service-api-6vrk`
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Wait for deployment to complete (~5-10 minutes)
4. Verify health: `curl https://llm-service-api-6vrk.onrender.com/health`

### Step 2: Verify Celery Worker Secret
**Goal**: Confirm worker is using correct secret after restart

**Actions**:
1. Test Celery diagnostic: `curl https://llm-service-api-6vrk.onrender.com/api/v1/debug/celery-secret`
2. Compare output to FastAPI diagnostic
3. Signatures must match EXACTLY

**Expected Success**:
```json
{
  "fastapi": {
    "configured": true,
    "secret_length": 44,
    "secret_preview": "xAZd/X36nt...6r0="
  },
  "celery_worker": {
    "configured": true,
    "secret_length": 44,
    "secret_hash": "<same-as-fastapi>",
    "test_signature": "sha256=dc0661c3..."
  },
  "match": true
}
```

### Step 3: Test Real Webhook
**Goal**: Verify webhook signatures work after restart

**Actions**:
1. Run test script: `bash scripts/test-webhook-post-deploy.sh`
2. Check Next.js logs for signature validation
3. Check LLM service logs for webhook delivery

**Expected Success**:
```
[LLM Webhook] Callback stored successfully: <job-id>
```

### Step 4: If Still Failing - Deep Investigation

**Check Render Environment Variables**:
1. Verify `LLM_WEBHOOK_SECRET` in Render dashboard
2. Ensure no hidden characters (copy-paste to text editor)
3. Compare byte-for-byte with local `.env.local`

**Check for Environment Variable Conflicts**:
1. Look for multiple env var definitions
2. Check if Render has service-level vs global env vars
3. Verify no `.env` file in deployed code overriding Render vars

**Last Resort - Hardcode Test**:
1. Temporarily hardcode the secret in both services
2. Deploy and test
3. If this works, it confirms env var loading issue
4. Revert hardcoded values and fix env var loading

## Alternative Hypothesis

If Celery worker shows CORRECT secret but webhooks still fail:

**Possibility**: The payload being signed is different due to:
- Unicode encoding issues
- Newline character differences (\n vs \r\n)
- JSON serialization edge cases
- HTTP body transformation by proxy/CDN

**Investigation**:
1. Log the EXACT `rawBody` bytes in Next.js
2. Log the EXACT `payload_json` bytes in Python
3. Compare hex dumps to find differences

## Success Criteria

✅ Celery worker diagnostic responds successfully
✅ Worker and FastAPI show matching test signatures
✅ Real webhook completes without signature error
✅ Next.js logs show `[LLM Webhook] Callback stored successfully`
✅ LLM service logs show `Webhook delivered successfully`

## Timeline

- **Step 1 (Restart)**: 10 minutes
- **Step 2 (Verify)**: 2 minutes
- **Step 3 (Test)**: 5 minutes
- **Total**: ~20 minutes to resolution (if hypothesis is correct)
