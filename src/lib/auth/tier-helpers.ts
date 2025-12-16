/**
 * Tier enforcement helpers for Server Components
 * 
 * These utilities read subscription tier data from middleware-injected headers
 * and enforce tier-based access control at the component level.
 */

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { SubscriptionTier } from '@/lib/types/subscription'
import { meetsMinimumTier, getTierLimits } from '@/lib/types/subscription'

export interface UserTierData {
  tier: SubscriptionTier
  userId: string
  userName: string
  userEmail: string
}

/**
 * Get the current user's tier data from middleware headers
 * 
 * This function reads the tier and user data that was injected by the middleware
 * into the request headers. It should only be called from Server Components in
 * protected routes.
 * 
 * @returns UserTierData object with tier and user information
 * @throws Error if called outside of protected routes (headers not set)
 */
export async function getUserTierData(): Promise<UserTierData> {
  const headersList = await headers()
  
  const tier = headersList.get('x-user-tier') as SubscriptionTier | null
  const userId = headersList.get('x-user-id')
  const userName = headersList.get('x-user-name')
  const userEmail = headersList.get('x-user-email')
  
  if (!tier || !userId) {
    throw new Error(
      'User tier data not found in headers. This function must be called from a protected route.'
    )
  }
  
  return {
    tier,
    userId,
    userName: userName || userEmail || 'User',
    userEmail: userEmail || '',
  }
}

/**
 * Require a minimum subscription tier for access
 * 
 * This function enforces tier-based access control in Server Components.
 * If the user's tier doesn't meet the minimum requirement, they are redirected
 * to the pricing/upgrade page.
 * 
 * @param minTier - The minimum tier required to access the feature
 * @returns UserTierData if user meets requirement
 * @throws Redirects to /pricing if user doesn't meet tier requirement
 * 
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function ProFeaturePage() {
 *   const userData = await requireTier('PRO')
 *   // User is guaranteed to have PRO tier here
 *   return <div>Pro feature content</div>
 * }
 * ```
 */
export async function requireTier(minTier: SubscriptionTier): Promise<UserTierData> {
  const userData = await getUserTierData()
  
  if (!meetsMinimumTier(userData.tier, minTier)) {
    // Redirect to pricing page with upgrade prompt
    redirect(`/pricing?upgrade=${minTier.toLowerCase()}&reason=tier_required`)
  }
  
  return userData
}

/**
 * Check if user has a specific tier without redirecting
 * 
 * This is useful for conditional rendering where you want to show different
 * content based on tier, but not block access entirely.
 * 
 * @param minTier - The minimum tier to check for
 * @returns true if user meets the tier requirement, false otherwise
 * 
 * @example
 * ```typescript
 * export default async function FeaturePage() {
 *   const hasProAccess = await hasTier('PRO')
 *   return (
 *     <div>
 *       {hasProAccess ? <ProFeature /> : <UpgradePrompt />}
 *     </div>
 *   )
 * }
 * ```
 */
export async function hasTier(minTier: SubscriptionTier): Promise<boolean> {
  try {
    const userData = await getUserTierData()
    return meetsMinimumTier(userData.tier, minTier)
  } catch {
    return false
  }
}

/**
 * Get the user's current tier without requiring minimum access
 * 
 * This is useful when you just need to know the user's tier for display
 * or conditional logic, without enforcing any access control.
 * 
 * @returns The user's subscription tier
 * @throws Error if called outside of protected routes
 */
export async function getCurrentTier(): Promise<SubscriptionTier> {
  const userData = await getUserTierData()
  return userData.tier
}

