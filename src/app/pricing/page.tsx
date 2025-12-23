import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PricingSelector } from '@/components/pricing/PricingSelector';
import { AutoPurchaseTrigger } from '@/components/pricing/AutoPurchaseTrigger';
import { createClient } from '@/utils/supabase/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Pricing Plans - Emergency Preparedness Subscriptions',
  description: 'Simple, transparent pricing for beprepared.ai. Free plan includes 1 emergency plan. Basic ($9/mo) and Pro ($29/mo) plans offer unlimited plans, expert consultations, and advanced features for comprehensive family disaster preparedness.',
  keywords: [
    'emergency preparedness pricing',
    'disaster planning subscription',
    'emergency plan cost',
    'preparedness subscription',
    'family emergency plan pricing',
    'disaster readiness plans',
  ],
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'beprepared.ai Pricing - Affordable Emergency Preparedness Plans',
    description: 'Choose the plan that fits your family. Free forever plan available. Paid plans start at $9/mo with unlimited emergency plans and expert support.',
    type: 'website',
    url: '/pricing',
  },
  twitter: {
    card: 'summary',
    title: 'Simple Pricing for Emergency Preparedness',
    description: 'Free plan available. Paid plans from $9/mo with unlimited emergency plans and expert consultations.',
  },
};

/**
 * Pricing Page
 *
 * Displays subscription tiers and their features.
 * Fetches dynamic pricing from Stripe and handles authentication flow.
 */

interface StripePrice {
  amount: number;
  currency: string;
  interval: string;
  formattedAmount: string;
}

async function getStripePrices(): Promise<{
  basic: StripePrice;
  pro: StripePrice;
} | null> {
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

    // Format prices
    const formatPrice = (price: typeof basicPrice): StripePrice => {
      const amount = price.unit_amount ? price.unit_amount / 100 : 0;
      const currency = price.currency.toUpperCase();
      const interval = price.recurring?.interval || 'month';

      return {
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

    return {
      basic: formatPrice(basicPrice),
      pro: formatPrice(proPrice),
    };
  } catch (error) {
    console.error('Error fetching Stripe prices:', error);
    return null;
  }
}

export default async function PricingPage() {
  // Fetch current user (if authenticated)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's subscription tier if authenticated
  let currentTier: 'FREE' | 'BASIC' | 'PRO' = 'FREE';
  if (user) {
    const [profile] = await db
      .select({ subscriptionTier: profiles.subscriptionTier })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile) {
      currentTier = profile.subscriptionTier as 'FREE' | 'BASIC' | 'PRO';
    }
  }

  // Fetch dynamic pricing from Stripe
  const prices = await getStripePrices();

  // Fallback to static prices if Stripe fetch fails
  const basicPrice = prices?.basic.formattedAmount || '$9';
  const proPrice = prices?.pro.formattedAmount || '$29';

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Get started with basic emergency planning',
      features: [
        '1 emergency plan',
        'AI-powered recommendations',
        'Basic supply checklists',
        'Community resources',
      ],
      highlighted: false,
      iconName: 'shield' as const,
      tier: 'FREE' as const,
    },
    {
      name: 'Basic',
      price: basicPrice,
      period: '/month',
      description: 'For families who want comprehensive coverage',
      features: [
        'Unlimited emergency plans',
        'Share plans with 5 people',
        'Advanced AI recommendations',
        'Custom supply lists',
        'Founder video calls',
        'Priority email support',
      ],
      highlighted: true,
      iconName: 'zap' as const,
      tier: 'BASIC' as const,
    },
    {
      name: 'Pro',
      price: proPrice,
      period: '/month',
      description: 'Complete protection for serious preparedness',
      features: [
        'Everything in Basic',
        'Unlimited plan sharing',
        'Expert consultation calls',
        'Advanced analytics',
        'Team collaboration',
        'API access',
        'White-glove onboarding',
      ],
      highlighted: false,
      iconName: 'sparkles' as const,
      tier: 'PRO' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Auto-trigger purchase flow if user came from auth with tier parameter */}
      <AutoPurchaseTrigger
        user={
          user
            ? {
                id: user.id,
                email: user.email || '',
              }
            : null
        }
      />

      {/* Back Navigation */}
      <div className="container mx-auto px-4 pt-8">
        <Link
          href={user ? '/dashboard' : '/'}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to {user ? 'Dashboard' : 'Home'}</span>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your family&apos;s preparedness needs.
            All plans include our core AI-powered emergency planning features.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <PricingSelector
            tiers={tiers}
            currentTier={currentTier}
            user={
              user
                ? {
                    id: user.id,
                    email: user.email || '',
                  }
                : null
            }
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can change your plan at any time. Upgrades take effect immediately,
                and downgrades apply at the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                Our Free tier lets you try beprepared.ai forever with one emergency plan.
                Upgrade when you&apos;re ready for more features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards through our secure payment processor, Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Absolutely. Cancel anytime with no questions asked. You&apos;ll retain access
                until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Prepared?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of families who trust beprepared.ai for their emergency planning needs.
          </p>
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Start Your Free Plan</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
