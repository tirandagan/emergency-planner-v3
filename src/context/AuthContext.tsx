"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import {
  getCachedProfile,
  setCachedProfile,
  invalidateCachedProfile,
  getOrCreatePendingFetch
} from '@/lib/cache';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

// Helper to create user from auth metadata (moved outside component for reuse)
type AuthUser = { id: string; email?: string | null; user_metadata: Record<string, unknown> };

const createUserFromMetadata = (authUser: AuthUser): User => {
  const metadata = authUser.user_metadata;
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: (metadata.full_name as string) || '',
    firstName: (metadata.first_name as string) || '',
    lastName: (metadata.last_name as string) || '',
    birthYear: (metadata.birth_year as number) || undefined,
    gender: (metadata.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say') || undefined,
    role: (metadata.role as 'USER' | 'ADMIN') || 'USER'
  };
};

// Helper to fetch profile with timeout and retry logic
const fetchProfileWithTimeout = async (
  userId: string,
  timeoutMs = 5000,
  retries = 1
): Promise<User | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
      );

      // Fetch profile via API route (which uses Drizzle ORM server-side)
      const fetchPromise = fetch(`/api/profile/${userId}`).then(async (res) => {
        if (!res.ok) {
          throw new Error(`Profile API returned ${res.status}`);
        }
        return res.json();
      });

      const result = await Promise.race([fetchPromise, timeoutPromise]);

      // Transform API response to User type
      if (result) {
        return {
          id: result.id,
          email: result.email,
          name: result.fullName || '',
          firstName: result.firstName || undefined,
          lastName: result.lastName || undefined,
          birthYear: result.birthYear || undefined,
          gender: result.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | undefined,
          role: result.role as 'ADMIN' | 'USER',
          householdMembers: result.householdMembers,
          saveHouseholdPreference: result.saveHouseholdPreference,
        };
      }
      return null;
    } catch (error) {
      // On last attempt, log and return null
      if (attempt === retries) {
        if (error instanceof Error && error.message === 'Profile fetch timeout') {
          console.warn('[AuthContext] Profile fetch timed out after retries, using auth metadata fallback');
        } else {
          console.error('[AuthContext] Error fetching profile:', error);
        }
        return null;
      }
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Shared logic to load user from session
  const loadUserFromSession = useCallback(async (authUser: AuthUser): Promise<User> => {
    // Check cache first
    const cachedProfile = getCachedProfile(authUser.id);
    if (cachedProfile) {
      console.debug('[AuthContext] Using cached profile for user:', authUser.id);
      return cachedProfile;
    }

    // Cache miss - fetch from database with deduplication
    console.debug('[AuthContext] Cache miss, fetching profile from database for user:', authUser.id);
    const profile = await getOrCreatePendingFetch(authUser.id, async () => {
      return await fetchProfileWithTimeout(authUser.id);
    });

    if (!profile) {
      console.warn('[AuthContext] No profile found in database for user:', authUser.id);
    }

    if (profile) {
      console.debug('[AuthContext] Profile fetched successfully, caching...');
      setCachedProfile(authUser.id, profile);
      return profile;
    }

    // Fallback to auth metadata
    console.debug('[AuthContext] Profile fetch failed, using metadata fallback');
    const fallbackUser = createUserFromMetadata(authUser);
    setCachedProfile(authUser.id, fallbackUser);
    return fallbackUser;
  }, []);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          const userData = await loadUserFromSession(session.user);
          setUser(userData);
        } else {
          setUser(null);
        }
      })
      .catch((error) => {
        console.error('[AuthContext] Error getting session:', error);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await loadUserFromSession(session.user);
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserFromSession]);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const logout = async () => {
    try {
      // Invalidate cache before signing out
      if (user) {
        invalidateCachedProfile(user.id);
        console.debug('[AuthContext] Cleared profile cache on logout');
      }

      // Race signOut with a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timed out')), 2000)
      );
      await Promise.race([supabase.auth.signOut(), timeoutPromise]);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Always clear user state, even if signOut fails
      setUser(null);
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const userData = await loadUserFromSession(session.user);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error refreshing user:', error);
      setUser(null);
    }
  }, [loadUserFromSession]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      console.warn('[AuthContext] No user to refresh');
      return;
    }

    console.debug('[AuthContext] Manual profile refresh requested');
    invalidateCachedProfile(user.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData = await loadUserFromSession(session.user);
        setUser(userData);
        console.debug('[AuthContext] Profile refreshed successfully');
      }
    } catch (error) {
      console.error('[AuthContext] Error refreshing profile:', error);
    }
  }, [user, loadUserFromSession]);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      refreshUser,
      refreshProfile,
      isLoading,
      isAdmin: user?.role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
