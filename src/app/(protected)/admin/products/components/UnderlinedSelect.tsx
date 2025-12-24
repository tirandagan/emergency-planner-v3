import { forwardRef } from 'react';

interface UnderlinedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const UnderlinedSelect = forwardRef<HTMLSelectElement, UnderlinedSelectProps>(
  ({ className = '', error = false, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`
          w-full bg-transparent border-b-2 px-1 py-1.5
          text-foreground outline-none transition-all
          ${error
            ? 'border-destructive focus:border-destructive'
            : 'border-border focus:border-primary'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </select>
    );
  }
);

UnderlinedSelect.displayName = 'UnderlinedSelect';
