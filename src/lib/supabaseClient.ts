import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "WARNING: Supabase environment variables are missing. The app will load but database features will fail.\n" +
    "Please check your .env.local file and ensure variables are named NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

// Use placeholders to prevent 'supabaseUrl is required' crash during initialization
// requests will simply fail with 404/401 instead of crashing the app
const validUrl = supabaseUrl || 'https://placeholder.supabase.co';
const validKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createBrowserClient(validUrl, validKey);
