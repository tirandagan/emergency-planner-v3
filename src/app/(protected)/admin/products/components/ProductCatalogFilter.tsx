"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Filter, Minus, DollarSign, Truck } from "lucide-react";
import { SCENARIOS, TIMEFRAMES, DEMOGRAPHICS, LOCATIONS } from "../constants";

interface Supplier {
    id: string;
    name: string;
}

interface ProductCatalogFilterProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    selectedTags: string[]; // Tags can be "Tag" (include) or "!Tag" (exclude)
    onTagsChange: (tags: string[]) => void;
    selectedSuppliers: string[]; // Supplier IDs, can be "id" (include) or "!id" (exclude)
    onSuppliersChange: (suppliers: string[]) => void;
    priceRange: string; // "", "0-50", "50-100", "100-500", "500+"
    onPriceRangeChange: (range: string) => void;
    suppliers: Supplier[];
    className?: string;
}

// Combine all tags with types
const ALL_TAGS = [
    ...SCENARIOS.map(t => ({ label: t, type: 'Scenario' })),
    ...DEMOGRAPHICS.map(t => ({ label: t, type: 'Demographic' })),
    ...TIMEFRAMES.map(t => ({ label: t, type: 'Timeframe' })),
    ...LOCATIONS.map(t => ({ label: t, type: 'Location' }))
];

const PRICE_RANGES = [
    { value: "0-50", label: "Under $50" },
    { value: "50-100", label: "$50 - $100" },
    { value: "100-500", label: "$100 - $500" },
    { value: "500+", label: "$500+" }
];

// Helper to get item state: 'include' | 'exclude' | null
const getItemState = (item: string, selectedItems: string[]): 'include' | 'exclude' | null => {
    if (selectedItems.includes(item)) return 'include';
    if (selectedItems.includes(`!${item}`)) return 'exclude';
    return null;
};

export default function ProductCatalogFilter({
    searchTerm,
    onSearchChange,
    selectedTags,
    onTagsChange,
    selectedSuppliers,
    onSuppliersChange,
    priceRange,
    onPriceRangeChange,
    suppliers,
    className = ""
}: ProductCatalogFilterProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Cycle through states: null -> include -> exclude -> null
    const cycleTagState = (tag: string) => {
        const currentState = getItemState(tag, selectedTags);
        const withoutTag = selectedTags.filter(t => t !== tag && t !== `!${tag}`);
        
        if (currentState === null) {
            onTagsChange([...withoutTag, tag]);
        } else if (currentState === 'include') {
            onTagsChange([...withoutTag, `!${tag}`]);
        } else {
            onTagsChange(withoutTag);
        }
    };

    const cycleSupplierState = (supplierId: string) => {
        const currentState = getItemState(supplierId, selectedSuppliers);
        const withoutSupplier = selectedSuppliers.filter(s => s !== supplierId && s !== `!${supplierId}`);
        
        if (currentState === null) {
            onSuppliersChange([...withoutSupplier, supplierId]);
        } else if (currentState === 'include') {
            onSuppliersChange([...withoutSupplier, `!${supplierId}`]);
        } else {
            onSuppliersChange(withoutSupplier);
        }
    };

    const removeTag = (tag: string) => {
        onTagsChange(selectedTags.filter(t => t !== tag && t !== `!${tag}`));
    };

    const removeSupplier = (supplierId: string) => {
        onSuppliersChange(selectedSuppliers.filter(s => s !== supplierId && s !== `!${supplierId}`));
    };

    const clearAll = () => {
        onSearchChange("");
        onTagsChange([]);
        onSuppliersChange([]);
        onPriceRangeChange("");
    };

    const hasActiveFilters = selectedTags.length > 0 || selectedSuppliers.length > 0 || priceRange || searchTerm;
    const activeFilterCount = selectedTags.length + selectedSuppliers.length + (priceRange ? 1 : 0);

    // Get supplier name by ID
    const getSupplierName = (id: string) => {
        const cleanId = id.startsWith('!') ? id.slice(1) : id;
        return suppliers.find(s => s.id === cleanId)?.name || 'Unknown';
    };

    return (
        <div ref={containerRef} className={`relative group ${className}`}>
            <div className={`flex items-center bg-muted border transition-all duration-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-primary ${isOpen ? 'border-primary ring-2 ring-ring' : 'border-border'}`}>

                {/* Search Icon */}
                <div className="pl-3 text-muted-foreground">
                    <Search className="w-4 h-4" strokeWidth={2.5} />
                </div>

                {/* Selected Filters (Pills) */}
                <div className="flex flex-wrap gap-1.5 px-2 py-1.5 flex-1 items-center">
                    {/* Tag Pills */}
                    {selectedTags.map(rawTag => {
                        const isNegated = rawTag.startsWith('!');
                        const displayTag = isNegated ? rawTag.slice(1) : rawTag;
                        return (
                            <span
                                key={rawTag}
                                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap ${
                                    isNegated
                                        ? 'bg-destructive/30 text-destructive border-destructive/30'
                                        : 'bg-primary/30 text-primary border-primary/30'
                                }`}
                            >
                                {isNegated && <Minus className="w-3 h-3" strokeWidth={2.5} />}
                                {displayTag}
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeTag(displayTag); }}
                                    className="hover:text-foreground ml-0.5"
                                >
                                    <X className="w-3 h-3" strokeWidth={2.5} />
                                </button>
                            </span>
                        );
                    })}

                    {/* Supplier Pills */}
                    {selectedSuppliers.map(rawSupplier => {
                        const isNegated = rawSupplier.startsWith('!');
                        const supplierId = isNegated ? rawSupplier.slice(1) : rawSupplier;
                        const supplierName = getSupplierName(rawSupplier);
                        return (
                            <span
                                key={rawSupplier}
                                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap ${
                                    isNegated
                                        ? 'bg-destructive/30 text-destructive border-destructive/30'
                                        : 'bg-secondary/30 text-secondary border-secondary/30'
                                }`}
                            >
                                <Truck className="w-3 h-3" strokeWidth={2.5} />
                                {isNegated && <Minus className="w-3 h-3" strokeWidth={2.5} />}
                                {supplierName}
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeSupplier(supplierId); }}
                                    className="hover:text-foreground ml-0.5"
                                >
                                    <X className="w-3 h-3" strokeWidth={2.5} />
                                </button>
                            </span>
                        );
                    })}

                    {/* Price Range Pill */}
                    {priceRange && (
                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap bg-success/30 text-success border-success/30">
                            <DollarSign className="w-3 h-3" strokeWidth={2.5} />
                            {PRICE_RANGES.find(p => p.value === priceRange)?.label || priceRange}
                            <button
                                onClick={(e) => { e.stopPropagation(); onPriceRangeChange(""); }}
                                className="hover:text-foreground ml-0.5"
                            >
                                <X className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                        </span>
                    )}
                    
                    {/* Input */}
                    <input
                        placeholder={hasActiveFilters ? "" : "Search products..."}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-foreground text-sm min-w-[120px] flex-1 py-1 placeholder:text-muted-foreground"
                    />
                </div>

                {/* Filter Toggle / Clear */}
                <div className="pr-2 flex items-center gap-1">
                    {hasActiveFilters && (
                        <button
                            onClick={clearAll}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                            title="Clear all filters"
                        >
                            <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                    )}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${isOpen ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                    >
                        <Filter className="w-4 h-4" strokeWidth={2.5} />
                        {activeFilterCount > 0 && (
                            <span className="text-xs font-bold">{activeFilterCount}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-4 max-h-[600px] overflow-y-auto">

                        {/* Price & Suppliers Row */}
                        <div className="grid grid-cols-2 gap-6 mb-6 pb-4 border-b border-border">
                            {/* Price Range */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <DollarSign className="w-3 h-3" strokeWidth={2.5} />
                                    Price Range
                                </h4>
                                <div className="space-y-2">
                                    {PRICE_RANGES.map(range => (
                                        <div
                                            key={range.value}
                                            className="flex items-center gap-2 cursor-pointer group/item select-none"
                                            onClick={() => onPriceRangeChange(priceRange === range.value ? "" : range.value)}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                priceRange === range.value ? 'bg-success border-success' : 'border-border bg-muted group-hover/item:border-muted-foreground'
                                            }`}>
                                                {priceRange === range.value && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <span className={`text-sm transition-colors ${priceRange === range.value ? 'text-success' : 'text-muted-foreground group-hover/item:text-foreground'}`}>
                                                {range.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Suppliers */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Truck className="w-3 h-3" strokeWidth={2.5} />
                                    Suppliers
                                </h4>
                                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                    {suppliers.map(supplier => {
                                        const state = getItemState(supplier.id, selectedSuppliers);
                                        return (
                                            <div
                                                key={supplier.id}
                                                className="flex items-center gap-2 cursor-pointer group/item select-none"
                                                onClick={() => cycleSupplierState(supplier.id)}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                    state === 'include' ? 'bg-secondary border-secondary' :
                                                    state === 'exclude' ? 'bg-destructive border-destructive' :
                                                    'border-border bg-muted group-hover/item:border-muted-foreground'
                                                }`}>
                                                    {state === 'include' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    {state === 'exclude' && <Minus className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                                </div>
                                                <span className={`text-sm transition-colors ${
                                                    state === 'include' ? 'text-secondary' :
                                                    state === 'exclude' ? 'text-destructive line-through' :
                                                    'text-muted-foreground group-hover/item:text-foreground'
                                                }`}>
                                                    {supplier.name}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Tags Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            {['Scenario', 'Demographic', 'Timeframe', 'Location'].map(type => (
                                <div key={type} className="space-y-3">
                                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">{type}s</h4>
                                    <div className="space-y-2">
                                        {ALL_TAGS.filter(t => t.type === type).map(tag => {
                                            const state = getItemState(tag.label, selectedTags);
                                            return (
                                                <div
                                                    key={tag.label}
                                                    className="flex items-center gap-2 cursor-pointer group/item select-none"
                                                    onClick={() => cycleTagState(tag.label)}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                        state === 'include' ? 'bg-primary border-primary' :
                                                        state === 'exclude' ? 'bg-destructive border-destructive' :
                                                        'border-border bg-muted group-hover/item:border-muted-foreground'
                                                    }`}>
                                                        {state === 'include' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                        {state === 'exclude' && <Minus className="w-3 h-3 text-white" strokeWidth={2.5} />}
                                                    </div>
                                                    <span className={`text-sm transition-colors ${
                                                        state === 'include' ? 'text-primary' :
                                                        state === 'exclude' ? 'text-destructive line-through' :
                                                        'text-muted-foreground group-hover/item:text-foreground'
                                                    }`}>
                                                        {tag.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


