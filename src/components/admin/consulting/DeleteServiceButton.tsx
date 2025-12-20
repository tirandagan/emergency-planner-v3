'use client';

import type { JSX } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
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
import { deleteConsultingService } from '@/app/actions/consulting';

interface DeleteServiceButtonProps {
  serviceId: string;
  serviceName: string;
}

export function DeleteServiceButton({
  serviceId,
  serviceName,
}: DeleteServiceButtonProps): JSX.Element {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteConsultingService(serviceId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="text-sm text-destructive hover:underline inline-flex items-center gap-1">
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Consulting Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{serviceName}"? This action cannot be undone.
              {error && (
                <div className="mt-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Service'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
