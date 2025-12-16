import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createClient } from '@/utils/supabase/server';
import { getLatestMissionReport } from '@/lib/mission-reports';

/**
 * API Route: GET /api/mission-plan/check
 * Check if user has existing plan (for free tier warning)
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Supabase session
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user's subscription tier
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const userTier = profile?.subscription_tier || 'FREE';

    // Only check for existing plans if user is on FREE tier
    if (userTier !== 'FREE') {
      return NextResponse.json({
        hasExistingPlan: false,
        userTier,
        existingPlan: null,
      });
    }

    // Get latest mission report for free user
    const existingReport = await getLatestMissionReport(user.id);

    if (!existingReport) {
      return NextResponse.json({
        hasExistingPlan: false,
        userTier,
        existingPlan: null,
      });
    }

    // Return basic details of existing plan
    return NextResponse.json({
      hasExistingPlan: true,
      userTier,
      existingPlan: {
        id: existingReport.id,
        title: existingReport.title,
        location: existingReport.location,
        scenarios: existingReport.scenarios,
        createdAt: existingReport.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to check existing plans:', error);

    return NextResponse.json(
      {
        error: 'Failed to check existing plans',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
