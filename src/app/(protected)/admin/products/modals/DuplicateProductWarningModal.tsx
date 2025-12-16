import React from 'react';
import { AlertTriangle, ArrowRight, Trash2, Save, X } from 'lucide-react';

interface ProductData {
    id?: string;
    name: string;
    asin?: string | null;
    price?: number;
    supplier_name?: string;
    master_item_name?: string;
    description?: string;
    image_url?: string;
}

interface DuplicateProductWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMerge: () => void;
    onDelete: () => void;
    existingProduct: ProductData;
    newProduct: ProductData;
    isEditing: boolean;
}

export default function DuplicateProductWarningModal({
    isOpen,
    onClose,
    onMerge,
    onDelete,
    existingProduct,
    newProduct,
    isEditing
}: DuplicateProductWarningModalProps) {
    if (!isOpen) return null;

    const formatCurrency = (val?: number) => val ? `$${val.toFixed(2)}` : '-';

    const renderField = (label: string, val1: any, val2: any, highlight = false) => {
        const isDiff = val1 != val2;
        return (
            <div className={`grid grid-cols-2 gap-4 py-2 border-b border-gray-800 last:border-0 ${highlight && isDiff ? 'bg-yellow-900/10' : ''}`}>
                <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
                    <div className={`text-sm ${isDiff ? 'text-yellow-200' : 'text-gray-300'}`}>{val1 || '-'}</div>
                </div>
                <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase font-semibold">{label} (New)</span>
                    <div className={`text-sm ${isDiff ? 'text-green-200' : 'text-gray-300'}`}>{val2 || '-'}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#0f1117] border border-yellow-700/50 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 overflow-hidden max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 bg-yellow-900/20 border-b border-yellow-700/30 flex items-start gap-4">
                    <div className="p-3 bg-yellow-900/40 rounded-full shrink-0">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">Duplicate ASIN Detected</h3>
                        <p className="text-yellow-200/80 text-sm">
                            A product with ASIN <span className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-white">{existingProduct.asin}</span> already exists.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Comparison Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                            <h4 className="font-bold text-gray-400 mb-4 flex items-center gap-2">
                                <Save className="w-4 h-4" /> Existing Product
                            </h4>
                            {existingProduct.image_url && (
                                <div className="h-32 mb-4 rounded bg-black flex items-center justify-center overflow-hidden">
                                    <img src={existingProduct.image_url} className="h-full object-contain" alt="Existing" />
                                </div>
                            )}
                        </div>
                        <div className="bg-purple-900/10 p-4 rounded-lg border border-purple-500/30">
                            <h4 className="font-bold text-purple-300 mb-4 flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" /> New / Edited Version
                            </h4>
                             {newProduct.image_url && (
                                <div className="h-32 mb-4 rounded bg-black flex items-center justify-center overflow-hidden">
                                    <img src={newProduct.image_url} className="h-full object-contain" alt="New" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1 bg-gray-900/30 p-4 rounded-lg border border-gray-800">
                         {renderField("Name", existingProduct.name, newProduct.name, true)}
                         {renderField("Price", formatCurrency(existingProduct.price), formatCurrency(newProduct.price), true)}
                         {renderField("Supplier", existingProduct.supplier_name, newProduct.supplier_name, true)}
                         {renderField("Master Item", existingProduct.master_item_name, newProduct.master_item_name, true)}
                         {/* Truncate description */}
                         {renderField("Description", 
                            existingProduct.description?.substring(0, 100) + (existingProduct.description?.length || 0 > 100 ? '...' : ''), 
                            newProduct.description?.substring(0, 100) + (newProduct.description?.length || 0 > 100 ? '...' : ''),
                            true
                         )}
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-900/50 border-t border-gray-800 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        Cancel & Keep Editing
                    </button>
                    
                    <button 
                        onClick={onDelete}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-white hover:bg-red-600 border border-red-900/50 hover:border-red-600 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isEditing ? "Delete Edited Product" : "Discard Draft"}
                    </button>

                    <button 
                        onClick={onMerge}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Merge (Overwrite Existing)
                    </button>
                </div>
            </div>
        </div>
    );
}



















