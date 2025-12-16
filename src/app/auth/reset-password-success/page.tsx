import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthSuccessState } from "@/components/auth/AuthSuccessState";

export const metadata = {
  title: "Check Your Email | Emergency Planner",
  description: "Password reset email sent",
};

export default function ResetPasswordSuccessPage() {
  return (
    <AuthLayout
      title="Check Your Email"
      subtitle="Password reset instructions sent"
    >
      <AuthSuccessState
        title="Email Sent!"
        message="We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password."
        actionText="Back to Sign In"
        actionHref="/auth/login"
        secondaryActionText="Resend Email"
        secondaryActionHref="/auth/forgot-password"
      />
    </AuthLayout>
  );
}

