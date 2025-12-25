/**
 * Mission Generation Progress Page
 *
 * Displays real-time progress of mission plan generation using JobStatusPoller.
 * Redirects to completed plan when generation finishes.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/db';
import { missionReports } from '@/db/schema/mission-reports';
import { eq } from 'drizzle-orm';
import { JobStatusPoller } from '@/components/planner/JobStatusPoller';
import { Loader2 } from 'lucide-react';

interface ProgressPageProps {
  params: Promise<{ reportId: string }>;
  searchParams: Promise<{ jobId?: string }>;
}

export default async function ProgressPage({
  params,
  searchParams,
}: ProgressPageProps) {
  // Await params and searchParams (Next.js 15 requirement)
  const { reportId } = await params;
  const { jobId } = await searchParams;

  // Verify user authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch mission report to verify ownership and status
  const [report] = await db
    .select({
      id: missionReports.id,
      userId: missionReports.userId,
      status: missionReports.status,
      jobId: missionReports.jobId,
    })
    .from(missionReports)
    .where(eq(missionReports.id, reportId))
    .limit(1);

  // Handle missing or unauthorized report
  if (!report) {
    redirect('/plans');
  }

  if (report.userId !== user.id) {
    redirect('/plans');
  }

  // If already completed, redirect to plan page
  if (report.status === 'completed') {
    redirect(`/plans/${reportId}`);
  }

  // If failed, redirect to plans list
  if (report.status === 'failed') {
    redirect('/plans');
  }

  // Use jobId from URL params or database
  const activeJobId = jobId || report.jobId;

  if (!activeJobId) {
    redirect('/plans');
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
                Loading progress...
              </p>
            </div>
          }
        >
          <JobStatusPoller reportId={reportId} jobId={activeJobId} />
        </Suspense>
      </div>
    </div>
  );
}
