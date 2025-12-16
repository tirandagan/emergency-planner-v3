'use client';

/**
 * Trash Plan Card Component
 * Individual deleted plan card with restoration controls
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArchiveRestore, Calendar, Clock, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { restoreMissionReport } from '@/app/actions/plans';

interface DeletedPlan {
  id: string;
  title: string;
  deletedAt: Date;
  daysUntilPermanentDeletion: number;
  canRestore: boolean;
}

interface TrashPlanCardProps {
  plan: DeletedPlan;
  userTier: 'FREE' | 'BASIC' | 'PRO';
}

const TIER_RESTORATION_DAYS = {
  FREE: 7,
  BASIC: 30,
  PRO: 90,
} as const;

export function TrashPlanCard({ plan, userTier }: TrashPlanCardProps): React.JSX.Element {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);

  const maxDays = TIER_RESTORATION_DAYS[userTier];
  const progressPercentage = ((maxDays - plan.daysUntilPermanentDeletion) / maxDays) * 100;

  // Determine urgency color
  const getUrgencyColor = (): string => {
    if (plan.daysUntilPermanentDeletion <= 2) return 'text-red-600 dark:text-red-400';
    if (plan.daysUntilPermanentDeletion <= 7) return 'text-orange-600 dark:text-orange-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getProgressColor = (): string => {
    if (plan.daysUntilPermanentDeletion <= 2) return 'bg-red-600';
    if (plan.daysUntilPermanentDeletion <= 7) return 'bg-orange-600';
    return 'bg-blue-600';
  };

  const handleRestore = async (): Promise<void> => {
    setIsRestoring(true);

    try {
      const result = await restoreMissionReport(plan.id);

      if (result.success) {
        toast.success(`"${plan.title}" has been restored successfully!`, {
          duration: 4000,
        });
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to restore plan');
      }
    } catch (error) {
      console.error('Error restoring plan:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Card className={!plan.canRestore ? 'opacity-60' : ''}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Plan Title */}
          <div>
            <h3 className="text-lg font-semibold">{plan.title}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Deleted {plan.deletedAt.toLocaleDateString()}
              </span>
              <span className={`flex items-center gap-1 font-medium ${getUrgencyColor()}`}>
                <Clock className="h-3.5 w-3.5" />
                {plan.canRestore
                  ? `${plan.daysUntilPermanentDeletion} ${plan.daysUntilPermanentDeletion === 1 ? 'day' : 'days'} remaining`
                  : 'Expired'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {plan.canRestore && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Recovery window</span>
                <span>
                  {plan.daysUntilPermanentDeletion} of {maxDays} days left
                </span>
              </div>
              <Progress
                value={progressPercentage}
                className="h-2"
                indicatorClassName={getProgressColor()}
              />
            </div>
          )}

          {/* Expiration Warning */}
          {!plan.canRestore && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded flex items-start gap-2">
              <Trash2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                This plan has expired and will be permanently deleted during the next cleanup.
                Restoration is no longer available.
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {plan.canRestore && (
        <CardFooter className="bg-muted/30 pt-4">
          <Button
            onClick={handleRestore}
            disabled={isRestoring}
            className="w-full"
            size="sm"
            variant="default"
          >
            <ArchiveRestore className="mr-2 h-4 w-4" />
            {isRestoring ? 'Restoring...' : 'Restore Plan'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
