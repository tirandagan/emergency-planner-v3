"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyOTP, generateAndSendOTP } from "@/app/actions/auth-unified";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OTPVerificationProps {
  email: string;
  onVerified: () => void;
  onPasswordFallback: () => void;
  onBack: () => void;
  disablePasswordFallback?: boolean; // True when OTP is enforced due to threshold
}

export function OTPVerification({
  email,
  onVerified,
  onPasswordFallback,
  onBack,
  disablePasswordFallback = false,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  const [resendCount, setResendCount] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Define handleVerify before effects that use it
  const handleVerify = useCallback(async () => {
    const fullOtp = otp.join("");
    
    if (fullOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyOTP(email, fullOtp);

      if (result.success) {
        toast.success("Verification successful!");
        onVerified();
      } else {
        toast.error(result.error || "Invalid verification code");
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }, [otp, email, onVerified]);

  // Auto-focus first input when component mounts
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Auto-submit when all digits entered
  useEffect(() => {
    const fullOtp = otp.join("");
    if (fullOtp.length === 6 && !isVerifying) {
      handleVerify();
    }
  }, [otp, isVerifying, handleVerify]);

  function handleOtpChange(index: number, value: string) {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  }

  async function handleResend() {
    if (resendCount >= 3) {
      toast.error("Maximum resend attempts reached. Please try again later.");
      return;
    }

    setIsResending(true);

    try {
      const result = await generateAndSendOTP(email);

      if (result.success) {
        toast.success("New code sent! Check your email.");
        setResendCount((prev) => prev + 1);
        setTimeLeft(3600); // Reset timer
        setOtp(["", "", "", "", "", ""]); // Clear current OTP
        inputRefs.current[0]?.focus();
      } else {
        toast.error(result.error || "Failed to resend code");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-6">
      {/* Title and Description */}
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="animate-element animate-delay-300">
        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-semibold rounded-2xl"
              disabled={isVerifying}
            />
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="animate-element animate-delay-400 text-center text-sm text-muted-foreground">
        {timeLeft > 0 ? (
          <span>
            Code expires in:{" "}
            <span className="font-semibold">{formatTime(timeLeft)}</span>
          </span>
        ) : (
          <span className="text-destructive">
            Code expired. Please request a new one.
          </span>
        )}
      </div>

      {/* Verify Button */}
      <Button
        onClick={handleVerify}
        disabled={isVerifying || otp.join("").length !== 6}
        className="animate-element animate-delay-500 w-full rounded-2xl py-4 font-medium hover:scale-[1.02] transition-all"
      >
        {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify Code
      </Button>

      {/* Resend Link */}
      <div className="animate-element animate-delay-600 text-center text-sm">
        <span className="text-muted-foreground">Didn&apos;t receive it? </span>
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || resendCount >= 3}
          className="text-primary hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {isResending ? "Sending..." : "Resend code"}
        </button>
        {resendCount > 0 && (
          <span className="text-muted-foreground ml-1">
            ({3 - resendCount} remaining)
          </span>
        )}
      </div>

      {/* Password Fallback - Only show if not enforced */}
      {!disablePasswordFallback && (
        <>
          <div className="animate-element animate-delay-700 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onPasswordFallback}
            className="animate-element animate-delay-800 w-full rounded-2xl py-4"
          >
            Use password instead
          </Button>
        </>
      )}
    </div>
  );
}

