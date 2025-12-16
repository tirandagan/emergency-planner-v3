import React from 'react';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/utils/supabase/server';
import { getDeletedPlans } from '@/lib/mission-reports';
import { TrashView } from '@/components/plans/trash/TrashView';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function TrashPage(): Promise<React.JSX.Element> {
  const user = await getCurrentUser();

  if (!user) {
    notFound();
  }

  // Get user's subscription tier for restoration period info
  const [profile] = await db
    .select({ subscriptionTier: profiles.subscriptionTier })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const userTier = (profile?.subscriptionTier || 'FREE') as 'FREE' | 'BASIC' | 'PRO';

  // Fetch deleted plans within retention window
  const deletedPlans = await getDeletedPlans(user.id);

  return (
    <div className="container mx-auto py-4 md:py-6 px-4 max-w-6xl">
      <TrashView deletedPlans={deletedPlans} userTier={userTier} />
    </div>
  );
}
