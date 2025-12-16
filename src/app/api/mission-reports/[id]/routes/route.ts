import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkRoutesStatus } from '@/lib/mission-generation/background-tasks';
import { userOwnsMissionReport } from '@/lib/mission-reports';
import type { WizardFormData } from '@/types/wizard';

/**
 * GET /api/mission-reports/[id]/routes
 * Check if evacuation routes are ready for a report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership
    const ownsReport = await userOwnsMissionReport(user.id, reportId);
    if (!ownsReport) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    // Check route status
    const status = await checkRoutesStatus(reportId);

    // If routes don't exist (legacy report or new report still generating),
    // trigger background task generation for legacy reports
    if (!status.ready) {
      // Get the report to check if it's a legacy report (no evacuationRoutes field)
      const { getMissionReportById } = await import('@/lib/mission-reports');
      const report = await getMissionReportById(reportId);

      if (report && report.reportData) {
        const reportData = report.reportData as { formData?: WizardFormData };
        // Only trigger for legacy reports that have formData but no evacuationRoutes field
        if (reportData.formData && report.evacuationRoutes === undefined) {
          // Trigger background task for legacy report (fire and forget)
          const { executeBackgroundTasks } = await import('@/lib/mission-generation/background-tasks');
          executeBackgroundTasks({
            reportId,
            location: reportData.formData.location,
            scenarios: reportData.formData.scenarios,
            formData: reportData.formData,
          }).catch(err => {
            console.error('Failed to trigger background tasks for legacy report:', err);
          });
        }
      }
    }

    return NextResponse.json({
      ready: status.ready,
      routeCount: status.routes?.length ?? 0,
      routes: status.routes ?? [],
    });
  } catch (error) {
    console.error('Error checking route status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
