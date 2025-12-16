/**
 * Admin Dashboard - Platform health and metrics overview
 *
 * Displays comprehensive metrics:
 * - User distribution by tier with pie chart
 * - Monthly recurring revenue and ARPU
 * - Plan creation engagement metrics
 * - Top scenarios bar chart
 * - Conversion funnel visualization
 * - Recent user activity feed
 *
 * All metrics fetched server-side via Drizzle ORM for type safety and performance.
 */

import { getAdminDashboardMetrics } from '@/lib/queries/admin-metrics';
import UserStatsCard from '@/components/admin/UserStatsCard';
import RevenueCard from '@/components/admin/RevenueCard';
import EngagementCard from '@/components/admin/EngagementCard';
import ScenarioStatsCard from '@/components/admin/ScenarioStatsCard';
import ConversionFunnel from '@/components/admin/ConversionFunnel';
import ActivityFeed from '@/components/admin/ActivityFeed';
import QuickActions from '@/components/admin/QuickActions';

export default async function AdminDashboard() {
  // Fetch all metrics server-side (type-safe Drizzle queries)
  const metrics = await getAdminDashboardMetrics();

  return (
    <div className="p-8 space-y-8 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Last updated:{' '}
            {new Date(metrics.lastUpdated).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
        </div>
      </div>

      {/* Quick Actions - Prominent navigation shortcuts */}
      <QuickActions />

      {/* Metrics Grid - Responsive 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* User Stats with Tier Distribution Pie Chart */}
        <UserStatsCard stats={metrics.userStats} />

        {/* MRR & Revenue Metrics */}
        <RevenueCard stats={metrics.revenueStats} />

        {/* Plans Created Engagement Metrics */}
        <EngagementCard stats={metrics.engagementStats} />

        {/* Top Scenarios Horizontal Bar Chart - spans 2 columns on large screens */}
        <ScenarioStatsCard stats={metrics.scenarioStats} />

        {/* Conversion Funnel Visual */}
        <ConversionFunnel stats={metrics.conversionStats} />

        {/* Recent Activity Feed - full width on all screens */}
        <div className="lg:col-span-2 xl:col-span-3">
          <ActivityFeed activity={metrics.recentActivity} />
        </div>
      </div>
    </div>
  );
}
