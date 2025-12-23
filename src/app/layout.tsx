import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://beprepared.ai'),
  title: {
    default: "beprepared.ai - AI-Powered Emergency Preparedness & Disaster Planning",
    template: "%s | beprepared.ai",
  },
  description: "Transform 60+ hours of research into personalized emergency plans in minutes. Expert-backed disaster preparedness guidance, curated survival kits, and AI-powered planning for families.",
  keywords: [
    "emergency preparedness",
    "disaster planning",
    "emergency kit",
    "survival supplies",
    "family emergency plan",
    "disaster readiness",
    "AI emergency planning",
    "emergency supplies checklist",
    "disaster preparedness kit",
    "emergency food storage",
    "bug out bag",
    "72 hour kit",
    "emergency response plan",
  ],
  authors: [{ name: "Tiran Dagan" }, { name: "Brian Burk" }],
  creator: "beprepared.ai",
  publisher: "beprepared.ai",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "beprepared.ai",
    title: "beprepared.ai - AI-Powered Emergency Preparedness & Disaster Planning",
    description: "Expert-backed emergency preparedness planning with AI-powered personalization. Build comprehensive disaster plans, access curated survival kits, and protect your family.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "beprepared.ai - Emergency Preparedness Planning Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "beprepared.ai - Emergency Preparedness Made Simple",
    description: "AI-powered disaster planning backed by FBI tactical expertise. Create personalized emergency plans in minutes.",
    images: ["/og-image.png"],
    creator: "@bepreparedai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "google-site-verification-code-here", // TODO: Add after Google Search Console verification
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Theme initialization script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const activeTheme = theme || systemTheme;
                  if (activeTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />

        {/* AvantLink affiliate verification script */}
        <script
          type="text/javascript"
          src="http://classic.avantlink.com/affiliate_app_confirm.php?mode=js&authResponse=430e362b0c8e21303737e6324ded0f0eb299ae65"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <CookieConsentBanner />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
