import React, { useState } from 'react';
import { Search, X, Sparkles, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { searchProductsFromAmazon } from '../actions';

interface AmazonSearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: any) => void;
}

export default function AmazonSearchDialog({ isOpen, onClose, onSelect }: AmazonSearchDialogProps) {
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError(null);
        setResults([]);
        setHasSearched(true);

        try {
            const res = await searchProductsFromAmazon(query);
            if (res.success && res.data) {
                setResults(res.data);
            } else {
                setError(res.message || "No results found.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while searching.");
        } finally {
            setIsSearching(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
            <div className="bg-card border border-border rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">

                {/* Header & Search Bar */}
                <div className="p-6 border-b border-border bg-muted">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <div className="p-2 bg-primary rounded-full">
                                <Search className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
                            </div>
                            Search Amazon
                        </h2>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors">
                            <X className="w-6 h-6" strokeWidth={2.5} />
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by product name, ASIN, or URL..."
                            className="w-full bg-background border border-input rounded-xl pl-12 pr-32 py-4 text-foreground text-lg focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
                        />
                        <button
                            type="submit"
                            disabled={isSearching || !query.trim()}
                            className="absolute right-2 top-2 bottom-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-secondary/20"
                        >
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : 'Search'}
                        </button>
                    </form>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-background">
                    {isSearching ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-foreground/50" strokeWidth={2.5} />
                            <p>Searching Amazon...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-destructive gap-2">
                            <AlertCircle className="w-8 h-8" strokeWidth={2.5} />
                            <p>{error}</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="grid gap-4">
                            <p className="text-sm text-muted-foreground mb-2">Found {results.length} results</p>
                            {results.map((result, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-muted/50 border border-border rounded-xl hover:border-secondary/50 hover:bg-muted transition-colors group animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="w-24 h-24 bg-white rounded-lg p-2 shrink-0 flex items-center justify-center relative overflow-hidden">
                                        {result.image_url ? (
                                            <img src={result.image_url} alt="" className="max-w-full max-h-full object-contain" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-muted-foreground" strokeWidth={2.5} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-foreground font-medium text-lg line-clamp-2 mb-2 group-hover:underline transition-all">{result.name}</h3>
                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                                            {result.asin && <span className="bg-muted px-2 py-1 rounded border border-border font-mono">ASIN: {result.asin}</span>}
                                            {result.rating && <span className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-1 rounded border border-warning/20"><Sparkles className="w-3 h-3" strokeWidth={2.5} /> {result.rating} ({result.reviews})</span>}
                                        </div>
                                        <div className="text-muted-foreground text-sm line-clamp-2">{result.description}</div>
                                    </div>
                                    <div className="flex flex-col items-end justify-between shrink-0 gap-4 min-w-[120px]">
                                        <div className="text-2xl font-bold text-foreground font-mono">
                                            {result.price ? `$${result.price.toFixed(2)}` : <span className="text-muted-foreground text-lg">--</span>}
                                        </div>
                                        <button
                                            onClick={() => onSelect(result)}
                                            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-3 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-secondary/20 hover:shadow-secondary/40 flex items-center justify-center gap-2"
                                        >
                                            Select
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : hasSearched ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <Search className="w-12 h-12 opacity-20" strokeWidth={2.5} />
                            <p>No results found. Try a different search term.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <Search className="w-8 h-8 text-muted-foreground" strokeWidth={2.5} />
                            </div>
                            <p>Enter a product name, ASIN, or URL to start searching.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

