import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { MigrationPanel } from './MigrationPanel';
import type { JSX } from 'react';

export default async function MigrateTagsPage(): Promise<JSX.Element> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return redirect('/auth/login');

    // Check admin role
    const [profile] = await db
        .select({ role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);

    if (profile?.role !== 'ADMIN') return redirect('/');

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Tag System Migration</h1>
                <p className="text-muted-foreground mb-8">
                    Run the data migration to convert existing product tags to the new upward propagation
                    system.
                </p>

                <MigrationPanel />
            </div>
        </div>
    );
}
