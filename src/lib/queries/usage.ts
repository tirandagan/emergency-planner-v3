/**
 * Usage query functions for subscription tier limits
 * 
 * These functions query the database to check usage against tier limits,
 * primarily for displaying usage indicators and enforcing tier restrictions.
 */

import { db } from '@/db'
import { missionReports } from '@/db/schema'
import { eq, count, and, isNull } from 'drizzle-orm'
import type { SubscriptionTier } from '@/lib/types/subscription'
import { getTierLimits, hasReachedPlanLimit } from '@/lib/types/subscription'

/**
 * Get the number of plans (mission reports) a user has created
 * 
 * @param userId - The user's ID
 * @returns The count of plans the user has created
 */
export async function getUserPlanCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(missionReports)
      .where(
        and(
          eq(missionReports.userId, userId),
          isNull(missionReports.deletedAt)
        )
      )
    
    return result[0]?.count || 0
  } catch (error) {
    // Graceful fallback for RLS errors or table not ready
    // Silently return 0 until RLS is configured
    if (process.env.NODE_ENV === 'development') {
      console.info('[Usage] Plan count unavailable (RLS not configured), returning 0')
    }
    return 0
  }
}

/**
 * Check if a user has reached their plan creation limit based on tier
 * 
 * @param userId - The user's ID
 * @param tier - The user's subscription tier
 * @returns true if user has reached limit, false if they can create more plans
 */
export async function hasReachedUserPlanLimit(
  userId: string,
  tier: SubscriptionTier
): Promise<boolean> {
  try {
    const currentCount = await getUserPlanCount(userId)
    return hasReachedPlanLimit(tier, currentCount)
  } catch (error) {
    // Graceful fallback - assume not at limit if query fails
    if (process.env.NODE_ENV === 'development') {
      console.info('[Usage] Plan limit check unavailable, returning false')
    }
    return false
  }
}

/**
 * Get usage statistics for a user
 * 
 * @param userId - The user's ID
 * @param tier - The user's subscription tier
 * @returns Object with current usage and limits
 */
export async function getUserUsageStats(
  userId: string,
  tier: SubscriptionTier
): Promise<{
  planCount: number
  planLimit: number
  hasReachedLimit: boolean
  isUnlimited: boolean
}> {
  try {
    const planCount = await getUserPlanCount(userId)
    const limits = getTierLimits(tier)
    const planLimit = limits.maxPlans
    const isUnlimited = planLimit === -1
    
    return {
      planCount,
      planLimit: isUnlimited ? Infinity : planLimit,
      hasReachedLimit: !isUnlimited && planCount >= planLimit,
      isUnlimited,
    }
  } catch (error) {
    // Graceful fallback - return safe defaults if query fails
    if (process.env.NODE_ENV === 'development') {
      console.info('[Usage] Usage stats unavailable, returning defaults')
    }
    const limits = getTierLimits(tier)
    const planLimit = limits.maxPlans
    const isUnlimited = planLimit === -1
    
    return {
      planCount: 0,
      planLimit: isUnlimited ? Infinity : planLimit,
      hasReachedLimit: false,
      isUnlimited,
    }
  }
}

