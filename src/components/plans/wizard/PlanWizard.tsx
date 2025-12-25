"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepIndicator } from './StepIndicator';
import { ScenarioStep } from './steps/ScenarioStep';
import { PersonnelStep } from './steps/PersonnelStep';
import { LocationStep } from './steps/LocationStep';
import { StreamingGenerationStep } from './steps/StreamingGenerationStep';
import {
  scenarioSelectionSchema,
  personnelConfigurationSchema,
  locationContextSchema,
} from '@/lib/validation/wizard';
import type { WizardFormData, LocationData, FamilyMember } from '@/types/wizard';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { invalidateCachedProfile } from '@/lib/cache';
import { updateHouseholdMembers } from '@/app/actions/profile';

const STEP_LABELS = ['Scenarios', 'Personnel', 'Location & Context', 'Generate Plan'];
const STORAGE_KEY = 'plan-wizard-state';
const EDIT_STORAGE_KEY = 'plan-wizard-edit-state';

// Load saved state from localStorage
function loadSavedState(storageKey: string): { formData: Partial<WizardFormData>; currentStep: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that the saved data has the expected structure
      if (parsed.formData && typeof parsed.currentStep === 'number') {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load saved wizard state:', error);
  }

  return null;
}

// Save state to localStorage
function saveState(formData: Partial<WizardFormData>, currentStep: number, storageKey: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        formData,
        currentStep,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Failed to save wizard state:', error);
  }
}

// Clear saved state from localStorage
function clearSavedState(storageKey: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear wizard state:', error);
  }
}

interface PlanWizardProps {
  mode?: 'create' | 'edit';
  existingPlanId?: string;
  initialData?: Partial<WizardFormData>;
  savedHouseholdMembers?: FamilyMember[];
  saveHouseholdPreference?: boolean;
}

export function PlanWizard({
  mode = 'create',
  initialData,
  savedHouseholdMembers,
  saveHouseholdPreference: initialSavePreference,
}: PlanWizardProps = {}) {
  const { user, refreshProfile } = useAuth();
  const isEditMode = mode === 'edit';
  const storageKey = isEditMode ? EDIT_STORAGE_KEY : STORAGE_KEY;
  
  // Force cache refresh on mount if user doesn't have gender (old cached profile)
  // This ensures users with stale cached profiles get the updated profile data
  useEffect(() => {
    if (user && !user.gender && user.id) {
      invalidateCachedProfile(user.id);
      window.location.reload();
    }
  }, [user]);

  // Calculate age from birth year
  const userAge = user?.birthYear ? new Date().getFullYear() - user.birthYear : undefined;
  const profileName = user?.firstName || '';
  const profileGender =
    user?.gender && typeof user.gender === 'string'
      ? (() => {
          const g = user.gender.trim().toLowerCase();
          return g === 'male' || g === 'female' ? (g as 'male' | 'female') : undefined;
        })()
      : undefined;

  // Initial form data (will be populated with defaults, user profile, or edit data)
  // Use useMemo to recompute when user changes
  const INITIAL_FORM_DATA: Partial<WizardFormData> = useMemo(() => {
    if (isEditMode && initialData) return initialData;
    
    return {
      scenarios: [],
      familyMembers: [
        {
          name: profileName,
          age: userAge || 30,
          gender: profileGender,
          medicalConditions: '',
          specialNeeds: '',
        },
      ],
      durationDays: 7,
      homeType: 'house',
    };
  }, [isEditMode, initialData, userAge, profileName, profileGender]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasLoadedState, setHasLoadedState] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [saveHouseholdPreference, setSaveHouseholdPreference] = useState(
    initialSavePreference ?? user?.saveHouseholdPreference ?? true
  );

  // React Hook Form setup
  const {
    register,
    watch,
    setValue,
    control,
    trigger,
    reset,
    formState: { errors },
  } = useForm<WizardFormData>({
    resolver: (currentStep === 0
      ? zodResolver(scenarioSelectionSchema)
      : currentStep === 1
      ? zodResolver(personnelConfigurationSchema)
      : currentStep === 2
      ? zodResolver(locationContextSchema)
      : zodResolver(scenarioSelectionSchema)) as unknown as Resolver<WizardFormData>,
    defaultValues: INITIAL_FORM_DATA as WizardFormData,
    mode: 'onChange',
  });

  const formData = watch();

  // Sync save preference state with user profile
  useEffect(() => {
    if (user?.saveHouseholdPreference !== undefined) {
      setSaveHouseholdPreference(user.saveHouseholdPreference);
    }
  }, [user?.saveHouseholdPreference]);

  // Load saved state on mount, or preload user profile data if starting fresh
  useEffect(() => {
    if (hasLoadedState) return; // Only run once

    // IMPORTANT: Edit mode takes precedence over saved state
    // When editing an existing plan, always load fresh data from database
    if (isEditMode && initialData) {
      // Edit mode - preload with existing plan data
      console.log('📝 PlanWizard - Edit mode initialData:', initialData);
      console.log('📝 PlanWizard - familyMembers from initialData:', initialData.familyMembers);
      Object.entries(initialData).forEach(([key, value]) => {
        console.log(`📝 Setting ${key}:`, value);
        setValue(key as keyof WizardFormData, value);
      });
      setHasLoadedState(true);
      console.log('📝 PlanWizard - After setValue, current form data:', watch());
      return; // Exit early, don't check localStorage
    }

    const savedState = loadSavedState(storageKey);
    if (savedState) {
      // Restore form data from localStorage
      Object.entries(savedState.formData).forEach(([key, value]) => {
        setValue(key as keyof WizardFormData, value);
      });
      // Always override with user profile data for first family member (profile is source of truth)
      if (user) {
        if (profileName) {
          setValue('familyMembers.0.name', profileName);
        }
        if (userAge !== undefined) {
          setValue('familyMembers.0.age', userAge);
        }
        if (user.gender && (user.gender === 'male' || user.gender === 'female')) {
          setValue('familyMembers.0.gender', user.gender);
        }
      }
      // Restore current step
      setCurrentStep(savedState.currentStep);
      setIsResuming(true);
      setHasLoadedState(true);
    } else if (user) {
      // No saved state - preload user profile data for first family member
      // Use reset() to ensure form is properly initialized with user data
      const currentFormData = watch();
      const firstMember = currentFormData.familyMembers?.[0] || {
        name: '',
        age: 30,
        medicalConditions: '',
        specialNeeds: '',
      };
      
      const updatedFormData: WizardFormData = {
        scenarios: currentFormData.scenarios || [],
        familyMembers: [
          {
            ...firstMember,
            name: profileName || firstMember.name,
            age: userAge !== undefined ? userAge : firstMember.age,
            gender: profileGender ?? firstMember.gender,
          },
          ...(currentFormData.familyMembers?.slice(1) || []),
        ],
        location: currentFormData.location || {} as LocationData,
        homeType: currentFormData.homeType || 'house',
        durationDays: currentFormData.durationDays || 7,
      };
      reset(updatedFormData);
      setHasLoadedState(true);
    }
  }, [user, userAge, profileName, profileGender, hasLoadedState, setValue, isEditMode, initialData, storageKey, watch, reset]);

  // Separate effect to update profile data when user loads after initial mount
  // This ensures name, age, and gender are pre-populated even if user loads later
  useEffect(() => {
    if (!user || isEditMode || !hasLoadedState) return;
    
    // Only update if there's no saved state (saved state takes precedence)
    const savedState = loadSavedState(storageKey);
    if (!savedState) {
      // Check if name needs updating
      if (profileName) {
        const currentName = watch('familyMembers.0.name');
        if (!currentName || currentName !== profileName) {
          setValue('familyMembers.0.name', profileName, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false,
          });
        }
      }
      
      // Check if gender needs updating
      if (profileGender) {
        const currentGender = watch('familyMembers.0.gender');
        if (currentGender !== profileGender) {
          setValue('familyMembers.0.gender', profileGender, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false,
          });
        }
      }
    }
  }, [user, isEditMode, hasLoadedState, profileName, profileGender, watch, setValue, storageKey]);

  // Save state to localStorage whenever form data or step changes
  useEffect(() => {
    // Don't save until we've loaded the initial state
    if (!hasLoadedState) return;

    saveState(formData, currentStep, storageKey);
  }, [formData, currentStep, hasLoadedState, storageKey]);

  /**
   * Validate current step before proceeding
   */
  const validateCurrentStep = async (): Promise<boolean> => {
    setIsValidating(true);
    try {
      // Step 3 (Generation) doesn't need validation
      if (currentStep === 3) {
        return true;
      }

      // Trigger validation for current step
      const isValid = await trigger();

      return isValid;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle next button click
   */
  const handleNext = async (): Promise<void> => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const isValid = await validateCurrentStep();

      if (isValid) {
        // Save household members to profile when leaving Step 2 (Personnel)
        if (currentStep === 1 && saveHouseholdPreference) {
          try {
            await updateHouseholdMembers(
              formData.familyMembers,
              saveHouseholdPreference
            );

            // Refresh profile in context to get updated data
            if (user?.id) {
              invalidateCachedProfile(user.id);
              await refreshProfile();
            }
          } catch (error) {
            console.error('Failed to save household members:', error);
          }
        }

        if (currentStep < 3) {
          setCurrentStep(currentStep + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle back button click
   */
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Scroll to top of wizard
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Handle start over - clear all state and reset form
   */
  const handleStartOver = () => {
    clearSavedState(storageKey);
    reset(INITIAL_FORM_DATA as WizardFormData);
    setCurrentStep(0);
    setIsResuming(false);
    // Preload user profile data for first family member (only in create mode)
    if (!isEditMode && userAge !== undefined) {
      setValue('familyMembers.0.age', userAge);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle generation complete
   */
  const handleGenerationComplete = (reportId: string): void => {
    console.log(isEditMode ? 'Update complete:' : 'Generation complete:', reportId);
    clearSavedState(storageKey);
  };

  /**
   * Handle quick add button click
   */
  const handleQuickAdd = (): void => {
    console.log('Loaded saved household members from profile');
  };

  /**
   * Render current step component
   */
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ScenarioStep
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />
        );
      case 1:
        return (
          <PersonnelStep
            control={control}
            errors={errors}
            savedHouseholdMembers={savedHouseholdMembers}
            savePreference={saveHouseholdPreference}
            onSavePreferenceChange={setSaveHouseholdPreference}
            onQuickAdd={handleQuickAdd}
          />
        );
      case 2:
        return (
          <LocationStep
            register={register}
            watch={watch}
            setValue={setValue}
            control={control}
            errors={errors}
          />
        );
      case 3:
        return (
          <StreamingGenerationStep
            formData={formData as WizardFormData}
            onComplete={handleGenerationComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {isEditMode ? 'Edit Emergency Plan' : 'Create New Disaster Preparedness Plan'}
                </h1>
                {isEditMode && (
                  <Badge variant="secondary" className="text-sm">
                    Editing Mode
                  </Badge>
                )}
              </div>
            </div>
            {isResuming && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleStartOver}
                className="shrink-0"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator
            currentStep={currentStep}
            totalSteps={4}
            stepLabels={STEP_LABELS}
          />
        </div>

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Step Content */}
          <div 
            key={`step-${currentStep}`}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 mb-6"
          >
            {renderStep()}
          </div>

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="min-w-[120px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {/* Next/Generate Button */}
            <Button
              type="button"
              onClick={handleNext}
              disabled={isValidating || isProcessing}
              className="min-w-[120px]"
            >
              {isValidating || isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {currentStep === 2 ? 'Submitting...' : 'Validating...'}
                </>
              ) : currentStep === 2 ? (
                <>
                  Generate Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
        </form>

      </div>
    </div>
  );
}
