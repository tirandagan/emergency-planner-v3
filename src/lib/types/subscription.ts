/**
 * Subscription tier types and utilities for beprepared.ai
 * 
 * Defines the three subscription tiers (FREE, BASIC, PRO) and their associated
 * feature limits and permissions. Used throughout the application for tier-based
 * access control and feature gating.
 */

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PRO';

export interface TierLimits {
  /** Maximum number of plans allowed (-1 for unlimited) */
  maxPlans: number;
  /** Maximum number of people plans can be shared with (-1 for unlimited) */
  maxShares: number;
  /** Whether user can access Pro-tier features */
  canAccessPro: boolean;
  /** Display name for the tier */
  displayName: string;
  /** Color variant for tier badge (using Trust Blue theme) */
  colorVariant: 'gray' | 'blue' | 'purple';
}

/**
 * Tier limits and permissions for each subscription level
 * 
 * FREE: Single plan, no sharing, basic features
 * BASIC: Unlimited plans, limited sharing, founder calls
 * PRO: Unlimited everything, advanced features, expert calls
 */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  FREE: {
    maxPlans: 1,
    maxShares: 0,
    canAccessPro: false,
    displayName: 'Free',
    colorVariant: 'gray',
  },
  BASIC: {
    maxPlans: -1, // unlimited
    maxShares: 5,
    canAccessPro: false,
    displayName: 'Basic',
    colorVariant: 'blue',
  },
  PRO: {
    maxPlans: -1, // unlimited
    maxShares: -1, // unlimited
    canAccessPro: true,
    displayName: 'Pro',
    colorVariant: 'purple',
  },
};

/**
 * Get the limits and permissions for a specific tier
 *
 * @param tier - The subscription tier to get limits for
 * @returns TierLimits object with feature limits and permissions
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  // Defensive fallback: return FREE limits if tier is invalid
  return TIER_LIMITS[tier] || TIER_LIMITS.FREE;
}

/**
 * Check if a tier has access to a specific feature
 * 
 * @param tier - The user's current subscription tier
 * @param feature - The feature to check access for
 * @returns true if the tier has access to the feature
 */
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: 'unlimited_plans' | 'plan_sharing' | 'pro_features' | 'expert_calls'
): boolean {
  const limits = getTierLimits(tier);
  
  switch (feature) {
    case 'unlimited_plans':
      return limits.maxPlans === -1;
    case 'plan_sharing':
      return limits.maxShares > 0;
    case 'pro_features':
      return limits.canAccessPro;
    case 'expert_calls':
      return tier === 'PRO'; // Expert calls are Pro-only
    default:
      return false;
  }
}

/**
 * Check if a user has reached their plan limit
 * 
 * @param tier - The user's subscription tier
 * @param currentPlanCount - Number of plans the user currently has
 * @returns true if user has reached their limit, false if they can create more
 */
export function hasReachedPlanLimit(
  tier: SubscriptionTier,
  currentPlanCount: number
): boolean {
  const limits = getTierLimits(tier);
  
  // Unlimited plans (-1) means never reached limit
  if (limits.maxPlans === -1) {
    return false;
  }
  
  return currentPlanCount >= limits.maxPlans;
}

/**
 * Get the tier hierarchy level (for comparison)
 *
 * @param tier - The subscription tier
 * @returns Numeric level (0=FREE, 1=BASIC, 2=PRO)
 */
export function getTierLevel(tier: SubscriptionTier): number {
  const levels: Record<SubscriptionTier, number> = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
  };
  // Defensive fallback: return FREE level (0) if tier is invalid
  return levels[tier] ?? 0;
}

/**
 * Check if a tier meets the minimum required tier
 * 
 * @param userTier - The user's current tier
 * @param requiredTier - The minimum tier required
 * @returns true if user's tier meets or exceeds the requirement
 */
export function meetsMinimumTier(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return getTierLevel(userTier) >= getTierLevel(requiredTier);
}

