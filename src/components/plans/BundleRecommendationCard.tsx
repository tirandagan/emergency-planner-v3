'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package, Check, X, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { BundleRecommendation, BundlePriority } from '@/types/mission-report';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BundleRecommendationCardProps {
  bundle: BundleRecommendation;
  className?: string;
  showDetails?: boolean;
}

const priorityConfig: Record<BundlePriority, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  essential: {
    label: 'Essential',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: '🎯',
  },
  recommended: {
    label: 'Recommended',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: '✅',
  },
  optional: {
    label: 'Optional',
    color: 'text-slate-700 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    icon: '💡',
  },
};

export function BundleRecommendationCard({
  bundle,
  className,
  showDetails = true,
}: BundleRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const priority = priorityConfig[bundle.priority];

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4">
          {/* Bundle Image */}
          <div className="relative w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
            {bundle.bundleImageUrl ? (
              <Image
                src={bundle.bundleImageUrl}
                alt={bundle.bundleName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
            )}
          </div>

          {/* Bundle Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  priority.bgColor,
                  priority.color
                )}
              >
                {priority.icon} {priority.label}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {bundle.bundleName}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-lg font-bold text-primary">
                ${bundle.price.toFixed(2)}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {bundle.itemCount} items
              </span>
            </div>
          </div>

          {/* Fit Score */}
          <div className="text-center shrink-0">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
                bundle.fitScore >= 80
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : bundle.fitScore >= 60
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              )}
            >
              {bundle.fitScore}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Fit Score</p>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {bundle.reasoning && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {bundle.reasoning}
          </p>
        </div>
      )}

      {/* Expandable Details */}
      {showDetails && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {isExpanded && (
            <div className="px-4 pb-4 space-y-4">
              {/* Pros */}
              {bundle.pros.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Why This Fits
                  </h4>
                  <ul className="space-y-1.5">
                    {bundle.pros.map((pro, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cons */}
              {bundle.cons.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Gaps to Consider
                  </h4>
                  <ul className="space-y-1.5">
                    {bundle.cons.map((con, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                      >
                        <X className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Scenario Tags */}
              {bundle.scenarios.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Scenarios Covered
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {bundle.scenarios.map((scenario, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
                      >
                        {scenario.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Action Button */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <Link href={`/bundles/${bundle.bundleSlug || bundle.bundleId}`}>
          <Button variant="outline" className="w-full">
            View Bundle Details
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Grid of bundle recommendation cards
 */
export function BundleRecommendationGrid({
  bundles,
  className,
}: {
  bundles: BundleRecommendation[];
  className?: string;
}) {
  // Sort by priority: essential first, then recommended, then optional
  const sortedBundles = [...bundles].sort((a, b) => {
    const priorityOrder = { essential: 0, recommended: 1, optional: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
      {sortedBundles.map((bundle) => (
        <BundleRecommendationCard key={bundle.bundleId} bundle={bundle} />
      ))}
    </div>
  );
}
