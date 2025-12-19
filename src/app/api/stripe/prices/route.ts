import { NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stripe/prices
 * Fetches current Stripe prices for Basic and Pro tiers
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Fetch both price objects from Stripe
    const [basicPrice, proPrice] = await Promise.all([
      stripe.prices.retrieve(STRIPE_CONFIG.basicPriceId, {
        expand: ['product'],
      }),
      stripe.prices.retrieve(STRIPE_CONFIG.proPriceId, {
        expand: ['product'],
      }),
    ]);

    // Format prices for client consumption
    const formatPrice = (price: typeof basicPrice) => {
      const amount = price.unit_amount ? price.unit_amount / 100 : 0;
      const currency = price.currency.toUpperCase();
      const interval = price.recurring?.interval || 'month';

      return {
        id: price.id,
        amount,
        currency,
        interval,
        formattedAmount: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: price.currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(amount),
      };
    };

    return NextResponse.json({
      basic: formatPrice(basicPrice),
      pro: formatPrice(proPrice),
    });
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch pricing information',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
