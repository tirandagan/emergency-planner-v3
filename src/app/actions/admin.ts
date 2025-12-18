'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { logSystemError } from '@/lib/system-logger';

/**
 * Toggle high-value status for a user
 * Admin-only action with authorization check
 */
export async function toggleHighValueUser(userId: string, isHighValue: boolean) {
  // Get current user from Supabase auth
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    throw new Error('Unauthorized: Not authenticated');
  }

  // Get user profile to check role
  const [currentUser] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, authUser.id))
    .limit(1);

  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }

  // Update target user's high-value status
  await db
    .update(profiles)
    .set({
      isHighValue,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, userId));

  // Revalidate admin users page to reflect changes
  revalidatePath('/admin/users');

  return { success: true };
}

/**
 * Verify user has admin role (helper function)
 */
async function verifyAdminRole(userId: string): Promise<boolean> {
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile?.role === 'ADMIN';
}

/**
 * Update a system setting (admin only)
 */
export async function updateSystemSetting(
  key: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify admin role
    const isAdmin = await verifyAdminRole(user.id);
    if (!isAdmin) {
      return { success: false, error: 'Admin access required' };
    }

    // Update setting using query function
    const { updateSystemSetting: updateSetting } = await import('@/db/queries/system-settings');
    const result = await updateSetting(key, value, user.id);

    if (result.success) {
      revalidatePath('/admin/settings', 'page');
    }

    return result;
  } catch (error) {
    console.error('Error updating system setting:', error);

    await logSystemError(error, {
      category: 'database_error',
      component: 'AdminActions',
      route: '/app/actions/admin',
      userAction: 'Updating system setting (admin operation)',
      metadata: {
        settingKey: key,
        operation: 'updateSystemSetting',
      },
    });

    return { success: false, error: 'Failed to update setting' };
  }
}

/**
 * Clean up old deleted plans beyond retention window (admin only)
 */
export async function cleanupOldDeletedPlans(
  daysOld?: number
): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify admin role
    const isAdmin = await verifyAdminRole(user.id);
    if (!isAdmin) {
      return { success: false, error: 'Admin access required' };
    }

    // Use cleanup function from mission-reports.ts
    const { cleanupOldDeletedPlans: cleanup } = await import('@/lib/mission-reports');
    const result = await cleanup();

    if (result.error) {
      return { success: false, error: result.error };
    }

    revalidatePath('/admin/trash', 'page');

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error('Error cleaning up deleted plans:', error);

    await logSystemError(error, {
      category: 'database_error',
      component: 'AdminActions',
      route: '/app/actions/admin',
      userAction: 'Cleaning up old deleted plans (admin operation)',
      metadata: {
        daysOld,
        operation: 'cleanupOldDeletedPlans',
      },
    });

    return { success: false, error: 'Failed to cleanup deleted plans' };
  }
}

/**
 * Get system statistics (admin only)
 */
export async function getSystemStatistics(): Promise<{
  success: boolean;
  stats?: {
    totalUsers: number;
    totalPlans: number;
    deletedPlans: number;
    activeShares: number;
    disabledShares: number;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify admin role
    const isAdmin = await verifyAdminRole(user.id);
    if (!isAdmin) {
      return { success: false, error: 'Admin access required' };
    }

    const { missionReports, planShares } = await import('@/db/schema');
    const { sql, isNotNull, isNull } = await import('drizzle-orm');

    // Get statistics
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(profiles);

    const [planCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(missionReports)
      .where(isNull(missionReports.deletedAt));

    const [deletedCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(missionReports)
      .where(isNotNull(missionReports.deletedAt));

    const [activeShareCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(planShares)
      .where(eq(planShares.isDisabled, false));

    const [disabledShareCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(planShares)
      .where(eq(planShares.isDisabled, true));

    return {
      success: true,
      stats: {
        totalUsers: userCount?.count || 0,
        totalPlans: planCount?.count || 0,
        deletedPlans: deletedCount?.count || 0,
        activeShares: activeShareCount?.count || 0,
        disabledShares: disabledShareCount?.count || 0,
      },
    };
  } catch (error) {
    console.error('Error getting system statistics:', error);

    await logSystemError(error, {
      category: 'database_error',
      component: 'AdminActions',
      route: '/app/actions/admin',
      userAction: 'Retrieving system statistics (admin operation)',
      metadata: {
        operation: 'getSystemStatistics',
      },
    });

    return { success: false, error: 'Failed to get statistics' };
  }
}
