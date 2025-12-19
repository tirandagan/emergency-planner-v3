'use client';

import React from 'react';
import type { Product, MasterItem } from '@/lib/products-types';
import { X, Shield, Users, Clock, MapPin, Unlink } from 'lucide-react';
import { TagValueDisplay } from '../page.client';
import { formatTagValue } from '@/lib/products-utils';
import { SCENARIOS, DEMOGRAPHICS, TIMEFRAMES, LOCATIONS } from '../constants';
import { updateProductTags } from '../actions';

/**
 * QuickTagger Component
 *
 * Inline tag editor for rapid product tag modification.
 * Allows toggling scenarios, demographics, timeframes, and locations.
 * Supports inheritance from master items with visual indicators.
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
    masterItem,
    onClose
}: {
    product: Product;
    masterItem: MasterItem | undefined;
    onClose: () => void;
}): React.JSX.Element {
    const handleToggle = async (
        field: 'scenarios' | 'demographics' | 'timeframes' | 'locations',
        value: string
    ): Promise<void> => {
        const currentTags = product[field];
        const isInherited = currentTags === null;

        let newTags: string[];

        if (isInherited) {
            const inherited = masterItem?.[field] || [];
            if (inherited.includes(value)) {
                newTags = inherited.filter(t => t !== value);
            } else {
                newTags = [...inherited, value];
            }
        } else {
            const current = currentTags || [];
            if (current.includes(value)) {
                newTags = current.filter(t => t !== value);
            } else {
                newTags = [...current, value];
            }
        }

        await updateProductTags(product.id, {
            scenarios: field === 'scenarios' ? newTags : (product.scenarios ?? null),
            demographics: field === 'demographics' ? newTags : (product.demographics ?? null),
            timeframes: field === 'timeframes' ? newTags : (product.timeframes ?? null),
            locations: field === 'locations' ? newTags : (product.locations ?? null),
        });
    };

    const handleReset = async (field: 'scenarios' | 'demographics' | 'timeframes' | 'locations'): Promise<void> => {
        await updateProductTags(product.id, {
            scenarios: field === 'scenarios' ? null : (product.scenarios ?? null),
            demographics: field === 'demographics' ? null : (product.demographics ?? null),
            timeframes: field === 'timeframes' ? null : (product.timeframes ?? null),
            locations: field === 'locations' ? null : (product.locations ?? null),
        });
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
        const currentValues = product[field];
        const isInherited = currentValues === null;
        const effectiveValues = isInherited ? (masterItem?.[field] || []) : (currentValues || []);

        // Get color classes matching TagBadge style
        let badgeClassName = 'text-primary bg-primary/10 border-primary/20';
        if (field === 'scenarios') badgeClassName = 'text-destructive bg-destructive/10 border-destructive/20';
        if (field === 'demographics') badgeClassName = 'text-success bg-success/10 border-success/20';
        if (field === 'timeframes') badgeClassName = 'text-primary bg-primary/10 border-primary/20';
        if (field === 'locations') badgeClassName = 'text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50';

        const formattedItems = items.map(item => formatTagValue(item, field));
        const hasActiveItems = effectiveValues && effectiveValues.length > 0;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs mb-2 pr-4">
                    <div className="flex items-center gap-2 text-muted-foreground font-medium uppercase tracking-wider">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />
                        {title}
                    </div>
                    {!isInherited ? (
                        <button
                            onClick={() => handleReset(field)}
                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors opacity-60 hover:opacity-100"
                            title="Reset to Master Item defaults"
                        >
                            <Unlink className="w-3 h-3" strokeWidth={2.5} />
                            Reset
                        </button>
                    ) : (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 italic cursor-help" title="Inheriting from Master Item">
                            <Unlink className="w-3 h-3 opacity-30" strokeWidth={2.5} />
                            Inherited
                        </span>
                    )}
                </div>
                <div className={`flex items-stretch overflow-hidden rounded-md border transition-all duration-200 pl-0 py-0 ${hasActiveItems ? badgeClassName : 'bg-muted text-muted-foreground border-border'}`}>
                    <div className="px-2 bg-white/10 border-r border-white/10 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" strokeWidth={2.5} />
                    </div>
                    <div className="px-2.5 py-1 flex items-center flex-wrap gap-0">
                        {items.map((item, i) => {
                            const isActive = effectiveValues!.includes(item);
                            const formattedValue = formattedItems[i];

                            return (
                                <span key={item} className="flex items-center">
                                    {i > 0 && <span className="mx-1.5 w-px h-3 bg-current opacity-30" />}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggle(field, item);
                                        }}
                                        className={`text-[11px] font-medium tracking-wide uppercase transition-colors hover:opacity-80 ${
                                            isActive ? '' : 'opacity-50'
                                        }`}
                                        title={item}
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
                <X className="w-4 h-4" strokeWidth={2.5} />
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
             </div>
        </div>
    );
}
