"use client";

import React, { useState } from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Cloud, Zap, Activity, Radiation, Users, Sprout, Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScenarioInfoModal } from '../ScenarioInfoModal';
import type { WizardFormData, ScenarioType } from '@/types/wizard';

interface ScenarioStepProps {
  register: UseFormRegister<WizardFormData>;
  watch: UseFormWatch<WizardFormData>;
  setValue: UseFormSetValue<WizardFormData>;
  errors?: Record<string, any>;
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
    name: 'EMP / Grid Down',
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
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Select Your Scenarios
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Choose one or more scenarios you want to prepare for. Your plan will be customized for
          each selected scenario.
        </p>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCENARIOS.map((scenario) => {
          const isSelected = selectedScenarios.includes(scenario.id);
          const Icon = scenario.icon;

          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => toggleScenario(scenario.id)}
              className={`
                relative flex flex-col gap-3 p-4 rounded-lg border-2 transition-all
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
              {/* Checkbox */}
              <div className="absolute top-3 right-3">
                <Checkbox checked={isSelected} readOnly className="pointer-events-none" />
              </div>

              {/* Icon */}
              <div className={`w-12 h-12 flex items-center justify-center ${scenario.color}`}>
                <Icon className="w-8 h-8" />
              </div>

              {/* Content */}
              <div className="text-left pr-8 flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  {scenario.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mb-2">
                  {scenario.shortDescription}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {scenario.description}
                </p>
              </div>

              {/* Info Button - Bottom Right */}
              <div className="absolute bottom-3 right-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => openInfoModal(scenario.id, e)}
                  className="w-7 h-7 p-0 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:ring-2 focus:ring-primary transition-colors"
                  aria-label={`View detailed information about ${scenario.name}`}
                >
                  <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300" />
                </Button>
              </div>
            </button>
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
