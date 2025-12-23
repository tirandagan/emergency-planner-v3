'use client';

import React from 'react';
import type { Product, ProductMetadata } from '@/lib/products-types';
import { X as XIcon, Shield, Users, Clock, MapPin } from 'lucide-react';
import { TagValueDisplay } from '../page.client';
import { formatTagValue } from '@/lib/products-utils';
import { SCENARIOS, DEMOGRAPHICS, TIMEFRAMES, LOCATIONS } from '../constants';
import { updateProductTags, updateProduct } from '../actions';

/**
 * QuickTagger Component
 *
 * Inline tag editor for rapid product tag modification.
 * Allows toggling scenarios, demographics, timeframes, locations, and X1 multiplier.
 *
 * @example
 * <QuickTagger
 *   product={product}
 *   masterItem={masterItem}
 *   onClose={() => setIsTagging(false)}
 * />
 */
export function QuickTagger({
    product,
    onClose
}: {
    product: Product;
    onClose: () => void;
}): React.JSX.Element {
    const handleToggle = async (
        field: 'scenarios' | 'demographics' | 'timeframes' | 'locations',
        value: string
    ): Promise<void> => {
        const currentTags = product[field] || [];

        let newTags: string[];
        if (currentTags.includes(value)) {
            newTags = currentTags.filter(t => t !== value);
        } else {
            newTags = [...currentTags, value];
        }

        await updateProductTags(product.id, {
            scenarios: field === 'scenarios' ? newTags : (product.scenarios ?? []),
            demographics: field === 'demographics' ? newTags : (product.demographics ?? []),
            timeframes: field === 'timeframes' ? newTags : (product.timeframes ?? []),
            locations: field === 'locations' ? newTags : (product.locations ?? []),
        });
    };

    const handleX1Toggle = async (): Promise<void> => {
        const currentMetadata = (product.metadata as ProductMetadata) || {};
        const newMetadata = {
            ...currentMetadata,
            x1_multiplier: !currentMetadata.x1_multiplier,
        };

        const formData = new FormData();
        formData.append('id', product.id);
        formData.append('name', product.name || '');
        formData.append('masterItemId', product.masterItemId);
        formData.append('supplierId', product.supplierId || '');
        formData.append('price', String(product.price || 0));
        formData.append('type', product.type || 'PURCHASE');
        formData.append('productUrl', product.productUrl || '');
        formData.append('imageUrl', product.imageUrl || '');
        formData.append('description', product.description || '');
        formData.append('asin', product.asin || '');
        formData.append('sku', product.sku || '');

        // Preserve existing tags by adding them to FormData
        (product.scenarios || []).forEach(tag => formData.append('scenarios', tag));
        (product.demographics || []).forEach(tag => formData.append('demographics', tag));
        (product.timeframes || []).forEach(tag => formData.append('timeframes', tag));
        (product.locations || []).forEach(tag => formData.append('locations', tag));

        // Add metadata fields in the format expected by updateProduct
        Object.entries(newMetadata).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(`meta_${key}`, String(value));
            }
        });

        await updateProduct(formData);
    };

    const TagSection = ({
        title,
        items,
        field,
        icon: Icon
    }: {
        title: string;
        items: string[];
        field: 'scenarios' | 'demographics' | 'timeframes' | 'locations';
        icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    }): React.JSX.Element => {
        const currentValues = product[field] || [];

        let badgeClassName = 'text-primary bg-primary/10 border-primary/20';
        if (field === 'scenarios') badgeClassName = 'text-destructive bg-destructive/10 border-destructive/20';
        if (field === 'demographics') badgeClassName = 'text-success bg-success/10 border-success/20';
        if (field === 'timeframes') badgeClassName = 'text-primary bg-primary/10 border-primary/20';
        if (field === 'locations') badgeClassName = 'text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50';

        const formattedItems = items.map(item => formatTagValue(item, field));
        const hasActiveItems = currentValues.length > 0;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs mb-2 pr-4">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {title}
                    </label>
                </div>
                <div className={`flex items-stretch overflow-hidden rounded-md border transition-all duration-200 pl-0 py-0 ${hasActiveItems ? badgeClassName : 'bg-muted text-muted-foreground border-border'}`}>
                    <div className="px-2 border-r border-white/10 flex items-center justify-center">
                        <Icon className={`w-3.5 h-3.5 shrink-0 transition-opacity ${hasActiveItems ? 'opacity-70' : 'opacity-40'}`} strokeWidth={2.5} />
                    </div>
                    <div className="px-2.5 py-1 flex items-center flex-wrap gap-0">
                        {items.map((item, i) => {
                            const isActive = currentValues.includes(item);
                            const formattedValue = formattedItems[i];

                            return (
                                <span key={item} className="flex items-center">
                                    {i > 0 && <span className="mx-1.5 w-px h-3 bg-current opacity-30" />}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(field, item);
                                        }}
                                        className={`text-[11px] font-medium tracking-wide uppercase transition-all px-1.5 py-0.5 ${
                                            isActive
                                                ? 'bg-transparent hover:bg-white/10 rounded'
                                                : 'bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 text-gray-300 dark:text-gray-200'
                                        }`}
                                        title={item + (isActive ? " (Click to deselect)" : " (Click to select)")}
                                    >
                                        <TagValueDisplay value={formattedValue} field={field} title={item} />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            className="bg-card border-x border-b border-border py-6 px-6 shadow-lg rounded-b-lg mx-2 -mt-[1px] relative"
            onClick={(e) => e.stopPropagation()}
            style={{
                animation: 'slideDown 250ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close"
            >
                <XIcon className="w-4 h-4" strokeWidth={2.5} />
            </button>

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        max-height: 0;
                        padding-top: 0;
                        padding-bottom: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        max-height: 500px;
                        padding-top: 1.5rem;
                        padding-bottom: 1.5rem;
                        transform: translateY(0);
                    }
                }
            `}</style>
             <div className="flex flex-wrap gap-12 justify-center">
                <div className="min-w-[180px]">
                    <TagSection title="Scenarios" items={SCENARIOS} field="scenarios" icon={Shield} />
                </div>
                <div className="min-w-[140px]">
                    <TagSection title="People" items={DEMOGRAPHICS} field="demographics" icon={Users} />
                </div>
                <div className="min-w-[140px]">
                    <TagSection title="Timeframes" items={TIMEFRAMES} field="timeframes" icon={Clock} />
                </div>
                <div className="min-w-[140px]">
                    <TagSection title="Locations" items={LOCATIONS} field="locations" icon={MapPin} />
                </div>
                <div className="min-w-[140px]">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs mb-2 pr-4">
                            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                X1 Multiplier
                            </label>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleX1Toggle();
                                }}
                                className={`w-full flex items-stretch overflow-hidden rounded-md border transition-all duration-200 ${
                                    (product.metadata as ProductMetadata)?.x1_multiplier
                                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/40'
                                        : 'bg-muted text-muted-foreground border-border'
                                }`}
                            >
                                <div className="px-2 border-r border-white/10 flex items-center justify-center">
                                    <XIcon className={`w-3.5 h-3.5 shrink-0 transition-opacity ${(product.metadata as ProductMetadata)?.x1_multiplier ? 'opacity-90' : 'opacity-40'}`} strokeWidth={2.5} />
                                </div>
                                <div className="px-2.5 py-1 flex items-center justify-center flex-1">
                                    <span className="text-[11px] font-bold tracking-wide uppercase">
                                        {(product.metadata as ProductMetadata)?.x1_multiplier ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                            </button>
                            <p className="text-[10px] text-muted-foreground text-center italic">
                                {(product.metadata as ProductMetadata)?.x1_multiplier
                                    ? 'Quantity multiplies by party size'
                                    : 'Fixed quantity regardless of party size'}
                            </p>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
}
