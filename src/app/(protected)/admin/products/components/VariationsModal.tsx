import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowLeft, Check, Edit2, GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// Types
export interface VariationAttribute {
    id: string;
    name: string;
    options: string[];
}

export interface VariationConfig {
    attributes: VariationAttribute[];
    toggles: {
        price: boolean;
        sku: boolean;
        asin: boolean;
        package_size: boolean;
        required_quantity: boolean;
        processing: boolean;
    };
}

interface VariationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (config: VariationConfig) => void;
    initialConfig?: VariationConfig | null;
}

const STANDARD_VARIATIONS = [
    "Primary color",
    "Secondary color",
    "Image size",
    "Depth",
    "Overall length",
    "Overall width",
    "Height",
    "Material",
    "Pattern",
    "Style"
];

export default function VariationsModal({
    isOpen,
    onClose,
    onSave,
    initialConfig
}: VariationsModalProps) {
    const [step, setStep] = useState<'list' | 'type_select' | 'options_input'>('list');
    
    // Draft State
    const [attributes, setAttributes] = useState<VariationAttribute[]>([]);
    const [toggles, setToggles] = useState({
        price: false,
        sku: false,
        asin: false,
        package_size: false,
        required_quantity: false,
        processing: false
    });

    // Editing State
    const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null);
    const [currentAttributeName, setCurrentAttributeName] = useState("");
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);
    const [optionInput, setOptionInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (initialConfig) {
                setAttributes(initialConfig.attributes || []);
                setToggles(initialConfig.toggles || { price: false, sku: false, asin: false, package_size: false, required_quantity: false, processing: false });
                setStep('list');
            } else {
                setAttributes([]);
                setToggles({ price: false, sku: false, asin: false, package_size: false, required_quantity: false, processing: false });
                setStep('type_select');
            }
        }
    }, [isOpen, initialConfig]);

    const handleSave = () => {
        onSave({ attributes, toggles });
        onClose();
    };

    const startAddingVariation = () => {
        if (attributes.length >= 2) return;
        setEditingAttributeId(null);
        setCurrentAttributeName("");
        setCurrentOptions([]);
        setOptionInput("");
        setStep('type_select');
    };

    const selectType = (type: string) => {
        setCurrentAttributeName(type);
        setStep('options_input');
    };

    const handleAddOption = () => {
        if (!optionInput.trim()) return;
        if (currentOptions.includes(optionInput.trim())) return;
        setCurrentOptions([...currentOptions, optionInput.trim()]);
        setOptionInput("");
    };

    const removeOption = (opt: string) => {
        setCurrentOptions(currentOptions.filter(o => o !== opt));
    };

    const saveAttribute = () => {
        if (!currentAttributeName || currentOptions.length === 0) return;

        if (editingAttributeId) {
            setAttributes(prev => prev.map(attr => 
                attr.id === editingAttributeId 
                    ? { ...attr, name: currentAttributeName, options: currentOptions }
                    : attr
            ));
        } else {
            setAttributes(prev => [...prev, {
                id: crypto.randomUUID(),
                name: currentAttributeName,
                options: currentOptions
            }]);
        }
        
        setEditingAttributeId(null);
        setStep('list');
    };

    const editAttribute = (attr: VariationAttribute) => {
        setEditingAttributeId(attr.id);
        setCurrentAttributeName(attr.name);
        setCurrentOptions(attr.options);
        setOptionInput("");
        setStep('options_input');
    };

    const deleteAttribute = (id: string) => {
        setAttributes(prev => prev.filter(a => a.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-card border border-border rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted">
                    <h3 className="text-lg font-bold text-foreground">
                        {step === 'type_select' && "What type of variation is it?"}
                        {step === 'options_input' && (editingAttributeId ? "Edit options" : currentAttributeName)}
                        {step === 'list' && "Manage variations"}
                    </h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    
                    {/* STEP 1: TYPE SELECTION */}
                    {step === 'type_select' && (
                        <div className="space-y-6">
                            <p className="text-muted-foreground text-sm">
                                You can add up to 2 variations. Use the variation types listed here for peak discoverability.
                            </p>

                            <div className="flex flex-wrap gap-3">
                                {STANDARD_VARIATIONS.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => selectType(type)}
                                        className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-full text-sm text-foreground transition-colors"
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-border pt-4">
                                <button
                                    onClick={() => {
                                        setCurrentAttributeName("");
                                        setStep('options_input');
                                    }}
                                    className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                                >
                                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                                    Create your own
                                </button>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={onClose} className="text-muted-foreground hover:text-foreground px-4 py-2">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: OPTIONS INPUT */}
                    {step === 'options_input' && (
                        <div className="space-y-6">
                            {/* Name Input (if custom or editing) */}
                            {!STANDARD_VARIATIONS.includes(currentAttributeName) && (
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Variation Name</label>
                                    <input
                                        type="text"
                                        value={currentAttributeName}
                                        onChange={e => setCurrentAttributeName(e.target.value)}
                                        className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-ring outline-none"
                                        placeholder="e.g. Fabric Type"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Options</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={optionInput}
                                        onChange={e => setOptionInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddOption()}
                                        className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-ring outline-none"
                                        placeholder="Enter an option..."
                                    />
                                    <button
                                        onClick={handleAddOption}
                                        disabled={!optionInput.trim()}
                                        className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>

                                {/* Options List */}
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {currentOptions.map((opt, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-lg border border-border/50">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" strokeWidth={2.5} />
                                                <span className="text-foreground">{opt}</span>
                                            </div>
                                            <button onClick={() => removeOption(opt)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    ))}
                                    {currentOptions.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                                            No options added yet
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between pt-4 border-t border-border">
                                <button
                                    onClick={() => {
                                        // If we were adding a new one, go back to type select. If editing, go back to list.
                                        if (editingAttributeId || attributes.length > 0) setStep('list');
                                        else setStep('type_select');
                                    }}
                                    className="text-muted-foreground hover:text-foreground px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveAttribute}
                                    disabled={!currentAttributeName || currentOptions.length === 0}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-primary/20"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: OVERVIEW / TOGGLES */}
                    {step === 'list' && (
                        <div className="space-y-8">
                            {/* Attributes List */}
                            <div className="space-y-3">
                                {attributes.map((attr) => (
                                    <div key={attr.id} className="bg-muted border border-border rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-foreground">{attr.name}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">{attr.options.length} options</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {attr.options.slice(0, 5).map(o => (
                                                    <span key={o} className="px-2 py-0.5 bg-background rounded text-xs text-foreground border border-border">{o}</span>
                                                ))}
                                                {attr.options.length > 5 && <span className="text-xs text-muted-foreground">+{attr.options.length - 5} more</span>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => editAttribute(attr)} className="p-2 bg-muted rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-foreground">
                                                <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                                            </button>
                                            <button onClick={() => deleteAttribute(attr.id)} className="p-2 bg-muted rounded-lg hover:bg-muted/80 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {attributes.length < 2 && (
                                    <button
                                        onClick={startAddingVariation}
                                        className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-border/80 hover:text-foreground flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                                        Add another variation
                                    </button>
                                )}
                            </div>

                            {/* Toggles */}
                            <div className="space-y-4 pt-4 border-t border-border">
                                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Configuration</h4>

                                <div className="space-y-3">
                                    {[
                                        { id: 'price', label: 'Prices vary' },
                                        { id: 'processing', label: 'Processing profiles vary' },
                                        { id: 'package_size', label: 'Package sizes vary' },
                                        { id: 'required_quantity', label: 'Required quantities vary' },
                                        { id: 'sku', label: 'SKUs vary' },
                                        { id: 'asin', label: 'ASINs vary' }
                                    ].map(toggle => (
                                        <div key={toggle.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                                            <Switch
                                                isSelected={toggles[toggle.id as keyof typeof toggles]}
                                                onChange={(isSelected) => setToggles(prev => ({ ...prev, [toggle.id]: isSelected }))}
                                                className="text-base"
                                            >
                                                <span className="text-foreground">{toggle.label}</span>
                                            </Switch>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between pt-6 border-t border-border">
                                <button onClick={onClose} className="text-muted-foreground hover:text-foreground px-4 py-2">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 rounded-lg font-medium shadow-lg shadow-primary/20"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
