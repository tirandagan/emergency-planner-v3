import { forwardRef } from 'react';

interface UnderlinedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const UnderlinedTextarea = forwardRef<HTMLTextAreaElement, UnderlinedTextareaProps>(
  ({ className = '', error = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`
          w-full bg-transparent border-b-2 px-1 py-1.5
          text-foreground outline-none transition-all resize-none
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

UnderlinedTextarea.displayName = 'UnderlinedTextarea';
