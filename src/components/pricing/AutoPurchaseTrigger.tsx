'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createCheckoutSession } from '@/app/actions/subscriptions';

interface AutoPurchaseTriggerProps {
  user: {
    id: string;
    email: string;
  } | null;
}

/**
 * Component that auto-triggers purchase flow when user returns from auth
 * with a tier parameter in the URL
 */
export function AutoPurchaseTrigger({ user }: AutoPurchaseTriggerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const tier = searchParams.get('tier');

    // Only trigger if:
    // 1. User is authenticated
    // 2. Tier parameter exists and is valid
    // 3. Haven't already triggered in this session
    if (user && tier && !hasTriggered && (tier === 'basic' || tier === 'pro')) {
      setHasTriggered(true);

      // Auto-trigger purchase flow
      const tierUppercase = tier.toUpperCase() as 'BASIC' | 'PRO';

      toast.info('Starting your subscription...');

      createCheckoutSession(tierUppercase, user.id, user.email)
        .then((result) => {
          if (result.success) {
            // Redirect to Stripe checkout
            window.location.href = result.checkoutUrl;
          } else {
            toast.error(result.error || 'Failed to start checkout');
            // Clear the tier parameter from URL
            router.replace('/pricing');
          }
        })
        .catch((error) => {
          console.error('Error creating checkout session:', error);
          toast.error('An unexpected error occurred. Please try again.');
          // Clear the tier parameter from URL
          router.replace('/pricing');
        });
    }
  }, [user, searchParams, hasTriggered, router]);

  return null; // This component doesn't render anything
}
