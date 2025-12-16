import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign In | Emergency Planner",
  description: "Sign in to your Emergency Planner account",
};

/**
 * Legacy login route - redirects to unified auth page
 * Maintained for backward compatibility with bookmarks and external links
 */
export default function LoginPage() {
  redirect("/auth");
}

