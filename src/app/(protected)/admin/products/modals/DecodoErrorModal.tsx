import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface DecodoErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

export default function DecodoErrorModal({ isOpen, onClose, message }: DecodoErrorModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#0f1117] border border-red-900/50 rounded-xl w-full max-w-md shadow-2xl flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
                <div className="p-6 flex items-start gap-4">
                    <div className="p-3 bg-red-900/20 rounded-full shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">Scraping Error</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
                    </div>
                </div>
                <div className="px-6 py-4 bg-red-950/10 border-t border-red-900/20 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}



















