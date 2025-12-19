import React from 'react';
import type { Category, Product, MasterItem, CategoryGroup } from '@/lib/products-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { SubCategoryTreeItem } from './SubCategoryTreeItem';

/**
 * CategoryTreeItem Component
 *
 * Renders a root category header with collapsible subcategory list.
 * Top-level tree component that coordinates the entire product catalog hierarchy.
 *
 * @example
 * <CategoryTreeItem
 *   group={group}
 *   isExpanded={expandedCategories.has(group.category.id)}
 *   isActive={activeCategoryId === group.category.id}
 *   isFocused={focusedItemId === group.category.id}
 *   selectedProductIds={selectedIds}
 *   taggingProductId={taggingProductId}
 *   activeMasterItemId={activeMasterItemId}
 *   expandedSubCategories={expandedSubCategories}
 *   onToggle={(id) => toggleCategory(id)}
 *   onSelect={(id) => handleCategorySelect(id)}
 *   onCategoryContextMenu={(e, cat) => categoryMenu.openMenu(e, cat)}
 *   onMasterItemSelect={(id) => handleMasterItemSelect(id)}
 *   onMasterItemContextMenu={(e, item) => masterItemMenu.openMenu(e, item)}
 *   onProductContextMenu={(e, product) => productMenu.openMenu(e, product)}
 *   onProductClick={(e, id) => handleProductClick(e, id)}
 *   onQuickTagClose={() => setTaggingProductId(null)}
 *   setFocusedItemId={(id) => setFocusedItemId(id)}
 *   setFocusedItemType={(type) => setFocusedItemType(type)}
 *   onSort={(field) => filters.handleSort(field)}
 *   sortField={filters.sortField}
 *   sortDirection={filters.sortDirection}
 *   onToggleSubCategory={(id) => toggleSubCategory(id)}
 * />
 */

export interface CategoryTreeItemProps {
    group: CategoryGroup;
    isExpanded: boolean;
    isActive: boolean;
    isFocused: boolean;
    selectedProductIds: Set<string>;
    taggingProductId: string | null;
    activeMasterItemId: string | null;
    expandedSubCategories: Set<string>;
    activeCategoryId: string | null;
    focusedItemId: string | null;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onCategoryContextMenu: (e: React.MouseEvent, category: Category) => void;
    onMasterItemSelect: (id: string) => void;
    onMasterItemContextMenu: (e: React.MouseEvent, masterItem: MasterItem) => void;
    onProductContextMenu: (e: React.MouseEvent, product: Product) => void;
    onProductClick: (e: React.MouseEvent, productId: string) => void;
    onQuickTagClose: () => void;
    setFocusedItemId: (id: string) => void;
    setFocusedItemType: (type: 'category' | 'subcategory') => void;
    onSort: (field: string) => void;
    sortField: string;
    sortDirection: 'asc' | 'desc';
    onToggleSubCategory: (id: string) => void;
}

/**
 * CategoryTreeItem - Memoized for performance
 * Only re-renders when props change, preventing unnecessary updates when sibling categories expand/collapse
 */
export const CategoryTreeItem = React.memo(function CategoryTreeItem({
    group,
    isExpanded,
    isActive,
    isFocused,
    selectedProductIds,
    taggingProductId,
    activeMasterItemId,
    expandedSubCategories,
    activeCategoryId,
    focusedItemId,
    onToggle,
    onSelect,
    onCategoryContextMenu,
    onMasterItemSelect,
    onMasterItemContextMenu,
    onProductContextMenu,
    onProductClick,
    onQuickTagClose,
    setFocusedItemId,
    setFocusedItemType,
    onSort,
    sortField,
    sortDirection,
    onToggleSubCategory
}: CategoryTreeItemProps): React.JSX.Element {
    // Calculate total product count for this category
    const itemCount = Object.values(group.subGroups).reduce((acc, g) =>
        acc + Object.values(g.masterItems).reduce((acc2, m) => acc2 + m.products.length, 0)
    , 0);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Category Header - Collapsible */}
            <div
                data-nav-id={group.category.id}
                className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors group/cat ${
                    isActive || isFocused
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
                onClick={() => {
                    onToggle(group.category.id);
                    setFocusedItemId(group.category.id);
                    setFocusedItemType('category');
                    onSelect(group.category.id);
                }}
                onContextMenu={(e) => onCategoryContextMenu(e, group.category)}
            >
                 {isExpanded ? (
                     <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover/cat:text-foreground" strokeWidth={2.5} />
                 ) : (
                     <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover/cat:text-foreground" strokeWidth={2.5} />
                 )}

                 <span className="category-icon" title={group.category.icon || '🗂️'}>
                    {group.category.icon || '🗂️'}
                 </span>

                 <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelect(group.category.id); }}
                    className="flex items-center gap-2 flex-1 text-left"
                 >
                     <div className="flex-1 min-w-0">
                         <span className={`text-sm font-medium transition-colors ${isActive ? 'text-primary' : ''}`}>
                            {group.category.name}
                         </span>
                         {group.category.description && (
                             <span className="text-[10px] text-muted-foreground/70 truncate italic block leading-tight">
                                 {group.category.description}
                             </span>
                         )}
                     </div>
                     {isActive && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Selected</span>}
                 </button>

                 <span className="text-xs text-muted-foreground/70">
                     ({itemCount})
                 </span>
            </div>

            {/* Subgroups - Collapsible Content */}
            {isExpanded && (
            <div className="grid gap-1 mt-1 ml-4">
                {Object.values(group.subGroups).map(subGroup => {
                    const subCatId = subGroup.subCategory?.id || `root-${group.category.id}`;
                    const isSubExpanded = subGroup.subCategory ? expandedSubCategories.has(subCatId) : true;
                    const isSubActive = subGroup.subCategory ? activeCategoryId === subGroup.subCategory.id : false;

                    return (
                        <SubCategoryTreeItem
                            key={subCatId}
                            subGroup={subGroup}
                            subCatId={subCatId}
                            isExpanded={isSubExpanded}
                            isActive={isSubActive}
                            isFocused={focusedItemId === subGroup.subCategory?.id}
                            selectedProductIds={selectedProductIds}
                            taggingProductId={taggingProductId}
                            activeMasterItemId={activeMasterItemId}
                            onToggle={onToggleSubCategory}
                            onSelect={onSelect}
                            onCategoryContextMenu={onCategoryContextMenu}
                            onMasterItemSelect={onMasterItemSelect}
                            onMasterItemContextMenu={onMasterItemContextMenu}
                            onProductContextMenu={onProductContextMenu}
                            onProductClick={onProductClick}
                            onQuickTagClose={onQuickTagClose}
                            setFocusedItemId={setFocusedItemId}
                            setFocusedItemType={setFocusedItemType}
                            onSort={onSort}
                            sortField={sortField}
                            sortDirection={sortDirection}
                        />
                    );
                })}
            </div>
            )}
        </div>
    );
});
