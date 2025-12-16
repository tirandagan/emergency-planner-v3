'use client';

/**
 * Guest Upgrade Banner Component
 * Non-intrusive upgrade prompt for free account recipients viewing shared plans
 */

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface GuestUpgradeBannerProps {
  onDismiss?: () => void;
  variant?: 'compact' | 'full';
  className?: string;
}

export function GuestUpgradeBanner({
  onDismiss,
  variant = 'compact',
  className = '',
}: GuestUpgradeBannerProps): React.JSX.Element {
  if (variant === 'compact') {
    return (
      <Card className={`relative border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 ${className}`}>
        <div className="flex items-center gap-3 p-4">
          {/* Icon */}
          <div className="shrink-0">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Create Your Own Emergency Plan
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get a personalized disaster preparedness plan tailored to your family, location, and needs.
            </p>
          </div>

          {/* CTA */}
          <Button asChild size="sm" className="shrink-0">
            <Link href="/auth/register">
              Get Started
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>

          {/* Dismiss */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </Card>
    );
  }

  // Full variant with more details
  return (
    <Card className={`relative border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 ${className}`}>
      <div className="p-6">
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground mb-1">
              Create Your Own Emergency Plan
            </h2>
            <p className="text-sm text-muted-foreground">
              Someone shared this plan with you. Now it's your turn to create a personalized
              disaster preparedness plan for your family.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div>
            <div className="text-sm font-medium text-foreground mb-1">
              🎯 Personalized Plans
            </div>
            <div className="text-xs text-muted-foreground">
              Tailored to your location, family size, and specific needs
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-1">
              🚗 Evacuation Routes
            </div>
            <div className="text-xs text-muted-foreground">
              AI-generated evacuation routes with real-time mapping
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-foreground mb-1">
              📦 Supply Bundles
            </div>
            <div className="text-xs text-muted-foreground">
              Curated emergency supply recommendations and shopping lists
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="flex-1 sm:flex-initial">
            <Link href="/auth/register">
              <Sparkles className="mr-2 h-4 w-4" />
              Create Free Account
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1 sm:flex-initial">
            <Link href="/">
              Learn More
            </Link>
          </Button>
        </div>

        {/* Footnote */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Free account includes 1 emergency plan. Upgrade for unlimited plans and sharing.
        </p>
      </div>
    </Card>
  );
}
