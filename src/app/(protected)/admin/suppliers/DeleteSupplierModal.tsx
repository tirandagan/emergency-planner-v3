"use client";

import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Package } from "lucide-react";
import { getProductsBySupplier, deleteSupplier } from "./actions";

interface DeleteSupplierModalProps {
    supplier: {
        id: string;
        name: string;
    };
    onClose: () => void;
    onDeleted: () => void;
}

interface Product {
    id: string;
    name: string;
    price: string | null;
    imageUrl: string | null;
}

export default function DeleteSupplierModal({
    supplier,
    onClose,
    onDeleted,
}: DeleteSupplierModalProps): React.ReactElement {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [confirmationName, setConfirmationName] = useState("");
    const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);

    useEffect(() => {
        const loadProducts = async (): Promise<void> => {
            try {
                const data = await getProductsBySupplier(supplier.id);
                setProducts(data);
            } catch (error) {
                console.error("Failed to load products:", error);
            } finally {
                setLoading(false);
            }
        };

        void loadProducts();
    }, [supplier.id]);

    const handleFirstDelete = (): void => {
        setShowSecondConfirmation(true);
    };

    const handleFinalDelete = async (): Promise<void> => {
        setDeleting(true);
        try {
            await deleteSupplier(supplier.id);
            onDeleted();
        } catch (error) {
            console.error("Failed to delete supplier:", error);
            alert("Failed to delete supplier. Please try again.");
        } finally {
            setDeleting(false);
        }
    };

    const isNameMatching = confirmationName.trim().toLowerCase() === supplier.name.toLowerCase();
    const canDelete = isNameMatching && !loading;

    return (
        <div
            className="fixed inset-0 bg-slate-900/80 dark:bg-slate-950/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95"
                onClick={(e): void => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">
                                Delete Supplier
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {supplier.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="border-t border-border pt-4 mb-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            {products.length > 0 ? (
                                <>
                                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-4">
                                        <p className="text-sm text-destructive font-medium mb-2">
                                            ⚠️ Warning: This action cannot be undone
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Deleting this supplier will permanently delete{" "}
                                            <strong className="text-foreground">
                                                {products.length} product
                                                {products.length !== 1 ? "s" : ""}
                                            </strong>{" "}
                                            associated with it.
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Package className="w-4 h-4" />
                                            Products to be deleted:
                                        </h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
                                            {products.map((product) => (
                                                <div
                                                    key={product.id}
                                                    className="flex items-center gap-3 p-2 bg-background rounded border border-border hover:border-destructive/30 transition-colors"
                                                >
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            className="w-12 h-12 object-cover rounded border border-border"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-muted rounded border border-border flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {product.name}
                                                        </p>
                                                        {product.price && (
                                                            <p className="text-xs text-muted-foreground">
                                                                ${product.price}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-muted-foreground">
                                        No products are associated with this supplier.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Confirmation Input */}
                {!loading && (
                    <div className="border-t border-border pt-4 mb-4">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Type <span className="font-bold text-destructive">{supplier.name}</span> to confirm deletion:
                        </label>
                        <input
                            type="text"
                            value={confirmationName}
                            onChange={(e): void => setConfirmationName(e.target.value)}
                            placeholder="Enter supplier name"
                            disabled={deleting}
                            className="w-full bg-background border border-input rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-destructive focus:border-destructive outline-none transition-all disabled:opacity-50"
                            autoFocus
                        />
                        {confirmationName && !isNameMatching && (
                            <p className="text-xs text-destructive mt-1">
                                Name does not match. Please type exactly: {supplier.name}
                            </p>
                        )}
                    </div>
                )}

                {/* Second Confirmation Dialog */}
                {showSecondConfirmation && (
                    <div className="fixed inset-0 bg-slate-900/90 dark:bg-slate-950/95 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
                        <div className="bg-card border-2 border-destructive rounded-lg p-6 max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                            <h3 className="text-lg font-bold text-destructive mb-3">
                                Final Confirmation
                            </h3>
                            <p className="text-foreground mb-4">
                                Are you absolutely sure you want to delete <span className="font-bold">{supplier.name}</span>?
                            </p>
                            <p className="text-sm text-muted-foreground mb-6">
                                This action cannot be undone. All {products.length} associated product{products.length !== 1 ? 's' : ''} will be permanently deleted.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={(): void => setShowSecondConfirmation(false)}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleFinalDelete}
                                    disabled={deleting}
                                    className="px-6 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {deleting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        "Yes, Delete Forever"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleFirstDelete}
                        disabled={!canDelete || deleting}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        Delete Supplier
                    </button>
                </div>
            </div>
        </div>
    );
}
