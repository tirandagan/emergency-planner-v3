'use server'

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function devLogin(email: string) {
  if (process.env.NODE_ENV !== 'development') {
    return { error: 'Dev login only available in development mode' };
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  });

  if (error) {
    console.error('Dev login error:', error);
    return { error: error.message };
  }

  return { url: data.properties?.action_link };
}


