import type { JSX } from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ConsultingServiceForm } from '@/components/admin/consulting/ConsultingServiceForm';
import { db } from '@/db';
import { bundles, consultingServices } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditConsultingServicePage({
  params,
}: EditServicePageProps): Promise<JSX.Element> {
  const { id } = await params;

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

  // Fetch the service to edit
  const [service] = await db
    .select()
    .from(consultingServices)
    .where(eq(consultingServices.id, id))
    .limit(1);

  if (!service) {
    notFound();
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
        <h1 className="text-3xl font-bold tracking-tight">Edit Consulting Service</h1>
        <p className="text-muted-foreground mt-2">
          Update the consulting service offering configuration
        </p>
      </div>

      <ConsultingServiceForm service={service} bundles={availableBundles} />
    </div>
  );
}
