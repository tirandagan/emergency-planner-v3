import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tier: 'FREE' | 'BASIC' | 'PRO';
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  // Tier-specific colors using CSS variables from globals.css
  const tierConfig = {
    FREE: {
      label: 'Free',
      classes: 'bg-[--tier-free-bg] text-[--tier-free-foreground] dark:bg-[--tier-free-bg] dark:text-[--tier-free-foreground]',
    },
    BASIC: {
      label: 'Basic',
      classes: 'bg-[--tier-basic-bg] text-[--tier-basic] dark:bg-[--tier-basic-bg] dark:text-[--tier-basic]',
    },
    PRO: {
      label: 'Pro',
      classes: 'bg-[--tier-pro-bg] text-[--tier-pro] dark:bg-[--tier-pro-bg] dark:text-[--tier-pro]',
    },
  };

  // Normalize tier to uppercase and provide fallback
  const normalizedTier = (tier?.toUpperCase() || 'FREE') as 'FREE' | 'BASIC' | 'PRO';
  const config = tierConfig[normalizedTier] || tierConfig.FREE;

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full',
        config.classes,
        sizeClasses[size]
      )}
    >
      {config.label}
    </span>
  );
}

