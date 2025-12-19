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

async function cleanupDuplicateBucket(): Promise<void> {
  console.log('🗑️  Removing duplicate supplier_logos bucket (with underscore)...');

  const { error } = await supabase.storage.deleteBucket('supplier_logos');

  if (error) {
    console.error('❌ Error deleting bucket:', error);
    process.exit(1);
  }

  console.log('✅ Duplicate bucket removed successfully');
  console.log('✨ Using supplier-logos (with hyphen) as the correct bucket');
}

cleanupDuplicateBucket()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
