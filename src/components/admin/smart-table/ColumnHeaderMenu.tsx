'use client';

/**
 * ColumnHeaderMenu - Right-click context menu for column headers
 * Provides sort, filter, and column visibility actions
 */

import { useEffect, useRef, useState } from 'react';
import type { Column, Table } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';

interface ColumnHeaderMenuProps<TData> {
  x: number;
  y: number;
  column: Column<TData, unknown>;
  table: Table<TData>;
  onClose: () => void;
  onShowFilterInput?: (columnId: string) => void;
}

export function ColumnHeaderMenu<TData>({
  x,
  y,
  column,
  table,
  onClose,
  onShowFilterInput,
}: ColumnHeaderMenuProps<TData>) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showColumnSubmenu, setShowColumnSubmenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Position menu to avoid overflow
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleSort = (desc: boolean) => {
    column.toggleSorting(desc);
    onClose();
  };

  const handleClearSort = () => {
    column.clearSorting();
    onClose();
  };

  const handleFilter = () => {
    onShowFilterInput?.(column.id);
    onClose();
  };

  const handleHideColumn = () => {
    column.toggleVisibility(false);
    onClose();
  };

  const handleToggleColumn = (columnId: string) => {
    const targetColumn = table.getColumn(columnId);
    if (targetColumn) {
      targetColumn.toggleVisibility();
    }
  };

  const visibleColumns = table.getAllColumns().filter((col) => col.getIsVisible());
  const hiddenColumns = table.getAllColumns().filter((col) => !col.getIsVisible());

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md"
      style={{ left: x, top: y }}
    >
      {/* Sort Options */}
      {column.getCanSort() && (
        <>
          <button
            onClick={() => handleSort(false)}
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm
                       transition-colors flex items-center gap-2"
          >
            <span>Sort A → Z</span>
            {column.getIsSorted() === 'asc' && <span className="ml-auto text-primary">✓</span>}
          </button>
          <button
            onClick={() => handleSort(true)}
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm
                       transition-colors flex items-center gap-2"
          >
            <span>Sort Z → A</span>
            {column.getIsSorted() === 'desc' && <span className="ml-auto text-primary">✓</span>}
          </button>
          {column.getIsSorted() && (
            <button
              onClick={handleClearSort}
              className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm
                         transition-colors text-muted-foreground"
            >
              Clear Sort
            </button>
          )}
          <div className="h-px bg-border my-1" />
        </>
      )}

      {/* Filter Option */}
      {column.getCanFilter() && (
        <>
          <button
            onClick={handleFilter}
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm
                       transition-colors"
          >
            Filter...
          </button>
          <div className="h-px bg-border my-1" />
        </>
      )}

      {/* Hide Column */}
      <button
        onClick={handleHideColumn}
        disabled={visibleColumns.length <= 3}
        className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm
                   transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={visibleColumns.length <= 3 ? 'Must keep at least 3 columns visible' : ''}
      >
        Hide Column
      </button>

      {/* Show Columns Submenu */}
      {hiddenColumns.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => setShowColumnSubmenu(true)}
          onMouseLeave={() => setShowColumnSubmenu(false)}
        >
          <button
            className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm
                       transition-colors flex items-center justify-between"
          >
            <span>Show Columns</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Submenu */}
          {showColumnSubmenu && (
            <div
              className="absolute left-full top-0 ml-1 min-w-[160px] rounded-md border
                         bg-popover p-1 shadow-md z-50"
            >
              {hiddenColumns.map((col) => (
                <button
                  key={col.id}
                  onClick={() => handleToggleColumn(col.id)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded-sm
                             transition-colors"
                >
                  {typeof col.columnDef.header === 'string'
                    ? col.columnDef.header
                    : col.id}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
