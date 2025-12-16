import { createClient } from '@/utils/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import type { User } from '@supabase/supabase-js';

export async function checkAdmin(): Promise<User> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');

    const [profile] = await db
        .select({ role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);
        
    if (!profile || profile.role !== 'ADMIN') throw new Error('Unauthorized: Admins only');
    
    return user;
}

export async function getAdminUser(): Promise<User> {
    return checkAdmin();
}



















