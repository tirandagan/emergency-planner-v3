import { Metadata } from 'next';
import Script from 'next/script';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturesComparisonSection from '@/components/landing/FeaturesComparisonSection';
import TrustSignalsSection from '@/components/landing/TrustSignalsSection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import { AuthCodeHandler } from '@/components/AuthCodeHandler';
import { OrganizationStructuredData, WebsiteStructuredData } from '@/components/seo/StructuredData';

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

export default function LandingPage() {
  return (
    <>
      <AuthCodeHandler />
      <Script
        src="http://classic.avantlink.com/affiliate_app_confirm.php?mode=js&authResponse=430e362b0c8e21303737e6324ded0f0eb299ae65"
        strategy="afterInteractive"
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
