import { X } from 'lucide-react';
import VariationsTable from './VariationsTable';
import { VariationConfig } from './VariationsModal';

interface VariationsTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: VariationConfig;
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    basePrice?: number;
    baseSku?: string;
    baseAsin?: string;
    basePackageSize?: number;
    baseRequiredQuantity?: number;
}

export default function VariationsTableModal({
    isOpen,
    onClose,
    config,
    values,
    onChange,
    basePrice,
    baseSku,
    baseAsin,
    basePackageSize,
    baseRequiredQuantity
}: VariationsTableModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 z-[70]">
            <div className="bg-card border border-border rounded-xl w-fit min-w-[600px] max-w-[95vw] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Variations Table</h3>
                        <p className="text-sm text-muted-foreground">Enter specific values for each variation combination.</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg">
                        <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-background">
                    <VariationsTable
                        config={config}
                        values={values}
                        onChange={onChange}
                        basePrice={basePrice}
                        baseSku={baseSku}
                        baseAsin={baseAsin}
                        basePackageSize={basePackageSize}
                        baseRequiredQuantity={baseRequiredQuantity}
                    />
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border bg-muted flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/20 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
