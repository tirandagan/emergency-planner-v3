'use client';

/**
 * TableControls - Control buttons for table management
 * Reset view, active filter indicators
 */

import { useState } from 'react';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Filter } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TableControlsProps<TData> {
  table: Table<TData>;
  onReset: () => void;
}

export function TableControls<TData>({ table, onReset }: TableControlsProps<TData>) {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const activeFilters = table.getState().columnFilters;
  const activeSorts = table.getState().sorting;
  const hasCustomizations = activeFilters.length > 0 || activeSorts.length > 0;

  const handleReset = () => {
    onReset();
    setShowResetDialog(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Active filter count */}
        {activeFilters.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Filter className="w-3 h-3" />
            {activeFilters.length} {activeFilters.length === 1 ? 'filter' : 'filters'}
          </Badge>
        )}

        {/* Reset view button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowResetDialog(true)}
          title="Reset all customizations to defaults"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Reset confirmation dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Table Customizations?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasCustomizations
                ? 'This will reset all customizations including column widths, visibility, sorting, and filters to their defaults.'
                : 'This will reset all customizations including column widths and visibility to their defaults.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
