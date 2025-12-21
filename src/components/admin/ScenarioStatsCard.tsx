/**
 * Scenario Stats Card - Top scenarios selected by users
 * Displays horizontal bar chart of most popular scenarios
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { ScenarioStats } from '@/lib/queries/admin-metrics';

interface ScenarioStatsCardProps {
  stats: ScenarioStats;
}

export default function ScenarioStatsCard({ stats }: ScenarioStatsCardProps) {
  return (
    <Card className="bg-card border-2 border-border shadow-sm lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Top Scenarios
        </CardTitle>
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {stats.topScenarios.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">No scenario data available yet</p>
          </div>
        ) : (
          <>
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={stats.topScenarios}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <XAxis type="number" />
                <YAxis type="category" dataKey="scenario" width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'count') {
                      return [`${value} plans`, 'Count'];
                    }
                    return [value, name];
                  }}
                />
                <Bar dataKey="count" fill="hsl(220, 85%, 55%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Summary stats */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-muted-foreground">Most Popular</div>
                  <div className="font-semibold text-foreground mt-1">
                    {stats.topScenarios[0]?.scenario}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Selection Rate</div>
                  <div className="font-semibold text-primary mt-1">
                    {stats.topScenarios[0]?.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
