'use client';

/**
 * Enhanced Delete Plan Modal Component
 * Soft delete confirmation with tier-based restoration info and title verification
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteMissionReport } from '@/app/actions/plans';
import { toast } from 'sonner';

interface DeletePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
  createdAt: Date;
  userTier?: 'FREE' | 'BASIC' | 'PRO';
  activeShareCount?: number;
}

// Tier-based restoration periods (in days)
const RESTORATION_PERIODS = {
  FREE: 7,
  BASIC: 30,
  PRO: 90,
} as const;

export function DeletePlanModal({
  isOpen,
  onClose,
  reportId,
  reportTitle,
  createdAt,
  userTier = 'FREE',
  activeShareCount = 0,
}: DeletePlanModalProps): React.JSX.Element {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const restorationDays = RESTORATION_PERIODS[userTier];
  const isConfirmationValid = confirmText.trim() === reportTitle.trim();

  // Reset confirmation text when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setError(null);
    }
  }, [isOpen]);

  const handleDelete = async (): Promise<void> => {
    if (!isConfirmationValid) {
      setError('Please type the plan title exactly to confirm');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteMissionReport(reportId);

      if (result.success) {
        toast.success(`Plan moved to Trash. Restore within ${restorationDays} days from /plans/trash`, {
          duration: 5000,
        });
        onClose();
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.error || 'Failed to delete plan');
      }
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-2">
              <Trash2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <DialogTitle>Move Plan to Trash</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            This plan will be moved to Trash. You can restore it within{' '}
            <span className="font-semibold">{restorationDays} days</span> from the Trash page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Info Card */}
          <div className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded">
            <p className="text-sm font-medium text-foreground">{reportTitle}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Created on {createdAt.toLocaleDateString()}
            </p>
          </div>

          {/* Active Shares Warning */}
          {activeShareCount > 0 && (
            <div className="flex items-start gap-2 border-l-4 border-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-900 dark:text-red-200">
                  Active Shares Warning
                </p>
                <p className="text-red-700 dark:text-red-300 mt-1">
                  This plan is shared with {activeShareCount}{' '}
                  {activeShareCount === 1 ? 'person' : 'people'}. They will lose access when
                  deleted.
                </p>
              </div>
            </div>
          )}

          {/* Restoration Period Info */}
          <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-200">Recovery Window</p>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                {userTier} plan: {restorationDays}-day restoration period. After that, the plan
                will be permanently deleted.
              </p>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirm-title" className="text-sm font-medium">
              Type the plan title to confirm:{' '}
              <span className="font-semibold text-foreground">{reportTitle}</span>
            </Label>
            <Input
              id="confirm-title"
              type="text"
              placeholder="Type plan title here..."
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isDeleting}
              className="font-mono"
            />
            {confirmText && !isConfirmationValid && (
              <p className="text-xs text-destructive">Title does not match</p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmationValid}
          >
            {isDeleting ? 'Moving to Trash...' : 'Move to Trash'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
