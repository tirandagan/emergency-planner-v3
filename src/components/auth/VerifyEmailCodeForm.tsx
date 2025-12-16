"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { verifyEmailCode, resendVerificationCode } from "@/app/actions/auth";

interface VerifyEmailCodeFormProps {
  userEmail?: string;
}

export function VerifyEmailCodeForm({ userEmail }: VerifyEmailCodeFormProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string): void {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent): void {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    
    setCode(newCode);
    
    const nextEmptyIndex = newCode.findIndex((digit) => !digit);
    if (nextEmptyIndex === -1) {
      inputRefs.current[5]?.focus();
    } else {
      inputRefs.current[nextEmptyIndex]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    
    if (!userEmail) {
      setError("Email address is missing. Please try signing up again.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await verifyEmailCode(userEmail, code.join(""));

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        // Use window.location to force a full page reload which will pick up the new auth state
        window.location.href = "/dashboard";
      }, 1500);
    } else {
      setError(result.error);
      setLoading(false);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  }

  async function handleResend(): Promise<void> {
    if (resendCooldown > 0 || !userEmail) return;

    setLoading(true);
    setError(null);

    const result = await resendVerificationCode(userEmail);

    if (result.success) {
      setResendCooldown(60);
      setError(null);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Email Verified!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div
          className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We sent a 6-digit code to:
        </p>
        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
          {userEmail || "your email"}
        </p>
      </div>

      {/* 6-Digit Code Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
          Enter code:
        </label>
        <div className="flex gap-2 justify-center">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              aria-label={`Digit ${index + 1} of 6`}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
            />
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || code.some((digit) => !digit)}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        aria-live="polite"
      >
        {loading ? "Verifying..." : "Verify Code"}
      </button>

      {/* Resend Code */}
      <div className="text-center text-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </button>
        </p>
      </div>

      {/* Alternative Options */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-center text-sm">
        <Link
          href="/auth/verify-manual"
          className="block text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Can&apos;t access this email?
        </Link>
        <button
          type="button"
          className="block w-full text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          Change Email Address
        </button>
      </div>
    </form>
  );
}

