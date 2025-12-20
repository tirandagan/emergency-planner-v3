import { db } from '@/db';
import { missionReports } from '@/db/schema/mission-reports';
import { getLatestMissionReport, deleteMissionReport } from '@/lib/mission-reports';
import { eq } from 'drizzle-orm';
import type { ReportDataV2 } from '@/types/mission-report';

/**
 * Save Mission Report V2 to Database
 * Persists streaming-generated mission plans with bundle recommendations
 */

export interface SaveMissionReportV2Params {
  userId: string;
  reportData: ReportDataV2;
  userTier?: string;
}

export interface SaveMissionReportV2Result {
  reportId: string;
  previousReportId?: string;
}

/**
 * Save a V2 mission report to the database
 */
export async function saveMissionReportV2({
  userId,
  reportData,
  userTier = 'FREE',
}: SaveMissionReportV2Params): Promise<SaveMissionReportV2Result> {
  try {
    const { formData, sections, metadata } = reportData;

    // For FREE tier users, get the existing plan ID (we'll delete it AFTER saving the new one)
    let previousReportId: string | undefined;
    if (userTier === 'FREE') {
      const existingReport = await getLatestMissionReport(userId);
      if (existingReport) {
        previousReportId = existingReport.id;
      }
    }

    // Generate a title from scenarios
    const title = generateReportTitle(formData);

    // Build location string
    const location =
      formData.location.city && formData.location.state
        ? `${formData.location.city}, ${formData.location.state}`
        : formData.location.fullAddress;

    // Calculate readiness score from risk assessment
    const readinessScore = calculateReadinessScore(sections.riskAssessment);

    // Build scenario scores from bundles
    const scenarioScores = buildScenarioScores(sections);

    // Build component scores
    const componentScores = buildComponentScores(sections);

    // Insert the new report first (before deleting old one)
    const [report] = await db
      .insert(missionReports)
      .values({
        userId,
        title,
        location,
        scenarios: formData.scenarios,
        familySize: formData.familyMembers.length,
        durationDays: formData.durationDays,
        reportData: reportData as any, // JSONB accepts any structure
        personnelData: formData.familyMembers, // Store personnel data from wizard
        readinessScore,
        scenarioScores,
        componentScores,
      })
      .returning({ id: missionReports.id });

    // Only after successful insert, delete the old plan for FREE tier users
    if (previousReportId) {
      await deleteMissionReport(previousReportId);
    }

    return { reportId: report.id, previousReportId };
  } catch (error) {
    console.error('Failed to save mission report V2:', error);
    throw new Error('Failed to save mission report to database');
  }
}

/**
 * Note: evacuationRoutes are now stored in mission_reports.evacuation_routes field
 * and are updated via background-tasks.ts updateReportRoutes() function
 */

/**
 * Generate a human-readable title from form data
 */
function generateReportTitle(formData: ReportDataV2['formData']): string {
  const scenarioNames = formData.scenarios
    .map((s) => {
      // Convert kebab-case to Title Case
      return s
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    })
    .join(', ');

  const location =
    formData.location.city && formData.location.state
      ? `${formData.location.city}, ${formData.location.state}`
      : 'Custom Location';

  return `${scenarioNames} - ${location}`;
}

/**
 * Calculate readiness score from risk assessment
 * Higher score = better prepared, lower risk
 */
function calculateReadinessScore(
  riskAssessment: ReportDataV2['sections']['riskAssessment']
): number {
  let score = 50; // Base score

  // Risk to Life impact
  switch (riskAssessment.riskToLife) {
    case 'LOW':
      score += 25;
      break;
    case 'MEDIUM':
      score += 10;
      break;
    case 'HIGH':
      score -= 10;
      break;
  }

  // Evacuation urgency impact
  switch (riskAssessment.evacuationUrgency) {
    case 'SHELTER_IN_PLACE':
      score += 15;
      break;
    case 'RECOMMENDED':
      score += 5;
      break;
    case 'IMMEDIATE':
      score -= 5;
      break;
  }

  // Key threats impact (more threats = lower score)
  score -= Math.min(riskAssessment.keyThreats.length * 2, 10);

  // Location factors (neutral, but having them identified is good)
  score += Math.min(riskAssessment.locationFactors.length, 5);

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Build scenario scores from sections
 */
function buildScenarioScores(
  sections: ReportDataV2['sections']
): Record<string, number> {
  const scores: Record<string, number> = {};

  // Score based on bundle fit scores
  for (const bundle of sections.bundles) {
    for (const scenario of bundle.scenarios) {
      const normalizedScenario = scenario.toLowerCase().replace(/_/g, '-');
      if (!scores[normalizedScenario]) {
        scores[normalizedScenario] = bundle.fitScore;
      } else {
        // Average with existing score
        scores[normalizedScenario] = Math.round(
          (scores[normalizedScenario] + bundle.fitScore) / 2
        );
      }
    }
  }

  return scores;
}

/**
 * Build component scores from sections
 */
function buildComponentScores(
  sections: ReportDataV2['sections']
): Record<string, number> {
  return {
    // Based on number of bundles recommended
    supplies: Math.min(sections.bundles.length * 25, 100),

    // Based on number of skills identified
    skills: Math.min(sections.skills.length * 14, 100),

    // Based on simulation completeness
    planning: sections.simulation.length > 0 ? 75 : 0,

    // Based on next steps
    actionItems: Math.min(sections.nextSteps.length * 20, 100),
  };
}
