import { createClient } from '@supabase/supabase-js';
import { db } from '../src/db';
import { suppliers } from '../src/db/schema/suppliers';
import { isNotNull } from 'drizzle-orm';
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

async function cleanupUnusedLogos(): Promise<void> {
  console.log('🧹 Cleaning up unused supplier logos...\n');

  // Step 1: Get all logo URLs from database using Drizzle ORM
  console.log('📊 Fetching logo URLs from database...');
  const suppliersWithLogos = await db
    .select({
      name: suppliers.name,
      logoUrl: suppliers.logoUrl,
    })
    .from(suppliers)
    .where(isNotNull(suppliers.logoUrl));

  // Extract filenames from URLs
  const usedFilenames = new Set<string>();
  suppliersWithLogos.forEach(supplier => {
    if (supplier.logoUrl) {
      try {
        const url = new URL(supplier.logoUrl);
        const filename = url.pathname.split('/').pop();
        if (filename) {
          usedFilenames.add(filename);
          console.log(`   ✓ ${supplier.name}: ${filename}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Invalid URL for ${supplier.name}: ${supplier.logoUrl}`);
      }
    }
  });

  console.log(`\n📋 Found ${usedFilenames.size} logo(s) in use\n`);

  // Step 2: List all files in the bucket
  console.log('📂 Listing all files in supplier-logos bucket...');
  const { data: files, error: listError } = await supabase.storage
    .from('supplier-logos')
    .list('', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (listError) {
    console.error('❌ Error listing files:', listError);
    process.exit(1);
  }

  if (!files || files.length === 0) {
    console.log('✅ No files found in bucket');
    return;
  }

  console.log(`   Found ${files.length} file(s) total\n`);

  // Step 3: Identify unused files
  const unusedFiles = files.filter(file => !usedFilenames.has(file.name));

  if (unusedFiles.length === 0) {
    console.log('✅ No unused files found - bucket is clean!');
    return;
  }

  console.log(`🗑️  Found ${unusedFiles.length} unused file(s):\n`);
  unusedFiles.forEach(file => {
    const sizeKB = Math.round((file.metadata?.size || 0) / 1024);
    console.log(`   - ${file.name} (${sizeKB}KB)`);
  });

  // Step 4: Delete unused files
  console.log(`\n🗑️  Deleting ${unusedFiles.length} unused file(s)...`);

  let successCount = 0;
  let failCount = 0;

  for (const file of unusedFiles) {
    const { error: deleteError } = await supabase.storage
      .from('supplier-logos')
      .remove([file.name]);

    if (deleteError) {
      console.log(`   ❌ Failed to delete ${file.name}: ${deleteError.message}`);
      failCount++;
    } else {
      console.log(`   ✓ Deleted ${file.name}`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✨ Cleanup complete!`);
  console.log(`   ✅ Deleted: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📦 Remaining: ${files.length - successCount} file(s)`);
  console.log('='.repeat(60));
}

cleanupUnusedLogos()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
