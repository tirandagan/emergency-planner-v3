/**
 * Revenue Card - Monthly Recurring Revenue and ARPU
 * Displays MRR, total revenue, ARPU, and paid user count
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import type { RevenueStats } from '@/lib/queries/admin-metrics';

interface RevenueCardProps {
  stats: RevenueStats;
}

export default function RevenueCard({ stats }: RevenueCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Monthly Recurring Revenue
        </CardTitle>
        <DollarSign className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* MRR - Primary metric */}
        <div className="text-3xl font-bold text-foreground mb-4">
          ${stats.mrr.toFixed(2)}
        </div>

        {/* Secondary metrics grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Total Revenue (Month)</span>
            <span className="text-sm font-semibold text-foreground">
              ${stats.totalRevenue.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-border">
            <span className="text-sm text-muted-foreground">ARPU</span>
            <span className="text-sm font-semibold text-foreground">
              ${stats.arpu.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Paid Users</span>
            <span className="text-sm font-semibold text-success">
              {stats.totalPaidUsers}
            </span>
          </div>
        </div>

        {/* Info text */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Based on active subscriptions
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
