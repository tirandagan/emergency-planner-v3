"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Filter, Minus } from "lucide-react";
import { SCENARIOS, TIMEFRAMES, DEMOGRAPHICS, LOCATIONS } from "../../products/constants";

interface CompactTagFilterProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    selectedTags: string[]; // Tags can be "Tag" (include) or "!Tag" (exclude)
    onTagsChange: (tags: string[]) => void;
    className?: string;
}

// Combine all tags with types
const ALL_TAGS = [
    ...SCENARIOS.map(t => ({ label: t, type: 'Scenario' })),
    ...DEMOGRAPHICS.map(t => ({ label: t, type: 'Demographic' })),
    ...TIMEFRAMES.map(t => ({ label: t, type: 'Timeframe' })),
    ...LOCATIONS.map(t => ({ label: t, type: 'Location' }))
];

// Helper to get tag state: 'include' | 'exclude' | null
const getTagState = (tag: string, selectedTags: string[]): 'include' | 'exclude' | null => {
    if (selectedTags.includes(tag)) return 'include';
    if (selectedTags.includes(`!${tag}`)) return 'exclude';
    return null;
};

export default function CompactTagFilter({
    searchTerm,
    onSearchChange,
    selectedTags,
    onTagsChange,
    className = ""
}: CompactTagFilterProps) {
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
        const currentState = getTagState(tag, selectedTags);
        const withoutTag = selectedTags.filter(t => t !== tag && t !== `!${tag}`);
        
        if (currentState === null) {
            // Not selected -> Include
            onTagsChange([...withoutTag, tag]);
        } else if (currentState === 'include') {
            // Include -> Exclude
            onTagsChange([...withoutTag, `!${tag}`]);
        } else {
            // Exclude -> Remove
            onTagsChange(withoutTag);
        }
    };

    const removeTag = (tag: string) => {
        // Remove both include and exclude versions
        onTagsChange(selectedTags.filter(t => t !== tag && t !== `!${tag}`));
    };

    return (
        <div ref={containerRef} className={`relative group ${className}`}>
            <div className={`flex items-center bg-background border transition-all duration-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:border-primary ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>

                {/* Search Icon */}
                <div className="pl-3 text-muted-foreground">
                    <Search className="w-4 h-4" strokeWidth={2.5} />
                </div>

                {/* Selected Tags (Pills) */}
                <div className="flex flex-wrap gap-1.5 px-2 py-1.5 flex-1 items-center">
                    {selectedTags.map(rawTag => {
                        const isNegated = rawTag.startsWith('!');
                        const displayTag = isNegated ? rawTag.slice(1) : rawTag;
                        return (
                            <span
                                key={rawTag}
                                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded border whitespace-nowrap ${
                                    isNegated
                                        ? 'bg-destructive/20 text-destructive border-destructive/40'
                                        : 'bg-primary/20 text-primary border-primary/40'
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

                    {/* Input */}
                     <input
                        placeholder={selectedTags.length > 0 ? "" : "Search products..."}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="bg-transparent border-none outline-none text-foreground text-sm min-w-[120px] flex-1 py-1"
                    />
                </div>

                {/* Filter Toggle / Clear */}
                <div className="pr-2 flex items-center gap-1">
                    {selectedTags.length > 0 || searchTerm ? (
                        <button
                            onClick={() => {
                                onSearchChange("");
                                onTagsChange([]);
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                        >
                            <X className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                    ) : null}
                     <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-1.5 rounded-md transition-colors ${isOpen ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                    >
                        <Filter className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-6 max-h-[500px] overflow-y-auto">
                         {/* Group by Type */}
                         {['Scenario', 'Demographic', 'Timeframe', 'Location'].map(type => (
                             <div key={type} className="space-y-3">
                                 <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">{type}s</h4>
                                 <div className="space-y-2">
                                     {ALL_TAGS.filter(t => t.type === type).map(tag => {
                                         const state = getTagState(tag.label, selectedTags);
                                         return (
                                             <div
                                                key={tag.label}
                                                className="flex items-center gap-2 cursor-pointer group/item select-none"
                                                onClick={() => cycleTagState(tag.label)}
                                            >
                                                 <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                     state === 'include' ? 'bg-primary border-primary' :
                                                     state === 'exclude' ? 'bg-destructive border-destructive' :
                                                     'border-border bg-muted group-hover/item:border-primary/50'
                                                 }`}>
                                                     {state === 'include' && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                     {state === 'exclude' && <Minus className="w-3 h-3 text-destructive-foreground" strokeWidth={2.5} />}
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
            )}
        </div>
    );
}
