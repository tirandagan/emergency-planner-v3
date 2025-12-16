import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/utils/supabase/server';
import { getMissionReportById, userOwnsMissionReport } from '@/lib/mission-reports';
import { PlanHeader } from '@/components/plans/detail/PlanHeader';
import { PlanContent } from '@/components/plans/detail/PlanContent';
import { PlanMetadata } from '@/components/plans/detail/PlanMetadata';
import { PlanDetailsTabs } from '@/components/plans/plan-details/PlanDetailsTabs';
import { QuickStatsCards } from '@/components/plans/plan-details/QuickStatsCards';
import type { ReportData, ReportDataV2 } from '@/types/mission-report';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface PageProps {
  params: Promise<{
    reportId: string;
  }>;
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { reportId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  // Check if user owns this report
  const ownsReport = await userOwnsMissionReport(user.id, reportId);
  if (!ownsReport) {
    notFound();
  }

  // Fetch the mission report
  const report = await getMissionReportById(reportId);
  if (!report) {
    notFound();
  }

  // Get user's subscription tier and name
  const [profile] = await db
    .select({
      tier: profiles.subscriptionTier,
      fullName: profiles.fullName,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const userTier = (profile?.tier || 'FREE') as 'FREE' | 'BASIC' | 'PRO';
  const userName = profile?.fullName || user.email || 'User';

  // Get current share count for this user
  const { getUserShareCount } = await import('@/lib/mission-reports');
  const currentShareCount = await getUserShareCount(user.id);

  // Cast report data and check if this is a V2 report with structured sections
  const reportData = report.reportData as ReportData;
  const isV2Report = reportData.version === '2.0' && 'sections' in reportData;

  return (
    <div className="container mx-auto py-4 md:py-6 px-4 max-w-6xl">
      {/* Header */}
      <PlanHeader
        report={report}
        userTier={userTier}
        currentShareCount={currentShareCount}
        userName={userName}
      />

      {isV2Report ? (
        // V2 Report: Full-width tabbed interface with Quick Stats
        <div className="mt-4">
          {/* Quick Stats Cards */}
          <QuickStatsCards reportData={reportData as ReportDataV2} reportId={reportId} />

          {/* Tabbed Interface */}
          <PlanDetailsTabs
            reportId={reportId}
            reportData={reportData as ReportDataV2}
            evacuationRoutes={report.evacuationRoutes}
            userTier={userTier}
          />
        </div>
      ) : (
        // V1 Report: Original two-column layout
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          {/* Main Content - 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <PlanContent content={reportData.content} />
          </div>

          {/* Sidebar - 1/3 width on large screens */}
          <div className="lg:col-span-1">
            <PlanMetadata report={report} />
          </div>
        </div>
      )}
    </div>
  );
}
