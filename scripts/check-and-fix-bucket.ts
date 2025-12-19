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

async function checkAndFixBucket(): Promise<void> {
  console.log('🔍 Checking storage buckets...\n');

  // List all buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    process.exit(1);
  }

  console.log('📦 All buckets:');
  buckets.forEach(bucket => {
    console.log(`   - ${bucket.name} (public: ${bucket.public}, id: ${bucket.id})`);
  });

  // Check if supplier-logos exists
  const supplierLogosExists = buckets.some(b => b.name === 'supplier-logos');
  const supplierLogosBucket = buckets.find(b => b.name === 'supplier-logos');

  console.log(`\n🔍 supplier-logos bucket: ${supplierLogosExists ? 'EXISTS' : 'NOT FOUND'}`);

  if (supplierLogosBucket) {
    console.log(`   Public: ${supplierLogosBucket.public}`);
    console.log(`   ID: ${supplierLogosBucket.id}`);

    if (!supplierLogosBucket.public) {
      console.log('\n⚠️  Bucket is NOT public!');
      console.log('📝 Updating bucket to be public...');

      const { data: updateData, error: updateError } = await supabase.storage.updateBucket('supplier-logos', {
        public: true
      });

      if (updateError) {
        console.error('❌ Error updating bucket:', updateError);
      } else {
        console.log('✅ Bucket updated to public!');
      }
    } else {
      console.log('✅ Bucket is already public');
    }
  }

  // List files in the bucket
  console.log('\n📂 Files in supplier-logos bucket:');
  const { data: files, error: filesError } = await supabase.storage
    .from('supplier-logos')
    .list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (filesError) {
    console.error('❌ Error listing files:', filesError);
  } else if (files) {
    console.log(`   Found ${files.length} files:`);
    files.forEach(file => {
      console.log(`   - ${file.name} (${Math.round(file.metadata?.size / 1024)}KB)`);
    });
  }

  // Test public URL generation
  console.log('\n🔗 Testing public URL generation:');
  const { data: urlData } = supabase.storage
    .from('supplier-logos')
    .getPublicUrl('eybylk34p3r.png');

  console.log(`   Generated URL: ${urlData.publicUrl}`);

  // Test if URL is accessible
  console.log('\n🌐 Testing URL accessibility...');
  try {
    const response = await fetch(urlData.publicUrl);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('   ✅ URL is accessible!');
    } else {
      const text = await response.text();
      console.log(`   ❌ Error: ${text}`);
    }
  } catch (error) {
    console.error('   ❌ Fetch error:', error);
  }
}

checkAndFixBucket()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
