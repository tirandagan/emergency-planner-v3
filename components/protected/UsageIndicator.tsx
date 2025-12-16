/**
 * Usage Indicator Component
 * 
 * Displays plan usage for FREE tier users with progress indicator.
 * Shows "X/Y Plans Saved" with upgrade link.
 * Hidden for BASIC and PRO tiers (unlimited plans).
 */

import Link from 'next/link'
import type { SubscriptionTier } from '@/lib/types/subscription'
import { getUserUsageStats } from '@/lib/queries/usage'
import { cn } from '@/lib/utils'

interface UsageIndicatorProps {
  userId: string
  tier: SubscriptionTier
}

export async function UsageIndicator({ userId, tier }: UsageIndicatorProps) {
  // Only show for FREE tier
  if (tier !== 'FREE') {
    return null
  }
  
  const stats = await getUserUsageStats(userId, tier)
  
  // Calculate percentage for progress bar
  const percentage = stats.isUnlimited 
    ? 100 
    : Math.min(100, (stats.planCount / stats.planLimit) * 100)
  
  return (
    <div className="px-4 py-3 border-t border-border">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Plans Saved</p>
          <p className="text-sm font-medium">
            {stats.planCount} / {stats.planLimit}
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              stats.hasReachedLimit ? 'bg-destructive' : 'bg-primary'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Upgrade link */}
        <Link
          href="/pricing"
          className="text-xs text-primary hover:underline block"
        >
          {stats.hasReachedLimit 
            ? 'Upgrade to save more plans' 
            : 'Upgrade for unlimited plans'}
        </Link>
      </div>
    </div>
  )
}

