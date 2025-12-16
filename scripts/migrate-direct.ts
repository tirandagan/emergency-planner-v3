import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const runMigrations = async (): Promise<void> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }

  console.log('🔄 Running migrations...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read the migration file
  const migrationSQL = readFileSync('./drizzle/migrations/0000_curly_matthew_murdock.sql', 'utf-8');

  // Execute the migration
  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();

  if (error) {
    // If RPC doesn't work, try direct approach
    console.log('RPC method failed, trying direct SQL execution...');
    
    // Split into individual statements and execute
    const statements = migrationSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error: execError } = await supabase.from('_temp').select('*').limit(0);
        
        if (execError) {
          console.log('Using REST API approach...');
          // Execute via REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ query: statement })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to execute migration: ${await response.text()}`);
          }
        }
      }
    }
  }

  console.log('✅ Migrations completed successfully');
  process.exit(0);
};

runMigrations().catch((err) => {
  console.error('❌ Migration failed:', err);
  console.log('\n📝 You can run this SQL manually in Supabase SQL Editor:');
  console.log(readFileSync('./drizzle/migrations/0000_curly_matthew_murdock.sql', 'utf-8'));
  process.exit(1);
});




























