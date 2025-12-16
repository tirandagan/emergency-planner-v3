import React from 'react';
import { Shield, Lock, Users, Award } from 'lucide-react';

export default function TrustSignalsSection() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Trusted by Families{' '}
            <span className="text-primary">
              Nationwide
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your family&rsquo;s safety is our priority. Here&rsquo;s how we earn your trust.
          </p>
        </div>

        {/* Trust Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* Badge 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Security First</h3>
            <p className="text-sm text-muted-foreground">
              Bank-level encryption protects your family&rsquo;s sensitive location and preparedness data.
            </p>
          </div>

          {/* Badge 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Privacy Guaranteed</h3>
            <p className="text-sm text-muted-foreground">
              Your data is yours. We never sell or share your personal information with third parties.
            </p>
          </div>

          {/* Badge 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Vetted Suppliers</h3>
            <p className="text-sm text-muted-foreground">
              Every product in our marketplace is carefully reviewed by emergency preparedness experts.
            </p>
          </div>

          {/* Badge 4 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Expert-Backed</h3>
            <p className="text-sm text-muted-foreground">
              Our AI is trained on FEMA guidelines and professional emergency management practices.
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-1 mb-4">
              <div className="text-primary">★★★★★</div>
            </div>
            <p className="text-muted-foreground mb-4 italic">
              &ldquo;Finally, a preparedness tool that doesn&rsquo;t overwhelm me. The AI made a plan specific to my apartment in Seattle—including earthquake and wildfire smoke risks I hadn&rsquo;t considered.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                SM
              </div>
              <div>
                <div className="font-semibold text-foreground">Sarah M.</div>
                <div className="text-sm text-muted-foreground">Seattle, WA</div>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-1 mb-4">
              <div className="text-primary">★★★★★</div>
            </div>
            <p className="text-muted-foreground mb-4 italic">
              &ldquo;As a busy parent of three, I didn&rsquo;t have time to research everything. beprepared.ai gave me a complete plan in 10 minutes. Worth every penny for the peace of mind.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                JR
              </div>
              <div>
                <div className="font-semibold text-foreground">James R.</div>
                <div className="text-sm text-muted-foreground">Austin, TX</div>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-background border border-border rounded-xl p-6">
            <div className="flex items-center gap-1 mb-4">
              <div className="text-primary">★★★★★</div>
            </div>
            <p className="text-muted-foreground mb-4 italic">
              &ldquo;The curated gear bundles saved me hours of research and probably hundreds of dollars. No more wondering if I&rsquo;m buying the right products.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                LT
              </div>
              <div>
                <div className="font-semibold text-foreground">Lisa T.</div>
                <div className="text-sm text-muted-foreground">Denver, CO</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

