import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const runMigration = async (): Promise<void> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  console.log('🔄 Applying change_history migration...');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Read the migration file
  const sql = readFileSync('./drizzle/migrations/0013_vengeful_vance_astro.sql', 'utf-8');

  console.log('📝 Executing SQL migration...');
  console.log(sql);
  console.log('---');

  // Execute the SQL
  const { error } = await supabase.rpc('exec_sql', { sql });

  if (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  console.log('✅ Migration completed successfully!');
  process.exit(0);
};

runMigration().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
