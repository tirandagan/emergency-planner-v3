import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password | Emergency Planner",
  description: "Set your new password",
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Enter a strong password for your account"
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}




























