"use client";

import { useState, useEffect } from "react";
import { X, Package, Check, Loader2, Plus, AlertCircle } from "lucide-react";
import { getBundles, addProductToBundle } from "../../bundles/actions";

interface AddToBundleModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any; // Using any to match the product type usage in page.client.tsx, but ideally should be Product
}

export default function AddToBundleModal({ isOpen, onClose, product }: AddToBundleModalProps) {
    const [bundles, setBundles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchBundles();
        }
    }, [isOpen]);

    const fetchBundles = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getBundles();
            setBundles(data || []);
        } catch (err: any) {
            console.error("Failed to fetch bundles", err);
            setError("Failed to load bundles");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (bundleId: string) => {
        if (!product) return;
        
        setSubmittingId(bundleId);
        try {
            await addProductToBundle(bundleId, product.id);
            // Update local state to reflect addition immediately
            setBundles(prev => prev.map(b => {
                if (b.id === bundleId) {
                    return {
                        ...b,
                        items: [...(b.items || []), { product: { id: product.id } }] // Minimal update for UI check
                    };
                }
                return b;
            }));
            // Optional: Show success toast or keep modal open
        } catch (err: any) {
            alert(`Failed to add to bundle: ${err.message}`);
        } finally {
            setSubmittingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-border flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" strokeWidth={2.5} />
                            Add to Bundle
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            Select a bundle to add <span className="text-foreground font-medium">{product?.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" strokeWidth={2.5} />
                            <p>Loading bundles...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-destructive gap-3">
                            <AlertCircle className="w-8 h-8" strokeWidth={2.5} />
                            <p>{error}</p>
                            <button
                                onClick={fetchBundles}
                                className="text-sm text-primary hover:underline"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : bundles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <Package className="w-8 h-8 opacity-20" strokeWidth={2.5} />
                            <p>No bundles found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bundles.map(bundle => {
                                const isAlreadyAdded = bundle.items?.some((item: any) => item.product.id === product?.id);
                                const isSubmitting = submittingId === bundle.id;

                                return (
                                    <button
                                        key={bundle.id}
                                        disabled={isAlreadyAdded || isSubmitting}
                                        onClick={() => handleAdd(bundle.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                                            isAlreadyAdded
                                                ? 'bg-muted/50 border-border opacity-50 cursor-not-allowed'
                                                : 'bg-muted/50 border-border hover:bg-muted hover:border-border/80 active:scale-[0.99]'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-medium text-foreground mb-0.5">{bundle.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {(bundle.items?.length || 0)} items • ${bundle.total_estimated_price?.toFixed(2) || '0.00'}
                                            </div>
                                        </div>

                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-primary" strokeWidth={2.5} />
                                        ) : isAlreadyAdded ? (
                                            <div className="flex items-center gap-1.5 text-success text-xs font-medium px-2 py-1 rounded-full bg-success/10 border border-success/20">
                                                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                                                Added
                                            </div>
                                        ) : (
                                            <div className="bg-primary hover:bg-primary/90 text-primary-foreground p-1.5 rounded-lg transition-colors shadow-lg shadow-primary/20">
                                                <Plus className="w-4 h-4" strokeWidth={2.5} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}













