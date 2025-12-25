import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/utils/supabase/server';
import { getLatestMissionReport } from '@/lib/mission-reports';
import { logApiError } from '@/lib/system-logger';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * API Route: GET /api/mission-plan/check
 * Check if user has existing plan (for free tier warning)
 */
export async function GET(request: NextRequest) {
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

    // Get user's subscription tier using Drizzle ORM
    const [profile] = await db
      .select({ subscriptionTier: profiles.subscriptionTier })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const userTier = profile?.subscriptionTier || 'FREE';

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

    await logApiError(error, {
      route: '/api/mission-plan/check',
      userId,
      userAction: 'Checking for existing mission plans',
    });

    return NextResponse.json(
      {
        error: "We're experiencing issues checking your plans. Our team has been notified and will resolve this shortly.",
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
