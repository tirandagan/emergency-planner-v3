import React from 'react';
import { Plus, Search, X } from 'lucide-react';

interface AddProductChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onManualSelect: () => void;
    onAmazonSelect: () => void;
}

export default function AddProductChoiceModal({
    isOpen,
    onClose,
    onManualSelect,
    onAmazonSelect
}: AddProductChoiceModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-8 animate-in fade-in zoom-in-95 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" strokeWidth={2.5} />
                </button>

                <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Add New Product</h2>
                <p className="text-muted-foreground text-center mb-8">Choose how you want to add a product to the catalog.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        onClick={onManualSelect}
                        className="flex flex-col items-center gap-4 p-6 bg-muted/50 hover:bg-muted border border-border hover:border-border/50 rounded-xl transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8 text-foreground" strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-foreground mb-1">Manual Entry</h3>
                            <p className="text-xs text-muted-foreground">Fill out the product form manually from scratch.</p>
                        </div>
                    </button>

                    <button
                        onClick={onAmazonSelect}
                        className="flex flex-col items-center gap-4 p-6 bg-muted/50 hover:bg-muted border border-border hover:border-border/50 rounded-xl transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Search className="w-8 h-8 text-foreground" strokeWidth={2.5} />
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-foreground mb-1">Search Amazon</h3>
                            <p className="text-xs text-muted-foreground">Find and import product details directly from Amazon.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}



















