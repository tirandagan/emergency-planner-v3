import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get: (_, prop) => {
    const stripeInstance = getStripe();
    const value = stripeInstance[prop as keyof Stripe];
    return typeof value === 'function' ? value.bind(stripeInstance) : value;
  },
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











