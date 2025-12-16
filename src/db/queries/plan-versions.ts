import { db } from '@/db';
import { planVersions, missionReports } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Create a new version snapshot before editing
 */
export async function createPlanVersion(
  reportId: string,
  userId: string,
  changesSummary?: string,
  editReason?: string
): Promise<{ versionId: string; versionNumber: number } | null> {
  try {
    // Get current plan data
    const [currentPlan] = await db
      .select()
      .from(missionReports)
      .where(eq(missionReports.id, reportId))
      .limit(1);

    if (!currentPlan) return null;

    // Get latest version number
    const [latestVersion] = await db
      .select({ versionNumber: planVersions.versionNumber, id: planVersions.id })
      .from(planVersions)
      .where(eq(planVersions.missionReportId, reportId))
      .orderBy(desc(planVersions.versionNumber))
      .limit(1);

    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    // Create version snapshot
    const [version] = await db
      .insert(planVersions)
      .values({
        missionReportId: reportId,
        versionNumber: nextVersionNumber,
        parentVersionId: latestVersion?.id,

        // Full data snapshot
        title: currentPlan.title,
        location: currentPlan.location,
        scenarios: currentPlan.scenarios,
        familySize: currentPlan.familySize,
        durationDays: currentPlan.durationDays,
        mobilityType: currentPlan.mobilityType,
        budgetAmount: currentPlan.budgetAmount,
        reportData: currentPlan.reportData,
        evacuationRoutes: currentPlan.evacuationRoutes,
        readinessScore: currentPlan.readinessScore,
        scenarioScores: currentPlan.scenarioScores,
        componentScores: currentPlan.componentScores,

        // Metadata
        changesSummary,
        editedByUserId: userId,
        editReason,
      })
      .returning({ id: planVersions.id, versionNumber: planVersions.versionNumber });

    return { versionId: version.id, versionNumber: version.versionNumber };
  } catch (error) {
    console.error('Error creating plan version:', error);
    return null;
  }
}

/**
 * Get version history for a plan
 */
export async function getPlanVersionHistory(reportId: string): Promise<
  Array<{
    id: string;
    versionNumber: number;
    changesSummary: string | null;
    editedByUserId: string;
    editReason: string | null;
    createdAt: Date;
  }>
> {
  const versions = await db
    .select({
      id: planVersions.id,
      versionNumber: planVersions.versionNumber,
      changesSummary: planVersions.changesSummary,
      editedByUserId: planVersions.editedByUserId,
      editReason: planVersions.editReason,
      createdAt: planVersions.createdAt,
    })
    .from(planVersions)
    .where(eq(planVersions.missionReportId, reportId))
    .orderBy(desc(planVersions.versionNumber));

  return versions;
}

/**
 * Rollback to a specific version
 */
export async function rollbackToVersion(
  reportId: string,
  versionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [targetVersion] = await db
      .select()
      .from(planVersions)
      .where(and(eq(planVersions.id, versionId), eq(planVersions.missionReportId, reportId)))
      .limit(1);

    if (!targetVersion) {
      return { success: false, error: 'Version not found' };
    }

    // Update mission report with version data
    await db
      .update(missionReports)
      .set({
        title: targetVersion.title,
        location: targetVersion.location,
        scenarios: targetVersion.scenarios,
        familySize: targetVersion.familySize,
        durationDays: targetVersion.durationDays,
        mobilityType: targetVersion.mobilityType,
        budgetAmount: targetVersion.budgetAmount,
        reportData: targetVersion.reportData,
        evacuationRoutes: targetVersion.evacuationRoutes,
        readinessScore: targetVersion.readinessScore,
        scenarioScores: targetVersion.scenarioScores,
        componentScores: targetVersion.componentScores,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, reportId));

    // Create new version to track rollback
    await createPlanVersion(
      reportId,
      userId,
      `Rolled back to version ${targetVersion.versionNumber}`,
      `Rollback to version ${targetVersion.versionNumber}`
    );

    return { success: true };
  } catch (error) {
    console.error('Error rolling back to version:', error);
    return { success: false, error: 'Failed to rollback' };
  }
}
