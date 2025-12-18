import { Check, X, RefreshCw, Unlink, Shield, Users, Clock, MapPin } from "lucide-react";
import { formatTagValue, TagValueDisplay } from "../page.client";

interface TagSelectorProps {
    label: string;
    options: string[];
    selected: string[] | null | undefined;
    onChange: (selected: string[] | null) => void;
    disabled?: boolean;
    notSetLabel?: string;
    inheritedValue?: string[] | null; // New prop for ghost tags
    icon?: any; // Icon component for the field
    field?: 'scenarios' | 'demographics' | 'timeframes' | 'locations'; // Field type for color coding
}

export default function TagSelector({ 
    label, 
    options, 
    selected, 
    onChange, 
    disabled, 
    notSetLabel = "Not Set",
    inheritedValue,
    icon: Icon,
    field
}: TagSelectorProps) {
    const isNull = selected === null || selected === undefined;
    const safeSelected = selected || [];

    // Determine which tags are active (either explicitly set, or inherited if null)
    const activeTags = isNull ? (inheritedValue || []) : safeSelected;
    
    // Determine field type from label if not provided
    const fieldType = field || (
        label.toLowerCase() === 'scenario' ? 'scenarios' :
        label.toLowerCase() === 'demographics' ? 'demographics' :
        label.toLowerCase() === 'timeframe' ? 'timeframes' :
        label.toLowerCase() === 'location' ? 'locations' : undefined
    );
    
    // Get icon based on field type if not provided
    const FieldIcon = Icon || (
        fieldType === 'scenarios' ? Shield :
        fieldType === 'demographics' ? Users :
        fieldType === 'timeframes' ? Clock :
        fieldType === 'locations' ? MapPin : null
    );
    
    // Get color classes matching Quick Tag style
    let badgeClassName = 'text-primary bg-primary/10 border-primary/20';
    if (fieldType === 'scenarios') badgeClassName = 'text-destructive bg-destructive/10 border-destructive/20';
    if (fieldType === 'demographics') badgeClassName = 'text-success bg-success/10 border-success/20';
    if (fieldType === 'timeframes') badgeClassName = 'text-primary bg-primary/10 border-primary/20';
    if (fieldType === 'locations') badgeClassName = 'text-amber-700 dark:text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/50';
    
    const formattedItems = options.map(item => formatTagValue(item, fieldType));
    const hasActiveItems = activeTags.length > 0;

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
            <div className="flex items-center justify-between text-xs mb-2 pr-4">
                <div className="flex items-center gap-2 text-muted-foreground font-medium uppercase tracking-wider">
                    {FieldIcon && <FieldIcon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={2.5} />}
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                    </label>
                </div>
                {!isNull ? (
                    <button
                        type="button"
                        onClick={handleResetToNull}
                        disabled={disabled}
                        className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors opacity-60 hover:opacity-100"
                        title="Reset to Master Item defaults"
                    >
                        <Unlink className="w-3 h-3" strokeWidth={2.5} />
                        Reset
                    </button>
                ) : (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 italic cursor-help" title="Inheriting from Master Item">
                        <Unlink className="w-3 h-3 opacity-30" strokeWidth={2.5} />
                        Inherited
                    </span>
                )}
            </div>
            <div className={`flex items-stretch overflow-hidden rounded-md border transition-all duration-200 pl-0 py-0 ${hasActiveItems ? badgeClassName : 'bg-muted text-muted-foreground border-border'}`}>
                {FieldIcon && (
                    <div className="px-2 bg-white/10 border-r border-white/10 flex items-center justify-center">
                        <FieldIcon className="w-3.5 h-3.5 opacity-70 shrink-0" strokeWidth={2.5} />
                    </div>
                )}
                <div className="px-2.5 py-1 flex items-center flex-wrap gap-0">
                    {options.map((option, i) => {
                        const isActive = activeTags.includes(option);
                        const formattedValue = formattedItems[i];
                        
                        return (
                            <span key={option} className="flex items-center">
                                {i > 0 && <span className="mx-1.5 w-px h-3 bg-current opacity-30" />}
                                <button
                                    type="button"
                                    onClick={() => toggleOption(option)}
                                    disabled={disabled}
                                    className={`text-[11px] font-medium tracking-wide uppercase transition-all rounded px-1.5 py-0.5 ${
                                        isActive 
                                            ? 'bg-white/20 hover:bg-white/30' 
                                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-400'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={isNull && isActive ? "Inherited from Master Item (Click to override)" : isActive ? "Click to deselect" : "Click to select"}
                                >
                                    <TagValueDisplay value={formattedValue} field={fieldType} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
