'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { markCallbackAsViewed as markViewed } from '@/lib/llm-callbacks';

/**
 * Verify user has admin role
 */
async function verifyAdminRole(userId: string): Promise<boolean> {
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile?.role === 'ADMIN';
}

/**
 * Mark LLM callback as viewed by current admin user
 * Inserts into join table (idempotent - primary key prevents duplicates)
 *
 * @param callbackId - UUID of the callback
 * @returns Success status and optional error message
 */
export async function markCallbackAsViewed(
  callbackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Verify admin role
    const isAdmin = await verifyAdminRole(user.id);
    if (!isAdmin) {
      return { success: false, error: 'Admin access required' };
    }

    // 3. Mark callback as viewed (uses ON CONFLICT DO NOTHING for idempotency)
    await markViewed(callbackId, user.id);

    // 4. Revalidate admin callback pages
    revalidatePath('/admin/debug', 'page');

    return { success: true };
  } catch (error) {
    console.error('[Server Action] Error marking callback as viewed:', error);
    return { success: false, error: 'Failed to mark callback as viewed' };
  }
}
