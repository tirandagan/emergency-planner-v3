"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailPassword, signInWithOAuth, type OAuthProvider } from "@/app/actions/auth";
import { FEATURE_FLAGS, isOAuthEnabled } from "@/lib/feature-flags";
import { useAuth } from "@/context/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string>("/dashboard");

  useEffect(() => {
    // Get the 'next' parameter from URL
    const next = searchParams.get("next");
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      // Validate it's a safe relative URL
      setRedirectPath(next);
    }
  }, [searchParams]);

  function isValidEmail(emailValue: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  }

  async function handleOAuthSignIn(provider: OAuthProvider): Promise<void> {
    setLoading(true);
    setError(null);
    
    const result = await signInWithOAuth(provider);
    
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await signInWithEmailPassword(formData);

    if (result.success) {
      // Refresh user state immediately for instant navbar update
      await refreshUser();
      router.push(redirectPath);
      router.refresh();
    } else {
      if (result.field) {
        setFieldErrors({ [result.field]: result.error });
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
  }

  const hasErrors = error || Object.keys(fieldErrors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {hasErrors && (
        <div
          className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          {error && <p className="font-medium">{error}</p>}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="mt-2">
              <p className="font-medium mb-1">Please correct the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(fieldErrors).map(([field, err]) => (
                  <li key={field}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          required
          aria-invalid={(emailTouched && email && !isValidEmail(email)) || undefined}
          aria-describedby={emailTouched && email && !isValidEmail(email) ? "email-error" : undefined}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
          placeholder="you@example.com"
          autoComplete="email"
        />
        {emailTouched && email && !isValidEmail(email) && (
          <p id="email-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            Please enter a valid email address
          </p>
        )}
        {fieldErrors.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {fieldErrors.password && (
          <p id="password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            value="true"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Remember me
          </label>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Forgot password?
        </Link>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        aria-live="polite"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      {/* OAuth Buttons */}
      {isOAuthEnabled() && (
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {FEATURE_FLAGS.OAUTH_GOOGLE_ENABLED && (
              <button
                type="button"
                onClick={() => handleOAuthSignIn("google")}
                disabled={loading}
                className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>
            )}
            {FEATURE_FLAGS.OAUTH_FACEBOOK_ENABLED && (
              <button
                type="button"
                onClick={() => handleOAuthSignIn("facebook")}
                disabled={loading}
                className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sign Up Link */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium">
          Sign up
        </Link>
      </div>
    </form>
  );
}

