import { db } from '@/db';
import { missionReports } from '@/db/schema/mission-reports';
import { getLatestMissionReport, deleteMissionReport } from '@/lib/mission-reports';
import { eq } from 'drizzle-orm';
import type { MissionPlanResult } from './mission-generator';
import type { WizardFormData } from '@/types/wizard';

/**
 * Save Mission Report to Database
 * Persists AI-generated mission plans to the database
 */

export interface SaveMissionReportParams {
  userId: string;
  missionPlan: MissionPlanResult;
  userTier?: string;
}

/**
 * Save a generated mission plan to the database
 */
export interface SaveMissionReportResult {
  reportId: string;
  previousReportId?: string;
}

export async function saveMissionReport({
  userId,
  missionPlan,
  userTier = 'FREE',
}: SaveMissionReportParams): Promise<SaveMissionReportResult> {
  try {
    const { formData, content, metadata } = missionPlan;

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
        budgetAmount: getBudgetAmount(formData.budgetTier).toString(),
        reportData: {
          content,
          formData,
          metadata,
          generatedWith: 'ai',
          version: '1.0',
        },
        // TODO: Calculate these scores from the generated content
        readinessScore: null,
        scenarioScores: null,
        componentScores: null,
      })
      .returning({ id: missionReports.id });

    // Only after successful insert, delete the old plan for FREE tier users
    if (previousReportId) {
      await deleteMissionReport(previousReportId);
    }

    return { reportId: report.id, previousReportId };
  } catch (error) {
    console.error('Failed to save mission report:', error);
    throw new Error('Failed to save mission report to database');
  }
}

/**
 * Generate a human-readable title from form data
 */
function generateReportTitle(formData: WizardFormData): string {
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
 * Get budget amount from tier
 */
function getBudgetAmount(tier: string): number {
  const budgetMap = {
    LOW: 350, // Mid-point of <$500
    MEDIUM: 1000, // Mid-point of $500-1500
    HIGH: 2000, // Example premium budget $1500+
  };

  return budgetMap[tier as keyof typeof budgetMap] || 1000;
}

/**
 * Update an existing mission report
 */
export async function updateMissionReport(
  reportId: string,
  updates: Partial<{
    title: string;
    reportData: any;
    readinessScore: number;
    scenarioScores: any;
    componentScores: any;
  }>
) {
  try {
    await db
      .update(missionReports)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, reportId));

    return reportId;
  } catch (error) {
    console.error('Failed to update mission report:', error);
    throw new Error('Failed to update mission report');
  }
}

