'use client';

/**
 * EmailChipInput Component
 * Multi-email input with chip visualization and validation
 */

import React, { useState, useRef, KeyboardEvent } from 'react';
import { X, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EmailChipInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  maxEmails?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function EmailChipInput({
  emails,
  onChange,
  maxEmails,
  disabled = false,
  placeholder = 'Enter email addresses...',
  className,
}: EmailChipInputProps): React.JSX.Element {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = (email: string): void => {
    const trimmedEmail = email.trim().toLowerCase();

    // Clear any previous errors
    setError(null);

    // Validate email format
    if (!trimmedEmail) {
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(`"${trimmedEmail}" is not a valid email address`);
      return;
    }

    // Check for duplicates
    if (emails.includes(trimmedEmail)) {
      setError(`"${trimmedEmail}" is already added`);
      return;
    }

    // Check max limit
    if (maxEmails && emails.length >= maxEmails) {
      setError(`Maximum ${maxEmails} emails allowed`);
      return;
    }

    // Add email
    onChange([...emails, trimmedEmail]);
    setInputValue('');
  };

  const removeEmail = (emailToRemove: string): void => {
    onChange(emails.filter((email) => email !== emailToRemove));
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      // Remove last email on backspace if input is empty
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // Split by common delimiters
    const emailList = pastedText
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    // Add each email
    for (const email of emailList) {
      if (maxEmails && emails.length >= maxEmails) {
        setError(`Maximum ${maxEmails} emails allowed`);
        break;
      }

      const trimmedEmail = email.toLowerCase();
      if (isValidEmail(trimmedEmail) && !emails.includes(trimmedEmail)) {
        onChange([...emails, trimmedEmail]);
      }
    }

    setInputValue('');
  };

  const handleContainerClick = (): void => {
    inputRef.current?.focus();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Email chips container */}
      <div
        className={cn(
          'flex min-h-[42px] w-full flex-wrap gap-2 rounded-md border border-input bg-background px-3 py-2',
          'ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          error && 'border-destructive'
        )}
        onClick={handleContainerClick}
      >
        {/* Email chips */}
        {emails.map((email) => (
          <Badge
            key={email}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            <Mail className="h-3 w-3" />
            <span className="text-xs">{email}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(email);
                }}
                className="ml-1 rounded-full hover:bg-background/80"
                aria-label={`Remove ${email}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {/* Input field */}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            if (inputValue.trim()) {
              addEmail(inputValue);
            }
          }}
          disabled={disabled || (maxEmails !== undefined && emails.length >= maxEmails)}
          placeholder={emails.length === 0 ? placeholder : ''}
          className={cn(
            'flex-1 border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
            'min-w-[120px]'
          )}
        />
      </div>

      {/* Help text and error */}
      <div className="flex items-center justify-between text-xs">
        <p className="text-muted-foreground">
          {maxEmails
            ? `${emails.length}/${maxEmails} emails • Press Enter, Space, or Comma to add`
            : 'Press Enter, Space, or Comma to add emails'}
        </p>

        {error && <p className="text-destructive">{error}</p>}
      </div>
    </div>
  );
}
