'use client';

import React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { BrandText } from '@/components/ui/brand-text';

const Footer: React.FC = () => {
  const pathname = usePathname();
  
  // Define public routes where footer should be visible
  const publicRoutes = ['/', '/about', '/terms', '/privacy', '/cookies'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth');
  
  // Don't render footer on protected routes (they have sidebar)
  if (!isPublicRoute) {
    return null;
  }
  
  return (
    <footer className="bg-muted border-t border-border py-12 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
               <Image
                 src="/logo.png"
                 alt="BePrepared.ai logo"
                 width={24}
                 height={24}
                 className="h-6 w-6"
               />
               <BrandText className="text-foreground text-lg" withDomain />
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Professional emergency preparedness planning powered by AI. Be ready for anything.
            </p>
          </div>
          
          <div>
            <h4 className="text-foreground font-semibold mb-4 text-sm tracking-wide">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/about" className="hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-foreground font-semibold mb-4 text-sm tracking-wide">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/cookies" className="hover:text-primary transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-8 text-center text-xs text-muted-foreground">
          <span suppressHydrationWarning>
            &copy; {new Date().getFullYear()} <BrandText className="text-xs" withDomain />. Professional Emergency Preparedness.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
