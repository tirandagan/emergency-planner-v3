import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const runSingleMigration = async (): Promise<void> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  console.log('🔄 Running migration 0005_true_punisher.sql...');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const sql = readFileSync('./drizzle/migrations/0005_true_punisher.sql', 'utf-8');

  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('❌ Failed to run migration:', error);
    throw error;
  }

  console.log('✅ Migration 0005 completed successfully');
  process.exit(0);
};

runSingleMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
