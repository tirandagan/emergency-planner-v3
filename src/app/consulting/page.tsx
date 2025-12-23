import { Metadata } from 'next';
import { ConsultingServicesList } from '@/components/consulting';
import { getActiveConsultingServices } from '@/lib/consulting';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceStructuredData, FAQStructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'Emergency Preparedness Consulting - Expert 1-on-1 Guidance',
  description:
    'Get personalized expert guidance from FBI-trained disaster preparedness consultants. One-on-one video consultations for emergency plans, survival kits, evacuation strategies, and family disaster readiness. Book your consultation today.',
  keywords: [
    'emergency preparedness consulting',
    'disaster planning expert',
    'survival consultant',
    'emergency preparedness advisor',
    'disaster readiness coaching',
    'tactical preparedness consulting',
    'family emergency planning expert',
  ],
  alternates: {
    canonical: '/consulting',
  },
  openGraph: {
    title: 'Expert Emergency Preparedness Consulting Services',
    description: 'Personalized 1-on-1 guidance from FBI-trained experts. Optimize your disaster plans, survival kits, and family preparedness strategy with professional consulting.',
    type: 'website',
    url: '/consulting',
  },
  twitter: {
    card: 'summary',
    title: 'Emergency Preparedness Consulting - Expert Guidance',
    description: 'Book a 1-on-1 consultation with FBI-trained disaster preparedness experts. Get personalized advice for your family.',
  },
};

async function ConsultingServicesContent(): Promise<React.JSX.Element> {
  const services = await getActiveConsultingServices({ isGeneric: true });

  return <ConsultingServicesList services={services} />;
}

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default async function ConsultingPage(): Promise<React.JSX.Element> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beprepared.ai';

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Structured Data for SEO */}
      <ServiceStructuredData
        name="Emergency Preparedness Consulting"
        description="One-on-one expert consulting for emergency preparedness planning, disaster readiness, and survival strategies. Personalized guidance from FBI-trained consultants."
        provider="beprepared.ai"
        serviceType="Emergency Preparedness Consulting"
        areaServed="United States"
        url={`${siteUrl}/consulting`}
      />

      <FAQStructuredData
        questions={[
          {
            question: 'What is emergency preparedness consulting?',
            answer:
              'Emergency preparedness consulting provides personalized 1-on-1 guidance from experienced disaster preparedness experts. Consultants help you optimize emergency plans, select appropriate survival supplies, develop evacuation strategies, and ensure your family is ready for various disaster scenarios.',
          },
          {
            question: 'Who are the consultants?',
            answer:
              'Our consultants include Brian Burk, who served on the FBI Special Response Team and has consulted with high-net-worth families on comprehensive preparedness solutions. Our team combines tactical expertise with practical, field-tested strategies.',
          },
          {
            question: 'How long are the consulting sessions?',
            answer:
              'Consulting sessions typically range from 30 minutes to 2 hours depending on the service level. Each session is personalized to your specific needs and includes follow-up resources.',
          },
          {
            question: 'What can I expect from a consultation?',
            answer:
              'You can expect personalized advice based on your location, family size, budget, and specific concerns. Consultations cover emergency planning, supply recommendations, evacuation strategies, and actionable next steps you can implement immediately.',
          },
        ]}
      />
      {/* Hero Section */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Expert Emergency Preparedness Consulting
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Get personalized guidance from experienced emergency preparedness professionals. Whether
          you're just starting out or optimizing an existing plan, our consultants are here to
          help you succeed.
        </p>
      </div>

      {/* Value Propositions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="text-center p-6 rounded-lg border bg-card">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="text-lg font-semibold mb-2">Personalized Guidance</h3>
          <p className="text-sm text-muted-foreground">
            Tailored advice based on your specific situation, family needs, and local risks
          </p>
        </div>

        <div className="text-center p-6 rounded-lg border bg-card">
          <div className="text-3xl mb-3">⚡</div>
          <h3 className="text-lg font-semibold mb-2">Expert Knowledge</h3>
          <p className="text-sm text-muted-foreground">
            Years of experience in emergency management, survival training, and disaster response
          </p>
        </div>

        <div className="text-center p-6 rounded-lg border bg-card">
          <div className="text-3xl mb-3">📋</div>
          <h3 className="text-lg font-semibold mb-2">Actionable Plans</h3>
          <p className="text-sm text-muted-foreground">
            Walk away with clear next steps and practical strategies you can implement immediately
          </p>
        </div>
      </div>

      {/* Services Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-8">Available Consulting Services</h2>
        <Suspense fallback={<LoadingSkeleton />}>
          <ConsultingServicesContent />
        </Suspense>
      </div>

      {/* How It Works */}
      <div className="bg-muted/50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-3">
              1
            </div>
            <h3 className="font-semibold mb-2">Choose a Service</h3>
            <p className="text-sm text-muted-foreground">
              Select the consulting service that matches your needs
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-3">
              2
            </div>
            <h3 className="font-semibold mb-2">Share Your Goals</h3>
            <p className="text-sm text-muted-foreground">
              Answer a few questions about your preparedness situation
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-3">
              3
            </div>
            <h3 className="font-semibold mb-2">Review Your Agenda</h3>
            <p className="text-sm text-muted-foreground">
              Get an AI-generated session agenda customized for you
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-3">
              4
            </div>
            <h3 className="font-semibold mb-2">Schedule & Meet</h3>
            <p className="text-sm text-muted-foreground">
              Book a time that works for you and meet with your expert
            </p>
          </div>
        </div>
      </div>

      {/* FAQ / Testimonials could go here */}
    </div>
  );
}
