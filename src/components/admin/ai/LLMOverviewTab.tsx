'use client';

/**
 * LLM Overview Tab - AI Usage & Costs Dashboard
 *
 * Displays comprehensive AI usage metrics:
 * - Total cost and token usage summary
 * - Usage breakdown by model
 * - Usage breakdown by feature
 * - Recent AI generation activity log
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AIUsageSummaryCard from '@/components/admin/AIUsageSummaryCard';
import AIUsageByModelCard from '@/components/admin/AIUsageByModelCard';
import AIUsageByFeatureCard from '@/components/admin/AIUsageByFeatureCard';
import AIUsageLogCard from '@/components/admin/AIUsageLogCard';
import { fetchAIUsageDashboard } from '@/app/(protected)/admin/ai/actions';
import type { AIUsageDashboard } from '@/lib/queries/ai-usage';

export function LLMOverviewTab(): React.JSX.Element {
  const [dashboard, setDashboard] = useState<AIUsageDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAIUsageDashboard();
        setDashboard(data);
      } catch (error) {
        console.error('Failed to fetch AI usage dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load AI usage data
      </div>
    );
  }

  return (
    <>
      {/* Metadata */}
      <div className="text-sm text-muted-foreground">
        Last 30 days &bull; Updated:{' '}
        {new Date(dashboard.lastUpdated).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}
      </div>

      {/* Summary Card - Full Width */}
      <AIUsageSummaryCard summary={dashboard.summary} />

      {/* Breakdown Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIUsageByModelCard byModel={dashboard.byModel} />
        <AIUsageByFeatureCard byFeature={dashboard.byFeature} />
      </div>

      {/* Recent Usage Log - Full Width */}
      <AIUsageLogCard logs={dashboard.recentUsage} />
    </>
  );
}
