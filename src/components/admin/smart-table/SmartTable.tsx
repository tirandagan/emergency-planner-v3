'use client';

/**
 * SmartTable - Advanced data table with resizing, sorting, filtering, and persistence
 * Built on TanStack Table v8 with Shadcn UI components
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTablePreferences } from './useTablePreferences';
import { ColumnHeaderMenu } from './ColumnHeaderMenu';
import { FilterInput } from './FilterInput';
import type { SmartColumnDef } from './types';

interface SmartTableProps<TData> {
  data: TData[];
  columns: SmartColumnDef<TData>[];
  localStorageKey: string;
  onRowClick?: (row: TData) => void;
  className?: string;
  tableInstanceRef?: React.MutableRefObject<unknown>;
  onResetPreferences?: () => void;
}

export function SmartTable<TData>({
  data,
  columns: columnDefs,
  localStorageKey,
  onRowClick,
  className = '',
  tableInstanceRef,
  onResetPreferences,
}: SmartTableProps<TData>) {
  const { preferences, updateColumnWidths, updateSorting, updateColumnVisibility, updateColumnOrder, resetPreferences } =
    useTablePreferences(localStorageKey);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    columnId: string;
  } | null>(null);

  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [columnFilters] = useState<ColumnFiltersState>([]);

  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Initialize column order from preferences or use default order
  const initialColumnOrder = useMemo(() => {
    if (preferences.columnOrder && preferences.columnOrder.length > 0) {
      return preferences.columnOrder;
    }
    return columnDefs.map(c => c.id);
  }, [preferences.columnOrder, columnDefs]);

  // Convert SmartColumnDef to TanStack ColumnDef
  const columns = useMemo<ColumnDef<TData>[]>(
    () =>
      columnDefs.map((col) => {
        const baseColumn: ColumnDef<TData> = {
          id: col.id,
          header: col.header,
          enableSorting: col.sortable ?? true,
          enableColumnFilter: col.filterable ?? true,
          size: preferences.columnWidths[col.id] || col.defaultWidth || 150,
          minSize: col.minWidth || 60,
          maxSize: col.maxWidth || 800,
          // Add accessor if provided
          ...(col.accessorKey ? { accessorKey: col.accessorKey as keyof TData } : {}),
          // Add custom cell renderer if provided
          ...(col.cell ? { cell: ({ row, column }: { row: { original: TData }; column: any }) => col.cell!(row.original, column.getSize()) } : {}),
        };

        return baseColumn;
      }),
    [columnDefs, preferences.columnWidths]
  );

  // Initialize column visibility from preferences
  const initialVisibility = useMemo<VisibilityState>(() => {
    const visibility: VisibilityState = {};

    columnDefs.forEach((col) => {
      // Use preference if available, otherwise use defaultVisible
      if (col.id in preferences.columnVisibility) {
        visibility[col.id] = preferences.columnVisibility[col.id];
      } else if (col.defaultVisible !== undefined) {
        visibility[col.id] = col.defaultVisible;
      }
    });

    return visibility;
  }, [columnDefs, preferences.columnVisibility]);

  // Initialize sorting from preferences
  const initialSorting = useMemo<SortingState>(() => {
    return preferences.sorting || [];
  }, [preferences.sorting]);

  // Initialize TanStack Table
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting: initialSorting,
      columnVisibility: initialVisibility,
      columnFilters,
      columnOrder: initialColumnOrder,
    },
    onSortingChange: (updater) => {
      const newSorting = typeof updater === 'function' ? updater(initialSorting) : updater;
      updateSorting(newSorting);
    },
    onColumnVisibilityChange: (updater) => {
      const newVisibility =
        typeof updater === 'function' ? updater(initialVisibility) : updater;
      updateColumnVisibility(newVisibility);
    },
    onColumnOrderChange: (updater) => {
      const newOrder = typeof updater === 'function' ? updater(initialColumnOrder) : updater;
      updateColumnOrder(newOrder);
    },
  });

  // Handle column resize complete
  const handleResizeEnd = useCallback(() => {
    const widths: Record<string, number> = {};
    table.getAllColumns().forEach((column) => {
      widths[column.id] = column.getSize();
    });
    updateColumnWidths(widths);
  }, [table, updateColumnWidths]);

  // Handle right-click on column header
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, columnId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, columnId });
    },
    []
  );

  // Handle column drag start
  const handleDragStart = useCallback((e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();

    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const currentOrder = table.getState().columnOrder;
    const draggedIndex = currentOrder.indexOf(draggedColumn);
    const targetIndex = currentOrder.indexOf(targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);

    table.setColumnOrder(newOrder);
    updateColumnOrder(newOrder);

    setDraggedColumn(null);
    setDragOverColumn(null);
  }, [draggedColumn, table, updateColumnOrder]);

  // Handle reset preferences
  const handleReset = useCallback(() => {
    resetPreferences();
    table.resetSorting();
    table.resetColumnFilters();
    table.resetColumnVisibility();
    onResetPreferences?.();
  }, [resetPreferences, table, onResetPreferences]);

  // Expose table instance to parent component
  useEffect(() => {
    if (tableInstanceRef) {
      tableInstanceRef.current = table;
    }
  }, [table, tableInstanceRef]);

  return (
    <div className={`relative overflow-x-auto ${className}`}>
      <Table style={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isDragging = draggedColumn === header.id;
                const isDragOver = dragOverColumn === header.id;

                return (
                  <TableHead
                    key={header.id}
                    draggable
                    style={{ width: `${header.getSize()}px`, position: 'relative' }}
                    className={`relative group select-none overflow-hidden transition-colors ${
                      isDragging ? 'opacity-50' : ''
                    } ${isDragOver ? 'bg-primary/10' : ''}`}
                    onContextMenu={(e) => handleContextMenu(e, header.id)}
                    onDragStart={(e) => handleDragStart(e, header.id)}
                    onDragOver={(e) => handleDragOver(e, header.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, header.id)}
                  >
                    {/* Column header content */}
                    <div
                      className="flex items-center gap-2 cursor-move overflow-hidden"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}

                    {/* Sort indicator */}
                    {header.column.getIsSorted() && (
                      <span className="text-xs text-muted-foreground">
                        {header.column.getIsSorted() === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </div>

                  {/* Resize handle (visible on hover for better discoverability) */}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      onMouseUp={handleResizeEnd}
                      onTouchEnd={handleResizeEnd}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize
                                 bg-border/30 group-hover:bg-border
                                 hover:!bg-primary active:!bg-primary transition-all duration-150"
                      style={{
                        transform: header.column.getIsResizing()
                          ? 'scaleX(3)'
                          : 'scaleX(1)',
                      }}
                    />
                  )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No data available
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="text-sm overflow-hidden"
                    style={{ width: `${cell.column.getSize()}px` }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Context Menu */}
      {contextMenu && (() => {
        const column = table.getColumn(contextMenu.columnId);
        return column ? (
          <ColumnHeaderMenu
            x={contextMenu.x}
            y={contextMenu.y}
            column={column}
            table={table}
            onClose={() => setContextMenu(null)}
            onShowFilterInput={(columnId) => setActiveFilterColumn(columnId)}
          />
        ) : null;
      })()}

      {/* Filter Input Row (positioned below table header) */}
      {activeFilterColumn && (() => {
        const column = table.getColumn(activeFilterColumn);
        const columnDef = columnDefs.find((c) => c.id === activeFilterColumn);

        return column && columnDef?.filterable ? (
          <div
            className="fixed z-40 bg-background border rounded-md shadow-lg"
            style={{
              top: '120px',
              left: '50%',
              transform: 'translateX(-50%)',
              minWidth: '300px',
            }}
          >
            <div className="p-2 border-b">
              <div className="text-sm font-medium mb-2">
                Filter: {typeof columnDef.header === 'string' ? columnDef.header : columnDef.id}
              </div>
              <FilterInput
                columnId={activeFilterColumn}
                filterType={columnDef.filterType || 'text'}
                value={(column.getFilterValue() as string) || ''}
                onChange={(value) => column.setFilterValue(value || undefined)}
                onClear={() => {
                  column.setFilterValue(undefined);
                  setActiveFilterColumn(null);
                }}
                placeholder={`Filter ${columnDef.header}...`}
              />
            </div>
            <div className="p-2 flex justify-end gap-2">
              <button
                onClick={() => setActiveFilterColumn(null)}
                className="px-3 py-1.5 text-sm rounded-md hover:bg-accent"
              >
                Close
              </button>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
}
