/**
 * Tier Badge Component
 *
 * Displays subscription tier with color-coded badge.
 * Includes subtle upgrade link for FREE and BASIC tiers.
 */

import Link from 'next/link'
import type { SubscriptionTier } from '@/lib/types/subscription'
import { getTierLimits } from '@/lib/types/subscription'
import { cn } from '@/lib/utils'

interface TierBadgeProps {
  tier: SubscriptionTier
  showUpgradeLink?: boolean
}

export function TierBadge({ tier, showUpgradeLink = true }: TierBadgeProps) {
  const limits = getTierLimits(tier)

  // Tier-specific colors using CSS variables from globals.css
  const tierColors: Record<SubscriptionTier, string> = {
    FREE: 'bg-[--tier-free-bg] text-[--tier-free-foreground] dark:bg-[--tier-free-bg] dark:text-[--tier-free-foreground]',
    BASIC: 'bg-[--tier-basic-bg] text-[--tier-basic] dark:bg-[--tier-basic-bg] dark:text-[--tier-basic]',
    PRO: 'bg-[--tier-pro-bg] text-[--tier-pro] dark:bg-[--tier-pro-bg] dark:text-[--tier-pro]',
  }

  const shouldShowUpgrade = showUpgradeLink && tier !== 'PRO'

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
          tierColors[tier]
        )}
      >
        {limits.displayName}
      </span>

      {shouldShowUpgrade && (
        <Link
          href="/pricing"
          className="text-xs text-primary hover:underline"
        >
          Upgrade
        </Link>
      )}
    </div>
  )
}

