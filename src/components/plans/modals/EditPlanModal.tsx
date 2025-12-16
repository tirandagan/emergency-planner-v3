'use client';

/**
 * Edit Plan Modal Component
 * Redirects to wizard with pre-filled data for editing
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { Edit } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportTitle: string;
}

export function EditPlanModal({
  isOpen,
  onClose,
  reportId,
  reportTitle,
}: EditPlanModalProps): React.JSX.Element {
  const router = useRouter();

  const handleEdit = (): void => {
    // Redirect to wizard with edit query parameter
    router.push(`/plans/new?edit=${reportId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Edit Plan</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            You'll be redirected to the plan wizard with your current plan data pre-filled.
            Update any details and regenerate your plan with the latest information.
          </DialogDescription>
        </DialogHeader>

        <div className="border-l-4 border-primary bg-primary/5 p-4 rounded">
          <p className="text-sm font-medium text-foreground">{reportTitle}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create a new version of this plan with updated information
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
