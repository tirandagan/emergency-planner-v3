import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const runNewMigrations = async (): Promise<void> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Environment variables required');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const newMigrations = [
    '0022_create_system_settings.sql',
    '0023_create_plan_versions.sql',
    '0024_create_plan_edit_history.sql',
    '0025_enhance_plan_shares.sql',
  ];

  console.log('🔄 Running new migrations...\n');

  for (const file of newMigrations) {
    console.log(`📝 Running: ${file}`);
    const filePath = join('./drizzle/migrations', file);
    const sql = readFileSync(filePath, 'utf-8');

    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error(`❌ Failed:`, error);
      throw error;
    }

    console.log(`✅ Completed: ${file}`);
  }

  console.log('\n✅ All new migrations completed');
  process.exit(0);
};

runNewMigrations().catch(console.error);
