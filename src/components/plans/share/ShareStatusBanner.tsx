'use client';

/**
 * ShareStatusBanner Component
 * Displays remaining shares count and upgrade CTA based on subscription tier
 */

import React from 'react';
import { Share2, AlertCircle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ShareStatusBannerProps {
  currentShareCount: number;
  tierLimit: number;
  tier: 'FREE' | 'BASIC' | 'PRO';
  className?: string;
}

export function ShareStatusBanner({
  currentShareCount,
  tierLimit,
  tier,
  className,
}: ShareStatusBannerProps): React.JSX.Element {
  const remainingShares = Math.max(0, tierLimit - currentShareCount);
  const usagePercentage = tierLimit > 0 ? (currentShareCount / tierLimit) * 100 : 0;

  // Determine alert variant based on usage
  const getVariant = (): 'default' | 'destructive' => {
    if (usagePercentage >= 90) return 'destructive';
    return 'default';
  };

  // Get tier upgrade info
  const getUpgradeInfo = (): { nextTier: string; nextLimit: number } | null => {
    if (tier === 'FREE') {
      return { nextTier: 'Basic', nextLimit: 5 };
    }
    if (tier === 'BASIC') {
      return { nextTier: 'Pro', nextLimit: 50 };
    }
    return null; // Already on Pro
  };

  const upgradeInfo = getUpgradeInfo();

  // Free tier - show upgrade CTA
  if (tier === 'FREE') {
    return (
      <Alert className={cn('border-primary/50 bg-primary/5', className)}>
        <Share2 className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-medium text-foreground">
              Upgrade to share your emergency plans
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Share plans with family and network contacts. Basic plan includes 5 shares, Pro
              includes 50 shares.
            </p>
          </div>
          <Button
            size="sm"
            className="ml-4"
            onClick={() => (window.location.href = '/pricing')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            View Plans
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Paid tier - show usage status
  return (
    <div className={cn('space-y-3', className)}>
      <Alert variant={getVariant()}>
        <Share2 className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">
                {remainingShares > 0 ? (
                  <>
                    {remainingShares} of {tierLimit} shares remaining
                  </>
                ) : (
                  <>Share limit reached</>
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {tier} Plan • {currentShareCount} active shares
              </p>
            </div>

            {/* Show upgrade button if near or at limit */}
            {upgradeInfo && usagePercentage >= 70 && (
              <Button
                size="sm"
                variant={usagePercentage >= 90 ? 'default' : 'outline'}
                className="ml-4"
                onClick={() => (window.location.href = '/pricing')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade to {upgradeInfo.nextTier}
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <Progress value={usagePercentage} className="h-2" />
          </div>

          {/* Warning message if near limit */}
          {usagePercentage >= 90 && remainingShares > 0 && (
            <div className="mt-3 flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                You're running low on shares.{' '}
                {upgradeInfo ? (
                  <>
                    Upgrade to {upgradeInfo.nextTier} for {upgradeInfo.nextLimit} total shares.
                  </>
                ) : (
                  <>Consider removing inactive shares to free up space.</>
                )}
              </p>
            </div>
          )}

          {/* At limit message */}
          {remainingShares === 0 && (
            <div className="mt-3 flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                {upgradeInfo ? (
                  <>
                    You've used all {tierLimit} shares on your {tier} plan. Upgrade to{' '}
                    {upgradeInfo.nextTier} for {upgradeInfo.nextLimit} total shares, or remove
                    existing shares to create new ones.
                  </>
                ) : (
                  <>
                    You've used all {tierLimit} shares. Remove existing shares to create new ones.
                  </>
                )}
              </p>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
