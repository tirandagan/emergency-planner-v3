"use client";

import React, { useState } from 'react';
import { Control, useFieldArray, FieldErrors } from 'react-hook-form';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompactPersonCard } from '../CompactPersonCard';
import { HouseholdSaveToggle } from '../HouseholdSaveToggle';
import { HouseholdHelpModal } from '../HouseholdHelpModal';
import { QuickAddButton } from '../QuickAddButton';
import type { WizardFormData, FamilyMember } from '@/types/wizard';

interface PersonnelStepProps {
  control: Control<WizardFormData>;
  errors?: FieldErrors<WizardFormData>;
  savedHouseholdMembers?: FamilyMember[];
  savePreference: boolean;
  onSavePreferenceChange: (value: boolean) => void;
  onQuickAdd: () => void;
}

export function PersonnelStep({
  control,
  errors,
  savedHouseholdMembers,
  savePreference,
  onSavePreferenceChange,
  onQuickAdd,
}: PersonnelStepProps): React.ReactElement {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'familyMembers',
  });

  const addFamilyMember = (): void => {
    append({
      name: '',
      age: 30,
      medicalConditions: '',
      specialNeeds: '',
    });
  };

  const handleQuickAdd = (): void => {
    if (savedHouseholdMembers && savedHouseholdMembers.length > 0) {
      replace(savedHouseholdMembers);
      onQuickAdd();
    }
  };

  return (
    <div className="space-y-6">
      {/* Save to Profile Toggle */}
      <HouseholdSaveToggle
        value={savePreference}
        onChange={onSavePreferenceChange}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

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

      {/* Quick Add Button (if saved data exists) */}
      {savedHouseholdMembers && savedHouseholdMembers.length > 0 && (
        <QuickAddButton
          onClick={handleQuickAdd}
          memberCount={savedHouseholdMembers.length}
        />
      )}

      {/* Family Members */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <CompactPersonCard
            key={field.id}
            index={index}
            control={control}
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
          className="w-full border-dashed hover:border-solid"
        >
          <UserPlus className="!w-4 !h-4" />
          Add Another Person
        </Button>
      )}

      {/* General Error */}
      {errors?.familyMembers && typeof errors.familyMembers === 'object' && !Array.isArray(errors.familyMembers) && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive">
          <p className="text-sm text-destructive">{(errors.familyMembers as { message?: string }).message}</p>
        </div>
      )}

      {/* Help Modal */}
      <HouseholdHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
