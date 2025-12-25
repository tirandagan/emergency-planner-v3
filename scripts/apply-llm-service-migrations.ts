import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const applyMigrations = async (): Promise<void> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  console.log('🔄 Applying LLM Service migrations...');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Migration 1: Add job_id column and index
  const migration1 = `
    ALTER TABLE "mission_reports" ADD COLUMN "job_id" uuid;
    CREATE INDEX "idx_mission_reports_job_id" ON "mission_reports" USING btree ("job_id");
  `;

  console.log('\n📝 Applying migration 0005: Add job_id column');
  const { error: error1 } = await supabase.rpc('exec_sql', { sql: migration1 });

  if (error1) {
    console.error('❌ Failed to apply migration 0005:', error1);
    throw error1;
  }
  console.log('✅ Migration 0005 applied successfully');

  // Migration 2: Add status column and index
  const migration2 = `
    ALTER TABLE "mission_reports" ADD COLUMN "status" varchar(50);
    CREATE INDEX "idx_mission_reports_status" ON "mission_reports" USING btree ("status");
  `;

  console.log('\n📝 Applying migration 0006: Add status column');
  const { error: error2 } = await supabase.rpc('exec_sql', { sql: migration2 });

  if (error2) {
    console.error('❌ Failed to apply migration 0006:', error2);
    throw error2;
  }
  console.log('✅ Migration 0006 applied successfully');

  console.log('\n✅ All LLM Service migrations completed successfully');
  process.exit(0);
};

applyMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  console.log('\n💡 Note: You may need to apply these migrations manually in Supabase SQL Editor');
  process.exit(1);
});
