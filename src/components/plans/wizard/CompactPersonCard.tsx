"use client";

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FamilyMember } from '@/types/wizard';
import type { FieldErrors } from 'react-hook-form';

export interface CompactPersonCardProps {
  index: number;
  value: FamilyMember;
  onChange: (field: keyof FamilyMember, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
  error?: FieldErrors<FamilyMember>;
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
  { value: 'male' as const, label: 'Male', emoji: '♂️' },
  { value: 'female' as const, label: 'Female', emoji: '♀️' },
];

export function CompactPersonCard({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
  error,
}: CompactPersonCardProps) {
  const medicalChips = (value.medicalConditions || '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const specialNeedsChips = (value.specialNeeds || '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const addChip = (field: 'medicalConditions' | 'specialNeeds', chip: string) => {
    const currentChips = field === 'medicalConditions' ? medicalChips : specialNeedsChips;
    if (currentChips.includes(chip)) return;
    const newChips = [...currentChips, chip];
    onChange(field, newChips.join(','));
  };

  const removeChip = (field: 'medicalConditions' | 'specialNeeds', chipToRemove: string) => {
    const currentChips = field === 'medicalConditions' ? medicalChips : specialNeedsChips;
    const newChips = currentChips.filter((c) => c !== chipToRemove);
    onChange(field, newChips.join(','));
  };

  const availableMedicalPresets = MEDICAL_CONDITION_PRESETS.filter(
    (preset) => !medicalChips.includes(preset)
  );
  const availableNeedsPresets = SPECIAL_NEEDS_PRESETS.filter(
    (preset) => !specialNeedsChips.includes(preset)
  );

  return (
    <div className="group relative p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/50 dark:hover:border-primary/60 transition-colors">
      {/* Header - Person # and Remove button */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Person {index + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label={`Remove person ${index + 1}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 4-column grid layout with labels BELOW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Age Section - VERTICAL with label below */}
        <div className="flex flex-col gap-2">
          <Input
            type="number"
            min={0}
            max={120}
            value={value.age}
            onChange={(e) => {
              const newValue = parseInt(e.target.value, 10);
              if (!isNaN(newValue)) {
                onChange('age', newValue);
              }
            }}
            className={cn(
              'h-10 text-center text-base font-semibold',
              error?.age && 'border-destructive focus-visible:ring-destructive'
            )}
            aria-label="Age"
          />
          <span className="text-xs text-center font-medium text-slate-600 dark:text-slate-400">
            Age
          </span>
        </div>

        {/* Gender Section - VERTICAL with label below, 2 emoji buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((option) => {
              const isSelected = value.gender === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange('gender', option.value)}
                  className={cn(
                    'relative flex-1 h-10 rounded-lg border-2 text-xl transition-all',
                    'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isSelected
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                  )}
                  aria-pressed={isSelected}
                  aria-label={option.label}
                >
                  {option.emoji}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center pointer-events-none">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-xs text-center font-medium text-slate-600 dark:text-slate-400">
            Gender
          </span>
        </div>

        {/* Medical Section - VERTICAL with label below */}
        <div className="flex flex-col gap-2">
          <div className="h-10 flex items-center gap-1 flex-wrap overflow-y-auto p-1 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
            {medicalChips.map((chip) => (
              <Badge
                key={chip}
                variant="secondary"
                className="h-5 text-xs gap-1"
              >
                <span className="max-w-[80px] truncate" title={chip}>
                  {chip}
                </span>
                <button
                  type="button"
                  onClick={() => removeChip('medicalConditions', chip)}
                  className="rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  aria-label={`Remove ${chip}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <span className="text-xs text-center font-medium text-slate-600 dark:text-slate-400">
            Medical
          </span>
        </div>

        {/* Needs Section - VERTICAL with label below */}
        <div className="flex flex-col gap-2">
          <div className="h-10 flex items-center gap-1 flex-wrap overflow-y-auto p-1 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
            {specialNeedsChips.map((chip) => (
              <Badge
                key={chip}
                variant="secondary"
                className="h-5 text-xs gap-1"
              >
                <span className="max-w-[80px] truncate" title={chip}>
                  {chip}
                </span>
                <button
                  type="button"
                  onClick={() => removeChip('specialNeeds', chip)}
                  className="rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  aria-label={`Remove ${chip}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <span className="text-xs text-center font-medium text-slate-600 dark:text-slate-400">
            Needs
          </span>
        </div>
      </div>

      {/* Quick-add presets below the main grid */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* Medical presets */}
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-500 w-full mb-1">Quick add:</span>
          {availableMedicalPresets.slice(0, 3).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addChip('medicalConditions', preset)}
              className="text-xs px-2 py-1 border border-dashed border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              + {preset}
            </button>
          ))}
        </div>
        {/* Needs presets */}
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-500 w-full mb-1">Quick add:</span>
          {availableNeedsPresets.slice(0, 3).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addChip('specialNeeds', preset)}
              className="text-xs px-2 py-1 border border-dashed border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Error messages */}
      {error && (
        <div className="mt-2 space-y-1">
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
