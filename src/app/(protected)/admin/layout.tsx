import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm";
import LLMCallbackNotificationPoller from "@/components/admin/LLMCallbackNotificationPoller";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Check if user is admin
  const roleStart = Date.now();
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  // Keep warning for slow role checks (performance monitoring)
  const roleDuration = Date.now() - roleStart;
  if (roleDuration > 500) {
    console.warn(`[Admin Layout] Slow role check: ${roleDuration}ms`);
  }

  if (!profile || profile.role !== 'ADMIN') {
    return redirect("/");
  }

  return (
    <>
      <LLMCallbackNotificationPoller />
      {children}
    </>
  );
}
