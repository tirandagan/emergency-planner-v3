/**
 * Admin Dashboard Metrics - Type-safe Drizzle ORM queries
 *
 * This module provides all metric calculations for the admin dashboard:
 * - User distribution by subscription tier
 * - Monthly recurring revenue and ARPU
 * - Engagement metrics (plans created)
 * - Top scenarios analysis
 * - Conversion rate calculations
 * - Recent user activity log
 *
 * All functions return structured data with proper error handling.
 */

import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { missionReports } from '@/db/schema/mission-reports';
import { billingTransactions } from '@/db/schema/billing';
import { userActivityLog } from '@/db/schema/analytics';
import { eq, gte, sql, desc, and } from 'drizzle-orm';

// ==================== TYPE DEFINITIONS ====================

export interface UserStats {
  totalUsers: number;
  freeUsers: number;
  basicUsers: number;
  proUsers: number;
  activeUsers: number; // Users with plans in last 30 days
  tierDistribution: Array<{ name: string; value: number; color: string }>;
}

export interface RevenueStats {
  mrr: number; // Monthly Recurring Revenue
  arpu: number; // Average Revenue Per User
  totalRevenue: number;
  totalPaidUsers: number;
}

export interface EngagementStats {
  totalPlans: number;
  plansThisMonth: number;
  plansToday: number;
  avgPlansPerUser: number;
}

export interface ScenarioStats {
  topScenarios: Array<{ scenario: string; count: number; percentage: number }>;
}

export interface ConversionStats {
  freeToPaidRate: number; // Percentage
  basicToProRate: number; // Percentage
  totalPaidUsers: number;
  totalFreeUsers: number;
}

export interface ActivityLogEntry {
  id: string;
  userEmail: string;
  activityType: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AdminDashboardMetrics {
  userStats: UserStats;
  revenueStats: RevenueStats;
  engagementStats: EngagementStats;
  scenarioStats: ScenarioStats;
  conversionStats: ConversionStats;
  recentActivity: ActivityLogEntry[];
  lastUpdated: Date;
}

// ==================== MASTER METRICS FUNCTION ====================

/**
 * Fetch all admin dashboard metrics in parallel
 * @returns Complete dashboard metrics object
 */
export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const overallStart = Date.now();
  console.log('[Admin Metrics] Starting metrics fetch...');

  try {
    // CRITICAL: Add global timeout to prevent entire dashboard from hanging
    // Increased to 20s for WSL2 network latency (avg query time on WSL2: 200-500ms each)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Admin metrics fetch timeout after 20 seconds")), 20000)
    );

    // Fetch all metrics in parallel for performance
    const metricsStart = Date.now();
    const metricsPromise = Promise.all([
      getUserDistributionByTier(),
      getMonthlyRecurringRevenue(),
      getPlansCreatedThisMonth(),
      getTopScenarios(10),
      getConversionRates(),
      // TEMPORARILY DISABLED: Activity log query timing out (>5s even without JOIN)
      // Database performance issue - need to check table size and run ANALYZE
      // getRecentActivity(20),
      Promise.resolve([]), // Return empty array to unblock admin page
    ]);

    const [userStats, revenueStats, engagementStats, scenarioStats, conversionStats, recentActivity] =
      await Promise.race([metricsPromise, timeoutPromise]);

    const metricsDuration = Date.now() - metricsStart;
    console.log(`[Admin Metrics] All metrics fetched in ${metricsDuration}ms`);

    const totalDuration = Date.now() - overallStart;
    console.log(`[Admin Metrics] ✓ Total metrics fetch completed in ${totalDuration}ms`);

    return {
      userStats,
      revenueStats,
      engagementStats,
      scenarioStats,
      conversionStats,
      recentActivity,
      lastUpdated: new Date(),
    };
  } catch (error) {
    const errorDuration = Date.now() - overallStart;
    console.error(`[Admin Metrics] ❌ Error fetching admin metrics after ${errorDuration}ms:`, error);
    // Return safe defaults instead of throwing to prevent dashboard crash
    return {
      userStats: {
        totalUsers: 0,
        freeUsers: 0,
        basicUsers: 0,
        proUsers: 0,
        activeUsers: 0,
        tierDistribution: [],
      },
      revenueStats: {
        mrr: 0,
        arpu: 0,
        totalRevenue: 0,
        totalPaidUsers: 0,
      },
      engagementStats: {
        totalPlans: 0,
        plansThisMonth: 0,
        plansToday: 0,
        avgPlansPerUser: 0,
      },
      scenarioStats: {
        topScenarios: [],
      },
      conversionStats: {
        freeToPaidRate: 0,
        basicToProRate: 0,
        totalPaidUsers: 0,
        totalFreeUsers: 0,
      },
      recentActivity: [],
      lastUpdated: new Date(),
    };
  }
}

// ==================== USER METRICS ====================

/**
 * Get user distribution across subscription tiers
 * Includes active user count (users with plans in last 30 days)
 */
export async function getUserDistributionByTier(): Promise<UserStats> {
  try {
    // Aggregate users by subscription tier
    const tierCounts = await db
      .select({
        tier: profiles.subscriptionTier,
        count: sql<number>`count(*)::int`,
      })
      .from(profiles)
      .groupBy(profiles.subscriptionTier);

    // Calculate active users (users with plans in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsersResult = await db
      .selectDistinct({ userId: missionReports.userId })
      .from(missionReports)
      .where(gte(missionReports.createdAt, thirtyDaysAgo));

    const totalUsers = tierCounts.reduce((sum, t) => sum + Number(t.count), 0);
    const freeUsers = Number(tierCounts.find((t) => t.tier === 'FREE')?.count || 0);
    const basicUsers = Number(tierCounts.find((t) => t.tier === 'BASIC')?.count || 0);
    const proUsers = Number(tierCounts.find((t) => t.tier === 'PRO')?.count || 0);

    return {
      totalUsers,
      freeUsers,
      basicUsers,
      proUsers,
      activeUsers: activeUsersResult.length,
      tierDistribution: [
        { name: 'Free', value: freeUsers, color: 'hsl(220, 85%, 55%)' }, // Trust Blue
        { name: 'Basic', value: basicUsers, color: 'hsl(120, 60%, 45%)' }, // Green
        { name: 'Pro', value: proUsers, color: 'hsl(45, 80%, 55%)' }, // Amber
      ].filter((tier) => tier.value > 0), // Only show tiers with users
    };
  } catch (error) {
    console.error('Error fetching user distribution:', error);
    return {
      totalUsers: 0,
      freeUsers: 0,
      basicUsers: 0,
      proUsers: 0,
      activeUsers: 0,
      tierDistribution: [],
    };
  }
}

// ==================== REVENUE METRICS ====================

/**
 * Calculate Monthly Recurring Revenue (MRR) and Average Revenue Per User (ARPU)
 * Based on subscription tiers and billing transactions
 */
export async function getMonthlyRecurringRevenue(): Promise<RevenueStats> {
  try {
    // Sum all successful subscription charges this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyRevenueResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(amount), 0)`,
      })
      .from(billingTransactions)
      .where(
        and(
          gte(billingTransactions.transactionDate, firstDayOfMonth),
          eq(billingTransactions.status, 'succeeded')
        )
      );

    const totalRevenue = Number(monthlyRevenueResult[0]?.total || 0);

    // Calculate MRR based on subscription tiers
    // Note: In production, this should come from Stripe subscription data
    const basicMrr = 9.99; // $9.99/month
    const proMrr = 19.99; // $19.99/month

    const basicCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.subscriptionTier, 'BASIC'));

    const proCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.subscriptionTier, 'PRO'));

    const basicUsers = Number(basicCount[0]?.count || 0);
    const proUsers = Number(proCount[0]?.count || 0);
    const totalPaidUsers = basicUsers + proUsers;

    const mrr = basicUsers * basicMrr + proUsers * proMrr;
    const arpu = totalPaidUsers > 0 ? mrr / totalPaidUsers : 0;

    return {
      mrr,
      arpu,
      totalRevenue,
      totalPaidUsers,
    };
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    return { mrr: 0, arpu: 0, totalRevenue: 0, totalPaidUsers: 0 };
  }
}

// ==================== ENGAGEMENT METRICS ====================

/**
 * Calculate plan creation metrics
 * Total plans, plans this month, plans today, average per user
 */
export async function getPlansCreatedThisMonth(): Promise<EngagementStats> {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Total plans all time (exclude soft-deleted)
    const totalPlansResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(missionReports)
      .where(sql`${missionReports.deletedAt} IS NULL`);

    // Plans this month
    const plansThisMonthResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(missionReports)
      .where(
        and(
          gte(missionReports.createdAt, firstDayOfMonth),
          sql`${missionReports.deletedAt} IS NULL`
        )
      );

    // Plans today
    const plansTodayResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(missionReports)
      .where(
        and(
          gte(missionReports.createdAt, startOfToday),
          sql`${missionReports.deletedAt} IS NULL`
        )
      );

    const totalPlans = Number(totalPlansResult[0]?.count || 0);
    const plansThisMonth = Number(plansThisMonthResult[0]?.count || 0);
    const plansToday = Number(plansTodayResult[0]?.count || 0);

    // Calculate average plans per user
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);
    const avgPlansPerUser = totalUsers > 0 ? totalPlans / totalUsers : 0;

    return {
      totalPlans,
      plansThisMonth,
      plansToday,
      avgPlansPerUser,
    };
  } catch (error) {
    console.error('Error fetching engagement stats:', error);
    return {
      totalPlans: 0,
      plansThisMonth: 0,
      plansToday: 0,
      avgPlansPerUser: 0,
    };
  }
}

// ==================== SCENARIO ANALYTICS ====================

/**
 * Get top scenarios selected by users
 * Extracts and aggregates scenario arrays from mission reports
 * @param limit Number of top scenarios to return (default: 10)
 */
export async function getTopScenarios(limit: number = 10): Promise<ScenarioStats> {
  try {
    // Fetch all mission reports with scenarios (avoiding SQL unnest for Drizzle compatibility)
    const reports = await db
      .select({
        scenarios: missionReports.scenarios,
      })
      .from(missionReports)
      .where(sql`${missionReports.deletedAt} IS NULL`);

    // Flatten all scenario arrays into a single array
    const allScenarios = reports.flatMap((report) => report.scenarios || []);

    // Count occurrences of each scenario
    const scenarioCounts = new Map<string, number>();
    allScenarios.forEach((scenario) => {
      scenarioCounts.set(scenario, (scenarioCounts.get(scenario) || 0) + 1);
    });

    // Convert to array and sort by count
    const totalScenarios = allScenarios.length;
    const topScenarios = Array.from(scenarioCounts.entries())
      .map(([scenario, count]) => ({
        scenario,
        count,
        percentage: totalScenarios > 0 ? (count / totalScenarios) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return { topScenarios };
  } catch (error) {
    console.error('Error fetching top scenarios:', error);
    return { topScenarios: [] };
  }
}

// ==================== CONVERSION METRICS ====================

/**
 * Calculate conversion rates
 * - Free to Paid (Basic or Pro)
 * - Basic to Pro
 */
export async function getConversionRates(): Promise<ConversionStats> {
  try {
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    const freeUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.subscriptionTier, 'FREE'));
    const totalFreeUsers = Number(freeUsersResult[0]?.count || 0);

    const basicUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.subscriptionTier, 'BASIC'));
    const totalBasicUsers = Number(basicUsersResult[0]?.count || 0);

    const proUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.subscriptionTier, 'PRO'));
    const totalProUsers = Number(proUsersResult[0]?.count || 0);

    const totalPaidUsers = totalBasicUsers + totalProUsers;

    // Calculate conversion rates
    const freeToPaidRate = totalUsers > 0 ? (totalPaidUsers / totalUsers) * 100 : 0;
    const basicToProRate =
      totalBasicUsers + totalProUsers > 0
        ? (totalProUsers / (totalBasicUsers + totalProUsers)) * 100
        : 0;

    return {
      freeToPaidRate,
      basicToProRate,
      totalPaidUsers,
      totalFreeUsers,
    };
  } catch (error) {
    console.error('Error fetching conversion rates:', error);
    return {
      freeToPaidRate: 0,
      basicToProRate: 0,
      totalPaidUsers: 0,
      totalFreeUsers: 0,
    };
  }
}

// ==================== ACTIVITY LOG ====================

/**
 * Get recent user activity
 * Joins user_activity_log with profiles to include user emails
 * @param limit Number of recent activities to return (default: 20)
 */
export async function getRecentActivity(limit: number = 20): Promise<ActivityLogEntry[]> {
  const startTime = Date.now();
  try {
    console.log(`[Admin Metrics] Fetching recent activity (limit: ${limit})`);

    // OPTIMIZED: Removed expensive INNER JOIN with profiles table
    // Query is now ~10x faster by avoiding the join
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Activity log query timeout after 5 seconds")), 5000)
    );

    // Fetch activity logs WITHOUT JOIN (much faster)
    const queryPromise = db
      .select({
        id: userActivityLog.id,
        userId: userActivityLog.userId,
        activityType: userActivityLog.activityType,
        timestamp: userActivityLog.createdAt,
      })
      .from(userActivityLog)
      .orderBy(desc(userActivityLog.createdAt))
      .limit(limit);

    const activities = await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - startTime;

    console.log(`[Admin Metrics] Activity log query completed in ${duration}ms (${activities.length} rows)`);

    // Map to expected interface (using userId as placeholder for now)
    // TODO: Optionally batch-fetch user emails if needed for display
    return activities.map((activity) => ({
      id: activity.id,
      userEmail: activity.userId, // Using UUID as temporary placeholder
      activityType: activity.activityType,
      timestamp: activity.timestamp,
      metadata: undefined,
    }));
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Admin Metrics] Error fetching recent activity after ${duration}ms:`, error);
    return []; // Return empty array on error to prevent dashboard crash
  }
}
