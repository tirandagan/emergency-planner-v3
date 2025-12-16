// Profile caching module with session storage and in-memory fallback
// Provides 5-minute TTL caching for user profile data to reduce database queries

import type { User } from '@/types';

export interface CachedProfile {
  profile: User;
  timestamp: number;
  expiresAt: number;
}

export interface ProfileCacheOptions {
  ttl?: number; // milliseconds
  bypassCache?: boolean;
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'profile_cache_';

// In-memory fallback for privacy modes (incognito, disabled storage)
const memoryCache = new Map<string, CachedProfile>();

// In-flight request deduplication (prevent concurrent fetches)
const pendingFetches = new Map<string, Promise<User | null>>();

/**
 * Get cached profile for a user
 * Returns null if cache miss or expired
 */
export function getCachedProfile(userId: string): User | null {
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

  // Try session storage first
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const data: CachedProfile = JSON.parse(cached);

      // Check if expired
      if (Date.now() < data.expiresAt) {
        console.debug('[Cache] Hit for user:', userId);
        return data.profile;
      }

      // Expired - clean up
      console.debug('[Cache] Expired for user:', userId);
      sessionStorage.removeItem(cacheKey);
    }
  } catch (error) {
    // Session storage unavailable or quota exceeded
    console.warn('[Cache] Session storage unavailable, trying memory fallback:', error);

    // Try memory cache fallback
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached && Date.now() < memoryCached.expiresAt) {
      console.debug('[Cache] Memory cache hit for user:', userId);
      return memoryCached.profile;
    }
  }

  console.debug('[Cache] Miss for user:', userId);
  return null;
}

/**
 * Store profile in cache
 * Uses session storage with memory fallback
 */
export function setCachedProfile(
  userId: string,
  profile: User,
  options: ProfileCacheOptions = {}
): void {
  const { ttl = CACHE_TTL } = options;
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

  const cached: CachedProfile = {
    profile,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl
  };

  // Store in session storage
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(cached));
    console.debug('[Cache] Stored in session storage for user:', userId);
  } catch (error) {
    // Quota exceeded or storage disabled - use memory fallback
    console.warn('[Cache] Session storage failed, using memory cache:', error);
    memoryCache.set(cacheKey, cached);
  }
}

/**
 * Invalidate cached profile
 * Call this on logout, profile updates, role changes, subscription changes
 */
export function invalidateCachedProfile(userId: string): void {
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

  try {
    sessionStorage.removeItem(cacheKey);
    console.debug('[Cache] Invalidated session storage for user:', userId);
  } catch (error) {
    // Silent fail - not critical
    console.warn('[Cache] Session storage removal failed:', error);
  }

  memoryCache.delete(cacheKey);
  console.debug('[Cache] Invalidated memory cache for user:', userId);
}

/**
 * Check if profile cache is still valid
 * Useful for debugging/monitoring
 */
export function isProfileCacheValid(userId: string): boolean {
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const data: CachedProfile = JSON.parse(cached);
      return Date.now() < data.expiresAt;
    }
  } catch (error) {
    // Try memory cache
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached) {
      return Date.now() < memoryCached.expiresAt;
    }
  }

  return false;
}

/**
 * Get or register in-flight fetch
 * Prevents duplicate concurrent requests for same user
 */
export function getOrCreatePendingFetch(
  userId: string,
  fetchFn: () => Promise<User | null>
): Promise<User | null> {
  const existing = pendingFetches.get(userId);
  if (existing) {
    console.debug('[Cache] Reusing in-flight fetch for user:', userId);
    return existing;
  }

  const promise = fetchFn().finally(() => {
    pendingFetches.delete(userId);
  });

  pendingFetches.set(userId, promise);
  return promise;
}

/**
 * Clear all cached profiles
 * Useful for development/testing
 */
export function clearAllProfileCaches(): void {
  try {
    // Clear all session storage keys starting with prefix
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(CACHE_KEY_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('[Cache] Failed to clear session storage:', error);
  }

  memoryCache.clear();
  console.debug('[Cache] Cleared all profile caches');
}
