import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQSection() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Frequently Asked{' '}
            <span className="text-primary">
              Questions
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Get answers to common questions about beprepared.ai
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1" className="bg-muted/50 border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                How is beprepared.ai different from free FEMA resources?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              FEMA provides excellent general guidelines, but they&rsquo;re not personalized to your specific situation.
              beprepared.ai takes FEMA&rsquo;s best practices and combines them with your location, family size, housing type,
              and local risks to create a customized plan. Plus, we curate specific products so you don&rsquo;t waste time
              researching what to buy.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="bg-muted/50 border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                Do I need to be a &ldquo;prepper&rdquo; to use this?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              Not at all! beprepared.ai is designed for everyday families who want to be responsibly prepared—not extreme
              survivalists. Our plans focus on practical, realistic preparedness that fits into normal life. Think of it as
              having a fire extinguisher and smoke detector: smart preparation, not paranoia.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="bg-muted/50 border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                How does the AI know what&rsquo;s right for my area?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              Our AI analyzes real-time data from NOAA, FEMA, USGS, and local emergency management agencies to understand
              the specific risks in your area—earthquakes, hurricanes, floods, wildfires, etc. It then creates plans based
              on professional emergency management guidelines tailored to your location&rsquo;s most likely scenarios.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="bg-muted/50 border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                What if I live in an apartment or rent?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              Perfect! Our plans adapt to your living situation. We provide renters-friendly recommendations that don&rsquo;t
              require permanent modifications and focus on portable, apartment-appropriate gear. You&rsquo;ll get evacuation
              strategies specific to multi-unit housing and storage solutions that work in limited space.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="bg-muted/50 border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                Do I have to buy products through your marketplace?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              No! You can take our gear recommendations and buy products anywhere you prefer. Our marketplace is optional
              and provides convenience—pre-vetted bundles with affiliate discounts. Many users appreciate having the research
              done for them, but you&rsquo;re free to shop elsewhere using our checklists as a guide.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="bg-muted/50 border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                Can I cancel anytime?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              Yes. There are no long-term contracts or cancellation fees. You can downgrade from Basic to Free or cancel Pro
              at any time. Your plans and data remain accessible on the Free tier even if you cancel a paid subscription.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7" className="bg-muted/50 border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                Is my personal information secure?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              Absolutely. We use bank-level encryption (AES-256) to protect your data, and we never sell or share your
              personal information. Your address and family details are stored securely and only used to generate your
              personalized plans. Read our full privacy policy for detailed information.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="bg-muted/50 border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="font-semibold text-foreground">
                What happens after I create my plan?
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              You&rsquo;ll get a step-by-step action plan broken into manageable tasks you can complete at your own pace.
              Track your progress on your dashboard, access gear recommendations, and update your plan as your family&rsquo;s
              situation changes. Pro users get quarterly reminders to review and refresh their plans.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Additional Help */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Still have questions?</p>
          <a
            href="mailto:support@beprepared.ai"
            className="text-primary hover:underline font-medium"
          >
            Contact our support team
          </a>
        </div>
      </div>
    </section>
  );
}

