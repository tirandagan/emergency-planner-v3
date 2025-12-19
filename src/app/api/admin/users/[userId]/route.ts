import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { missionReports } from '@/db/schema/mission-reports';
import { userActivityLog } from '@/db/schema/analytics';
import { billingTransactions } from '@/db/schema/billing';
import { eq, desc, isNull, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { logApiError } from '@/lib/system-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  let adminUserId: string | undefined;
  let targetUserId: string | undefined;

  try {
    const { userId } = await params;
    targetUserId = userId;

    // Check admin authorization
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    adminUserId = authUser?.id;

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [currentUser] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, authUser.id))
      .limit(1);

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch comprehensive user data
    const [userProfile] = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        email: profiles.email,
        phone: profiles.phone,
        location: profiles.location,
        timezone: profiles.timezone,
        subscriptionTier: profiles.subscriptionTier,
        subscriptionStatus: profiles.subscriptionStatus,
        subscriptionPeriodEnd: profiles.subscriptionPeriodEnd,
        stripeCustomerId: profiles.stripeCustomerId,
        isHighValue: profiles.isHighValue,
        lastActiveAt: profiles.lastActiveAt,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch mission reports and calculate favorite scenarios (excluding soft-deleted plans)
    const plans = await db
      .select({
        id: missionReports.id,
        scenarios: missionReports.scenarios,
        createdAt: missionReports.createdAt,
      })
      .from(missionReports)
      .where(
        and(
          eq(missionReports.userId, userId),
          isNull(missionReports.deletedAt)
        )
      )
      .orderBy(desc(missionReports.createdAt));

    // Calculate favorite scenarios (most common)
    const scenarioCounts: Record<string, number> = {};
    plans.forEach((plan) => {
      plan.scenarios.forEach((scenario) => {
        scenarioCounts[scenario] = (scenarioCounts[scenario] || 0) + 1;
      });
    });
    const favoriteScenarios = Object.entries(scenarioCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([scenario]) => scenario);

    // Fetch recent activities (last 20)
    const recentActivities = await db
      .select({
        id: userActivityLog.id,
        activityType: userActivityLog.activityType,
        createdAt: userActivityLog.createdAt,
        metadata: userActivityLog.metadata,
      })
      .from(userActivityLog)
      .where(eq(userActivityLog.userId, userId))
      .orderBy(desc(userActivityLog.createdAt))
      .limit(20);

    // Fetch billing transactions
    const transactions = await db
      .select({
        id: billingTransactions.id,
        transactionDate: billingTransactions.transactionDate,
        description: billingTransactions.description,
        amount: billingTransactions.amount,
        status: billingTransactions.status,
        invoicePdfUrl: billingTransactions.invoicePdfUrl,
      })
      .from(billingTransactions)
      .where(eq(billingTransactions.userId, userId))
      .orderBy(desc(billingTransactions.transactionDate));

    // Calculate lifetime value (sum of succeeded transactions)
    const lifetimeValue = transactions
      .filter((t) => t.status === 'succeeded')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const responseData = {
      ...userProfile,
      plansCreated: plans.length,
      favoriteScenarios,
      recentActivities,
      billingTransactions: transactions,
      lifetimeValue,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching user details:', error);

    await logApiError(error, {
      route: '/api/admin/users/[userId]',
      userId: adminUserId,
      userAction: 'Fetching comprehensive user details (admin operation)',
      metadata: {
        targetUserId,
      },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
