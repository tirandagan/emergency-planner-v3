import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Sign In | Emergency Planner",
  description: "Sign in to your Emergency Planner account or create a new one",
};

// Force dynamic rendering (uses cookies for auth check)
export const dynamic = 'force-dynamic';

interface AuthPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  const redirectUrl = params.redirect ? decodeURIComponent(params.redirect) : "/dashboard";

  // Redirect authenticated users to their intended destination
  if (user) {
    redirect(redirectUrl);
  }

  return (
    <AuthLayout title="Welcome">
      <UnifiedAuthForm redirectUrl={redirectUrl} />
    </AuthLayout>
  );
}

