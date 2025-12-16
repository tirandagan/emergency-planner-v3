export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export const CONSENT_VERSION = '1.0';
export const STORAGE_KEY = 'cookie-consent';

/**
 * Get stored cookie consent from localStorage
 */
export function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const consent: CookieConsent = JSON.parse(stored);

    // Validate consent object structure
    if (
      typeof consent.essential !== 'boolean' ||
      typeof consent.analytics !== 'boolean' ||
      typeof consent.marketing !== 'boolean' ||
      !consent.timestamp ||
      !consent.version
    ) {
      return null;
    }

    return consent;
  } catch (error) {
    console.error('Failed to parse cookie consent:', error);
    return null;
  }
}

/**
 * Check if user has analytics consent
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getStoredConsent();
  return consent?.analytics ?? false;
}

/**
 * Check if user has marketing consent
 */
export function hasMarketingConsent(): boolean {
  const consent = getStoredConsent();
  return consent?.marketing ?? false;
}

/**
 * Clear stored consent (useful for testing or user reset)
 */
export function clearConsent(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear cookie consent - localStorage may be blocked:', error);
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}


