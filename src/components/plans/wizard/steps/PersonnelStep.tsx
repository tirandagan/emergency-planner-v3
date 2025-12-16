"use client";

import React from 'react';
import { Control, useFieldArray, FieldErrors, UseFormRegister } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompactPersonCard } from '../CompactPersonCard';
import type { WizardFormData } from '@/types/wizard';

interface PersonnelStepProps {
  register: UseFormRegister<WizardFormData>;
  control: Control<WizardFormData>;
  errors?: FieldErrors<WizardFormData>;
}

export function PersonnelStep({ register, control, errors }: PersonnelStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'familyMembers',
  });

  const addFamilyMember = () => {
    append({
      age: 30,
      medicalConditions: '',
      specialNeeds: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Configure Personnel
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Add each person who will be part of your disaster preparedness plan. This helps us
          calculate accurate supply quantities and identify special needs.
        </p>
      </div>

      {/* Family Members */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <CompactPersonCard
            key={field.id}
            index={index}
            value={field}
            onChange={(fieldName, value) => {
              const event = {
                target: {
                  name: `familyMembers.${index}.${fieldName}`,
                  value,
                },
              };
              register(`familyMembers.${index}.${fieldName}`).onChange(event);
            }}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
            error={errors?.familyMembers?.[index]}
          />
        ))}
      </div>

      {/* Add Person Button */}
      {fields.length < 20 && (
        <Button
          type="button"
          variant="outline"
          onClick={addFamilyMember}
          className="w-full border-dashed"
        >
          <UserPlus className="w-4 h-4" />
          Add Another Person
        </Button>
      )}

      {/* Summary */}
      {fields.length > 0 && (
        <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">{fields.length} person{fields.length > 1 ? 's' : ''}</span>{' '}
            added to your disaster preparedness plan
          </p>
        </div>
      )}

      {/* General Error */}
      {errors?.familyMembers && typeof errors.familyMembers === 'object' && !Array.isArray(errors.familyMembers) && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive">
          <p className="text-sm text-destructive">{(errors.familyMembers as { message?: string }).message}</p>
        </div>
      )}
    </div>
  );
}
