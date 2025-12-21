"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  checkUserExists,
  generateAndSendOTP,
  completePasswordLogin,
} from "@/app/actions/auth-unified";
import { OTPVerification } from "./OTPVerification";
import { SignupFormSimplified } from "./SignupFormSimplified";
import { SignInPage } from "@/components/ui/sign-in";
import VaporizeTextCycle, { Tag } from "@/components/ui/vapour-text-effect";

type AuthStep =
  | "email_entry"
  | "password_entry"
  | "signup"
  | "otp_verification"
  | "loading"
  | "redirecting";

interface UnifiedAuthFormProps {
  redirectUrl?: string;
}

export function UnifiedAuthForm({ redirectUrl = "/dashboard" }: UnifiedAuthFormProps) {
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>("email_entry");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth flow state
  const [otpEnforced, setOtpEnforced] = useState(false); // True when OTP threshold is met

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setIsProcessing(true);

    try {
      // Check if user exists and if OTP is required
      const userCheck = await checkUserExists(email);

      if (!userCheck.exists) {
        // New user - show signup form
        setCurrentStep("signup");
        setIsProcessing(false);
        return;
      }

      // Check if OTP threshold has been met
      if (userCheck.requiresOtp) {
        // OTP is enforced - send OTP immediately and skip password option
        setOtpEnforced(true);

        const otpResult = await generateAndSendOTP(email);

        if (!otpResult.success) {
          setError(otpResult.error || "Failed to send verification code");
          setIsProcessing(false);
          return;
        }

        toast.success("Verification code sent! Check your email.");
        setCurrentStep("otp_verification");
        setIsProcessing(false);
        return;
      }

      // OTP not required - send OTP but allow password fallback
      setOtpEnforced(false);
      const otpResult = await generateAndSendOTP(email);

      if (!otpResult.success) {
        setError(otpResult.error || "Failed to send verification code");
        setIsProcessing(false);
        return;
      }

      toast.success("Verification code sent! Check your email.");
      setCurrentStep("otp_verification");
      setIsProcessing(false);
    } catch (err) {
      console.error("Auth error:", err);
      setError("An error occurred. Please try again.");
      setIsProcessing(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsProcessing(true);

    try {
      // Complete password login (threshold already checked during email entry)
      const loginResult = await completePasswordLogin(email, password);

      if (!loginResult.success) {
        setError(loginResult.error || "Invalid password");
        setIsProcessing(false);
        return;
      }

      toast.success("Welcome back!");
      setCurrentStep("redirecting");

      // Small delay to ensure toast is visible before redirect
      setTimeout(() => {
        // Use window.location to force a full page reload which will pick up the new auth state
        window.location.href = redirectUrl;
      }, 300);
    } catch (err) {
      console.error("Auth error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleOTPVerified() {
    toast.success("Verification successful! Welcome back.");
    setCurrentStep("redirecting");

    // Small delay to ensure toast is visible before redirect
    setTimeout(() => {
      // Use window.location to force a full page reload which will pick up the new auth state
      window.location.href = redirectUrl;
    }, 300);
  }

  function handlePasswordFallback() {
    // Show password entry form
    setCurrentStep("password_entry");
    setPassword(""); // Clear any existing password
  }

  function handleSignupSuccess() {
    // After signup, OTP is automatically sent
    toast.success("Account created! Check your email for verification code.");
    setCurrentStep("otp_verification");
  }

  function handleCancelSignup() {
    setCurrentStep("email_entry");
    setPassword("");
  }

  function handleCloseOTP() {
    setCurrentStep("email_entry");
  }

  // Render based on current step
  if (currentStep === "signup") {
    return (
      <div className="w-full max-w-md mx-auto">
        <SignupFormSimplified
          email={email}
          onSuccess={handleSignupSuccess}
          onCancel={handleCancelSignup}
        />
      </div>
    );
  }

  if (currentStep === "otp_verification") {
    return (
      <SignInPage
        title={<span className="sr-only">Verification</span>}
        description=""
        heroImageSrc="/images/signin-video.mp4"
        error={null}
        isProcessing={false}
        showGoogleButton={false}
        showCreateAccount={false}
      >
        <div className="space-y-8">
          <button
            type="button"
            onClick={handleCloseOTP}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span className="font-medium">Back</span>
          </button>
          
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              Enter Verification Code
            </h2>

            {otpEnforced && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm text-foreground">
                <p className="font-medium mb-1">🔒 Two-Factor Authentication Required</p>
                <p className="text-muted-foreground">
                  For your security, you&apos;ve reached the password login limit (10 logins).
                  Please verify using the code sent to your email.
                </p>
              </div>
            )}

            <OTPVerification
              email={email}
              onVerified={handleOTPVerified}
              onPasswordFallback={handlePasswordFallback}
              onBack={handleCloseOTP}
              disablePasswordFallback={otpEnforced}
            />
          </div>
        </div>
      </SignInPage>
    );
  }

  if (currentStep === "password_entry") {
    return (
      <SignInPage
        title={<span className="font-semibold text-foreground tracking-tight">Enter Your Password</span>}
        description={
          <>
            Sign in to <span className="font-semibold text-foreground">{email}</span>
          </>
        }
        heroImageSrc="/images/signin-video.mp4"
        error={error}
        isProcessing={isProcessing}
        showGoogleButton={false}
        showCreateAccount={false}
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div className="animate-element animate-delay-300 space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
              Password
            </Label>
            <div className="rounded-2xl border border-border bg-foreground/5 transition-colors focus-within:border-primary/70 focus-within:bg-primary/10">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isProcessing}
                  autoComplete="current-password"
                  autoFocus
                  className="w-full bg-transparent border-0 text-sm p-4 pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  ) : (
                    <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="animate-element animate-delay-400 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseOTP}
              disabled={isProcessing}
              className="flex-1 rounded-2xl py-4"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-2xl py-4 font-medium hover:scale-[1.02] transition-all"
              disabled={isProcessing || !password}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </div>

          <div className="animate-element animate-delay-500 text-center text-sm">
            <a
              href="/auth/forgot-password"
              className="text-primary hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </form>
      </SignInPage>
    );
  }

  // Redirecting state - full page spinner with fade-in
  if (currentStep === "redirecting") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background animate-in fade-in duration-200">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Taking you to BePrepared Dashboard
          </p>
        </div>
      </div>
    );
  }

  // Default: Email entry
  return (
    <SignInPage
      title={
        <div className="w-full flex items-center" style={{ height: '12vh', minHeight: '100px' }}>
          <VaporizeTextCycle
            texts={["BePrepared"]}
            font={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "60px",
              fontWeight: 800
            }}
            color="rgb(33, 102, 221)"
            spread={5}
            density={5}
            animation={{
              vaporizeDuration: 2,
              fadeInDuration: 1,
              waitDuration: 0.5
            }}
            direction="left-to-right"
            alignment="center"
            tag={Tag.H1}
          />
        </div>
      }
      description="Sign in or create an account to start building your personalized emergency preparedness plan"
      heroImageSrc="/images/signin-video.mp4"
      error={error}
      isProcessing={isProcessing}
      onGoogleSignIn={() => toast.info("Google sign-in coming soon!")}
      showPasswordField={false}
      showRememberMe={false}
      showCreateAccount={false}
    >
      <form onSubmit={handleEmailSubmit} className="space-y-5">
        <div className="animate-element animate-delay-300 space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
            Email Address
          </Label>
          <div className="rounded-2xl border border-border bg-foreground/5 transition-colors focus-within:border-primary/70 focus-within:bg-primary/10">
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isProcessing}
              autoComplete="email"
              autoFocus
              className="w-full bg-transparent border-0 text-sm p-4 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="animate-element animate-delay-400 w-full rounded-2xl py-4 font-medium hover:scale-[1.02] transition-all"
          disabled={isProcessing || !email}
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </form>
    </SignInPage>
  );
}

