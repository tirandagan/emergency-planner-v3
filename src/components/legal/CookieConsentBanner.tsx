'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { CookieConsent } from '@/lib/cookie-consent';

const CONSENT_VERSION = '1.0';
const STORAGE_KEY = 'cookie-consent';

// Type for Google Analytics gtag function
interface GtagWindow extends Window {
  gtag?: (command: string, action: string, params: Record<string, string>) => void;
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Define applyConsent before useEffect so it can be called
  const applyConsent = (consent: CookieConsent): void => {
    if (typeof window === 'undefined') return;

    const gtagWindow = window as GtagWindow;
    if (consent.analytics) {
      if (gtagWindow.gtag) {
        gtagWindow.gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      }
    } else {
      if (gtagWindow.gtag) {
        gtagWindow.gtag('consent', 'update', {
          analytics_storage: 'denied',
        });
      }
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Check if localStorage is available
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      setStorageAvailable(true);
    } catch {
      console.warn('localStorage is not available - storage blocked or in private browsing mode');
      setStorageAvailable(false);
      // Don't show banner if storage is blocked - no point since we can't save consent
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setTimeout(() => setIsVisible(true), 1000);
      } else {
        const consent: CookieConsent = JSON.parse(stored);
        applyConsent(consent);
      }
    } catch (error) {
      console.error('Failed to parse cookie consent:', error);
      setIsVisible(true);
    }
  }, [isClient, applyConsent]);

  const handleAcceptAll = (): void => {
    const consent: CookieConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    saveConsent(consent);
  };

  const handleDeclineNonEssential = (): void => {
    const consent: CookieConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    saveConsent(consent);
  };

  const saveConsent = (consent: CookieConsent): void => {
    if (!storageAvailable) {
      console.warn('Cannot save cookie consent - localStorage is not available');
      applyConsent(consent);
      setIsVisible(false);
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      applyConsent(consent);
      setIsVisible(false);
    } catch (error) {
      console.error('Failed to save cookie consent:', error);
      // Still apply consent and hide banner even if save fails
      applyConsent(consent);
      setIsVisible(false);
    }
  };

  if (!isClient || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Message */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-2">
              🍪 We use cookies to improve your experience
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and optional analytics cookies to understand how you use our Service. 
              You can choose to accept all cookies or decline non-essential ones.{' '}
              <a href="/cookies" className="text-primary hover:underline">
                Learn more in our Cookie Policy
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button
              onClick={handleAcceptAll}
              className="w-full sm:w-auto"
              size="sm"
            >
              Accept All Cookies
            </Button>
            <Button
              onClick={handleDeclineNonEssential}
              variant="outline"
              className="w-full sm:w-auto"
              size="sm"
            >
              Decline Non-Essential
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


