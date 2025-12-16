import { AuthLayout } from "@/components/auth/AuthLayout";
import { ManualVerificationForm } from "@/components/auth/ManualVerificationForm";

export const metadata = {
  title: "Manual Verification | Emergency Planner",
  description: "Request manual email verification",
};

export default function VerifyManualPage() {
  return (
    <AuthLayout
      title="Request Manual Verification"
      subtitle="Can't access your email? We'll review your request."
    >
      <ManualVerificationForm />
    </AuthLayout>
  );
}

