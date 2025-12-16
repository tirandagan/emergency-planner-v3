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

export default async function AuthPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout title="Welcome">
      <UnifiedAuthForm />
    </AuthLayout>
  );
}

