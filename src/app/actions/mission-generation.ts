/**
 * Server Actions for Mission Generation
 * Handles job submission, cancellation, and webhook-based completion
 */

'use server';

import { createClient } from '@/utils/supabase/server';
import { db } from '@/db';
import { bundles } from '@/db/schema/bundles';
import { missionReports } from '@/db/schema/mission-reports';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { WizardFormData, FamilyMember } from '@/types/wizard';

const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
const LLM_WEBHOOK_SECRET = process.env.LLM_WEBHOOK_SECRET;
const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/llm-callback`;

/**
 * Format family member details for prompt context
 */
function formatFamilyDetails(familyMembers: FamilyMember[]): string {
  return familyMembers
    .map((member, idx) => {
      const ageGroup = member.age < 18 ? 'child' : member.age >= 65 ? 'senior' : 'adult';
      const details = [`Person ${idx + 1}: ${ageGroup} (age ${member.age})`];

      if (member.medicalConditions) {
        details.push(`medical: ${member.medicalConditions}`);
      }

      if (member.specialNeeds) {
        details.push(`special needs: ${member.specialNeeds}`);
      }

      return details.join('; ');
    })
    .join('\n');
}

/**
 * Format mobility plan for workflow input
 */
function formatMobilityPlan(homeType: string): string {
  // For now, we assume shelter-in-place (BUG_IN) based on home type
  // This can be expanded later if mobility preferences are added to the wizard
  const isMobile = homeType === 'mobile';
  return isMobile
    ? 'Bug Out (evacuation planned due to mobile home)'
    : 'Bug In (shelter in place)';
}

/**
 * Fetch bundles for AI recommendation context
 */
async function getBundlesForRecommendation(): Promise<
  Array<{
    id: string;
    name: string;
    description: string | null;
    price: string | null;
    category: string;
  }>
> {
  const allBundles = await db
    .select({
      id: bundles.id,
      name: bundles.name,
      description: bundles.description,
      price: bundles.totalEstimatedPrice,
      scenarios: bundles.scenarios,
    })
    .from(bundles);

  return allBundles.map((bundle) => ({
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,
    price: bundle.price,
    category: bundle.scenarios?.[0] || 'general',
  }));
}

/**
 * Submit a mission generation job to the LLM service
 * Creates a pending mission_report record and submits the workflow job
 *
 * @param formData - Wizard form data with scenarios, family, location, etc.
 * @returns Promise with jobId and reportId
 */
export async function submitMissionGenerationJob(formData: WizardFormData): Promise<{
  jobId: string;
  reportId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!LLM_WEBHOOK_SECRET) {
    throw new Error('LLM service not configured');
  }

  try {
    // 1. Fetch bundles for recommendation context
    const bundleList = await getBundlesForRecommendation();

    // 2. Transform wizard data to workflow input format
    const inputData = {
      formData: {
        scenarios: formData.scenarios,
        location: {
          city: formData.location.city,
          state: formData.location.state,
          climateZone: formData.location.climateZone,
        },
        familySize: formData.familyMembers.length,
        durationDays: formData.durationDays,
        homeType: formData.homeType,
      },
      bundles: bundleList,
      familyDetails: formatFamilyDetails(formData.familyMembers),
      mobility: formatMobilityPlan(formData.homeType),
    };

    // 3. Submit job to LLM service with webhook callback
    const response = await fetch(`${LLM_SERVICE_URL}/api/v1/workflow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': LLM_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        workflow_name: 'mission_generation',
        input_data: inputData,
        user_id: user.id,
        webhook_url: WEBHOOK_URL,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));

      console.error('[Mission Generation] Job submission failed:', errorData);
      throw new Error(errorData.error || 'Failed to submit mission generation job');
    }

    const { job_id: jobId } = await response.json();

    // 4. Create pending mission_report record
    const locationString = `${formData.location.city}, ${formData.location.state}`;
    const scenarioNames = formData.scenarios
      .map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()))
      .join(', ');

    const [report] = await db
      .insert(missionReports)
      .values({
        userId: user.id,
        jobId,
        status: 'generating',
        title: `${scenarioNames} Plan - ${locationString}`,
        location: locationString,
        scenarios: formData.scenarios,
        familySize: formData.familyMembers.length,
        durationDays: formData.durationDays,
        mobilityType: formatMobilityPlan(formData.homeType).toLowerCase().includes('out')
          ? 'bug_out'
          : 'bug_in',
        personnelData: formData.familyMembers,
        reportData: {
          version: '2.0',
          generatedWith: 'llm_service',
          formData,
          content: '',
          sections: {} as any,
          metadata: {} as any,
        },
      })
      .returning();

    // 5. Revalidate paths
    revalidatePath('/dashboard', 'page');
    revalidatePath('/plans', 'page');

    return { jobId, reportId: report.id };
  } catch (error) {
    console.error('[Mission Generation] Job submission error:', error);
    throw error;
  }
}

/**
 * Cancel a mission generation job and delete the associated report
 *
 * @param reportId - The mission report ID to cancel
 * @returns Promise with success status
 */
export async function cancelMissionGenerationJob(reportId: string): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!LLM_WEBHOOK_SECRET) {
    throw new Error('LLM service not configured');
  }

  try {
    // 1. Get report and verify ownership
    const [report] = await db
      .select()
      .from(missionReports)
      .where(eq(missionReports.id, reportId))
      .limit(1);

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.userId !== user.id) {
      throw new Error('Unauthorized - you do not own this report');
    }

    if (!report.jobId) {
      throw new Error('No job associated with this report');
    }

    // 2. Cancel job in LLM service
    const response = await fetch(`${LLM_SERVICE_URL}/api/v1/jobs/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Secret': LLM_WEBHOOK_SECRET,
      },
      body: JSON.stringify({ job_ids: [report.jobId] }),
    });

    if (!response.ok) {
      console.error('[Mission Generation] Job cancellation failed');
      // Continue with deletion even if cancellation fails
    }

    // 3. Delete mission_report record
    await db.delete(missionReports).where(eq(missionReports.id, reportId));

    // 4. Revalidate paths
    revalidatePath('/dashboard', 'page');
    revalidatePath('/plans', 'page');

    return { success: true };
  } catch (error) {
    console.error('[Mission Generation] Job cancellation error:', error);
    throw error;
  }
}
