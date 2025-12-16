import React from 'react';
import { Search, X, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchResults: any[];
    onSelect: (product: any) => void;
    searchTerm?: string;
}

export default function ProductSearchModal({ isOpen, onClose, searchResults, onSelect, searchTerm }: ProductSearchModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#0f1117] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[80vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#13161c]">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Search className="w-5 h-5 text-purple-500" />
                            Select Product to Import
                        </h2>
                        <p className="text-gray-500 text-sm">Found {searchResults.length} matches for "{searchTerm}"</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid gap-4">
                        {searchResults.map((result, idx) => (
                            <div key={idx} className="flex gap-4 p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-purple-500/50 hover:bg-gray-900 transition-colors group">
                                <div className="w-24 h-24 bg-white rounded-lg p-2 shrink-0 flex items-center justify-center">
                                    {result.image_url ? (
                                        <img src={result.image_url} alt="" className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-medium text-sm line-clamp-2 mb-2">{result.name}</h3>
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
                                        {result.asin && <span className="bg-gray-800 px-2 py-1 rounded">ASIN: {result.asin}</span>}
                                        {result.rating && <span className="flex items-center gap-1 text-yellow-400"><Sparkles className="w-3 h-3" /> {result.rating} ({result.reviews})</span>}
                                    </div>
                                    <div className="text-gray-500 text-xs line-clamp-2">{result.description}</div>
                                </div>
                                <div className="flex flex-col items-end justify-between shrink-0 gap-4">
                                    <div className="text-xl font-bold text-white font-mono">
                                        {result.price ? `$${result.price.toFixed(2)}` : <span className="text-gray-600 text-sm">N/A</span>}
                                    </div>
                                    <button 
                                        onClick={() => onSelect(result)}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-purple-900/20 whitespace-nowrap"
                                    >
                                        Select This
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
