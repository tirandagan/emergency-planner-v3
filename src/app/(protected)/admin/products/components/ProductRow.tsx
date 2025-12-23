import React, { useState } from 'react';
import { Fragment } from 'react';
import type { Product, MasterItem, ProductMetadata } from '@/lib/products-types';
import { AlertCircle, Shield, Users, Clock, MapPin, Unlink } from 'lucide-react';
import { QuickTagger } from '../modals/QuickTagger';
import { TagValueDisplay, HighlightedText } from '../page.client';
import { formatTagValue } from '@/lib/products-utils';
import { DEMOGRAPHICS } from '../constants';
import { AffiliateLinkButton } from './AffiliateLinkButton';
import { AffiliateLinkModal } from './AffiliateLinkModal';
import { AffiliateErrorModal, type AffiliateErrorType } from './AffiliateErrorModal';

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
    searchTerm?: string;
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
    searchTerm = '',
    onContextMenu,
    onClick,
    onQuickTagClose
}: ProductRowProps): React.JSX.Element {
    const [showDescriptionTooltip, setShowDescriptionTooltip] = useState(false);
    const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
    const [affiliateErrorType, setAffiliateErrorType] = useState<AffiliateErrorType | null>(null);
    const [affiliateErrorDetails, setAffiliateErrorDetails] = useState<{
        missingField?: string;
        variationCombination?: string;
    }>({});

    // Check if product has overridden tags (non-null means inheritance is broken)
    const hasOverriddenTags = product.timeframes !== null ||
        product.demographics !== null ||
        product.locations !== null ||
        product.scenarios !== null;

    // Check if search term matches description (for badge display)
    const matchesDescription = searchTerm && product.description &&
        product.description.toLowerCase().includes(searchTerm.toLowerCase().trim());

    // Extract context around the first match for tooltip
    const getMatchContext = (): { before: string; match: string; after: string } | null => {
        if (!searchTerm || !product.description) return null;
        
        const lowerDescription = product.description.toLowerCase();
        const lowerTerm = searchTerm.toLowerCase().trim();
        const matchIndex = lowerDescription.indexOf(lowerTerm);
        
        if (matchIndex === -1) return null;
        
        // Extract match text (preserve original case)
        const match = product.description.slice(matchIndex, matchIndex + lowerTerm.length);
        
        // Extract approximately 60 characters before and after the match (to center it)
        // This should give us roughly 12 words total
        const contextSize = 60;
        const start = Math.max(0, matchIndex - contextSize);
        const end = Math.min(product.description.length, matchIndex + lowerTerm.length + contextSize);
        
        const isClippingStart = start > 0;
        const isClippingEnd = end < product.description.length;
        
        let before = product.description.slice(start, matchIndex).trim();
        let after = product.description.slice(matchIndex + lowerTerm.length, end).trim();
        
        // Add ellipsis only if we're actually clipping
        if (isClippingStart) {
            before = '...' + before;
        }
        if (isClippingEnd) {
            after = after + '...';
        }
        
        return {
            before,
            match,
            after
        };
    };

    const matchContext = getMatchContext();

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
                <td className="pl-8 pr-2 py-3 min-w-0">
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
                            <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                                <span style={{ display: 'inline', wordBreak: 'normal', hyphens: 'manual' }}>
                                    <HighlightedText text={product.name || ''} searchTerm={searchTerm} />
                                </span>
                                {matchesDescription && (
                                    <span 
                                        className="relative inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-foreground rounded border border-gray-300 shadow-sm" 
                                        style={{ backgroundColor: '#ffff00' }}
                                        onMouseEnter={() => setShowDescriptionTooltip(true)}
                                        onMouseLeave={() => setShowDescriptionTooltip(false)}
                                    >
                                        Match in description
                                        {showDescriptionTooltip && matchContext && (
                                            <div 
                                                className="absolute z-50 bg-card rounded shadow-lg p-2 text-xs text-foreground"
                                                style={{
                                                    width: 'max-content',
                                                    maxWidth: '240px', // Approximately 12 words wide
                                                    maxHeight: '7em', // Maximum 5 lines (line-height 1.4 * 5)
                                                    overflow: 'hidden',
                                                    bottom: '100%',
                                                    left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    marginBottom: '4px',
                                                    lineHeight: '1.4',
                                                    wordBreak: 'break-word',
                                                    border: '0.5px solid rgb(209, 213, 219)', // Very thin outline
                                                    display: 'block'
                                                }}
                                                onMouseEnter={() => setShowDescriptionTooltip(true)}
                                                onMouseLeave={() => setShowDescriptionTooltip(false)}
                                            >
                                                {matchContext.before && <span>{matchContext.before} </span>}
                                                <span style={{ backgroundColor: '#ffff00' }}>{matchContext.match}</span>
                                                {matchContext.after && <span> {matchContext.after}</span>}
                                            </div>
                                        )}
                                    </span>
                                )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2 mt-0.5">
                                {product.sku && <span>SKU: {product.sku}</span>}
                                {product.sku && product.asin && <span className="text-border">•</span>}
                                {product.asin && <span>ASIN: {product.asin}</span>}
                                {!product.sku && !product.asin && 'No ID'}
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
                                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 rounded border border-amber-300 dark:border-amber-800/50">{product.metadata.brand}</span>
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
                                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 rounded border border-purple-300 dark:border-purple-800/50">{product.metadata.size}</span>
                                    )}
                                    {product.metadata.color && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 rounded border border-sky-300 dark:border-sky-800/50">{product.metadata.color}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </td>
                <td className="px-2 py-3 w-[180px]">
                    <div className="flex flex-col gap-0.5">
                        <div className="text-foreground text-xs flex items-center gap-1.5 min-w-0">
                            {!product.supplierId && (
                                <span title="Missing Supplier" className="shrink-0">
                                    <AlertCircle className="w-3.5 h-3.5 text-destructive" strokeWidth={2.5} />
                                </span>
                            )}
                            <span className="truncate min-w-0">{product.supplier?.name || <span className="text-destructive italic">No Supplier</span>}</span>
                            {product.supplier?.affiliateId && (
                                <AffiliateLinkButton
                                    product={product}
                                    onOpenModal={() => setIsAffiliateModalOpen(true)}
                                />
                            )}
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
                <td className="px-2 py-3 w-[120px]">
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

            {/* Affiliate Link Modal */}
            <AffiliateLinkModal
                isOpen={isAffiliateModalOpen}
                onClose={() => setIsAffiliateModalOpen(false)}
                product={product}
                onError={(errorType, missingField, variationCombination) => {
                    setAffiliateErrorType(errorType);
                    setAffiliateErrorDetails({
                        missingField,
                        variationCombination,
                    });
                }}
            />

            {/* Affiliate Error Modal */}
            <AffiliateErrorModal
                isOpen={!!affiliateErrorType}
                onClose={() => {
                    setAffiliateErrorType(null);
                    setAffiliateErrorDetails({});
                }}
                errorType={affiliateErrorType || 'no_asin'}
                productName={product.name || 'Unknown Product'}
                missingField={affiliateErrorDetails.missingField}
                variationCombination={affiliateErrorDetails.variationCombination}
            />
        </Fragment>
    );
});
