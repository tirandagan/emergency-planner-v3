"use client";

import { useState } from "react";
import Link from "next/link";
import { submitManualVerificationRequest } from "@/app/actions/auth";

export function ManualVerificationForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const result = await submitManualVerificationRequest(formData);

    if (result.success) {
      setSuccess(true);
    } else {
      if (result.field) {
        setFieldErrors({ [result.field]: result.error });
      } else {
        setError(result.error);
      }
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Request Submitted
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          We&apos;ll review your request within 24-48 hours and get back to you.
        </p>
        <Link
          href="/auth/login"
          className="inline-block text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 font-medium"
        >
          Return to Sign In
        </Link>
      </div>
    );
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

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Can&apos;t access your email? We&apos;ll review your request and help verify your account manually.
      </div>

      {/* Reason Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Reason for override:
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="reason"
              value="LOST_ACCESS"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Lost access to email
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="reason"
              value="EMAIL_NOT_ARRIVING"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Email not arriving
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="reason"
              value="OTHER"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Other (explain below)
            </span>
          </label>
        </div>
        {fieldErrors.reason && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.reason}</p>
        )}
      </div>

      {/* Additional Details */}
      <div>
        <label htmlFor="details" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Additional details:
        </label>
        <textarea
          id="details"
          name="details"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Please provide any additional information that might help us verify your account..."
        />
      </div>

      {/* Alternate Contact */}
      <div>
        <label htmlFor="alternateContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Alternative contact (phone/email):
        </label>
        <input
          type="text"
          id="alternateContact"
          name="alternateContact"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Alternative way to reach you"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        aria-live="polite"
      >
        {loading ? "Submitting..." : "Submit Request"}
      </button>

      {/* Back Link */}
      <div className="text-center">
        <Link
          href="/auth/verify-email"
          className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ← Back to Verification
        </Link>
      </div>
    </form>
  );
}

