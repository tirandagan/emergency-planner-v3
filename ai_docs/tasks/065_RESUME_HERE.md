# Task #065 - Resume Here

**Last Updated:** 2025-12-20
**Status:** Phase 1 Complete, Ready for Phase 2
**Next Action:** Run database migration, then continue implementation

---

## ⚡ Quick Resume

### What's Done ✅
- **Phase 1 Complete:** Database schema and migrations created with all 10 improvements
- **Security Analysis Complete:** LLM service already has HMAC signatures built-in
- **Documentation Complete:** All improvements and security patterns documented

### What's Next 🚀
1. **Run Migration** (you need to do this):
   - Open Supabase SQL Editor
   - Run `drizzle/migrations/0031_add_llm_callbacks_tables.sql`
   - Verify tables created: `llm_callbacks` and `llm_callback_views`

2. **Phase 2:** Create database query functions (`lib/llm-callbacks.ts`)
3. **Phase 3:** Create webhook endpoint with signature verification
4. **Phases 4-11:** API endpoints, UI components, testing

---

## 📂 Files Created

### Database Schema
- **`src/db/schema/llm-callbacks.ts`** - Production-ready schema with 2 tables
- **`drizzle/migrations/0031_add_llm_callbacks_tables.sql`** - Up migration
- **`drizzle/migrations/0031_add_llm_callbacks_tables/down.sql`** - Safe rollback

### Documentation
- **`065_llm_callback_webhook.md`** - Main task document (updated with progress)
- **`065_IMPROVEMENTS_APPLIED.md`** - All 10 improvements explained
- **`065_LLM_WEBHOOK_SECURITY_ANALYSIS.md`** - Security implementation guide

---

## 🔑 Key Decisions Made

### 1. **Idempotency Strategy**
- Use `job_id` from LLM service payload as `callback_id`
- LLM service retries won't create duplicates
- Stable across retries

### 2. **Signature Verification**
- LLM service sends `X-Webhook-Signature: sha256=<hex_digest>`
- Verify against raw request body (before JSON parsing)
- Store verification result + timestamp for audit trail

### 3. **Polling Architecture**
- Cursor-based pagination (not "recent unviewed")
- Server derives user from auth cookie (no userId in query params)
- Endpoint: `GET /check?after=<cursor>&limit=20`

### 4. **View Tracking**
- Separate `llm_callback_views` join table (not array)
- Avoids race conditions
- Enables efficient "unviewed by user X" queries

### 5. **Performance Targets**
- Webhook response: <200ms (fast acknowledgment)
- Verify → Insert → Return 200 (no heavy processing)
- Payload limit: 1MB (reject larger with 413)

---

## 🎯 Implementation Checklist

### Before You Start
- [ ] Run migration `0031_add_llm_callbacks_tables.sql` in Supabase
- [ ] Add `LLM_WEBHOOK_SECRET` to `.env.local` (must match LLM service)
- [ ] Verify `src/db/schema/index.ts` exports `llm-callbacks` (already done)

### Phase 2: Database Query Functions
Create `src/lib/llm-callbacks.ts` with:
- [ ] `getRecentCallbacks(after: string, limit: number, userId: string)`
- [ ] `getCallbackById(id: string, userId: string)`
- [ ] `createLLMCallback(data: NewLLMCallback)`
- [ ] Use Drizzle ORM with proper JOINs for view tracking

### Phase 3: Webhook Endpoint
Create `src/app/api/webhooks/llm-callback/route.ts`:
- [ ] Read raw body (before parsing)
- [ ] Check payload size (<1MB)
- [ ] Verify HMAC signature
- [ ] Parse JSON (only after verification)
- [ ] Extract `job_id` as `callback_id`
- [ ] Insert to database with `onConflictDoNothing()`
- [ ] Return 200 in <200ms

### Phase 4: Admin API Endpoints
- [ ] `GET /api/admin/llm-callbacks/check?after=<cursor>&limit=20`
  - Cursor-based pagination
  - Server derives user from auth
  - Returns unviewed callbacks
- [ ] `GET /api/admin/llm-callbacks/[id]/route.ts`
  - Fetches full callback details
  - Verifies admin role

### Phase 5: Server Action
Create `src/app/actions/llm-callbacks.ts`:
- [ ] `markCallbackAsViewed(callbackId, userId)`
- [ ] INSERT to `llm_callback_views` with `onConflictDoNothing()`

### Phase 6: Notification Poller
Create `src/components/admin/LLMCallbackNotificationPoller.tsx`:
- [ ] Client component with `useEffect` + `setInterval`
- [ ] Poll every 10 seconds with cursor tracking
- [ ] Show Sonner toast with "View Details" button
- [ ] Store cursor in state/localStorage

### Phase 7: Callback Detail Modal
Create `src/components/admin/LLMCallbackDetailModal.tsx`:
- [ ] Copy LLMJobDetailModal.tsx structure
- [ ] Use `react-json-view-lite` for JSON display
- [ ] Draggable with `react-rnd`
- [ ] Show signature verification status

### Phase 8: History Tab
Create `src/components/admin/LLMCallbackHistoryTab.tsx`:
- [ ] Paginated table of callbacks
- [ ] Filter by status, workflow_name
- [ ] "View" button opens modal

### Phase 9-11: Testing & Review
- [ ] Run linting and type-checking
- [ ] Comprehensive code review
- [ ] Test with actual LLM service callbacks
- [ ] Update test script webhook URL

---

## 💡 Quick Tips for Next Session

### Schema Structure
```typescript
llmCallbacks: {
  id, callbackId (job_id),
  signatureValid, signatureHeader, verifiedAt,
  payload, payloadPreview,
  externalJobId, workflowName, eventType,
  status, errorMessage,
  createdAt, updatedAt
}

llmCallbackViews: {
  callbackId, adminUserId, viewedAt
}
```

### Webhook Payload from LLM Service
```json
{
  "event": "workflow.completed" | "workflow.failed" | "llm.step.completed",
  "job_id": "uuid-here",
  "workflow_name": "emergency_contacts",
  "status": "completed" | "failed",
  "result": { ... },
  "error_message": "...",
  "timestamp": "2025-12-20T10:30:00Z"
}
```

### Signature Verification Pattern
```typescript
const rawBody = await request.text();
const signature = request.headers.get('x-webhook-signature');
const isValid = verifyWebhookSignature(rawBody, signature, secret);
if (!isValid) return 401;
const payload = JSON.parse(rawBody); // Only after verification
```

---

## 🚀 To Continue

**Command to resume:**
```
Claude, continue implementing task #065 LLM callback webhook.
We left off after Phase 1 (database schema complete).
Please proceed with Phase 2: creating database query functions.
```

**Files to reference:**
- `065_llm_callback_webhook.md` - Main task document
- `065_IMPROVEMENTS_APPLIED.md` - Implementation details
- `065_LLM_WEBHOOK_SECURITY_ANALYSIS.md` - Security patterns

---

*Task ready to resume - Phase 1 complete, 10 phases remaining*
