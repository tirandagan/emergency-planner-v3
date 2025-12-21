'use client';

/**
 * ColumnVisibilityDropdown - Dedicated button for managing column visibility
 * Shows/hides columns with grouped categories
 */

import { useState, useRef, useEffect } from 'react';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Columns3 } from 'lucide-react';

interface ColumnVisibilityDropdownProps<TData> {
  table: Table<TData>;
}

export function ColumnVisibilityDropdown<TData>({
  table,
}: ColumnVisibilityDropdownProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const visibleColumns = table.getAllColumns().filter((col) => col.getIsVisible());
  const allColumns = table.getAllColumns();
  const hiddenCount = allColumns.length - visibleColumns.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Columns3 className="w-4 h-4" />
        <span>Columns</span>
        {hiddenCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">
            {hiddenCount} hidden
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-md border bg-popover p-2 shadow-md z-50"
        >
          <div className="text-sm font-medium mb-2 px-2 pb-2 border-b">
            Column Visibility
          </div>

          <div className="max-h-96 overflow-y-auto">
            {allColumns.map((column) => {
              const isVisible = column.getIsVisible();
              const canToggle = !isVisible || visibleColumns.length > 3;

              return (
                <button
                  key={column.id}
                  onClick={() => {
                    if (canToggle) {
                      column.toggleVisibility();
                    }
                  }}
                  disabled={!canToggle}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent
                             rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    !canToggle
                      ? 'Must keep at least 3 columns visible'
                      : undefined
                  }
                >
                  <Checkbox
                    checked={isVisible}
                    disabled={!canToggle}
                    className="pointer-events-none"
                  />
                  <span className="flex-1 text-left">
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </span>
                </button>
              );
            })}
          </div>

          {hiddenCount > 0 && (
            <>
              <div className="h-px bg-border my-2" />
              <button
                onClick={() => {
                  table.getAllColumns().forEach((col) => col.toggleVisibility(true));
                }}
                className="w-full px-2 py-1.5 text-sm text-primary hover:bg-accent rounded-sm"
              >
                Show All Columns
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
