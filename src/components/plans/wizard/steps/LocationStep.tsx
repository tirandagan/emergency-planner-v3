"use client";

import * as React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue, Control, Controller } from 'react-hook-form';
import {
  Building2,
  Home,
  Building,
  Trees,
  Caravan,
  HelpCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LocationAutocomplete } from '../LocationAutocomplete';
import { WeatherStation } from '../WeatherStation';
import type { WizardFormData, LocationData } from '@/types/wizard';

// Duration indicator component
const DurationIndicator = ({ dots, isMax }: { dots: number; isMax?: boolean }) => {
  if (dots < 1) {
    // Half dot for 3 days - using clip-path for half circle
    return (
      <div className="flex items-center justify-center h-6">
        <div 
          className="w-2.5 h-2.5 rounded-full bg-current opacity-30"
          style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
        />
      </div>
    );
  }
  
  // For more than 4 dots, group them in 2x2 grids
  if (dots > 4) {
    const fullGroups = Math.floor(dots / 4);
    const remainder = dots % 4;
    
    return (
      <div className="flex items-center justify-center gap-1.5 h-6">
        {/* Full 2x2 groups */}
        {Array.from({ length: fullGroups }).map((_, groupIndex) => (
          <div key={`group-${groupIndex}`} className="grid grid-cols-2 gap-0.5">
            {Array.from({ length: 4 }).map((_, dotIndex) => (
              <div key={dotIndex} className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
            ))}
          </div>
        ))}
        
        {/* Remainder dots */}
        {remainder > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: remainder }).map((_, i) => (
              <div key={`rem-${i}`} className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
            ))}
          </div>
        )}
        
        {isMax && <span className="text-[10px] font-bold opacity-50">+</span>}
      </div>
    );
  }
  
  // For 4 or fewer dots, show in a simple row
  return (
    <div className="flex items-center justify-center gap-1 h-6">
      {Array.from({ length: dots }).map((_, i) => (
        <div key={i} className="w-2 h-2 rounded-full bg-current opacity-30" />
      ))}
    </div>
  );
};

interface LocationStepProps {
  register: UseFormRegister<WizardFormData>;
  watch: UseFormWatch<WizardFormData>;
  setValue: UseFormSetValue<WizardFormData>;
  control: Control<WizardFormData>;
  errors?: Record<string, any>;
}

const DURATION_OPTIONS = [
  { value: 3, label: '3 days', description: 'Short-term', dots: 0.5, isMax: false },
  { value: 7, label: '1 week', description: 'Basic prep', dots: 1, isMax: false },
  { value: 30, label: '1 month', description: 'Extended', dots: 4, isMax: false },
  { value: 90, label: '3 months', description: 'Long-term', dots: 12, isMax: false },
  { value: 365, label: '1 year+', description: 'Maximum', dots: 12, isMax: true },
];

const HOME_TYPES = [
  { value: 'apartment', label: 'Apartment', description: 'Multi-unit', icon: Building2 },
  { value: 'house', label: 'House', description: 'Single-family', icon: Home },
  { value: 'condo', label: 'Condo', description: 'Condo unit', icon: Building },
  { value: 'rural', label: 'Rural', description: 'Farm or land', icon: Trees },
  { value: 'mobile', label: 'Mobile', description: 'Trailer or RV', icon: Caravan },
  { value: 'other', label: 'Other', description: 'Other type', icon: HelpCircle },
];

export function LocationStep({ register, watch, setValue, control, errors }: LocationStepProps) {
  // Note: All fields are managed by Controller for proper reactivity

  return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Location & Context
          </h2>
        </div>

        {/* Location */}
        <Controller
          name="location"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="location" className="text-base font-semibold">
                  Scenario Location <span className="text-destructive">*</span>
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-transparent"
                    >
                      <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Why We Need Your Location</DialogTitle>
                      <DialogDescription asChild>
                        <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                          <p>
                            Your location is crucial for creating a truly personalized preparedness plan that works for your specific area.
                          </p>
                          <p className="font-semibold text-foreground">
                            Here&rsquo;s how we use it:
                          </p>
                          <ul className="list-disc pl-5 space-y-2 text-sm">
                            <li>
                              <span className="font-medium">Local Risk Assessment:</span> Identify region-specific threats like earthquakes, hurricanes, wildfires, or flooding
                            </li>
                            <li>
                              <span className="font-medium">Climate-Specific Guidance:</span> Tailor recommendations for your local weather patterns and seasonal hazards
                            </li>
                            <li>
                              <span className="font-medium">Resource Mapping:</span> Locate nearby emergency services, shelters, and supply points
                            </li>
                            <li>
                              <span className="font-medium">Evacuation Planning:</span> Generate realistic evacuation routes and safe zones based on local geography
                            </li>
                            <li>
                              <span className="font-medium">Smart Recommendations:</span> Suggest gear and supplies appropriate for your area&rsquo;s unique conditions
                            </li>
                          </ul>
                          <p className="text-xs text-muted-foreground pt-2">
                            Your privacy is protected. Location data is used solely for plan generation and is never shared with third parties.
                          </p>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
              <LocationAutocomplete
                onLocationSelect={(locationData) => field.onChange(locationData)}
                value={field.value?.fullAddress}
                error={fieldState.error?.message}
              />

              {/* Weather Station Display */}
              {field.value?.coordinates?.lat !== undefined &&
               field.value?.coordinates?.lng !== undefined &&
               field.value?.coordinates?.lat !== 0 &&
               field.value?.coordinates?.lng !== 0 && (
                <WeatherStation locationData={field.value} />
              )}
            </div>
          )}
        />

      {/* Home Type */}
      <div className="space-y-3">
        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Home Type <span className="text-destructive">*</span>
        </div>
        <Controller
          name="homeType"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {HOME_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = field.value === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => field.onChange(type.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer",
                      "hover:scale-[1.02]",
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
                        )}
                      />
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {type.label}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400">
                          {type.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center pointer-events-none">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors?.homeType && (
          <p className="text-sm text-destructive">{errors.homeType.message}</p>
        )}
      </div>

      {/* Planning Duration */}
      <div className="space-y-3">
        <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Planning Duration <span className="text-destructive">*</span>
        </div>
        <Controller
          name="durationDays"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {DURATION_OPTIONS.map((option) => {
                const isSelected = field.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer",
                      "hover:scale-[1.02]",
                      isSelected
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    <div className="flex flex-col items-center gap-2 pointer-events-none">
                      <DurationIndicator dots={option.dots} isMax={option.isMax} />
                      <div className="text-center">
                        <p className={cn(
                          "text-xs font-medium",
                          isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-900 dark:text-slate-100'
                        )}>
                          {option.label}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center pointer-events-none">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors?.durationDays && (
          <p className="text-sm text-destructive">{errors.durationDays.message}</p>
        )}
      </div>
    </div>
  );
}
