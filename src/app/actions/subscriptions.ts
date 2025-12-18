'use server';

import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { revalidatePath } from 'next/cache';
import {
  updateUserSubscription,
  type UpdateSubscriptionData,
} from '@/db/queries/users';
import { logPaymentError, logSystemError } from '@/lib/system-logger';

export type SubscriptionTier = 'BASIC' | 'PRO';

export type CreateCheckoutSessionResult =
  | { success: true; checkoutUrl: string }
  | { success: false; error: string };

export type CreatePortalSessionResult =
  | { success: true; portalUrl: string }
  | { success: false; error: string };

/**
 * Create Stripe Checkout session for subscription
 * Returns checkout URL for client to redirect to
 */
export async function createCheckoutSession(
  tier: SubscriptionTier,
  userId: string,
  userEmail: string
): Promise<CreateCheckoutSessionResult> {
  try {
    const priceId = tier === 'BASIC' ? STRIPE_CONFIG.basicPriceId : STRIPE_CONFIG.proPriceId;

    if (!priceId) {
      return {
        success: false,
        error: `Price ID not configured for ${tier} tier`,
      };
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=subscription&checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=subscription&checkout=canceled`,
      metadata: {
        userId,
        tier,
      },
    });

    if (!session.url) {
      await logPaymentError(new Error('Stripe checkout session created without URL'), {
        userId,
        stripeCustomerId: userEmail,
        amount: tier === 'BASIC' ? 9.99 : 19.99,
        currency: 'usd',
        component: 'SubscriptionActions',
        route: '/app/actions/subscriptions',
      });

      return {
        success: false,
        error: "We're experiencing issues processing your subscription. Our team has been notified and will resolve this shortly.",
      };
    }

    return { success: true, checkoutUrl: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);

    await logPaymentError(error, {
      userId,
      stripeCustomerId: userEmail,
      amount: tier === 'BASIC' ? 9.99 : 19.99,
      currency: 'usd',
      component: 'SubscriptionActions',
      route: '/app/actions/subscriptions',
    });

    return {
      success: false,
      error: error instanceof Error
        ? `Unable to process subscription: ${error.message}. Our team has been notified and will resolve this shortly.`
        : "We're experiencing technical difficulties with payment processing. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Create Stripe customer portal session
 * Returns portal URL for customer to manage their subscription
 */
export async function createCustomerPortalSession(
  stripeCustomerId: string
): Promise<CreatePortalSessionResult> {
  try {
    if (!stripeCustomerId) {
      return {
        success: false,
        error: 'No Stripe customer ID found',
      };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile?tab=subscription`,
    });

    return { success: true, portalUrl: session.url };
  } catch (error) {
    console.error('Error creating portal session:', error);

    await logPaymentError(error, {
      userId: stripeCustomerId,
      stripeCustomerId,
      component: 'SubscriptionActions',
      route: '/app/actions/subscriptions',
    });

    return {
      success: false,
      error: error instanceof Error
        ? `Unable to access subscription management: ${error.message}. Our team has been notified and will resolve this shortly.`
        : "We're experiencing technical difficulties accessing subscription management. Our team has been notified and will resolve this shortly.",
    };
  }
}

/**
 * Update user subscription in database
 * Called from webhook handler after Stripe events
 */
export async function syncUserSubscription(
  userId: string,
  data: UpdateSubscriptionData
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await updateUserSubscription(userId, data);

    if (result.success) {
      // Revalidate pages to show updated subscription
      revalidatePath('/dashboard');
      revalidatePath('/profile');
    }

    return result;
  } catch (error) {
    console.error('Error syncing user subscription:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'SubscriptionActions',
      route: '/app/actions/subscriptions',
      userAction: 'Syncing subscription from Stripe webhook',
      metadata: {
        operation: 'syncUserSubscription',
        subscriptionData: data,
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync subscription',
    };
  }
}

