import React from 'react';
import { Pencil, Tag, Layers, Package, Trash2, Copy } from 'lucide-react';
import type { Product } from '@/lib/products-types';

/**
 * Props for the ProductContextMenu component
 */
export interface ProductContextMenuProps {
  /** X coordinate for the context menu position */
  x: number;
  /** Y coordinate for the context menu position */
  y: number;
  /** The product that was right-clicked */
  product: Product;
  /** Handler to close the context menu */
  onClose: () => void;
  /** Handler for editing the product */
  onEdit: (product: Product) => void;
  /** Handler for quick tagging the product */
  onQuickTag: (productId: string) => void;
  /** Handler for changing the product's master item */
  onChangeMasterItem: (product: Product) => void;
  /** Handler for adding product to a bundle */
  onAddToBundle: (product: Product) => void;
  /** Handler for duplicating the product */
  onDuplicate: (product: Product) => void;
  /** Handler for deleting the product */
  onDelete: (productId: string) => Promise<void>;
  /** Render prop for supplier menu content (allows parent to manage complex submenu) */
  renderSupplierMenu?: () => React.ReactNode;
}

/**
 * ProductContextMenu
 *
 * Context menu that appears when right-clicking on a product row.
 * Provides options to:
 * - Edit the product
 * - Quick tag the product
 * - Change the product's master item
 * - Add product to a bundle
 * - Delete the product
 * - Change/Assign supplier (via render prop for complex submenu)
 *
 * @example
 * ```tsx
 * <ProductContextMenu
 *   x={100}
 *   y={200}
 *   product={product}
 *   onClose={() => setMenu(null)}
 *   onEdit={handleEdit}
 *   onQuickTag={handleQuickTag}
 *   onChangeMasterItem={handleChangeMasterItem}
 *   onAddToBundle={handleAddToBundle}
 *   onDelete={handleDelete}
 *   renderSupplierMenu={() => <SupplierSubmenu product={product} />}
 * />
 * ```
 */
export function ProductContextMenu({
  x,
  y,
  product,
  onClose,
  onEdit,
  onQuickTag,
  onChangeMasterItem,
  onAddToBundle,
  onDuplicate,
  onDelete,
  renderSupplierMenu
}: ProductContextMenuProps): React.JSX.Element {
  return (
    <div
      className="fixed z-[70] bg-card border border-border rounded-lg shadow-2xl py-1 inline-flex flex-col w-fit animate-in fade-in zoom-in-95"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-blue-600 dark:text-blue-400 flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onEdit(product);
          onClose();
        }}
      >
        <Pencil className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
        <span className="text-foreground">Edit Specific Product</span>
      </button>
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-green-600 dark:text-green-400 flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onQuickTag(product.id);
          onClose();
        }}
      >
        <Tag className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
        <span className="text-foreground">Quick Tag</span>
      </button>
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-orange-600 dark:text-orange-400 flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onChangeMasterItem(product);
          onClose();
        }}
      >
        <Layers className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
        <span className="text-foreground">Change Master Item</span>
      </button>
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-purple-600 dark:text-purple-400 flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onAddToBundle(product);
          onClose();
        }}
      >
        <Package className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
        <span className="text-foreground">Add to bundle</span>
      </button>
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-cyan-600 dark:text-cyan-400 flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onDuplicate(product);
          onClose();
        }}
      >
        <Copy className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
        <span className="text-foreground">Duplicate Product</span>
      </button>

      {/* Supplier menu - rendered by parent for complex state management */}
      {renderSupplierMenu && renderSupplierMenu()}

      <div className="h-px bg-border my-1" />
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-destructive/10 text-sm text-destructive flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={async () => {
          if (confirm('Delete this product?')) {
            await onDelete(product.id);
          }
          onClose();
        }}
      >
        <Trash2 className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
        Delete
      </button>
    </div>
  );
}
