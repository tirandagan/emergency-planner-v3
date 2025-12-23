import React from 'react';
import type { Product, MasterItem, MasterItemGroup } from '@/lib/products-types';
import { Shield, Users, Clock, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { ProductRow } from './ProductRow';
import { TagBadge, HighlightedText } from '../page.client';
import { SCENARIOS } from '../constants';

/**
 * MasterItemRow Component
 *
 * Renders a master item header with its associated products table.
 * Displays master item metadata, tags, and allows selection/context menu actions.
 *
 * @example
 * <MasterItemRow
 *   masterGroup={masterGroup}
 *   isActive={activeMasterItemId === masterGroup.masterItem?.id}
 *   selectedProductIds={selectedIds}
 *   taggingProductId={taggingProductId}
 *   onSelectMasterItem={(id) => handleMasterItemSelect(id)}
 *   onMasterItemContextMenu={(e, item) => masterItemMenu.openMenu(e, item)}
 *   onProductContextMenu={(e, product) => productMenu.openMenu(e, product)}
 *   onProductClick={(e, id) => handleProductClick(e, id)}
 *   onQuickTagClose={() => setTaggingProductId(null)}
 *   onSort={(field) => filters.handleSort(field)}
 *   sortField={filters.sortField}
 *   sortDirection={filters.sortDirection}
 * />
 */

export interface MasterItemRowProps {
    masterGroup: MasterItemGroup;
    isActive: boolean;
    isExpanded: boolean;
    selectedProductIds: Set<string>;
    taggingProductId: string | null;
    searchTerm?: string;
    onSelectMasterItem: (id: string) => void;
    onToggleMasterItem: (id: string) => void;
    onMasterItemContextMenu: (e: React.MouseEvent, masterItem: MasterItem) => void;
    onProductContextMenu: (e: React.MouseEvent, product: Product) => void;
    onProductClick: (e: React.MouseEvent, productId: string) => void;
    onQuickTagClose: () => void;
    onSort: (field: string) => void;
    sortField: string;
    sortDirection: 'asc' | 'desc';
}

/**
 * MasterItemRow - Memoized for performance
 * Only re-renders when props change, not when sibling master items update
 */
export const MasterItemRow = React.memo(function MasterItemRow({
    masterGroup,
    isActive,
    isExpanded,
    selectedProductIds,
    taggingProductId,
    searchTerm = '',
    onSelectMasterItem,
    onToggleMasterItem,
    onMasterItemContextMenu,
    onProductContextMenu,
    onProductClick,
    onQuickTagClose,
    onSort,
    sortField,
    sortDirection
}: MasterItemRowProps): React.JSX.Element {
    // Sort icon helper component
    const SortIcon = ({ field }: { field: string }): React.JSX.Element => {
        if (sortField !== field) {
            return <span className="text-muted-foreground/30 opacity-0 group-hover/th:opacity-100 transition-opacity">↕</span>;
        }
        return <span className="text-foreground">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div
            key={masterGroup.masterItem?.id || 'nomaster'}
            className="bg-card border rounded-xl overflow-hidden shadow-sm transition-colors ml-4"
        >
            {/* Master Item Header */}
            {masterGroup.masterItem && (
                <div
                    className={`px-2 py-1.5 cursor-pointer transition-colors ${
                        isActive
                            ? 'bg-success/10'
                            : 'bg-muted/40 hover:bg-muted/60'
                    }`}
                    onClick={(e) => {
                        // If clicking on the chevron area, toggle expansion
                        const target = e.target as HTMLElement;
                        if (target.closest('[data-chevron]')) {
                            onToggleMasterItem(masterGroup.masterItem!.id);
                        } else {
                            onSelectMasterItem(masterGroup.masterItem!.id);
                        }
                    }}
                    onContextMenu={(e) => onMasterItemContextMenu(e, masterGroup.masterItem!)}
                >
                    <div className="flex items-start gap-3">
                        {/* Chevron Icon - Aligned with title row center, stays in place when expanded */}
                        <div
                            data-chevron
                            className="flex-shrink-0 transition-colors hover:text-primary mt-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleMasterItem(masterGroup.masterItem!.id);
                            }}
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-success' : 'text-foreground'}`}>
                                    <HighlightedText text={masterGroup.masterItem.name} searchTerm={searchTerm} />
                                </h4>
                                {/* Product Count Badge (when collapsed) */}
                                {!isExpanded && masterGroup.products.length > 0 && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                                        {masterGroup.products.length} {masterGroup.products.length === 1 ? 'product' : 'products'}
                                    </span>
                                )}
                                {isActive && (
                                    <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded border border-success/20">
                                        Selected
                                    </span>
                                )}
                            </div>

                            {masterGroup.masterItem.description && (
                                <p className="text-[10px] text-muted-foreground/70 truncate italic block leading-tight max-w-4xl">
                                    <HighlightedText text={masterGroup.masterItem.description} searchTerm={searchTerm} />
                                </p>
                            )}

                            {/* Visual Tags Display - Only show when expanded */}
                            {isExpanded && (
                                <div className="flex flex-wrap gap-1.5 items-center mt-1.5">
                                    <TagBadge
                                        icon={Shield}
                                        items={
                                            masterGroup.masterItem.scenarios?.length === SCENARIOS.length
                                                ? ['ALL Scenarios']
                                                : masterGroup.masterItem.scenarios
                                        }
                                        className="text-destructive bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/30"
                                        label="Scenarios"
                                        alwaysExpanded
                                        useHighContrast
                                    />
                                    <TagBadge
                                        icon={Users}
                                        items={masterGroup.masterItem.demographics}
                                        className="text-success bg-success/10 dark:bg-success/20 border-success/20 dark:border-success/30"
                                        label="People"
                                        alwaysExpanded
                                        useHighContrast
                                    />
                                    <TagBadge
                                        icon={Clock}
                                        items={masterGroup.masterItem.timeframes}
                                        className="text-primary bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30"
                                        label="Times"
                                        alwaysExpanded
                                        useHighContrast
                                    />
                                    <TagBadge
                                        icon={MapPin}
                                        items={masterGroup.masterItem.locations}
                                        className="text-amber-700 dark:text-yellow-500 bg-amber-50 dark:bg-yellow-500/20 border-amber-200 dark:border-yellow-500/30"
                                        label="Locs"
                                        alwaysExpanded
                                        useHighContrast
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Products Table - Only show when expanded */}
            {isExpanded && (
                <table className="w-full text-left text-sm text-muted-foreground table-fixed">
                    <thead className="bg-background/50 text-muted-foreground text-[10px] uppercase font-medium border-b border-border/50">
                        <tr>
                            <th className="pl-8 pr-2 py-2 cursor-pointer hover:text-foreground group/th" onClick={() => onSort('name')}>
                                <div className="flex items-center gap-2">Product <SortIcon field="name" /></div>
                            </th>
                            <th className="px-2 py-2 w-[180px] cursor-pointer hover:text-foreground group/th" onClick={() => onSort('supplier')}>
                                <div className="flex items-center gap-2">Supplier <SortIcon field="supplier" /></div>
                            </th>
                            <th className="px-2 py-2 w-[120px] cursor-pointer hover:text-foreground group/th" onClick={() => onSort('price')}>
                                <div className="flex items-center gap-2">Price <SortIcon field="price" /></div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {masterGroup.products.map((product) => (
                            <ProductRow
                                key={product.id}
                                product={product}
                                masterItem={masterGroup.masterItem}
                                isSelected={selectedProductIds.has(product.id)}
                                isTagging={taggingProductId === product.id}
                                searchTerm={searchTerm}
                                onContextMenu={onProductContextMenu}
                                onClick={onProductClick}
                                onQuickTagClose={onQuickTagClose}
                            />
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
});
