import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm";
import LLMCallbackNotificationPoller from "@/components/admin/LLMCallbackNotificationPoller";

// Disable static generation for admin routes (always check auth)
export const dynamic = 'force-dynamic';

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

  // Check if user is admin - optimized with timeout
  const roleStart = Date.now();
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

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
      <Suspense fallback={<AdminPageSkeleton />}>
        {children}
      </Suspense>
    </>
  );
}

/**
 * Skeleton loader for admin pages while content streams in
 */
function AdminPageSkeleton(): React.JSX.Element {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="h-10 bg-muted rounded w-1/3" />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
