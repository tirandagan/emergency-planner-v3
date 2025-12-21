/**
 * User Stats Card - Total users with tier distribution pie chart
 * Shows total users, breakdown by tier, and active users
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { UserStats } from '@/lib/queries/admin-metrics';

interface UserStatsCardProps {
  stats: UserStats;
}

export default function UserStatsCard({ stats }: UserStatsCardProps) {
  return (
    <Card className="bg-card border-2 border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Users
        </CardTitle>
        <Users className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Large metric number */}
        <div className="text-3xl font-bold text-foreground mb-4">
          {stats.totalUsers.toLocaleString()}
        </div>

        {/* Secondary metrics */}
        <div className="grid grid-cols-3 gap-2 text-xs mb-4">
          <div>
            <div className="text-muted-foreground">Free</div>
            <div className="font-semibold text-foreground">{stats.freeUsers}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Basic</div>
            <div className="font-semibold text-success">{stats.basicUsers}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Pro</div>
            <div className="font-semibold text-warning">{stats.proUsers}</div>
          </div>
        </div>

        {/* Pie chart - tier distribution */}
        {stats.tierDistribution.length > 0 && (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={stats.tierDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {stats.tierDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Active users indicator */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Active (30 days)</span>
            <span className="font-semibold text-primary">{stats.activeUsers}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
