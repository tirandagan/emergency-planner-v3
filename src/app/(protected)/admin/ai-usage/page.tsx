/**
 * Admin AI Usage Dashboard - Cost monitoring and usage analytics
 *
 * Displays comprehensive AI usage metrics:
 * - Total cost and token usage summary
 * - Usage breakdown by model
 * - Usage breakdown by feature
 * - Recent AI generation activity log
 *
 * All metrics fetched server-side via Drizzle ORM for type safety and performance.
 */

import { getAIUsageDashboard } from '@/lib/queries/ai-usage';
import AIUsageSummaryCard from '@/components/admin/AIUsageSummaryCard';
import AIUsageByModelCard from '@/components/admin/AIUsageByModelCard';
import AIUsageByFeatureCard from '@/components/admin/AIUsageByFeatureCard';
import AIUsageLogCard from '@/components/admin/AIUsageLogCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function AIUsagePage() {
  // Fetch AI usage metrics (30 days default)
  const dashboard = await getAIUsageDashboard(30);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-foreground">AI Usage & Costs</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last 30 days &bull; Updated:{' '}
            {new Date(dashboard.lastUpdated).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
        </div>
      </div>

      {/* Summary Card - Full Width */}
      <AIUsageSummaryCard summary={dashboard.summary} />

      {/* Breakdown Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Model */}
        <AIUsageByModelCard byModel={dashboard.byModel} />

        {/* Usage by Feature */}
        <AIUsageByFeatureCard byFeature={dashboard.byFeature} />
      </div>

      {/* Recent Usage Log - Full Width */}
      <AIUsageLogCard logs={dashboard.recentUsage} />
    </div>
  );
}
