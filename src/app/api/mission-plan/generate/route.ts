import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createClient } from '@/utils/supabase/server';
import { generateMissionPlan } from '@/lib/ai/mission-generator';
import { saveMissionReport } from '@/lib/ai/save-mission-report';
import type { WizardFormData } from '@/types/wizard';
import { logApiError } from '@/lib/system-logger';

/**
 * API Route: POST /api/mission-plan/generate
 * Generate a mission plan using AI and save to database
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { formData } = body as {
      formData: WizardFormData;
    };

    if (!formData) {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      );
    }

    // Generate the mission plan (pass userId for AI usage logging)
    const result = await generateMissionPlan(formData, user.id);

    // Save to database (inserts new, then deletes old for FREE tier users)
    const { reportId, previousReportId } = await saveMissionReport({
      userId: user.id,
      missionPlan: result,
      userTier,
    });

    return NextResponse.json({
      success: true,
      reportId,
      previousReportId,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Mission plan generation failed:', error);

    // Get user ID from the request context if available
    let userId: string | undefined;
    try {
      const user = await getCurrentUser();
      userId = user?.id;
    } catch {
      // User context not available
    }

    await logApiError(error, {
      route: '/api/mission-plan/generate',
      userId,
      userAction: 'Generating mission plan via API',
    });

    return NextResponse.json(
      {
        error: "We're experiencing issues generating your plan. Our team has been notified and will resolve this shortly.",
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
