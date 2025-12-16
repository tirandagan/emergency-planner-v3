'use client';

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PricingToggle from './PricingToggle';

export default function FeaturesComparisonSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  // Calculate prices based on billing period
  const basicPrice = isAnnual ? '7.99' : '9.99';
  const proPrice = isAnnual ? '39.99' : '49.99';
  const basicAnnualTotal = isAnnual ? '$95.88/year' : 'per month';
  const proAnnualTotal = isAnnual ? '$479.88/year' : 'per month';

  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your{' '}
            <span className="text-primary">
              Preparedness Level
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free, upgrade as your family&rsquo;s needs grow. Every tier gets you closer to complete readiness.
          </p>
          
          {/* Pricing Toggle */}
          <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </div>

        {/* Comparison Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-background border border-border rounded-xl p-8 hover:border-primary/30 transition-all">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Free</h3>
              <div className="text-4xl font-bold text-foreground mb-2">$0</div>
              <p className="text-muted-foreground">Forever free</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">1 basic emergency plan</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Location-specific risk assessment</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Basic gear checklist</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Access to marketplace</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground/60">Multi-scenario planning</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground/60">Priority support</span>
              </li>
            </ul>

            <Link href="/auth/sign-up" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Basic Tier */}
          <div className="bg-background border-2 border-primary rounded-xl p-8 relative shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Basic</h3>
              <div className="text-4xl font-bold text-foreground mb-2">${basicPrice}</div>
              <p className="text-muted-foreground">{basicAnnualTotal}</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground font-medium">Everything in Free, plus:</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Unlimited emergency plans</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Multi-scenario planning (earthquakes, fires, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Detailed gear recommendations</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Progress tracking dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <X className="w-5 h-5 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground/60">Custom evacuation routes</span>
              </li>
            </ul>

            <Link href="/auth/sign-up" className="block">
              <Button className="w-full" size="lg">
                Start Basic Plan
              </Button>
            </Link>
          </div>

          {/* Pro Tier */}
          <div className="bg-background border border-border rounded-xl p-8 hover:border-primary/30 transition-all">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">Pro</h3>
              <div className="text-4xl font-bold text-foreground mb-2">${proPrice}</div>
              <p className="text-muted-foreground">{proAnnualTotal}</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground font-medium">Everything in Basic, plus:</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">AI-powered custom evacuation routes</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Family communication plans</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Critical skills training guides</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Priority email support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">Quarterly plan updates</span>
              </li>
            </ul>

            <Link href="/auth/sign-up" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include access to our curated emergency supplies marketplace with affiliate partner discounts
          </p>
        </div>
      </div>
    </section>
  );
}

