import { redirect } from "next/navigation";
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

export default async function AuthPage({ searchParams }: AuthPageProps): Promise<React.JSX.Element> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  const redirectUrl = params.redirect ? decodeURIComponent(params.redirect) : "/dashboard";

  // Read site testing status from environment
  const siteStatus = process.env.SITE_TESTING_STATUS || 'live';

  // Redirect authenticated users to their intended destination
  if (user) {
    redirect(redirectUrl);
  }

  return <UnifiedAuthForm redirectUrl={redirectUrl} siteStatus={siteStatus} />;
}

