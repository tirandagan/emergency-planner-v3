import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema/profiles'
import { eq } from 'drizzle-orm'
import type { SubscriptionTier } from '@/lib/types/subscription'
import { getTierLimits } from '@/lib/types/subscription'
import { getUserUsageStats } from '@/lib/queries/usage'
import { ProtectedLayoutClient } from './ProtectedLayoutClient'

// Force dynamic rendering for all protected routes (uses cookies for auth)
export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    // Get authenticated user from Supabase
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/auth/login')
    }

    // Fetch user profile (tier, name, email)
    // This is a lightweight query for subscription enforcement in protected routes
    let profileResults: Array<{
      subscriptionTier: string | null
      fullName: string | null
      email: string | null
    }> = []

    const profileStart = Date.now();
    try {
      profileResults = await db
        .select({
          subscriptionTier: profiles.subscriptionTier,
          fullName: profiles.fullName,
          email: profiles.email,
        })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1)

      // Keep warning for slow profile queries (performance monitoring)
      const profileDuration = Date.now() - profileStart;
      if (profileDuration > 500) {
        console.warn(`[ProtectedLayout] Slow profile query: ${profileDuration}ms`);
      }
    } catch (dbError) {
      const profileDuration = Date.now() - profileStart;
      console.error(`[ProtectedLayout] Profile query failed after ${profileDuration}ms:`, dbError instanceof Error ? dbError.message : 'Unknown error')
      // If profile doesn't exist, use auth user data as fallback
      profileResults = []
    }
    const profile = profileResults?.[0]

    // Ensure tier is a valid SubscriptionTier
    const rawTier = profile?.subscriptionTier
    const tier: SubscriptionTier =
      rawTier === 'FREE' || rawTier === 'BASIC' || rawTier === 'PRO'
        ? rawTier
        : 'FREE'

    const userName = profile?.fullName || profile?.email || user.email || 'User'
    const userEmail = profile?.email || user.email || ''

    // Get usage stats for the user (includes planCount, hasReachedLimit, etc.)
    const usageStats = await getUserUsageStats(user.id, tier)
    const tierLimits = getTierLimits(tier)

    return (
      <ProtectedLayoutClient
        userName={userName}
        userEmail={userEmail}
        userTier={tier}
        planCount={usageStats.planCount}
        planLimit={tierLimits.maxPlans}
      >
        {children}
      </ProtectedLayoutClient>
    )
  } catch (error) {
    console.error('[ProtectedLayout] Error loading layout:', error)
    // Return minimal safe layout on error
    return (
      <ProtectedLayoutClient
        userName="User"
        userEmail=""
        userTier="FREE"
        planCount={0}
        planLimit={1}
      >
        {children}
      </ProtectedLayoutClient>
    )
  }
}

