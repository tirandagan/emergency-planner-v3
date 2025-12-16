import { Check, X, RefreshCw } from "lucide-react";

interface TagSelectorProps {
    label: string;
    options: string[];
    selected: string[] | null | undefined;
    onChange: (selected: string[] | null) => void;
    disabled?: boolean;
    notSetLabel?: string;
    inheritedValue?: string[] | null; // New prop for ghost tags
}

export default function TagSelector({ 
    label, 
    options, 
    selected, 
    onChange, 
    disabled, 
    notSetLabel = "Not Set",
    inheritedValue 
}: TagSelectorProps) {
    const isNull = selected === null || selected === undefined;
    const safeSelected = selected || [];

    // Determine which tags are active (either explicitly set, or inherited if null)
    const activeTags = isNull ? (inheritedValue || []) : safeSelected;

    const toggleOption = (option: string) => {
        if (disabled) return;
        if (isNull) {
            // Starting from inheritance:
            // If user clicks a tag, we initialize the array with that tag selected?
            // OR should we initialize with the inherited set +/- the clicked one?
            // "Break inheritance and start with..." logic.
            // Let's start with the inherited set but toggle the clicked one.
            const startingSet = inheritedValue || [];
            if (startingSet.includes(option)) {
                onChange(startingSet.filter(t => t !== option));
            } else {
                onChange([...startingSet, option]);
            }
        } else {
            if (safeSelected.includes(option)) {
                onChange(safeSelected.filter(item => item !== option));
            } else {
                onChange([...safeSelected, option]);
            }
        }
    };

    const handleResetToNull = () => {
        if (disabled) return;
        onChange(null);
    };

    const handleClear = () => {
        if (disabled) return;
        onChange([]);
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                    </label>
                    {/* Null State Indicator - Inline Badge Version */}
                    {isNull && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/20 border border-warning/40">
                            <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>
                            <span className="text-[10px] text-warning font-semibold">Inherited</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    {!isNull && safeSelected.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={disabled}
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            title="Clear Selection"
                        >
                            <X className="w-3 h-3" strokeWidth={2.5} /> Clear
                        </button>
                    )}
                    {!isNull && (
                        <button
                            type="button"
                            onClick={handleResetToNull}
                            disabled={disabled}
                            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                            title="Reset to 'Not Set' (Inherit)"
                        >
                            <RefreshCw className="w-3 h-3" strokeWidth={2.5} /> Reset
                        </button>
                    )}
                </div>
            </div>

            <div className={`flex flex-wrap gap-1`}>
                {options.map(option => {
                    const isActive = activeTags.includes(option);

                    // Style Logic
                    let bgClass = 'bg-muted border-border text-muted-foreground hover:border-border/80 hover:text-foreground';

                    if (isActive) {
                        if (isNull) {
                            // Ghost Tag (Inherited)
                            bgClass = 'bg-primary/20 border-primary/50 text-primary/80 shadow-sm opacity-80';
                        } else {
                            // Explicitly Selected
                            bgClass = 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20';
                        }
                    }

                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => toggleOption(option)}
                            disabled={disabled}
                            className={`
                                flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all
                                ${bgClass}
                                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            title={isNull && isActive ? "Inherited from Master Item (Click to override)" : ""}
                        >
                            {isActive && <Check className="w-3 h-3" strokeWidth={2.5} />}
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
