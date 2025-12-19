import React from 'react';
import { Fragment } from 'react';
import type { Product, MasterItem, ProductMetadata } from '@/lib/products-types';
import { AlertCircle, Shield, Users, Clock, MapPin, Unlink } from 'lucide-react';
import { QuickTagger } from '../modals/QuickTagger';
import { TagValueDisplay } from '../page.client';
import { formatTagValue } from '@/lib/products-utils';
import { DEMOGRAPHICS } from '../constants';

/**
 * ProductRow Component
 *
 * Renders a single product row in the master item products table.
 * Displays product details, tag differences from master item, metadata, and supplier info.
 * Supports inline QuickTagger for rapid tag editing.
 *
 * @example
 * <ProductRow
 *   product={product}
 *   masterItem={masterItem}
 *   isSelected={selectedIds.has(product.id)}
 *   isTagging={taggingProductId === product.id}
 *   onContextMenu={(e) => productMenu.openMenu(e, product)}
 *   onClick={(e) => handleProductClick(e, product.id)}
 *   onQuickTagClose={() => setTaggingProductId(null)}
 * />
 */

interface TagDifference {
    field: 'scenarios' | 'demographics' | 'timeframes' | 'locations';
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    className: string;
    label: string;
    differentTags: string[];
}

export interface ProductRowProps {
    product: Product;
    masterItem: MasterItem | null;
    isSelected: boolean;
    isTagging: boolean;
    onContextMenu: (e: React.MouseEvent, product: Product) => void;
    onClick: (e: React.MouseEvent, productId: string) => void;
    onQuickTagClose: () => void;
}

/**
 * ProductRow - Memoized for performance
 * Only re-renders when its product data, selection state, or tagging state changes
 */
export const ProductRow = React.memo(function ProductRow({
    product,
    masterItem,
    isSelected,
    isTagging,
    onContextMenu,
    onClick,
    onQuickTagClose
}: ProductRowProps): React.JSX.Element {
    // Check if product has overridden tags (non-null means inheritance is broken)
    const hasOverriddenTags = product.timeframes !== null ||
        product.demographics !== null ||
        product.locations !== null ||
        product.scenarios !== null;

    // Calculate tag differences for display
    const getTagDifferences = (): TagDifference[] => {
        if (!masterItem || !hasOverriddenTags) return [];

        const differences: TagDifference[] = [];

        const checkField = (
            field: 'scenarios' | 'demographics' | 'timeframes' | 'locations',
            productTags: string[] | null,
            masterTags: string[] | null,
            icon: React.ComponentType<{ className?: string; strokeWidth?: number }>,
            className: string,
            label: string
        ): void => {
            if (productTags === null) return; // Inheriting, no difference

            const productSet = new Set(productTags || []);
            const masterSet = new Set(masterTags || []);

            // For demographics, compare all options to show state differences
            if (field === 'demographics') {
                const allOptions = DEMOGRAPHICS;
                const differentTags: string[] = [];

                allOptions.forEach(option => {
                    const inProduct = productSet.has(option);
                    const inMaster = masterSet.has(option);
                    if (inProduct !== inMaster) {
                        differentTags.push(option);
                    }
                });

                if (differentTags.length > 0) {
                    differences.push({
                        field,
                        icon,
                        className,
                        label,
                        differentTags
                    });
                }
            } else {
                // For other fields, find tags that are different
                const differentTags: string[] = [];

                // Tags added in product
                productSet.forEach(tag => {
                    if (!masterSet.has(tag)) {
                        differentTags.push(tag);
                    }
                });

                // Tags removed in product (present in master but not in product)
                masterSet.forEach(tag => {
                    if (!productSet.has(tag)) {
                        differentTags.push(tag);
                    }
                });

                if (differentTags.length > 0) {
                    differences.push({
                        field,
                        icon,
                        className,
                        label,
                        differentTags
                    });
                }
            }
        };

        checkField('scenarios', product.scenarios ?? null, masterItem.scenarios ?? null, Shield, 'text-destructive bg-destructive/10 border-destructive/20', 'Scenarios');
        checkField('demographics', product.demographics ?? null, masterItem.demographics ?? null, Users, 'text-success bg-success/10 border-success/20', 'People');
        checkField('timeframes', product.timeframes ?? null, masterItem.timeframes ?? null, Clock, 'text-primary bg-primary/10 border-primary/20', 'Times');
        checkField('locations', product.locations ?? null, masterItem.locations ?? null, MapPin, 'text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50', 'Locs');

        return differences;
    };

    const tagDifferences = getTagDifferences();

    return (
        <Fragment>
            <tr
                className={`transition-colors group cursor-pointer ${
                    isSelected
                        ? 'bg-primary/10 hover:bg-primary/15 border-l-2 border-primary'
                        : isTagging
                            ? 'bg-muted/60 border-l-2 border-primary'
                            : 'hover:bg-muted/50 border-l-2 border-transparent'
                }`}
                onContextMenu={(e) => onContextMenu(e, product)}
                onClick={(e) => onClick(e, product.id)}
            >
                <td className="px-6 py-3 min-w-0">
                    <div className="flex gap-3 items-start">
                        {/* Broken link indicator */}
                        {hasOverriddenTags && (
                            <div className="w-4 shrink-0 pt-1">
                                <span title="Tags overridden from master item">
                                    <Unlink className="w-3.5 h-3.5 text-warning/70" strokeWidth={2.5} />
                                </span>
                            </div>
                        )}
                        {product.imageUrl && (
                            <img src={product.imageUrl} alt="" className="w-24 h-24 rounded bg-muted object-cover border border-border shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground">{product.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                                {product.sku || product.asin || 'No ID'}
                            </div>
                            {/* Product-specific tag differences */}
                            {tagDifferences.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {tagDifferences.map((diff) => {
                                        const masterSet = new Set(masterItem?.[diff.field] || []);
                                        const productSet = new Set(product[diff.field] || []);

                                        // For demographics, show only differing options with their product state
                                        if (diff.field === 'demographics') {
                                            const formattedOptions = diff.differentTags.map(option => formatTagValue(option, 'demographics'));

                                            return (
                                                <div key={diff.field} className={`flex items-center gap-1 px-2 py-0.5 rounded border ${diff.className}`}>
                                                    <diff.icon className="w-3 h-3 opacity-70 shrink-0" />
                                                    <div className="flex items-center gap-0">
                                                        {diff.differentTags.map((option, idx) => {
                                                            const inProduct = productSet.has(option);
                                                            const formattedValue = formattedOptions[idx];
                                                            return (
                                                                <span key={option} className="flex items-center">
                                                                    {idx > 0 && <span className="mx-1 w-px h-2.5 bg-current opacity-30" />}
                                                                    <span className={`rounded px-1 py-0.5 ${inProduct ? '' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'}`}>
                                                                        <TagValueDisplay value={formattedValue} field={diff.field} title={option} />
                                                                    </span>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // For other fields, show only the different tags
                                        return (
                                            <div key={diff.field} className={`flex items-center gap-1 px-2 py-0.5 rounded border ${diff.className}`}>
                                                <diff.icon className="w-3 h-3 opacity-70 shrink-0" />
                                                <div className="flex items-center gap-1">
                                                    {diff.differentTags.map((tag) => {
                                                        const formattedTag = formatTagValue(tag, diff.field);
                                                        return (
                                                            <span key={tag} className="flex items-center">
                                                                <TagValueDisplay value={formattedTag} field={diff.field} title={tag} />
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {/* Compact metadata tags */}
                            {product.metadata && Object.keys(product.metadata).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                    {product.metadata.brand && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-warning/10 text-warning rounded border border-warning/20">{product.metadata.brand}</span>
                                    )}
                                    {product.metadata.quantity && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-info/10 text-info rounded border border-info/20">×{product.metadata.quantity}</span>
                                    )}
                                    {product.metadata.weight && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">{product.metadata.weight}{product.metadata.weight_unit || 'g'}</span>
                                    )}
                                    {product.metadata.volume && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded border border-border">{product.metadata.volume}{product.metadata.volume_unit || 'ml'}</span>
                                    )}
                                    {product.metadata.size && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded border border-accent/20">{product.metadata.size}</span>
                                    )}
                                    {product.metadata.color && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-secondary/10 text-secondary rounded border border-secondary/20">{product.metadata.color}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-3 w-[180px]">
                    <div className="flex flex-col gap-0.5">
                        <div className="text-foreground text-xs flex items-center gap-1.5 min-w-0">
                            {!product.supplierId && (
                                <span title="Missing Supplier" className="shrink-0">
                                    <AlertCircle className="w-3.5 h-3.5 text-destructive" strokeWidth={2.5} />
                                </span>
                            )}
                            <span className="truncate min-w-0">{product.supplier?.name || <span className="text-destructive italic">No Supplier</span>}</span>
                        </div>
                        <span className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                            product.type === 'DROP_SHIP'
                            ? 'text-secondary'
                            : 'text-primary'
                        }`}>
                            {product.type}
                        </span>
                    </div>
                </td>
                <td className="px-6 py-3 w-[120px]">
                    <div className="text-foreground font-mono">
                        ${product.price ? Number(product.price).toFixed(2) : '0.00'}
                    </div>
                </td>
            </tr>
            {isTagging && (
                <tr>
                    <td colSpan={3} className="p-0 relative z-10 overflow-hidden">
                        <QuickTagger
                            product={product}
                            masterItem={masterItem || undefined}
                            onClose={onQuickTagClose}
                        />
                    </td>
                </tr>
            )}
        </Fragment>
    );
});
