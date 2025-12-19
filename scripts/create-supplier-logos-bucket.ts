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

async function createSupplierLogosBucket(): Promise<void> {
  console.log('🔍 Checking for supplier_logos bucket...');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    process.exit(1);
  }

  console.log('📦 Existing buckets:', buckets.map(b => b.name).join(', '));

  const bucketExists = buckets.some(b => b.name === 'supplier_logos');

  if (bucketExists) {
    console.log('✅ supplier_logos bucket already exists');
    return;
  }

  console.log('📝 Creating supplier_logos bucket...');

  // Create the bucket
  const { data, error: createError } = await supabase.storage.createBucket('supplier_logos', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
  });

  if (createError) {
    console.error('❌ Error creating bucket:', createError);
    process.exit(1);
  }

  console.log('✅ supplier_logos bucket created successfully');
  console.log('📋 Bucket details:', data);
}

createSupplierLogosBucket()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
