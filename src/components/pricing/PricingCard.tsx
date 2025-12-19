'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Shield, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { createCheckoutSession } from '@/app/actions/subscriptions';
import { useRouter } from 'next/navigation';

// Map icon names to components
const iconMap = {
  shield: Shield,
  zap: Zap,
  sparkles: Sparkles,
} as const;

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  iconName: 'shield' | 'zap' | 'sparkles';
  tier: 'FREE' | 'BASIC' | 'PRO';
  currentTier: 'FREE' | 'BASIC' | 'PRO';
  selectedTier: 'FREE' | 'BASIC' | 'PRO';
  isSelected: boolean;
  user: {
    id: string;
    email: string;
  } | null;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  highlighted,
  iconName,
  tier,
  currentTier,
  selectedTier,
  isSelected,
  user,
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const Icon = iconMap[iconName];

  // Tier hierarchy for comparison
  const tierHierarchy = { FREE: 0, BASIC: 1, PRO: 2 };
  const isCurrentTier = tier === currentTier;
  const isUpgrade = tierHierarchy[tier] > tierHierarchy[currentTier];
  const isDowngrade = tierHierarchy[tier] < tierHierarchy[currentTier];

  const handlePurchase = async (): Promise<void> => {
    // Current tier - do nothing
    if (isCurrentTier) {
      return;
    }

    // Free tier - just sign up
    if (tier === 'FREE') {
      if (!user) {
        router.push('/auth/sign-up');
      } else {
        // User wants to downgrade to free - redirect to customer portal
        toast.info('Please use your account settings to manage your subscription.');
        router.push('/profile?tab=subscription');
      }
      return;
    }

    // Check if user is authenticated
    if (!user) {
      // Redirect to sign-in with return URL to come back to pricing with selected tier
      const returnUrl = encodeURIComponent(`/pricing?tier=${tier.toLowerCase()}`);
      router.push(`/auth/sign-in?redirect=${returnUrl}`);
      return;
    }

    // Downgrade - redirect to account settings
    if (isDowngrade) {
      toast.info('To downgrade your plan, please visit your account settings.');
      router.push('/profile?tab=subscription');
      return;
    }

    // User is authenticated and upgrading - proceed with checkout
    setIsLoading(true);
    toast.info('Redirecting to Stripe Checkout...');

    try {
      const result = await createCheckoutSession(tier, user.id, user.email);

      if (result.success) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error(result.error || 'Failed to start checkout');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const getButtonText = (): string => {
    if (isCurrentTier) {
      return 'Current Plan';
    }
    if (tier === 'FREE') {
      if (!user) {
        return 'Get Started Free';
      }
      return 'Downgrade to Free';
    }
    if (!user) {
      return 'Sign In to Subscribe';
    }
    if (isUpgrade) {
      return `Upgrade to ${name}`;
    }
    if (isDowngrade) {
      return `Downgrade to ${name}`;
    }
    return `Subscribe to ${name}`;
  };

  return (
    <Card
      className={`relative flex flex-col h-full transition-all ${
        isSelected
          ? 'border-black dark:border-white ring-4 ring-black/20 dark:ring-white/20 shadow-xl'
          : 'border-border'
      }`}
    >
      {isCurrentTier && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-green-500 text-white text-sm font-medium px-4 py-1 rounded-full">
            Current Plan
          </span>
        </div>
      )}
      {!isCurrentTier && highlighted && (
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
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handlePurchase}
          disabled={isLoading || isCurrentTier}
          className="w-full"
          variant={
            isCurrentTier
              ? 'secondary'
              : isUpgrade && highlighted
                ? 'default'
                : isUpgrade
                  ? 'default'
                  : isDowngrade
                    ? 'outline'
                    : 'outline'
          }
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            getButtonText()
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
