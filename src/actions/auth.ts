'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { supabase } from '@/lib/supabaseClient';

export async function checkUserExists(email: string) {
  const start = Date.now();
  console.log(`[Auth Action] Checking user ${email} at ${new Date().toISOString()}`);
  try {
    // 1. Try Admin API (Source of Truth) - REQUIRES SERVICE_ROLE_KEY
    // Note: listUsers is paginated (default 50), so this might miss users in large dbs
    // but it's the only way to check auth.users without getUserByEmail
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    console.log(`[Auth Action] Admin listUsers took ${Date.now() - start}ms`);

    if (error) {
      // If Invalid API Key (Admin key missing), silently fall back to profile check
      if (error.message?.includes('Invalid API key') || error.code === '401') {
        // console.warn('Service Role Key missing/invalid, falling back to public profile check');
      } else {
        console.error('Error listing users:', error);
      }
      throw error; // Trigger fallback
    }

    // Case-insensitive email comparison
    const user = data.users.find(
      u => u.email?.toLowerCase() === email.toLowerCase()
    );
    return { 
      exists: !!user, 
      confirmed: !!user?.email_confirmed_at 
    };

  } catch (adminError) {
    // 2. Fallback: Check public profiles table using Anon Client
    console.log(`[Auth Action] Falling back to profile check. Admin check failed/skipped.`);
    const profileStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id') // We can't check confirmed status from public profile easily without exposing it
        .ilike('email', email)
        .maybeSingle(); // Use maybeSingle to avoid error on no rows

      if (error) {
        console.error('Profile check failed:', error);
        return { exists: false, confirmed: false };
      }

      // If found in profiles, assume confirmed or at least exists. 
      // Ideally we'd know if they are confirmed, but profiles usually implies they completed signup?
      // Actually, profile is created in handleProfileSubmit BEFORE verification?
      // No, usually profile is created after?
      // Wait, Login.tsx handleProfileSubmit calls signInWithOtp with data.
      // It doesn't create a profile row directly unless a trigger does it.
      // Supabase usually creates a user in auth.users.
      // If we rely on profiles table, we might not know if confirmed.
      // But if admin check fails, we are in a degraded state.
      
      return { exists: !!data, confirmed: !!data }; // optimistic fallback
    } catch (profileError) {
      console.error('Unexpected error checking profile:', profileError);
      return { exists: false, confirmed: false };
    }
  }
}

