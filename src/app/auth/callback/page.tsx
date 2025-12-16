'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
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

            // Log successful login activity (non-blocking)
            if (user?.id) {
              // Fire and forget - don't block redirect
              fetch('/api/activity/log-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
              }).catch(err => {
                console.warn('Error logging login activity:', err);
              });
            }

            // Clear the hash and redirect immediately
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
            type: type as 'email' | 'sms' | 'magiclink',
          });

          if (error) {
            throw error;
          }

          // Get user ID for activity logging
          const { data: { user } } = await supabase.auth.getUser();

          // Log successful login activity (non-blocking)
          if (user?.id) {
            // Fire and forget - don't block redirect
            fetch('/api/activity/log-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id }),
            }).catch(err => {
              console.warn('Error logging login activity:', err);
            });
          }

          // Auth successful - redirect immediately
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
  }, [searchParams, router, supabase.auth]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive p-6 rounded-lg mb-4 text-center max-w-md">
          <p className="font-semibold mb-2 text-lg">Authentication Error</p>
          <p className="text-sm">{error}</p>
        </div>
        <p className="text-muted-foreground text-sm">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="flex flex-col items-center gap-2">
          <p className="text-foreground font-medium text-lg">Verifying credentials...</p>
          <p className="text-muted-foreground text-sm">Please wait a moment</p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-foreground font-medium text-lg">Loading...</p>
            <p className="text-muted-foreground text-sm">Initializing authentication</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallback />
    </Suspense>
  );
}

