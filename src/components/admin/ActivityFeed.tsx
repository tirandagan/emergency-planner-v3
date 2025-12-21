/**
 * Activity Feed - Recent user activity log
 * Displays the last 20 user actions with timestamps
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import type { ActivityLogEntry } from '@/lib/queries/admin-metrics';

interface ActivityFeedProps {
  activity: ActivityLogEntry[];
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Format activity type for display
 */
function formatActivityType(activityType: string): string {
  return activityType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get color for activity type
 */
function getActivityColor(activityType: string): string {
  const lowerType = activityType.toLowerCase();
  if (lowerType.includes('login')) return 'text-primary';
  if (lowerType.includes('signup') || lowerType.includes('created')) return 'text-success';
  if (lowerType.includes('upgrade')) return 'text-warning';
  if (lowerType.includes('delete') || lowerType.includes('error')) return 'text-destructive';
  return 'text-muted-foreground';
}

export default function ActivityFeed({ activity }: ActivityFeedProps) {
  return (
    <Card className="bg-card border-2 border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Activity
        </CardTitle>
        <Activity className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">No activity logged yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
              >
                {/* Activity type indicator */}
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getActivityColor(entry.activityType).replace('text-', 'bg-')}`} />
                </div>

                {/* Activity details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-sm font-medium ${getActivityColor(entry.activityType)}`}>
                      {formatActivityType(entry.activityType)}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0" suppressHydrationWarning>
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.userEmail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        {activity.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing last {activity.length} activities
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
