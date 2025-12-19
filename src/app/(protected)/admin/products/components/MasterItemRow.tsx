import React from 'react';
import type { Product, MasterItem, MasterItemGroup } from '@/lib/products-types';
import { Shield, Users, Clock, MapPin } from 'lucide-react';
import { ProductRow } from './ProductRow';
import { TagBadge } from '../page.client';
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
    selectedProductIds: Set<string>;
    taggingProductId: string | null;
    onSelectMasterItem: (id: string) => void;
    onMasterItemContextMenu: (e: React.MouseEvent, masterItem: MasterItem) => void;
    onProductContextMenu: (e: React.MouseEvent, product: Product) => void;
    onProductClick: (e: React.MouseEvent, productId: string) => void;
    onQuickTagClose: () => void;
    onSort: (field: string) => void;
    sortField: string;
    sortDirection: 'asc' | 'desc';
}

export function MasterItemRow({
    masterGroup,
    isActive,
    selectedProductIds,
    taggingProductId,
    onSelectMasterItem,
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
            className="bg-card border rounded-xl overflow-hidden shadow-sm transition-colors"
        >
            {/* Master Item Header */}
            {masterGroup.masterItem && (
                <div
                    className={`px-6 py-3 cursor-pointer transition-colors ${
                        isActive
                            ? 'bg-success/10'
                            : 'bg-muted/40 hover:bg-muted/60'
                    }`}
                    onClick={() => onSelectMasterItem(masterGroup.masterItem!.id)}
                    onContextMenu={(e) => onMasterItemContextMenu(e, masterGroup.masterItem!)}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                                <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-success' : 'text-foreground'}`}>
                                    {masterGroup.masterItem.name}
                                </h4>
                                {isActive && (
                                    <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded border border-success/20">
                                        Selected
                                    </span>
                                )}
                            </div>

                            {masterGroup.masterItem.description && (
                                <p className="text-xs text-muted-foreground mb-2 max-w-4xl line-clamp-2">
                                    {masterGroup.masterItem.description}
                                </p>
                            )}

                            {/* Visual Tags Display */}
                            <div className="flex flex-wrap gap-2 items-center">
                                <TagBadge
                                    icon={Shield}
                                    items={
                                        masterGroup.masterItem.scenarios?.length === SCENARIOS.length
                                            ? ['ALL Scenarios']
                                            : masterGroup.masterItem.scenarios
                                    }
                                    className="text-destructive bg-destructive/10 border-destructive/20"
                                    label="Scenarios"
                                    alwaysExpanded
                                />
                                <TagBadge
                                    icon={Users}
                                    items={masterGroup.masterItem.demographics}
                                    className="text-success bg-success/10 border-success/20"
                                    label="People"
                                    alwaysExpanded
                                />
                                <TagBadge
                                    icon={Clock}
                                    items={masterGroup.masterItem.timeframes}
                                    className="text-primary bg-primary/10 border-primary/20"
                                    label="Times"
                                    alwaysExpanded
                                />
                                <TagBadge
                                    icon={MapPin}
                                    items={masterGroup.masterItem.locations}
                                    className="text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50"
                                    label="Locs"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <table className="w-full text-left text-sm text-muted-foreground table-fixed">
                <thead className="bg-background/50 text-muted-foreground text-[10px] uppercase font-medium border-b border-border/50">
                    <tr>
                        <th className="px-6 py-2 cursor-pointer hover:text-foreground group/th" onClick={() => onSort('name')}>
                            <div className="flex items-center gap-2">Product <SortIcon field="name" /></div>
                        </th>
                        <th className="px-6 py-2 w-[180px] cursor-pointer hover:text-foreground group/th" onClick={() => onSort('supplier')}>
                            <div className="flex items-center gap-2">Supplier <SortIcon field="supplier" /></div>
                        </th>
                        <th className="px-6 py-2 w-[120px] cursor-pointer hover:text-foreground group/th" onClick={() => onSort('price')}>
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
                            onContextMenu={onProductContextMenu}
                            onClick={onProductClick}
                            onQuickTagClose={onQuickTagClose}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
