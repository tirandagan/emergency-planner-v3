# Mission Planner → LLM Service Conversion - IMPLEMENTATION READY

**Status:** ✅ All strategic decisions finalized, ready for implementation
**Created:** 2025-12-24
**Last Updated:** 2025-12-24

---

## 📋 **Executive Summary**

Convert mission generation from direct OpenRouter API calls to LLM service workflow orchestration with:
- ✅ Job-based architecture with polling UI
- ✅ Webhook-based completion handling
- ✅ Multi-job support with dashboard tracking
- ✅ Job cancellation capabilities
- ✅ Sticky toast notifications

---

## 🎯 **Final Strategic Decisions**

### **User Experience Flow**

1. **User completes wizard** → Job submitted → Redirect to `/plans/[reportId]/progress`
2. **Progress page** → Component-scoped polling (2s interval), shows friendly step names
3. **User navigates away** → Polling STOPS, job continues in background
4. **Dashboard** → Shows list of in-progress jobs with mini progress cards
5. **Job completes** → Webhook updates status → Sticky toast notification appears
6. **User clicks "View Plan"** → Navigate to `/plans/[reportId]` (full report)

### **Key Architectural Decisions**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Polling Strategy** | Visibility-aware, component-scoped | Resource efficient, UX focused |
| **Multi-Job Support** | Yes - multiple simultaneous jobs allowed | User flexibility |
| **Dashboard Display** | List view with mini progress cards | Clear, scannable |
| **Job Cancellation** | Both progress page + dashboard | Maximum control |
| **Cancel Behavior** | Delete mission_report record | Clean up, avoid clutter |
| **Completion Notification** | Sticky in-app toast (persists until dismissed) | Non-intrusive, always visible |
| **Failed Job Handling** | Show actionable error + manual retry | User empowerment |
| **Job Archive** | Manual admin cleanup (>7 days) | Admin control |
| **Status Tracking** | Hybrid - webhook updates, sync on page load | Best of both worlds |
| **Webhook** | Use existing `/api/webhooks/llm-callback` | Leverage existing infrastructure |

---

## 📦 **Implementation Phases**

### **Phase 1: Workflow Enhancement** (LLM Service)
**Goal:** Add friendly display names to workflow steps for progress UI

**Files to Modify:**
- `LLM_service/workflows/definitions/mission_generation.json`

**Changes:**
```json
{
  "steps": [
    {
      "id": "format_bundles",
      "description": "Format product bundles for LLM context injection",
      "display_name": "Formatting Bundles",
      ...
    },
    {
      "id": "join_bundles",
      "description": "Join bundle data into single context string",
      "display_name": "Joining Bundles",
      ...
    },
    {
      "id": "build_scenario_list",
      "description": "Format scenarios into readable list",
      "display_name": "Building Scenario List",
      ...
    },
    {
      "id": "build_user_message",
      "description": "Build user message with form data summary",
      "display_name": "Building User Message",
      ...
    },
    {
      "id": "generate_mission_plan",
      "description": "Generate comprehensive mission plan with Claude Sonnet 3.5",
      "display_name": "Generating Mission Plan",
      ...
    },
    {
      "id": "parse_sections",
      "description": "Extract structured sections from mission plan",
      "display_name": "Parsing Sections",
      ...
    }
  ]
}
```

---

### **Phase 2: Database Schema Changes** (Next.js)
**Goal:** Add job_id tracking to mission_reports table

**Files to Modify:**
- `src/db/schema/mission-reports.ts`

**Schema Changes:**
```typescript
export const missionReports = pgTable('mission_reports', {
  // ... existing fields
  jobId: uuid('job_id'), // NEW: LLM service job ID
  status: varchar('status', { length: 50 }), // NEW: 'generating' | 'completed' | 'failed' | 'cancelled'
}, (table) => [
  index('idx_mission_reports_job_id').on(table.jobId),
  index('idx_mission_reports_status').on(table.status),
]);
```

**Migration Steps:**
1. Generate migration: `npm run db:generate`
2. Create down migration (see drizzle_down_migration.md)
3. Apply migration: `npm run db:migrate`

---

### **Phase 3: LLM Service Client Library** (Next.js)
**Goal:** Create reusable TypeScript client for LLM service interactions

**New Files:**
- `src/lib/llm-service-client.ts`
- `src/types/llm-service.ts`

**Key Functions:**
```typescript
// src/lib/llm-service-client.ts
export async function submitWorkflow(
  workflowName: string,
  inputData: Record<string, unknown>
): Promise<{ jobId: string }>;

export async function getJobStatus(
  jobId: string
): Promise<LLMJobStatus>;

export async function cancelJob(
  jobId: string
): Promise<{ deleted: boolean }>;

export async function pollJobUntilComplete(
  jobId: string,
  onProgress?: (progress: LLMJobProgress) => void
): Promise<LLMJobResult>;
```

---

### **Phase 4: API Routes (Proxy Pattern)** (Next.js)
**Goal:** Create Next.js API routes that proxy to LLM service

**New Files:**
- `src/app/api/llm-service/jobs/route.ts` (POST - submit job)
- `src/app/api/llm-service/jobs/[jobId]/route.ts` (GET - job status)
- `src/app/api/llm-service/jobs/[jobId]/cancel/route.ts` (POST - cancel job)

**Implementation:**
```typescript
// POST /api/llm-service/jobs
export async function POST(request: Request) {
  const { workflow_name, input_data } = await request.json();

  // Forward to LLM service with API secret
  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/workflow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Secret': process.env.LLM_SERVICE_API_SECRET!,
    },
    body: JSON.stringify({ workflow_name, input_data }),
  });

  return NextResponse.json(await response.json());
}
```

```typescript
// POST /api/llm-service/jobs/[jobId]/cancel
export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  // Call LLM service bulk delete endpoint
  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/jobs/bulk`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Secret': process.env.LLM_SERVICE_API_SECRET!,
    },
    body: JSON.stringify({ job_ids: [jobId] }),
  });

  return NextResponse.json(await response.json());
}
```

---

### **Phase 5: Webhook Handler** (Next.js)
**Goal:** Add mission_generation workflow handler to existing webhook endpoint

**Files to Modify:**
- `src/lib/ai/webhook-handlers.ts`
- `src/app/api/webhooks/llm-callback/route.ts`

**New Handler:**
```typescript
// src/lib/ai/webhook-handlers.ts
export async function handleMissionGenerationComplete(
  userId: string,
  jobId: string,
  result: any
): Promise<void> {
  try {
    // 1. Find mission_report by job_id
    const [report] = await db
      .select()
      .from(missionReports)
      .where(eq(missionReports.jobId, jobId))
      .limit(1);

    if (!report) {
      console.warn(`[Webhook] No mission report found for job ${jobId}`);
      return;
    }

    // 2. Parse workflow output
    const missionPlan = result.output.mission_plan;
    const parsedSections = result.output.parsed_sections;
    const llmUsage = result.output.llm_usage;

    // 3. Build ReportDataV2 structure
    const reportData: ReportDataV2 = {
      version: '2.0',
      generatedWith: 'llm_service',
      content: missionPlan,
      sections: {
        executiveSummary: parsedSections.executive_summary,
        riskAssessment: parseRiskAssessment(parsedSections.risk_assessment),
        bundles: parseBundleRecommendations(parsedSections.recommended_bundles),
        skills: parseSkills(parsedSections.survival_skills),
        simulation: parseSimulation(parsedSections.day_by_day),
        nextSteps: parseNextSteps(parsedSections.next_steps),
      },
      formData: report.reportData.formData,
      metadata: {
        model: llmUsage.model,
        streamDurationMs: llmUsage.duration_ms,
        generatedAt: new Date().toISOString(),
        tokensUsed: llmUsage.total_tokens,
        inputTokens: llmUsage.input_tokens,
        outputTokens: llmUsage.output_tokens,
      },
    };

    // 4. Update mission_report status and data
    await db
      .update(missionReports)
      .set({
        status: 'completed',
        reportData,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, report.id));

    console.log(`[Webhook] Mission generation complete for report ${report.id}`);

    // 5. Revalidate paths
    revalidatePath(`/plans/${report.id}`, 'page');
    revalidatePath('/dashboard', 'page');
    revalidatePath('/plans', 'page');

    // 6. Trigger toast notification (if user is online)
    // This will be handled by client-side polling or SSE in future enhancement

  } catch (error) {
    console.error('[Webhook] Error handling mission_generation completion:', error);

    // Mark report as failed
    await db
      .update(missionReports)
      .set({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      })
      .where(eq(missionReports.jobId, jobId));
  }
}
```

**Update Webhook Route:**
```typescript
// src/app/api/webhooks/llm-callback/route.ts (line 251)
if (payload.event === 'workflow.completed' && userId) {
  if (payload.workflow_name === 'emergency_contacts') {
    handleEmergencyContactsComplete(userId, payload.result).catch(err => {
      console.error('[LLM Webhook] Async processing failed:', err);
    });
  }

  // NEW: Handle mission_generation workflow
  if (payload.workflow_name === 'mission_generation') {
    handleMissionGenerationComplete(
      userId,
      payload.job_id,
      payload.result
    ).catch(err => {
      console.error('[LLM Webhook] Mission generation processing failed:', err);
    });
  }
}
```

---

### **Phase 6: Server Actions** (Next.js)
**Goal:** Create server-side mutations for job submission and management

**New Files:**
- `src/app/actions/mission-generation.ts`

**Key Actions:**
```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { db } from '@/db';
import { missionReports } from '@/db/schema/mission-reports';
import { submitWorkflow, cancelJob } from '@/lib/llm-service-client';
import { revalidatePath } from 'next/cache';

export async function submitMissionGenerationJob(
  formData: WizardFormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Transform wizard data to workflow input format
  const inputData = {
    formData,
    bundles: await getBundlesForRecommendation(),
    familyDetails: formatFamilyDetails(formData.familyMembers),
    mobility: formatMobilityPlan(formData.mobilityPlan),
    budgetTierLabel: formatBudgetTier(formData.budgetTier),
    budgetAmount: calculateBudgetAmount(formData.budgetTier),
  };

  // 2. Submit job to LLM service
  const { jobId } = await submitWorkflow('mission_generation', inputData);

  // 3. Create pending mission_report record
  const [report] = await db.insert(missionReports).values({
    userId: user.id,
    jobId,
    status: 'generating',
    location: `${formData.location.city}, ${formData.location.state}`,
    reportData: {
      version: '2.0',
      generatedWith: 'llm_service',
      formData,
      content: '',
      sections: {} as any,
      metadata: {} as any,
    } as ReportDataV2,
  }).returning();

  revalidatePath('/dashboard', 'page');

  return { jobId, reportId: report.id };
}

export async function cancelMissionGenerationJob(
  reportId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 1. Get report and verify ownership
  const [report] = await db
    .select()
    .from(missionReports)
    .where(eq(missionReports.id, reportId))
    .limit(1);

  if (!report || report.userId !== user.id) {
    throw new Error('Report not found or unauthorized');
  }

  if (!report.jobId) {
    throw new Error('No job associated with this report');
  }

  // 2. Cancel job in LLM service
  await cancelJob(report.jobId);

  // 3. Delete mission_report record
  await db
    .delete(missionReports)
    .where(eq(missionReports.id, reportId));

  revalidatePath('/dashboard', 'page');
  revalidatePath('/plans', 'page');

  return { success: true };
}
```

---

### **Phase 7: Frontend Components** (Next.js)
**Goal:** Create polling UI components with visibility-aware behavior

**New Files:**
- `src/components/planner/JobStatusPoller.tsx`
- `src/components/dashboard/InProgressJobCard.tsx`
- `src/components/ui/StickyToast.tsx`

**JobStatusPoller Component:**
```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import type { LLMJobStatus, LLMJobProgress } from '@/types/llm-service';

interface JobStatusPollerProps {
  reportId: string;
  jobId: string;
  onComplete?: (reportId: string) => void;
  onError?: (error: string) => void;
}

export function JobStatusPoller({
  reportId,
  jobId,
  onComplete,
  onError,
}: JobStatusPollerProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<LLMJobProgress>({
    currentStep: 'Initializing...',
    percentage: 0,
  });
  const [isPolling, setIsPolling] = useState(true);

  // Visibility-aware polling
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let isVisible = !document.hidden;

    const poll = async () => {
      if (!isVisible) return; // Don't poll when tab is hidden

      try {
        const response = await fetch(`/api/llm-service/jobs/${jobId}`);
        const status: LLMJobStatus = await response.json();

        if (status.status === 'completed') {
          setIsPolling(false);
          onComplete?.(reportId);
          return;
        }

        if (status.status === 'failed') {
          setIsPolling(false);
          onError?.(status.error_message || 'Job failed');
          return;
        }

        // Update progress
        setProgress(estimateProgress(status));

      } catch (error) {
        console.error('[JobPoller] Error fetching status:', error);
        // Don't stop polling on network errors, retry next interval
      }
    };

    // Handle visibility changes
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;

      if (isVisible && isPolling) {
        // Tab became visible - refresh state immediately
        poll();

        // Resume polling
        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(poll, 2000);
      } else {
        // Tab hidden - stop polling
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start initial polling
    if (isVisible) {
      poll();
      pollInterval = setInterval(poll, 2000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [jobId, reportId, isPolling, onComplete, onError]);

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />

      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Generating Your Mission Plan
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-400">
          {progress.currentStep}
        </p>
      </div>

      <div className="w-full max-w-md">
        <ProgressBar value={progress.percentage} max={100} />
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
          {progress.percentage}% complete
        </p>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
        This usually takes 30-60 seconds. Feel free to navigate away -
        we'll notify you when it's ready!
      </p>
    </div>
  );
}

function estimateProgress(status: LLMJobStatus): LLMJobProgress {
  const stepMap: Record<string, { display: string; percentage: number }> = {
    'format_bundles': { display: 'Formatting Bundles', percentage: 5 },
    'join_bundles': { display: 'Joining Bundles', percentage: 10 },
    'build_scenario_list': { display: 'Building Scenario List', percentage: 15 },
    'build_user_message': { display: 'Building User Message', percentage: 20 },
    'generate_mission_plan': { display: 'Generating Mission Plan', percentage: 90 },
    'parse_sections': { display: 'Parsing Sections', percentage: 95 },
  };

  const currentStepId = status.current_step_id;
  const stepInfo = stepMap[currentStepId] || { display: 'Processing...', percentage: 0 };

  return {
    currentStep: stepInfo.display,
    percentage: stepInfo.percentage,
  };
}
```

**Dashboard InProgressJobCard:**
```typescript
'use client';

import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cancelMissionGenerationJob } from '@/app/actions/mission-generation';

interface InProgressJobCardProps {
  reportId: string;
  jobId: string;
  location: string;
  scenarios: string[];
  startedAt: Date;
}

export function InProgressJobCard({
  reportId,
  jobId,
  location,
  scenarios,
  startedAt,
}: InProgressJobCardProps) {
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this plan generation?')) {
      return;
    }

    setIsCancelling(true);
    try {
      await cancelMissionGenerationJob(reportId);
      router.refresh();
    } catch (error) {
      console.error('Failed to cancel job:', error);
      alert('Failed to cancel job. Please try again.');
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {scenarios.join(', ')} Plan
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isCancelling}
          className="text-destructive hover:text-destructive"
        >
          {isCancelling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
        {location}
      </p>

      <div className="mb-3">
        <ProgressBar value={45} max={100} className="mb-1" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Generating...
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/plans/${reportId}/progress`)}
        className="w-full"
      >
        View Progress
      </Button>
    </div>
  );
}
```

**Sticky Toast Notification:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface StickyToastProps {
  reportId: string;
  scenario: string;
  onDismiss: () => void;
}

export function StickyToast({ reportId, scenario, onDismiss }: StickyToastProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-900 border-2 border-primary rounded-lg shadow-lg p-4 max-w-md animate-in slide-in-from-bottom">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Your {scenario} Plan is ready! 🎉
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            You can always find your plans in the Dashboard or Plans menu.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                router.push(`/plans/${reportId}`);
                onDismiss();
              }}
            >
              View Plan
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsVisible(false);
                onDismiss();
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss();
          }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

---

### **Phase 8: Admin Cleanup Functions** (Next.js)
**Goal:** Provide both UI and CLI tools for cleaning up old jobs

**New Files:**
- `src/app/(protected)/admin/jobs/cleanup/page.tsx`
- `scripts/cleanup-old-jobs.ts`

**Admin UI Page:**
```typescript
// src/app/(protected)/admin/jobs/cleanup/page.tsx
import { Button } from '@/components/ui/button';
import { cleanupOldJobs } from '@/app/actions/admin';

export default async function JobCleanupPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Job Cleanup</h1>

      <form action={cleanupOldJobs}>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Delete workflow jobs older than 7 days to reduce database bloat.
        </p>

        <Button type="submit">Clean Up Old Jobs</Button>
      </form>
    </div>
  );
}
```

**CLI Script:**
```typescript
// scripts/cleanup-old-jobs.ts
import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function cleanupOldJobs() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // This assumes workflow_jobs table exists in our schema
  // If not, we'll need to make direct SQL query to LLM service database

  const result = await db.execute(sql`
    DELETE FROM workflow_jobs
    WHERE created_at < ${sevenDaysAgo}
    AND status IN ('completed', 'failed')
    RETURNING id
  `);

  console.log(`✅ Deleted ${result.rows.length} old jobs`);
}

cleanupOldJobs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
```

**NPM Script:**
```json
// package.json
{
  "scripts": {
    "jobs:cleanup": "npx tsx scripts/cleanup-old-jobs.ts"
  }
}
```

---

## 🎯 **Success Criteria Checklist**

- [ ] Mission generation uses LLM service `/api/v1/workflow` endpoint
- [ ] Job status tracked via `/api/v1/jobs/{job_id}` endpoint
- [ ] Workflow definition `mission_generation.json` has friendly `display_name` fields
- [ ] Generated mission reports match current output format and quality
- [ ] Cost tracking metadata captured from workflow execution
- [ ] Polling only occurs when user is on progress page (component-scoped)
- [ ] Dashboard shows list of in-progress jobs with mini progress cards
- [ ] Job cancellation available from both progress page and dashboard
- [ ] Sticky toast notification appears when job completes (if user is on site)
- [ ] Webhook handler updates mission_report status in background
- [ ] Error handling provides actionable feedback with manual retry option
- [ ] Admin can manually clean up jobs >7 days old (UI + CLI)
- [ ] Visibility-aware polling (pauses when tab hidden, resumes on visible)

---

## 📝 **Environment Variables**

```bash
# Add to .env.local
LLM_SERVICE_URL=http://localhost:8000
LLM_SERVICE_API_SECRET=your-secret-key-change-in-production
LLM_WEBHOOK_SECRET=your-webhook-secret-change-in-production
```

---

## 🚀 **Ready for Implementation**

All strategic decisions finalized. Ready to proceed with phase-by-phase implementation!

**Next Action:** Begin Phase 1 - Update workflow JSON with display names.
