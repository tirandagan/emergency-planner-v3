'use client';

import React, { useState, useEffect } from 'react';
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
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Detect dark mode
    useEffect(() => {
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
        formData.append('package_size', String(product.packageSize || 1));
        formData.append('required_quantity', String(product.requiredQuantity || 1));

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

        let badgeClassName = 'text-primary bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30';
        if (field === 'scenarios') badgeClassName = 'text-destructive bg-destructive/10 dark:bg-destructive/20 border-destructive/20 dark:border-destructive/30';
        if (field === 'demographics') badgeClassName = 'text-success bg-success/10 dark:bg-success/20 border-success/20 dark:border-success/30';
        if (field === 'timeframes') badgeClassName = 'text-primary bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30';
        if (field === 'locations') badgeClassName = 'text-amber-700 dark:text-yellow-500 bg-amber-50 dark:bg-yellow-500/20 border-amber-200 dark:border-yellow-500/30';

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
                    {/* Category Icon - high contrast background with inverted colors for dark mode */}
                    <div
                        className="px-1.5 border-r flex items-center justify-center"
                        style={{
                            backgroundColor: isDarkMode ? 'hsl(0 0% 90%)' : 'hsl(0 0% 50%)',
                            borderRightColor: isDarkMode ? 'hsl(0 0% 70%)' : 'hsl(0 0% 30%)',
                            color: isDarkMode ? 'hsl(0 0% 10%)' : 'white'
                        }}
                    >
                        <Icon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                    </div>
                    <div className="px-2 py-0.5 flex items-center flex-wrap gap-0">
                        {items.map((item, i) => {
                            const isActive = currentValues.includes(item);
                            const formattedValue = formattedItems[i];

                            return (
                                <span key={item} className="flex items-center">
                                    {i > 0 && <span className="mx-1 w-px h-2.5 bg-current opacity-30" />}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(field, item);
                                        }}
                                        className={`text-[10px] font-medium tracking-wide uppercase transition-all px-1 py-0.5 ${
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
                                className={`w-full flex items-stretch overflow-hidden rounded-md border transition-all duration-200 pl-0 py-0 ${
                                    (product.metadata as ProductMetadata)?.x1_multiplier
                                        ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-500/20 dark:border-cyan-500/30'
                                        : 'bg-muted text-muted-foreground border-border'
                                }`}
                            >
                                {/* Category Icon - high contrast background with inverted colors for dark mode */}
                                <div
                                    className="px-1.5 border-r flex items-center justify-center"
                                    style={{
                                        backgroundColor: isDarkMode ? 'hsl(0 0% 90%)' : 'hsl(0 0% 50%)',
                                        borderRightColor: isDarkMode ? 'hsl(0 0% 70%)' : 'hsl(0 0% 30%)',
                                        color: isDarkMode ? 'hsl(0 0% 10%)' : 'white'
                                    }}
                                >
                                    <XIcon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
                                </div>
                                <div className="px-2 py-0.5 flex items-center justify-center flex-1">
                                    <span className="text-[10px] font-medium tracking-wide uppercase">
                                        {(product.metadata as ProductMetadata)?.x1_multiplier ? '1' : 'OFF'}
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
