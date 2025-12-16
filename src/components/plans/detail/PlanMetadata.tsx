'use client';

import {
  MapPin,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Clock,
} from 'lucide-react';
import type { MissionReport } from '@/lib/mission-reports';

interface PlanMetadataProps {
  report: MissionReport;
}

export function PlanMetadata({ report }: PlanMetadataProps) {
  const scenarioLabels: Record<string, string> = {
    NATURAL_DISASTER: 'Natural Disaster',
    CIVIL_UNREST: 'Civil Unrest',
    INFRASTRUCTURE_FAILURE: 'Infrastructure Failure',
    PANDEMIC: 'Pandemic',
    ECONOMIC_COLLAPSE: 'Economic Collapse',
  };

  return (
    <div className="space-y-6">
      {/* Plan Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Plan Details
        </h3>

        <div className="space-y-4">
          {/* Location */}
          {report.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Location
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {report.location}
                </p>
              </div>
            </div>
          )}

          {/* Scenarios */}
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Scenarios
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {report.scenarios.map((scenario) => (
                  <span
                    key={scenario}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    {scenarioLabels[scenario] || scenario}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Family Size */}
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Family Size
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {report.familySize} {report.familySize === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Duration
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {report.durationDays} days
              </p>
            </div>
          </div>

          {/* Budget */}
          {report.budgetAmount && (
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Budget
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  ${parseFloat(report.budgetAmount).toFixed(0)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Generation Info */}
      <div className="bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            AI Generated
          </h3>
        </div>

        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Generated At
              </p>
              <p>
                {new Date(report.reportData.metadata.generatedAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          <div>
            <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
              AI Model
            </p>
            <p className="text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded font-mono">
              {report.reportData.metadata.model}
            </p>
          </div>

          <p className="text-xs">
            This plan was generated using artificial intelligence based on your
            specific requirements and location data.
          </p>
        </div>
      </div>
    </div>
  );
}
