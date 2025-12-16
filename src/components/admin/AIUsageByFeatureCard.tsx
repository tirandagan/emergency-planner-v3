/**
 * AI Usage By Feature Card - Breakdown of usage per application feature
 * Shows cost, tokens, count, and success rate per feature
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';
import type { AIUsageByFeature } from '@/lib/queries/ai-usage';

interface AIUsageByFeatureCardProps {
  byFeature: AIUsageByFeature[];
}

// Format feature name for display
function formatFeatureName(feature: string): string {
  return feature
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get color for feature
function getFeatureColor(feature: string): string {
  const colors: Record<string, string> = {
    mission_generation: 'bg-trust-blue',
    bundle_recommendation: 'bg-emerald-500',
    readiness_suggestion: 'bg-amber-500',
    email_personalization: 'bg-purple-500',
    product_analysis: 'bg-rose-500',
  };
  return colors[feature] || 'bg-gray-500';
}

export default function AIUsageByFeatureCard({ byFeature }: AIUsageByFeatureCardProps) {
  const totalCost = byFeature.reduce((sum, f) => sum + f.cost, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Usage by Feature
        </CardTitle>
        <Layers className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {byFeature.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No AI usage recorded yet
          </p>
        ) : (
          <div className="space-y-4">
            {byFeature.map((feature) => {
              const costPercentage = totalCost > 0 ? (feature.cost / totalCost) * 100 : 0;
              const featureColor = getFeatureColor(feature.feature);

              return (
                <div key={feature.feature} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${featureColor}`} />
                      <p className="text-sm font-medium text-foreground">
                        {formatFeatureName(feature.feature)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        ${feature.cost.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {/* Cost percentage bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${featureColor}`}
                      style={{ width: `${costPercentage}%` }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{feature.count} calls</span>
                    <span>{feature.tokens.toLocaleString()} tokens</span>
                    <span
                      className={
                        feature.successRate >= 95
                          ? 'text-success'
                          : feature.successRate >= 80
                            ? 'text-amber-500'
                            : 'text-destructive'
                      }
                    >
                      {feature.successRate.toFixed(1)}% success
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
