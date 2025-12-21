'use client';

/**
 * TableControls - Control buttons for table management
 * Reset view, column visibility, active filter indicators
 */

import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Filter } from 'lucide-react';
import { ColumnVisibilityDropdown } from './ColumnVisibilityDropdown';

interface TableControlsProps<TData> {
  table: Table<TData>;
  onReset: () => void;
}

export function TableControls<TData>({ table, onReset }: TableControlsProps<TData>) {
  const activeFilters = table.getState().columnFilters;
  const activeSorts = table.getState().sorting;
  const hasCustomizations = activeFilters.length > 0 || activeSorts.length > 0;

  const handleReset = () => {
    if (
      hasCustomizations &&
      confirm(
        'Reset all customizations (column widths, visibility, sorting, filters) to defaults?'
      )
    ) {
      onReset();
    } else if (!hasCustomizations) {
      if (
        confirm(
          'Reset all customizations (column widths, visibility) to defaults?'
        )
      ) {
        onReset();
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Active filter count */}
      {activeFilters.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          <Filter className="w-3 h-3" />
          {activeFilters.length} {activeFilters.length === 1 ? 'filter' : 'filters'}
        </Badge>
      )}

      {/* Column visibility dropdown */}
      <ColumnVisibilityDropdown table={table} />

      {/* Reset view button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="gap-2"
        title="Reset all customizations to defaults"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset View</span>
      </Button>
    </div>
  );
}
