"use client";

import { use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { WizardGuard } from '@/components/plans/wizard/WizardGuard';
import { transformReportToWizardData } from '@/lib/wizard/transform-plan-data';
import type { WizardFormData } from '@/types/wizard';
import type { MissionReport } from '@/lib/mission-reports';

// Disable SSR for the wizard to prevent hydration issues
const PlanWizard = dynamic(
  () => import('@/components/plans/wizard/PlanWizard').then(mod => mod.PlanWizard),
  { ssr: false }
);

export default function NewPlanPage() {
  const searchParams = useSearchParams();
  const editReportId = searchParams.get('edit');
  const [initialData, setInitialData] = useState<Partial<WizardFormData> | undefined>();
  const [isLoading, setIsLoading] = useState(!!editReportId);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing plan data if editing
  useEffect(() => {
    const fetchPlanData = async () => {
      if (!editReportId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/plans/${editReportId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch plan data');
        }

        const report: MissionReport = await response.json();
        const wizardData = transformReportToWizardData(report);
        setInitialData(wizardData);
      } catch (err) {
        console.error('Error fetching plan data:', err);
        setError('Failed to load plan for editing');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanData();
  }, [editReportId]);

  if (isLoading) {
    return (
      <WizardGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading plan data...</p>
          </div>
        </div>
      </WizardGuard>
    );
  }

  if (error) {
    return (
      <WizardGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <p className="text-destructive mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="text-primary hover:underline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </WizardGuard>
    );
  }

  return (
    <WizardGuard>
      <PlanWizard
        mode={editReportId ? 'edit' : 'create'}
        existingPlanId={editReportId || undefined}
        initialData={initialData}
      />
    </WizardGuard>
  );
}
