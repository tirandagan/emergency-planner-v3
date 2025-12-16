import { AuthLayout } from "@/components/auth/AuthLayout";
import { VerifyEmailCodeForm } from "@/components/auth/VerifyEmailCodeForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Verify Email | Emergency Planner",
  description: "Verify your email address",
};

// Force dynamic rendering (uses cookies for auth check)
export const dynamic = 'force-dynamic';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Use email from URL params (signup flow) or session (resend flow)
  const userEmail = params.email || user?.email;

  return (
    <AuthLayout
      title="Verify Your Email"
      subtitle="Enter the 6-digit code we sent to your email"
    >
      <VerifyEmailCodeForm userEmail={userEmail} />
    </AuthLayout>
  );
}

