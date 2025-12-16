'use client';

import { AlertTriangle, Home, MapPin, Shield } from 'lucide-react';
import type { RiskIndicators, RiskLevel, EvacuationUrgency } from '@/types/mission-report';
import { cn } from '@/lib/utils';

interface RiskIndicatorCardProps {
  riskAssessment: RiskIndicators;
  className?: string;
}

const riskLevelConfig: Record<RiskLevel, { color: string; bgColor: string; icon: string }> = {
  HIGH: {
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    icon: '🔴',
  },
  MEDIUM: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    icon: '🟡',
  },
  LOW: {
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    icon: '🟢',
  },
};

const evacuationConfig: Record<EvacuationUrgency, { color: string; label: string; icon: string }> = {
  IMMEDIATE: {
    color: 'text-red-600 dark:text-red-400',
    label: 'Evacuate Immediately',
    icon: '🏃',
  },
  RECOMMENDED: {
    color: 'text-yellow-600 dark:text-yellow-400',
    label: 'Evacuation Recommended',
    icon: '⚠️',
  },
  SHELTER_IN_PLACE: {
    color: 'text-green-600 dark:text-green-400',
    label: 'Shelter in Place',
    icon: '🏠',
  },
};

export function RiskIndicatorCard({ riskAssessment, className }: RiskIndicatorCardProps) {
  const riskConfig = riskLevelConfig[riskAssessment.riskToLife];
  const evacConfig = evacuationConfig[riskAssessment.evacuationUrgency];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Risk to Life */}
      <div
        className={cn(
          'rounded-lg border p-4',
          riskConfig.bgColor
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{riskConfig.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn('h-4 w-4', riskConfig.color)} />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Risk to Life
              </span>
            </div>
            <p className={cn('text-lg font-semibold', riskConfig.color)}>
              {riskAssessment.riskToLife}
            </p>
          </div>
        </div>
        {riskAssessment.riskToLifeReason && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {riskAssessment.riskToLifeReason}
          </p>
        )}
      </div>

      {/* Evacuation Urgency */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{evacConfig.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Evacuation Status
              </span>
            </div>
            <p className={cn('text-lg font-semibold', evacConfig.color)}>
              {evacConfig.label}
            </p>
          </div>
        </div>
        {riskAssessment.evacuationReason && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {riskAssessment.evacuationReason}
          </p>
        )}
      </div>

      {/* Key Threats */}
      {riskAssessment.keyThreats.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Key Threats
            </span>
          </div>
          <ul className="space-y-2">
            {riskAssessment.keyThreats.map((threat, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="text-red-500 mt-0.5">•</span>
                {threat}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Location Factors */}
      {riskAssessment.locationFactors.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Location Factors
            </span>
          </div>
          <ul className="space-y-2">
            {riskAssessment.locationFactors.map((factor, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <span className="text-blue-500 mt-0.5">•</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
