"use client";

import dynamic from 'next/dynamic';
import { WizardGuard } from '@/components/plans/wizard/WizardGuard';

// Disable SSR for the wizard to prevent hydration issues
const PlanWizard = dynamic(
  () => import('@/components/plans/wizard/PlanWizard').then(mod => mod.PlanWizard),
  { ssr: false }
);

export default function WizardTestPage() {
  return (
    <WizardGuard>
      <PlanWizard />
    </WizardGuard>
  );
}