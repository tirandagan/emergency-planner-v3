'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async (): Promise<void> => {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');
      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/dashboard';
      const errorDescription = searchParams.get('error_description');

      if (errorDescription) {
        setError(errorDescription);
        return;
      }

      // Handle password reset flow (code parameter from email link)
      if (code) {
        console.log('[Callback] Exchanging code for session...');
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          console.log('[Callback] Exchange result:', { data: !!data, error });
          
          if (error) {
            throw error;
          }

          if (!data.session) {
            throw new Error('No session returned from code exchange');
          }

          console.log('[Callback] Session established, redirecting to reset-password');
          // Redirect to reset password page
          router.replace('/auth/reset-password');
          return;
        } catch (err) {
          console.error('[Callback] Password reset error:', err);
          setError(err instanceof Error ? err.message : 'Invalid or expired reset link');
          setTimeout(() => router.push('/auth/forgot-password'), 3000);
          return;
        }
      }

      // Check if tokens are in URL hash (magic link clicked)
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          try {
            // Set the session from hash tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              throw error;
            }

            // Get user ID for activity logging
            const { data: { user } } = await supabase.auth.getUser();

            // Log successful login activity
            if (user?.id) {
              try {
                const response = await fetch('/api/activity/log-login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id }),
                });
                if (!response.ok) {
                  console.warn('Failed to log login activity:', await response.text());
                }
              } catch (err) {
                console.warn('Error logging login activity:', err);
              }
            }

            // Clear the hash and redirect
            router.replace(next);
            return;
          } catch (err) {
            console.error('Session error:', err);
            setError(err instanceof Error ? err.message : 'Authentication failed');
            setTimeout(() => router.push('/auth/login'), 3000);
            return;
          }
        }
      }

      // Handle PKCE flow with token_hash
      if (token_hash && type) {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });

          if (error) {
            throw error;
          }

          // Get user ID for activity logging
          const { data: { user } } = await supabase.auth.getUser();

          // Log successful login activity
          if (user?.id) {
            try {
              const response = await fetch('/api/activity/log-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
              });
              if (!response.ok) {
                console.warn('Failed to log login activity:', await response.text());
              }
            } catch (err) {
              console.warn('Error logging login activity:', err);
            }
          }

          // Auth successful - redirect to dashboard
          router.push(next);
        } catch (err) {
          console.error('Auth error:', err);
          setError(err instanceof Error ? err.message : 'Authentication failed');
          // Redirect to login after a delay if failed
          setTimeout(() => router.push('/auth/login'), 3000);
        }
      } else {
        // No tokens - fallback redirect
        router.push('/dashboard');
      }
    };

    handleAuth();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-red-900/20 border border-red-900/50 text-red-500 p-4 rounded-lg mb-4 text-center">
          <p className="font-bold mb-1">Authentication Error</p>
          <p className="text-sm">{error}</p>
        </div>
        <p className="text-gray-500 text-sm">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <Loader2 className="w-8 h-8 text-tactical-accent animate-spin mb-4" />
      <p className="text-gray-400 font-mono text-sm animate-pulse">
        VERIFYING CREDENTIALS...
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="w-8 h-8 text-tactical-accent animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm animate-pulse">
          LOADING...
        </p>
      </div>
    }>
      <AuthCallback />
    </Suspense>
  );
}

