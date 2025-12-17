import React from 'react';
import { Sparkles, Globe, X, ExternalLink } from 'lucide-react';

interface FetchFromWebModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  url: string;
}

export default function FetchFromWebModal({
  isOpen,
  onClose,
  onConfirm,
  url,
}: FetchFromWebModalProps): JSX.Element | null {
  if (!isOpen) return null;

  const handleConfirm = (): void => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-card border border-primary/50 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-primary/10 border-b border-primary/30 flex items-start gap-4">
          <div className="p-3 bg-primary/20 rounded-full shrink-0">
            <Globe className="w-6 h-6 text-primary" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
              Web Product Detected
              <Sparkles className="w-5 h-5 text-warning" strokeWidth={2.5} />
            </h3>
            <p className="text-muted-foreground text-sm">
              Would you like to automatically fetch product details from this website?
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Detection Info */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Fetching via Product URL
                </div>
                <div className="font-mono text-sm text-foreground break-all bg-background/50 p-2 rounded border border-border">
                  {url}
                </div>
              </div>
            </div>
          </div>

          {/* What will be fetched */}
          <div className="bg-success/5 p-4 rounded-lg border border-success/20">
            <div className="text-sm font-semibold text-success mb-2">This will auto-fill:</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Product Name
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Price
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Image URL
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Description
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                SKU
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                Attributes
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground italic">
              You'll be able to review and accept/reject each suggestion individually.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            No Thanks
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2.5 rounded-lg font-medium shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            Yes, Fetch Data
          </button>
        </div>
      </div>
    </div>
  );
}
