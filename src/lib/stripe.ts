import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
  typescript: true,
});

export const STRIPE_CONFIG = {
  basicPriceId: process.env.STRIPE_BASIC_PRICE_ID!,
  proPriceId: process.env.STRIPE_PRO_PRICE_ID!,
  customerPortalUrl: process.env.STRIPE_CUSTOMER_PORTAL_URL,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
} as const;

/**
 * Verify Stripe configuration is complete
 * Call this during app initialization to catch missing config early
 */
export function verifyStripeConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!process.env.STRIPE_BASIC_PRICE_ID) missing.push('STRIPE_BASIC_PRICE_ID');
  if (!process.env.STRIPE_PRO_PRICE_ID) missing.push('STRIPE_PRO_PRICE_ID');
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');

  return {
    valid: missing.length === 0,
    missing,
  };
}











