import { createClient } from '@supabase/supabase-js';
import { db } from '../src/db';
import { suppliers } from '../src/db/schema/suppliers';
import { eq } from 'drizzle-orm';
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

interface Supplier {
  id: string;
  name: string;
  logoUrl: string | null;
}

async function migrateSupplierLogos(): Promise<void> {
  console.log('🔍 Fetching suppliers with logos from old Supabase project...\n');

  // Get all suppliers
  const allSuppliers = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      logoUrl: suppliers.logoUrl,
    })
    .from(suppliers);

  // Filter for logos from the old Supabase project
  const oldProjectLogos = allSuppliers.filter(
    s => s.logoUrl && s.logoUrl.includes('kzrwbjvlgnyfjklrokag.supabase.co')
  );

  console.log(`📋 Found ${oldProjectLogos.length} suppliers with logos from old project\n`);

  if (oldProjectLogos.length === 0) {
    console.log('✅ No logos to migrate');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const supplier of oldProjectLogos) {
    if (!supplier.logoUrl) continue;

    try {
      console.log(`\n🔄 Migrating logo for: ${supplier.name}`);
      console.log(`   Old URL: ${supplier.logoUrl}`);

      // Extract filename from old URL
      const oldUrl = new URL(supplier.logoUrl);
      const filename = oldUrl.pathname.split('/').pop();

      if (!filename) {
        console.log(`   ⚠️  Skipping - couldn't extract filename`);
        failCount++;
        continue;
      }

      // Download the image from old URL
      console.log(`   📥 Downloading...`);
      const response = await fetch(supplier.logoUrl);

      if (!response.ok) {
        console.log(`   ❌ Failed to download (HTTP ${response.status})`);
        failCount++;
        continue;
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`   📤 Uploading to new bucket...`);

      // Upload to new Supabase project
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('supplier-logos')
        .upload(filename, buffer, {
          contentType: blob.type,
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.log(`   ❌ Upload failed: ${uploadError.message}`);
        failCount++;
        continue;
      }

      // Get new public URL
      const { data: urlData } = supabase.storage
        .from('supplier-logos')
        .getPublicUrl(filename);

      const newLogoUrl = urlData.publicUrl;
      console.log(`   New URL: ${newLogoUrl}`);

      // Update database
      console.log(`   💾 Updating database...`);
      await db
        .update(suppliers)
        .set({ logoUrl: newLogoUrl })
        .where(eq(suppliers.id, supplier.id));

      console.log(`   ✅ Successfully migrated!`);
      successCount++;

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✨ Migration complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('='.repeat(60));
}

migrateSupplierLogos()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
