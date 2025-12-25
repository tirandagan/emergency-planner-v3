import { db } from '@/db';
import { missionReports } from '@/db/schema/mission-reports';
import { eq, desc, and, isNull } from 'drizzle-orm';
import type {
  ReportDataV2,
  RiskIndicators,
  BundleRecommendation,
  SkillItem,
  SimulationDay,
} from '@/types/mission-report';
import type { EmergencyContactsSection } from '@/types/emergency-contacts';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

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
    const output = result?.output;

    if (!output) {
      console.warn(`[Webhook] Missing output in LLM result for job ${result?.job_id}`);
      return;
    }

    // Handle both cases: output is the data directly, or output has a data property
    // result.output is the final result of the last step (parse_contacts)
    // which returns { contacts: [...], meeting_locations: [...] }
    const data = output.contacts ? output : output.data;

    if (!data || !data.contacts) {
      console.warn(`[Webhook] Invalid output structure for user ${userId}. Keys: ${Object.keys(output || {})}`);
      // Fallback: search deep for contacts
      if (output.result?.output?.contacts) {
        return handleEmergencyContactsComplete(userId, output.result);
      }
      return;
    }

    const reportData = report.reportData as ReportDataV2;

    // 3. Update the emergencyContacts section
    // Map snake_case from LLM service to camelCase for Next.js types
    const emergencyContacts: EmergencyContactsSection = {
      contacts: data.contacts.map((c: any) => ({
        id: c.id || uuidv4(),
        name: c.name || 'Unknown',
        type: (c.type || 'professional').toLowerCase() as any,
        category: (c.category || 'government').toLowerCase() as any,
        phone: c.phone || 'N/A',
        website: c.website || undefined,
        address: c.address || undefined,
        reasoning: c.reasoning || '',
        relevantScenarios: c.relevant_scenarios || c.relevantScenarios || [],
        priority: String(c.priority || 'helpful').toLowerCase() as any,
        fitScore: Number(c.fit_score || c.fitScore || 80),
        region: (c.region || 'local').toLowerCase() as any,
        availability24hr: !!(c.available_24hr || c.availability24hr || false),
        source: (c.source || 'ai').toLowerCase() as any,
      })),
      meetingLocations: (data.meeting_locations || data.meetingLocations || []).map((l: any) => ({
        id: l.id || uuidv4(),
        name: l.name || 'Unknown Location',
        address: l.address || 'Unknown Address',
        description: l.description || l.reasoning || '',
        placeId: l.placeId || '',
        location: l.location || { lat: 0, lng: 0 },
        placeType: l.placeType || 'meeting_point',
        reasoning: l.reasoning || '',
        scenarioSuitability: l.suitable_for || l.scenarioSuitability || [],
        priority: String(l.priority || 'primary').toLowerCase() as any,
        isPublic: l.isPublic ?? true,
        hasParking: !!(l.has_parking || l.hasParking || false),
        isAccessible: !!(l.is_accessible || l.isAccessible || false),
      })),
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

/**
 * Handle completion of the mission_generation workflow
 * Updates the mission_report with the generated plan content and parsed sections
 */
export async function handleMissionGenerationComplete(
  userId: string,
  jobId: string,
  result: any
): Promise<void> {
  try {
    console.log(`[Webhook] Processing mission_generation for user ${userId}, job ${jobId}`);

    // 1. Find mission_report by job_id
    const [report] = await db
      .select()
      .from(missionReports)
      .where(eq(missionReports.jobId, jobId))
      .limit(1);

    if (!report) {
      console.warn(`[Webhook] No mission report found for job ${jobId}`);
      return;
    }

    // 2. Extract workflow output
    const output = result?.output;

    if (!output || !output.mission_plan) {
      console.error(`[Webhook] Invalid output structure for job ${jobId}. Keys: ${Object.keys(output || {})}`);

      // Mark report as failed
      await db
        .update(missionReports)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(missionReports.id, report.id));

      return;
    }

    const missionPlan = output.mission_plan;
    const parsedSections = output.parsed_sections || {};
    const llmUsage = output.llm_usage || {};

    // 3. Parse sections into ReportDataV2 structure
    // Note: Since the workflow provides raw text sections, we'll store them as-is
    // The UI can handle parsing markdown content into structured data
    const reportData: ReportDataV2 = {
      version: '2.0',
      generatedWith: 'streaming_bundles',
      content: missionPlan,
      sections: {
        executiveSummary: parsedSections.executive_summary || '',
        riskAssessment: parseRiskAssessment(parsedSections.risk_assessment || ''),
        bundles: parseBundleRecommendations(parsedSections.recommended_bundles || ''),
        skills: parseSkills(parsedSections.survival_skills || ''),
        simulation: parseSimulation(parsedSections.day_by_day || ''),
        nextSteps: parseNextSteps(parsedSections.next_steps || ''),
      },
      formData: (report.reportData as ReportDataV2).formData,
      metadata: {
        model: llmUsage.model || 'anthropic/claude-3.5-sonnet',
        streamDurationMs: llmUsage.duration_ms || 0,
        generatedAt: new Date().toISOString(),
        tokensUsed: llmUsage.total_tokens || 0,
        inputTokens: llmUsage.input_tokens || 0,
        outputTokens: llmUsage.output_tokens || 0,
      },
    };

    // 4. Update mission_report status and data
    await db
      .update(missionReports)
      .set({
        status: 'completed',
        reportData,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, report.id));

    console.log(`[Webhook] Mission generation complete for report ${report.id}`);

    // 5. Revalidate paths
    revalidatePath(`/plans/${report.id}`, 'page');
    revalidatePath('/dashboard', 'page');
    revalidatePath('/plans', 'page');

  } catch (error) {
    console.error('[Webhook] Error handling mission_generation completion:', error);

    // Mark report as failed
    try {
      await db
        .update(missionReports)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(missionReports.jobId, jobId));
    } catch (updateError) {
      console.error('[Webhook] Failed to mark report as failed:', updateError);
    }
  }
}

/**
 * Parse risk assessment text into structured format
 * For now, returns a simple structure - can be enhanced with regex parsing
 */
function parseRiskAssessment(text: string): RiskIndicators {
  // Basic parsing - in production, use regex to extract structured data
  return {
    riskToLife: 'MEDIUM',
    riskToLifeReason: text.substring(0, 200),
    evacuationUrgency: 'SHELTER_IN_PLACE',
    evacuationReason: '',
    keyThreats: [],
    locationFactors: [],
  };
}

/**
 * Parse bundle recommendations from markdown text
 * For now, returns empty array - can be enhanced with regex parsing
 */
function parseBundleRecommendations(text: string): BundleRecommendation[] {
  // Basic parsing - in production, parse markdown structure
  return [];
}

/**
 * Parse skills from markdown text
 */
function parseSkills(text: string): SkillItem[] {
  // Basic parsing - in production, parse markdown list
  return [];
}

/**
 * Parse simulation days from markdown text
 */
function parseSimulation(text: string): SimulationDay[] {
  // Basic parsing - in production, parse markdown structure
  return [];
}

/**
 * Parse next steps from markdown text
 */
function parseNextSteps(text: string): string[] {
  // Basic parsing - extract bullet points
  const lines = text.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
  return lines.map(l => l.replace(/^[-*]\s*/, '').trim());
}
