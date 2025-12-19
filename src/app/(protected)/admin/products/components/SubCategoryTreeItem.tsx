import React from 'react';
import type { Category, Product, MasterItem, SubCategoryGroup, MasterItemGroup } from '@/lib/products-types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MasterItemRow } from './MasterItemRow';

/**
 * SubCategoryTreeItem Component
 *
 * Renders a subcategory header with collapsible master item list.
 * Displays subcategory metadata and allows selection/context menu actions.
 *
 * @example
 * <SubCategoryTreeItem
 *   subGroup={subGroup}
 *   isExpanded={expandedSubCategories.has(subCatId)}
 *   isActive={activeCategoryId === subGroup.subCategory?.id}
 *   isFocused={focusedItemId === subGroup.subCategory?.id}
 *   selectedProductIds={selectedIds}
 *   taggingProductId={taggingProductId}
 *   activeMasterItemId={activeMasterItemId}
 *   onToggle={(id) => toggleSubCategory(id)}
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
 * />
 */

export interface SubCategoryTreeItemProps {
    subGroup: SubCategoryGroup;
    subCatId: string;
    isExpanded: boolean;
    isActive: boolean;
    isFocused: boolean;
    selectedProductIds: Set<string>;
    taggingProductId: string | null;
    searchTerm?: string;
    activeMasterItemId: string | null;
    expandedMasterItems: Set<string>;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onCategoryContextMenu: (e: React.MouseEvent, category: Category) => void;
    onMasterItemSelect: (id: string) => void;
    onToggleMasterItem: (id: string) => void;
    onMasterItemContextMenu: (e: React.MouseEvent, masterItem: MasterItem) => void;
    onProductContextMenu: (e: React.MouseEvent, product: Product) => void;
    onProductClick: (e: React.MouseEvent, productId: string) => void;
    onQuickTagClose: () => void;
    setFocusedItemId: (id: string) => void;
    setFocusedItemType: (type: 'category' | 'subcategory') => void;
    onSort: (field: string) => void;
    sortField: string;
    sortDirection: 'asc' | 'desc';
}

/**
 * SubCategoryTreeItem - Memoized for performance
 * Only re-renders when props change, preventing cascading updates
 */
export const SubCategoryTreeItem = React.memo(function SubCategoryTreeItem({
    subGroup,
    subCatId,
    isExpanded,
    isActive,
    isFocused,
    selectedProductIds,
    taggingProductId,
    searchTerm = '',
    activeMasterItemId,
    expandedMasterItems,
    onToggle,
    onSelect,
    onCategoryContextMenu,
    onMasterItemSelect,
    onToggleMasterItem,
    onMasterItemContextMenu,
    onProductContextMenu,
    onProductClick,
    onQuickTagClose,
    setFocusedItemId,
    setFocusedItemType,
    onSort,
    sortField,
    sortDirection
}: SubCategoryTreeItemProps): React.JSX.Element {
    // Sort master groups by name for consistency
    const sortedMasterGroups = Object.values(subGroup.masterItems).sort((a, b) => {
        const nameA = a.masterItem?.name || 'Uncategorized';
        const nameB = b.masterItem?.name || 'Uncategorized';
        return nameA.localeCompare(nameB);
    });

    return (
        <div className="transition-colors">
            {/* Subcategory Header (if exists) */}
            {subGroup.subCategory && (
                <div
                    data-nav-id={subGroup.subCategory.id}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors group/subcat ${
                        isActive || isFocused
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                    onClick={() => {
                        onToggle(subCatId);
                        setFocusedItemId(subGroup.subCategory!.id);
                        setFocusedItemType('subcategory');
                        onSelect(subGroup.subCategory!.id);
                    }}
                    onContextMenu={(e) => onCategoryContextMenu(e, subGroup.subCategory!)}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover/subcat:text-foreground" strokeWidth={2.5} />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover/subcat:text-foreground" strokeWidth={2.5} />
                    )}

                    <span className="category-icon" title={subGroup.subCategory.icon || '📁'}>
                        {subGroup.subCategory.icon || '📁'}
                    </span>

                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelect(subGroup.subCategory!.id); }}
                        className="flex items-center gap-2 flex-1 text-left"
                    >
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium transition-colors">
                                {subGroup.subCategory.name}
                                {' '}
                                <span className="text-xs text-muted-foreground/70">
                                    ({Object.values(subGroup.masterItems).reduce((acc, m) => acc + m.products.length, 0)})
                                </span>
                            </span>
                            {subGroup.subCategory.description && (
                                <span className="text-[10px] text-muted-foreground/70 truncate italic block leading-tight">
                                    {subGroup.subCategory.description}
                                </span>
                            )}
                        </div>
                        {isActive && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Selected</span>}
                    </button>
                </div>
            )}

            {/* Master Items Groups */}
            {(isExpanded || !subGroup.subCategory) && (
                <div className="space-y-1.5 mt-0.5 ml-4">
                    {sortedMasterGroups.map(masterGroup => (
                        <MasterItemRow
                            key={masterGroup.masterItem?.id || 'nomaster'}
                            masterGroup={masterGroup}
                            searchTerm={searchTerm}
                            isActive={masterGroup.masterItem?.id === activeMasterItemId}
                            isExpanded={masterGroup.masterItem ? expandedMasterItems.has(masterGroup.masterItem.id) : false}
                            selectedProductIds={selectedProductIds}
                            taggingProductId={taggingProductId}
                            onSelectMasterItem={onMasterItemSelect}
                            onToggleMasterItem={onToggleMasterItem}
                            onMasterItemContextMenu={onMasterItemContextMenu}
                            onProductContextMenu={onProductContextMenu}
                            onProductClick={onProductClick}
                            onQuickTagClose={onQuickTagClose}
                            onSort={onSort}
                            sortField={sortField}
                            sortDirection={sortDirection}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});
