import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStoragePolicies(): Promise<void> {
  console.log('🔧 Setting up storage policies for supplier-logos bucket...\n');

  // Check existing policies
  console.log('🔍 Checking existing policies...');

  let existingPolicies = null;
  try {
    const { data } = await supabase.rpc('list_policies', {
      bucket_name: 'supplier-logos'
    });
    existingPolicies = data;
  } catch {
    // Ignore errors if RPC function doesn't exist
  }

  if (existingPolicies) {
    console.log('📋 Existing policies:', existingPolicies);
  }

  // Create policies using SQL
  console.log('\n📝 Creating storage policies...\n');

  const policies = [
    {
      name: 'Allow authenticated users to upload supplier logos',
      operation: 'INSERT',
      sql: `
        CREATE POLICY "Allow authenticated uploads to supplier-logos"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'supplier-logos');
      `
    },
    {
      name: 'Allow authenticated users to update supplier logos',
      operation: 'UPDATE',
      sql: `
        CREATE POLICY "Allow authenticated updates to supplier-logos"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'supplier-logos');
      `
    },
    {
      name: 'Allow authenticated users to delete supplier logos',
      operation: 'DELETE',
      sql: `
        CREATE POLICY "Allow authenticated deletes from supplier-logos"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'supplier-logos');
      `
    },
    {
      name: 'Allow public read access to supplier logos',
      operation: 'SELECT',
      sql: `
        CREATE POLICY "Allow public read access to supplier-logos"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'supplier-logos');
      `
    }
  ];

  for (const policy of policies) {
    try {
      console.log(`   Creating: ${policy.name}...`);

      // Drop if exists first (to avoid duplicate policy errors)
      const policyName = policy.sql.match(/CREATE POLICY "([^"]+)"/)?.[1];
      if (policyName) {
        try {
          await supabase.rpc('exec_sql', {
            sql: `DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`
          });
        } catch {
          // Ignore errors if policy doesn't exist
        }
      }

      // Create the policy
      const { error } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      });

      if (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      } else {
        console.log(`   ✅ Created successfully`);
      }
    } catch (error) {
      console.log(`   ⚠️  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('\n✨ Storage policies setup complete!');
  console.log('\n📝 Summary:');
  console.log('   - Authenticated users can upload, update, and delete logos');
  console.log('   - Public users can read/view logos');
}

setupStoragePolicies()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
