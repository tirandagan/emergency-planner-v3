'use client';

/**
 * Admin Trash View Component
 * Displays all deleted plans across all users with bulk cleanup
 */

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, RotateCcw, AlertTriangle, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cleanupOldDeletedPlans } from '@/app/actions/admin';
import { restoreMissionReport } from '@/app/actions/plans';

export interface DeletedPlan {
  id: string;
  title: string;
  userId: string;
  userEmail: string | null;
  deletedAt: Date;
  daysUntilPermanentDeletion: number;
  canRestore: boolean;
}

interface AdminTrashViewProps {
  plans: DeletedPlan[];
  className?: string;
}

export function AdminTrashView({ plans, className = '' }: AdminTrashViewProps): React.JSX.Element {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [restoringPlanId, setRestoringPlanId] = useState<string | null>(null);

  const handleBulkCleanup = async (): Promise<void> => {
    setIsCleaningUp(true);
    try {
      const result = await cleanupOldDeletedPlans();

      if (result.success) {
        toast.success(`Cleaned up ${result.deletedCount || 0} expired plans`);
        // Trigger page refresh
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to cleanup plans');
      }
    } catch (error) {
      console.error('Error cleaning up plans:', error);
      toast.error('An error occurred during cleanup');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleRestore = async (planId: string, planTitle: string): Promise<void> => {
    setRestoringPlanId(planId);
    try {
      const result = await restoreMissionReport(planId);

      if (result.success) {
        toast.success(`Restored plan: ${planTitle}`);
        // Trigger page refresh
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to restore plan');
      }
    } catch (error) {
      console.error('Error restoring plan:', error);
      toast.error('An error occurred while restoring the plan');
    } finally {
      setRestoringPlanId(null);
    }
  };

  if (plans.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="rounded-full bg-muted/50 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Trash2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Deleted Plans</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          There are no deleted plans in the trash. Deleted plans appear here for the configured retention
          period before permanent deletion.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with Bulk Actions */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {plans.length} deleted {plans.length === 1 ? 'plan' : 'plans'} in trash
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isCleaningUp}>
              <Trash2 className="h-4 w-4 mr-2" />
              Cleanup Expired Plans
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete Expired Plans?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all plans that are beyond the retention window. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkCleanup}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Deleted Plans Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Title</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Deleted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => {
              const isExpired = !plan.canRestore;
              const isRestoring = restoringPlanId === plan.id;

              return (
                <TableRow key={plan.id} className={isExpired ? 'opacity-50' : ''}>
                  {/* Plan Title */}
                  <TableCell>
                    <div className="font-medium text-foreground">{plan.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">ID: {plan.id.slice(0, 8)}</div>
                  </TableCell>

                  {/* Owner */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{plan.userEmail || 'Unknown'}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ID: {plan.userId.slice(0, 8)}
                    </div>
                  </TableCell>

                  {/* Deleted Time */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">{formatDistanceToNow(plan.deletedAt, { addSuffix: true })}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {plan.deletedAt.toLocaleDateString()}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {isExpired ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <AlertTriangle className="h-3 w-3" />
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <Clock className="h-3 w-3" />
                        {plan.daysUntilPermanentDeletion}d remaining
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    {isExpired ? (
                      <span className="text-xs text-muted-foreground">Cannot restore</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(plan.id, plan.title)}
                        disabled={isRestoring}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-2" />
                        Restore
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
