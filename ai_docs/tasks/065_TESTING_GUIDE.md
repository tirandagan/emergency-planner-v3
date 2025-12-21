# LLM Webhook Callback System - Testing Guide

**Task:** #065 - LLM Webhook Callback Monitoring System
**Date:** 2025-12-20
**Status:** Ready for Testing

---

## 📋 Table of Contents

1. [Environment Setup](#environment-setup)
2. [Starting an LLM Job](#starting-an-llm-job)
3. [Monitoring Webhook Callbacks](#monitoring-webhook-callbacks)
4. [Testing the UI Components](#testing-the-ui-components)
5. [Backend Debugging (LLM Service)](#backend-debugging-llm-service)
6. [Troubleshooting Common Issues](#troubleshooting-common-issues)
7. [Security Testing](#security-testing)

---

## 1. Environment Setup

### **Step 1.1: Add Webhook Secret**

Add the webhook secret to your `.env.local` file:

```bash
# Add this line to .env.local
LLM_WEBHOOK_SECRET=your-webhook-secret-here
```

**Important:** This secret **must match** the secret configured in the LLM service. If they don't match, signature verification will fail and callbacks will be marked as invalid.

### **Step 1.2: Verify Database Schema**

Ensure the database migrations have been applied:

```bash
npm run db:migrate
```

Expected output: "No new migrations to apply" or successful migration of `0031_add_llm_callbacks_tables.sql`

### **Step 1.3: Verify Admin Role**

Check that your user account has admin role in the database:

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Check your role
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';

# If role is not 'ADMIN', update it:
UPDATE profiles SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### **Step 1.4: Start Development Server**

```bash
npm run dev
```

Server should start on `http://localhost:3000`

---

## 2. Starting an LLM Job

### **Method 1: Via Test Script (Recommended)**

The LLM service includes a test script at `LLM_service/test_llm_service.bash`:

```bash
# Navigate to LLM service directory
cd LLM_service

# Make the script executable (if needed)
chmod +x test_llm_service.bash

# Run the test script
./test_llm_service.bash
```

**What this script does:**
1. Checks LLM service health
2. Submits a test workflow job
3. Monitors job status until completion
4. **Sends webhook callback** to `http://localhost:3000/api/webhooks/llm-callback`

**Expected Output:**
```
=== Testing LLM Workflow Service ===

Step 1: Checking service health...
✓ Service is healthy

Step 2: Submitting test workflow...
✓ Job submitted successfully
  Job ID: abc123-def456-ghi789

Step 3: Monitoring job status...
⏳ Job status: queued
⏳ Job status: processing (Step 1/3)
⏳ Job status: processing (Step 2/3)
⏳ Job status: processing (Step 3/3)
✅ Job completed successfully!

Step 4: Sending webhook callback...
✓ Webhook delivered to http://localhost:3000/api/webhooks/llm-callback
```

### **Method 2: Manual Job Submission**

Use curl to submit a job directly:

```bash
# Submit a test job
curl -X POST http://localhost:5001/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "test_workflow",
    "priority": 5,
    "user_id": "test-user-123",
    "parameters": {
      "test_param": "test_value"
    }
  }'
```

**Expected Response:**
```json
{
  "job_id": "abc123-def456-ghi789",
  "status": "queued",
  "message": "Job queued successfully"
}
```

### **Method 3: Via Application UI**

If your application has LLM-powered features (e.g., mission plan generation):

1. Navigate to the feature in your browser
2. Fill out the form and submit
3. The application will create an LLM job
4. Monitor the job via Admin Debug page

---

## 3. Monitoring Webhook Callbacks

### **Step 3.1: Watch for Toast Notifications**

Once logged in as admin, you should see toast notifications appear automatically:

1. **Open any admin page** (e.g., `/admin/debug`)
2. **Wait 10 seconds** after job completion
3. **Toast notification appears** in the bottom-right corner:
   - Title: "New LLM Callback Received"
   - Message: Workflow name and event type
   - Action: "View Details" button

**Screenshot of Expected Toast:**
```
┌─────────────────────────────────────┐
│ ✅ New LLM Callback Received        │
│                                     │
│ test_workflow - workflow.completed  │
│ {"job_id":"abc123",...}             │
│                                     │
│              [View Details]  [×]    │
└─────────────────────────────────────┘
```

### **Step 3.2: View Callback Details**

Click **"View Details"** on the toast notification:

1. **Modal window opens** with callback details
2. **Title bar color**:
   - ✅ **Green**: Valid signature
   - ❌ **Red**: Invalid signature (security alert!)
3. **Metadata displayed**:
   - Callback ID
   - Event Type
   - Workflow Name
   - External Job ID
   - Received timestamp
   - Verified timestamp
4. **Signature section**:
   - Shield icon (green or red)
   - Signature header (HMAC-SHA256)
   - Copy button
5. **Payload section**:
   - JSON viewer with syntax highlighting
   - Expandable/collapsible nodes
   - Copy button

**Test the Modal:**
- ✅ Drag the window around
- ✅ Resize from any corner/edge
- ✅ Minimize/Maximize buttons work
- ✅ Copy buttons copy to clipboard
- ✅ Close button closes modal
- ✅ Dark mode toggle works

### **Step 3.3: View Callback History**

Navigate to **Admin Debug → Callbacks Tab**:

1. Go to `/admin/debug`
2. Click the **"Callbacks"** tab (Shield icon)
3. **Table displays all callbacks**:
   - Status icon (Shield or ShieldAlert)
   - Callback ID (monospace)
   - Event Type badge
   - Workflow Name
   - Payload preview (truncated)
   - Received timestamp
   - "View" button

**Test the History Tab:**
- ✅ Select different page sizes (10/25/50/100)
- ✅ Click "Refresh" button
- ✅ Click "View" on any row to open modal
- ✅ Verify highlighted row if coming from URL parameter

---

## 4. Testing the UI Components

### **Test Checklist**

#### **Notification Poller**
- [ ] Polls every 10 seconds when admin page is active
- [ ] Shows toast for new callbacks within 10 seconds
- [ ] Does NOT show duplicate toasts for same callback
- [ ] Stores cursor in localStorage (`llm_callback_last_checked`)
- [ ] Stops polling on 401/403 errors

#### **Callback Detail Modal**
- [ ] Opens when clicking "View Details" on toast
- [ ] Opens when clicking "View" in history table
- [ ] Displays correct callback data
- [ ] Shows green title bar for valid signatures
- [ ] Shows red title bar for invalid signatures
- [ ] Copy buttons work for both payload and signature
- [ ] Window is draggable and resizable
- [ ] Minimize/maximize buttons work
- [ ] Close button closes modal
- [ ] Dark mode styling works correctly
- [ ] JSON viewer expands/collapses properly

#### **Callback History Tab**
- [ ] Table loads callbacks on page load
- [ ] Refresh button reloads data
- [ ] Page size selector works (10/25/50/100)
- [ ] Empty state shows when no callbacks
- [ ] Error state shows on API failure
- [ ] Clicking "View" opens modal with correct callback
- [ ] Highlighted row works with URL parameter
- [ ] Status icons show correctly (green shield vs red alert)
- [ ] Timestamps format correctly

---

## 5. Backend Debugging (LLM Service)

### **Step 5.1: Check LLM Service Health**

```bash
# Health check endpoint
curl http://localhost:5001/health

# Expected response
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "celery": { "status": "healthy", "workers": 1 }
  }
}
```

### **Step 5.2: Check Job Status**

```bash
# Get job status
curl http://localhost:5001/api/v1/jobs/{job_id}

# Expected response
{
  "job_id": "abc123-def456-ghi789",
  "status": "completed",  # or "processing", "failed", etc.
  "workflow_name": "test_workflow",
  "created_at": "2025-12-20T19:00:00Z",
  "completed_at": "2025-12-20T19:01:30Z",
  "result": { ... }
}
```

### **Step 5.3: Check Webhook Configuration**

The LLM service should be configured to send webhooks to your local Next.js server:

```python
# In LLM service config (config.py or .env)
WEBHOOK_URL = "http://localhost:3000/api/webhooks/llm-callback"
WEBHOOK_SECRET = "your-webhook-secret-here"  # Must match .env.local
```

### **Step 5.4: Monitor LLM Service Logs**

```bash
# If running with Docker
docker logs -f llm-service --tail=100

# If running directly
tail -f logs/llm_service.log

# Look for webhook-related logs:
# ✅ "Sending webhook to http://localhost:3000/api/webhooks/llm-callback"
# ✅ "Webhook delivered successfully (200 OK)"
# ❌ "Webhook delivery failed: Connection refused"
```

### **Step 5.5: Test Webhook Manually**

Send a test webhook to verify signature verification:

```bash
# Calculate HMAC-SHA256 signature
PAYLOAD='{"job_id":"test123","workflow_name":"test","event_type":"workflow.completed","status":"completed"}'
SECRET="your-webhook-secret-here"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Send webhook with signature
curl -X POST http://localhost:3000/api/webhooks/llm-callback \
  -H "Content-Type: application/json" \
  -H "X-LLM-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"

# Expected response (200 OK)
{"success":true}
```

### **Step 5.6: Check Database for Stored Callbacks**

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# View recent callbacks
SELECT
  callback_id,
  signature_valid,
  event_type,
  workflow_name,
  created_at
FROM llm_callbacks
ORDER BY created_at DESC
LIMIT 10;

# Check for invalid signatures (security monitoring)
SELECT COUNT(*) as invalid_count
FROM llm_callbacks
WHERE signature_valid = false;
```

---

## 6. Troubleshooting Common Issues

### **Issue: Toast notifications don't appear**

**Possible Causes:**
1. Not logged in as admin
2. Webhook not configured in LLM service
3. JavaScript errors in browser console

**Debug Steps:**
```bash
# 1. Check browser console for errors
# Open DevTools → Console tab

# 2. Verify admin role
SELECT role FROM profiles WHERE email = 'your-email@example.com';

# 3. Check polling API endpoint manually
curl http://localhost:3000/api/admin/llm-callbacks/check \
  -H "Cookie: your-session-cookie-here"
```

### **Issue: "Invalid signature" callbacks**

**Possible Causes:**
1. Webhook secret mismatch between LLM service and Next.js
2. Payload was modified in transit
3. LLM service not sending signature header

**Debug Steps:**
```bash
# 1. Verify secrets match
# LLM service
echo $WEBHOOK_SECRET  # or check config.py

# Next.js
grep LLM_WEBHOOK_SECRET .env.local

# 2. Check webhook logs in LLM service
# Look for "Signature: sha256=..."

# 3. Test manual webhook (see Step 5.5)
```

### **Issue: Callbacks not appearing in history tab**

**Possible Causes:**
1. Database connection issue
2. Migration not applied
3. API endpoint returning error

**Debug Steps:**
```bash
# 1. Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM llm_callbacks;"

# 2. Check API endpoint
curl http://localhost:3000/api/admin/llm-callbacks/history \
  -H "Cookie: your-session-cookie-here"

# 3. Check browser network tab
# DevTools → Network → Filter by "llm-callbacks"
```

### **Issue: Modal doesn't open**

**Possible Causes:**
1. JavaScript error
2. Callback ID not found
3. API endpoint error

**Debug Steps:**
```bash
# 1. Check browser console for errors

# 2. Verify callback exists in database
psql $DATABASE_URL -c "SELECT id FROM llm_callbacks WHERE id = 'callback-uuid-here';"

# 3. Test API endpoint
curl http://localhost:3000/api/admin/llm-callbacks/{callback_id} \
  -H "Cookie: your-session-cookie-here"
```

---

## 7. Security Testing

### **Test 7.1: Signature Verification**

**Goal:** Verify that callbacks without valid signatures are rejected

```bash
# Send webhook WITHOUT signature header
curl -X POST http://localhost:3000/api/webhooks/llm-callback \
  -H "Content-Type: application/json" \
  -d '{"job_id":"test","event_type":"test"}'

# Expected: Stored with signature_valid=false
# Check database:
psql $DATABASE_URL -c "SELECT signature_valid FROM llm_callbacks ORDER BY created_at DESC LIMIT 1;"
```

### **Test 7.2: Invalid Signature**

```bash
# Send webhook with WRONG signature
curl -X POST http://localhost:3000/api/webhooks/llm-callback \
  -H "Content-Type: application/json" \
  -H "X-LLM-Signature: sha256=invalid_signature_here" \
  -d '{"job_id":"test","event_type":"test"}'

# Expected: Stored with signature_valid=false
```

### **Test 7.3: Admin-Only Access**

**Goal:** Verify non-admin users cannot access callbacks

1. Log out of admin account
2. Log in as non-admin user
3. Try to access `/admin/debug?tab=callbacks`
4. **Expected:** Redirect or 403 Forbidden

### **Test 7.4: Payload Size Limit**

```bash
# Create large payload (>1MB)
python3 << EOF
import json
payload = {"data": "x" * (1024 * 1024 + 1)}  # 1MB + 1 byte
print(json.dumps(payload))
EOF > large_payload.json

# Send large payload
curl -X POST http://localhost:3000/api/webhooks/llm-callback \
  -H "Content-Type: application/json" \
  -d @large_payload.json

# Expected: 413 Payload Too Large
```

---

## 8. Performance Testing

### **Test 8.1: Polling Performance**

Monitor browser network tab while on admin page:

- ✅ Polling interval is 10 seconds
- ✅ Request completes in <200ms
- ✅ No excessive memory usage
- ✅ No memory leaks after 10+ minutes

### **Test 8.2: Modal Rendering Performance**

Open modal with large JSON payload (>100KB):

- ✅ Modal opens in <500ms
- ✅ JSON viewer renders without lag
- ✅ Expand/collapse is smooth
- ✅ No browser freezing

---

## 9. Complete End-to-End Test Scenario

**Scenario:** User generates an emergency plan, which triggers LLM workflow

### **Steps:**

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Ensure LLM service is running**
   ```bash
   # Check health
   curl http://localhost:5001/health
   ```

3. **Navigate to plan creation page**
   - Go to `/plans/new` (or your app's plan wizard)

4. **Fill out plan form and submit**
   - Fill in all required fields
   - Click "Generate Plan"

5. **Monitor LLM Queue**
   - Open new tab: `/admin/debug?tab=llm-queue`
   - Verify job appears with status "queued" or "processing"

6. **Wait for job completion**
   - Job status changes to "completed" (or "failed")
   - LLM service sends webhook callback

7. **Toast notification appears**
   - Within 10 seconds, toast should appear
   - Message: "test_workflow - workflow.completed"

8. **View callback details**
   - Click "View Details" on toast
   - Modal opens with full callback data
   - Verify signature is valid (green title bar)

9. **Check callback history**
   - Navigate to Callbacks tab
   - Find the callback in the table
   - Click "View" to open modal again

10. **Verify database storage**
    ```bash
    psql $DATABASE_URL -c "SELECT * FROM llm_callbacks ORDER BY created_at DESC LIMIT 1;"
    ```

---

## 10. Next Steps After Testing

Once testing is complete:

1. **Document any bugs found** in GitHub issues
2. **Configure production webhook URL** in LLM service
3. **Set up monitoring alerts** for invalid signatures
4. **Review and optimize** polling interval if needed
5. **Add additional event types** to callback system as needed

---

## Appendix A: Environment Variables Reference

```bash
# Required for webhook system
LLM_WEBHOOK_SECRET=your-webhook-secret-here  # Must match LLM service

# Database connection (should already be configured)
DATABASE_URL=postgresql://...

# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Admin email (for webhook secret alerts)
ADMIN_EMAIL=admin@yourdomain.com
```

---

## Appendix B: Database Schema Reference

```sql
-- llm_callbacks table
CREATE TABLE llm_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  callback_id TEXT UNIQUE NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  signature_header TEXT,
  verified_at TIMESTAMPTZ,
  payload JSONB NOT NULL,
  payload_preview TEXT,
  external_job_id TEXT,
  workflow_name TEXT,
  event_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- llm_callback_views table
CREATE TABLE llm_callback_views (
  callback_id UUID REFERENCES llm_callbacks(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (callback_id, admin_user_id)
);
```

---

## Appendix C: API Endpoints Reference

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/webhooks/llm-callback` | POST | Receive webhook from LLM service | Signature |
| `/api/admin/llm-callbacks/check` | GET | Poll for new callbacks | Admin |
| `/api/admin/llm-callbacks/[id]` | GET | Get callback details | Admin |
| `/api/admin/llm-callbacks/history` | GET | Get callback history | Admin |
| `/api/admin/llm-callbacks/mark-viewed` | POST | Mark callback as viewed | Admin |

---

**End of Testing Guide**
