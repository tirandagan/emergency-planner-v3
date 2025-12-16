import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const applyTokenMigration = async (): Promise<void> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  console.log('🔄 Applying token tracking migration to profiles table...');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // SQL for adding token tracking fields
  const sql = `
    -- Add token tracking fields to profiles
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_tokens_used integer DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_token_update timestamp with time zone;
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_profiles_total_tokens ON profiles USING btree (total_tokens_used);
    CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles USING btree (last_login_at);
  `;

  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('❌ Failed to apply migration:', error);
    throw error;
  }

  console.log('✅ Token tracking migration completed successfully');
  process.exit(0);
};

applyTokenMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  console.log('\n💡 Note: If exec_sql RPC is not available, you can run this SQL manually in Supabase SQL Editor');
  process.exit(1);
});
