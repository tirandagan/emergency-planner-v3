import React from 'react';
import { Edit, Plus, FolderTree, Layers, Trash2 } from 'lucide-react';
import type { Category } from '@/lib/products-types';

/**
 * Props for the CategoryContextMenu component
 */
export interface CategoryContextMenuProps {
  /** X coordinate for the context menu position */
  x: number;
  /** Y coordinate for the context menu position */
  y: number;
  /** The category that was right-clicked */
  category: Category;
  /** Handler to close the context menu */
  onClose: () => void;
  /** Handler for editing the category */
  onEdit: (category: Category) => void;
  /** Handler for adding a subcategory (only for root categories) */
  onAddSubcategory: (parentCategory: Category) => void;
  /** Handler for moving the category (only for subcategories) */
  onMove: (category: Category) => void;
  /** Handler for adding a master item to the category (only for subcategories) */
  onAddMasterItem: (category: Category) => void;
  /** Handler for deleting the category */
  onDelete: (category: Category) => void;
}

/**
 * CategoryContextMenu
 *
 * Context menu that appears when right-clicking on a category.
 * Shows different options based on whether the category is a root category or subcategory.
 *
 * Root categories can:
 * - Edit
 * - Add Subcategory
 * - Delete
 *
 * Subcategories can:
 * - Edit
 * - Move
 * - Add Master Item
 * - Delete
 *
 * @example
 * ```tsx
 * <CategoryContextMenu
 *   x={100}
 *   y={200}
 *   category={category}
 *   onClose={() => setMenu(null)}
 *   onEdit={handleEdit}
 *   onAddSubcategory={handleAddSubcategory}
 *   onMove={handleMove}
 *   onAddMasterItem={handleAddMasterItem}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function CategoryContextMenu({
  x,
  y,
  category,
  onClose,
  onEdit,
  onAddSubcategory,
  onMove,
  onAddMasterItem,
  onDelete
}: CategoryContextMenuProps): React.JSX.Element {
  const isRootCategory = category.parentId === null;

  return (
    <div
      id="category-context-menu"
      className="fixed z-50 bg-card border border-border rounded-lg shadow-2xl py-1 inline-flex flex-col w-fit overflow-hidden backdrop-blur-sm"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onEdit(category);
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors whitespace-nowrap"
      >
        <Edit className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
        Edit Category
      </button>

      {/* Only show "Add Subcategory" for root categories */}
      {isRootCategory && (
        <button
          onClick={() => {
            onAddSubcategory(category);
            onClose();
          }}
          className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
          Add Subcategory
        </button>
      )}

      {/* Only show "Move Category" and "Add Master Item" for subcategories */}
      {!isRootCategory && (
        <>
          <button
            onClick={() => {
              onMove(category);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors whitespace-nowrap"
          >
            <FolderTree className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
            Move Category
          </button>
          <button
            onClick={() => {
              onAddMasterItem(category);
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-3 transition-colors whitespace-nowrap"
          >
            <Layers className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
            Add Master Item
          </button>
        </>
      )}

      <div className="h-px bg-border my-1" />
      <button
        onClick={() => {
          onDelete(category);
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3 transition-colors whitespace-nowrap"
      >
        <Trash2 className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
        Delete
      </button>
    </div>
  );
}
