/**
 * AI Usage By Model Card - Breakdown of usage per AI model
 * Shows cost, tokens, and generation count per model
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu } from 'lucide-react';
import type { AIUsageByModel } from '@/lib/queries/ai-usage';

interface AIUsageByModelCardProps {
  byModel: AIUsageByModel[];
}

// Shorten model names for display
function formatModelName(model: string): string {
  // Extract just the model name from full path
  const parts = model.split('/');
  return parts[parts.length - 1] || model;
}

export default function AIUsageByModelCard({ byModel }: AIUsageByModelCardProps) {
  const totalCost = byModel.reduce((sum, m) => sum + m.cost, 0);

  return (
    <Card className="bg-card border-2 border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Usage by Model
        </CardTitle>
        <Cpu className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {byModel.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No AI usage recorded yet
          </p>
        ) : (
          <div className="space-y-4">
            {byModel.map((model) => {
              const costPercentage = totalCost > 0 ? (model.cost / totalCost) * 100 : 0;

              return (
                <div key={model.model} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatModelName(model.model)}
                      </p>
                      <p className="text-xs text-muted-foreground">{model.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        ${model.cost.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {model.count} generations
                      </p>
                    </div>
                  </div>

                  {/* Cost percentage bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-trust-blue rounded-full transition-all"
                      style={{ width: `${costPercentage}%` }}
                    />
                  </div>

                  {/* Token breakdown */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{model.tokens.toLocaleString()} tokens</span>
                    <span>Avg: {(model.avgDurationMs / 1000).toFixed(1)}s</span>
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
