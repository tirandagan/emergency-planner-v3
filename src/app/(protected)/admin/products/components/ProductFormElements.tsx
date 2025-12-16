import React from "react";

export const SectionTitle = ({ children, icon: Icon, className }: { children: React.ReactNode, icon?: any, className?: string }) => (
    <h3 className={`text-sm font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2 mt-2 ${className || ''}`}>
        {Icon && <Icon className="w-4 h-4 text-primary" strokeWidth={2.5} />}
        {children}
    </h3>
);

export const InputGroup = ({ label, required = false, action, children }: { label: string, required?: boolean, action?: React.ReactNode, children: React.ReactNode }) => (
    <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label} {required && <span className="text-destructive">*</span>}
            </label>
            {action}
        </div>
        {children}
    </div>
);

export const TextInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className={`w-full bg-background border border-input rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all text-sm ${props.className || ''}`} />
);

export const SelectInput = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <select {...props} className={`w-full bg-background border border-input rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all text-sm appearance-none ${props.className || ''}`} />
);

export const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea {...props} className={`w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-all text-sm min-h-[120px] resize-y ${props.className || ''}`} />
);

