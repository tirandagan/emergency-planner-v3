"use client";

import React, { useState } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Cloud, Zap, Activity, Radiation, Users, Sprout, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScenarioInfoModal } from '../ScenarioInfoModal';
import type { WizardFormData, ScenarioType } from '@/types/wizard';

interface ScenarioStepProps {
  register: UseFormRegister<WizardFormData>;
  watch: UseFormWatch<WizardFormData>;
  setValue: UseFormSetValue<WizardFormData>;
  errors?: {
    scenarios?: { message: string };
  };
}

const SCENARIOS: Array<{
  id: ScenarioType;
  name: string;
  shortDescription: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    id: 'natural-disaster',
    name: 'Natural Disaster',
    shortDescription: 'Weather & geological events',
    description:
      'Hurricanes, earthquakes, floods, wildfires, tornadoes, and severe weather events',
    icon: Cloud,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'emp-grid-down',
    name: 'EMP/Grid Down',
    shortDescription: 'Long-term power loss',
    description: 'Electromagnetic pulse, cyber attacks, or prolonged power grid failures',
    icon: Zap,
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    id: 'pandemic',
    name: 'Pandemic',
    shortDescription: 'Disease outbreak & quarantine',
    description: 'Widespread disease outbreak requiring quarantine and medical preparedness',
    icon: Activity,
    color: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'nuclear',
    name: 'CBRN',
    shortDescription: 'Chemical, Biological, Radiological, Nuclear',
    description: 'Nuclear events, dirty bombs, chemical attacks, or radiological incidents requiring immediate shelter and decontamination',
    icon: Radiation,
    color: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'civil-unrest',
    name: 'Civil Unrest',
    shortDescription: 'Social disorder & instability',
    description: 'Social disorder, riots, political instability, or breakdown of law and order',
    icon: Users,
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'multi-year-sustainability',
    name: 'Multi-Year Sustainability',
    shortDescription: 'Long-term self-sufficiency',
    description:
      'Long-term self-sufficiency, homesteading, and extended off-grid living preparation',
    icon: Sprout,
    color: 'text-green-600 dark:text-green-400',
  },
];

export function ScenarioStep({ register, watch, setValue, errors }: ScenarioStepProps) {
  const selectedScenarios = watch('scenarios') || [];
  const [infoModalScenario, setInfoModalScenario] = useState<ScenarioType | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Register the scenarios field
  React.useEffect(() => {
    register('scenarios');
  }, [register]);

  const toggleScenario = (scenarioId: ScenarioType) => {
    const currentScenarios = Array.isArray(selectedScenarios) ? selectedScenarios : [];
    const newScenarios = currentScenarios.includes(scenarioId)
      ? currentScenarios.filter((s) => s !== scenarioId)
      : [...currentScenarios, scenarioId];

    setValue('scenarios', newScenarios, { shouldValidate: true });
  };

  const openInfoModal = (scenarioId: ScenarioType, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the scenario selection
    setInfoModalScenario(scenarioId);
    setIsInfoModalOpen(true);
  };

  const closeInfoModal = () => {
    setIsInfoModalOpen(false);
    // Delay clearing the scenario to allow modal close animation
    setTimeout(() => setInfoModalScenario(null), 200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Select Your Scenarios
        </h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              aria-label="Learn about scenario planning"
            >
              <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Planning with Multiple Scenarios</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-3 pt-2 text-sm text-muted-foreground">
                  <p>
                    Your scenario selections drive every aspect of your emergency plan.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <p className="font-semibold text-foreground">Single Scenario:</p>
                      <p>
                        Creates a focused, scenario-specific plan with targeted recommendations for that emergency type.
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Multiple Scenarios:</p>
                      <p>
                        Generates one comprehensive plan covering all selected scenarios. The plan will include overlapping preparations and scenario-specific sections.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    <strong>Need separate plans?</strong> Create individual plans by selecting one scenario at a time.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SCENARIOS.map((scenario) => {
          const isSelected = selectedScenarios.includes(scenario.id);
          const Icon = scenario.icon;

          return (
            <div
              key={scenario.id}
              onClick={() => toggleScenario(scenario.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleScenario(scenario.id);
                }
              }}
              role="button"
              tabIndex={0}
              className={`
                relative flex flex-col gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${
                  isSelected
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`${scenario.name} - ${scenario.description}`}
            >
              {/* Top Row: Icon + Title */}
              <div className="flex gap-0.5 w-full items-center -ml-2">
                {/* Icon - Left */}
                <div className={`w-12 h-12 flex items-center justify-center flex-shrink-0 ${scenario.color}`}>
                  <Icon className="w-8 h-8" />
                </div>

                {/* Title + Info Button */}
                <div className="flex items-center gap-0.5">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {scenario.name}
                  </h3>
                  {/* Info Button - Next to Title */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => openInfoModal(scenario.id, e)}
                    className="h-5 w-5 p-0 hover:bg-transparent"
                    aria-label={`View detailed information about ${scenario.name}`}
                  >
                    <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </Button>
                </div>
              </div>

              {/* Bottom: Short Description + Description spanning full width */}
              <div className="w-full space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium text-center border-t border-b border-blue-500 py-2">
                  {scenario.shortDescription}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {scenario.description}
                </p>
              </div>

              {/* Selected State: Overlay + Giant Checkmark */}
              {isSelected && (
                <>
                  {/* Semi-transparent white overlay (dims content) */}
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 rounded-lg pointer-events-none" />

                  {/* Giant blue checkmark spanning the card */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in zoom-in-50 duration-200">
                    <svg
                      className="w-20 h-20 text-primary drop-shadow-lg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Error Message */}
      {errors?.scenarios && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive">
          <p className="text-sm text-destructive">{errors.scenarios.message as string}</p>
        </div>
      )}

      {/* Selection Summary */}
      {selectedScenarios.length > 0 && (
        <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold">
              {selectedScenarios.length} scenario{selectedScenarios.length > 1 ? 's' : ''}
            </span>{' '}
            selected: {selectedScenarios.join(', ').replace(/-/g, ' ')}
          </p>
        </div>
      )}

      {/* Info Modal */}
      <ScenarioInfoModal
        scenario={infoModalScenario}
        isOpen={isInfoModalOpen}
        onClose={closeInfoModal}
      />
    </div>
  );
}
