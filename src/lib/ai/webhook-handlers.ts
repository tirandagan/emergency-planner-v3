import { db } from '@/db';
import { missionReports } from '@/db/schema/mission-reports';
import { eq, desc, and, isNull } from 'drizzle-orm';
import type { ReportDataV2 } from '@/types/mission-report';
import type { EmergencyContactsSection } from '@/types/emergency-contacts';
import { revalidatePath } from 'next/cache';

/**
 * Handle completion of the emergency_contacts workflow
 * Updates the most recent mission report for the user with the generated contacts
 */
export async function handleEmergencyContactsComplete(
  userId: string,
  result: any
): Promise<void> {
  try {
    console.log(`[Webhook] Processing emergency_contacts for user ${userId}`);

    // 1. Find the latest mission report for this user
    // We update the latest plan since manual curl submissions don't include a reportId
    const [report] = await db
      .select()
      .from(missionReports)
      .where(
        and(
          eq(missionReports.userId, userId),
          isNull(missionReports.deletedAt)
        )
      )
      .orderBy(desc(missionReports.createdAt))
      .limit(1);

    if (!report) {
      console.warn(`[Webhook] No active mission report found for user ${userId}`);
      return;
    }

    // 2. Extract structured data from result.output
    // The LLM service returns the final workflow output in result.output
    // Based on emergency_contacts.json, this is the JSON result from the parse_contacts step.
    const output = result?.output;
    
    if (!output) {
      console.warn(`[Webhook] Missing output in LLM result for job ${result?.job_id}`);
      return;
    }

    // Handle both cases: output is the data directly, or output has a data property
    const data = output.contacts ? output : output.data;

    if (!data || !data.contacts) {
      console.warn(`[Webhook] Invalid output structure for user ${userId}. Result keys: ${Object.keys(output || {})}`);
      return;
    }

    const reportData = report.reportData as ReportDataV2;
    
    // 3. Update the emergencyContacts section
    // Use the standard EmergencyContactsSection interface
    const emergencyContacts: EmergencyContactsSection = {
      contacts: data.contacts,
      meetingLocations: data.meeting_locations || data.meetingLocations || [],
      generatedAt: new Date().toISOString(),
      locationContext: report.location || 'Unknown',
      googlePlacesUsed: true,
      aiAnalysisUsed: true,
    };

    const updatedReportData: ReportDataV2 = {
      ...reportData,
      sections: {
        ...reportData.sections,
        emergencyContacts,
      },
    };

    // 4. Save back to database
    await db
      .update(missionReports)
      .set({
        reportData: updatedReportData,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, report.id));

    console.log(`[Webhook] Successfully updated emergency contacts for report ${report.id}`);

    // 5. Revalidate path to ensure UI shows new data
    revalidatePath(`/plans/${report.id}`, 'page');
    revalidatePath('/plans', 'page');
    
  } catch (error) {
    console.error('[Webhook] Error handling emergency_contacts completion:', error);
  }
}

