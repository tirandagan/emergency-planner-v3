import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, join } from 'path';
import { readFileSync, readdirSync } from 'fs';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const runMigrations = async (): Promise<void> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  console.log('🔄 Running migrations using Supabase client...');
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  // Read all migration files
  const migrationsDir = './drizzle/migrations';
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration file(s)`);

  for (const file of files) {
    console.log(`\n📝 Running: ${file}`);
    const filePath = join(migrationsDir, file);
    const sql = readFileSync(filePath, 'utf-8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Failed to run ${file}:`, error);
      throw error;
    }
    
    console.log(`✅ Completed: ${file}`);
  }

  console.log('\n✅ All migrations completed successfully');
  process.exit(0);
};

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  console.log('\n💡 Note: If exec_sql RPC is not available, you can run migrations manually in Supabase SQL Editor');
  process.exit(1);
});

