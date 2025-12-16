"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, AlertCircle, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { checkUserExists } from '@/actions/auth';
import { devLogin } from '@/actions/dev';

const Login: React.FC = () => {
  const [step, setStep] = useState<'email' | 'profile' | 'otp'>('email');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthYear, setBirthYear] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log(`[Auth Debug] Checking user existence for ${email}...`);
      const startCheck = performance.now();
      const { exists, confirmed } = await checkUserExists(email);
      setIsConfirmed(confirmed);
      console.log(`[Auth Debug] User check took ${(performance.now() - startCheck).toFixed(2)}ms`);

      if (exists) {
        console.log('Attempting to send OTP to:', email);
        const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
        const callbackUrl = new URL(`${redirectUrl}/auth/callback`);
        if (redirectPath && redirectPath !== '/dashboard') {
          callbackUrl.searchParams.set('next', redirectPath);
        }

        console.log('[Auth Debug] Sending OTP email...');
        const startSend = performance.now();
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: callbackUrl.toString(),
          }
        });
        console.log(`[Auth Debug] Email send took ${(performance.now() - startSend).toFixed(2)}ms`);

        if (error) {
          // Specific handling for SMTP 500 errors or Rate Limits (429)
          if (error.status === 500 || error.status === 429) {
            // Try dev login fallback if in development
            if (process.env.NODE_ENV === 'development') {
              console.log('Attempting DEV LOGIN bypass (Rate Limit/SMTP fail)...');
              const { url, error: devError } = await devLogin(email);
              if (url) {
                window.location.href = url;
                return;
              }
              // Silently log dev login failure
              if (devError) console.warn('Dev login bypass failed:', devError);
            }

            if (error.status === 429) {
              setError('Rate limit exceeded. Please wait 1 hour or use a different email.');
              return;
            }

            setError('SMTP Configuration Error. Please check Supabase Dashboard.');
            return;
          }

          // Log unexpected errors
          console.error('Supabase Login Error:', error);
          throw error;
        }

        console.log('OTP Email sent successfully:', data);
        setStep('otp');
      } else {
        setStep('profile');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      // Helpful error message for "Error sending magic link email"
      if (err.message?.includes('Error sending magic link email')) {
        setError('Failed to send email. Please checking your internet connection, or wait a minute if you have requested multiple codes recently.');
      } else {
        setError(err.message || 'Failed to verify email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Register new user with metadata
      setIsConfirmed(false);
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const callbackUrl = new URL(`${redirectUrl}/auth/callback`);
      if (redirectPath && redirectPath !== '/dashboard') {
        callbackUrl.searchParams.set('next', redirectPath);
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            birth_year: parseInt(birthYear)
          }
        }
      });

      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      console.error('Profile creation error:', err);
      setError(err.message || 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    setError('');

    try {
      console.log(`[Auth Debug] Starting OTP verification for ${email} at ${new Date().toISOString()}`);
      const startTime = performance.now();
      
      // Race verifyOtp against a timeout to prevent indefinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timed out. Please try again.')), 60000)
      );

      // Determine token type: 'signup' for new/unconfirmed users, 'magiclink' for existing users
      const tokenType = isConfirmed ? 'magiclink' : 'signup';

      const verifyPromise = supabase.auth.verifyOtp({
        email,
        token: otp.replace(/\s/g, ''), // Clean token of spaces
        type: tokenType as any
      }).then(res => {
        console.log(`[Auth Debug] Supabase response received in ${(performance.now() - startTime).toFixed(2)}ms`);
        return res;
      });

      const { error } = await Promise.race([verifyPromise, timeoutPromise]) as any;

      if (error) {
        console.error('[Auth Debug] Verification error:', error);
        throw error;
      }
      
      console.log('[Auth Debug] OTP verified successfully, redirecting...');
      router.push(redirectPath);
    } catch (err: any) {
      console.error('[Auth Debug] OTP error:', err);
      setError(err.message || 'Invalid OTP');
      setIsLoading(false); // Only stop loading on error. On success, keep loading until page transition.
    }
  };

  // Auto-submit when OTP length reaches 6
  React.useEffect(() => {
    if (otp.length === 6) {
      // Create a synthetic event to reuse the submit handler
      const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
      handleOtpSubmit(syntheticEvent);
    }
  }, [otp]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Resend OTP handler
  const handleResendOtp = async (): Promise<void> => {
    if (resendCooldown > 0) return;

    setError('');
    setResendMessage('');
    setResendCooldown(60); // 60 second cooldown

    try {
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const callbackUrl = new URL(`${redirectUrl}/auth/callback`);
      if (redirectPath && redirectPath !== '/dashboard') {
        callbackUrl.searchParams.set('next', redirectPath);
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        throw error;
      }

      setResendMessage('Verification code resent! Check your email.');
      setTimeout(() => setResendMessage(''), 5000); // Clear message after 5 seconds
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
      setResendCooldown(0); // Reset cooldown on error
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <Shield className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-3xl font-bold text-card-foreground">
            {step === 'email' && 'Welcome'}
            {step === 'profile' && 'Create Profile'}
            {step === 'otp' && 'Verify Email'}
          </h2>
          <p className="text-muted-foreground mt-2 text-center">
            {step === 'email' && 'Sign in or create your beprepared.ai account'}
            {step === 'profile' && 'Complete your profile information'}
            {step === 'otp' && 'Enter the code sent to your email'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 text-destructive p-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-lg text-lg font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-colors"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Year of Birth</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-lg text-lg font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Profile'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="bg-muted border border-border rounded-lg p-4 mb-4">
              <p className="text-sm text-foreground text-center">
                Check your email for a <span className="text-primary font-semibold">login link</span>.
                <br />
                <span className="text-muted-foreground">Click the link or enter the code below.</span>
              </p>
            </div>
            {resendMessage && (
              <div className="bg-primary/10 border border-primary/50 text-primary p-3 rounded-lg flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {resendMessage}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">One-Time Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-3 text-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none tracking-widest transition-colors"
                  placeholder="123456"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !otp}
              className="w-full py-4 px-6 rounded-lg text-lg font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Email'}
            </button>
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-muted-foreground"
              >
                {resendCooldown > 0 
                  ? `Resend code in ${resendCooldown}s` 
                  : 'Resend verification code'}
              </button>
              <div>
                <button type="button" onClick={() => setStep('email')} className="text-sm text-muted-foreground hover:text-foreground underline transition-colors">
                  Wrong email?
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Need help? <a href="/about" className="text-primary hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
