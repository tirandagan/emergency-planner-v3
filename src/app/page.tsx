import { Metadata } from 'next';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturesComparisonSection from '@/components/landing/FeaturesComparisonSection';
import TrustSignalsSection from '@/components/landing/TrustSignalsSection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import { AuthCodeHandler } from '@/components/AuthCodeHandler';
import {
  OrganizationStructuredData,
  WebsiteStructuredData,
  BreadcrumbStructuredData,
} from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'AI-Powered Emergency Preparedness & Disaster Planning for Families',
  description: 'Transform 60+ hours of fragmented research into actionable, location-specific emergency plans in minutes. Expert-backed disaster preparedness with FBI tactical expertise. Get personalized survival kits, evacuation routes, and comprehensive disaster readiness plans.',
  keywords: [
    'emergency preparedness',
    'disaster planning',
    'family emergency kit',
    'emergency supplies',
    'AI emergency planning',
    'disaster readiness',
    'emergency preparedness kit',
    'survival supplies',
    '72 hour kit',
    'bug out bag',
    'emergency food storage',
    'disaster response plan',
    'family disaster plan',
    'emergency evacuation plan',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'beprepared.ai - Complete Disaster Readiness Plans in Minutes',
    description: 'AI-powered emergency preparedness planning backed by FBI tactical expertise. Create location-specific plans in minutes instead of weeks of research. Transform anxiety into action.',
    type: 'website',
    siteName: 'beprepared.ai',
    url: '/',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'beprepared.ai Emergency Preparedness Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@bepreparedai',
    creator: '@bepreparedai',
    title: 'beprepared.ai - AI Emergency Preparedness Made Simple',
    description: 'Build complete disaster readiness plans in minutes. Expert guidance + AI-powered personalization. Protect your family with proven preparedness strategies.',
    images: ['/og-image.png'],
  },
};

export default function LandingPage(): React.JSX.Element {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beprepared.ai';

  return (
    <>
      <AuthCodeHandler />

      {/* Comprehensive Structured Data for SEO & Rich Results */}
      <OrganizationStructuredData
        name="beprepared.ai"
        url={siteUrl}
        logo={`${siteUrl}/logo.png`}
        description="Expert emergency preparedness planning platform with AI-powered personalization. FBI tactical expertise meets practical disaster readiness."
        sameAs={[
          'https://twitter.com/bepreparedai',
          'https://facebook.com/bepreparedai',
          'https://linkedin.com/company/bepreparedai',
        ]}
        founders={[
          { name: 'Tiran Dagan', type: 'Person' },
          { name: 'Brian Burk', type: 'Person' },
        ]}
        contactPoint={{
          contactType: 'Customer Support',
          email: 'support@beprepared.ai',
        }}
      />

      <WebsiteStructuredData name="beprepared.ai" url={siteUrl} />

      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: siteUrl },
        ]}
      />

      {/* SoftwareApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'beprepared.ai',
            applicationCategory: 'LifestyleApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'AggregateOffer',
              lowPrice: '0',
              highPrice: '29.99',
              priceCurrency: 'USD',
              offerCount: '3',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              reviewCount: '127',
            },
            description: 'AI-powered emergency preparedness platform that creates personalized disaster plans in minutes. Expert-backed guidance for families to prepare for emergencies.',
            url: siteUrl,
            screenshot: `${siteUrl}/og-image.png`,
            softwareVersion: '1.0',
            creator: {
              '@type': 'Organization',
              name: 'beprepared.ai',
            },
          }),
        }}
      />

      <main className="min-h-screen">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesComparisonSection />
        <TrustSignalsSection />
        <FAQSection />
        <FinalCTASection />
      </main>
    </>
  );
}
