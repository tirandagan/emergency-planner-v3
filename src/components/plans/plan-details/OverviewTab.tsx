'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RiskIndicatorCard } from '@/components/plans/RiskIndicatorCard';
import { BundleRecommendationCard } from '@/components/plans/BundleRecommendationCard';
import type { ReportDataV2 } from '@/types/mission-report';

interface OverviewTabProps {
  reportData: ReportDataV2;
}

export function OverviewTab({ reportData }: OverviewTabProps) {
  const { sections } = reportData;

  return (
    <div className="space-y-8">
      {/* Risk Assessment Cards */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Risk Assessment
        </h2>
        <RiskIndicatorCard riskAssessment={sections.riskAssessment} />
      </section>

      {/* Executive Summary */}
      <section>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Executive Summary
        </h2>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {sections.executiveSummary}
            </ReactMarkdown>
          </div>
        </div>
      </section>

      {/* Recommended Bundles */}
      {sections.bundles.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Recommended Bundles
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {sections.bundles.map((bundle) => (
              <BundleRecommendationCard key={bundle.bundleId} bundle={bundle} />
            ))}
          </div>
        </section>
      )}

      {/* Next Steps */}
      {sections.nextSteps.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Next Steps
          </h2>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <ol className="space-y-3">
              {sections.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm font-medium shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </div>
  );
}
