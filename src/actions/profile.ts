'use server';

import { db } from '@/db';
import { profiles, userActivityLog } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Update user's token usage count (admin-only background task)
 */
export async function updateTokenUsage(
  userId: string,
  tokensUsed: number
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db
      .update(profiles)
      .set({
        totalTokensUsed: sql`${profiles.totalTokensUsed} + ${tokensUsed}`,
        lastTokenUpdate: new Date(),
      })
      .where(eq(profiles.id, userId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update token usage',
    };
  }
}

/**
 * Log user activity event
 */
export async function logUserActivity(
  userId: string,
  activityType: string,
  metadata?: Record<string, unknown>
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db.insert(userActivityLog).values({
      userId,
      activityType,
      metadata: metadata || {},
      createdAt: new Date(),
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log activity',
    };
  }
}
