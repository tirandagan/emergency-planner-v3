"use client";

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Control, Controller } from 'react-hook-form';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WizardFormData } from '@/types/wizard';
import type { FieldErrors } from 'react-hook-form';

export interface CompactPersonCardProps {
  index: number;
  control: Control<WizardFormData>;
  onRemove: () => void;
  canRemove: boolean;
  error?: FieldErrors<WizardFormData['familyMembers'][0]>;
}

const MEDICAL_CONDITION_PRESETS = [
  'Diabetes',
  'Asthma',
  'Heart Disease',
  'Allergies',
  'High Blood Pressure',
  'Arthritis',
];

const SPECIAL_NEEDS_PRESETS = [
  'Mobility Assistance',
  'Dietary Restrictions',
  'Infant Care',
  'Vision Impairment',
  'Hearing Impairment',
  'Wheelchair User',
];

const GENDER_OPTIONS = [
  { value: 'male' as const, label: 'M', emoji: '♂️' },
  { value: 'female' as const, label: 'F', emoji: '♀️' },
];

export function CompactPersonCard({
  index,
  control,
  onRemove,
  canRemove,
  error,
}: CompactPersonCardProps) {
  const [medicalInput, setMedicalInput] = useState('');
  const [needsInput, setNeedsInput] = useState('');

  return (
    <div className="relative p-4 pl-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      {/* Blue Circle Indicator */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground border-2 border-primary flex items-center justify-center font-semibold text-sm">
        {index + 1}
      </div>

      {/* Compact Header with Name */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
        {/* Name Field - Optional */}
        <div className="flex items-center gap-2 flex-1">
          <Controller
            name={`familyMembers.${index}.name`}
            control={control}
            render={({ field }) => (
              <Input
                type="text"
                {...field}
                value={field.value || ''}
                placeholder="Name (optional)"
                className="h-8 text-sm flex-1 max-w-[180px]"
                aria-label="Person name"
              />
            )}
          />
        </div>

        {/* Age - Compact */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 dark:text-slate-400 shrink-0">Age:</label>
          <Controller
            name={`familyMembers.${index}.age`}
            control={control}
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                max={120}
                {...field}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  field.onChange(isNaN(value) ? 0 : value);
                }}
                className={cn(
                  'h-8 w-16 text-center text-sm px-2',
                  error?.age && 'border-destructive'
                )}
                aria-label="Age"
              />
            )}
          />
        </div>

        {/* Gender - Compact */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 dark:text-slate-400 shrink-0">Gender:</label>
          <Controller
            name={`familyMembers.${index}.gender`}
            control={control}
            render={({ field }) => (
              <div className="flex gap-1.5">
                {GENDER_OPTIONS.map((option) => {
                  const isSelected = field.value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={cn(
                        'relative h-8 w-12 rounded border-2 transition-all text-base',
                        'hover:shadow-sm focus:outline-none focus:ring-1 focus:ring-primary',
                        'flex items-center justify-center',
                        isSelected
                          ? 'border-primary bg-primary/10 dark:bg-primary/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      )}
                      aria-pressed={isSelected}
                      aria-label={`${option.label === 'M' ? 'Male' : 'Female'}`}
                      title={option.label === 'M' ? 'Male' : 'Female'}
                    >
                      <span>{option.emoji}</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        {/* Remove Button - Compact */}
        <div className="ml-auto">
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label={`Remove person ${index + 1}`}
            >
              <Trash2 className="!w-3.5 !h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Medical & Needs - Side by Side Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Medical Conditions Section */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Medical Conditions
          </label>
          <Controller
            name={`familyMembers.${index}.medicalConditions`}
            control={control}
            render={({ field }) => {
              const currentChips = (field.value || '')
                .split(',')
                .map((c) => c.trim())
                .filter((c) => c.length > 0);

              const addChip = (chip: string) => {
                if (!chip.trim() || currentChips.includes(chip.trim())) return;
                const newChips = [...currentChips, chip.trim()];
                field.onChange(newChips.join(','));
                setMedicalInput('');
              };

              const removeChip = (chipToRemove: string) => {
                const newChips = currentChips.filter((c) => c !== chipToRemove);
                field.onChange(newChips.join(','));
              };

              const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (medicalInput.trim()) {
                    addChip(medicalInput);
                  }
                }
              };

              const availablePresets = MEDICAL_CONDITION_PRESETS.filter(
                (preset) => !currentChips.includes(preset)
              );

              return (
                <div className="space-y-2">
                  {/* Textarea with inline badges */}
                  <div className="relative">
                    {/* Display chips above textarea */}
                    {currentChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        {currentChips.map((chip) => (
                          <Badge
                            key={chip}
                            variant="secondary"
                            className="h-6 px-2 text-xs gap-1"
                          >
                            <span className="max-w-[120px] truncate" title={chip}>{chip}</span>
                            <button
                              type="button"
                              onClick={() => removeChip(chip)}
                              className="rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                              aria-label={`Remove ${chip}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Single-line Input */}
                    <Input
                      type="text"
                      value={medicalInput}
                      onChange={(e) => setMedicalInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type condition and press Enter..."
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Quick-add presets - Inline */}
                  {availablePresets.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {availablePresets.slice(0, 4).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => addChip(preset)}
                          className="text-[11px] px-2 py-0.5 border border-dashed border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-solid transition-all"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Special Needs Section */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Special Needs
          </label>
          <Controller
            name={`familyMembers.${index}.specialNeeds`}
            control={control}
            render={({ field }) => {
              const currentChips = (field.value || '')
                .split(',')
                .map((c) => c.trim())
                .filter((c) => c.length > 0);

              const addChip = (chip: string) => {
                if (!chip.trim() || currentChips.includes(chip.trim())) return;
                const newChips = [...currentChips, chip.trim()];
                field.onChange(newChips.join(','));
                setNeedsInput('');
              };

              const removeChip = (chipToRemove: string) => {
                const newChips = currentChips.filter((c) => c !== chipToRemove);
                field.onChange(newChips.join(','));
              };

              const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (needsInput.trim()) {
                    addChip(needsInput);
                  }
                }
              };

              const availablePresets = SPECIAL_NEEDS_PRESETS.filter(
                (preset) => !currentChips.includes(preset)
              );

              return (
                <div className="space-y-2">
                  {/* Textarea with inline badges */}
                  <div className="relative">
                    {/* Display chips above textarea */}
                    {currentChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        {currentChips.map((chip) => (
                          <Badge
                            key={chip}
                            variant="secondary"
                            className="h-6 px-2 text-xs gap-1"
                          >
                            <span className="max-w-[120px] truncate" title={chip}>{chip}</span>
                            <button
                              type="button"
                              onClick={() => removeChip(chip)}
                              className="rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                              aria-label={`Remove ${chip}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Single-line Input */}
                    <Input
                      type="text"
                      value={needsInput}
                      onChange={(e) => setNeedsInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type special need and press Enter..."
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Quick-add presets - Inline */}
                  {availablePresets.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {availablePresets.slice(0, 4).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => addChip(preset)}
                          className="text-[11px] px-2 py-0.5 border border-dashed border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-solid transition-all"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* Error messages */}
      {(error?.name || error?.age || error?.gender) && (
        <div className="mt-2 space-y-1">
          {error.name && (
            <p className="text-xs text-destructive" role="alert">
              {error.name.message}
            </p>
          )}
          {error.age && (
            <p className="text-xs text-destructive" role="alert">
              {error.age.message}
            </p>
          )}
          {error.gender && (
            <p className="text-xs text-destructive" role="alert">
              {error.gender.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
