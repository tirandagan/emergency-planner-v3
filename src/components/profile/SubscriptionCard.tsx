"use client";

import { useState, useEffect } from 'react';
import { TierBadge } from './TierBadge';
import { StatusIndicator } from './StatusIndicator';
import { UpgradeButton } from './UpgradeButton';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { getPaymentMethod } from '@/app/actions/profile';
import { createCustomerPortalSession } from '@/app/actions/subscriptions';
import { toast } from 'sonner';

interface SubscriptionCardProps {
  subscription: {
    tier: string;
    status: string | null;
    periodEnd: Date | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
  };
  userId: string;
  userEmail: string;
}

export function SubscriptionCard({
  subscription,
  userId,
  userEmail,
}: SubscriptionCardProps) {
  const [paymentMethod, setPaymentMethod] = useState<{
    brand: string;
    last4: string;
  } | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Fetch payment method for paid tiers
    if (!subscription.stripeCustomerId || subscription.tier === 'FREE') {
      return;
    }

    const fetchPaymentMethod = async (): Promise<void> => {
      setIsLoadingPayment(true);
      try {
        const result = await getPaymentMethod(subscription.stripeCustomerId!);
        if (result.success && result.data) {
          setPaymentMethod(result.data);
        }
      } catch (error) {
        console.error('Error fetching payment method:', error);
      } finally {
        setIsLoadingPayment(false);
      }
    };

    fetchPaymentMethod();
  }, [subscription.stripeCustomerId, subscription.tier]);

  const handleManageSubscription = async (): Promise<void> => {
    if (!subscription.stripeCustomerId) {
      toast.error('No Stripe customer ID found. Please contact support.');
      return;
    }

    setIsRedirecting(true);
    toast.info('Redirecting to Stripe billing portal...');

    const result = await createCustomerPortalSession(subscription.stripeCustomerId);

    if (result.success) {
      window.location.href = result.portalUrl;
    } else {
      toast.error(result.error || 'Failed to open billing portal');
      setIsRedirecting(false);
    }
  };

  const isPaidTier = subscription.tier !== 'FREE';
  const isBasicTier = subscription.tier === 'BASIC';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Current Subscription Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">Current Subscription</h2>

        <div className="space-y-5">
          {/* Tier */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Plan</span>
            <TierBadge tier={subscription.tier as 'FREE' | 'BASIC' | 'PRO'} size="md" />
          </div>

          {/* Status */}
          {subscription.status && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</span>
              <StatusIndicator status={subscription.status} />
            </div>
          )}

          {/* Renewal Date (for paid tiers) */}
          {subscription.periodEnd && isPaidTier && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Next Billing Date</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {new Date(subscription.periodEnd).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Payment Method */}
          {isPaidTier && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Payment Method</span>
              {isLoadingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : paymentMethod ? (
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {paymentMethod.brand} •••• {paymentMethod.last4}
                </span>
              ) : (
                <span className="text-sm text-slate-500 dark:text-slate-400">No payment method</span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
          {subscription.tier === 'FREE' && (
            <div className="space-y-3">
              <UpgradeButton
                targetTier="BASIC"
                currentTier={subscription.tier}
                userId={userId}
                userEmail={userEmail}
                label="Upgrade to Basic"
                price="$9.99/month"
              />
              <UpgradeButton
                targetTier="PRO"
                currentTier={subscription.tier}
                userId={userId}
                userEmail={userEmail}
                label="Upgrade to Pro"
                price="$49.99/month"
                variant="premium"
              />
            </div>
          )}

          {isBasicTier && (
            <div className="space-y-3">
              <UpgradeButton
                targetTier="PRO"
                currentTier={subscription.tier}
                userId={userId}
                userEmail={userEmail}
                label="Upgrade to Pro"
                price="$49.99/month"
                variant="premium"
              />
              <Button
                onClick={handleManageSubscription}
                disabled={isRedirecting}
                variant="outline"
                className="w-full h-auto py-3 border-slate-300 dark:border-slate-700"
              >
                <div className="flex items-center justify-center gap-2">
                  {isRedirecting ? (
                    <>
                      <Loader2 className="!w-4 !h-4 animate-spin" />
                      <span>Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Manage Subscription</span>
                      <ExternalLink className="!w-4 !h-4" aria-hidden="true" />
                    </>
                  )}
                </div>
              </Button>
            </div>
          )}

          {subscription.tier === 'PRO' && (
            <Button
              onClick={handleManageSubscription}
              disabled={isRedirecting}
              variant="outline"
              className="w-full h-auto py-3 border-slate-300 dark:border-slate-700"
            >
              <div className="flex items-center justify-center gap-2">
                {isRedirecting ? (
                  <>
                    <Loader2 className="!w-4 !h-4 animate-spin" />
                    <span>Redirecting...</span>
                  </>
                ) : (
                  <>
                    <span>Manage Subscription</span>
                    <ExternalLink className="!w-4 !h-4" aria-hidden="true" />
                  </>
                )}
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* Tier Benefits Comparison (for Free users) */}
      {subscription.tier === 'FREE' && (
        <div className="bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 dark:border-primary/30 p-6 md:p-8">
          <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-slate-100">
            Upgrade to unlock more features
          </h3>
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Basic Tier */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700">
                <TierBadge tier="BASIC" size="sm" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  $9.99/month
                </span>
              </div>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Unlimited saved plans</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Share plans with 5 people</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Inventory history tracking</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Founder group calls access</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Educational drip campaigns</span>
                </li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-700">
                <TierBadge tier="PRO" size="sm" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  $49.99/month
                </span>
              </div>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Everything in Basic</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Share plans with 50 people</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Expert webinar library access</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Quarterly 1-on-1 consultation</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 text-base flex-shrink-0">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">Advanced analytics & insights</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Canceled Subscription Notice */}
      {subscription.status === 'canceled' && subscription.periodEnd && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700 p-5 md:p-6">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 text-base">
            Subscription Canceled
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-5">
            Your subscription will remain active until{' '}
            <span className="font-semibold">
              {new Date(subscription.periodEnd).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            . You can reactivate at any time.
          </p>
          <div className="space-y-3">
            {subscription.tier === 'BASIC' && (
              <UpgradeButton
                targetTier="BASIC"
                currentTier="FREE"
                userId={userId}
                userEmail={userEmail}
                label="Reactivate Basic Plan"
                price="$9.99/month"
              />
            )}
            {subscription.tier === 'PRO' && (
              <UpgradeButton
                targetTier="PRO"
                currentTier="FREE"
                userId={userId}
                userEmail={userEmail}
                label="Reactivate Pro Plan"
                price="$49.99/month"
                variant="premium"
              />
            )}
          </div>
        </div>
      )}

      {/* Past Due Notice */}
      {subscription.status === 'past_due' && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700 p-5 md:p-6">
          <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2 text-base">
            Payment Failed
          </h3>
          <p className="text-sm text-red-800 dark:text-red-200 mb-5">
            Your last payment was unsuccessful. Please update your payment method to continue
            accessing {subscription.tier} features.
          </p>
          <Button
            onClick={handleManageSubscription}
            disabled={isRedirecting}
            className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white h-auto py-3"
          >
            <div className="flex items-center justify-center gap-2">
              {isRedirecting ? (
                <>
                  <Loader2 className="!w-4 !h-4 animate-spin" />
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Update Payment Method</span>
                  <ExternalLink className="!w-4 !h-4" aria-hidden="true" />
                </>
              )}
            </div>
          </Button>
        </div>
      )}
    </div>
  );
}

