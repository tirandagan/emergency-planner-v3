"use client";

import dynamic from 'next/dynamic';
import { WizardGuard } from '@/components/plans/wizard/WizardGuard';
import type { WizardFormData, FamilyMember } from '@/types/wizard';

// Disable SSR for the wizard to prevent hydration issues
const PlanWizard = dynamic(
  () => import('@/components/plans/wizard/PlanWizard').then(mod => mod.PlanWizard),
  { ssr: false }
);

interface PlanWizardClientProps {
  mode?: 'create' | 'edit';
  existingPlanId?: string;
  initialData?: Partial<WizardFormData>;
  savedHouseholdMembers?: FamilyMember[];
  saveHouseholdPreference: boolean;
}

export function PlanWizardClient({
  mode = 'create',
  existingPlanId,
  initialData,
  savedHouseholdMembers,
  saveHouseholdPreference,
}: PlanWizardClientProps): React.ReactElement {
  return (
    <WizardGuard>
      <PlanWizard
        mode={mode}
        existingPlanId={existingPlanId}
        initialData={initialData}
        savedHouseholdMembers={savedHouseholdMembers}
        saveHouseholdPreference={saveHouseholdPreference}
      />
    </WizardGuard>
  );
}
