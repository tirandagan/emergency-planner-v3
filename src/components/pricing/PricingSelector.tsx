'use client';

import { useState } from 'react';
import { PricingCard } from './PricingCard';

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  iconName: 'shield' | 'zap' | 'sparkles';
  tier: 'FREE' | 'BASIC' | 'PRO';
}

interface PricingSelectorProps {
  tiers: Tier[];
  currentTier: 'FREE' | 'BASIC' | 'PRO';
  user: {
    id: string;
    email: string;
  } | null;
}

export function PricingSelector({ tiers, currentTier, user }: PricingSelectorProps) {
  // Calculate default selection (next tier up from current)
  const tierHierarchy = { FREE: 0, BASIC: 1, PRO: 2 };
  const currentTierIndex = tierHierarchy[currentTier];

  const getDefaultSelectedTier = (): 'FREE' | 'BASIC' | 'PRO' => {
    // Find next tier up
    if (currentTierIndex < 2) {
      const nextTier = Object.entries(tierHierarchy).find(
        ([_, index]) => index === currentTierIndex + 1
      );
      return (nextTier?.[0] as 'FREE' | 'BASIC' | 'PRO') || currentTier;
    }
    // If already at PRO, default to PRO
    return 'PRO';
  };

  const [selectedTier, setSelectedTier] = useState<'FREE' | 'BASIC' | 'PRO'>(
    getDefaultSelectedTier()
  );

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          onClick={() => setSelectedTier(tier.tier)}
          className="cursor-pointer h-full"
        >
          <PricingCard
            {...tier}
            currentTier={currentTier}
            selectedTier={selectedTier}
            isSelected={selectedTier === tier.tier}
            user={user}
          />
        </div>
      ))}
    </div>
  );
}
