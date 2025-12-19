'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ChangeHistoryModalProps } from '@/types/change-history';
import { FIELD_LABELS, formatFieldValue } from '@/types/change-history';

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffWeek < 4) return `${diffWeek} week${diffWeek !== 1 ? 's' : ''} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get entity type label for display
 */
function getEntityTypeLabel(entityType: string): string {
  const labels: Record<string, string> = {
    category: 'Category',
    masterItem: 'Master Item',
    product: 'Product',
  };
  return labels[entityType] || entityType;
}

export function ChangeHistoryModal({
  isOpen,
  onClose,
  entityType,
  entityName,
  changeHistory,
}: ChangeHistoryModalProps) {
  const hasHistory = changeHistory && changeHistory.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Change History
            <Badge variant="outline" className="font-normal">
              {getEntityTypeLabel(entityType)}
            </Badge>
          </DialogTitle>
          <DialogDescription>{entityName}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {!hasHistory ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No change history available</p>
              <p className="text-xs mt-1">Changes will be recorded starting now</p>
            </div>
          ) : (
            <div className="space-y-6">
              {changeHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className="border-l-2 border-muted pl-4 pb-4 last:pb-0"
                >
                  {/* Entry Header */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {entry.userName || entry.userEmail}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                    </div>
                    {entry.userName && (
                      <div className="text-xs text-muted-foreground">
                        {entry.userEmail}
                      </div>
                    )}
                  </div>

                  {/* Changes List */}
                  <div className="space-y-3">
                    {entry.changes.map((change, changeIdx) => (
                      <div
                        key={changeIdx}
                        className="bg-muted/50 rounded-md p-3 text-sm"
                      >
                        <div className="font-medium mb-2 text-muted-foreground">
                          {FIELD_LABELS[change.field] || change.field}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Before
                            </div>
                            <div className="font-mono text-xs bg-background rounded px-2 py-1 border">
                              {formatFieldValue(change.field, change.oldValue)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">
                              After
                            </div>
                            <div className="font-mono text-xs bg-background rounded px-2 py-1 border border-primary/50">
                              {formatFieldValue(change.field, change.newValue)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
