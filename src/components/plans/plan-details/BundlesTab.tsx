'use client';

import { BundleRecommendationCard } from '@/components/plans/BundleRecommendationCard';
import type { BundleRecommendation } from '@/types/mission-report';
import { Package } from 'lucide-react';

interface BundlesTabProps {
  bundles: BundleRecommendation[];
}

export function BundlesTab({ bundles }: BundlesTabProps) {
  // Sort by priority: essential first, then recommended, then optional
  const sortedBundles = [...bundles].sort((a, b) => {
    const priorityOrder = { essential: 0, recommended: 1, optional: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (bundles.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
        <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
          No Bundle Recommendations
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Bundle recommendations will appear here once your plan is generated.
        </p>
      </div>
    );
  }

  const essentialBundles = sortedBundles.filter(b => b.priority === 'essential');
  const recommendedBundles = sortedBundles.filter(b => b.priority === 'recommended');
  const optionalBundles = sortedBundles.filter(b => b.priority === 'optional');

  return (
    <div className="space-y-8">
      {/* Total Investment Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Bundle Investment Summary
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {bundles.length} bundles recommended for your plan
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              ${bundles.reduce((sum, b) => sum + b.price, 0).toFixed(2)}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total estimated cost
            </p>
          </div>
        </div>
      </div>

      {/* Essential Bundles */}
      {essentialBundles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🎯</span>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Essential Bundles
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              (Must-have for basic survival)
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {essentialBundles.map((bundle) => (
              <BundleRecommendationCard
                key={bundle.bundleId}
                bundle={bundle}
                showDetails
              />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Bundles */}
      {recommendedBundles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">✅</span>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Recommended Bundles
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              (Fill gaps and enhance capability)
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recommendedBundles.map((bundle) => (
              <BundleRecommendationCard
                key={bundle.bundleId}
                bundle={bundle}
                showDetails
              />
            ))}
          </div>
        </section>
      )}

      {/* Optional Bundles */}
      {optionalBundles.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">💡</span>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Optional Bundles
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              (Nice-to-have enhancements)
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {optionalBundles.map((bundle) => (
              <BundleRecommendationCard
                key={bundle.bundleId}
                bundle={bundle}
                showDetails
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
