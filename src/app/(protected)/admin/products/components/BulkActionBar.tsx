import React from 'react';
import { FolderTree, Truck, X } from 'lucide-react';

/**
 * Props for the BulkActionBar component
 */
export interface BulkActionBarProps {
  /** Number of selected products */
  selectedCount: number;
  /** Handler for assigning category to selected products */
  onAssignCategory: () => void;
  /** Handler for assigning supplier to selected products */
  onAssignSupplier: () => void;
  /** Handler for clearing the selection */
  onClearSelection: () => void;
}

/**
 * BulkActionBar
 *
 * Floating action bar that appears when multiple products are selected,
 * providing bulk operations like category assignment and supplier assignment.
 *
 * @example
 * ```tsx
 * <BulkActionBar
 *   selectedCount={5}
 *   onAssignCategory={() => handleBulkCategoryAssignment()}
 *   onAssignSupplier={() => handleBulkSupplierAssignment()}
 *   onClearSelection={() => setSelectedIds(new Set())}
 * />
 * ```
 */
export function BulkActionBar({
  selectedCount,
  onAssignCategory,
  onAssignSupplier,
  onClearSelection
}: BulkActionBarProps): React.JSX.Element {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-border rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 z-[50] animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="text-sm text-foreground font-medium border-r border-border pr-4 flex items-center gap-2">
        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{selectedCount}</span>
        Selected
      </div>
      <button
        onClick={onAssignCategory}
        className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <FolderTree className="w-4 h-4" strokeWidth={2.5} /> Assign Category
      </button>
      <div className="w-px h-4 bg-border" />
      <button
        onClick={onAssignSupplier}
        className="text-muted-foreground hover:text-foreground text-sm font-medium flex items-center gap-2 transition-colors"
      >
        <Truck className="w-4 h-4" strokeWidth={2.5} /> Assign Supplier
      </button>
      <div className="w-px h-4 bg-border" />
      <button onClick={onClearSelection} className="text-muted-foreground hover:text-foreground p-1" title="Clear Selection">
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
