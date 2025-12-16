
const MultiSelectPills = ({ options, selected, onChange, label }: { options: string[], selected: string[], onChange: (val: string[]) => void, label: string }) => {
    const toggle = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(s => s !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    return (
        <div>
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase">{label}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => (
                    <button
                        key={opt}
                        onClick={() => toggle(opt)}
                        className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                            selected.includes(opt)
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                            : 'bg-muted border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                        }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MultiSelectPills;
