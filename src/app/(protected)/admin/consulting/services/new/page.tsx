import type { JSX } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ConsultingServiceForm } from '@/components/admin/consulting/ConsultingServiceForm';
import { db } from '@/db';
import { bundles } from '@/db/schema';

export default async function NewConsultingServicePage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') {
    redirect('/');
  }

  // Fetch bundles for bundle selection
  const availableBundles = await db
    .select({
      id: bundles.id,
      name: bundles.name,
    })
    .from(bundles)
    .orderBy(bundles.name);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Consulting Service</h1>
        <p className="text-muted-foreground mt-2">
          Add a new consulting service offering for users to discover and book
        </p>
      </div>

      <ConsultingServiceForm bundles={availableBundles} />
    </div>
  );
}
