import { db } from '@/db';
import { missionReports, planShares, profiles } from '@/db/schema';
import { eq, and, isNull, desc, sql, gt, isNotNull, lt, inArray } from 'drizzle-orm';
import { getDeletedPlansRetentionDays } from '@/db/queries/system-settings';
import { TIER_SHARE_LIMITS } from '@/types/plan-share';

export interface MissionReport {
  id: string;
  userId: string;
  title: string;
  location: string | null;
  scenarios: string[];
  familySize: number;
  durationDays: number;
  mobilityType: string | null;
  budgetAmount: string | null;
  reportData: {
    content: string;
    formData: any;
    metadata: {
      model: string;
      generatedAt: string;
    };
    generatedWith: string;
    version: string;
  };
  evacuationRoutes?: any; // Separate field for evacuation routes
  readinessScore: number | null;
  scenarioScores: any;
  componentScores: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get a mission report by ID
 * Only returns non-deleted reports
 */
export async function getMissionReportById(
  reportId: string
): Promise<MissionReport | null> {
  const [report] = await db
    .select()
    .from(missionReports)
    .where(and(eq(missionReports.id, reportId), isNull(missionReports.deletedAt)))
    .limit(1);

  if (!report) {
    return null;
  }

  return report as MissionReport;
}

/**
 * Get all mission reports for a user
 * Only returns non-deleted reports
 */
export async function getMissionReportsByUserId(
  userId: string
): Promise<MissionReport[]> {
  const reports = await db
    .select()
    .from(missionReports)
    .where(and(eq(missionReports.userId, userId), isNull(missionReports.deletedAt)))
    .orderBy(missionReports.createdAt);

  return reports as MissionReport[];
}

/**
 * Check if a user owns a mission report
 */
export async function userOwnsMissionReport(
  userId: string,
  reportId: string
): Promise<boolean> {
  const [report] = await db
    .select({ id: missionReports.id })
    .from(missionReports)
    .where(
      and(
        eq(missionReports.id, reportId),
        eq(missionReports.userId, userId),
        isNull(missionReports.deletedAt)
      )
    )
    .limit(1);

  return !!report;
}

/**
 * Get count of active mission reports for a user
 */
export async function getMissionReportCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: missionReports.id })
    .from(missionReports)
    .where(and(eq(missionReports.userId, userId), isNull(missionReports.deletedAt)));

  return result.length;
}

/**
 * Get the most recent mission report for a user (for free tier)
 */
export async function getLatestMissionReport(
  userId: string
): Promise<MissionReport | null> {
  const [report] = await db
    .select()
    .from(missionReports)
    .where(and(eq(missionReports.userId, userId), isNull(missionReports.deletedAt)))
    .orderBy(desc(missionReports.createdAt))
    .limit(1);

  if (!report) {
    return null;
  }

  return report as MissionReport;
}

/**
 * Delete (soft delete) a mission report
 */
export async function deleteMissionReport(reportId: string): Promise<void> {
  await db
    .update(missionReports)
    .set({ deletedAt: new Date() })
    .where(eq(missionReports.id, reportId));
}

/**
 * Get share count and details for a mission report
 */
export async function getPlanSharesByMissionReport(reportId: string): Promise<
  Array<{
    id: string;
    sharedWithEmail: string;
    shareToken: string;
    permissions: string;
    expiresAt: Date;
    createdAt: Date;
    accessedAt: Date | null;
    isDisabled: boolean;
    disabledReason: string | null;
  }>
> {
  const shares = await db
    .select({
      id: planShares.id,
      sharedWithEmail: planShares.sharedWithEmail,
      shareToken: planShares.shareToken,
      permissions: planShares.permissions,
      expiresAt: planShares.expiresAt,
      createdAt: planShares.createdAt,
      accessedAt: planShares.accessedAt,
      isDisabled: planShares.isDisabled,
      disabledReason: planShares.disabledReason,
    })
    .from(planShares)
    .where(eq(planShares.missionReportId, reportId))
    .orderBy(desc(planShares.createdAt));

  return shares.map((share) => ({
    ...share,
    expiresAt: new Date(share.expiresAt),
    createdAt: new Date(share.createdAt),
    accessedAt: share.accessedAt ? new Date(share.accessedAt) : null,
  }));
}

/**
 * Get user's total share count across all plans
 */
export async function getUserShareCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(planShares)
    .where(eq(planShares.sharedByUserId, userId));

  return result?.count || 0;
}

/**
 * Validate share link token and check expiration
 * Returns null if token is invalid or expired
 */
export async function getPlanShareByToken(token: string): Promise<{
  id: string;
  missionReportId: string;
  sharedByUserId: string;
  sharedWithEmail: string;
  permissions: string;
  expiresAt: Date;
  accessedAt: Date | null;
} | null> {
  const [share] = await db
    .select({
      id: planShares.id,
      missionReportId: planShares.missionReportId,
      sharedByUserId: planShares.sharedByUserId,
      sharedWithEmail: planShares.sharedWithEmail,
      permissions: planShares.permissions,
      expiresAt: planShares.expiresAt,
      accessedAt: planShares.accessedAt,
    })
    .from(planShares)
    .where(
      and(
        eq(planShares.shareToken, token),
        gt(planShares.expiresAt, sql`NOW()`)
      )
    )
    .limit(1);

  if (!share) {
    return null;
  }

  return {
    ...share,
    expiresAt: new Date(share.expiresAt),
    accessedAt: share.accessedAt ? new Date(share.accessedAt) : null,
  };
}

/**
 * Update accessed_at timestamp when a share link is accessed
 */
export async function markShareAsAccessed(shareId: string): Promise<void> {
  await db
    .update(planShares)
    .set({ accessedAt: new Date() })
    .where(eq(planShares.id, shareId));
}

/**
 * Get all soft-deleted plans for a user within the retention window
 */
export async function getDeletedPlans(userId: string): Promise<
  Array<{
    id: string;
    title: string;
    deletedAt: Date;
    daysUntilPermanentDeletion: number;
    canRestore: boolean;
  }>
> {
  const retentionDays = await getDeletedPlansRetentionDays();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const deletedPlans = await db
    .select({
      id: missionReports.id,
      title: missionReports.title,
      deletedAt: missionReports.deletedAt,
    })
    .from(missionReports)
    .where(
      and(
        eq(missionReports.userId, userId),
        isNotNull(missionReports.deletedAt),
        gt(missionReports.deletedAt, cutoffDate)
      )
    )
    .orderBy(desc(missionReports.deletedAt));

  return deletedPlans.map((plan) => {
    const deletedDate = new Date(plan.deletedAt!);
    const expirationDate = new Date(deletedDate);
    expirationDate.setDate(expirationDate.getDate() + retentionDays);

    const daysUntil = Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      id: plan.id,
      title: plan.title,
      deletedAt: deletedDate,
      daysUntilPermanentDeletion: daysUntil,
      canRestore: daysUntil > 0,
    };
  });
}

/**
 * Restore a soft-deleted plan
 */
export async function restorePlan(
  reportId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership and deletion status
    const [plan] = await db
      .select({
        id: missionReports.id,
        deletedAt: missionReports.deletedAt,
      })
      .from(missionReports)
      .where(
        and(
          eq(missionReports.id, reportId),
          eq(missionReports.userId, userId),
          isNotNull(missionReports.deletedAt)
        )
      )
      .limit(1);

    if (!plan) {
      return { success: false, error: 'Plan not found or already restored' };
    }

    // Check if within retention window
    const retentionDays = await getDeletedPlansRetentionDays();
    const deletedDate = new Date(plan.deletedAt!);
    const expirationDate = new Date(deletedDate);
    expirationDate.setDate(expirationDate.getDate() + retentionDays);

    if (Date.now() > expirationDate.getTime()) {
      return { success: false, error: 'Plan is beyond recovery window' };
    }

    // Restore by setting deletedAt to null
    await db
      .update(missionReports)
      .set({
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, reportId));

    return { success: true };
  } catch (error) {
    console.error('Error restoring plan:', error);
    return { success: false, error: 'Failed to restore plan' };
  }
}

/**
 * Permanently delete plans beyond retention window (admin function)
 */
export async function cleanupOldDeletedPlans(): Promise<{
  deletedCount: number;
  error?: string;
}> {
  try {
    const retentionDays = await getDeletedPlansRetentionDays();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Find plans to delete
    const plansToDelete = await db
      .select({ id: missionReports.id })
      .from(missionReports)
      .where(and(isNotNull(missionReports.deletedAt), lt(missionReports.deletedAt, cutoffDate)));

    if (plansToDelete.length === 0) {
      return { deletedCount: 0 };
    }

    // Permanent deletion (CASCADE will handle related records)
    await db
      .delete(missionReports)
      .where(
        inArray(
          missionReports.id,
          plansToDelete.map((p) => p.id)
        )
      );

    return { deletedCount: plansToDelete.length };
  } catch (error) {
    console.error('Error cleaning up deleted plans:', error);
    return { deletedCount: 0, error: 'Cleanup failed' };
  }
}

/**
 * Disable excess shares when user downgrades tier
 */
export async function disableExcessShares(
  userId: string,
  newTierLimit: number
): Promise<{ disabledCount: number }> {
  try {
    // Get all active shares ordered by creation date (oldest first)
    const activeShares = await db
      .select({ id: planShares.id })
      .from(planShares)
      .where(and(eq(planShares.sharedByUserId, userId), eq(planShares.isDisabled, false)))
      .orderBy(planShares.createdAt);

    const excessCount = Math.max(0, activeShares.length - newTierLimit);

    if (excessCount === 0) {
      return { disabledCount: 0 };
    }

    // Disable oldest excess shares
    const sharesToDisable = activeShares.slice(0, excessCount);

    await db
      .update(planShares)
      .set({
        isDisabled: true,
        disabledAt: new Date(),
        disabledReason: 'tier_downgrade',
      })
      .where(
        inArray(
          planShares.id,
          sharesToDisable.map((s) => s.id)
        )
      );

    return { disabledCount: excessCount };
  } catch (error) {
    console.error('Error disabling excess shares:', error);
    return { disabledCount: 0 };
  }
}

/**
 * Get disabled shares that can be reactivated
 */
export async function getDisabledShares(userId: string): Promise<
  Array<{
    id: string;
    missionReportId: string;
    sharedWithEmail: string;
    disabledAt: Date;
    disabledReason: string;
  }>
> {
  const shares = await db
    .select({
      id: planShares.id,
      missionReportId: planShares.missionReportId,
      sharedWithEmail: planShares.sharedWithEmail,
      disabledAt: planShares.disabledAt,
      disabledReason: planShares.disabledReason,
    })
    .from(planShares)
    .where(and(eq(planShares.sharedByUserId, userId), eq(planShares.isDisabled, true)))
    .orderBy(desc(planShares.disabledAt));

  return shares.map((share) => ({
    ...share,
    disabledAt: new Date(share.disabledAt!),
    disabledReason: share.disabledReason!,
  }));
}

/**
 * Reactivate a disabled share (if user has quota)
 */
export async function reactivateShare(
  shareId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user tier
    const [profile] = await db
      .select({ tier: profiles.subscriptionTier })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return { success: false, error: 'Profile not found' };
    }

    const tier = (profile.tier || 'FREE') as 'FREE' | 'BASIC' | 'PRO';
    const tierLimit = TIER_SHARE_LIMITS[tier];

    // Get current active share count
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(planShares)
      .where(and(eq(planShares.sharedByUserId, userId), eq(planShares.isDisabled, false)));

    const currentCount = result?.count || 0;

    if (currentCount >= tierLimit) {
      return {
        success: false,
        error: `Share limit reached. Your ${tier} plan allows ${tierLimit} active shares.`,
      };
    }

    // Reactivate share
    await db
      .update(planShares)
      .set({
        isDisabled: false,
        reactivatedAt: new Date(),
      })
      .where(
        and(
          eq(planShares.id, shareId),
          eq(planShares.sharedByUserId, userId),
          eq(planShares.isDisabled, true)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error reactivating share:', error);
    return { success: false, error: 'Failed to reactivate share' };
  }
}

/**
 * Get all deleted plans across all users (admin only)
 */
export async function getAllDeletedPlans(): Promise<
  Array<{
    id: string;
    title: string;
    userId: string;
    userEmail: string | null;
    deletedAt: Date;
    daysUntilPermanentDeletion: number;
    canRestore: boolean;
  }>
> {
  const retentionDays = await getDeletedPlansRetentionDays();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const deletedPlans = await db
    .select({
      id: missionReports.id,
      title: missionReports.title,
      userId: missionReports.userId,
      deletedAt: missionReports.deletedAt,
      userEmail: profiles.email,
    })
    .from(missionReports)
    .leftJoin(profiles, eq(missionReports.userId, profiles.id))
    .where(and(isNotNull(missionReports.deletedAt), gt(missionReports.deletedAt!, cutoffDate)))
    .orderBy(desc(missionReports.deletedAt));

  return deletedPlans.map((plan) => {
    const deletedDate = new Date(plan.deletedAt!);
    const expirationDate = new Date(deletedDate);
    expirationDate.setDate(expirationDate.getDate() + retentionDays);

    const daysUntilPermanentDeletion = Math.max(
      0,
      Math.ceil((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    return {
      id: plan.id,
      title: plan.title,
      userId: plan.userId,
      userEmail: plan.userEmail,
      deletedAt: new Date(plan.deletedAt!),
      daysUntilPermanentDeletion,
      canRestore: daysUntilPermanentDeletion > 0,
    };
  });
}

/**
 * Get a shared plan by share token
 * Returns plan data and share metadata for public access
 */
export async function getSharedPlanByToken(token: string): Promise<{
  report: MissionReport | null;
  share: {
    id: string;
    sharedByEmail: string | null;
    sharedByName: string | null;
    permissions: 'view' | 'edit';
    expiresAt: Date;
    isExpired: boolean;
    isDisabled: boolean;
    disabledReason: string | null;
  } | null;
  error?: string;
}> {
  try {
    // Find share by token
    const [shareResult] = await db
      .select({
        shareId: planShares.id,
        missionReportId: planShares.missionReportId,
        sharedByUserId: planShares.sharedByUserId,
        permissions: planShares.permissions,
        expiresAt: planShares.expiresAt,
        isDisabled: planShares.isDisabled,
        disabledReason: planShares.disabledReason,
        sharedByEmail: profiles.email,
        sharedByName: profiles.fullName,
      })
      .from(planShares)
      .leftJoin(profiles, eq(planShares.sharedByUserId, profiles.id))
      .where(eq(planShares.shareToken, token))
      .limit(1);

    if (!shareResult) {
      return {
        report: null,
        share: null,
        error: 'Share link not found',
      };
    }

    // Check if share is disabled
    if (shareResult.isDisabled) {
      return {
        report: null,
        share: {
          id: shareResult.shareId,
          sharedByEmail: shareResult.sharedByEmail,
          sharedByName: shareResult.sharedByName,
          permissions: shareResult.permissions as 'view' | 'edit',
          expiresAt: new Date(shareResult.expiresAt),
          isExpired: false,
          isDisabled: true,
          disabledReason: shareResult.disabledReason,
        },
        error: `This share link has been disabled${shareResult.disabledReason ? `: ${shareResult.disabledReason}` : ''}`,
      };
    }

    // Check if share is expired
    const now = new Date();
    const expiresAt = new Date(shareResult.expiresAt);
    const isExpired = now > expiresAt;

    if (isExpired) {
      return {
        report: null,
        share: {
          id: shareResult.shareId,
          sharedByEmail: shareResult.sharedByEmail,
          sharedByName: shareResult.sharedByName,
          permissions: shareResult.permissions as 'view' | 'edit',
          expiresAt,
          isExpired: true,
          isDisabled: false,
          disabledReason: null,
        },
        error: 'This share link has expired',
      };
    }

    // Fetch the mission report
    const report = await getMissionReportById(shareResult.missionReportId);

    if (!report) {
      return {
        report: null,
        share: null,
        error: 'Plan not found or has been deleted',
      };
    }

    // Update accessed_at timestamp
    await db
      .update(planShares)
      .set({ accessedAt: new Date() })
      .where(eq(planShares.id, shareResult.shareId));

    return {
      report,
      share: {
        id: shareResult.shareId,
        sharedByEmail: shareResult.sharedByEmail,
        sharedByName: shareResult.sharedByName,
        permissions: shareResult.permissions as 'view' | 'edit',
        expiresAt,
        isExpired: false,
        isDisabled: false,
        disabledReason: null,
      },
    };
  } catch (error) {
    console.error('Error fetching shared plan:', error);
    return {
      report: null,
      share: null,
      error: 'Failed to load shared plan',
    };
  }
}
