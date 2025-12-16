import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign Up | Emergency Planner",
  description: "Create your Emergency Planner account",
};

/**
 * Legacy signup route - redirects to unified auth page
 * Maintained for backward compatibility with bookmarks and external links
 */
export default function SignUpPage() {
  redirect("/auth");
}

