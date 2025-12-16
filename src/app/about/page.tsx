import Image from 'next/image';
import {
  Shield,
  Brain,
  Target,
  CheckCircle2,
  Package,
  Users,
  BookOpen,
  Zap,
  Heart,
  GraduationCap,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StickyNav } from './StickyNav';
import { MethodologyAccordion } from './MethodologyAccordion';
import { ResearchModal } from './ResearchModal';
import { BundleExampleModal } from './BundleExampleModal';

/**
 * About Page - Professional redesign with comprehensive methodology content
 *
 * Sections:
 * 1. Hero - Mission statement (no gradients)
 * 2. Founder Story - Tiran and Brian's partnership
 * 3. Methodology - WHAT/WHEN/KEY CATEGORIES framework
 * 4. Research Sources - Credibility and transparency
 * 5. Bundle Curation - How bundles are created
 * 6. AI Enhancement - Technology integration
 * 7. Call-to-Action - Start planning
 */

// Emergency scenarios data (using iconName for serialization to client components)
const emergencyScenarios = [
  {
    name: 'EMP / Grid Failure',
    description: 'Extended power grid failure from electromagnetic pulse or infrastructure attack',
    iconName: 'Zap',
    severity: 'Critical'
  },
  {
    name: 'Civil Unrest',
    description: 'Social instability requiring shelter-in-place or evacuation',
    iconName: 'Users',
    severity: 'High'
  },
  {
    name: 'Natural Disasters',
    description: 'Hurricanes, earthquakes, floods, wildfires, and severe weather events',
    iconName: 'CloudRain',
    severity: 'High'
  },
  {
    name: 'CBRN Threats',
    description: 'Chemical, biological, radiological, or nuclear emergency scenarios',
    iconName: 'Radiation',
    severity: 'Critical'
  },
  {
    name: 'Cyber / Infrastructure Attack',
    description: 'Coordinated attacks on critical infrastructure and utilities',
    iconName: 'Wifi',
    severity: 'High'
  },
  {
    name: 'Monetary Collapse',
    description: 'Economic instability affecting supply chains and access to goods',
    iconName: 'DollarSign',
    severity: 'Medium'
  },
];

// Key survival categories (using iconName for serialization to client components)
const keyCategories = [
  { name: 'Shelter', iconName: 'Home', description: 'Protection from elements' },
  { name: 'Water', iconName: 'Droplets', description: 'Storage and purification' },
  { name: 'Food', iconName: 'Utensils', description: 'Long-term sustenance' },
  { name: 'Protection', iconName: 'Shield', description: 'Security measures' },
  { name: 'Medical', iconName: 'Heart', description: 'First aid and health' },
  { name: 'Clothing', iconName: 'Shirt', description: 'Weather-appropriate gear' },
  { name: 'Tools', iconName: 'Wrench', description: 'Essential equipment' },
  { name: 'Fuel', iconName: 'Fuel', description: 'Energy and power' },
  { name: 'Knowledge', iconName: 'GraduationCap', description: 'Skills and training' },
];

// Timeframe solutions
const timeframes = [
  { period: '1 Week', description: 'Immediate emergency response with essential supplies', color: 'bg-emerald-500' },
  { period: '1 Month', description: 'Extended situation with sustainable resources', color: 'bg-amber-500' },
  { period: '1 Year', description: 'Long-term preparedness with self-sufficiency focus', color: 'bg-orange-500' },
  { period: '1+ Year', description: 'Complete independence and community resilience', color: 'bg-red-500' },
];

// Section configuration for sticky navigation
const sections = [
  { id: 'mission', label: 'Mission' },
  { id: 'story', label: 'Our Story' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'research', label: 'Research' },
  { id: 'bundles', label: 'Bundles' },
  { id: 'ai', label: 'AI Enhancement' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation - positioned at top, sticks below main navbar */}
      <StickyNav sections={sections} />

      {/* Hero Section - Professional, no gradients */}
      <section id="mission" className="bg-slate-50 dark:bg-slate-900 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6">
            Our Mission
          </h1>
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed">
            Bridging the gap between physical preparedness and strategic planning through
            systematic analysis, expert research, and AI-enhanced solutions.
          </p>
        </div>
      </section>

        {/* Founder Story Sections */}
        <section id="story" className="bg-white dark:bg-slate-950 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Tiran's Section */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-20">
            <div className="flex-1 lg:order-1">
              <div className="relative rounded-xl overflow-hidden border border-border shadow-sm">
                <Image
                  src="/images/tiran-gear.png"
                  alt="Tiran Dagan organizing emergency supplies"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="flex-1 lg:order-2 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-primary" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                  The Foundation
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                The Gear Expert
              </h2>
              <p className="text-lg text-foreground leading-relaxed">
                I&rsquo;m <strong>Tiran Dagan</strong>. For years, my passion has been the tangible side
                of survival—crafting the perfect bugout bag, designing backpacks, and curating emergency supplies.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                I understood the &ldquo;what&rdquo; of survival: the tools, the kits, and the physical
                necessities required to weather a storm. My focus was always on ensuring that when the
                moment came, the gear would be ready and reliable.
              </p>
            </div>
          </div>

          {/* Brian's Section */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-20 mt-8 lg:mt-0">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-primary" strokeWidth={2.5} />
                <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                  The Strategy
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Strategic & Tactical Expertise
              </h2>
              <p className="text-lg text-foreground leading-relaxed">
                But gear alone isn&rsquo;t a plan. My partner, <strong>Brian Burk</strong>,
                brings decades of strategic and tactical preparedness expertise from the highest levels.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-1" strokeWidth={2} />
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">FBI Special Response Team:</strong> Brian served
                    on the FBI&rsquo;s Special Response Team, bringing tactical planning expertise and
                    field-tested response protocols to emergency preparedness.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary shrink-0 mt-1" strokeWidth={2} />
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Proven Track Record:</strong> For years, Brian
                    has consulted with high-net-worth individuals and families, delivering complete
                    turnkey preparedness solutions tailored to their specific needs and threat landscapes.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-primary shrink-0 mt-1" strokeWidth={2} />
                  <p className="text-muted-foreground leading-relaxed">
                    <strong className="text-foreground">Community Education:</strong> Brian has presented
                    to action groups and concerned citizens, sharing tactical insights and strategic
                    planning frameworks that transform anxiety into actionable preparedness.
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Brian&rsquo;s scientific, analytical approach asks the hard questions about risk
                assessment, scenario planning, and the logic behind every decision. He transformed
                our approach from &ldquo;collecting gear&rdquo; into &ldquo;strategic preparedness.&rdquo;
              </p>
            </div>
            <div className="flex-1">
              <div className="relative rounded-xl overflow-hidden border border-border shadow-sm">
                <Image
                  src="/images/collaboration-planning.png"
                  alt="Brian Burk and Tiran Dagan strategic planning"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

          {/* Partnership Conclusion */}
          <div className="text-center max-w-4xl mx-auto">
            <HeartHandshake className="w-12 h-12 text-primary mx-auto mb-6" strokeWidth={2} />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              The Birth of beprepared.ai
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The intersection of practical experience with gear and scientific methodology created
              something stronger than either could build alone. This platform is the result of that
              partnership—a tool designed to help you plan smarter, pack better, and be truly ready
              for anything.
            </p>
          </div>
        </div>
      </section>

      {/* Comprehensive Methodology Section */}
      <section id="methodology" className="bg-slate-50 dark:bg-slate-900 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Our Systematic Approach
            </h2>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
              We developed a comprehensive framework based on analytical research,
              expert consultation, and real-world testing. Expand each section to learn more.
            </p>
          </div>

          {/* Interactive Methodology Accordion */}
          <MethodologyAccordion
            emergencyScenarios={emergencyScenarios}
            keyCategories={keyCategories}
            timeframes={timeframes}
          />
        </div>
      </section>

      {/* Research Sources Section */}
      <section id="research" className="bg-white dark:bg-slate-950 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" strokeWidth={2} />
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Our Research Foundation
            </h2>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
              Every recommendation is backed by extensive research, expert consultation,
              and hands-on testing with our own families.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-border">
              <CardHeader>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
                  <BookOpen className="w-6 h-6 text-primary" strokeWidth={2} />
                </div>
                <CardTitle>Expert Literature</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We read and studied numerous leading books, guides, and documented best practices
                  from recognized preparedness experts and organizations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
                  <Users className="w-6 h-6 text-primary" strokeWidth={2} />
                </div>
                <CardTitle>Emergency Leaders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We conferred with city, state, and federal emergency management leaders who provided
                  insights into real-world response protocols and priorities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-2">
                  <Shield className="w-6 h-6 text-primary" strokeWidth={2} />
                </div>
                <CardTitle>Professional Veterans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We discussed our approach and solutions with law enforcement, military, and
                  three-letter agency veterans who provided tactical nuances and field-tested insights.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Testing Validation */}
          <div className="mt-12 bg-slate-50 dark:bg-slate-900 rounded-xl p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <CheckCircle2 className="w-6 h-6 text-primary" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Tested With Our Own Families
                </h3>
                <p className="text-muted-foreground">
                  We bought, tried, and tested every product we recommend. These aren&rsquo;t theoretical
                  suggestions—they&rsquo;re the same solutions we&rsquo;ve implemented for our own families.
                  We share items we actually own and use, not affiliate products we&rsquo;ve never touched.
                </p>
              </div>
            </div>
          </div>

          {/* Research Modal Trigger */}
          <div className="text-center mt-8">
            <ResearchModal />
          </div>
        </div>
      </section>

      {/* Bundle Curation Methodology */}
      <section id="bundles" className="bg-slate-50 dark:bg-slate-900 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Target className="w-12 h-12 text-primary mx-auto mb-4" strokeWidth={2} />
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How We Curate Bundles
            </h2>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
              When we shared our complete solutions list with family and friends, the response was
              overwhelming: &ldquo;I don&rsquo;t know where to start&rdquo; and &ldquo;If I only
              have $X to spend, what should I get?&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Bundle Philosophy */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" strokeWidth={2.5} />
                  Our Bundle Philosophy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We designed bundles to solve for the most likely problems based on both timeframe and cost:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-foreground">
                      <strong>First bundle:</strong> Covers many scenarios for up to 1 week
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-foreground">
                      <strong>Progressive tiers:</strong> Higher bundles extend coverage to 1 month, 1 year, and beyond
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-foreground">
                      <strong>Research-driven:</strong> Most critical items for maximum coverage at each price point
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* What's Included */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" strokeWidth={2.5} />
                  What&rsquo;s Included
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-foreground">
                      Complete bundle cost including items, taxes, and shipping
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-foreground">
                      Setup instructions (e.g., fill water containers from home tap)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-foreground">
                      Information sheets with key learnings from our testing
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-foreground">
                      Virtual consultation (included or add-on depending on bundle)
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Customization Note */}
          <div className="bg-white dark:bg-slate-950 rounded-xl border border-border p-6 mb-8">
            <h3 className="font-bold text-foreground mb-3">A Note on Customization</h3>
            <p className="text-muted-foreground">
              We offer <strong>limited customizations</strong>. Why? The items are specifically curated
              based on our research, best practices, and to remediate the challenges you&rsquo;ll face.
              The items aren&rsquo;t based on fashion or taste—they&rsquo;re selected for their ability
              to give you and your family real solutions. We do offer add-ons to address specific concerns
              (like CBRN protection) and scale for family size.
            </p>
          </div>

          {/* Bundle Example Modal Trigger */}
          <div className="text-center">
            <BundleExampleModal />
          </div>
        </div>
      </section>

      {/* AI Enhancement Section */}
      <section id="ai" className="bg-white dark:bg-slate-950 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Zap className="w-12 h-12 text-primary mx-auto mb-4" strokeWidth={2} />
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              AI-Enhanced Personalization
            </h2>
            <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
              Leveraging advanced IT expertise to enhance our foundation with
              intelligent, personalized planning tools.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-border">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="p-4 rounded-xl bg-primary/10">
                    <Brain className="w-10 h-10 text-primary" strokeWidth={2} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-foreground">
                      Technology Meets Preparedness
                    </h3>
                    <p className="text-muted-foreground">
                      Tiran&rsquo;s advanced IT expertise enabled us to leverage AI to enhance our
                      research foundation. Our AI-powered planner doesn&rsquo;t replace human judgment—it
                      amplifies it, helping you create personalized emergency plans based on your specific:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" strokeWidth={2.5} />
                        <span className="text-sm text-foreground">Geographic location and risks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" strokeWidth={2.5} />
                        <span className="text-sm text-foreground">Family size and composition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" strokeWidth={2.5} />
                        <span className="text-sm text-foreground">Budget constraints</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" strokeWidth={2.5} />
                        <span className="text-sm text-foreground">Living situation and storage</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" strokeWidth={2.5} />
                        <span className="text-sm text-foreground">Health and mobility needs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" strokeWidth={2.5} />
                        <span className="text-sm text-foreground">Specific scenario concerns</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What Makes Us Unique */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Makes Us Different
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Family First</h3>
              <p className="text-muted-foreground">
                We were solving for how to prepare, provide, and protect our OWN families.
                These solutions are personal.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Tested & Proven</h3>
              <p className="text-muted-foreground">
                We have tried and tested ALL of the solutions we recommend.
                Nothing theoretical—everything field-verified.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary" strokeWidth={2} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Actual Solutions</h3>
              <p className="text-muted-foreground">
                We offer actual solutions you can purchase—the same ones we&rsquo;ve
                implemented for our OWN families.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Call-to-Action */}
      <section className="bg-primary/5 dark:bg-primary/10 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            Ready to Start Your Preparedness Journey?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Use our AI-powered planner to create a customized emergency
            preparedness plan based on our research and methodology.
          </p>
          <Button size="lg" asChild className="gap-2">
            <Link href="/planner">
              Start Your Plan
              <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
