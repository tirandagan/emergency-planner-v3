/**
 * AI Usage Log Card - Recent AI generation activity
 * Shows a table of recent AI calls with user, model, cost, and status
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, CheckCircle2, XCircle } from 'lucide-react';
import type { AIUsageLogEntry } from '@/lib/queries/ai-usage';

interface AIUsageLogCardProps {
  logs: AIUsageLogEntry[];
}

// Format feature name for display
function formatFeatureName(feature: string): string {
  return feature
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Shorten model names for display
function formatModelName(model: string): string {
  const parts = model.split('/');
  return parts[parts.length - 1] || model;
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function AIUsageLogCard({ logs }: AIUsageLogCardProps) {
  return (
    <Card className="bg-card border-2 border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent AI Activity
        </CardTitle>
        <History className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No AI usage recorded yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Feature</th>
                  <th className="pb-3 font-medium">Model</th>
                  <th className="pb-3 font-medium text-right">Tokens</th>
                  <th className="pb-3 font-medium text-right">Cost</th>
                  <th className="pb-3 font-medium text-right">Duration</th>
                  <th className="pb-3 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3">
                      {log.success ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </td>
                    <td className="py-3">
                      <span className="text-foreground truncate max-w-[150px] block">
                        {log.userEmail}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-muted-foreground">
                        {formatFeatureName(log.feature)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {formatModelName(log.model)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-foreground">
                        {(log.inputTokens + log.outputTokens).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-foreground font-medium">
                        ${log.cost.toFixed(4)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-muted-foreground">
                        {(log.durationMs / 1000).toFixed(1)}s
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-muted-foreground">
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
