import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';

export default function FinalCTASection() {
  return (
    <section className="py-20 bg-primary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
          Start Your Family&rsquo;s{' '}
          <span className="text-primary">
            Preparedness Journey
          </span>
        </h2>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of families who have transformed from unprepared to fully ready.
          Create your first emergency plan in less than 10 minutes—completely free.
        </p>

        {/* CTA Button */}
        <div className="flex justify-center mb-8">
          <Link href="/auth">
            <Button size="lg" className="text-lg px-10 py-6 shadow-lg hover:shadow-xl transition-all">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Trust Signal */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>No credit card required</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border"></div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Cancel anytime</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-border"></div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Privacy guaranteed</span>
          </div>
        </div>

        {/* Additional Encouragement */}
        <div className="mt-12 pt-12 border-t border-border">
          <p className="text-muted-foreground text-lg">
            <span className="font-semibold text-foreground">
              Peace of mind starts today.
            </span>{' '}
            Don&rsquo;t wait for an emergency to wish you had prepared.
          </p>
        </div>
      </div>
    </section>
  );
}

