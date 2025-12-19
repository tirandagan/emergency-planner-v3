import React from 'react';
import { Edit, Plus, MoveRight, Copy, ClipboardPaste } from 'lucide-react';
import type { MasterItem } from '@/lib/products-types';

/**
 * Props for the MasterItemContextMenu component
 */
export interface MasterItemContextMenuProps {
  /** X coordinate for the context menu position */
  x: number;
  /** Y coordinate for the context menu position */
  y: number;
  /** The master item that was right-clicked */
  masterItem: MasterItem;
  /** Handler to close the context menu */
  onClose: () => void;
  /** Handler for editing the master item */
  onEdit: (item: MasterItem) => void;
  /** Handler for adding a product to this master item */
  onAddProduct: (item: MasterItem) => void;
  /** Handler for moving the master item to another category */
  onMove: (item: MasterItem) => void;
  /** Handler for copying tags from this master item */
  onCopyTags: (item: MasterItem) => void;
  /** Handler for pasting tags to this master item */
  onPasteTags: (item: MasterItem) => void;
  /** Whether there are copied tags available to paste */
  hasCopiedTags: boolean;
  /** Name of the source master item tags were copied from */
  copiedTagsSourceName?: string;
}

/**
 * MasterItemContextMenu
 *
 * Context menu that appears when right-clicking on a master item header.
 * Provides options to:
 * - Edit the master item
 * - Add a product to the master item
 * - Move the master item to another category
 * - Copy tags from the master item
 * - Paste tags to the master item (if tags are copied)
 *
 * @example
 * ```tsx
 * <MasterItemContextMenu
 *   x={100}
 *   y={200}
 *   masterItem={masterItem}
 *   onClose={() => setMenu(null)}
 *   onEdit={handleEdit}
 *   onAddProduct={handleAddProduct}
 *   onMove={handleMove}
 *   onCopyTags={handleCopyTags}
 *   onPasteTags={handlePasteTags}
 *   hasCopiedTags={!!copiedTags}
 *   copiedTagsSourceName={copiedTags?.sourceName}
 * />
 * ```
 */
export function MasterItemContextMenu({
  x,
  y,
  masterItem,
  onClose,
  onEdit,
  onAddProduct,
  onMove,
  onCopyTags,
  onPasteTags,
  hasCopiedTags,
  copiedTagsSourceName
}: MasterItemContextMenuProps): React.JSX.Element {
  return (
    <div
      className="fixed z-[70] bg-card border border-border rounded-lg shadow-2xl py-1 inline-flex flex-col w-fit overflow-hidden animate-in fade-in zoom-in-95"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onEdit(masterItem);
          onClose();
        }}
      >
        <Edit className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
        Edit Master Item
      </button>
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onAddProduct(masterItem);
          onClose();
        }}
      >
        <Plus className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
        Add Product
      </button>
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onMove(masterItem);
          onClose();
        }}
      >
        <MoveRight className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
        Move Master Item
      </button>
      <div className="h-px bg-border my-1" />
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onCopyTags(masterItem);
          onClose();
        }}
      >
        <Copy className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
        Copy Tags
      </button>
      <button
        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors whitespace-nowrap ${
          hasCopiedTags
            ? 'hover:bg-muted text-foreground'
            : 'text-muted-foreground cursor-not-allowed'
        }`}
        onClick={() => {
          if (hasCopiedTags) {
            onPasteTags(masterItem);
            onClose();
          }
        }}
        disabled={!hasCopiedTags}
      >
        <ClipboardPaste className={`w-4 h-4 flex-shrink-0 ${hasCopiedTags ? 'text-success' : 'text-muted-foreground'}`} strokeWidth={2.5} />
        Paste Tags
        {hasCopiedTags && copiedTagsSourceName && (
          <span className="ml-auto text-[10px] text-muted-foreground truncate max-w-[80px]">
            from {copiedTagsSourceName}
          </span>
        )}
      </button>
    </div>
  );
}
