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

export const metadata: Metadata = {
  title: 'beprepared.ai - AI-Powered Emergency Preparedness Planning',
  description: 'Transform 40-60 hours of fragmented research into actionable, location-specific emergency plans in minutes. Professional preparedness for families without the overwhelm.',
  keywords: [
    'emergency preparedness',
    'disaster planning',
    'family emergency kit',
    'emergency supplies',
    'AI emergency planning',
    'disaster readiness',
    'emergency preparedness kit',
  ],
  openGraph: {
    title: 'beprepared.ai - Complete Disaster Readiness Plans in Minutes',
    description: 'AI-powered emergency preparedness planning for families. Create location-specific plans in minutes instead of weeks of research.',
    type: 'website',
    siteName: 'beprepared.ai',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'beprepared.ai - AI Emergency Preparedness',
    description: 'Build complete disaster readiness plans in minutes with AI-powered guidance.',
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
