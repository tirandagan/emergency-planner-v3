# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Add LLM Queue Management Tab to Admin Debug Page

### Goal Statement
**Goal:** Create a new "LLM Queue" tab in the admin debug page that provides real-time visibility into the LLM workflow microservice job queue and health status. Admins should be able to:
- **Monitor service health** with visual status pills for database, redis, and celery components
- **Configure LLM service URL** via system settings (admin-editable)
- **Filter jobs** by status (running, completed, failed, all) and sort by key fields
- **View detailed job information** in a modal popup with formatted results and error messages

This will enable better monitoring, debugging, and management of AI workflow operations with configurable service endpoints.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The LLM Workflow Microservice handles asynchronous AI job execution, but there's currently no admin interface to monitor and debug these jobs. Admins need visibility into job queue status, filtering capabilities, and detailed job information to troubleshoot issues and monitor system health.

### Solution Options Analysis

#### Option 1: Client-Side Data Fetching with Server Component Initial Load
**Approach:** Use Server Component for initial data load, then client-side fetching for filtering/sorting/refresh

**Pros:**
- ✅ Fast initial page load with SSR data
- ✅ No loading state on first render
- ✅ Client-side interactivity for filtering/sorting without page refresh
- ✅ Follows Next.js 15 best practices (server-first, client where needed)

**Cons:**
- ❌ Slightly more complex implementation (hybrid server/client)
- ❌ Need to manage client-side state for filters

**Implementation Complexity:** Medium - Requires both server and client components
**Risk Level:** Low - Standard Next.js pattern

#### Option 2: Pure Client-Side Implementation
**Approach:** Use 'use client' for entire tab component, fetch all data client-side

**Pros:**
- ✅ Simple implementation, all logic in one place
- ✅ Easy state management for filters/sorting
- ✅ Consistent with existing debug page pattern (already uses 'use client')

**Cons:**
- ❌ Loading state on initial render
- ❌ No SSR benefits for initial data
- ❌ Slightly slower initial page load

**Implementation Complexity:** Low - Straightforward client component
**Risk Level:** Low - Matches existing page architecture

#### Option 3: Server Actions with Form-Based Filtering
**Approach:** Use Server Actions for all data fetching, form submissions for filters

**Pros:**
- ✅ Maximum server-side rendering
- ✅ No client-side JavaScript required for filtering
- ✅ Better SEO (not relevant for admin pages)

**Cons:**
- ❌ Full page reloads for filter changes
- ❌ Poor UX compared to client-side filtering
- ❌ Overkill for admin debugging interface
- ❌ Doesn't match existing page's interactive nature

**Implementation Complexity:** Medium - Server Actions + form handling
**Risk Level:** Low - But poor UX for this use case

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Hybrid Approach (Server Action for Settings + Client-Side for API Calls)

**Why this is the best choice:**
1. **System Settings Integration** - Leverage existing `system_settings` table infrastructure for LLM service URL configuration
2. **Security** - Keep webhook secret in environment variables (server-only), fetch LLM service URL from database
3. **User Experience** - Real-time filtering, sorting, and refresh without page reloads for job queue monitoring
4. **Consistency** - Matches existing debug page pattern (`'use client'`) while adding server-side settings management
5. **Flexibility** - Admins can change LLM service URL (dev/staging/prod) without code deployment

**Implementation Pattern:**
- **Server Action:** `getLLMServiceURL()` - Fetches URL from system_settings table (server-side database query)
- **Client Component:** `LLMQueueTab` - Uses fetched URL for client-side API calls to LLM service
- **Environment Variable:** `LLM_WEBHOOK_SECRET` - Remains in `.env.local` (server-only, never exposed to client)

**Key Decision Factors:**
- **Configuration Flexibility:** Database-stored URL allows runtime changes without redeployment
- **Security:** Webhook secret stays server-side, only URL is fetched (safe to use in client)
- **User Experience:** Real-time health monitoring and job queue updates
- **Maintainability:** Uses existing system_settings infrastructure and query patterns

**Alternative Consideration:**
Pure environment variable approach (Option 2 original) would be simpler but lacks runtime configurability - admins would need code changes to switch between dev/staging/prod LLM service instances.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, I recommend proceeding with **Option 2 (Pure Client-Side Implementation)** to match the existing debug page architecture and provide the best real-time monitoring experience.

**Questions for you to consider:**
- Does this align with your expectations for the admin debug interface?
- Do you prefer consistency with existing patterns (Option 2) or maximum SSR optimization (Option 1)?
- Are there any specific performance requirements I should consider?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan with detailed component structure and API integration approach.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM (not used for this task)
- **UI & Styling:** shadcn/ui components with Tailwind CSS for styling
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes
- **Key Architectural Patterns:**
  - Next.js App Router
  - Client Components for interactive admin interfaces (`'use client'`)
  - Server Actions for mutations (not needed for this read-only task)
  - External API integration (LLM Microservice)
- **Relevant Existing Components:**
  - `src/components/ui/button.tsx` - Button component
  - `src/components/ui/card.tsx` - Card layout component
  - `src/components/ui/table.tsx` - Table component for data display
  - `src/components/ui/dialog.tsx` - Modal dialog component
  - `src/components/ui/badge.tsx` - Status badge component
  - `src/components/ui/tabs.tsx` - Tab navigation component
  - `src/app/(protected)/admin/debug/page.tsx` - Existing debug page with tab structure

### Current State
The admin debug page (`/admin/debug`) currently has 5 tabs:
- **Health** - System health checks for various services
- **Logs** - System logs viewer
- **Activity** - Recent activity log entries
- **Cache** - Cache management tools
- **Email** - Email testing functionality

The page uses a client component (`'use client'`) with the Tabs component from shadcn/ui. All tabs follow a similar pattern:
- Card-based layout with CardHeader/CardContent
- Table component for data display
- Refresh buttons with loading states
- Badge components for status indicators

**LLM Service Integration:**
- Base URL: Configured via environment variable (needs to be added)
- Authentication: `X-API-Secret` header (webhook secret from environment)
- Endpoints needed: `/api/v1/jobs` (list) and `/api/v1/status/{job_id}` (detail)

### Existing Context Providers Analysis
**🔍 Context Coverage Analysis:**
- **Not Applicable** - This task doesn't use existing context providers
- The admin debug page operates independently and doesn't need user/usage context
- LLM service data is fetched directly from external API, not from app context
- No user-specific filtering needed (admin sees all jobs)

---

## 4. Context & Problem Definition

### Problem Statement
The Emergency Planner application uses an LLM Workflow Microservice for asynchronous AI job execution (mission generation, emergency contacts, etc.). Currently, there's no admin interface to monitor job queue status, debug failed jobs, or track workflow performance. Admins need real-time visibility into:

- **Job Queue Status** - Which jobs are running, completed, or failed
- **Filtering Capabilities** - View jobs by status category
- **Detailed Job Information** - Inspect individual job details, results, and error messages
- **Performance Monitoring** - Track job duration, workflow names, and completion rates

Without this interface, debugging workflow issues requires direct database access or log file analysis, which is inefficient and error-prone.

### Success Criteria
- [ ] New "LLM Queue" tab added to `/admin/debug` page navigation
- [ ] **Health Status Display** - Visual pills showing database, redis, and celery health with color-coded status (green=healthy, yellow=degraded, red=unhealthy)
- [ ] **System Settings Integration** - LLM service URL stored in `system_settings` table and fetched via server action
- [ ] **Settings UI** - Admin can view/edit LLM service URL from debug page (optional inline editor or link to settings page)
- [ ] Jobs displayed in clean, sortable table format with key fields (job_id, status, workflow_name, created_at, duration)
- [ ] Status filter dropdown working correctly (all, running, completed, failed)
- [ ] Sortable columns for job_id, created_at, workflow_name, status, duration_ms
- [ ] Job_id column is clickable hyperlink that opens modal popup
- [ ] Modal displays nicely formatted job details from `/api/v1/status/{job_id}`
- [ ] Refresh button updates both health status and job list without page reload
- [ ] Loading states shown during data fetching
- [ ] Error handling for API failures with user-friendly messages (e.g., "LLM service unreachable")
- [ ] Responsive design works on mobile, tablet, and desktop

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
- **FR1:** User can navigate to new "LLM Queue" tab in admin debug interface
- **FR2:** System displays LLM service health status at top of tab with pills for database, redis, and celery (color-coded: green=healthy, yellow=degraded, red=unhealthy)
- **FR3:** System fetches LLM service URL from `system_settings` table via server action on tab load
- **FR4:** User can view current LLM service URL and edit it inline (or via settings link)
- **FR5:** System displays jobs in table format with columns: job_id (link), workflow_name, status (badge), created_at, started_at, completed_at, duration_ms, error_message (truncated)
- **FR6:** User can filter jobs by status using dropdown (all, running, completed, failed)
- **FR7:** User can sort table by clicking column headers (job_id, created_at, workflow_name, status, duration_ms)
- **FR8:** User can click job_id to open modal with detailed job status information
- **FR9:** User can refresh both health status and job list using refresh button
- **FR10:** System shows loading spinner during data fetching
- **FR11:** System shows appropriate error messages when API calls fail (e.g., "LLM service unreachable - check service URL in settings")
- **FR12:** Modal displays job details including: job_id, status, workflow_name, timestamps, duration, result (if completed), error_message (if failed), progress indicators (if processing)

### Non-Functional Requirements
- **Performance:** API responses should be cached for 10 seconds to prevent excessive polling
- **Security:** API calls include proper authentication headers (`X-API-Secret`)
- **Usability:**
  - Table should be scannable with clear status indicators
  - Modal should present complex JSON data in readable format
  - Filter/sort operations should feel instant (<100ms perceived delay)
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works in modern browsers (Chrome, Firefox, Safari, Edge)

### Technical Constraints
- **Must use existing LLM Microservice API** - Cannot modify API endpoints or response formats
- **Must match existing debug page patterns** - Consistency with health, logs, activity tabs
- **Cannot use Supabase database directly** - LLM service has its own PostgreSQL database
- **Must handle API errors gracefully** - Service may be unavailable or rate-limited
- **Must use environment variables for configuration** - Base URL and API secret from `.env.local`

---

## 7. Data & Database Changes

### Database Schema Changes
**Existing Table Update** - Add new system setting to `system_settings` table:

```sql
-- Add LLM service URL to system settings
INSERT INTO system_settings (key, value, value_type, description, category, is_editable)
VALUES (
  'llm_service_url',
  'https://llm-service-api.onrender.com',
  'string',
  'Base URL for LLM Workflow Microservice API endpoints',
  'integrations',
  true
);
```

**Note:** This uses the existing `system_settings` table - no schema changes needed.

### Data Model Updates
**TypeScript Types** - New types for LLM API responses and health status:

```typescript
// LLM Job List Response Types
interface LLMJob {
  job_id: string;
  workflow_name: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  user_id: string | null;
  created_at: string; // ISO 8601
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
}

interface LLMJobsResponse {
  jobs: LLMJob[];
  total: number;
  limit: number;
  offset: number;
}

// LLM Job Status Detail Response Types
interface LLMJobDetail {
  job_id: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  workflow_name: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  result: unknown | null; // Complex nested object, type varies by workflow
  error_message: string | null;
  current_step: string | null;
  steps_completed: number | null;
  total_steps: number | null;
}

// Filter and Sort Types
type JobStatusFilter = 'all' | 'running' | 'completed' | 'failed';
type SortField = 'job_id' | 'created_at' | 'workflow_name' | 'status' | 'duration_ms';
type SortDirection = 'asc' | 'desc';

// LLM Service Health Types
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'no_workers';

interface ServiceHealth {
  status: HealthStatus;
  type?: string;
  workers?: number;
  error?: string;
}

interface LLMHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    celery: ServiceHealth;
  };
}
```

### Data Migration Plan
**System Setting Seed Data** - Add LLM service URL to system_settings table:

- [ ] **Step 1:** Create database seed script or manual SQL insert
- [ ] **Step 2:** Add `llm_service_url` setting to `system_settings` table
- [ ] **Step 3:** Verify setting is accessible via `getSystemSetting<string>('llm_service_url')`

**Alternative:** Add to `DEFAULT_SYSTEM_SETTINGS` array in `src/db/schema/system-settings.ts` and re-run seed script

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**✅ HYBRID APPROACH** → Server Action for Settings + Client-Side API Calls

This task uses **hybrid architecture** because:
- LLM service URL comes from database (server-side query required)
- LLM job/health data comes from external API (client-side fetch for real-time updates)
- Webhook secret stays in environment (server-only, never exposed to client)

**Server Action for Settings:**
```typescript
// src/app/(protected)/admin/debug/actions.ts
'use server';
import { getSystemSetting } from '@/db/queries/system-settings';

export async function getLLMServiceURL(): Promise<string> {
  const url = await getSystemSetting<string>('llm_service_url');
  return url ?? 'https://llm-service-api.onrender.com'; // Fallback default
}
```

**Client-Side Fetch Pattern:**
```typescript
// In Client Component (LLMQueueTab.tsx)
import { getLLMServiceURL } from './actions';

const [llmServiceURL, setLLMServiceURL] = useState<string>('');

useEffect(() => {
  getLLMServiceURL().then(setLLMServiceURL);
}, []);

// Then use llmServiceURL for API calls
const response = await fetch(`${llmServiceURL}/api/v1/jobs?status=${filter}`, {
  headers: { 'X-API-Secret': process.env.NEXT_PUBLIC_LLM_WEBHOOK_SECRET }
});
```

**⚠️ Security Note:** Webhook secret must remain in environment variable with `NEXT_PUBLIC_` prefix for client-side access (acceptable for admin-only interface)

**❌ DO NOT use API routes for this task:**
- [ ] ❌ No webhook integration needed
- [ ] ❌ Not serving non-HTML responses
- [ ] ❌ Direct client-to-LLM-service communication is appropriate for admin interface

### External API Integration

**LLM Microservice Endpoints:**

1. **GET /health** - Service Health Check
   - **Base URL:** Fetched from `system_settings` table via `getLLMServiceURL()` server action
   - **Authentication:** None required (public endpoint)
   - **Response:** `LLMHealthResponse` (see types above)
   - **Services Monitored:** database (PostgreSQL), redis (Celery broker), celery (workers)
   - **Use Case:** Display health pills at top of tab for quick status overview

2. **GET /api/v1/jobs** - List Jobs with Filtering
   - **Base URL:** Fetched from `system_settings` table via `getLLMServiceURL()` server action
   - **Authentication:** `X-API-Secret: ${NEXT_PUBLIC_LLM_WEBHOOK_SECRET}` header
   - **Query Parameters:**
     - `status`: 'running' | 'completed' | 'failed' | 'all' (optional, default: 'all')
     - `limit`: number (optional, default: 50, max: 200)
     - `offset`: number (optional, default: 0)
   - **Response:** `LLMJobsResponse` (see types above)

3. **GET /api/v1/status/{job_id}** - Get Job Detail
   - **Authentication:** `X-API-Secret: ${NEXT_PUBLIC_LLM_WEBHOOK_SECRET}` header
   - **Path Parameter:** `job_id` (UUID string)
   - **Response:** `LLMJobDetail` (see types above)

**Error Handling:**
- 401 Unauthorized → Invalid API secret, show error message
- 404 Not Found → Job not found, show user-friendly message
- 500 Server Error → Service unavailable, show retry option
- Network Error → Connection failed, show offline message

**Environment Variables Required:**
```bash
# .env.local (webhook secret only - URL comes from database)
NEXT_PUBLIC_LLM_WEBHOOK_SECRET=your-shared-secret-key-here
```

**Database Configuration:**
- LLM service URL stored in `system_settings` table with key `llm_service_url`
- Default value: `https://llm-service-api.onrender.com`
- Admins can edit via system settings interface

---

## 9. Frontend Changes

### New Components

**Component Organization Pattern:**
- Feature-specific components in `src/app/(protected)/admin/debug/` (co-located with page)
- No need for global components directory (admin-only UI)

**Components to Create:**

- [ ] **`src/app/(protected)/admin/debug/LLMQueueTab.tsx`** - Main tab component
  - Client component (`'use client'`)
  - Fetches LLM service URL from server action on mount
  - Fetches and displays health status at top of tab (database, redis, celery pills)
  - Manages job list fetching, filtering, sorting, refresh
  - Renders table with job data
  - Handles modal open/close state
  - Optionally displays current LLM service URL with edit capability
  - Props: None (self-contained)

- [ ] **`src/app/(protected)/admin/debug/LLMHealthStatus.tsx`** - Health status pills component
  - Client component (`'use client'`)
  - Displays health pills for database, redis, celery services
  - Color-coded badges: green (healthy), yellow (degraded/no_workers), red (unhealthy)
  - Shows worker count for celery, error messages on hover/click
  - Props:
    - `health: LLMHealthResponse | null` - Health data from /health endpoint
    - `isLoading: boolean` - Loading state indicator

- [ ] **`src/app/(protected)/admin/debug/LLMJobDetailModal.tsx`** - Job detail modal
  - Client component (`'use client'`)
  - Fetches and displays detailed job status
  - Formats complex JSON result data
  - Shows progress indicators for processing jobs
  - Props:
    - `jobId: string | null` - Job ID to fetch details for (null = closed)
    - `llmServiceURL: string` - Base URL for API calls
    - `onClose: () => void` - Callback to close modal

**Component Requirements:**
- **Responsive Design:**
  - Table scrolls horizontally on mobile (<768px)
  - Modal adapts to screen size (full-screen on mobile)
  - Filter/sort controls stack vertically on mobile
- **Theme Support:**
  - Use CSS variables for colors (`text-foreground`, `bg-background`, etc.)
  - Support dark mode with `dark:` Tailwind classes
  - Status badges use theme-aware colors (green/yellow/red with dark variants)
- **Accessibility:**
  - Proper ARIA labels for filter/sort controls
  - Keyboard navigation for table and modal
  - Focus management when modal opens/closes
  - Screen reader announcements for loading states
- **Text Sizing & Readability:**
  - Table content: `text-sm` for data density
  - Modal content: `text-base` for comfortable reading of results
  - Timestamps: `text-xs text-muted-foreground` for secondary info
  - Error messages: `text-base` for visibility

### Page Updates
- [ ] **`src/app/(protected)/admin/debug/page.tsx`** - Add new tab to existing Tabs component
  - Import `LLMQueueTab` component
  - Add new tab trigger to TabsList: `<TabsTrigger value="llm-queue">LLM Queue</TabsTrigger>`
  - Add new tab content: `<TabsContent value="llm-queue"><LLMQueueTab /></TabsContent>`
  - Update TabsList grid columns from `grid-cols-5` to `grid-cols-6`

### State Management
**Local Component State (React useState):**
- `llmServiceURL: string` - LLM service base URL (fetched from system settings on mount)
- `health: LLMHealthResponse | null` - Current health status
- `isLoadingHealth: boolean` - Health status loading state
- `jobs: LLMJob[]` - Current job list
- `isLoadingJobs: boolean` - Job list loading state
- `error: string | null` - Error message from API failures
- `statusFilter: JobStatusFilter` - Current status filter selection
- `sortField: SortField | null` - Current sort column
- `sortDirection: SortDirection` - Sort direction (asc/desc)
- `selectedJobId: string | null` - Job ID for modal (null = closed)

**Data Fetching Strategy:**
- **On Mount:** Fetch LLM service URL from server action, then fetch health + jobs
- **Manual Refresh:** Button click refreshes both health and job list
- **No Auto-Polling:** Admin manually refreshes as needed (prevents excessive API calls)
- **Error Recovery:** If URL fetch fails, use hardcoded fallback URL with warning message

### 🚨 CRITICAL: Context Usage Strategy

**Context Analysis:**
- [ ] ✅ **No Context Needed** - This task doesn't use existing context providers
- [ ] ✅ **External API Data** - Data comes from LLM Microservice, not app database
- [ ] ✅ **Admin-Only Interface** - No user-specific data filtering required
- [ ] ✅ **Independent Component** - Operates standalone within debug page

**Decision Rationale:**
- LLM service data is external and not available via app context
- Admin sees all jobs regardless of user context
- Direct API fetching is appropriate for monitoring/debugging interfaces

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**Existing Debug Page Structure:**
```typescript
// src/app/(protected)/admin/debug/page.tsx
export default function DebugPage() {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full max-w-2xl grid-cols-5">
        <TabsTrigger value="health">Health</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="cache">Cache</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
      </TabsList>

      <TabsContent value="health">...</TabsContent>
      <TabsContent value="logs">...</TabsContent>
      <TabsContent value="activity">...</TabsContent>
      <TabsContent value="cache">...</TabsContent>
      <TabsContent value="email">...</TabsContent>
    </Tabs>
  )
}
```

### 📂 **After Refactor**

**Updated Debug Page with LLM Queue Tab:**
```typescript
// src/app/(protected)/admin/debug/page.tsx
import { LLMQueueTab } from './LLMQueueTab' // NEW IMPORT

export default function DebugPage() {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full max-w-2xl grid-cols-6"> {/* CHANGED: grid-cols-5 → grid-cols-6 */}
        <TabsTrigger value="health">Health</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="cache">Cache</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="llm-queue">LLM Queue</TabsTrigger> {/* NEW TAB */}
      </TabsList>

      <TabsContent value="health">...</TabsContent>
      <TabsContent value="logs">...</TabsContent>
      <TabsContent value="activity">...</TabsContent>
      <TabsContent value="cache">...</TabsContent>
      <TabsContent value="email">...</TabsContent>
      <TabsContent value="llm-queue"> {/* NEW TAB CONTENT */}
        <LLMQueueTab />
      </TabsContent>
    </Tabs>
  )
}
```

**New LLMQueueTab Component Structure:**
```typescript
// src/app/(protected)/admin/debug/LLMQueueTab.tsx (NEW FILE)
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { LLMJobDetailModal } from './LLMJobDetailModal';

export function LLMQueueTab() {
  const [jobs, setJobs] = useState<LLMJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_LLM_SERVICE_URL}/api/v1/jobs?status=${statusFilter}`,
        { headers: { 'X-API-Secret': process.env.NEXT_PUBLIC_LLM_WEBHOOK_SECRET } }
      );
      const data: LLMJobsResponse = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>LLM Job Queue</CardTitle>
          <div className="flex gap-2">
            {/* Filter dropdown */}
            {/* Refresh button */}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Workflow</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.job_id}>
                <TableCell>
                  <button onClick={() => setSelectedJobId(job.job_id)}>
                    {job.job_id.slice(0, 8)}...
                  </button>
                </TableCell>
                {/* Other cells */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <LLMJobDetailModal
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
      />
    </Card>
  );
}
```

**New LLMJobDetailModal Component Structure:**
```typescript
// src/app/(protected)/admin/debug/LLMJobDetailModal.tsx (NEW FILE)
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LLMJobDetailModalProps {
  jobId: string | null;
  onClose: () => void;
}

export function LLMJobDetailModal({ jobId, onClose }: LLMJobDetailModalProps) {
  const [jobDetail, setJobDetail] = useState<LLMJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_LLM_SERVICE_URL}/api/v1/status/${jobId}`,
          { headers: { 'X-API-Secret': process.env.NEXT_PUBLIC_LLM_WEBHOOK_SECRET } }
        );
        const data: LLMJobDetail = await response.json();
        setJobDetail(data);
      } catch (error) {
        // Error handling
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetail();
  }, [jobId]);

  return (
    <Dialog open={!!jobId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Details: {jobId}</DialogTitle>
        </DialogHeader>
        {/* Job detail display */}
      </DialogContent>
    </Dialog>
  );
}
```

### 🎯 **Key Changes Summary**
- [ ] **New LLMQueueTab Component:** Client component with job list table, filtering, sorting, and modal trigger
- [ ] **New LLMJobDetailModal Component:** Dialog component with detailed job status and formatted JSON display
- [ ] **Updated Debug Page:** Added 6th tab to tab navigation and included LLMQueueTab component
- [ ] **Files Modified:**
  - `src/app/(protected)/admin/debug/page.tsx` (tab list update)
- [ ] **Files Created:**
  - `src/app/(protected)/admin/debug/LLMQueueTab.tsx` (new tab component)
  - `src/app/(protected)/admin/debug/LLMJobDetailModal.tsx` (new modal component)
- [ ] **Impact:** Admin users gain real-time visibility into LLM job queue status with filtering and detailed job inspection

---

## 11. Implementation Plan

### Phase 1: System Settings & Server Action Setup
**Goal:** Configure LLM service URL in database and create server action to fetch it

- [ ] **Task 1.1:** Add System Setting to Database
  - Files: Database (manual SQL or add to `src/db/schema/system-settings.ts` defaults)
  - Details: Insert `llm_service_url` setting with default value `https://llm-service-api.onrender.com`
  - SQL: `INSERT INTO system_settings (key, value, value_type, description, category, is_editable) VALUES ('llm_service_url', 'https://llm-service-api.onrender.com', 'string', 'Base URL for LLM Workflow Microservice API endpoints', 'integrations', true);`

- [ ] **Task 1.2:** Create Server Action for URL Fetching
  - Files: `src/app/(protected)/admin/debug/actions.ts`
  - Details: Create `getLLMServiceURL()` server action that queries system_settings table
  - Uses existing `getSystemSetting<string>('llm_service_url')` from `@/db/queries/system-settings`
  - Returns fallback URL if setting not found

- [ ] **Task 1.3:** Add Environment Variable for Webhook Secret
  - Files: `.env.local` (or create if missing)
  - Details: Add `NEXT_PUBLIC_LLM_WEBHOOK_SECRET=your-shared-secret-key-here`

- [ ] **Task 1.4:** Create TypeScript Types File
  - Files: `src/app/(protected)/admin/debug/llm-types.ts`
  - Details: Define all types: `LLMJob`, `LLMJobsResponse`, `LLMJobDetail`, `LLMHealthResponse`, `ServiceHealth`, `HealthStatus`, `JobStatusFilter`, `SortField`, `SortDirection`

### Phase 2: Create LLMHealthStatus Component
**Goal:** Build health status pills component for visual service monitoring

- [ ] **Task 2.1:** Create Health Status Component File
  - Files: `src/app/(protected)/admin/debug/LLMHealthStatus.tsx`
  - Details: Set up component with props interface (`health`, `isLoading`)

- [ ] **Task 2.2:** Implement Health Pills Display
  - Files: `src/app/(protected)/admin/debug/LLMHealthStatus.tsx`
  - Details: Create three Badge components for database, redis, celery with color coding
  - Color mapping: `healthy` → green, `degraded`/`no_workers` → yellow, `unhealthy` → red

- [ ] **Task 2.3:** Add Service Details Display
  - Files: `src/app/(protected)/admin/debug/LLMHealthStatus.tsx`
  - Details: Show worker count for celery, error messages on hover/tooltip, service types

- [ ] **Task 2.4:** Implement Loading State
  - Files: `src/app/(protected)/admin/debug/LLMHealthStatus.tsx`
  - Details: Show skeleton loader or loading indicator when `isLoading` is true

### Phase 3: Create LLMJobDetailModal Component
**Goal:** Build modal component for displaying detailed job information

- [ ] **Task 3.1:** Create Modal Component File
  - Files: `src/app/(protected)/admin/debug/LLMJobDetailModal.tsx`
  - Details: Set up basic Dialog component structure with props interface (`jobId`, `llmServiceURL`, `onClose`)

- [ ] **Task 3.2:** Implement Job Detail Fetching
  - Files: `src/app/(protected)/admin/debug/LLMJobDetailModal.tsx`
  - Details: Add useEffect hook to fetch job details from `${llmServiceURL}/api/v1/status/{job_id}` when jobId changes

- [ ] **Task 3.3:** Design Job Detail Display Layout
  - Files: `src/app/(protected)/admin/debug/LLMJobDetailModal.tsx`
  - Details: Create sections for job metadata, status, progress, result, and error messages

- [ ] **Task 3.4:** Add JSON Formatting for Complex Data
  - Files: `src/app/(protected)/admin/debug/LLMJobDetailModal.tsx`
  - Details: Format `result` and `error_message` JSON with syntax highlighting and collapsible sections

- [ ] **Task 3.5:** Implement Loading and Error States
  - Files: `src/app/(protected)/admin/debug/LLMJobDetailModal.tsx`
  - Details: Add loading spinner and error message display

### Phase 4: Create LLMQueueTab Component
**Goal:** Build main tab component with health status, job table, filtering, and sorting

- [ ] **Task 4.1:** Create Tab Component File and State Setup
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Set up client component with Card layout and all state variables (`llmServiceURL`, `health`, `jobs`, loading states, filters, etc.)

- [ ] **Task 4.2:** Implement LLM Service URL Fetching
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Add useEffect hook to call `getLLMServiceURL()` server action on mount, set `llmServiceURL` state

- [ ] **Task 4.3:** Implement Health Status Fetching
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Add `fetchHealth()` function that calls `${llmServiceURL}/health` (no auth required), parse `LLMHealthResponse`

- [ ] **Task 4.4:** Implement Job List Fetching
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Add `fetchJobs()` function that calls `${llmServiceURL}/api/v1/jobs?status=${filter}` with `X-API-Secret` header

- [ ] **Task 4.5:** Integrate LLMHealthStatus Component
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Import and render `LLMHealthStatus` component at top of Card, pass `health` and `isLoadingHealth` props

- [ ] **Task 4.6:** Create Filter Dropdown UI
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Add Select component for status filter (all, running, completed, failed)

- [ ] **Task 4.7:** Build Job Table Structure
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Create Table with columns: job_id (link), workflow_name, status (badge), created_at, started_at, completed_at, duration_ms

- [ ] **Task 4.8:** Implement Sortable Column Headers
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Add click handlers to table headers for sorting, show sort direction indicators

- [ ] **Task 4.9:** Add Refresh Button with Combined Loading
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Create refresh button that triggers both `fetchHealth()` and `fetchJobs()`, show loading spinner during fetch

- [ ] **Task 4.10:** Integrate Modal Trigger
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Add click handler to job_id links that sets selectedJobId state, render LLMJobDetailModal component with `llmServiceURL` prop

- [ ] **Task 4.11:** Implement Error Handling
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Add try-catch with user-friendly error messages for API failures, include guidance about checking service URL in settings

### Phase 5: Integrate with Debug Page
**Goal:** Add new tab to existing debug page navigation

- [ ] **Task 5.1:** Update TabsList Grid Columns
  - Files: `src/app/(protected)/admin/debug/page.tsx`
  - Details: Change `grid-cols-5` to `grid-cols-6` in TabsList className

- [ ] **Task 5.2:** Add LLM Queue Tab Trigger
  - Files: `src/app/(protected)/admin/debug/page.tsx`
  - Details: Add new TabsTrigger with value="llm-queue", icon, and label "LLM Queue"

- [ ] **Task 5.3:** Add LLM Queue Tab Content
  - Files: `src/app/(protected)/admin/debug/page.tsx`
  - Details: Add TabsContent wrapper with LLMQueueTab component

- [ ] **Task 5.4:** Import LLMQueueTab Component
  - Files: `src/app/(protected)/admin/debug/page.tsx`
  - Details: Add import statement for LLMQueueTab from './LLMQueueTab'

### Phase 6: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 6.1:** Code Quality Verification
  - Files: All modified files (actions.ts, LLMQueueTab.tsx, LLMHealthStatus.tsx, LLMJobDetailModal.tsx, llm-types.ts)
  - Details: Run `npm run lint` on modified files - NEVER run dev server, build, or start commands

- [ ] **Task 6.2:** Static Logic Review
  - Files: actions.ts, LLMQueueTab.tsx, LLMHealthStatus.tsx, LLMJobDetailModal.tsx
  - Details: Read code to verify server action logic, API integration, health status mapping, error handling

- [ ] **Task 6.3:** Database Setting Verification
  - Files: system_settings table (read-only check)
  - Details: Verify `llm_service_url` setting exists in database with correct structure (read-only verification query)

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 6, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 7: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 7.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [ ] **Task 7.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements (health status + system settings + jobs), integration testing, provide detailed summary

### Phase 8: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 8.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing

- [ ] **Task 8.2:** Request User UI Testing
  - Files: Specific browser testing checklist for user
  - Details: Testing checklist:
    - [ ] Navigate to `/admin/debug` and verify "LLM Queue" tab appears
    - [ ] Click "LLM Queue" tab and verify health status pills display (database, redis, celery)
    - [ ] Verify health pill colors match service status (green/yellow/red)
    - [ ] Verify LLM service URL is fetched from database (check for fallback warning if not set)
    - [ ] Test job table display with proper columns and data
    - [ ] Test status filter dropdown (all, running, completed, failed)
    - [ ] Test column sorting by clicking table headers
    - [ ] Click job_id link and verify modal opens with job details
    - [ ] Test modal close functionality (X button and outside click)
    - [ ] Test refresh button updates both health status and job list
    - [ ] Verify responsive design on mobile/tablet/desktop
    - [ ] Verify light/dark mode theme support
    - [ ] Test error handling (service unreachable, invalid credentials)

- [ ] **Task 8.3:** Wait for User Confirmation
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

---

## 13. File Structure & Organization

### New Files to Create
```
src/app/(protected)/admin/debug/
├── actions.ts                        # Server action for getLLMServiceURL()
├── llm-types.ts                      # TypeScript types for LLM API responses + health
├── LLMQueueTab.tsx                   # Main tab component with health + jobs
├── LLMHealthStatus.tsx               # Health status pills component (NEW)
└── LLMJobDetailModal.tsx             # Modal component for job details

.env.local                            # Environment variables (add if missing)
```

**File Organization Rules:**
- **Server Actions**: In `actions.ts` file at same level as page components
- **Components**: Co-located with debug page in `src/app/(protected)/admin/debug/` (admin-only, not reusable)
- **Types**: In same directory as components (`llm-types.ts`)
- **Environment Variables**: In `.env.local` (not committed to git)

### Files to Modify
- [ ] **`src/app/(protected)/admin/debug/page.tsx`** - Add new tab to TabsList and TabsContent
- [ ] **`src/db/schema/system-settings.ts`** - Optionally add `llm_service_url` to `DEFAULT_SYSTEM_SETTINGS` array
- [ ] **`.env.local`** - Add `NEXT_PUBLIC_LLM_WEBHOOK_SECRET` (webhook secret only, URL comes from database)
- [ ] **Database** - Add `llm_service_url` setting via SQL insert or seed script

### Dependencies to Add
**No new dependencies required** - All UI components already exist in `src/components/ui/`

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1: LLM Service API Unavailable**
  - **Code Review Focus:** `LLMQueueTab.tsx` fetchJobs function and `LLMJobDetailModal.tsx` fetch logic
  - **Potential Fix:** Add try-catch with network error detection, display user-friendly "Service unavailable" message with retry button

- [ ] **Error Scenario 2: Invalid or Missing API Credentials**
  - **Code Review Focus:** Environment variable loading, header configuration in fetch calls
  - **Potential Fix:** Add environment variable validation on component mount, show clear error message if credentials missing

- [ ] **Error Scenario 3: Job Not Found (404) When Opening Modal**
  - **Code Review Focus:** `LLMJobDetailModal.tsx` error handling for 404 responses
  - **Potential Fix:** Detect 404 status code, display "Job not found or has been deleted" message instead of generic error

- [ ] **Error Scenario 4: Rate Limiting from LLM Service**
  - **Code Review Focus:** Rapid successive API calls during filtering/sorting
  - **Potential Fix:** Implement debouncing for filter changes, add rate limit detection with retry-after header parsing

### Edge Cases to Consider
- [ ] **Edge Case 1: Empty Job List**
  - **Analysis Approach:** Check if empty state is handled in table rendering
  - **Recommendation:** Display empty state message "No jobs found" with appropriate icon

- [ ] **Edge Case 2: Very Long Job IDs or Workflow Names**
  - **Analysis Approach:** Verify text truncation and responsive table behavior
  - **Recommendation:** Truncate long strings with ellipsis, show full text on hover with title attribute

- [ ] **Edge Case 3: Large Result JSON in Modal**
  - **Analysis Approach:** Check if modal content is scrollable and doesn't break layout
  - **Recommendation:** Add max-height with scrollable content area, implement collapsible sections for nested JSON

- [ ] **Edge Case 4: Concurrent Job List Updates**
  - **Analysis Approach:** Verify loading state prevents duplicate fetches during refresh
  - **Recommendation:** Disable refresh button during loading, use loading state to prevent race conditions

### Security & Access Control Review
- [ ] **Admin Access Control:** Are admin-only features properly restricted to admin users?
  - **Check:** Route protection in middleware ensures only admins can access `/admin/debug` page
  - **Status:** ✅ Already handled by existing middleware protecting `(protected)/admin/*` routes

- [ ] **API Secret Exposure:** Is the LLM webhook secret properly protected from client-side exposure?
  - **Check:** Environment variable naming convention (`NEXT_PUBLIC_*` exposes to client)
  - **⚠️ SECURITY CONCERN:** Using `NEXT_PUBLIC_LLM_WEBHOOK_SECRET` exposes secret to client-side JavaScript
  - **Recommendation:** Create API route proxy (`/api/admin/llm-jobs`) to keep secret server-side, or accept risk for admin-only interface

- [ ] **CORS and API Authentication:** Does the LLM service accept requests from browser origins?
  - **Check:** Browser-based fetch calls may be blocked by CORS if LLM service doesn't whitelist origin
  - **Potential Issue:** LLM service may only accept server-side requests
  - **Recommendation:** Test with browser DevTools, create API route proxy if CORS issues arise

- [ ] **Input Validation:** Are user inputs (filter selections) validated before API calls?
  - **Check:** Status filter dropdown enforces valid values through TypeScript union types
  - **Status:** ✅ TypeScript provides compile-time validation, no user-entered input

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples.

**Priority Order:**
1. **Critical:** API secret exposure in client-side environment variables (security risk)
2. **Important:** CORS compatibility with LLM service (may block all requests)
3. **Nice-to-have:** Enhanced error messages and empty state handling

---

## 15. Deployment & Configuration

### Environment Variables

**Required Environment Variables:**
```bash
# Add to .env.local (development) and hosting platform (production)

# LLM Microservice Base URL
NEXT_PUBLIC_LLM_SERVICE_URL=https://llm-service-api.onrender.com

# LLM Webhook Secret (used as API authentication)
# ⚠️ SECURITY NOTE: NEXT_PUBLIC_ prefix exposes this to client-side code
# For production, consider creating API route proxy to keep secret server-side
NEXT_PUBLIC_LLM_WEBHOOK_SECRET=your-shared-secret-key-here
```

**Production Deployment Checklist:**
- [ ] Add environment variables to hosting platform (Vercel, Render, etc.)
- [ ] Verify LLM service URL is accessible from production environment
- [ ] Test API authentication with production webhook secret
- [ ] Consider implementing API route proxy to protect webhook secret (optional)
- [ ] Verify CORS configuration allows requests from production domain

**Security Recommendation:**
For enhanced security, create server-side API route proxy:
```
src/app/api/admin/llm-jobs/route.ts  → Proxies /api/v1/jobs
src/app/api/admin/llm-status/[id]/route.ts → Proxies /api/v1/status/{id}
```
This keeps `LLM_WEBHOOK_SECRET` server-side only (without `NEXT_PUBLIC_` prefix).

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **EVALUATE STRATEGIC NEED** - Determine if multiple solutions exist or if it's straightforward
2. **STRATEGIC ANALYSIS** (if needed) - Present solution options with pros/cons and get user direction ✅ COMPLETED
3. **CREATE A TASK DOCUMENT** in `ai_docs/tasks/` using this template ✅ COMPLETED
4. **GET USER APPROVAL** of the task document ⏳ WAITING FOR USER
5. **IMPLEMENT THE FEATURE** only after approval

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)** ✅ COMPLETED
   - [x] **Assessed complexity** - Multiple viable approaches identified (client-side vs server-side vs hybrid)
   - [x] **Reviewed criteria** - Considered SSR benefits, UX requirements, consistency with existing code
   - [x] **Decision point** - Strategic analysis needed and completed

2. **STRATEGIC ANALYSIS SECOND (If needed)** ✅ COMPLETED
   - [x] **Presented solution options** - 3 options analyzed (pure client-side, hybrid, server actions)
   - [x] **Included implementation complexity, time estimates, and risk levels** for each option
   - [x] **Provided clear recommendation** - Option 2 (Pure Client-Side) recommended
   - [x] **Waiting for user decision** on preferred approach before proceeding ⏳

3. **CREATE TASK DOCUMENT THIRD (Required)** ✅ COMPLETED
   - [x] **Created new task document** in `ai_docs/tasks/056_llm_queue_admin_tab.md`
   - [x] **Filled out all sections** with specific details for LLM Queue feature
   - [x] **Included strategic analysis** in Section 2
   - [x] **🔢 FOUND LATEST TASK NUMBER** - Previous highest: 055, using 056
   - [x] **Named the file** - `056_llm_queue_admin_tab.md`
   - [x] **🚨 POPULATED CODE CHANGES OVERVIEW** - Section 10 shows before/after code snippets

4. **PRESENT IMPLEMENTATION OPTIONS (Required)** ⏳ NEXT STEP

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

5. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**
   - Will follow phase-by-phase implementation pattern from section 11
   - Will update task document in real-time with completion timestamps
   - Will wait for "proceed" confirmation between phases
   - Will never run dev server, build, or application commands

6. **VERIFY LIB FILE ARCHITECTURE (For any lib/ changes)**
   - Not applicable for this task (no lib/ files created)

7. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after all phases)**
   - Will present "Implementation Complete!" message after all phases
   - Will wait for user approval of comprehensive code review
   - Will execute thorough code review process if approved

8. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
   - Will read all modified files and verify changes
   - Will run linting and type-checking on all modified files
   - Will check for integration issues
   - Will verify all success criteria met
   - Will provide detailed review summary

### What Constitutes "Explicit User Approval"

**✅ STRATEGIC APPROVAL RESPONSES (Proceed to task document creation):**
- Already completed - Strategic analysis presented and documented

**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start implementation"
- "Begin" or "Execute the plan"
- "Looks good, implement it"

**✅ OPTION A RESPONSES (Show detailed code previews):**
- "A" or "Option A"
- "Preview the changes"
- "Show me the code changes"

**✅ OPTION C RESPONSES (Provide more feedback):**
- "C" or "Option C"
- "I have questions about..."
- "Can you modify..."

🛑 **NEVER start coding without explicit A/B/C choice from user!**
🛑 **NEVER run `npm run dev`, `npm run build`, or application execution commands!**

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Add proper error handling for all API calls
- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
  - [ ] Explain business logic and complex data transformations
  - [ ] Document API integration patterns and authentication requirements
  - [ ] No "changed from X to Y" or "updated to use new API" comments
- [ ] **🚨 MANDATORY: Use early returns to keep code clean and readable**
- [ ] **🚨 MANDATORY: Use async/await instead of .then() chaining**
- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
  - [ ] Expect correct API response format, fail fast with descriptive errors
  - [ ] No "try alternative fields" logic for API responses
- [ ] **Ensure responsive design (mobile-first approach with Tailwind breakpoints)**
- [ ] **Test components in both light and dark mode**
- [ ] **Verify mobile usability on devices 320px width and up**
- [ ] Follow accessibility guidelines (WCAG AA)
- [ ] Use semantic HTML elements
- [ ] **🚨 MANDATORY: Clean up removal artifacts**
  - [ ] No placeholder or explanatory comments for removed code

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern**
  - [x] External API calls → Client-side fetch (appropriate for monitoring interface)
  - [x] No Server Actions needed (read-only data fetching)
  - [x] No API routes created (direct client-to-LLM-service communication)
- [ ] **🚨 VERIFY: No server/client boundary violations in lib files**
  - [x] Not applicable (no lib/ files created, components are client-side only)
- [ ] **🚨 VERIFY: Proper context usage patterns**
  - [x] Not applicable (no context providers used for external API data)

---

## 17. Notes & Additional Context

### Research Links
- [LLM Workflow Microservice API Documentation](file:///home/tiran/emergency-planner-v2/LLM_service/API_GUIDE.md)
- [Next.js 15 Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Shadcn UI Dialog Component](https://ui.shadcn.com/docs/components/dialog)
- [Shadcn UI Table Component](https://ui.shadcn.com/docs/components/table)

### Design Mockups
**Visual Reference:** Match existing admin debug page tabs for consistency
- Card-based layout with header and content sections
- Table with hover states and clickable rows
- Status badges with color-coded states (green/yellow/red)
- Modal with clean JSON formatting and collapsible sections

### **⚠️ Common Server/Client Boundary Pitfalls to Avoid**

**❌ NEVER DO:**
- Expose API secrets in `NEXT_PUBLIC_*` environment variables without understanding security implications
- Assume CORS is configured on external APIs for browser requests
- Make API calls without proper error handling for network failures
- Use synchronous fetch calls (always use async/await)

**✅ ALWAYS DO:**
- Test API authentication with browser DevTools Network tab
- Implement loading states for all async operations
- Handle HTTP error status codes appropriately (401, 404, 500, etc.)
- Use TypeScript types for API responses to catch integration issues early
- Consider API route proxy for production security (optional for admin-only interface)

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

Before implementing any changes, the AI must systematically analyze potential second-order consequences and alert the user to any significant impacts.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** ✅ No changes to existing APIs - only reads from external service
- [ ] **Database Dependencies:** ✅ No database changes - external API data only
- [ ] **Component Dependencies:** ✅ No existing components depend on this new feature
- [ ] **Authentication/Authorization:** ✅ Uses existing admin middleware protection

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** ✅ Isolated data flow - no impact on existing app data
- [ ] **UI/UX Cascading Effects:** ⚠️ Adds 6th tab to TabsList - may affect tab layout on mobile
- [ ] **State Management:** ✅ Local component state only - no global state impact
- [ ] **Routing Dependencies:** ✅ No new routes - adds tab to existing `/admin/debug` page

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** ✅ N/A - no database queries
- [ ] **Bundle Size:** ⚠️ Adds ~5KB for new components (minimal impact)
- [ ] **Server Load:** ✅ No impact on app server - calls external LLM service
- [ ] **Caching Strategy:** ✅ Client-side fetch caching - no server cache invalidation needed

#### 4. **Security Considerations**
- [ ] **Attack Surface:** ⚠️ **RED FLAG** - Exposes API secret to client-side code via `NEXT_PUBLIC_*` prefix
- [ ] **Data Exposure:** ✅ Admin-only interface protected by existing middleware
- [ ] **Permission Escalation:** ✅ No new permissions - uses existing admin role check
- [ ] **Input Validation:** ✅ TypeScript enforces valid filter values, no user-entered input

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** ✅ Additive feature - no impact on existing workflows
- [ ] **Data Migration:** ✅ N/A - no data migration needed
- [ ] **Feature Deprecation:** ✅ No existing features removed or changed
- [ ] **Learning Curve:** ✅ Intuitive UI matches existing debug page patterns

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** ✅ Low - straightforward client components with standard patterns
- [ ] **Dependencies:** ✅ No new npm packages - uses existing shadcn/ui components
- [ ] **Testing Overhead:** ⚠️ Manual browser testing required (no automated tests for admin UI)
- [ ] **Documentation:** ✅ Self-documenting UI with clear labels and status indicators

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**

**1. API Secret Exposure via NEXT_PUBLIC Environment Variable**
- **Issue:** Using `NEXT_PUBLIC_LLM_WEBHOOK_SECRET` exposes the API secret to client-side JavaScript
- **Risk:** Anyone inspecting browser DevTools can see the secret and potentially make unauthorized API calls
- **Impact:** Medium security risk for admin-only interface, high risk if secret is reused elsewhere
- **Mitigation Options:**
  - **Option A:** Accept risk (admin-only interface, low exposure)
  - **Option B:** Create API route proxy to keep secret server-side (recommended for production)
  - **Option C:** Use separate "read-only" API key for LLM service (if service supports it)

**2. CORS Compatibility Unknown**
- **Issue:** LLM Microservice may not allow browser-based requests (CORS policy)
- **Risk:** API calls may fail with CORS errors, requiring API route proxy workaround
- **Impact:** Could block entire feature if LLM service doesn't whitelist origin
- **Mitigation:** Test API calls in browser DevTools during Phase 5, create API route proxy if CORS issues arise

#### ⚠️ **YELLOW FLAGS - Discuss with User**

**1. Tab Layout on Mobile Devices**
- **Issue:** Adding 6th tab may cause horizontal scrolling or cramped layout on mobile (<640px)
- **Impact:** Minor UX issue on small screens
- **Mitigation:** Test responsive behavior, consider stacked tab layout on mobile if needed

**2. No Automated Testing for Admin UI**
- **Issue:** Manual browser testing required for every change
- **Impact:** Regression risk if debug page is modified in future
- **Mitigation:** Accept manual testing for admin-only interfaces (low priority for automation)

### Mitigation Strategies

#### Security - API Secret Exposure
**Recommended Approach:** Create API Route Proxy (Deferred to production deployment)

**Implementation:**
```typescript
// src/app/api/admin/llm-jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') || 'all';

  const response = await fetch(
    `${process.env.LLM_SERVICE_URL}/api/v1/jobs?status=${status}`,
    { headers: { 'X-API-Secret': process.env.LLM_WEBHOOK_SECRET } } // Server-side secret
  );

  return NextResponse.json(await response.json());
}
```

**Benefits:**
- Keeps API secret server-side only
- No `NEXT_PUBLIC_*` prefix exposure
- Maintains same client-side code (just changes fetch URL)

**Trade-offs:**
- Adds 2 extra API routes to maintain
- Slight latency increase (client → Next.js API → LLM service)

#### CORS Compatibility
**Testing Plan:**
1. Implement direct client-side fetch first (simplest approach)
2. Test in browser DevTools during Phase 5
3. If CORS errors occur, implement API route proxy as fallback

**Rollback Strategy:**
- Keep direct fetch code commented in components
- API route proxy can be added without changing component logic
- Use environment variable to switch between direct/proxied endpoints

#### Mobile Tab Layout
**Responsive Design Strategy:**
```typescript
// Responsive tab layout for mobile
<TabsList className="grid w-full max-w-2xl grid-cols-6 md:grid-cols-6 sm:grid-cols-3">
  {/* Tabs stack 3-per-row on mobile, 6-per-row on desktop */}
</TabsList>
```

**Alternative:** Scrollable horizontal tab list on mobile
```typescript
<TabsList className="flex w-full max-w-2xl overflow-x-auto md:grid md:grid-cols-6">
  {/* Tabs scroll horizontally on mobile, grid on desktop */}
</TabsList>
```

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections of impact assessment filled out
- [x] **Identify Critical Issues:** Flagged API secret exposure and CORS compatibility concerns
- [x] **Propose Mitigation:** API route proxy strategy documented with code examples
- [x] **Alert User:** Security concerns clearly communicated in RED FLAGS section
- [x] **Recommend Alternatives:** Provided 3 options for API secret handling with trade-offs

### Example Analysis Summary

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Security Considerations - RED FLAG:**
⚠️ API secret exposure via `NEXT_PUBLIC_LLM_WEBHOOK_SECRET` environment variable
- Anyone inspecting browser can see the secret
- Recommended mitigation: Create API route proxy to keep secret server-side
- Alternative: Accept risk for admin-only interface (low exposure)

**CORS Compatibility - RED FLAG:**
⚠️ LLM Microservice may not allow browser-based requests
- Testing required during implementation to verify CORS policy
- Fallback plan: Implement API route proxy if CORS errors occur

**Performance Implications:**
✅ Minimal impact - adds ~5KB to bundle, no database queries
✅ External API calls don't affect app server performance

**User Experience Impacts:**
✅ Additive feature - no disruption to existing workflows
⚠️ Tab layout may need responsive adjustment for mobile devices

**🚨 USER ATTENTION REQUIRED:**
Please review the security trade-offs for API secret exposure. For production deployment, I recommend implementing an API route proxy to keep the webhook secret server-side. For development/testing, direct client-side API calls are acceptable.
```

---

*Template Version: 1.3*
*Last Updated: 12/18/2025*
*Created By: AI Agent*
