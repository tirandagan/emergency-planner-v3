'use client';

/**
 * FilterInput - Filter UI for different column data types
 * Supports text, date, number, and enum filtering
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface FilterInputProps {
  columnId: string;
  filterType: 'text' | 'date' | 'number' | 'enum';
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function FilterInput({
  filterType,
  value,
  onChange,
  onClear,
  placeholder,
}: FilterInputProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onClear();
  };

  // Render appropriate input based on filter type
  const renderInput = () => {
    switch (filterType) {
      case 'text':
        return (
          <Input
            type="text"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || 'Filter...'}
            className="h-8 text-sm"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || 'Filter number...'}
            className="h-8 text-sm"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            className="h-8 text-sm"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || 'Filter...'}
            className="h-8 text-sm"
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <div className="flex-1">{renderInput()}</div>
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 w-8 p-0"
          title="Clear filter"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
