"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithEmail, signInWithOAuth, type OAuthProvider } from "@/app/actions/auth";
import { FEATURE_FLAGS, isOAuthEnabled } from "@/lib/feature-flags";
import { PolicyModal } from "./PolicyModal";
import { TermsOfServiceContent } from "./TermsOfServiceContent";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  
  // Policy acceptance tracking
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [termsCheckboxChecked, setTermsCheckboxChecked] = useState(false);

  function getPasswordRequirements(pwd: string): PasswordRequirement[] {
    return [
      { label: "At least 8 characters", met: pwd.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(pwd) },
      { label: "One lowercase letter", met: /[a-z]/.test(pwd) },
      { label: "One number", met: /[0-9]/.test(pwd) },
      { label: "One special character", met: /[^A-Za-z0-9]/.test(pwd) },
    ];
  }

  function calculatePasswordStrength(requirements: PasswordRequirement[]): number {
    return requirements.filter((req) => req.met).length;
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setPassword(e.target.value);
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setEmail(e.target.value);
  }

  function handleEmailBlur(): void {
    setEmailTouched(true);
  }

  function isValidEmail(emailValue: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  }

  const requirements = getPasswordRequirements(password);
  const passwordStrength = calculatePasswordStrength(requirements);
  const allRequirementsMet = requirements.every((req) => req.met);

  async function handleOAuthSignIn(provider: OAuthProvider): Promise<void> {
    setLoading(true);
    setError(null);
    
    const result = await signInWithOAuth(provider);
    
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  function handleTermsCheckboxClick(e: React.MouseEvent<HTMLInputElement>): void {
    // Prevent default checkbox behavior
    e.preventDefault();
    
    // If both policies are not accepted, show warning
    if (!termsAccepted || !privacyAccepted) {
      setShowWarningDialog(true);
      return;
    }
    
    // If both are accepted, toggle the checkbox
    setTermsCheckboxChecked(!termsCheckboxChecked);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await signUpWithEmail(formData);

    if (result.success) {
      // Store email for verification page
      const email = formData.get("email") as string;
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
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
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
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
          value={password}
          required
          onChange={handlePasswordChange}
          aria-describedby={password ? "password-requirements" : undefined}
          aria-invalid={(password.length > 0 && !allRequirementsMet) || undefined}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        {password && (
          <div id="password-requirements" className="mt-3 space-y-2">
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded transition-colors ${
                    level <= passwordStrength
                      ? passwordStrength === 5
                        ? "bg-green-500"
                        : passwordStrength === 4
                          ? "bg-yellow-500"
                          : passwordStrength === 3
                            ? "bg-orange-500"
                            : "bg-red-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>
              ))}
            </div>
            <div className="space-y-1">
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <span
                    className={`flex-shrink-0 ${
                      req.met ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
                    }`}
                    aria-label={req.met ? "Requirement met" : "Requirement not met"}
                  >
                    {req.met ? "✓" : "○"}
                  </span>
                  <span className={req.met ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-400"}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{fieldErrors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setConfirmPasswordTouched(true)}
          required
          aria-invalid={(confirmPasswordTouched && confirmPassword && confirmPassword !== password) || undefined}
          aria-describedby={
            confirmPasswordTouched && confirmPassword && confirmPassword !== password
              ? "confirm-password-error"
              : undefined
          }
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        {confirmPasswordTouched && confirmPassword && confirmPassword !== password && (
          <p id="confirm-password-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            Passwords do not match
          </p>
        )}
        {confirmPasswordTouched && confirmPassword && confirmPassword === password && password && (
          <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <span>✓</span> Passwords match
          </p>
        )}
        {fieldErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {/* Terms Checkbox */}
      <div>
        <div className="flex items-start">
          <input
            id="termsAccepted"
            name="termsAccepted"
            type="checkbox"
            value="true"
            checked={termsCheckboxChecked}
            onClick={handleTermsCheckboxClick}
            onChange={() => {}} // Controlled component
            required
            className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
          />
          <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            I agree to the{" "}
            <button
              type="button"
              onClick={() => setTermsModalOpen(true)}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline hover:no-underline"
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => setPrivacyModalOpen(true)}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 underline hover:no-underline"
            >
              Privacy Policy
            </button>
          </label>
        </div>
        {fieldErrors.termsAccepted && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.termsAccepted}</p>
        )}
      </div>

      {/* Policy Modals */}
      <PolicyModal
        open={termsModalOpen}
        onOpenChange={setTermsModalOpen}
        title="Terms of Service"
        description="Please read and accept our Terms of Service"
        onAccept={() => setTermsAccepted(true)}
        isAccepted={termsAccepted}
      >
        <TermsOfServiceContent />
      </PolicyModal>

      <PolicyModal
        open={privacyModalOpen}
        onOpenChange={setPrivacyModalOpen}
        title="Privacy Policy"
        description="Please read and accept our Privacy Policy"
        onAccept={() => setPrivacyAccepted(true)}
        isAccepted={privacyAccepted}
      >
        <PrivacyPolicyContent />
      </PolicyModal>

      {/* Warning Dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Please Review Policies</AlertDialogTitle>
            <AlertDialogDescription>
              You must read and accept both the Terms of Service and Privacy Policy before proceeding.
              {!termsAccepted && !privacyAccepted && " Please review both documents."}
              {!termsAccepted && privacyAccepted && " You still need to review the Terms of Service."}
              {termsAccepted && !privacyAccepted && " You still need to review the Privacy Policy."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowWarningDialog(false)}
            >
              Close
            </Button>
            {!termsAccepted && (
              <Button
                type="button"
                onClick={() => {
                  setShowWarningDialog(false);
                  setTermsModalOpen(true);
                }}
              >
                Review Terms
              </Button>
            )}
            {!privacyAccepted && (
              <Button
                type="button"
                onClick={() => {
                  setShowWarningDialog(false);
                  setPrivacyModalOpen(true);
                }}
              >
                Review Privacy Policy
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !allRequirementsMet || confirmPassword !== password || !termsCheckboxChecked}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        aria-live="polite"
      >
        {loading ? "Creating account..." : "Create account"}
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

      {/* Sign In Link */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium">
          Sign in
        </Link>
      </div>
    </form>
  );
}

