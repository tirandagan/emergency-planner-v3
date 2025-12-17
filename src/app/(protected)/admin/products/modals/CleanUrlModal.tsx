import React from 'react';
import { Sparkles, Link2, ArrowRight, X, Check } from 'lucide-react';

interface CleanUrlModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: (cleanUrl: string) => void;
    originalUrl: string;
    cleanUrl: string;
}

export default function CleanUrlModal({
    isOpen,
    onClose,
    onAccept,
    originalUrl,
    cleanUrl
}: CleanUrlModalProps) {
    if (!isOpen) return null;

    const handleAccept = () => {
        onAccept(cleanUrl);
        onClose();
    };

    const handleKeepOriginal = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-card border border-primary/50 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">

                {/* Header */}
                <div className="p-6 bg-primary/10 border-b border-primary/30 flex items-start gap-4">
                    <div className="p-3 bg-primary/20 rounded-full shrink-0">
                        <Sparkles className="w-6 h-6 text-primary" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-1">Clean Amazon URL?</h3>
                        <p className="text-muted-foreground text-sm">
                            We detected tracking parameters in your Amazon URL. Would you like to use the clean version?
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* URL Comparison */}
                <div className="p-6 space-y-4">
                    {/* Original URL */}
                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <Link2 className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
                            <span className="text-xs font-semibold text-muted-foreground uppercase">Original URL (with tracking)</span>
                        </div>
                        <div className="font-mono text-xs text-foreground break-all bg-background/50 p-3 rounded border border-border">
                            {originalUrl}
                        </div>
                        <div className="mt-2 text-xs text-warning flex items-center gap-1">
                            <span>Contains {(originalUrl.match(/[&?]/g) || []).length} tracking parameters</span>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <ArrowRight className="w-5 h-5 text-primary" strokeWidth={2.5} />
                        </div>
                    </div>

                    {/* Clean URL */}
                    <div className="bg-success/10 p-4 rounded-lg border border-success/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-success" strokeWidth={2.5} />
                            <span className="text-xs font-semibold text-success uppercase">Clean URL (recommended)</span>
                        </div>
                        <div className="font-mono text-xs text-foreground break-all bg-background/50 p-3 rounded border border-success/30">
                            {cleanUrl}
                        </div>
                        <div className="mt-2 text-xs text-success flex items-center gap-1">
                            <Check className="w-3 h-3" strokeWidth={2.5} />
                            <span>Removes all tracking, keeps product ID</span>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleKeepOriginal}
                        className="px-6 py-2.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
                    >
                        Keep Original
                    </button>
                    <button
                        type="button"
                        onClick={handleAccept}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        <Sparkles className="w-4 h-4" strokeWidth={2.5} />
                        Use Clean URL
                    </button>
                </div>

            </div>
        </div>
    );
}
