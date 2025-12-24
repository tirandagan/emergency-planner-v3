import { forwardRef } from 'react';

interface UnderlinedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const UnderlinedInput = forwardRef<HTMLInputElement, UnderlinedInputProps>(
  ({ className = '', error = false, ...props }, ref) => {
    return (
      <input
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
      />
    );
  }
);

UnderlinedInput.displayName = 'UnderlinedInput';
