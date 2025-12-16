import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getMissionReportById, userOwnsMissionReport } from '@/lib/mission-reports';

/**
 * GET /api/plans/[reportId]
 * Fetch a mission report by ID for editing
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
): Promise<NextResponse> {
  try {
    const { reportId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const ownsReport = await userOwnsMissionReport(user.id, reportId);
    if (!ownsReport) {
      return NextResponse.json({ error: 'Not found or access denied' }, { status: 404 });
    }

    // Fetch the report
    const report = await getMissionReportById(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching mission report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
