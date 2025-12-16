"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number; // 0-indexed (0-3)
  totalSteps: number;
  stepLabels: string[];
}

export function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Mobile: Compact Progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {stepLabels[currentStep]}
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: Full Step Indicator */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {stepLabels.map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const isUpcoming = index > currentStep;

            return (
              <React.Fragment key={index}>
                {/* Step */}
                <div className="flex flex-col items-center relative">
                  {/* Circle */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                      isCompleted &&
                        'bg-primary text-primary-foreground border-2 border-primary',
                      isCurrent &&
                        'bg-primary text-primary-foreground border-2 border-primary ring-4 ring-primary/20',
                      isUpcoming && 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-2 border-slate-300 dark:border-slate-600'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isCurrent && 'text-primary',
                        isCompleted && 'text-slate-900 dark:text-slate-100',
                        isUpcoming && 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {label}
                    </span>
                  </div>
                </div>

                {/* Connector Line */}
                {index < totalSteps - 1 && (
                  <div className="flex-1 h-0.5 mx-4 mb-8 relative">
                    <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700" />
                    <div
                      className={cn(
                        'absolute inset-0 bg-primary transition-all duration-300',
                        isCompleted ? 'w-full' : 'w-0'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
