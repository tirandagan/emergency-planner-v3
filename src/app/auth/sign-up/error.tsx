"use client";

import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignUpError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AuthLayout title="Error" subtitle="Something went wrong">
      <div className="text-center py-8">
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="block w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Go Home
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

