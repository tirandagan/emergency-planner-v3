"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  checkUserExists,
  validateCredentials,
  generateAndSendOTP,
  completePasswordLogin,
} from "@/app/actions/auth-unified";
import { OTPVerification } from "./OTPVerification";
import { SignupFormSimplified } from "./SignupFormSimplified";

type AuthStep =
  | "email_entry"
  | "password_entry"
  | "signup"
  | "otp_verification"
  | "loading";

interface UnifiedAuthFormProps {
  redirectUrl?: string;
}

export function UnifiedAuthForm({ redirectUrl = "/dashboard" }: UnifiedAuthFormProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<AuthStep>("email_entry");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth flow state (managed through currentStep)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setIsProcessing(true);

    try {
      // Check if user exists
      const userCheck = await checkUserExists(email);

      if (!userCheck.exists) {
        // New user - show signup form
        setCurrentStep("signup");
        setIsProcessing(false);
        return;
      }

      // Existing user - send OTP immediately
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
      // Validate credentials
      const validation = await validateCredentials(email, password);

      if (!validation.success) {
        setError(validation.error || "Invalid password");
        setIsProcessing(false);
        return;
      }

      // Check if OTP is required
      if (validation.requiresOtp) {
        // Send OTP and show verification modal
        const otpResult = await generateAndSendOTP(email);
        
        if (!otpResult.success) {
          setError(otpResult.error || "Failed to send verification code");
          setIsProcessing(false);
          return;
        }

        toast.success("Verification code sent! Check your email.");
        setCurrentStep("otp_verification");
      } else {
        // Direct login
        const loginResult = await completePasswordLogin(email, password);
        
        if (!loginResult.success) {
          setError(loginResult.error || "Login failed");
          setIsProcessing(false);
          return;
        }

        toast.success("Welcome back!");
        // Use window.location to force a full page reload which will pick up the new auth state
        window.location.href = redirectUrl;
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleOTPVerified() {
    toast.success("Verification successful! Welcome back.");
    // Use window.location to force a full page reload which will pick up the new auth state
    window.location.href = redirectUrl;
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
      <OTPVerification
        open={true}
        email={email}
        onVerified={handleOTPVerified}
        onPasswordFallback={handlePasswordFallback}
        onClose={handleCloseOTP}
      />
    );
  }

  if (currentStep === "password_entry") {
    return (
      <div className="w-full max-w-md mx-auto">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2 text-center mb-6">
            <h2 className="text-3xl font-bold">Enter Your Password</h2>
            <p className="text-muted-foreground">
              Sign in to <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isProcessing}
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseOTP}
              disabled={isProcessing}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isProcessing || !password}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center text-sm">
            <a
              href="/auth/forgot-password"
              className="text-primary hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    );
  }

  // Default: Email entry
  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div className="space-y-1 text-center mb-6">
          <h2 className="text-2xl font-bold">Welcome</h2>
          <p className="text-sm text-muted-foreground">
            Sign in or create an account
          </p>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isProcessing}
            autoComplete="email"
            autoFocus
          />
        </div>

        {/* Continue Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isProcessing || !email}
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>

        {/* OAuth Placeholder (Phase 2) */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
          Sign in with Google (Coming Soon)
        </Button>
      </form>

    </div>
  );
}

