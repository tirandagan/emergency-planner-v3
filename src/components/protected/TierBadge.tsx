/**
 * Tier Badge Component
 *
 * Displays subscription tier with graphical badge and icon.
 * Icons: Lock (FREE), Star (BASIC), Crown (PRO)
 */

import Link from 'next/link'
import type { SubscriptionTier } from '@/lib/types/subscription'
import { getTierLimits } from '@/lib/types/subscription'
import { cn } from '@/lib/utils'
import { Lock, Star, Crown } from 'lucide-react'

interface TierBadgeProps {
  tier: SubscriptionTier
  showUpgradeLink?: boolean
  compact?: boolean
}

export function TierBadge({ tier, showUpgradeLink = true, compact = false }: TierBadgeProps): React.JSX.Element {
  const limits = getTierLimits(tier)

  // Tier-specific styling with gradients and icons
  const tierStyles: Record<SubscriptionTier, {
    bg: string
    text: string
    icon: React.ReactNode
    glow: string
  }> = {
    FREE: {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-600 dark:text-slate-400',
      icon: <Lock className="w-3 h-3" strokeWidth={2.5} />,
      glow: 'shadow-slate-500/20'
    },
    BASIC: {
      bg: 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20',
      text: 'text-blue-600 dark:text-blue-400',
      icon: <Star className="w-3 h-3" strokeWidth={2.5} />,
      glow: 'shadow-blue-500/30'
    },
    PRO: {
      bg: 'bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-600/10 dark:from-amber-500/20 dark:via-yellow-500/20 dark:to-amber-600/20',
      text: 'text-amber-600 dark:text-amber-400',
      icon: <Crown className="w-3 h-3" strokeWidth={2.5} />,
      glow: 'shadow-amber-500/30'
    },
  }

  const style = tierStyles[tier]
  const shouldShowUpgrade = showUpgradeLink && tier !== 'PRO'

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold transition-all',
          style.bg,
          style.text,
          'shadow-sm',
          style.glow
        )}
        title={limits.displayName}
      >
        {style.icon}
        <span>{limits.displayName}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
          style.bg,
          style.text,
          'shadow-sm hover:shadow-md',
          style.glow
        )}
      >
        {style.icon}
        <span>{limits.displayName}</span>
      </div>

      {shouldShowUpgrade && (
        <Link
          href="/pricing"
          className="text-xs text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
        >
          Upgrade
        </Link>
      )}
    </div>
  )
}
