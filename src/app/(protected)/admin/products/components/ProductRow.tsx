import React, { useState } from 'react';
import { Fragment } from 'react';
import type { Product, MasterItem, ProductMetadata } from '@/lib/products-types';
import { AlertCircle, Shield, Users, Clock, MapPin, Unlink, X as XIcon } from 'lucide-react';
import { QuickTagger } from '../modals/QuickTagger';
import { TagValueDisplay, HighlightedText } from '../page.client';
import { formatTagValue, sortTimeframes } from '@/lib/products-utils';
import { DEMOGRAPHICS, SCENARIOS } from '../constants';
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
    // Drag-and-drop props (optional, provided by DraggableProductRow)
    dragRef?: (node: HTMLElement | null) => void;
    dragStyle?: React.CSSProperties;
    dragAttributes?: React.HTMLAttributes<HTMLTableRowElement>;
    dragListeners?: React.HTMLAttributes<HTMLButtonElement>;
    isDraggingState?: boolean;
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
    onQuickTagClose,
    dragRef,
    dragStyle,
    dragAttributes,
    dragListeners,
    isDraggingState
}: ProductRowProps): React.JSX.Element {
    const [showDescriptionTooltip, setShowDescriptionTooltip] = useState(false);
    const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
    const [affiliateErrorType, setAffiliateErrorType] = useState<AffiliateErrorType | null>(null);
    const [affiliateErrorDetails, setAffiliateErrorDetails] = useState<{
        missingField?: string;
        variationCombination?: string;
    }>({});
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Detect dark mode
    React.useEffect(() => {
        const checkDarkMode = (): void => {
            setIsDarkMode(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        // Watch for changes to dark mode
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

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

    // Get active tags for display (upward propagation model)
    const getActiveTags = (): TagDifference[] => {
        const activeTags: TagDifference[] = [];

        const addFieldIfHasTags = (
            field: 'scenarios' | 'demographics' | 'timeframes' | 'locations',
            tags: string[] | null,
            icon: React.ComponentType<{ className?: string; strokeWidth?: number }>,
            className: string,
            label: string
        ): void => {
            const tagArray = tags || [];
            if (tagArray.length > 0) {
                activeTags.push({
                    field,
                    icon,
                    className,
                    label,
                    differentTags: tagArray // Reusing the field name for consistency
                });
            }
        };

        // Show "ALL" if all scenarios are selected
        const scenariosToDisplay = (product.scenarios?.length === SCENARIOS.length) ? ['ALL'] : (product.scenarios ?? null);
        addFieldIfHasTags('scenarios', scenariosToDisplay, Shield, 'text-destructive bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/30', 'Scenarios');
        addFieldIfHasTags('demographics', product.demographics ?? null, Users, 'text-success bg-success/10 dark:bg-success/20 border-success/20 dark:border-success/30', 'People');
        // Sort timeframes chronologically before displaying
        const sortedTimeframes = product.timeframes ? sortTimeframes(product.timeframes) : null;
        addFieldIfHasTags('timeframes', sortedTimeframes, Clock, 'text-primary bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30', 'Times');
        addFieldIfHasTags('locations', product.locations ?? null, MapPin, 'text-amber-700 dark:text-yellow-500 bg-amber-50 dark:bg-yellow-500/20 border-amber-200 dark:border-yellow-500/30', 'Locs');

        return activeTags;
    };

    const activeTags = getActiveTags();

    return (
        <Fragment>
            <tr
                ref={dragRef}
                style={dragStyle}
                {...dragAttributes}
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
                <td className="pr-2 py-3 min-w-0">
                    <div className="flex gap-3 items-start pl-2">
                        {/* Drag handle - only shown when drag listeners are provided */}
                        {dragListeners && (
                            <button
                                {...dragListeners}
                                className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-[38px]"
                                aria-label="Drag to reorder product"
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg className="w-4 h-4 text-muted-foreground hover:text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="5" r="1" />
                                    <circle cx="9" cy="12" r="1" />
                                    <circle cx="9" cy="19" r="1" />
                                    <circle cx="15" cy="5" r="1" />
                                    <circle cx="15" cy="12" r="1" />
                                    <circle cx="15" cy="19" r="1" />
                                </svg>
                            </button>
                        )}
                        {product.imageUrl && (
                            <img src={product.imageUrl} alt="" className="w-24 h-24 rounded bg-muted object-cover border border-border shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                                <span style={{ display: 'inline', wordBreak: 'normal', hyphens: 'manual' }}>
                                    <HighlightedText text={product.name || ''} searchTerm={searchTerm} />
                                    {(() => {
                                        const pkgSize = product.packageSize ?? 1;
                                        const reqQty = product.requiredQuantity ?? 1;

                                        if (pkgSize === 1 && reqQty === 1) {
                                            return null;
                                        }

                                        if (pkgSize === 1) {
                                            return <span className="text-muted-foreground"> ({reqQty})</span>;
                                        }

                                        if (reqQty === 1) {
                                            return <span className="text-muted-foreground"> ({pkgSize})</span>;
                                        }

                                        return <span className="text-muted-foreground"> ({pkgSize} x {reqQty})</span>;
                                    })()}
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
                            <div className="text-[11px] text-muted-foreground font-mono flex items-center flex-wrap gap-1.5 mt-0.5">
                                {product.sku && <span>SKU: {product.sku}</span>}
                                {product.sku && product.asin && <span className="text-border">•</span>}
                                {product.asin && <span>ASIN: {product.asin}</span>}
                                {!product.sku && !product.asin && <span>No ID</span>}
                                {(product.sku || product.asin) && product.metadata?.brand && <span className="text-border">|</span>}
                                {product.metadata?.brand && <span>{product.metadata.brand}</span>}
                                {product.metadata?.brand && product.metadata?.color && <span className="text-border">|</span>}
                                {product.metadata?.color && <span>{product.metadata.color}</span>}
                            </div>
                            {/* Product active tags (upward propagation model) */}
                            {(activeTags.length > 0 || (product.metadata as ProductMetadata)?.x1_multiplier) && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {activeTags.map((tagGroup) => {
                                        const formattedTags = tagGroup.differentTags.map(tag =>
                                            formatTagValue(tag, tagGroup.field)
                                        );

                                        return (
                                            <div key={tagGroup.field} className={`flex items-stretch overflow-hidden rounded-md border transition-all duration-200 ${tagGroup.className} pl-0 py-0`}>
                                                {/* Category Icon - high contrast background with inverted colors for dark mode */}
                                                <div
                                                    className="px-1.5 border-r flex items-center justify-center"
                                                    style={{
                                                        backgroundColor: isDarkMode ? 'hsl(0 0% 90%)' : 'hsl(0 0% 50%)',
                                                        borderRightColor: isDarkMode ? 'hsl(0 0% 70%)' : 'hsl(0 0% 30%)',
                                                        color: isDarkMode ? 'hsl(0 0% 10%)' : 'white'
                                                    }}
                                                >
                                                    <tagGroup.icon
                                                        className="w-3 h-3 shrink-0"
                                                        strokeWidth={2.5}
                                                    />
                                                </div>
                                                <div className="px-2 py-0.5 flex items-center flex-wrap gap-0">
                                                    {tagGroup.differentTags.map((tag, idx) => {
                                                        const formattedValue = formattedTags[idx];
                                                        return (
                                                            <span key={`${tagGroup.field}-${tag}-${idx}`} className="flex items-center">
                                                                {idx > 0 && <span className="mx-1 w-px h-2.5 bg-current opacity-30" />}
                                                                <span className="text-[10px] font-medium tracking-wide uppercase transition-all bg-transparent rounded px-1 py-0.5">
                                                                    <TagValueDisplay value={formattedValue} field={tagGroup.field} title={tag} />
                                                                </span>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {/* X1 Multiplier Tag */}
                                    {(product.metadata as ProductMetadata)?.x1_multiplier && (
                                        <div className="flex items-stretch overflow-hidden rounded-md border transition-all duration-200 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-500/20 dark:border-cyan-500/30 pl-0 py-0">
                                            <div
                                                className="px-1.5 border-r flex items-center justify-center"
                                                style={{
                                                    backgroundColor: isDarkMode ? 'hsl(0 0% 90%)' : 'hsl(0 0% 50%)',
                                                    borderRightColor: isDarkMode ? 'hsl(0 0% 70%)' : 'hsl(0 0% 30%)',
                                                    color: isDarkMode ? 'hsl(0 0% 10%)' : 'white'
                                                }}
                                            >
                                                <XIcon
                                                    className="w-3 h-3 shrink-0"
                                                    strokeWidth={2.5}
                                                />
                                            </div>
                                            <div className="px-2 py-0.5 flex items-center">
                                                <span className="text-[10px] font-medium tracking-wide uppercase" title="Quantity multiplies by party size">
                                                    1
                                                </span>
                                            </div>
                                        </div>
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
                            ? 'text-muted-foreground'
                            : 'text-primary'
                        }`}>
                            {product.type}
                        </span>
                    </div>
                </td>
                <td className="px-2 py-3 w-[120px]">
                    <div className="text-foreground font-mono">
                        {(() => {
                            const basePrice = product.price ? Number(product.price) : 0;
                            const reqQty = product.requiredQuantity ?? 1;
                            const totalPrice = basePrice * reqQty;
                            return `$${totalPrice.toFixed(2)}`;
                        })()}
                    </div>
                </td>
            </tr>
            {isTagging && (
                <tr>
                    <td colSpan={3} className="p-0 relative z-10 overflow-hidden">
                        <QuickTagger
                            product={product}
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
