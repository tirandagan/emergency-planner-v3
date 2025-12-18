import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/supabase/server';
import { deleteMissionReport, getMissionReportById } from '@/lib/mission-reports';
import { logApiError } from '@/lib/system-logger';

/**
 * API Route: POST /api/mission-plan/cancel
 * Cancel a plan generation by deleting the new report
 * and optionally restoring the previous one
 */
export async function POST(request: NextRequest) {
  let userId: string | undefined;

  try {
    // Get authenticated user from Supabase session
    const user = await getCurrentUser();
    userId = user?.id;

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportId } = body as {
      reportId: string;
    };

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Verify the report belongs to this user before deleting
    const report = await getMissionReportById(reportId);

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    if (report.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - This report does not belong to you' },
        { status: 403 }
      );
    }

    // Delete the new report
    await deleteMissionReport(reportId);

    return NextResponse.json({
      success: true,
      message: 'Plan generation cancelled and new report deleted',
    });
  } catch (error) {
    console.error('Failed to cancel plan generation:', error);

    await logApiError(error, {
      route: '/api/mission-plan/cancel',
      userId,
      userAction: 'Cancelling mission plan generation',
    });

    return NextResponse.json(
      {
        error: "We're experiencing issues cancelling the plan. Our team has been notified and will resolve this shortly.",
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
