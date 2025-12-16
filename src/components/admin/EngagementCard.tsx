/**
 * Engagement Card - Plan creation metrics
 * Shows total plans, plans this month, plans today, average per user
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import type { EngagementStats } from '@/lib/queries/admin-metrics';

interface EngagementCardProps {
  stats: EngagementStats;
}

export default function EngagementCard({ stats }: EngagementCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Plans Created
        </CardTitle>
        <FileText className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Total plans - Primary metric */}
        <div className="text-3xl font-bold text-foreground mb-4">
          {stats.totalPlans.toLocaleString()}
        </div>

        {/* Secondary metrics grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-sm text-muted-foreground">This Month</span>
            <span className="text-sm font-semibold text-success">
              {stats.plansThisMonth}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Today</span>
            <span className="text-sm font-semibold text-primary">
              {stats.plansToday}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Avg per User</span>
            <span className="text-sm font-semibold text-foreground">
              {stats.avgPlansPerUser.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Info text */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            All-time plan creation activity
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
