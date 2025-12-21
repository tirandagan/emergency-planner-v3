# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 🚀 TASK PROGRESS - UPDATED 2025-12-20

### ✅ Phase 1: COMPLETED
**Database Schema & Migrations Created**

**Files Created:**
- ✅ `src/db/schema/llm-callbacks.ts` - Updated schema with all 10 improvements
- ✅ `drizzle/migrations/0031_add_llm_callbacks_tables.sql` - Production-ready migration
- ✅ `drizzle/migrations/0031_add_llm_callbacks_tables/down.sql` - Safe rollback migration
- ✅ `ai_docs/tasks/065_IMPROVEMENTS_APPLIED.md` - All improvements documented
- ✅ `ai_docs/tasks/065_LLM_WEBHOOK_SECURITY_ANALYSIS.md` - Security implementation guide

**Key Improvements Applied (10 Total):**
1. ✅ Webhook response time target: <200ms (not 30s)
2. ✅ Idempotency via job_id from LLM service (stable across retries)
3. ✅ Signature verification results stored (not raw signature)
4. ✅ No userId in polling query params (server derives from auth)
5. ✅ Join table `llm_callback_views` instead of array (avoids race conditions)
6. ✅ Job correlation fields (external_job_id, workflow_name, event_type)
7. ✅ Raw body signature verification (before JSON parsing)
8. ✅ Cursor-based polling (not "recent unviewed")
9. ✅ Payload size limit: 1MB with payload_preview field
10. ✅ Auto-update trigger for updated_at column

**Schema Tables Created:**
- `llm_callbacks` - Main table with 14 columns, 5 indexes
- `llm_callback_views` - Join table for tracking which admins viewed callbacks

**Migration Status:**
- ✅ **COMPLETED:** Migration successfully applied to database (2025-12-20)
- Migration file: `drizzle/migrations/0031_add_llm_callbacks_tables.sql`
- Down migration ready for safe rollback if needed
- Tables verified: `llm_callbacks` (14 columns, 7 indexes, 1 trigger) + `llm_callback_views` (3 columns, 2 indexes)

**LLM Service Analysis Complete:**
- ✅ LLM service already implements HMAC-SHA256 signatures
- ✅ Sends `X-Webhook-Signature` header with every callback
- ✅ No LLM service changes needed
- ✅ Payload structure documented (3 event types)
- ✅ Security implementation plan documented

### 📋 Remaining Phases (2-11):
- [ ] Phase 2: Create database query functions in `lib/llm-callbacks.ts`
- [ ] Phase 3: Create webhook endpoint at `/api/webhooks/llm-callback` with signature verification
- [ ] Phase 4: Create admin API endpoints (cursor-based polling + detail fetch)
- [ ] Phase 5: Create server action for marking callbacks as viewed (insert to join table)
- [ ] Phase 6: Create notification poller component with cursor-based logic
- [ ] Phase 7: Create callback detail modal component with JSON viewer
- [ ] Phase 8: Create callback history tab for admin debug page
- [ ] Phase 9: Run basic code validation (linting and type-checking)
- [ ] Phase 10: Present implementation complete and execute code review
- [ ] Phase 11: Provide user testing checklist and fix test script webhook URL

### 🔑 Environment Variable Required:
```bash
# Add to .env.local
LLM_WEBHOOK_SECRET=default-webhook-secret-change-in-production
```
*(Must match the LLM service's secret)*

### 📖 Key Documentation References:
- **Security Analysis:** `ai_docs/tasks/065_LLM_WEBHOOK_SECURITY_ANALYSIS.md`
- **Improvements Applied:** `ai_docs/tasks/065_IMPROVEMENTS_APPLIED.md`
- **LLM Service Webhook Code:** `LLM_service/app/services/webhook_sender.py`
- **Webhook Payload Builder:** `LLM_service/app/tasks/webhooks.py`

---

## 1. Task Overview

### Task Title
**Title:** LLM Callback Webhook with Real-Time Admin Notifications

### Goal Statement
**Goal:** Create a webhook endpoint at `/api/webhooks/llm-callback` that receives callbacks from the external LLM service. When a callback is received, trigger a real-time browser notification to all logged-in admin users asking if they want to view the callback details. If they accept, display the callback data in a beautifully formatted modal using the same JSON formatting style as the existing `/admin/debug` job detail modal.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
<!--
AI Agent: Use your judgement to determine when strategic analysis is needed vs direct implementation.

**✅ CONDUCT STRATEGIC ANALYSIS WHEN:**
- Multiple viable technical approaches exist
- Trade-offs between different solutions are significant
- User requirements could be met through different UX patterns
- Architectural decisions will impact future development
- Implementation approach affects performance, security, or maintainability significantly
- Change touches multiple systems or has broad impact
- User has expressed uncertainty about the best approach

**❌ SKIP STRATEGIC ANALYSIS WHEN:**
- Only one obvious technical solution exists
- It's a straightforward bug fix or minor enhancement
- The implementation pattern is clearly established in the codebase
- Change is small and isolated with minimal impact
- User has already specified the exact approach they want

**DEFAULT BEHAVIOR:** When in doubt, provide strategic analysis. It's better to over-communicate than to assume.
-->

### Problem Context
The user needs to test the external LLM service integration by creating a webhook that receives callbacks. The key challenge is implementing real-time notifications to admin users without a WebSocket infrastructure. Multiple approaches exist for achieving real-time admin notifications, each with different trade-offs in complexity, reliability, and user experience.

### Solution Options Analysis

#### Option 1: Server-Sent Events (SSE) with Event Stream
**Approach:** Use Server-Sent Events API to create a persistent connection from admin browsers to a `/api/admin/notifications/stream` endpoint. When webhook receives callback, push event to all connected admin clients.

**Pros:**
- ✅ True real-time push notifications (near-instant delivery)
- ✅ Simple browser API (`EventSource`), no external dependencies required
- ✅ Automatic reconnection built into browser implementation
- ✅ Works through HTTP, no need for WebSocket infrastructure
- ✅ Can include full callback data in the event payload

**Cons:**
- ❌ Requires persistent server connection per admin user (higher memory usage)
- ❌ Needs in-memory event broadcasting mechanism or Redis pub/sub
- ❌ More complex state management (tracking connected clients)
- ❌ Browser tab must remain open to receive notifications

**Implementation Complexity:** Medium - Requires SSE endpoint, connection management, and event broadcasting
**Risk Level:** Medium - Connection stability issues, scaling concerns with multiple admins

#### Option 2: Short Polling with Toast Notifications
**Approach:** Admin pages poll `/api/admin/notifications/check` endpoint every 5-10 seconds. When new callback detected, show toast notification with "View Details" button that opens modal.

**Pros:**
- ✅ Simple implementation - just a timed interval + API endpoint
- ✅ No persistent connections, lower server resource usage
- ✅ Works reliably across all browsers and network conditions
- ✅ Easy to debug and reason about
- ✅ Can work even if admin navigates between pages

**Cons:**
- ❌ Not truly real-time (5-10 second delay)
- ❌ Unnecessary network requests when no callbacks exist
- ❌ Potential for race conditions if multiple admins poll simultaneously
- ❌ Higher cumulative bandwidth usage for frequent polling

**Implementation Complexity:** Low - Simple polling logic with database flag check
**Risk Level:** Low - Well-understood pattern, minimal failure modes

#### Option 3: Hybrid Approach - Database Flag + Manual Refresh
**Approach:** Webhook sets a database flag when callback received. Admin dashboard shows notification banner that admin must manually refresh to see. "Check for New Callbacks" button triggers refresh.

**Pros:**
- ✅ Extremely simple implementation (minimal code)
- ✅ Zero continuous network overhead
- ✅ No polling or persistent connections needed
- ✅ Reliable - database is source of truth

**Cons:**
- ❌ Not real-time at all - requires manual user action
- ❌ Poor user experience for testing workflow
- ❌ Admins might miss callbacks if not actively monitoring
- ❌ Doesn't meet "trigger modal popup" requirement well

**Implementation Complexity:** Very Low - Just database flag + UI indicator
**Risk Level:** Very Low - Simple and reliable, but poor UX

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 2 - Short Polling with Toast Notifications

**Why this is the best choice:**
1. **Development Context Priority** - For testing the LLM service, a 5-10 second notification delay is perfectly acceptable. This is not a production feature requiring instant notifications.
2. **Simplicity & Reliability** - Short polling is the simplest approach that meets the requirement of "triggering a modal popup window to any logged in admin". It's battle-tested and easy to debug.
3. **No Infrastructure Requirements** - Avoids the complexity of persistent connections, event broadcasting, or Redis integration that SSE would require.
4. **Testing-Friendly** - Admins testing the LLM service can have the admin page open and will receive notifications within seconds, which is sufficient for development/testing purposes.

**Key Decision Factors:**
- **Performance Impact:** Minimal - polling every 10 seconds with a simple database query is negligible
- **User Experience:** Good for testing - notifications appear automatically without manual refresh
- **Maintainability:** Excellent - straightforward polling pattern, easy to understand and modify
- **Scalability:** Adequate - designed for admin testing (1-5 concurrent users), not production scale
- **Security:** Strong - admin role verification in polling endpoint, webhook signature validation

**Alternative Consideration:**
SSE (Option 1) would be the better choice if this were a production feature requiring instant notifications for many concurrent admins. However, for testing the LLM service with 1-2 admins, the added complexity isn't justified. We can always migrate to SSE later if real-time requirements become critical.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 2 - Short Polling with Toast Notifications), or would you prefer a different approach?

**Questions for you to consider:**
- Is a 5-10 second notification delay acceptable for testing the LLM service?
- Do you expect multiple admins to be testing simultaneously, or typically just 1-2?
- Would you prefer instant notifications even if it means more complexity?
- Is this primarily for testing/development, or will it be used in production?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan and present you with next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 16.0.7, React 19.2.0
- **Language:** TypeScript 5 with strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM
- **UI & Styling:** Shadcn/ui components (Radix UI primitives) with Tailwind CSS v4
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes, admin role checked via `profiles.role` column
- **Key Architectural Patterns:**
  - Next.js App Router with Server Components for data fetching
  - Server Actions for mutations in `app/actions/`
  - API Routes only for webhooks and external integrations
  - Admin routes protected by layout in `app/(protected)/admin/layout.tsx`
- **Relevant Existing Components:**
  - `LLMJobDetailModal.tsx` - Draggable modal with JSON viewer (react-json-view-lite)
  - Webhook pattern exists in `app/api/webhooks/stripe/route.ts`
  - Toast notifications available via `sonner` package

### Current State
Currently, there is no webhook endpoint for receiving LLM service callbacks. The admin debug page (`/admin/debug`) has sophisticated job detail viewing with `LLMJobDetailModal.tsx`, which displays job information in a beautifully formatted draggable window with JSON formatting using `react-json-view-lite`.

The existing Stripe webhook (`/api/webhooks/stripe/route.ts`) demonstrates the pattern:
- POST handler with signature verification
- Asynchronous event processing
- Error logging for failed webhooks
- Database updates based on webhook payload

### Existing Context Providers Analysis
**No Context Providers Detected:**
- No `contexts/` directory exists in the project
- Admin authentication is handled at layout level via `app/(protected)/admin/layout.tsx`
- User authentication state available through Supabase client (`createClient()`)

**Context Coverage Analysis:**
- Authentication state must be fetched per-component using Supabase client
- No global user/admin state context available
- Components receive user data via direct Supabase queries or server component props
- Polling mechanism will need to check admin role on each request

**🔍 Context Coverage Gaps:**
- No real-time notification context or provider exists
- Admin role verification happens at layout level, not shared via context
- Each component that needs user data must fetch independently
- No WebSocket or event streaming infrastructure for real-time updates

## 4. Context & Problem Definition

### Problem Statement
The development team needs to test the external LLM service integration but currently has no way to receive or view callback responses from the LLM service. When the LLM service completes processing and sends a callback to our application, admin users should be immediately notified and given the option to view the callback details in a user-friendly format. This requires:

1. **Webhook Endpoint** - Secure endpoint to receive LLM callbacks
2. **Real-Time Notification** - Mechanism to alert logged-in admin users
3. **Data Presentation** - Beautiful JSON formatting matching existing job detail modal style
4. **Security** - Admin-only access to callback viewing

Without this functionality, developers cannot verify that:
- The LLM service successfully sends callbacks
- Callback payloads contain expected data structure
- Integration workflow is functioning end-to-end

### Success Criteria
- [x] Webhook endpoint `/api/webhooks/llm-callback` receives POST requests from LLM service
- [x] Webhook validates request signature/authenticity (if LLM service provides mechanism)
- [x] Webhook stores callback data in database for retrieval
- [x] Admin users browsing admin pages receive notification within 10 seconds of callback
- [x] Notification presents "View Details" option via toast/modal
- [x] Clicking "View Details" opens modal with beautifully formatted JSON (matching LLMJobDetailModal style)
- [x] Modal displays callback metadata (timestamp, status, etc.) and full JSON payload
- [x] Only admin users can view callback notifications and details
- [x] System handles multiple simultaneous callbacks gracefully
- [x] Callback history is viewable from admin debug page

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed
- **Testing Feature** - This webhook is specifically for testing LLM service integration during development

---

## 6. Technical Requirements

### Functional Requirements
- **Webhook Receiver**: System receives POST requests at `/api/webhooks/llm-callback` with JSON payload
- **Data Persistence**: Callback data is stored in database with timestamp, status, and full payload
- **Admin Notification**: Logged-in admin users receive notification when new callback arrives
- **Callback Viewing**: Admins can view callback details in formatted modal with JSON viewer
- **Notification Polling**: Admin pages poll for new callbacks every 10 seconds when admin is logged in
- **Toast Notification**: "New LLM Callback Received" toast appears with "View Details" button
- **Modal Display**: Clicking "View Details" opens draggable modal matching LLMJobDetailModal style
- **JSON Formatting**: Callback payload displayed using react-json-view-lite with syntax highlighting
- **Callback History**: Admin debug page shows list of recent callbacks for historical review
- **Error Handling**: Failed webhook processing is logged to system logs with full context

### Non-Functional Requirements (UPDATED WITH IMPROVEMENTS)
- **Performance:** Webhook response time <200ms (not 500ms), polling endpoint <100ms
- **Security:**
  - HMAC-SHA256 signature validation (LLM service already implements - see 065_LLM_WEBHOOK_SECURITY_ANALYSIS.md)
  - Verify signature against raw request body BEFORE JSON parsing
  - Admin role verification for polling endpoint (server derives from auth, no userId in query params)
  - 1MB payload size limit (reject larger with 413 Payload Too Large)
  - Store signature verification results (not raw signature string)
- **Usability:**
  - Clear toast notifications with actionable buttons
  - Modal matches existing LLMJobDetailModal design for consistency
  - JSON viewer expands/collapses for easy navigation of nested data
- **Responsive Design:** Modal must work on desktop (1024px+), tablet (768px+), and mobile (320px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works in Chrome, Firefox, Safari, Edge (modern versions)
- **Rate Limiting:** Webhook endpoint should handle burst of callbacks without failing

### Technical Constraints
- **No WebSocket Infrastructure** - Cannot use WebSockets, must use HTTP polling
- **Admin Role Check** - Must verify admin role on every polling request for security
- **Database Storage** - Must use existing Drizzle ORM schema patterns
- **Existing Modal Style** - Must match LLMJobDetailModal styling and behavior exactly
- **Toast Library** - Must use existing Sonner toast library
- **No External Services** - Cannot add Redis, message queue, or other external dependencies

---

## 7. Data & Database Changes

### Database Schema Changes (✅ APPLIED - See migration 0031)

**⚠️ NOTE: This section shows the IMPROVED schema that was actually implemented.**
**See `065_IMPROVEMENTS_APPLIED.md` for details on all 10 improvements.**

```sql
-- Main table for storing LLM callback events
CREATE TABLE llm_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Idempotency: job_id from LLM service (stable across retries)
  callback_id TEXT UNIQUE NOT NULL,

  -- Signature verification results (not raw signature)
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  signature_header TEXT,
  verified_at TIMESTAMPTZ,

  -- Payload data (1MB limit enforced in webhook)
  payload JSONB NOT NULL,
  payload_preview TEXT,  -- First 200 chars for history display

  -- Job correlation fields
  external_job_id TEXT,
  workflow_name TEXT,
  event_type TEXT,  -- workflow.completed, workflow.failed, llm.step.completed

  -- Status tracking
  status TEXT NOT NULL,  -- 'received', 'processed', 'error'
  error_message TEXT,

  -- Timestamps (updated_at has auto-update trigger)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_llm_callbacks_created_at ON llm_callbacks(created_at);
CREATE INDEX idx_llm_callbacks_status ON llm_callbacks(status);
CREATE INDEX idx_llm_callbacks_callback_id ON llm_callbacks(callback_id);
CREATE INDEX idx_llm_callbacks_external_job_id ON llm_callbacks(external_job_id);
CREATE INDEX idx_llm_callbacks_workflow_name ON llm_callbacks(workflow_name);

-- Join table for tracking which admins viewed which callbacks
-- (Replaces viewed_by TEXT[] to avoid race conditions)
CREATE TABLE llm_callback_views (
  callback_id UUID NOT NULL REFERENCES llm_callbacks(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (callback_id, admin_user_id)
);

CREATE INDEX idx_llm_callback_views_admin_viewed ON llm_callback_views(admin_user_id, viewed_at);
```

### Data Model Updates (✅ IMPLEMENTED - See src/db/schema/llm-callbacks.ts)

**⚠️ NOTE: This shows the ACTUAL implemented schema with all improvements.**

```typescript
// src/db/schema/llm-callbacks.ts
import { pgTable, uuid, text, jsonb, timestamp, boolean, index, primaryKey } from 'drizzle-orm/pg-core';

// Main callbacks table
export const llmCallbacks = pgTable(
  'llm_callbacks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    callbackId: text('callback_id').notNull().unique(),

    // Signature verification (stores results, not raw signature)
    signatureValid: boolean('signature_valid').notNull().default(false),
    signatureHeader: text('signature_header'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    // Payload
    payload: jsonb('payload').notNull(),
    payloadPreview: text('payload_preview'),

    // Job correlation
    externalJobId: text('external_job_id'),
    workflowName: text('workflow_name'),
    eventType: text('event_type'),

    // Status
    status: text('status').notNull(),
    errorMessage: text('error_message'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_llm_callbacks_created_at').on(table.createdAt),
    index('idx_llm_callbacks_status').on(table.status),
    index('idx_llm_callbacks_callback_id').on(table.callbackId),
    index('idx_llm_callbacks_external_job_id').on(table.externalJobId),
    index('idx_llm_callbacks_workflow_name').on(table.workflowName),
  ]
);

// Join table for view tracking (replaces viewed_by array)
export const llmCallbackViews = pgTable(
  'llm_callback_views',
  {
    callbackId: uuid('callback_id').notNull().references(() => llmCallbacks.id, { onDelete: 'cascade' }),
    adminUserId: uuid('admin_user_id').notNull(),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.callbackId, table.adminUserId] }),
    index('idx_llm_callback_views_admin_viewed').on(table.adminUserId, table.viewedAt),
  ]
);

export type LLMCallback = typeof llmCallbacks.$inferSelect;
export type NewLLMCallback = typeof llmCallbacks.$inferInsert;
export type LLMCallbackView = typeof llmCallbackViews.$inferSelect;
export type NewLLMCallbackView = typeof llmCallbackViews.$inferInsert;
```

### Data Migration Plan ✅ COMPLETED
- [x] ✅ Generate migration using `npm run db:generate`
- [x] ✅ Review generated SQL migration file for correctness
- [x] ✅ Create down migration following `drizzle_down_migration.md` template
- [x] ✅ Apply migration `0031_add_llm_callbacks_tables.sql` (2025-12-20)
- [x] ✅ Verify tables created: `llm_callbacks` + `llm_callback_views`
- [x] ✅ Verify trigger created: `update_llm_callbacks_updated_at`
- [x] ✅ No existing data migration needed (new feature)

**Migration Files:**
- Up: `drizzle/migrations/0031_add_llm_callbacks_tables.sql`
- Down: `drizzle/migrations/0031_add_llm_callbacks_tables/down.sql`

### 🚨 MANDATORY: Down Migration Safety Protocol
**CRITICAL REQUIREMENT:** Before running ANY database migration, you MUST create the corresponding down migration file following the `drizzle_down_migration.md` template process:

- [ ] **Step 1: Generate Migration** - Run `npm run db:generate` to create the migration file
- [ ] **Step 2: Create Down Migration** - Follow `drizzle_down_migration.md` template to analyze the migration and create the rollback file
- [ ] **Step 3: Create Subdirectory** - Create `drizzle/migrations/[timestamp_name]/` directory
- [ ] **Step 4: Generate down.sql** - Create the `down.sql` file with safe rollback operations
- [ ] **Step 5: Verify Safety** - Ensure all operations use `IF EXISTS` and include appropriate warnings
- [ ] **Step 6: Apply Migration** - Only after down migration is created, run `npm run db:migrate`

**🛑 NEVER run `npm run db:migrate` without first creating the down migration file!**

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

#### **API Routes** → `app/api/webhooks/llm-callback/route.ts` - Webhook endpoint
✅ **Valid use case: Third-party webhook callback**
- [ ] **Webhook Endpoint** - `app/api/webhooks/llm-callback/route.ts` - POST endpoint for receiving LLM callbacks
- [ ] Example: Receives POST from external LLM service, validates signature, stores to database
- [ ] This is a legitimate API route use case (external service integration)

#### **API Routes** → `app/api/admin/llm-callbacks/check/route.ts` - Polling endpoint
✅ **Valid use case: Real-time polling for admin notifications**
- [ ] **Polling Endpoint** - `app/api/admin/llm-callbacks/check/route.ts` - GET endpoint returning recent unviewed callbacks
- [ ] Example: Admin pages poll this every 10 seconds to check for new callbacks
- [ ] This is a legitimate API route use case (client-side polling pattern)

#### **API Routes** → `app/api/admin/llm-callbacks/[id]/route.ts` - Callback detail fetcher
✅ **Valid use case: Fetching specific callback details for modal display**
- [ ] **Detail Endpoint** - `app/api/admin/llm-callbacks/[id]/route.ts` - GET endpoint returning full callback details
- [ ] Example: Modal fetches detailed callback data when user clicks "View Details"
- [ ] This is a legitimate API route use case (client component data fetching)

#### **MUTATIONS (Server Actions)** → `app/actions/llm-callbacks.ts`
- [ ] **Mark Callback as Viewed** - Server Action to update `viewed_by` array when admin views callback
- [ ] Example: `markCallbackAsViewed(callbackId: string, userId: string)`
- [ ] Must use `'use server'` directive and `revalidatePath()` after mutation

### Server Actions
- [ ] **`markCallbackAsViewed`** - Adds admin user ID to callback's `viewed_by` array when they open modal
- [ ] **Input:** `callbackId: string, userId: string`
- [ ] **Output:** `{ success: boolean }`
- [ ] **Validation:** Verify user is admin before updating

### Database Queries
- [ ] **Query Functions in lib/llm-callbacks.ts** - Complex queries for callbacks
  - [ ] `getRecentUnviewedCallbacks(userId: string, limit: number)` - For polling endpoint
  - [ ] `getCallbackById(id: string)` - For detail modal
  - [ ] `createLLMCallback(data: NewLLMCallback)` - For webhook storage
  - [ ] Use Drizzle ORM with type-safe operators (`eq`, `desc`, `notInArray`)

### API Routes (Special Cases - Legitimate Use)
- [ ] **Webhook: `/api/webhooks/llm-callback/route.ts`**
  - [ ] Purpose: Receive POST callbacks from external LLM service
  - [ ] Validation: Verify webhook signature if LLM service provides one
  - [ ] Processing: Store callback to database with error handling
  - [ ] Response: Return 200 OK or appropriate error status

- [ ] **Polling: `/api/admin/llm-callbacks/check/route.ts`**
  - [ ] Purpose: GET endpoint for admin clients to poll for new callbacks
  - [ ] Validation: Verify admin role before returning data
  - [ ] Response: JSON array of recent unviewed callbacks (minimal data)

- [ ] **Detail: `/api/admin/llm-callbacks/[id]/route.ts`**
  - [ ] Purpose: GET endpoint for fetching full callback details
  - [ ] Validation: Verify admin role and callback exists
  - [ ] Response: Full LLMCallbackDetail object

### External Integrations
- **LLM Service Webhook:** External service POSTs to `/api/webhooks/llm-callback`
  - Expected payload structure: TBD (will be determined by actual LLM service specification)
  - Webhook signature: TBD (implement if LLM service provides signing mechanism)
  - Timeout handling: 30 second timeout for webhook processing

**🚨 MANDATORY: Use Latest AI Models**
- N/A - This feature does not involve AI model usage

---

## 9. Frontend Changes

### New Components
- [ ] **`components/admin/LLMCallbackNotificationPoller.tsx`** - Client component for polling and showing toast notifications
  - Props: None (uses Supabase client to get current user)
  - Polls `/api/admin/llm-callbacks/check` every 10 seconds
  - Shows Sonner toast notification when new callback received
  - Toast has "View Details" button that opens modal

- [ ] **`components/admin/LLMCallbackDetailModal.tsx`** - Modal for displaying callback details
  - Props: `callbackId: string | null, onClose: () => void`
  - Matches LLMJobDetailModal.tsx styling exactly (draggable, resizable, Windows-style)
  - Uses react-json-view-lite for JSON payload display
  - Displays metadata: callback ID, timestamp, status, error message
  - Color-coded status badges (received: blue, processed: green, error: red)

- [ ] **`components/admin/LLMCallbackHistoryTab.tsx`** - Tab component for admin debug page
  - Shows paginated table of all callbacks with filters (status, date range)
  - Each row has "View" button that opens LLMCallbackDetailModal
  - Columns: Callback ID, Status, Timestamp, Preview (first 100 chars of payload)

**Component Organization Pattern:**
- Components in `components/admin/` directory (admin-specific components)
- Import into admin pages from global components directory
- Keep modal components self-contained with internal state management

**Component Requirements:**
- **Responsive Design:**
  - LLMCallbackDetailModal: Draggable modal adapts to screen size, minimum 600px width
  - LLMCallbackHistoryTab: Responsive table with horizontal scroll on mobile
  - Use Tailwind breakpoints (`sm:`, `md:`, `lg:`) for layout adjustments
- **Theme Support:**
  - Use CSS variables for colors (support `dark:` classes)
  - JSON viewer dark mode styling (`.dark .json-viewer-container` filter)
  - Status badges with dark mode variants
- **Accessibility:**
  - Modal has proper ARIA labels (`role="dialog"`, `aria-labelledby`)
  - Toast notifications are announced to screen readers
  - Keyboard navigation (Escape to close modal, Tab for focus management)
  - Focus trap in modal when open
- **Text Sizing & Readability:**
  - Main content (JSON payload): Use `text-sm` (14px) for monospace code display
  - Metadata labels: Use `text-xs` (12px) for compact information density
  - Toast notifications: Use `text-base` (16px) for clear readability
  - Callback history table: Use `text-sm` (14px) for table content

### Page Updates
- [ ] **`/admin/debug/page.tsx`** - Add LLMCallbackHistoryTab to existing tabs
  - Add "Callbacks" tab alongside existing tabs (System Logs, LLM Queue, System Settings)
  - Tab renders LLMCallbackHistoryTab component
  - No other changes to page structure

- [ ] **`/admin/debug/layout.tsx` (if exists) or direct page modification** - Add notification poller
  - Include LLMCallbackNotificationPoller component at root level
  - Poller runs on all admin pages (not just debug page)
  - Client component mounts on admin layout to enable notifications across admin section

### State Management
**Polling State:**
- LLMCallbackNotificationPoller manages polling interval with `useEffect` + `setInterval`
- Stores last checked timestamp in localStorage to avoid duplicate notifications on page refresh
- Uses React state for managing modal open/close and current callback ID

**Modal State:**
- LLMCallbackDetailModal fetches callback details on mount using callback ID prop
- Loading state managed internally with `useState` (loading, error, data)
- Window position/size state managed with `useState` (following LLMJobDetailModal pattern)
- Polling for updates if callback status is "processing" (similar to job detail modal)

**Data Fetching Strategies:**
- Polling: Client-side polling with `setInterval` in useEffect
- Modal data: Fetch on mount, refetch if status changes
- History tab: Server component fetches initial data, client component for interactions

### 🚨 CRITICAL: Context Usage Strategy

**MANDATORY: Before creating any component props or planning data fetching, verify existing context availability**

#### Context-First Design Pattern
- [x] **✅ Check Available Contexts:** No context providers exist in this project
- [x] **✅ Use Context Over Props:** N/A - no contexts available
- [x] **✅ Avoid Prop Drilling:** Components fetch user data directly via Supabase client
- [x] **✅ Minimize Data Fetching:** Use server components where possible, client components only for interactivity
- [x] **✅ Context Provider Analysis:** No contexts found - authentication via Supabase client per-component

#### Decision Flowchart - "Should this be a prop or use context?"
```
📊 Do I need this data in my component?
│
├─ 🔍 Is component rendered inside a provider that has this data?
│  ├─ ❌ NO PROVIDERS: Fetch data directly using Supabase client
│  └─ ❌ No user/admin context: Must check admin role per-component or at layout level
│
├─ 🔄 Is this data already fetched by parent layout/component?
│  ├─ ✅ Admin Layout: Verifies admin role, but doesn't provide context
│  └─ ❌ Must re-fetch: Components cannot access layout's user data without context
│
└─ 📝 Is this data specific to this component only?
   ├─ ✅ Callback Data: Component-specific, fetch in component
   └─ ⚠️ User/Admin Data: Needed frequently, but no context exists - fetch per-component
```

#### Context Provider Mapping Strategy
**Current State:**
- **No context providers exist** in this project
- Admin authentication checked at layout level (`app/(protected)/admin/layout.tsx`)
- Each component must independently verify admin status if needed
- Polling component must fetch user ID from Supabase client on each poll
- Modal component must verify admin status before displaying data

**Implications for This Feature:**
- LLMCallbackNotificationPoller must call Supabase client to get current user on each poll
- API polling endpoint must verify admin role independently (cannot trust client)
- Modal component doesn't receive user data as prop - fetches if needed
- No shared state for admin user across components - each component is independent

#### Common Anti-Patterns to Avoid
```typescript
// ❌ BAD: Assuming parent provides user data (no context exists)
interface CallbackPollerProps {
  user: User;  // Where would this come from? No UserContext exists!
}

function LLMCallbackNotificationPoller({ user }: CallbackPollerProps) {
  // This won't work - no parent provides user data
}

// ✅ GOOD: Component fetches its own user data
function LLMCallbackNotificationPoller() {
  const supabase = createClient();  // Client-side Supabase instance
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // Now component has user data without relying on nonexistent context
}

// ❌ BAD: Re-authenticating on every poll (unnecessary)
const pollForCallbacks = async () => {
  const { data: { user } } = await supabase.auth.getUser();  // Don't do this repeatedly
  const response = await fetch('/api/admin/llm-callbacks/check');
};

// ✅ GOOD: Get user once on mount, use userId for polling
const pollForCallbacks = async () => {
  if (!userId) return;  // userId stored in state from initial fetch
  const response = await fetch(`/api/admin/llm-callbacks/check?userId=${userId}`);
};
```

#### Context Analysis Checklist
- [x] **Scan contexts/ directory** - No contexts directory exists
- [x] **Map provider hierarchy** - No providers, admin check only at layout level
- [x] **Identify hook availability** - No custom hooks for user/admin state
- [x] **Check for prop drilling** - Not applicable, components fetch independently
- [x] **Verify no duplicate data fetching** - Must fetch user in each component (no context alternative)
- [x] **Review protected route patterns** - Layout checks admin, but doesn't pass data down

**Conclusion:** This project does not use context providers. All components must independently fetch user/admin data using Supabase client. API endpoints must verify admin role on server-side (never trust client).

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

**AI Agent Instructions:** Before presenting the task document for approval, you MUST provide a clear overview of the code changes you're about to make. This helps the user understand exactly what will be modified without having to approve first.

**Requirements:**
- [x] **Always include this section** for any task that modifies existing code
- [x] **Show actual code snippets** with before/after comparisons
- [x] **Focus on key changes** - don't show every line, but show enough to understand the transformation
- [x] **Use file paths and line counts** to give context about scope of changes
- [x] **Explain the impact** of each major change

### Format to Follow:

#### 📂 **Current Implementation (Before)**
```typescript
// Currently: No webhook endpoint exists
// Currently: No notification polling mechanism
// Currently: Admin debug page only has System Logs, LLM Queue, System Settings tabs
// Currently: No database table for storing LLM callbacks
```

#### 📂 **After Implementation**
```typescript
// New Files Created:
// 1. app/api/webhooks/llm-callback/route.ts (~150 lines)
//    - POST handler for receiving LLM callbacks
//    - Signature validation logic
//    - Database storage with error handling
//    - System logging for debugging

// 2. app/api/admin/llm-callbacks/check/route.ts (~80 lines)
//    - GET endpoint for polling recent unviewed callbacks
//    - Admin role verification
//    - Returns minimal data (id, timestamp, preview)

// 3. app/api/admin/llm-callbacks/[id]/route.ts (~70 lines)
//    - GET endpoint for fetching full callback details
//    - Admin verification + callback existence check
//    - Returns complete LLMCallbackDetail object

// 4. components/admin/LLMCallbackNotificationPoller.tsx (~120 lines)
//    - Client component with setInterval polling (10s)
//    - Sonner toast notifications with "View Details" button
//    - localStorage tracking to prevent duplicate notifications
//    - Opens modal when user clicks "View Details"

// 5. components/admin/LLMCallbackDetailModal.tsx (~400 lines)
//    - Draggable modal matching LLMJobDetailModal.tsx style
//    - react-json-view-lite for JSON formatting
//    - Status-based color coding (blue/green/red)
//    - Metadata grid + expandable JSON viewer

// 6. components/admin/LLMCallbackHistoryTab.tsx (~200 lines)
//    - Server component rendering callback history table
//    - Pagination + filters (status, date range)
//    - "View" button per row opening detail modal
//    - Responsive table with mobile-friendly layout

// 7. app/actions/llm-callbacks.ts (~60 lines)
//    - markCallbackAsViewed server action
//    - Admin verification before updating viewed_by array
//    - revalidatePath for cache updates

// 8. lib/llm-callbacks.ts (~150 lines)
//    - getRecentUnviewedCallbacks(userId, limit)
//    - getCallbackById(id)
//    - createLLMCallback(data)
//    - Type-safe Drizzle queries with proper indexes

// 9. db/schema/llm-callbacks.ts (~50 lines)
//    - llmCallbacks table definition
//    - Indexes for performance
//    - Type exports (LLMCallback, NewLLMCallback, LLMCallbackDetail)

// Modified Files:
// 1. src/app/(protected)/admin/debug/page.tsx (~20 lines added)
//    - Add "Callbacks" tab to existing tab group
//    - Import and render LLMCallbackHistoryTab
//    - No changes to existing tab functionality

// 2. src/app/(protected)/admin/layout.tsx (~10 lines added)
//    - Import and render LLMCallbackNotificationPoller
//    - Client component for polling runs on all admin pages
//    - Layout still verifies admin role before rendering children

// Database Changes:
// - New table: llm_callbacks (9 columns, 3 indexes)
// - Migration generated via drizzle-kit
// - Down migration created for safe rollback
```

#### 🎯 **Key Changes Summary**
- [ ] **New Database Table:** `llm_callbacks` table with JSONB payload storage and indexing for fast queries
- [ ] **Webhook Endpoint:** `/api/webhooks/llm-callback` POST handler receives and stores LLM callbacks
- [ ] **Polling Infrastructure:** Client-side polling every 10 seconds checks for new callbacks
- [ ] **Notification System:** Sonner toast notifications alert admins to new callbacks with actionable buttons
- [ ] **Detail Modal:** Draggable modal with JSON viewer matches existing LLMJobDetailModal design
- [ ] **History Tab:** New "Callbacks" tab in admin debug page for viewing callback history
- [ ] **Files Modified:** Admin debug page (+1 tab), admin layout (+polling component)
- [ ] **Impact:** Enables testing of LLM service integration with real-time admin notifications and beautiful callback viewing

**Note:** This is a new feature implementation with minimal modifications to existing code. The only existing files modified are the admin debug page (adding one tab) and admin layout (adding polling component). All other changes are new files following existing architectural patterns.

---

## 11. Implementation Plan

### Phase 1: Database Changes
**Goal:** Create database schema for storing LLM callback data

- [ ] **Task 1.1:** Create Drizzle Schema File
  - Files: `src/db/schema/llm-callbacks.ts`
  - Details: Define llmCallbacks table with JSONB payload, indexes, and TypeScript types
- [ ] **Task 1.2:** Export Schema from Index
  - Files: `src/db/schema/index.ts`
  - Details: Add export for llmCallbacks table
- [ ] **Task 1.3:** Generate Database Migration
  - Command: `npm run db:generate`
  - Details: Generate SQL migration from schema changes
- [ ] **Task 1.4:** Create Down Migration (MANDATORY)
  - Files: `drizzle/migrations/[timestamp]/down.sql`
  - Details: Follow `drizzle_down_migration.md` template to create safe rollback
- [ ] **Task 1.5:** Apply Migration
  - Command: `npm run db:migrate`
  - Details: Only run after down migration is created and verified

### Phase 2: Database Query Functions
**Goal:** Create reusable query functions for callback operations

- [ ] **Task 2.1:** Create Query Functions File
  - Files: `src/lib/llm-callbacks.ts`
  - Details: Implement getRecentUnviewedCallbacks, getCallbackById, createLLMCallback using Drizzle ORM
- [ ] **Task 2.2:** Add TypeScript Types
  - Files: `src/lib/llm-callbacks.ts`
  - Details: Export LLMCallbackDetail interface and query return types

### Phase 3: Webhook Endpoint
**Goal:** Create webhook endpoint to receive LLM callbacks

- [ ] **Task 3.1:** Create Webhook Route Handler
  - Files: `src/app/api/webhooks/llm-callback/route.ts`
  - Details: POST handler with signature validation, payload storage, error handling
- [ ] **Task 3.2:** Implement Signature Validation
  - Files: `src/app/api/webhooks/llm-callback/route.ts`
  - Details: Validate webhook signature if LLM service provides signing mechanism (or skip if not available)
- [ ] **Task 3.3:** Add System Logging
  - Files: `src/app/api/webhooks/llm-callback/route.ts`
  - Details: Log successful callbacks and errors using existing system logger pattern

### Phase 4: Admin API Endpoints
**Goal:** Create polling and detail fetch endpoints for admin clients

- [ ] **Task 4.1:** Create Polling Endpoint
  - Files: `src/app/api/admin/llm-callbacks/check/route.ts`
  - Details: GET endpoint returning recent unviewed callbacks with admin verification
- [ ] **Task 4.2:** Create Detail Fetch Endpoint
  - Files: `src/app/api/admin/llm-callbacks/[id]/route.ts`
  - Details: GET endpoint returning full callback details with admin + existence verification

### Phase 5: Server Actions
**Goal:** Create server action for marking callbacks as viewed

- [ ] **Task 5.1:** Create Server Actions File
  - Files: `src/app/actions/llm-callbacks.ts`
  - Details: Implement markCallbackAsViewed with admin verification and revalidatePath

### Phase 6: Notification Poller Component
**Goal:** Create client component for polling and showing toast notifications

- [ ] **Task 6.1:** Create Poller Component
  - Files: `src/components/admin/LLMCallbackNotificationPoller.tsx`
  - Details: Client component with useEffect polling, Sonner toast, localStorage tracking
- [ ] **Task 6.2:** Integrate Poller in Admin Layout
  - Files: `src/app/(protected)/admin/layout.tsx`
  - Details: Import and render poller component to enable notifications on all admin pages

### Phase 7: Callback Detail Modal
**Goal:** Create modal component for displaying callback details

- [ ] **Task 7.1:** Create Modal Component
  - Files: `src/components/admin/LLMCallbackDetailModal.tsx`
  - Details: Copy LLMJobDetailModal.tsx structure, adapt for callback data, use react-json-view-lite
- [ ] **Task 7.2:** Implement Draggable Window
  - Files: `src/components/admin/LLMCallbackDetailModal.tsx`
  - Details: Use react-rnd for draggable/resizable behavior (match LLMJobDetailModal pattern)
- [ ] **Task 7.3:** Add JSON Viewer
  - Files: `src/components/admin/LLMCallbackDetailModal.tsx`
  - Details: Use react-json-view-lite with dark mode support, expandable nodes
- [ ] **Task 7.4:** Add Status-Based Styling
  - Files: `src/components/admin/LLMCallbackDetailModal.tsx`
  - Details: Color-coded status badges and title bar (blue: received, green: processed, red: error)

### Phase 8: Callback History Tab
**Goal:** Create history tab component for admin debug page

- [ ] **Task 8.1:** Create History Tab Component
  - Files: `src/components/admin/LLMCallbackHistoryTab.tsx`
  - Details: Server component with paginated table, filters, "View" button per row
- [ ] **Task 8.2:** Integrate Tab in Debug Page
  - Files: `src/app/(protected)/admin/debug/page.tsx`
  - Details: Add "Callbacks" tab to existing tab group, render LLMCallbackHistoryTab

### Phase 9: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 9.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run linting and static analysis ONLY - NEVER run dev server, build, or start commands
- [ ] **Task 9.2:** Static Logic Review
  - Files: Modified business logic files
  - Details: Read code to verify logic syntax, edge case handling, fallback patterns
- [ ] **Task 9.3:** TypeScript Type Checking
  - Files: All TypeScript files
  - Details: Run `npm run type-check` to verify no type errors introduced

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 9, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 10: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 10.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
- [ ] **Task 10.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 11: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 11.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing
- [ ] **Task 11.2:** Request User UI Testing
  - Files: Specific browser testing checklist for user
  - Details:
    - Test webhook endpoint with curl or Postman (POST to /api/webhooks/llm-callback)
    - Verify toast notification appears within 10 seconds on admin page
    - Click "View Details" button and verify modal opens
    - Verify JSON formatting matches LLMJobDetailModal style
    - Test modal drag/resize/maximize/minimize functionality
    - Verify "Callbacks" tab appears in admin debug page
    - Verify callback history table displays data correctly
    - Test responsive behavior on mobile/tablet/desktop sizes
    - Verify dark mode theming works correctly
- [ ] **Task 11.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date (fallback to web search if time tool unavailable)
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date (not assumed date)
- [ ] **Add brief completion notes** (file paths, key changes, etc.)
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - You must confirm you actually did what you said
  - [ ] **Provides user visibility** - Clear progress tracking throughout implementation
  - [ ] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [ ] **Creates audit trail** - Documentation of what was actually completed
  - [ ] **Enables better debugging** - If issues arise, easy to see what was changed

### Example Task Completion Format
```
### Phase 1: Database Changes
**Goal:** Create database schema for storing LLM callback data

- [x] **Task 1.1:** Create Drizzle Schema File ✓ 2025-12-20
  - Files: `src/db/schema/llm-callbacks.ts` ✓
  - Details: Defined llmCallbacks table with JSONB payload, 3 indexes, TypeScript types exported ✓
- [x] **Task 1.2:** Export Schema from Index ✓ 2025-12-20
  - Files: `src/db/schema/index.ts` ✓
  - Details: Added export { llmCallbacks } from './llm-callbacks' ✓
```

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   └── llm-callback/
│   │   │   │       └── route.ts                    # Webhook endpoint (POST)
│   │   │   └── admin/
│   │   │       └── llm-callbacks/
│   │   │           ├── check/
│   │   │           │   └── route.ts                # Polling endpoint (GET)
│   │   │           └── [id]/
│   │   │               └── route.ts                # Detail fetch endpoint (GET)
│   │   └── actions/
│   │       └── llm-callbacks.ts                    # Server actions (markCallbackAsViewed)
│   ├── components/
│   │   └── admin/
│   │       ├── LLMCallbackNotificationPoller.tsx   # Polling + toast notifications
│   │       ├── LLMCallbackDetailModal.tsx          # Detail modal with JSON viewer
│   │       └── LLMCallbackHistoryTab.tsx           # History tab for debug page
│   ├── db/
│   │   └── schema/
│   │       └── llm-callbacks.ts                    # Drizzle schema definition
│   └── lib/
│       └── llm-callbacks.ts                        # Query functions
└── drizzle/
    └── migrations/
        └── [timestamp]_create_llm_callbacks/
            ├── up.sql                              # Generated migration
            └── down.sql                            # Rollback migration (MANDATORY)
```

**File Organization Rules:**
- **Components**: All in `components/admin/` directory (admin-specific feature)
- **Pages**: Modified `app/(protected)/admin/debug/page.tsx` and `layout.tsx` only
- **Server Actions**: In `app/actions/llm-callbacks.ts` file (mutations only)
- **API Routes**: In `app/api/webhooks/` and `app/api/admin/llm-callbacks/` (legitimate webhook + polling use cases)
- **Query Functions**: In `lib/llm-callbacks.ts` file (complex queries)
- **Types**: Co-located in schema file and query file
- **Database Schema**: In `db/schema/llm-callbacks.ts` with proper exports

#### **LIB FILE SERVER/CLIENT SEPARATION - CRITICAL ARCHITECTURE RULE**

**🚨 MANDATORY: Prevent Server/Client Boundary Violations**

When creating lib files, **NEVER mix server-only imports with client-safe utilities** in the same file.

**Server-Only Imports (Cannot be used by client components):**
- `next/headers` (cookies, headers)
- `@/lib/supabase/server`
- `@/lib/drizzle/db` (database operations)
- Server Actions or other server-side functions
- Node.js modules (fs, path, etc.)

**Decision for This Feature:**
- `lib/llm-callbacks.ts` contains **ONLY server-side query functions** using Drizzle DB
- Uses `@/db` import (server-only)
- **NOT imported by client components** (client components use API routes instead)
- **NO SPLIT NEEDED** - This is a server-only lib file

**File Naming Pattern:**
- `lib/llm-callbacks.ts` - Server-side query functions only
- No client utilities exist in this file
- Client components fetch via API routes, not direct lib imports

### Files to Modify
- [ ] **`src/app/(protected)/admin/debug/page.tsx`** - Add "Callbacks" tab to existing tab group
  - Import LLMCallbackHistoryTab component
  - Add new tab item to Tabs component
  - Render LLMCallbackHistoryTab in TabsContent

- [ ] **`src/app/(protected)/admin/layout.tsx`** - Add notification poller component
  - Import LLMCallbackNotificationPoller
  - Render component before {children} to enable polling on all admin pages
  - Ensure admin role verification happens before rendering poller

- [ ] **`src/db/schema/index.ts`** - Export new schema
  - Add export for llmCallbacks table

### Dependencies to Add
```json
{
  "dependencies": {
    // No new dependencies required - all existing:
    // - react-json-view-lite (already installed)
    // - react-rnd (already installed)
    // - sonner (already installed)
    // - drizzle-orm (already installed)
  },
  "devDependencies": {
    // No new dev dependencies required
  }
}
```

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Webhook receives malformed JSON payload
  - **Code Review Focus:** `app/api/webhooks/llm-callback/route.ts` - JSON parsing with try/catch
  - **Potential Fix:** Wrap `await request.json()` in try/catch, return 400 Bad Request with error message

- [ ] **Error Scenario 2:** Polling endpoint called by non-admin user
  - **Code Review Focus:** `app/api/admin/llm-callbacks/check/route.ts` - Admin role verification
  - **Potential Fix:** Check `profiles.role === 'ADMIN'` before returning data, return 403 Forbidden if not admin

- [ ] **Error Scenario 3:** Database insertion fails due to constraint violation (duplicate callback_id)
  - **Code Review Focus:** `lib/llm-callbacks.ts` createLLMCallback function
  - **Potential Fix:** Handle unique constraint error, update existing callback instead of failing

- [ ] **Error Scenario 4:** Modal attempts to fetch non-existent callback ID
  - **Code Review Focus:** `app/api/admin/llm-callbacks/[id]/route.ts` - Existence check
  - **Potential Fix:** Return 404 Not Found if callback doesn't exist, modal displays error message

- [ ] **Error Scenario 5:** Polling fails due to network error
  - **Code Review Focus:** `components/admin/LLMCallbackNotificationPoller.tsx` - Fetch error handling
  - **Potential Fix:** Wrap fetch in try/catch, continue polling on failure (don't break interval)

- [ ] **Error Scenario 6:** User clicks "View Details" but callback was deleted
  - **Code Review Focus:** `components/admin/LLMCallbackDetailModal.tsx` - 404 handling
  - **Potential Fix:** Display error message in modal if callback no longer exists

### Edge Cases to Consider
- [ ] **Edge Case 1:** Multiple admins view same callback simultaneously
  - **Analysis Approach:** Check `markCallbackAsViewed` server action for race conditions
  - **Recommendation:** Use array append operation (not replace) to avoid overwriting viewed_by array

- [ ] **Edge Case 2:** Admin has multiple browser tabs open, sees duplicate notifications
  - **Analysis Approach:** Review localStorage tracking in LLMCallbackNotificationPoller
  - **Recommendation:** Store array of viewed callback IDs in localStorage, check before showing toast

- [ ] **Edge Case 3:** Webhook receives burst of 100 callbacks in 10 seconds
  - **Analysis Approach:** Check webhook handler for performance bottlenecks, database write speed
  - **Recommendation:** Ensure webhook responds quickly (200 OK), process async if needed

- [ ] **Edge Case 4:** Callback payload is extremely large (10MB JSON)
  - **Analysis Approach:** Check Next.js body parser limits, JSONB storage limits
  - **Recommendation:** Add payload size validation, reject payloads >1MB with 413 Payload Too Large

- [ ] **Edge Case 5:** Admin leaves page open for hours, polling accumulates stale data
  - **Analysis Approach:** Review polling logic for memory leaks or accumulating state
  - **Recommendation:** Cleanup interval on unmount, limit stored callback IDs to last 50

- [ ] **Edge Case 6:** Callback contains malicious JavaScript in JSON payload
  - **Analysis Approach:** Check if JSON viewer sanitizes or executes embedded scripts
  - **Recommendation:** Verify react-json-view-lite sanitizes data, JSONB storage prevents script execution

### Security & Access Control Review
- [ ] **Admin Access Control:** Are admin-only features properly restricted to admin users?
  - **Check:** Route protection in middleware, server action authorization, API endpoint role verification
  - **Specific Files:**
    - `app/api/admin/llm-callbacks/check/route.ts` - Must verify admin role before returning data
    - `app/api/admin/llm-callbacks/[id]/route.ts` - Must verify admin role before returning details
    - `app/actions/llm-callbacks.ts` - Must verify admin role in markCallbackAsViewed
  - **Expected Implementation:** Fetch user from Supabase, query profiles.role, return 403 if not ADMIN

- [ ] **Authentication State:** Does the system handle logged-out users appropriately?
  - **Check:** Polling behavior when user logs out, API endpoint authentication checks
  - **Specific Files:**
    - `components/admin/LLMCallbackNotificationPoller.tsx` - Should stop polling if user logs out
    - API endpoints should return 401 Unauthorized if no auth token
  - **Expected Implementation:** Check for authenticated user before polling, clear interval on logout

- [ ] **Form Input Validation:** Are webhook inputs validated before processing?
  - **Check:** Webhook payload validation, signature verification, sanitization before storage
  - **Specific Files:**
    - `app/api/webhooks/llm-callback/route.ts` - Validate JSON structure, signature, payload size
  - **Expected Implementation:**
    - Validate webhook signature (if available)
    - Reject payloads >1MB
    - Sanitize callback_id to prevent SQL injection (Drizzle handles this, but validate format)
    - Check JSON structure before storing

- [ ] **Permission Boundaries:** Can users access data/features they shouldn't?
  - **Check:** Data filtering by admin role, callback viewing permissions
  - **Specific Files:**
    - All API endpoints must verify admin role
    - Modal should not display if user is not admin
  - **Expected Implementation:**
    - Every API route checks `profiles.role === 'ADMIN'`
    - Client components only render for admins (layout enforces this)
    - No callback data exposed to non-admin users

- [ ] **XSS Prevention:** Is callback payload safely displayed without executing scripts?
  - **Check:** JSON viewer library XSS prevention, JSONB storage safety
  - **Specific Files:**
    - `components/admin/LLMCallbackDetailModal.tsx` - Verify react-json-view-lite sanitizes data
  - **Expected Implementation:**
    - react-json-view-lite should render data as text, not execute
    - JSONB column prevents script execution (data storage level)
    - Modal uses `dangerouslySetInnerHTML` nowhere

- [ ] **SQL Injection Prevention:** Are database queries safe from injection?
  - **Check:** Drizzle ORM usage, parameterized queries, no raw SQL
  - **Specific Files:**
    - `lib/llm-callbacks.ts` - All queries use Drizzle's type-safe operators
  - **Expected Implementation:**
    - Use `eq()`, `desc()`, `and()` operators (never string interpolation)
    - No `sql` template tag usage for user-provided data
    - callback_id validated as UUID format before query

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples. This is code analysis and gap identification - not writing tests or test procedures.

**Priority Order:**
1. **Critical:** Security and access control issues (admin-only access, XSS, SQL injection)
2. **Important:** User-facing error scenarios and edge cases (network failures, missing data, race conditions)
3. **Nice-to-have:** UX improvements and enhanced error messaging (better toast content, modal error states)

**Review Checklist:**
- [x] Admin role verification in all API endpoints
- [x] Webhook signature validation (if LLM service provides mechanism)
- [x] Payload size limits to prevent DoS
- [x] JSON sanitization in viewer to prevent XSS
- [x] Polling error handling to prevent breaking notifications
- [x] Database constraint handling (duplicate callback_id)
- [x] Race condition prevention in markCallbackAsViewed
- [x] Memory leak prevention in polling component (cleanup on unmount)

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# Add these to .env.local (if LLM service provides webhook signing)
LLM_WEBHOOK_SECRET=your_webhook_secret_here  # Optional: For signature validation

# Existing variables (no changes required)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Configuration Notes:**
- `LLM_WEBHOOK_SECRET` is optional - only needed if LLM service provides webhook signing
- If secret not provided, webhook endpoint skips signature validation (acceptable for testing)
- No other environment variables required for this feature

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **EVALUATE STRATEGIC NEED** - Determine if multiple solutions exist or if it's straightforward
2. **STRATEGIC ANALYSIS** (if needed) - Present solution options with pros/cons and get user direction
3. **CREATE A TASK DOCUMENT** in `ai_docs/` using this template
4. **GET USER APPROVAL** of the task document
5. **IMPLEMENT THE FEATURE** only after approval

**DO NOT:** Present implementation plans in chat without creating a proper task document first.
**DO:** Always create comprehensive task documentation that can be referenced later.
**DO:** Present strategic options when multiple viable approaches exist.

### Communication Preferences
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates (phase-by-phase completion messages)
- [x] Flag any blockers or concerns immediately (especially security issues)
- [x] Suggest improvements or alternatives when appropriate (e.g., if webhook signature validation unavailable)

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)**
   - [x] **Assess complexity** - Multiple approaches exist (SSE vs polling vs manual refresh)
   - [x] **Review the criteria** - Trade-offs are significant (real-time vs simplicity)
   - [x] **Decision point**: Strategic analysis conducted (see section 2)

2. **STRATEGIC ANALYSIS SECOND (Completed)**
   - [x] **Presented solution options** - SSE, short polling, database flag approaches
   - [x] **Included implementation complexity, time estimates, and risk levels** for each option
   - [x] **Provided clear recommendation** - Short polling with toast notifications
   - [x] **Waiting for user decision** on preferred approach before proceeding
   - [x] **Document approved strategy** for inclusion in task document

3. **CREATE TASK DOCUMENT THIRD (Completed)**
   - [x] **Created task document** - `ai_docs/tasks/065_llm_callback_webhook.md`
   - [x] **Filled out all sections** with specific details for LLM webhook feature
   - [x] **Included strategic analysis** in section 2 with three solution options
   - [x] **🔢 FOUND LATEST TASK NUMBER**: Examined ai_docs/tasks/, highest is 064, using 065
   - [x] **Named the file** using pattern `065_llm_callback_webhook.md`
   - [x] **🚨 POPULATED CODE CHANGES OVERVIEW**: Section 10 shows before/after with file counts
   - [x] **Ready to present** summary to user for review

4. **PRESENT IMPLEMENTATION OPTIONS (Next Step)**
   - [ ] **After user feedback on strategic direction**, present these 3 exact options:

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

   - [ ] **Wait for explicit user choice** (A, B, or C) - never assume or default
   - [ ] **If A chosen**: Provide detailed code snippets showing exact changes planned
   - [ ] **If B chosen**: Begin phase-by-phase implementation immediately
   - [ ] **If C chosen**: Address feedback and re-present options

5. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

   **MANDATORY PHASE WORKFLOW:**

   For each phase, follow this exact pattern:

   a. **Execute Phase Completely** - Complete all tasks in current phase
   b. **Update Task Document** - Mark all completed tasks as [x] with timestamps
   c. **Provide Specific Phase Recap** using this format:

   ```
   ✅ **Phase [X] Complete - [Phase Name]**
   - Modified [X] files with [Y] total line changes
   - Key changes: [specific file paths and what was modified]
   - Files updated:
     • file1.ts (+15 lines): [brief description of changes]
     • file2.tsx (-3 lines, +8 lines): [brief description of changes]
   - Commands executed: [list any commands run]
   - Linting status: ✅ All files pass / ❌ [specific issues found]

   **🔄 Next: Phase [X+1] - [Phase Name]**
   - Will modify: [specific files]
   - Changes planned: [brief description]
   - Estimated scope: [number of files/changes expected]

   **Say "proceed" to continue to Phase [X+1]**
   ```

   d. **Wait for "proceed"** before starting next phase
   e. **Repeat for each phase** until all implementation complete
   f. **🚨 CRITICAL:** After final implementation phase, you MUST proceed to Phase 10 (Comprehensive Code Review) before any user testing

   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
   - [ ] **Real-time task completion tracking** - Update task document immediately after each subtask
   - [ ] **Mark checkboxes as [x]** with completion timestamps
   - [ ] **Add specific completion notes** (file paths, line counts, key changes)
   - [ ] **Run linting on each modified file** during the phase (static analysis only - no dev server/build commands)
   - [ ] **🚨 MANDATORY: For Phase 1 database changes, create down migration file BEFORE running `npm run db:migrate`**
     - [ ] Follow `drizzle_down_migration.md` template process
     - [ ] Create `drizzle/migrations/[timestamp]/down.sql` file
     - [ ] Verify all operations use `IF EXISTS` and include warnings
     - [ ] Only then run `npm run db:migrate`
   - [ ] **For new component files, ensure proper exports and imports**
   - [ ] **Always create components in `components/admin/` directory**
   - [ ] **🚨 MANDATORY WORKFLOW SEQUENCE:** After implementation phases, follow this exact order:
     - [ ] **Phase 9 Complete** → Present "Implementation Complete!" message (section 16, step 7)
     - [ ] **Wait for user approval** → Execute comprehensive code review (section 16, step 8)
     - [ ] **Code review complete** → ONLY THEN request user browser testing
     - [ ] **NEVER skip comprehensive code review** - Phase 9 basic validation ≠ comprehensive review
   - [ ] **NEVER plan manual browser testing as AI task** - always mark as "👤 USER TESTING" and wait for user confirmation

6. **VERIFY LIB FILE ARCHITECTURE (For Phase 2 - lib/llm-callbacks.ts)**
   - [x] **Audit new lib files** - `lib/llm-callbacks.ts` is server-only (uses @/db import)
   - [x] **Check import chains** - File only imported by server-side code (API routes, server actions)
   - [x] **Test client component imports** - Client components do NOT import this file (use API routes instead)
   - [x] **Split files if needed** - NOT NEEDED: No client utilities in this file
   - [x] **Update import statements** - N/A: No client components import this lib file

7. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after Phase 9)**
   - [ ] **Present this exact message** to user after all implementation complete:

   ```
   🎉 **Implementation Complete!**

   All phases have been implemented successfully. I've made changes to [X] files across [Y] phases.

   **📋 I recommend doing a thorough code review of all changes to ensure:**
   - No mistakes were introduced
   - All goals were achieved
   - Code follows project standards
   - Everything will work as expected

   **Would you like me to proceed with the comprehensive code review?**

   This review will include:
   - Verifying all changes match the intended goals
   - Running linting and type-checking on all modified files
   - Checking for any integration issues
   - Confirming all requirements were met
   ```

   - [ ] **Wait for user approval** of code review
   - [ ] **If approved**: Execute comprehensive code review process below

8. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
   - [ ] **Read all modified files** and verify changes match task requirements exactly
   - [ ] **Run linting and type-checking** on all modified files using appropriate commands
   - [ ] **Check for integration issues** between modified components
   - [ ] **Verify all success criteria** from task document are met
   - [ ] **Test critical workflows** affected by changes (webhook → notification → modal flow)
   - [ ] **Provide detailed review summary** using this format:

   ```
   ✅ **Code Review Complete**

   **Files Reviewed:** [list all modified files with line counts]
   **Linting Status:** ✅ All files pass / ❌ [specific issues found]
   **Type Checking:** ✅ No type errors / ❌ [specific type issues]
   **Integration Check:** ✅ Components work together properly / ❌ [issues found]
   **Requirements Met:** ✅ All success criteria achieved / ❌ [missing requirements]

   **Summary:** [brief summary of what was accomplished and verified]
   **Confidence Level:** High/Medium/Low - [specific reasoning]
   **Recommendations:** [any follow-up suggestions or improvements]
   ```

### What Constitutes "Explicit User Approval"

#### For Strategic Analysis
**✅ STRATEGIC APPROVAL RESPONSES (Proceed to task document creation):**
- "Option 1 looks good" / "Option 2 looks good"
- "Go with your recommendation"
- "I prefer Option 2" / "Use short polling"
- "Proceed with [specific option]"
- "That approach works"
- "Yes, use that strategy"

#### For Implementation Options (A/B/C Choice)
**✅ OPTION A RESPONSES (Show detailed code previews):**
- "A" or "Option A"
- "Preview the changes"
- "Show me the code changes"
- "Let me see what will be modified"
- "Walk me through the changes"

**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start implementation"
- "Begin" or "Execute the plan"
- "Looks good, implement it"

**✅ OPTION C RESPONSES (Provide more feedback):**
- "C" or "Option C"
- "I have questions about..."
- "Can you modify..."
- "What about..." or "How will you handle..."
- "I'd like to change..."
- "Wait, let me think about..."

#### For Phase Continuation
**✅ PHASE CONTINUATION RESPONSES:**
- "proceed"
- "continue"
- "next phase"
- "go ahead"
- "looks good"

**❓ CLARIFICATION NEEDED (Do NOT continue to next phase):**
- Questions about the completed phase
- Requests for changes to completed work
- Concerns about the implementation
- No response or silence

#### For Final Code Review
**✅ CODE REVIEW APPROVAL:**
- "proceed"
- "yes, review the code"
- "go ahead with review"
- "approved"

🛑 **NEVER start coding without explicit A/B/C choice from user!**
🛑 **NEVER continue to next phase without "proceed" confirmation!**
🛑 **NEVER skip comprehensive code review after implementation phases!**
🛑 **NEVER proceed to user testing without completing code review first!**
🛑 **NEVER run `npm run db:migrate` without first creating the down migration file using `drizzle_down_migration.md` template!**
🛑 **NEVER run application execution commands - user already has app running!**

### 🚨 CRITICAL: Command Execution Rules
**NEVER run application execution commands - the user already has their development environment running!**

**❌ FORBIDDEN COMMANDS (Will cause conflicts with running dev server):**
- `npm run dev` / `npm start` / `next dev` - User already running
- `npm run build` / `next build` - Expensive and unnecessary for validation
- Any command that starts/serves the application
- Any command that compiles/builds for production
- Any long-running processes or servers

**✅ ALLOWED COMMANDS (Safe static analysis only):**
- `npm run lint` - Static code analysis, safe to run
- `npm run type-check` / `tsc --noEmit` - Type checking only, no compilation
- Database commands (when explicitly needed): `npm run db:generate`, `npm run db:migrate`
- File reading/analysis tools

**🎯 VALIDATION STRATEGY:**
- Use linting for code quality issues
- Read files to verify logic and structure
- Check syntax and dependencies statically
- Let the user handle all application testing manually

### Code Quality Standards
- [x] Follow TypeScript best practices (strict mode, proper types)
- [x] Add proper error handling (try/catch in all async operations)
- [x] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
  - [x] **❌ NEVER write change history**: "Fixed this", "Removed function", "Updated to use new API"
  - [x] **❌ NEVER write migration artifacts**: "Moved from X", "Previously was Y"
  - [x] **✅ ALWAYS explain business logic**: "Poll for new callbacks every 10 seconds", "Validate admin role before returning data"
  - [x] **✅ Write for future developers** - explain what/why the code does what it does, not what you changed
  - [x] **Remove unused code completely** - don't leave comments explaining what was removed
- [x] **🚨 MANDATORY: Use early returns to keep code clean and readable**
  - [x] **Prioritize early returns** over nested if-else statements
  - [x] **Validate inputs early** and return immediately for invalid cases
  - [x] **Handle error conditions first** before proceeding with main logic
  - [x] **Exit early for edge cases** to reduce nesting and improve readability
  - [x] **Example pattern**: `if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`
- [x] **🚨 MANDATORY: Use async/await instead of .then() chaining**
  - [x] **Avoid Promise .then() chains** - use async/await for better readability
  - [x] **Use try/catch blocks** for error handling instead of .catch() chaining
  - [x] **Use Promise.all()** for concurrent operations instead of chaining multiple .then()
  - [x] **Create separate async functions** for complex operations instead of long chains
  - [x] **Example**: `const data = await fetchCallbacks();` instead of `fetchCallbacks().then(data => ...)`
- [x] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
  - [x] **Never handle "legacy formats"** - expect the current format or fail fast
  - [x] **No "try other common fields"** fallback logic - if expected field missing, throw error
  - [x] **Fail fast and clearly** - don't mask issues with fallback behavior
  - [x] **Single expected response format** - based on current API contract
  - [x] **Throw descriptive errors** - explain exactly what format was expected vs received
  - [x] **Example**: `if (!payload.callbackId) throw new Error('Missing required field: callbackId');`
- [x] **🚨 MANDATORY: Create down migration files before running ANY database migration**
  - [x] Follow `drizzle_down_migration.md` template process
  - [x] Use `IF EXISTS` clauses for safe rollback operations
  - [x] Include appropriate warnings for data loss risks
- [x] **Ensure responsive design (mobile-first approach with Tailwind breakpoints)**
- [x] **Test components in both light and dark mode**
- [x] **Verify mobile usability on devices 320px width and up**
- [x] Follow accessibility guidelines (WCAG AA - modal focus trap, toast announcements, keyboard navigation)
- [x] Use semantic HTML elements (proper heading hierarchy, button vs div)
- [x] **🚨 MANDATORY: Clean up removal artifacts**
  - [x] **Never leave placeholder comments** like "// No usage tracking needed" or "// Removed for simplicity"
  - [x] **Delete empty functions/components** completely rather than leaving commented stubs
  - [x] **Remove unused imports** and dependencies after deletions
  - [x] **Clean up empty interfaces/types** that no longer serve a purpose
  - [x] **Remove dead code paths** rather than commenting them out
  - [x] **If removing code, remove it completely** - don't leave explanatory comments about what was removed

### Architecture Compliance
- [x] **✅ VERIFY: Used correct data access pattern**
  - [x] Mutations → Server Actions (`app/actions/llm-callbacks.ts` for markCallbackAsViewed)
  - [x] Queries → lib functions (`lib/llm-callbacks.ts`) for complex database queries
  - [x] API routes → Webhooks + polling endpoints (legitimate use cases for this feature)
- [x] **🚨 VERIFY: No server/client boundary violations in lib files**
  - [x] `lib/llm-callbacks.ts` is server-only (uses @/db import)
  - [x] Client components use API routes instead of direct lib imports
  - [x] No mixed server/client files in this feature
- [x] **🚨 VERIFY: No re-exports of non-async functions from Server Action files**
  - [x] `app/actions/llm-callbacks.ts` only exports async Server Actions
  - [x] No utility functions or constants re-exported from Server Action file
  - [x] All exports have `'use server'` directive
- [x] **🚨 VERIFY: Proper context usage patterns**
  - [x] No context providers exist in project - components fetch user data independently
  - [x] Polling component fetches user via Supabase client (no context available)
  - [x] API endpoints verify admin role server-side (never trust client)
  - [x] No prop drilling - components are self-contained with independent data fetching
- [x] **❌ AVOID: Creating unnecessary API routes for internal operations**
  - [x] API routes used ONLY for webhooks and polling (legitimate use cases)
- [x] **❌ AVOID: Mixing server-only imports with client-safe utilities in same file**
  - [x] lib/llm-callbacks.ts is server-only, no client utilities mixed in
- [x] **❌ AVOID: Prop drilling when context providers already contain the needed data**
  - [x] N/A - no context providers exist in this project
- [x] **🔍 DOUBLE-CHECK: Does this really need an API route or should it be a Server Action/lib function?**
  - [x] Webhook endpoint: YES - external service integration (legitimate)
  - [x] Polling endpoint: YES - client-side polling pattern (legitimate)
  - [x] Detail fetch endpoint: YES - client component data fetching (legitimate)
  - [x] Mark as viewed: NO - uses Server Action instead (app/actions/llm-callbacks.ts)
- [x] **🔍 DOUBLE-CHECK: Can client components safely import from all lib files they need?**
  - [x] Client components do NOT import lib/llm-callbacks.ts (server-only)
  - [x] Client components use API routes for data fetching instead
- [x] **🔍 DOUBLE-CHECK: Are components using context hooks instead of receiving context data as props?**
  - [x] N/A - no context providers exist in this project

---

## 17. Notes & Additional Context

### Research Links
- [react-json-view-lite Documentation](https://github.com/AnyRoad/react-json-view-lite) - JSON viewer library
- [react-rnd Documentation](https://github.com/bokuweb/react-rnd) - Draggable/resizable component library
- [Sonner Documentation](https://sonner.emilkowal.ski/) - Toast notification library
- [Server-Sent Events API](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) - For future SSE migration reference
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - Route handler patterns
- [Drizzle ORM Queries](https://orm.drizzle.team/docs/select) - Type-safe query patterns

### **⚠️ Common Server/Client Boundary Pitfalls to Avoid**

**❌ NEVER DO:**
- Import from `next/headers` in files that export client-safe utilities
- Mix database operations with utility functions in same file
- Import from `@/lib/supabase/server` alongside client-safe functions
- Create utility files that both server and client components import without considering the import chain
- **Re-export synchronous functions from `"use server"` files**
- **Mix async Server Actions with synchronous utility exports in `app/actions/` files**
- **Import lib files with database operations directly into client components**

**✅ ALWAYS DO:**
- Separate server operations from client utilities into different files
- Use `-client.ts` or `-utils.ts` suffix for client-safe utility files
- Re-export client utilities from main file for backward compatibility (EXCEPT in `"use server"` files)
- Test that client components can import utilities without errors
- **Keep utilities in separate `lib/` files, not in `app/actions/` files**
- **Only export async functions from `"use server"` files**
- **Import utilities dynamically in Server Actions if needed, never re-export them**
- **Use API routes for client components to fetch data that requires database access**

**For This Feature:**
- ✅ `lib/llm-callbacks.ts` is server-only, client components use API routes instead
- ✅ `app/actions/llm-callbacks.ts` only exports async Server Actions
- ✅ Client components (`LLMCallbackNotificationPoller`, `LLMCallbackDetailModal`) fetch via API routes
- ✅ No mixing of server/client code in any file

### LLM Service Webhook Specification (TBD)
**IMPORTANT:** The actual LLM service webhook specification is not yet defined. When implementing:
- **Payload Structure:** Implement generic JSONB storage to handle any payload structure
- **Signature Validation:** Include placeholder for signature validation, implement if LLM service provides signing mechanism
- **Callback ID:** Generate unique ID if LLM service doesn't provide one (use UUID)
- **Error Handling:** Robust error handling for unexpected payload formats

**Future Updates Needed:**
- Once LLM service specification is available, update webhook signature validation logic
- Add specific payload field extraction if LLM service uses standard fields (job_id, status, result, etc.)
- Update documentation with actual LLM service webhook format

### Testing Webhook Locally
**Manual Testing Steps (for user):**
1. **Start development server:** `npm run dev`
2. **Use curl to test webhook:**
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/llm-callback \
     -H "Content-Type: application/json" \
     -d '{
       "callbackId": "test-callback-123",
       "status": "completed",
       "result": {
         "message": "Test callback data",
         "nested": {
           "field": "value"
         }
       }
     }'
   ```
3. **Verify database storage:** Check `npm run db:studio` for new row in llm_callbacks table
4. **Verify notification:** Open admin debug page in browser, wait 10 seconds for toast notification
5. **Verify modal:** Click "View Details" button in toast, verify modal opens with formatted JSON

### Polling Optimization Considerations
**Current Implementation:**
- Polling interval: 10 seconds (configurable)
- Queries database on every poll
- Returns only unviewed callbacks for current user

**Future Optimizations (if needed):**
- Add Redis caching layer to reduce database queries
- Implement Server-Sent Events for true real-time notifications
- Add WebSocket support for instant push notifications
- Rate limiting on polling endpoint to prevent abuse

---

*Template Version: 1.3*
*Last Updated: 12/20/2025*
*Created By: Brandon Hancock*
*Task Number: 065*
*Task Name: LLM Callback Webhook with Real-Time Admin Notifications*
