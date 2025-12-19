import Link from 'next/link';
import { Check, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

/**
 * Pricing Page
 *
 * Displays subscription tiers and their features.
 * Links to authentication for sign up or upgrade.
 */

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
    cta: 'Get Started Free',
    ctaLink: '/auth/sign-up',
    highlighted: false,
    icon: Shield,
  },
  {
    name: 'Basic',
    price: '$9',
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
    cta: 'Sign Up to Subscribe',
    ctaLink: '/auth/sign-up',
    highlighted: true,
    icon: Zap,
  },
  {
    name: 'Pro',
    price: '$29',
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
    cta: 'Sign Up for Pro',
    ctaLink: '/auth/sign-up',
    highlighted: false,
    icon: Sparkles,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
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
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              return (
                <Card
                  key={tier.name}
                  className={`relative flex flex-col ${
                    tier.highlighted
                      ? 'border-primary shadow-lg scale-105 z-10'
                      : 'border-border'
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      <span className="text-muted-foreground">{tier.period}</span>
                    </div>
                    <ul className="space-y-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      className="w-full"
                      variant={tier.highlighted ? 'default' : 'outline'}
                    >
                      <Link href={tier.ctaLink}>{tier.cta}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
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
