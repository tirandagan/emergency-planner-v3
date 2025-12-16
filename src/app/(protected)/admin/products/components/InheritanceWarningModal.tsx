import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface InheritanceWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    changedFields: {
        label: string;
        masterValue: string[] | null;
        newValue: string[] | null;
    }[];
}

export default function InheritanceWarningModal({ isOpen, onClose, onConfirm, changedFields }: InheritanceWarningModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-card border border-warning/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-warning/10 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-warning" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground">Break Inheritance?</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                You are customizing tags that were previously inheriting from the Master Item.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" strokeWidth={2.5} /></button>
                </div>

                <div className="space-y-4 bg-background/50 p-4 rounded-xl border border-border mb-6">
                    <p className="text-sm text-foreground mb-2">
                        These fields will no longer update automatically if the Master Item changes:
                    </p>
                    <div className="space-y-3">
                        {changedFields.map((field, idx) => (
                            <div key={idx} className="text-sm">
                                <div className="font-medium text-muted-foreground uppercase text-xs mb-1">{field.label}</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted p-2 rounded border border-border opacity-60">
                                        <div className="text-[10px] text-muted-foreground mb-1">Master Item (Old)</div>
                                        <div className="flex flex-wrap gap-1">
                                            {(!field.masterValue || field.masterValue.length === 0)
                                                ? <span className="text-muted-foreground italic">None</span>
                                                : field.masterValue.map(t => <span key={t} className="bg-muted px-1.5 py-0.5 rounded text-muted-foreground text-xs">{t}</span>)
                                            }
                                        </div>
                                    </div>
                                    <div className="bg-muted p-2 rounded border border-warning/30">
                                        <div className="text-[10px] text-warning mb-1">Product (New)</div>
                                        <div className="flex flex-wrap gap-1">
                                            {(!field.newValue || field.newValue.length === 0)
                                                ? <span className="text-muted-foreground italic">Empty</span>
                                                : field.newValue.map(t => <span key={t} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs border border-primary/20">{t}</span>)
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-warning hover:bg-warning/90 text-warning-foreground rounded font-bold transition-colors shadow-lg shadow-warning/20"
                    >
                        Confirm & Break Link
                    </button>
                </div>
            </div>
        </div>
    );
}



















