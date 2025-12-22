# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** LLM System Menu - Consolidated AI Administration Interface

### Goal Statement
**Goal:** Create a new dedicated "LLM System" menu item in the admin dashboard that consolidates all AI-related administration features into a unified tabbed interface. This will improve the discoverability and organization of AI monitoring tools by grouping AI Usage/Costs, LLM Queue Management, and Webhook Callback History into a single, cohesive interface accessible from the admin dashboard quick actions.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
<!-- AI Agent: This task has a clear implementation path - restructuring existing pages into a tabbed layout with new routes. Strategic analysis is not needed as the user has already specified the exact structure they want. Skip to implementation planning. -->

**✅ SKIP STRATEGIC ANALYSIS** - Clear requirements, straightforward implementation approach.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS v4 for styling
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Components:**
  - `src/app/(protected)/admin/ai-usage/page.tsx` - AI usage and costs dashboard (to be moved to `/admin/ai`)
  - `src/app/(protected)/admin/debug/LLMQueueTab.tsx` - LLM queue management tab component (to be extracted to `/admin/ai/queue`)
  - `src/app/(protected)/admin/debug/LLMCallbackHistoryTab.tsx` - Webhook callback history (to be integrated as third tab)
  - `src/components/admin/QuickActions.tsx` - Dashboard quick action menu (needs new LLM System link)
  - `src/components/admin/smart-table/` - SmartTable component with sorting, filtering, drag-drop columns, localStorage persistence

### Current State
**Existing Structure:**
- AI Usage dashboard lives at `/admin/ai-usage` with comprehensive cost/token tracking
- LLM Queue management exists as a tab within `/admin/debug` page
- Webhook callback history exists as another tab within `/admin/debug` page
- Debug page has 8 tabs total (settings, activity, logs, llm-queue, callbacks, health, email, cache)
- QuickActions component provides navigation shortcuts from admin dashboard

**What needs to change:**
1. Move AI Usage from `/admin/ai-usage` to `/admin/ai` (new route)
2. Extract LLM Queue tab to standalone page at `/admin/ai/queue`
3. Move Webhook Callbacks tab to `/admin/ai/webhooks` (new third tab)
4. Create tabbed layout at `/admin/ai` with three tabs (Overview, Queue, Webhooks)
5. Add "LLM System" quick action to admin dashboard
6. Update navigation references and remove tabs from debug page

### Existing Context Providers Analysis
- **UserContext (`useUser()`):** Available in protected routes, provides user authentication state
- **UsageContext (`useUsage()`):** Not currently used by AI monitoring pages
- **Context Hierarchy:** `/admin/layout.tsx` provides admin authentication, `LLMCallbackNotificationPoller` component
- **Available Context Hooks:** Standard auth context only

**🔍 Context Coverage Analysis:**
- AI Usage page uses server-side data fetching (no client context needed)
- LLM Queue uses client-side state management and polling
- Webhook Callbacks uses client-side state management
- No context gaps identified - components are self-contained

## 4. Context & Problem Definition

### Problem Statement
Currently, AI administration features are scattered across different routes (`/admin/ai-usage`, `/admin/debug`), making them harder to discover and navigate. The debug page is overloaded with 8 tabs, mixing unrelated concerns (email testing, cache management, AI monitoring). Users need a dedicated, purpose-built interface for AI system administration that groups related functionality together.

### Success Criteria
- [x] New "LLM System" menu item appears in admin dashboard quick actions
- [x] `/admin/ai` route displays tabbed interface with three tabs
- [x] Tab 1 (Overview): Shows AI usage and costs (moved from `/admin/ai-usage`)
- [x] Tab 2 (Queue): Shows LLM queue management (moved from `/admin/debug`)
- [x] Tab 3 (Webhooks): Shows webhook callback history with SmartTable features
- [x] All SmartTable features working: sorting, filtering, drag-drop columns, localStorage persistence
- [x] Webhooks tab exposes all database fields from `llm_callbacks` table
- [x] Clicking webhook row opens detail modal (similar to LLM Queue job detail modal)
- [x] Debug page no longer shows LLM Queue or Callbacks tabs
- [x] All existing functionality preserved (no regressions)

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements
- **FR1:** User can access "LLM System" from admin dashboard quick actions
- **FR2:** `/admin/ai` displays tabbed layout with three tabs (Overview, Queue, Webhooks)
- **FR3:** Overview tab shows existing AI usage/costs dashboard content
- **FR4:** Queue tab shows existing LLM queue management functionality
- **FR5:** Webhooks tab displays all webhook callbacks with SmartTable interface
- **FR6:** Webhooks table includes all fields: id, callbackId, signatureValid, signatureHeader, verifiedAt, payload, payloadPreview, externalJobId, workflowName, eventType, createdAt, updatedAt
- **FR7:** Clicking webhook row opens detail modal showing full payload and metadata
- **FR8:** SmartTable features work: column sorting, text/date filtering, drag-drop reordering, column visibility toggle, localStorage preferences
- **FR9:** Tab state persists via URL query parameter (`?tab=overview|queue|webhooks`)

### Non-Functional Requirements
- **Performance:** Page load <500ms, SmartTable rendering <200ms for 100 rows
- **Security:** Admin-only access enforced by existing layout authentication
- **Usability:** Clear tab labels, intuitive navigation, consistent with existing admin UI
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works in all modern browsers (Chrome, Firefox, Safari, Edge)

### Technical Constraints
- Must use existing SmartTable component (no reinventing the wheel)
- Must follow existing admin page patterns (layout, styling, navigation)
- Must preserve all existing LLM Queue functionality (polling, filtering, bulk delete)
- Cannot modify database schema (use existing `llm_callbacks` table)

---

## 7. Data & Database Changes

### Database Schema Changes
**No database changes required** - using existing `llm_callbacks` table from `src/db/schema/llm-callbacks.ts`

### Data Model Updates
**No schema updates needed** - all required fields already exist in `llm_callbacks` table:
```typescript
// Existing schema (reference only - no changes)
export const llmCallbacks = pgTable('llm_callbacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  callbackId: text('callback_id').notNull().unique(),
  signatureValid: boolean('signature_valid').notNull().default(false),
  signatureHeader: text('signature_header'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  payload: jsonb('payload').notNull(),
  payloadPreview: text('payload_preview'),
  externalJobId: text('external_job_id'),
  workflowName: text('workflow_name'),
  eventType: text('event_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### Data Migration Plan
**No migration required** - purely UI reorganization

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

#### **QUERIES (Data Fetching)** → Use existing server actions

**Existing Server Actions (Reference):**
- `src/app/(protected)/admin/debug/actions.ts` - Contains `fetchLLMHealth()`, `fetchLLMJobs()`, `bulkDeleteLLMJobs()`
- Will need new action: `fetchLLMCallbacks()` for webhook history retrieval

**New Query Functions Needed:**
- [ ] `fetchLLMCallbacks(filters, limit)` - Server action to fetch webhook callback history with filtering

### Server Actions
- [ ] **`fetchLLMCallbacks`** - Fetch webhook callbacks with status/date filtering and pagination
- [ ] **`getLLMCallbackDetail`** - Fetch full webhook callback details for modal display
- [ ] **Reuse existing:** `fetchLLMHealth()`, `fetchLLMJobs()`, `bulkDeleteLLMJobs()` from debug actions

### Database Queries
- [ ] **Query Functions in lib/queries/llm-callbacks.ts** - Complex queries for webhook analytics (if needed later)
- [ ] **Direct in Server Actions** - Simple webhook fetching with filters

### API Routes (Only for Special Cases)
**No API routes needed** - All data operations handled via Server Actions

### External Integrations
**None required** - Using existing LLM service integration

---

## 9. Frontend Changes

### New Components
- [ ] **`src/app/(protected)/admin/ai/layout.tsx`** - Tabbed layout wrapper for LLM System pages
- [ ] **`src/app/(protected)/admin/ai/page.tsx`** - Overview tab (AI usage dashboard, moved from `/admin/ai-usage`)
- [ ] **`src/app/(protected)/admin/ai/queue/page.tsx`** - Queue tab (extracted from debug page)
- [ ] **`src/app/(protected)/admin/ai/webhooks/page.tsx`** - New webhooks tab with SmartTable
- [ ] **`src/components/admin/ai/WebhookDetailModal.tsx`** - Modal component for webhook details (similar to LLMJobDetailModal)
- [ ] **`src/components/admin/ai/WebhooksTab.tsx`** - Client component for webhooks table with SmartTable

**Component Organization Pattern:**
- Use `components/admin/ai/` directory for AI-specific admin components
- Keep shared SmartTable in `components/admin/smart-table/` (existing)
- Import existing AI usage card components from `components/admin/`

**Component Requirements:**
- **Responsive Design:** Mobile-first with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- **Theme Support:** CSS variables for colors, `dark:` classes for dark mode
- **Accessibility:** WCAG AA guidelines, ARIA labels, keyboard navigation
- **Text Sizing:** Main content `text-base` (16px+), metadata `text-sm` (14px), labels `text-xs` (12px)

### Page Updates
- [ ] **`src/app/(protected)/admin/page.tsx`** - No changes (just reference point)
- [ ] **`src/components/admin/QuickActions.tsx`** - Add "LLM System" quick action linking to `/admin/ai`
- [ ] **`src/app/(protected)/admin/debug/page.tsx`** - Remove `llm-queue` and `callbacks` tabs from TabsList and TabsContent

### State Management
- **Tab State:** URL query parameter (`?tab=overview|queue|webhooks`) managed by Next.js router
- **SmartTable State:** LocalStorage persistence via `localStorageKey` prop (per-tab unique keys)
- **Webhook Polling:** Client-side polling similar to LLM Queue (auto-refresh when processing jobs exist)
- **Modal State:** Local React state for detail modal open/close and selected webhook ID

### 🚨 CRITICAL: Context Usage Strategy

**Context-First Design Pattern:**
- [ ] **✅ User Authentication:** Already handled by admin layout (`/admin/layout.tsx`)
- [ ] **✅ No Prop Drilling:** Components fetch their own data via server actions
- [ ] **✅ Self-Contained:** Each tab manages its own state independently

**No new context providers needed** - existing admin auth context is sufficient.

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**Current AI Usage Location:**
```typescript
// src/app/(protected)/admin/ai-usage/page.tsx
export default async function AIUsagePage() {
  const dashboard = await getAIUsageDashboard(30);
  return (
    <div className="p-8 space-y-8">
      {/* AI usage dashboard content */}
    </div>
  );
}
```

**Current Debug Page Structure:**
```typescript
// src/app/(protected)/admin/debug/page.tsx
<TabsList className="grid w-full max-w-4xl grid-cols-8">
  <TabsTrigger value="settings" />
  <TabsTrigger value="activity" />
  <TabsTrigger value="logs" />
  <TabsTrigger value="llm-queue" />  {/* TO BE REMOVED */}
  <TabsTrigger value="callbacks" />  {/* TO BE REMOVED */}
  <TabsTrigger value="health" />
  <TabsTrigger value="email" />
  <TabsTrigger value="cache" />
</TabsList>

<TabsContent value="llm-queue">
  <LLMQueueTab />  {/* TO BE MOVED */}
</TabsContent>

<TabsContent value="callbacks">
  <LLMCallbackHistoryTab />  {/* TO BE MOVED */}
</TabsContent>
```

**Current QuickActions:**
```typescript
// src/components/admin/QuickActions.tsx
const actions = [
  { label: 'Manage Bundles', href: '/admin/bundles', icon: Boxes },
  { label: 'Manage Products', href: '/admin/products', icon: Tags },
  { label: 'View Users', href: '/admin/users', icon: Users },
  { label: 'Email Campaigns', href: '/admin/email', icon: Mail },
  { label: 'Schedule Calls', href: '/admin/calls', icon: Calendar },
  // NO LLM SYSTEM LINK YET
];
```

### 📂 **After Refactor**

**New LLM System Structure:**
```typescript
// src/app/(protected)/admin/ai/layout.tsx (NEW)
export default function LLMSystemLayout({ children }) {
  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">LLM System</h1>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}

// src/app/(protected)/admin/ai/page.tsx (MOVED FROM /ai-usage)
export default async function LLMOverviewPage() {
  const dashboard = await getAIUsageDashboard(30);
  return (
    <TabsContent value="overview">
      {/* Same AI usage dashboard content */}
    </TabsContent>
  );
}

// src/app/(protected)/admin/ai/queue/page.tsx (EXTRACTED FROM DEBUG)
export default function LLMQueuePage() {
  return (
    <TabsContent value="queue">
      <LLMQueueTab />  {/* Existing component */}
    </TabsContent>
  );
}

// src/app/(protected)/admin/ai/webhooks/page.tsx (NEW)
export default function LLMWebhooksPage() {
  return (
    <TabsContent value="webhooks">
      <WebhooksTab />  {/* New component with SmartTable */}
    </TabsContent>
  );
}
```

**Updated Debug Page:**
```typescript
// src/app/(protected)/admin/debug/page.tsx (UPDATED)
<TabsList className="grid w-full max-w-3xl grid-cols-6">  {/* Changed from 8 to 6 */}
  <TabsTrigger value="settings" />
  <TabsTrigger value="activity" />
  <TabsTrigger value="logs" />
  {/* REMOVED: llm-queue and callbacks tabs */}
  <TabsTrigger value="health" />
  <TabsTrigger value="email" />
  <TabsTrigger value="cache" />
</TabsList>

{/* REMOVED: LLM Queue and Callbacks TabsContent sections */}
```

**Updated QuickActions:**
```typescript
// src/components/admin/QuickActions.tsx (UPDATED)
const actions = [
  { label: 'Manage Bundles', href: '/admin/bundles', icon: Boxes },
  { label: 'Manage Products', href: '/admin/products', icon: Tags },
  { label: 'View Users', href: '/admin/users', icon: Users },
  { label: 'Email Campaigns', href: '/admin/email', icon: Mail },
  { label: 'Schedule Calls', href: '/admin/calls', icon: Calendar },
  { label: 'LLM System', href: '/admin/ai', icon: Cpu, color: 'text-primary' },  // NEW
];
```

### 🎯 **Key Changes Summary**
- [x] **Route Restructure:** `/admin/ai-usage` → `/admin/ai` (with tabbed layout)
- [x] **Component Extraction:** LLMQueueTab and LLMCallbackHistoryTab moved from debug page
- [x] **New Webhooks Tab:** Implements SmartTable for webhook callback management
- [x] **Debug Page Cleanup:** Removed 2 tabs (llm-queue, callbacks), reduced from 8 to 6 tabs
- [x] **QuickActions Update:** Added "LLM System" link to admin dashboard
- [x] **Files Created:** 5 new files (layout, 3 pages, 1 component)
- [x] **Files Modified:** 2 existing files (QuickActions, debug page)

**Impact:** Improved navigation discoverability, better organization of AI admin features, reduced debug page complexity.

---

## 11. Implementation Plan

### Phase 1: Create New Route Structure ✓ 2025-12-21
**Goal:** Set up new `/admin/ai` route with tabbed layout and pages

- [x] **Task 1.1:** Create Layout Component ✓ 2025-12-21
  - Files: `src/app/(protected)/admin/ai/layout.tsx` ✓
  - Details: Tabbed layout with URL param state management, back button, 3 tabs ✓
- [x] **Task 1.2:** Create Overview Page (Move AI Usage) ✓ 2025-12-21
  - Files: `src/app/(protected)/admin/ai/page.tsx` ✓
  - Details: Moved content from `/admin/ai-usage/page.tsx`, wrapped in TabsContent ✓
- [x] **Task 1.3:** Create Queue Page ✓ 2025-12-21
  - Files: `src/app/(protected)/admin/ai/queue/page.tsx` ✓
  - Details: Wrapper page rendering existing `LLMQueueTab` component ✓
- [x] **Task 1.4:** Create Webhooks Page Structure ✓ 2025-12-21
  - Files: `src/app/(protected)/admin/ai/webhooks/page.tsx` ✓
  - Details: Wrapper page rendering new `WebhooksTab` component ✓
- [x] **Task 1.5:** Create Loading and Error States ✓ 2025-12-21
  - Files: `src/app/(protected)/admin/ai/loading.tsx`, `error.tsx` ✓
  - Details: Loading skeleton and error boundary components ✓

### Phase 2: Implement Webhooks Tab with SmartTable ✓ 2025-12-21
**Goal:** Build webhook callback history table with full SmartTable features

- [x] **Task 2.1:** Create Webhook Server Actions ✓ 2025-12-21
  - Files: `src/app/(protected)/admin/ai/actions.ts` ✓
  - Details: Implemented `fetchLLMCallbacks()` with status/time filtering, `getLLMCallbackDetail()` ✓
- [x] **Task 2.2:** Create WebhooksTab Component ✓ 2025-12-21
  - Files: `src/components/admin/ai/WebhooksTab.tsx` ✓
  - Details: Client component with SmartTable, 11 columns (5 visible, 6 hidden), filtering, polling ✓
- [x] **Task 2.3:** Create Webhook Detail Modal ✓ 2025-12-21
  - Files: `src/components/admin/ai/WebhookDetailModal.tsx` ✓
  - Details: Modal with payload JSON, copy buttons, signature validation, timestamps ✓
- [x] **Task 2.4:** Add Column Definitions ✓ 2025-12-21
  - Files: `src/components/admin/ai/WebhooksTab.tsx` ✓
  - Details: Clickable Callback ID, signature icons, date formatting, localStorage persistence ✓

### Phase 3: Update Navigation and Remove Old Routes ✓ 2025-12-21
**Goal:** Wire up new navigation and clean up old routes

- [x] **Task 3.1:** Add LLM System to QuickActions ✓ 2025-12-21
  - Files: `src/components/admin/QuickActions.tsx` ✓
  - Details: Added Cpu icon action, updated grid to 6 columns ✓
- [x] **Task 3.2:** Remove Tabs from Debug Page ✓ 2025-12-21
  - Files: `src/app/(protected)/admin/debug/page.tsx` ✓
  - Details: Removed `llm-queue` and `callbacks` tabs, reduced to 6 tabs, removed unused imports ✓
- [x] **Task 3.3:** Clean Up Old AI Usage Route ✓ 2025-12-21
  - Files: `src/app/(protected)/admin/ai-usage/` directory ✓
  - Details: Deleted old route directory (content moved to `/admin/ai`) ✓

### Phase 4: Testing and Validation 👤 USER TESTING REQUIRED
**Goal:** Verify all functionality works correctly

- [ ] **Task 4.1:** Test Tab Navigation 👤 USER ACTION
  - Files: Manual browser testing
  - Details: Verify tab switching works, URL params update correctly, default tab is Overview
- [ ] **Task 4.2:** Test SmartTable Features 👤 USER ACTION
  - Files: Manual browser testing
  - Details: Verify sorting, filtering, column drag-drop, localStorage persistence for webhooks
- [ ] **Task 4.3:** Test Webhook Detail Modal 👤 USER ACTION
  - Files: Manual browser testing
  - Details: Verify modal opens on Callback ID click, displays full payload, copy buttons work
- [ ] **Task 4.4:** Test Responsive Design 👤 USER ACTION
  - Files: Manual browser testing
  - Details: Verify layout works on mobile, tablet, desktop (grid adapts properly)
- [ ] **Task 4.5:** Test Quick Actions Link 👤 USER ACTION
  - Files: Manual browser testing
  - Details: Verify "LLM System" appears on admin dashboard, navigates to /admin/ai
- [ ] **Task 4.6:** Verify Debug Page 👤 USER ACTION
  - Files: Manual browser testing
  - Details: Confirm LLM Queue and Callbacks tabs removed, only 6 tabs remain

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
### Phase 1: Create New Route Structure
**Goal:** Set up new `/admin/ai` route with tabbed layout and pages

- [x] **Task 1.1:** Create Layout Component ✓ 2025-01-15
  - Files: `src/app/(protected)/admin/ai/layout.tsx` ✓
  - Details: Tabbed layout with URL param state management ✓
- [x] **Task 1.2:** Create Overview Page (Move AI Usage) ✓ 2025-01-15
  - Files: `src/app/(protected)/admin/ai/page.tsx` ✓
  - Details: Content moved from `/admin/ai-usage/page.tsx` ✓
```

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── src/
│   ├── app/(protected)/admin/ai/
│   │   ├── layout.tsx                # Tabbed layout wrapper (Overview, Queue, Webhooks)
│   │   ├── page.tsx                  # Overview tab (AI usage dashboard moved from /ai-usage)
│   │   ├── queue/
│   │   │   └── page.tsx              # Queue tab (extracted from debug page)
│   │   ├── webhooks/
│   │   │   └── page.tsx              # Webhooks tab (new SmartTable interface)
│   │   ├── actions.ts                # Server actions for webhooks data fetching
│   │   ├── loading.tsx               # Loading state for /admin/ai route
│   │   └── error.tsx                 # Error boundary for /admin/ai route
│   └── components/admin/ai/
│       ├── WebhooksTab.tsx           # Client component for webhooks SmartTable
│       └── WebhookDetailModal.tsx    # Modal for webhook details display
```

### Files to Modify
- [ ] **`src/components/admin/QuickActions.tsx`** - Add "LLM System" quick action linking to `/admin/ai`
- [ ] **`src/app/(protected)/admin/debug/page.tsx`** - Remove `llm-queue` and `callbacks` tabs

### Files to Delete
- [ ] **`src/app/(protected)/admin/ai-usage/page.tsx`** - Content moved to `/admin/ai/page.tsx`

### Dependencies to Add
**No new dependencies required** - Using existing shadcn/ui, Tailwind CSS, SmartTable components

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Tab navigation breaks if URL param is malformed
  - **Code Review Focus:** Tab state management in layout.tsx, URL param validation
  - **Potential Fix:** Validate tab param, default to "overview" on invalid value
- [ ] **Error Scenario 2:** SmartTable localStorage conflicts between tabs
  - **Code Review Focus:** LocalStorage key uniqueness for each tab's table preferences
  - **Potential Fix:** Use unique keys: `llm-queue-prefs`, `llm-webhooks-prefs`
- [ ] **Error Scenario 3:** Webhook detail modal fails to load payload
  - **Code Review Focus:** JSON parsing, error handling in WebhookDetailModal
  - **Potential Fix:** Try/catch for JSON.parse, display error message for invalid payloads

### Edge Cases to Consider
- [ ] **Edge Case 1:** No webhooks exist in database (empty state)
  - **Analysis Approach:** Check WebhooksTab component for empty state handling
  - **Recommendation:** Display friendly "No webhooks yet" message with icon
- [ ] **Edge Case 2:** Very large webhook payloads (>1MB)
  - **Analysis Approach:** Check payload rendering performance in detail modal
  - **Recommendation:** Truncate display with "show more" expansion, already enforced by webhook handler
- [ ] **Edge Case 3:** User navigates directly to `/admin/ai/queue` without going through tabs
  - **Analysis Approach:** Verify layout is applied to all subroutes
  - **Recommendation:** Ensure layout.tsx wraps all `/admin/ai/*` routes

### Security & Access Control Review
- [ ] **Admin Access Control:** Are admin-only features properly restricted to admin users?
  - **Check:** Admin layout already enforces ADMIN role check, applies to all `/admin/ai/*` routes
- [ ] **Authentication State:** Does the system handle logged-out users appropriately?
  - **Check:** Admin layout redirects to `/auth/login` if no user authenticated
- [ ] **Form Input Validation:** Are user inputs validated before processing?
  - **Check:** Server actions validate filter parameters, SmartTable handles input sanitization
- [ ] **Permission Boundaries:** Can users access data/features they shouldn't?
  - **Check:** All webhooks belong to system (no user-specific filtering needed), admin-only access sufficient

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples.

**Priority Order:**
1. **Critical:** Security and access control issues (already handled by admin layout)
2. **Important:** User-facing error scenarios and edge cases (empty states, large payloads)
3. **Nice-to-have:** UX improvements and enhanced error messaging (friendly error displays)

---

## 15. Deployment & Configuration

### Environment Variables
**No new environment variables required** - Using existing database connection and auth configuration

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
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)**
   - [x] **Assess complexity** - Straightforward restructuring task, clear requirements
   - [x] **Review the criteria** - No strategic analysis needed
   - [x] **Decision point**: Skip to step 3 (task document creation)

2. **STRATEGIC ANALYSIS SECOND (If needed)** - SKIPPED for this task

3. **CREATE TASK DOCUMENT THIRD (Required)** - COMPLETED ✓

4. **PRESENT IMPLEMENTATION OPTIONS (Required)**

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

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

6. **VERIFY LIB FILE ARCHITECTURE (For any lib/ changes)** - Not applicable (no lib/ changes)

7. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after all phases)** - Will be triggered after implementation

8. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)** - Will be executed if requested

### What Constitutes "Explicit User Approval"

#### For Strategic Analysis - SKIPPED

#### For Implementation Options (A/B/C Choice)
**✅ OPTION A RESPONSES (Show detailed code previews):**
- "A" or "Option A"
- "Preview the changes"
- "Show me the code changes"

**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start implementation"

**✅ OPTION C RESPONSES (Provide more feedback):**
- "C" or "Option C"
- "I have questions about..."
- "Can you modify..."

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Add proper error handling
- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
- [ ] **🚨 MANDATORY: Use early returns to keep code clean and readable**
- [ ] **🚨 MANDATORY: Use async/await instead of .then() chaining**
- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
- [ ] **Ensure responsive design (mobile-first approach with Tailwind breakpoints)**
- [ ] **Test components in both light and dark mode**
- [ ] **Verify mobile usability on devices 320px width and up**
- [ ] Follow accessibility guidelines (WCAG AA)
- [ ] Use semantic HTML elements
- [ ] **🚨 MANDATORY: Clean up removal artifacts**

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern** (Server Actions for mutations, lib functions for complex queries)
- [ ] **🚨 VERIFY: No server/client boundary violations in lib files** (N/A - no lib/ changes)
- [ ] **🚨 VERIFY: No re-exports of non-async functions from Server Action files**
- [ ] **🚨 VERIFY: Proper context usage patterns** (No prop drilling, use existing auth context)
- [ ] **❌ AVOID: Creating unnecessary API routes for internal operations**
- [ ] **❌ AVOID: Mixing server-only imports with client-safe utilities in same file**
- [ ] **❌ AVOID: Prop drilling when context providers already contain the needed data**

---

## 17. Notes & Additional Context

### Research Links
- SmartTable component implementation: `src/components/admin/smart-table/SmartTable.tsx`
- LLM Queue tab reference: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
- Webhook callbacks schema: `src/db/schema/llm-callbacks.ts`
- Admin layout authentication: `src/app/(protected)/admin/layout.tsx`

### **⚠️ Common Pitfalls to Avoid**

**❌ NEVER DO:**
- Create API routes for webhook fetching (use Server Actions instead)
- Mix tab state management between URL params and local state (use URL params only)
- Forget to remove tabs from debug page (leaves orphaned code)
- Use different SmartTable localStorage keys (causes preference conflicts)

**✅ ALWAYS DO:**
- Reuse existing LLMQueueTab component (don't duplicate code)
- Follow existing admin page patterns for consistency
- Test tab navigation with URL params manually
- Verify SmartTable localStorage persistence works per-tab

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No API changes (purely UI reorganization)
- [ ] **Database Dependencies:** No database changes required
- [ ] **Component Dependencies:** LLMQueueTab, LLMCallbackHistoryTab components will be reused (no changes to their interfaces)
- [ ] **Authentication/Authorization:** No changes to auth flow (admin layout enforces access)

**✅ NO BREAKING CHANGES IDENTIFIED**

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** No changes to data fetching logic (reusing existing server actions)
- [ ] **UI/UX Cascading Effects:** Debug page loses 2 tabs (intentional cleanup)
- [ ] **State Management:** No changes to state management patterns
- [ ] **Routing Dependencies:** Old `/admin/ai-usage` route will 404 (acceptable - redirect can be added if needed)

**⚠️ MINOR IMPACT:** Users with bookmarked `/admin/ai-usage` will need to update bookmarks to `/admin/ai`

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** No new queries (reusing existing webhook queries)
- [ ] **Bundle Size:** Minimal increase (~5KB for new layout and webhook components)
- [ ] **Server Load:** No change (same number of data fetching operations)
- [ ] **Caching Strategy:** No caching changes required

**✅ NO PERFORMANCE DEGRADATION EXPECTED**

#### 4. **Security Considerations**
- [ ] **Attack Surface:** No new attack vectors (existing admin auth protects all routes)
- [ ] **Data Exposure:** No changes to data access patterns (admin-only access maintained)
- [ ] **Permission Escalation:** No permission changes (admin layout enforces role check)
- [ ] **Input Validation:** Reusing existing SmartTable validation logic

**✅ NO NEW SECURITY RISKS**

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** Improved workflow (AI features now grouped together)
- [ ] **Data Migration:** No user data migration required
- [ ] **Feature Deprecation:** Old route deprecated (redirect can be added if needed)
- [ ] **Learning Curve:** Minimal (same UI components, just reorganized)

**✅ POSITIVE UX IMPACT** - Better organization and discoverability

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Reduced (debug page simplified from 8 to 6 tabs)
- [ ] **Dependencies:** No new dependencies added
- [ ] **Testing Overhead:** Minimal (reusing existing components)
- [ ] **Documentation:** This task document serves as implementation documentation

**✅ REDUCED MAINTENANCE BURDEN** - Simpler debug page structure

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
**NONE IDENTIFIED** - This is a low-risk UI reorganization task

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Bookmarked Routes:** Users with bookmarks to `/admin/ai-usage` will get 404
  - **Mitigation:** Can add redirect from old route to new route if needed
- [ ] **Tab State Persistence:** Users on debug page when changes deploy may see tab layout shift
  - **Mitigation:** No data loss, just UI rearrangement (acceptable for dev environment)

### Mitigation Strategies

#### Route Deprecation
- [ ] **Optional Redirect:** Add redirect from `/admin/ai-usage` to `/admin/ai` if users complain
- [ ] **Communication:** Document new route structure in changelog/release notes

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections filled out
- [x] **Identify Critical Issues:** No red flags identified
- [x] **Propose Mitigation:** Redirect strategy for old route deprecation
- [x] **Alert User:** Yellow flag about bookmarked routes (acceptable risk)
- [x] **Recommend Alternatives:** N/A (straightforward implementation)

---

*Template Version: 1.3*
*Last Updated: 2025-01-15*
*Created By: AI Agent (Claude Sonnet 4.5)*
