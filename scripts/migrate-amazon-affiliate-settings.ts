/**
 * Migrate Amazon Affiliate Settings
 *
 * One-time migration script to transfer Amazon affiliate configuration
 * from system_settings table to the Amazon supplier record.
 *
 * Usage:
 *   npx tsx scripts/migrate-amazon-affiliate-settings.ts
 */

import { db } from '@/db';
import { suppliers } from '@/db/schema/suppliers';
import { eq } from 'drizzle-orm';

// Import getSystemSetting function
import { getSystemSetting } from '@/db/queries/system-settings';

async function migrateAmazonAffiliateSettings(): Promise<void> {
  console.log('🔄 Starting Amazon affiliate settings migration...\n');

  try {
    // Step 1: Read Amazon settings from system_settings
    console.log('📖 Reading Amazon affiliate settings from system_settings...');
    const [amazonAssociateId, amazonUrlTemplate] = await Promise.all([
      getSystemSetting<string>('amazon_associate_id'),
      getSystemSetting<string>('amazon_affiliate_url_template'),
    ]);

    if (!amazonAssociateId && !amazonUrlTemplate) {
      console.log('ℹ️  No Amazon affiliate settings found in system_settings');
      console.log('✅ Migration complete (nothing to migrate)\n');
      return;
    }

    console.log(`   Amazon Associate ID: ${amazonAssociateId || '(not set)'}`);
    console.log(`   URL Template: ${amazonUrlTemplate || '(not set)'}\n`);

    // Step 2: Find Amazon supplier
    console.log('🔍 Looking for Amazon supplier record...');
    const [amazonSupplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.name, 'Amazon'))
      .limit(1);

    if (!amazonSupplier) {
      console.error('❌ Error: Amazon supplier not found in database');
      console.error('   Please create an Amazon supplier record first\n');
      process.exit(1);
    }

    console.log(`   Found Amazon supplier: ${amazonSupplier.id}\n`);

    // Step 3: Check if supplier already has affiliate configuration
    if (amazonSupplier.affiliateId || amazonSupplier.affiliateUrlTemplate) {
      console.log('⚠️  Warning: Amazon supplier already has affiliate configuration:');
      console.log(`   Affiliate ID: ${amazonSupplier.affiliateId || '(not set)'}`);
      console.log(`   URL Template: ${amazonSupplier.affiliateUrlTemplate || '(not set)'}`);
      console.log('\n❓ Do you want to overwrite with system_settings values?');
      console.log('   This script will continue and overwrite existing values.\n');
    }

    // Step 4: Update Amazon supplier with affiliate configuration
    console.log('💾 Updating Amazon supplier with affiliate configuration...');
    await db
      .update(suppliers)
      .set({
        affiliateId: amazonAssociateId || null,
        affiliateUrlTemplate: amazonUrlTemplate || null,
      })
      .where(eq(suppliers.id, amazonSupplier.id));

    console.log('   ✅ Successfully updated Amazon supplier\n');

    // Step 5: Verify the migration
    console.log('🔍 Verifying migration...');
    const [updatedSupplier] = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        affiliateId: suppliers.affiliateId,
        affiliateUrlTemplate: suppliers.affiliateUrlTemplate,
      })
      .from(suppliers)
      .where(eq(suppliers.id, amazonSupplier.id))
      .limit(1);

    if (!updatedSupplier) {
      console.error('❌ Verification failed: Could not find updated supplier\n');
      process.exit(1);
    }

    console.log('   Supplier Name:', updatedSupplier.name);
    console.log('   Affiliate ID:', updatedSupplier.affiliateId || '(not set)');
    console.log('   URL Template:', updatedSupplier.affiliateUrlTemplate || '(not set)');

    // Verify values match what we expected
    const affiliateIdMatches = updatedSupplier.affiliateId === amazonAssociateId;
    const templateMatches = updatedSupplier.affiliateUrlTemplate === amazonUrlTemplate;

    if (affiliateIdMatches && templateMatches) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📝 Next steps:');
      console.log('   1. Test affiliate link generation for Amazon products');
      console.log('   2. Verify links work correctly');
      console.log('   3. Run cleanup script to remove old system settings:');
      console.log('      npx tsx scripts/cleanup-amazon-system-settings.ts\n');
    } else {
      console.error('\n❌ Verification failed: Values do not match');
      console.error('   Expected Affiliate ID:', amazonAssociateId);
      console.error('   Got:', updatedSupplier.affiliateId);
      console.error('   Expected Template:', amazonUrlTemplate);
      console.error('   Got:', updatedSupplier.affiliateUrlTemplate);
      console.error('\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Migration failed with error:');
    console.error(error);
    console.error('\n');
    process.exit(1);
  }
}

// Run migration
migrateAmazonAffiliateSettings()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
