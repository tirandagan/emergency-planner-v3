import { useMemo, useState } from 'react';
import { VariationConfig } from './VariationsModal';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown, MoreHorizontal, Edit2, DollarSign, Hash } from "lucide-react";

interface VariationsTableProps {
    config: VariationConfig;
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    basePrice?: number;
    baseSku?: string;
    baseAsin?: string;
    basePackageSize?: number;
    baseRequiredQuantity?: number;
}

// Custom NumberInput Component
const CustomNumberInput = ({ 
    value, 
    onChange, 
    placeholder 
}: { 
    value: number | string; 
    onChange: (val: number) => void; 
    placeholder?: string;
}) => {
    const handleIncrement = () => {
        const current = typeof value === 'number' ? value : parseFloat(value as string) || 0;
        onChange(Number((current + 1).toFixed(2)));
    };

    const handleDecrement = () => {
        const current = typeof value === 'number' ? value : parseFloat(value as string) || 0;
        onChange(Number((current - 1).toFixed(2)));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '') {
            onChange(0);
            return;
        }
        const num = parseFloat(val);
        if (!isNaN(num)) onChange(num);
    };

    return (
        <div className="w-full group relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs z-10 pointer-events-none">$</div>
            <div className="border border-border rounded-lg h-9 overflow-hidden flex flex-row focus-within:ring-2 focus-within:ring-ring focus-within:border-primary transition-all bg-background">
                <input
                    type="number"
                    className="bg-transparent text-foreground font-medium pl-10 py-1 border-none outline-none focus:outline-none text-xs w-full h-full flex-1"
                    style={{
                        appearance: 'textfield',
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none'
                    } as any}
                    placeholder={placeholder}
                    value={value === 0 ? '' : value}
                    onChange={handleChange}
                />
                <div className="flex flex-col border-l border-border w-6">
                    <button
                        type="button"
                        onClick={handleIncrement}
                        className="flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer flex-1 border-b border-border"
                    >
                        <ChevronUp className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                    <button
                        type="button"
                        onClick={handleDecrement}
                        className="flex items-center justify-center bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer flex-1"
                    >
                        <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function VariationsTable({
    config,
    values,
    onChange,
    basePrice,
    baseSku,
    baseAsin,
    basePackageSize,
    baseRequiredQuantity
}: VariationsTableProps) {
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [batchActionOpen, setBatchActionOpen] = useState(false);
    const [activeBatchAction, setActiveBatchAction] = useState<'price' | 'package_size' | 'required_quantity' | null>(null);
    const [batchValue, setBatchValue] = useState("");

    const combinations = useMemo(() => {
        if (config.attributes.length === 0) return [];
        
        const attrs = config.attributes;
        
        if (attrs.length === 1) {
            return attrs[0].options.map(opt => ({
                key: JSON.stringify([opt]),
                labels: [opt]
            }));
        }
        
        if (attrs.length === 2) {
            const combos = [];
            for (const opt1 of attrs[0].options) {
                for (const opt2 of attrs[1].options) {
                    combos.push({
                        key: JSON.stringify([opt1, opt2]),
                        labels: [opt1, opt2]
                    });
                }
            }
            return combos;
        }
        
        return [];
    }, [config.attributes]);

    const handleValueChange = (key: string, field: string, value: any) => {
        const currentEntry = values[key] || {};
        const newEntry = { ...currentEntry, [field]: value };
        
        onChange({
            ...values,
            [key]: newEntry
        });
    };

    const toggleAll = () => {
        if (selectedKeys.size === combinations.length) {
            setSelectedKeys(new Set());
        } else {
            setSelectedKeys(new Set(combinations.map(c => c.key)));
        }
    };

    const toggleRow = (key: string) => {
        const next = new Set(selectedKeys);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setSelectedKeys(next);
    };

    const applyBatchUpdate = () => {
        if (!activeBatchAction || !batchValue) return;

        const updates = { ...values };
        const val = activeBatchAction === 'price' ? parseFloat(batchValue) : parseInt(batchValue);

        if (isNaN(val)) return;

        selectedKeys.forEach(key => {
            const current = updates[key] || {};
            updates[key] = { ...current, [activeBatchAction]: val };
        });

        onChange(updates);
        setActiveBatchAction(null);
        setBatchValue("");
        setBatchActionOpen(false);
        // Optional: Clear selection? Usually better to keep selection for multiple edits.
        // setSelectedKeys(new Set());
    };

    if (combinations.length === 0) return null;

    const allSelected = combinations.length > 0 && selectedKeys.size === combinations.length;
    const indeterminate = selectedKeys.size > 0 && !allSelected;

    return (
        <div className="flex flex-col gap-4">
            {/* Batch Actions Bar - Fixed Height Placeholder to prevent layout shift */}
            <div className="h-20 relative">
                {selectedKeys.size > 0 && (
                    <div className="absolute inset-0 flex items-center justify-between bg-primary/10 border border-primary/50 p-3 rounded-lg z-10">
                        <div className="flex items-center gap-3">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                            {selectedKeys.size}
                        </span>
                        <span className="text-sm text-primary font-medium">variants selected</span>
                    </div>

                    <div className="flex items-center gap-2 relative">
                        {activeBatchAction ? (
                            <div className="flex items-center gap-2 bg-muted rounded-lg border border-border p-1">
                                <span className="text-xs text-muted-foreground pl-2">
                                    New {activeBatchAction === 'price' ? 'Price' : 'Quantity'}:
                                </span>
                                <input
                                    type="number"
                                    value={batchValue}
                                    onChange={e => setBatchValue(e.target.value)}
                                    className="bg-transparent border-none text-foreground text-sm w-24 focus:ring-0 p-1"
                                    placeholder="0"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && applyBatchUpdate()}
                                />
                                <button
                                    onClick={applyBatchUpdate}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                                >
                                    Apply
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveBatchAction(null);
                                        setBatchValue("");
                                    }}
                                    className="text-muted-foreground hover:text-foreground p-1.5"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setBatchActionOpen(!batchActionOpen)}
                                    className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-border"
                                >
                                    <Edit2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                                    Batch Edit
                                    <ChevronDown className="w-3.5 h-3.5 opacity-50" strokeWidth={2.5} />
                                </button>

                                {batchActionOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                                        {config.toggles.price && (
                                            <button
                                                onClick={() => {
                                                    setActiveBatchAction('price');
                                                    setBatchActionOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <DollarSign className="w-3.5 h-3.5" strokeWidth={2.5} /> Update Price
                                            </button>
                                        )}
                                        {config.toggles.package_size && (
                                            <button
                                                onClick={() => {
                                                    setActiveBatchAction('package_size');
                                                    setBatchActionOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <Hash className="w-3.5 h-3.5" strokeWidth={2.5} /> Update Package Size
                                            </button>
                                        )}
                                        {config.toggles.required_quantity && (
                                            <button
                                                onClick={() => {
                                                    setActiveBatchAction('required_quantity');
                                                    setBatchActionOpen(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <Hash className="w-3.5 h-3.5" strokeWidth={2.5} /> Update Required Quantity
                                            </button>
                                        )}
                                        {(!config.toggles.price && !config.toggles.package_size && !config.toggles.required_quantity) && (
                                            <div className="px-4 py-2 text-xs text-muted-foreground">No editable fields enabled</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <Checkbox
                                    checked={allSelected ? true : (indeterminate ? "indeterminate" : false)}
                                    onClick={toggleAll}
                                    readOnly
                                    className="bg-muted border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
                                />
                            </th>
                            {config.attributes.map(attr => (
                                <th key={attr.id} className="px-4 py-3">{attr.name}</th>
                            ))}
                            {config.toggles.sku && <th className="px-4 py-3">SKU</th>}
                            {config.toggles.asin && <th className="px-4 py-3">ASIN</th>}
                            {config.toggles.price && <th className="px-4 py-3 w-36">Price</th>}
                            {config.toggles.package_size && <th className="px-4 py-3 w-24">Pkg Size</th>}
                            {config.toggles.required_quantity && <th className="px-4 py-3 w-24">Req Qty</th>}
                            {config.toggles.processing && <th className="px-4 py-3">Processing Profile</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {combinations.map((combo) => {
                            const entry = values[combo.key] || {};
                            const isSelected = selectedKeys.has(combo.key);
                            return (
                                <tr key={combo.key} className={`transition-colors ${isSelected ? 'bg-primary/10 hover:bg-primary/20' : 'bg-muted/20 hover:bg-muted/50'}`}>
                                    <td className="px-4 py-3">
                                        <Checkbox
                                            checked={isSelected}
                                            onClick={() => toggleRow(combo.key)}
                                            readOnly
                                            className="bg-muted border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
                                        />
                                    </td>
                                    {combo.labels.map((label, idx) => (
                                        <td key={idx} className="px-4 py-3 text-foreground">{label}</td>
                                    ))}
                                    
                                    {config.toggles.sku && (
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={entry.sku || ''}
                                                onChange={e => handleValueChange(combo.key, 'sku', e.target.value)}
                                                placeholder={baseSku ? `${baseSku}-${combo.labels.join('-')}` : ''}
                                                className="w-full bg-background border border-input rounded px-2 py-1.5 text-xs text-foreground focus:border-primary outline-none"
                                            />
                                        </td>
                                    )}

                                    {config.toggles.asin && (
                                        <td className="px-4 py-2">
                                            <input
                                                type="text"
                                                value={entry.asin || ''}
                                                onChange={e => {
                                                    const sanitized = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                                                    handleValueChange(combo.key, 'asin', sanitized);
                                                }}
                                                placeholder={baseAsin || ''}
                                                maxLength={10}
                                                className="w-full bg-background border border-input rounded px-2 py-1.5 text-xs text-foreground focus:border-primary outline-none uppercase"
                                            />
                                        </td>
                                    )}

                                    {config.toggles.price && (
                                        <td className="px-4 py-2">
                                            <CustomNumberInput
                                                value={entry.price !== undefined ? entry.price : (basePrice || '')}
                                                onChange={(val) => handleValueChange(combo.key, 'price', val)}
                                                placeholder={basePrice ? String(basePrice) : '0.00'}
                                            />
                                        </td>
                                    )}

                                    {config.toggles.package_size && (
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={entry.package_size !== undefined ? entry.package_size : (basePackageSize || 1)}
                                                onChange={e => handleValueChange(combo.key, 'package_size', parseInt(e.target.value))}
                                                placeholder={basePackageSize ? String(basePackageSize) : '1'}
                                                min="1"
                                                className="w-full bg-background border border-input rounded px-2 py-1.5 text-xs text-foreground focus:border-primary outline-none"
                                            />
                                        </td>
                                    )}

                                    {config.toggles.required_quantity && (
                                        <td className="px-4 py-2">
                                            <input
                                                type="number"
                                                value={entry.required_quantity !== undefined ? entry.required_quantity : (baseRequiredQuantity || 1)}
                                                onChange={e => handleValueChange(combo.key, 'required_quantity', parseInt(e.target.value))}
                                                placeholder={baseRequiredQuantity ? String(baseRequiredQuantity) : '1'}
                                                min="1"
                                                className="w-full bg-background border border-input rounded px-2 py-1.5 text-xs text-foreground focus:border-primary outline-none"
                                            />
                                        </td>
                                    )}

                                    {config.toggles.processing && (
                                        <td className="px-4 py-2">
                                            <select
                                                value={entry.processing_profile || ''}
                                                onChange={e => handleValueChange(combo.key, 'processing_profile', e.target.value)}
                                                className="w-full bg-background border border-input rounded px-2 py-1.5 text-xs text-foreground focus:border-primary outline-none appearance-none"
                                            >
                                                <option value="">Default Profile</option>
                                                <option value="1-3_days">1-3 Days</option>
                                                <option value="3-5_days">3-5 Days</option>
                                                <option value="1-2_weeks">1-2 Weeks</option>
                                            </select>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
