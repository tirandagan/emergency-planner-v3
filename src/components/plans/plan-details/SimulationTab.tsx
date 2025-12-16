'use client';

import { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import type { SimulationDay } from '@/types/mission-report';
import { cn } from '@/lib/utils';

interface SimulationTabProps {
  simulation: SimulationDay[];
  durationDays: number;
}

export function SimulationTab({ simulation, durationDays }: SimulationTabProps) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(
    new Set(simulation.slice(0, 2).map(d => d.day))
  );

  if (simulation.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
        <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Simulation Available
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          The day-by-day simulation will appear here once your plan is generated.
        </p>
      </div>
    );
  }

  const toggleDay = (day: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDays(new Set(simulation.map(d => d.day)));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Day-by-Day Simulation
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {durationDays} day scenario breakdown with {simulation.length} phases
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-sm text-primary hover:underline"
            >
              Expand All
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button
              onClick={collapseAll}
              className="text-sm text-primary hover:underline"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

        {/* Days */}
        <div className="space-y-4">
          {simulation.map((day, index) => {
            const isExpanded = expandedDays.has(day.day);
            const isFirst = index === 0;
            const isLast = index === simulation.length - 1;

            return (
              <div key={day.day} className="relative">
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-[15px] w-4 h-4 rounded-full border-4 z-10',
                    isFirst
                      ? 'bg-primary border-primary'
                      : isLast
                      ? 'bg-green-500 border-green-500'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                  )}
                />

                {/* Card */}
                <div className="ml-12">
                  <button
                    onClick={() => toggleDay(day.day)}
                    className="w-full text-left bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium',
                            isFirst
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          )}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {day.day}
                        </span>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">
                          {day.title}
                        </h4>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0">
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          {/* Narrative */}
                          {day.narrative && (
                            <div className="mb-4">
                              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                                {day.narrative}
                              </p>
                            </div>
                          )}

                          {/* Key Actions */}
                          {day.keyActions.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                                Key Actions
                              </h5>
                              <ul className="space-y-2">
                                {day.keyActions.map((action, actionIndex) => (
                                  <li
                                    key={actionIndex}
                                    className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                                  >
                                    <span className="text-primary mt-1">•</span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
