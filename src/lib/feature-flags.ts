/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for the application.
 * All feature flags should be defined here for easy discovery and management.
 */

export const FEATURE_FLAGS = {
  /**
   * OAuth Authentication Providers
   */
  OAUTH_GOOGLE_ENABLED: process.env.NEXT_PUBLIC_ENABLE_OAUTH_GOOGLE === "true",
  OAUTH_FACEBOOK_ENABLED: process.env.NEXT_PUBLIC_ENABLE_OAUTH_FACEBOOK === "true",
} as const;

/**
 * Check if any OAuth provider is enabled
 */
export function isOAuthEnabled(): boolean {
  return FEATURE_FLAGS.OAUTH_GOOGLE_ENABLED || FEATURE_FLAGS.OAUTH_FACEBOOK_ENABLED;
}

/**
 * Get list of enabled OAuth providers
 */
export function getEnabledOAuthProviders(): string[] {
  const providers: string[] = [];
  if (FEATURE_FLAGS.OAUTH_GOOGLE_ENABLED) providers.push("google");
  if (FEATURE_FLAGS.OAUTH_FACEBOOK_ENABLED) providers.push("facebook");
  return providers;
}


























