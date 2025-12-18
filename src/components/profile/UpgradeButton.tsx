"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createCheckoutSession } from '@/app/actions/subscriptions';
import { Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeButtonProps {
  targetTier: 'BASIC' | 'PRO';
  currentTier: string;
  userId: string;
  userEmail: string;
  label: string;
  price: string;
  variant?: 'default' | 'premium';
}

export function UpgradeButton({
  targetTier,
  currentTier,
  userId,
  userEmail,
  label,
  price,
  variant = 'default',
}: UpgradeButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUpgrade = async (): Promise<void> => {
    setIsRedirecting(true);
    toast.info('Redirecting to Stripe Checkout...');

    const result = await createCheckoutSession(targetTier, userId, userEmail);

    // DEBUG: Log the result to console
    console.log('[UpgradeButton] createCheckoutSession result:', result);

    if (result.success) {
      console.log('[UpgradeButton] Success! Redirecting to:', result.checkoutUrl);
      window.location.href = result.checkoutUrl;
    } else {
      console.log('[UpgradeButton] Error occurred:', result.error);
      toast.error(result.error || 'Failed to start checkout');
      setIsRedirecting(false);
    }
  };

  const isPremium = variant === 'premium';
  const isAlreadyAtTier =
    currentTier === targetTier || (targetTier === 'BASIC' && currentTier === 'PRO');

  return (
    <Button
      onClick={handleUpgrade}
      disabled={isRedirecting || isAlreadyAtTier}
      className={cn(
        'w-full group relative h-auto py-3',
        isPremium
          ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'
          : 'bg-primary/90 hover:bg-primary text-primary-foreground'
      )}
    >
      {isRedirecting ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="!w-4 !h-4 animate-spin" />
          <span>Redirecting to Stripe...</span>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex-1 text-left">
            <div className="font-semibold text-base">{label}</div>
            <div className="text-xs opacity-90 font-normal">{price}</div>
          </div>
          <ArrowRight className="!w-5 !h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </div>
      )}
    </Button>
  );
}

