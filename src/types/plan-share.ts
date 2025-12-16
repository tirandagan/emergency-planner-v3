/**
 * Plan Share Types
 * Types for sharing mission reports with tier-based limits
 */

import type { PlanShare } from '@/db/schema';

/**
 * Share permission levels
 */
export type SharePermission = 'view' | 'edit';

/**
 * Share status derived from expiration
 */
export type ShareStatus = 'active' | 'expired' | 'accessed';

/**
 * Subscription tier limits for sharing
 */
export interface TierShareLimits {
  FREE: number; // 0 shares
  BASIC: number; // 5 shares
  PRO: number; // 50 shares
}

export const TIER_SHARE_LIMITS: TierShareLimits = {
  FREE: 0,
  BASIC: 5,
  PRO: 50,
};

/**
 * Share validation result
 */
export interface ShareValidationResult {
  canShare: boolean;
  currentShareCount: number;
  tierLimit: number;
  remainingShares: number;
  error?: string;
}

/**
 * Extended plan share with status
 */
export interface PlanShareWithStatus extends PlanShare {
  status: ShareStatus;
  isExpired: boolean;
  daysUntilExpiration: number;
}

/**
 * Share link data for public routes
 */
export interface ShareLinkData {
  token: string;
  missionReportId: string;
  permissions: SharePermission;
  expiresAt: Date;
  sharedByUserId: string;
}

/**
 * Email share request
 */
export interface EmailShareRequest {
  reportId: string;
  emails: string[];
  permissions: SharePermission;
  message?: string;
}

/**
 * Link share request
 */
export interface LinkShareRequest {
  reportId: string;
  permissions: SharePermission;
  expirationDays?: number; // Default 30 days
}
