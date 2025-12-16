"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { PolicyModal } from "./PolicyModal";
import { TermsOfServiceContent } from "./TermsOfServiceContent";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { createAccountWithOTP } from "@/app/actions/auth-unified";
import { toast } from "sonner";

interface SignupFormSimplifiedProps {
  email: string;
  password?: string; // Optional - may not be set yet
  onSuccess: () => void;
  onCancel: () => void;
}

export function SignupFormSimplified({
  email,
  password: initialPassword = "",
  onSuccess,
  onCancel,
}: SignupFormSimplifiedProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState(initialPassword);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Policy acceptance tracking
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [termsCheckboxChecked, setTermsCheckboxChecked] = useState(false);

  function handleTermsCheckboxClick(e: React.MouseEvent<HTMLInputElement>): void {
    e.preventDefault();
    if (!termsAccepted || !privacyAccepted) {
      setShowWarningDialog(true);
      return;
    }
    setTermsCheckboxChecked(!termsCheckboxChecked);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }

    if (confirmPassword !== password) {
      toast.error("Passwords do not match");
      return;
    }

    if (!termsCheckboxChecked) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createAccountWithOTP(email, password, termsCheckboxChecked, firstName.trim(), lastName.trim());

      if (result.success) {
        toast.success("Account created! Check your email for verification code.");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to create account");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2 text-center mb-6">
          <h2 className="text-2xl font-bold">Create Your Account</h2>
          <p className="text-sm text-muted-foreground">
            Welcome! Let&apos;s get you started.
          </p>
        </div>

        {/* Email (read-only, already validated) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            readOnly
            className="bg-muted"
          />
        </div>

        {/* First and Last Name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              required
              disabled={isSubmitting}
              minLength={8}
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

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Terms and Privacy Policy Acceptance */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="terms"
              checked={termsCheckboxChecked}
              onClick={handleTermsCheckboxClick}
              readOnly
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!termsAccepted || !privacyAccepted || isSubmitting}
            />
            <label htmlFor="terms" className="text-sm leading-tight">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setTermsModalOpen(true)}
                className="text-primary hover:underline font-medium"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(true)}
                className="text-primary hover:underline font-medium"
              >
                Privacy Policy
              </button>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !termsCheckboxChecked || !firstName.trim() || !lastName.trim() || !password || confirmPassword !== password}
            className="flex-1"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </div>
      </form>

      {/* Terms of Service Modal */}
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

      {/* Privacy Policy Modal */}
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
            <AlertDialogTitle>Terms Not Accepted</AlertDialogTitle>
            <AlertDialogDescription>
              Please read and accept both the Terms of Service and Privacy Policy before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setShowWarningDialog(false)}>Got it</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

