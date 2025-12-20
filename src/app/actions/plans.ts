'use server';

/**
 * Server Actions for Plan Management
 * CRUD operations for mission reports with tier-based validation
 */

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { missionReports, planShares, profiles } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';
import type { ReportDataV2, EmergencyContactData } from '@/types/mission-report';
import type { SharePermission } from '@/types/plan-share';
import { TIER_SHARE_LIMITS } from '@/types/plan-share';
import { logSystemError } from '@/lib/system-logger';

/**
 * Update mission report with emergency contacts or item ownership
 */
export async function updateMissionReport(
  reportId: string,
  data: Partial<ReportDataV2>
): Promise<{ success: boolean; error?: string }> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const [report] = await db
      .select({
        id: missionReports.id,
        reportData: missionReports.reportData,
      })
      .from(missionReports)
      .where(and(eq(missionReports.id, reportId), eq(missionReports.userId, user.id)))
      .limit(1);

    if (!report) {
      return { success: false, error: 'Report not found or access denied' };
    }

    // Merge the updates with existing report_data
    const updatedReportData = {
      ...(report.reportData as object),
      ...(data as object),
    } as ReportDataV2;

    // Update report_data JSONB
    await db
      .update(missionReports)
      .set({
        reportData: updatedReportData,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, reportId));

    revalidatePath(`/plans/${reportId}`, 'page');

    return { success: true };
  } catch (error) {
    console.error('Error updating mission report:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Updating mission report data',
      metadata: {
        reportId,
        operation: 'updateMissionReport',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues updating your plan. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Validate share limits based on user's subscription tier
 */
async function validateShareLimit(
  userId: string,
  additionalSharesNeeded: number
): Promise<{ canShare: boolean; currentCount: number; tierLimit: number; error?: string }> {
  try {
    // Get user's subscription tier
    const [profile] = await db
      .select({ tier: profiles.subscriptionTier })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      return {
        canShare: false,
        currentCount: 0,
        tierLimit: 0,
        error: 'Profile not found',
      };
    }

    const tier = (profile.tier || 'FREE') as 'FREE' | 'BASIC' | 'PRO';
    const tierLimit = TIER_SHARE_LIMITS[tier];

    // Get current share count
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(planShares)
      .where(eq(planShares.sharedByUserId, userId));

    const currentCount = result?.count || 0;
    const canShare = currentCount + additionalSharesNeeded <= tierLimit;

    if (!canShare) {
      return {
        canShare: false,
        currentCount,
        tierLimit,
        error: `Share limit exceeded. Your ${tier} plan allows ${tierLimit} shares. You have ${currentCount} active shares.`,
      };
    }

    return { canShare: true, currentCount, tierLimit };
  } catch (error) {
    console.error('Error validating share limit:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Validating plan share limits',
      metadata: {
        operation: 'validateShareLimit',
        additionalSharesNeeded,
      },
    });

    return {
      canShare: false,
      currentCount: 0,
      tierLimit: 0,
      error: "We're experiencing issues validating your share limit. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Share mission report with tier validation
 */
export async function shareMissionReport(
  reportId: string,
  emails: string[],
  permissions: SharePermission = 'view'
): Promise<{
  success: boolean;
  shares?: Array<{ id: string; shareToken: string; sharedWithEmail: string }>;
  error?: string;
}> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const [report] = await db
      .select({ id: missionReports.id })
      .from(missionReports)
      .where(and(eq(missionReports.id, reportId), eq(missionReports.userId, user.id)))
      .limit(1);

    if (!report) {
      return { success: false, error: 'Report not found or access denied' };
    }

    // Validate share limits
    const tierValidation = await validateShareLimit(user.id, emails.length);
    if (!tierValidation.canShare) {
      return { success: false, error: tierValidation.error };
    }

    // Create plan_shares records
    const shares = await db
      .insert(planShares)
      .values(
        emails.map((email) => ({
          missionReportId: reportId,
          sharedByUserId: user.id,
          sharedWithEmail: email.toLowerCase().trim(),
          permissions,
        }))
      )
      .returning({
        id: planShares.id,
        shareToken: planShares.shareToken,
        sharedWithEmail: planShares.sharedWithEmail,
      });

    revalidatePath(`/plans/${reportId}`, 'page');

    return { success: true, shares };
  } catch (error) {
    console.error('Error sharing mission report:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Sharing mission report with others',
      metadata: {
        reportId,
        emailCount: emails.length,
        permissions,
        operation: 'shareMissionReport',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues sharing your plan. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Soft delete mission report
 */
export async function deleteMissionReport(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const [report] = await db
      .select({ id: missionReports.id })
      .from(missionReports)
      .where(and(eq(missionReports.id, reportId), eq(missionReports.userId, user.id)))
      .limit(1);

    if (!report) {
      return { success: false, error: 'Report not found or access denied' };
    }

    // Soft delete
    await db
      .update(missionReports)
      .set({ deletedAt: new Date() })
      .where(eq(missionReports.id, reportId));

    revalidatePath('/dashboard', 'page');
    revalidatePath('/plans', 'page');
    revalidatePath('/plans/trash', 'page');

    return { success: true };
  } catch (error) {
    console.error('Error deleting mission report:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Soft-deleting mission report',
      metadata: {
        reportId,
        operation: 'deleteMissionReport',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues deleting your plan. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Update emergency contacts for a mission report
 */
export async function updateEmergencyContacts(
  reportId: string,
  emergencyContacts: EmergencyContactData
): Promise<{ success: boolean; error?: string }> {
  return updateMissionReport(reportId, { emergencyContacts });
}

/**
 * Update item ownership tracking for a mission report
 */
export async function updateOwnedItems(
  reportId: string,
  ownedItems: { [bundleId: string]: { [itemId: string]: boolean } }
): Promise<{ success: boolean; error?: string }> {
  return updateMissionReport(reportId, { ownedItems });
}

/**
 * Restore a soft-deleted mission report
 */
export async function restoreMissionReport(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Use the restore function from mission-reports.ts
    const { restorePlan } = await import('@/lib/mission-reports');
    const result = await restorePlan(reportId, user.id);

    if (result.success) {
      revalidatePath('/dashboard', 'page');
      revalidatePath('/dashboard/trash', 'page');
      revalidatePath(`/plans/${reportId}`, 'page');
    }

    return result;
  } catch (error) {
    console.error('Error restoring mission report:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Restoring deleted mission report',
      metadata: {
        reportId,
        operation: 'restoreMissionReport',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues restoring your plan. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Create a version snapshot of a mission report
 */
export async function createMissionReportVersion(
  reportId: string,
  changesSummary?: string,
  editReason?: string
): Promise<{ success: boolean; versionId?: string; versionNumber?: number; error?: string }> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const [report] = await db
      .select({ id: missionReports.id })
      .from(missionReports)
      .where(and(eq(missionReports.id, reportId), eq(missionReports.userId, user.id)))
      .limit(1);

    if (!report) {
      return { success: false, error: 'Report not found or access denied' };
    }

    // Create version using the query function
    const { createPlanVersion } = await import('@/db/queries/plan-versions');
    const version = await createPlanVersion(reportId, user.id, changesSummary, editReason);

    if (!version) {
      return { success: false, error: 'Failed to create version' };
    }

    return {
      success: true,
      versionId: version.versionId,
      versionNumber: version.versionNumber,
    };
  } catch (error) {
    console.error('Error creating mission report version:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Creating mission report version snapshot',
      metadata: {
        reportId,
        changesSummary,
        editReason,
        operation: 'createMissionReportVersion',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues creating a version snapshot. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Update mission report with automatic versioning
 */
export async function updateMissionReportWithVersioning(
  reportId: string,
  data: Partial<ReportDataV2>,
  changesSummary?: string
): Promise<{ success: boolean; versionNumber?: number; error?: string }> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Create version snapshot before updating
    const versionResult = await createMissionReportVersion(
      reportId,
      changesSummary || 'Plan updated',
      'user_edit'
    );

    if (!versionResult.success) {
      return { success: false, error: 'Failed to create version snapshot' };
    }

    // Update the report
    const updateResult = await updateMissionReport(reportId, data);

    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    return {
      success: true,
      versionNumber: versionResult.versionNumber,
    };
  } catch (error) {
    console.error('Error updating mission report with versioning:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Updating mission report with versioning',
      metadata: {
        reportId,
        changesSummary,
        operation: 'updateMissionReportWithVersioning',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues updating your plan. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Share mission report via email with notifications
 */
export async function shareMissionReportWithEmail(
  reportId: string,
  emails: string[],
  permissions: SharePermission = 'view',
  customMessage?: string
): Promise<{
  success: boolean;
  shares?: Array<{ id: string; shareToken: string; sharedWithEmail: string }>;
  error?: string;
  emailsSent?: number;
  emailsFailed?: number;
}> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // First create the shares using existing function
    const shareResult = await shareMissionReport(reportId, emails, permissions);

    if (!shareResult.success || !shareResult.shares) {
      return shareResult;
    }

    // Get user profile for sender name
    const [profile] = await db
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const senderName = profile?.fullName || user.email || 'Someone';

    // Get plan title
    const [report] = await db
      .select({ title: missionReports.title })
      .from(missionReports)
      .where(eq(missionReports.id, reportId))
      .limit(1);

    const planTitle = report?.title || 'Emergency Plan';

    // Send email notifications
    const { sendPlanShareEmail } = await import('@/lib/email');

    const emailPromises = shareResult.shares.map((share) =>
      sendPlanShareEmail(share.sharedWithEmail, {
        shareToken: share.shareToken,
        planTitle,
        senderName,
        customMessage,
        permissions,
      })
    );

    // Send emails in parallel but don't fail the entire operation if emails fail
    const emailResults = await Promise.allSettled(emailPromises);

    // Log email sending results
    const emailSuccesses = emailResults.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const emailFailures = emailResults.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

    console.log(`[Share] Sent ${emailSuccesses}/${emails.length} emails successfully`);

    if (emailFailures > 0) {
      console.error(`[Share] Failed to send ${emailFailures} email(s)`);
      emailResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`[Share] Email ${index + 1} rejected:`, result.reason);
        } else if (result.status === 'fulfilled' && !result.value.success) {
          console.error(`[Share] Email ${index + 1} failed:`, result.value.error);
        }
      });
    }

    // Return shares with email status
    return {
      ...shareResult,
      emailsSent: emailSuccesses,
      emailsFailed: emailFailures,
    };
  } catch (error) {
    console.error('Error sharing mission report with email:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Sharing mission report with email notifications',
      metadata: {
        reportId,
        emailCount: emails.length,
        permissions,
        operation: 'shareMissionReportWithEmail',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues sharing your plan. Our team has been notified and will resolve this shortly.",
    };
  }
}

// Rate limiting cache: shareId -> last sent timestamp
const resendEmailCache = new Map<string, number>();
const RESEND_RATE_LIMIT_MS = 60 * 1000; // 1 minute

/**
 * Resend share invitation email for an existing share
 * Rate limited to 1 email per minute per recipient
 */
export async function resendShareEmail(
  shareId: string,
  customMessage?: string
): Promise<{ success: boolean; error?: string }> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check rate limit
    const lastSent = resendEmailCache.get(shareId);
    if (lastSent) {
      const timeSinceLastSend = Date.now() - lastSent;
      if (timeSinceLastSend < RESEND_RATE_LIMIT_MS) {
        const secondsRemaining = Math.ceil((RESEND_RATE_LIMIT_MS - timeSinceLastSend) / 1000);
        return {
          success: false,
          error: `Please wait ${secondsRemaining} seconds before resending email to this recipient`,
        };
      }
    }

    // Get share details
    const { planShares } = await import('@/db/schema');
    const [share] = await db
      .select({
        id: planShares.id,
        shareToken: planShares.shareToken,
        sharedWithEmail: planShares.sharedWithEmail,
        permissions: planShares.permissions,
        missionReportId: planShares.missionReportId,
        sharedByUserId: planShares.sharedByUserId,
        isDisabled: planShares.isDisabled,
      })
      .from(planShares)
      .where(eq(planShares.id, shareId))
      .limit(1);

    if (!share) {
      return { success: false, error: 'Share not found' };
    }

    // Verify ownership
    if (share.sharedByUserId !== user.id) {
      return { success: false, error: 'Unauthorized - you do not own this share' };
    }

    // Check if share is disabled
    if (share.isDisabled) {
      return { success: false, error: 'Cannot resend email for disabled share' };
    }

    // Get user profile for sender name
    const [profile] = await db
      .select({ fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    const senderName = profile?.fullName || user.email || 'Someone';

    // Get plan title
    const { missionReports } = await import('@/db/schema');
    const [report] = await db
      .select({ title: missionReports.title })
      .from(missionReports)
      .where(eq(missionReports.id, share.missionReportId))
      .limit(1);

    const planTitle = report?.title || 'Emergency Plan';

    // Send email
    const { sendPlanShareEmail } = await import('@/lib/email');
    const emailResult = await sendPlanShareEmail(share.sharedWithEmail, {
      shareToken: share.shareToken,
      planTitle,
      senderName,
      customMessage,
      permissions: share.permissions as 'view' | 'edit',
    });

    if (!emailResult.success) {
      return { success: false, error: emailResult.error || 'Failed to send email' };
    }

    // Update rate limit cache
    resendEmailCache.set(shareId, Date.now());

    // Clean up old entries (older than 2 minutes)
    const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
    for (const [id, timestamp] of resendEmailCache.entries()) {
      if (timestamp < twoMinutesAgo) {
        resendEmailCache.delete(id);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error resending share email:', error);

    await logSystemError(error, {
      category: 'external_service',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Resending plan share email notification',
      metadata: {
        shareId,
        operation: 'resendShareEmail',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues resending the email. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Get all shares for a mission report
 */
export async function getMissionReportShares(
  reportId: string
): Promise<{
  success: boolean;
  shares?: Array<{
    id: string;
    sharedWithEmail: string;
    shareToken: string;
    permissions: string;
    expiresAt: Date;
    createdAt: Date;
    accessedAt: Date | null;
    isDisabled: boolean;
    disabledReason: string | null;
  }>;
  error?: string;
}> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const [report] = await db
      .select({ id: missionReports.id })
      .from(missionReports)
      .where(and(eq(missionReports.id, reportId), eq(missionReports.userId, user.id)))
      .limit(1);

    if (!report) {
      return { success: false, error: 'Report not found or access denied' };
    }

    // Get shares using the library function
    const { getPlanSharesByMissionReport } = await import('@/lib/mission-reports');
    const shares = await getPlanSharesByMissionReport(reportId);

    return { success: true, shares };
  } catch (error) {
    console.error('Error getting mission report shares:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Retrieving mission report shares',
      metadata: {
        reportId,
        operation: 'getMissionReportShares',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues retrieving plan shares. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Revoke a plan share
 */
export async function revokePlanShare(
  shareId: string
): Promise<{ success: boolean; error?: string }> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership of the share
    const [share] = await db
      .select({ id: planShares.id, missionReportId: planShares.missionReportId })
      .from(planShares)
      .where(and(eq(planShares.id, shareId), eq(planShares.sharedByUserId, user.id)))
      .limit(1);

    if (!share) {
      return { success: false, error: 'Share not found or access denied' };
    }

    // Delete the share
    await db.delete(planShares).where(eq(planShares.id, shareId));

    revalidatePath(`/plans/${share.missionReportId}`, 'page');

    return { success: true };
  } catch (error) {
    console.error('Error revoking plan share:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Revoking plan share access',
      metadata: {
        shareId,
        operation: 'revokePlanShare',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues revoking the share. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Reactivate a disabled plan share
 */
export async function reactivatePlanShare(
  shareId: string
): Promise<{ success: boolean; error?: string }> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership and get user's tier
    const [userProfile] = await db
      .select({ tier: profiles.subscriptionTier })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!userProfile) {
      return { success: false, error: 'Profile not found' };
    }

    // Use the reactivate function from mission-reports.ts
    const { reactivateShare } = await import('@/lib/mission-reports');
    const result = await reactivateShare(shareId, user.id);

    if (result.success) {
      // Get the mission report ID for revalidation
      const [share] = await db
        .select({ missionReportId: planShares.missionReportId })
        .from(planShares)
        .where(eq(planShares.id, shareId))
        .limit(1);

      if (share) {
        revalidatePath(`/plans/${share.missionReportId}`, 'page');
      }
    }

    return result;
  } catch (error) {
    console.error('Error reactivating plan share:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Reactivating disabled plan share',
      metadata: {
        shareId,
        operation: 'reactivatePlanShare',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues reactivating the share. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Get all saved scenarios (mission reports) for a user
 * Legacy function name for compatibility
 */
export async function getSavedScenarios(userId: string): Promise<any[]> {
  try {
    const { getMissionReportsByUserId } = await import('@/lib/mission-reports');
    const reports = await getMissionReportsByUserId(userId);

    // Transform to legacy format expected by Dashboard
    return reports.map((report) => ({
      id: report.id,
      user_id: report.userId,
      title: report.title,
      location: report.location,
      scenarios: report.scenarios,
      family_size: report.familySize,
      duration_days: report.durationDays,
      mobility_type: report.mobilityType,
      budget_amount: report.budgetAmount,
      report_data: report.reportData,
      readiness_score: report.readinessScore,
      scenario_scores: report.scenarioScores,
      component_scores: report.componentScores,
      created_at: report.createdAt.toISOString(),
      updated_at: report.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Error getting saved scenarios:', error);
    throw error;
  }
}

/**
 * Delete a scenario (soft delete)
 * Legacy function name for compatibility
 */
export async function deleteScenario(
  scenarioId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const [report] = await db
      .select({ id: missionReports.id })
      .from(missionReports)
      .where(and(eq(missionReports.id, scenarioId), eq(missionReports.userId, userId)))
      .limit(1);

    if (!report) {
      return { success: false, error: 'Report not found or access denied' };
    }

    // Use the existing deleteMissionReport function
    return await deleteMissionReport(scenarioId);
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return { success: false, error: 'Failed to delete scenario' };
  }
}

/**
 * Update mission report title
 * Legacy function for compatibility
 */
export async function updateMissionReportTitle(
  reportId: string,
  userId: string,
  newTitle: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const [report] = await db
      .select({ id: missionReports.id })
      .from(missionReports)
      .where(and(eq(missionReports.id, reportId), eq(missionReports.userId, userId)))
      .limit(1);

    if (!report) {
      return { success: false, error: 'Report not found or access denied' };
    }

    // Update title
    await db
      .update(missionReports)
      .set({
        title: newTitle,
        updatedAt: new Date(),
      })
      .where(eq(missionReports.id, reportId));

    revalidatePath(`/plans/${reportId}`, 'page');
    revalidatePath('/dashboard', 'page');

    return { success: true };
  } catch (error) {
    console.error('Error updating mission report title:', error);
    return { success: false, error: 'Failed to update title' };
  }
}

/**
 * Permanently delete a mission report
 * Hard delete from database (admin function or for expired trash items)
 */
export async function permanentlyDeleteMissionReport(
  reportId: string
): Promise<{ success: boolean; error?: string }> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const [report] = await db
      .select({ id: missionReports.id })
      .from(missionReports)
      .where(and(eq(missionReports.id, reportId), eq(missionReports.userId, user.id)))
      .limit(1);

    if (!report) {
      return { success: false, error: 'Report not found or access denied' };
    }

    // Hard delete (CASCADE will handle related records)
    await db.delete(missionReports).where(eq(missionReports.id, reportId));

    revalidatePath('/dashboard', 'page');
    revalidatePath('/dashboard/trash', 'page');

    return { success: true };
  } catch (error) {
    console.error('Error permanently deleting mission report:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'PlanActions',
      route: '/app/actions/plans',
      userAction: 'Permanently deleting mission report',
      metadata: {
        reportId,
        operation: 'permanentlyDeleteMissionReport',
      },
    });

    return {
      success: false,
      error: "We're experiencing issues permanently deleting your plan. Our team has been notified and will resolve this shortly.",
    };
  }
}
