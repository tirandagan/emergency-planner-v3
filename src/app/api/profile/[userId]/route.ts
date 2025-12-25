import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';

/**
 * GET /api/profile/[userId]
 * Fetch user profile by ID using Drizzle ORM
 *
 * This API route provides client-safe access to user profiles without
 * requiring server-side components or next/headers dependencies.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Query using Drizzle ORM
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Return profile data with proper camelCase field names
    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      birthYear: profile.birthYear,
      gender: profile.gender,
      role: profile.role,
      subscriptionTier: profile.subscriptionTier,
      subscriptionStatus: profile.subscriptionStatus,
      subscriptionPeriodEnd: profile.subscriptionPeriodEnd,
      stripeCustomerId: profile.stripeCustomerId,
      stripeSubscriptionId: profile.stripeSubscriptionId,
      location: profile.location,
      phone: profile.phone,
      timezone: profile.timezone,
      newsletterOptIn: profile.newsletterOptIn,
      marketingEmailsOptIn: profile.marketingEmailsOptIn,
      systemEmailsOptIn: profile.systemEmailsOptIn,
      dripCampaignsOptIn: profile.dripCampaignsOptIn,
      callRemindersOptIn: profile.callRemindersOptIn,
      householdMembers: profile.householdMembers,
      saveHouseholdPreference: profile.saveHouseholdPreference,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error('[Profile API] Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
