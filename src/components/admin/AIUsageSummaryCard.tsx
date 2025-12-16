/**
 * AI Usage Summary Card - Overview of total costs and tokens
 * Displays aggregate metrics for AI usage across all features
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, DollarSign, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { AIUsageSummary } from '@/lib/queries/ai-usage';

interface AIUsageSummaryCardProps {
  summary: AIUsageSummary;
}

export default function AIUsageSummaryCard({ summary }: AIUsageSummaryCardProps) {
  const successRate =
    summary.generationCount > 0
      ? ((summary.successCount / summary.generationCount) * 100).toFixed(1)
      : '0';

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          AI Usage Summary (30 Days)
        </CardTitle>
        <Brain className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Total Cost */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-trust-blue" />
              <span className="text-xs text-muted-foreground">Total Cost</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${summary.totalCost.toFixed(4)}
            </p>
            <p className="text-xs text-muted-foreground">
              Avg: ${summary.avgCostPerGeneration.toFixed(4)}/gen
            </p>
          </div>

          {/* Total Tokens */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Total Tokens</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {summary.totalTokens.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              In: {summary.totalInputTokens.toLocaleString()} / Out:{' '}
              {summary.totalOutputTokens.toLocaleString()}
            </p>
          </div>

          {/* Generations */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Generations</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.generationCount}</p>
            <p className="text-xs text-muted-foreground">
              {summary.successCount} success / {summary.failureCount} failed
            </p>
          </div>

          {/* Avg Duration */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {(summary.avgDurationMs / 1000).toFixed(1)}s
            </p>
            <p className="text-xs text-muted-foreground">{successRate}% success rate</p>
          </div>
        </div>

        {/* Token Distribution Bar */}
        {summary.totalTokens > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Token Distribution</span>
              <span>
                Input: {((summary.totalInputTokens / summary.totalTokens) * 100).toFixed(1)}% /
                Output: {((summary.totalOutputTokens / summary.totalTokens) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-trust-blue"
                style={{
                  width: `${(summary.totalInputTokens / summary.totalTokens) * 100}%`,
                }}
              />
              <div
                className="h-full bg-amber-500"
                style={{
                  width: `${(summary.totalOutputTokens / summary.totalTokens) * 100}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-trust-blue rounded-full" />
                <span className="text-muted-foreground">Input</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-muted-foreground">Output</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
