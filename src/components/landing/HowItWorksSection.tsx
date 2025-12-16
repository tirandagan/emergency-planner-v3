import React from 'react';
import { FileQuestion, Sparkles, Package, CheckCircle } from 'lucide-react';

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            How{' '}
            <span className="text-primary">
              It Works
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From overwhelmed to prepared in 4 simple steps. No expertise required.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="relative">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 hover:border-primary/50 transition-all">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <FileQuestion className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                1
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Answer Simple Questions
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Tell us about your location, family size, living situation, and concerns. Takes just 5 minutes.
              </p>
            </div>
            {/* Connector Arrow - Hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 hover:border-primary/50 transition-all">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                2
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI Generates Your Plan
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI analyzes your situation, local risks, and best practices to create a customized preparedness roadmap.
              </p>
            </div>
            {/* Connector Arrow - Hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 hover:border-primary/50 transition-all">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Browse Curated Bundles
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Shop pre-vetted gear bundles matched to your plan. No more guessing what to buy or endless product research.
              </p>
            </div>
            {/* Connector Arrow - Hidden on mobile */}
            <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-primary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Step 4 */}
          <div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 hover:border-primary/50 transition-all">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute top-6 right-6 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                4
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Track Your Readiness
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Complete tasks at your own pace. See your progress grow from unprepared to fully ready for emergencies.
              </p>
            </div>
          </div>
        </div>

        {/* Result Callout */}
        <div className="mt-16 bg-primary/10 border border-primary/20 rounded-xl p-8 text-center">
          <p className="text-2xl font-semibold text-foreground mb-2">
            Result: Complete peace of mind in{' '}
            <span className="text-primary">under 30 minutes</span>
          </p>
          <p className="text-muted-foreground">
            Instead of 40+ hours of research and hundreds of dollars in wrong purchases
          </p>
        </div>
      </div>
    </section>
  );
}

