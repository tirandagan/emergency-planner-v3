import React from 'react';
import { AlertTriangle, Clock, DollarSign, Package, Shield } from 'lucide-react';

export default function ProblemSection() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Emergency Preparedness{' '}
            <span className="text-primary">
              Shouldn&rsquo;t Be This Hard
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most families want to be prepared, but the process is overwhelming, time-consuming, and filled with conflicting advice.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pain Point 1 */}
          <div className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-all">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">40-60 Hours Wasted</h3>
            <p className="text-muted-foreground">
              Researching across fragmented blogs, forums, and outdated guides—only to feel more confused.
            </p>
          </div>

          {/* Pain Point 2 */}
          <div className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-all">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">$200-500 Wasted</h3>
            <p className="text-muted-foreground">
              Buying the wrong gear based on generic advice that doesn&rsquo;t match your location or needs.
            </p>
          </div>

          {/* Pain Point 3 */}
          <div className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-all">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Decision Paralysis</h3>
            <p className="text-muted-foreground">
              Overwhelmed by conflicting advice from preppers, FEMA, and survivalist forums—unsure where to start.
            </p>
          </div>

          {/* Pain Point 4 */}
          <div className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-all">
            <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">72% Lack Basic Kits</h3>
            <p className="text-muted-foreground">
              Despite good intentions, most families never complete even a basic 72-hour emergency kit.
            </p>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Before */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              The Old Way
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✗</span>
                <span>Weeks of scattered research across unreliable sources</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✗</span>
                <span>Generic checklists that don&rsquo;t match your situation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✗</span>
                <span>Buying gear you don&rsquo;t need, missing critical items</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-destructive mt-1">✗</span>
                <span>Plans gather dust because they&rsquo;re too complex</span>
              </li>
            </ul>
          </div>

          {/* After */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              The beprepared.ai Way
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>AI-powered plans generated in minutes, not weeks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Location-specific guidance tailored to your risks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Curated product bundles matched to your exact needs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span>Actionable steps you can complete one at a time</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

