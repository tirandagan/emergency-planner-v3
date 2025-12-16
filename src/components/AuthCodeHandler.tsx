"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuthCodeHandlerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (code) {
      // Redirect to callback handler with the code
      router.replace(`/auth/callback?code=${code}`);
    }
  }, [searchParams, router]);

  return null;
}

export function AuthCodeHandler() {
  return (
    <Suspense fallback={null}>
      <AuthCodeHandlerInner />
    </Suspense>
  );
}




























