/**
 * Conversion Funnel - Subscription tier conversion rates
 * Shows Free→Paid and Basic→Pro conversion percentages
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { ConversionStats } from '@/lib/queries/admin-metrics';

interface ConversionFunnelProps {
  stats: ConversionStats;
}

export default function ConversionFunnel({ stats }: ConversionFunnelProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Conversion Rates
        </CardTitle>
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Free to Paid conversion */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Free → Paid</span>
            <span className="text-2xl font-bold text-primary">
              {stats.freeToPaidRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.freeToPaidRate, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>{stats.totalFreeUsers} free users</span>
            <span>{stats.totalPaidUsers} paid users</span>
          </div>
        </div>

        {/* Basic to Pro conversion */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Basic → Pro</span>
            <span className="text-2xl font-bold text-success">
              {stats.basicToProRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className="bg-success h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.basicToProRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Info text */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Conversion rates updated in real-time
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
