import { headers } from "next/headers";
import type { SubscriptionTier } from "@/lib/types/subscription";
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
  const headersList = await headers();

  const userTier = (headersList.get("x-user-tier") || "FREE") as SubscriptionTier;
  const userName = headersList.get("x-user-name") || null;

  const props = {
    userTier,
    userName
  };

  return <Dashboard {...props} />;
}
