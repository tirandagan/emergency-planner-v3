import { Shield, Users, Clock, MapPin } from "lucide-react";
import { formatTagValue } from "@/lib/products-utils";
import { TagValueDisplay } from "../page.client";

interface TagSelectorProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    disabled?: boolean;
    icon?: any; // Icon component for the field
    field?: 'scenarios' | 'demographics' | 'timeframes' | 'locations'; // Field type for color coding
}

export default function TagSelector({
    label,
    options,
    selected,
    onChange,
    disabled,
    icon: Icon,
    field
}: TagSelectorProps) {
    // Tags are always explicit arrays (no inheritance)
    const activeTags = selected;
    
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
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs mb-2 pr-4">
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {label}
                </label>
            </div>
            <div className={`flex items-stretch overflow-hidden rounded-md border transition-all duration-200 pl-0 py-0 ${hasActiveItems ? badgeClassName : 'bg-muted text-muted-foreground border-border'}`}>
                {FieldIcon && (
                    <div className="px-2 border-r border-white/10 flex items-center justify-center">
                        <FieldIcon className={`w-3.5 h-3.5 shrink-0 transition-opacity ${hasActiveItems ? 'opacity-70' : 'opacity-40'}`} strokeWidth={2.5} />
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
                                    className={`text-[11px] font-medium tracking-wide uppercase transition-all px-1.5 py-0.5 ${
                                        isActive
                                            ? 'bg-transparent hover:bg-white/10 rounded'
                                            : 'bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 text-gray-300 dark:text-gray-200'
                                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    title={option + (isActive ? " (Click to deselect)" : " (Click to select)")}
                                >
                                    <TagValueDisplay value={formattedValue} field={fieldType} title={option} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
