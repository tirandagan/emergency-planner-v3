import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/queries/users';
import { db } from '@/db';
import { missionReports } from '@/db/schema/mission-reports';
import { eq } from 'drizzle-orm';
import { PlanWizardClient } from './PlanWizardClient';
import { transformReportToWizardData } from '@/lib/wizard/transform-plan-data';
import type { WizardFormData, FamilyMember } from '@/types/wizard';

interface PageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default async function NewPlanPage({ searchParams }: PageProps): Promise<React.ReactElement> {
  // Get current user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth/login');
  }

  // Fetch user profile with household members using Drizzle ORM
  const userProfile = await getUserProfile(user.id);

  // Extract household members and save preference
  const savedHouseholdMembers: FamilyMember[] | undefined = userProfile?.householdMembers ?? undefined;
  const saveHouseholdPreference: boolean = userProfile?.saveHouseholdPreference ?? true;

  // Handle edit mode
  const { edit: editReportId } = await searchParams;
  let initialData: Partial<WizardFormData> | undefined;

  if (editReportId) {
    const [report] = await db
      .select()
      .from(missionReports)
      .where(eq(missionReports.id, editReportId))
      .limit(1);

    if (report && report.userId === user.id) {
      initialData = transformReportToWizardData(report as any);
    }
  }

  return (
    <PlanWizardClient
      mode={editReportId ? 'edit' : 'create'}
      existingPlanId={editReportId || undefined}
      initialData={initialData}
      savedHouseholdMembers={savedHouseholdMembers}
      saveHouseholdPreference={saveHouseholdPreference}
    />
  );
}
