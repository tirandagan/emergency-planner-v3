import React from 'react';
import { AlertCircle, X, CheckCircle } from 'lucide-react';

interface ProductErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

function parseErrorMessage(message: string): { main: string; suggestions: string[] } {
    // Extract the main error message (before any colon or first sentence)
    const mainMatch = message.match(/^([^:]+)/);
    const main = mainMatch ? mainMatch[1].trim() : message;

    // Common error patterns and their suggestions
    const suggestions: string[] = [];

    if (message.toLowerCase().includes('master item')) {
        suggestions.push('Select a category from the dropdown');
        suggestions.push('Choose a subcategory if available');
        suggestions.push('Select a master item (product type)');
    }

    if (message.toLowerCase().includes('required') || message.toLowerCase().includes('null')) {
        suggestions.push('Check that all required fields (marked with *) are filled');
        suggestions.push('Verify that no fields have invalid or empty values');
    }

    if (message.toLowerCase().includes('asin') || message.toLowerCase().includes('duplicate')) {
        suggestions.push('Check if a product with this ASIN already exists');
        suggestions.push('Try using a different ASIN or update the existing product');
    }

    if (message.toLowerCase().includes('foreign key') || message.toLowerCase().includes('invalid')) {
        suggestions.push('Refresh the page to reload the latest data');
        suggestions.push('Ensure all dropdowns have valid selections');
    }

    if (message.toLowerCase().includes('database')) {
        suggestions.push('Try again in a few moments');
        suggestions.push('If the issue persists, contact support');
    }

    return { main, suggestions };
}

export default function ProductErrorModal({ isOpen, onClose, message }: ProductErrorModalProps) {
    if (!isOpen) return null;

    const { main, suggestions } = parseErrorMessage(message);

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#0f1117] border border-red-900/50 rounded-xl w-full max-w-lg shadow-2xl flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
                {/* Header */}
                <div className="p-6 flex items-start gap-4">
                    <div className="p-3 bg-red-900/20 rounded-full shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white mb-2">Unable to Save Product</h3>
                        <p className="text-gray-300 text-sm leading-relaxed break-words">{main}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className="px-6 pb-6">
                        <div className="bg-blue-950/30 border border-blue-900/50 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                How to fix this:
                            </h4>
                            <ul className="space-y-2">
                                {suggestions.map((suggestion, index) => (
                                    <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                        <span className="text-blue-400 shrink-0 mt-0.5">•</span>
                                        <span>{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 bg-red-950/10 border-t border-red-900/20 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
