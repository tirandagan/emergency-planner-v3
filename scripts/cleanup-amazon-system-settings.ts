/**
 * Cleanup Amazon System Settings
 *
 * Removes deprecated Amazon affiliate settings from system_settings table.
 * This script should only be run AFTER verifying that the migration was successful
 * and affiliate links are working with the supplier-level configuration.
 *
 * ⚠️  WARNING: This action is irreversible. Settings will be permanently deleted.
 *
 * Usage:
 *   npx tsx scripts/cleanup-amazon-system-settings.ts
 */

import { db } from '@/db';
import { systemSettings } from '@/db/schema/system-settings';
import { eq, or } from 'drizzle-orm';

async function cleanupAmazonSystemSettings(): Promise<void> {
  console.log('🧹 Amazon System Settings Cleanup Script\n');
  console.log('⚠️  WARNING: This will permanently delete the following settings:');
  console.log('   - amazon_associate_id');
  console.log('   - amazon_affiliate_url_template\n');

  try {
    // Step 1: Check what settings currently exist
    console.log('🔍 Checking current system settings...');
    const existingSettings = await db
      .select({
        key: systemSettings.key,
        value: systemSettings.value,
      })
      .from(systemSettings)
      .where(
        or(
          eq(systemSettings.key, 'amazon_associate_id'),
          eq(systemSettings.key, 'amazon_affiliate_url_template')
        )
      );

    if (existingSettings.length === 0) {
      console.log('ℹ️  No Amazon affiliate settings found in system_settings');
      console.log('✅ Cleanup complete (nothing to clean up)\n');
      return;
    }

    console.log(`\n   Found ${existingSettings.length} settings to delete:\n`);
    existingSettings.forEach(setting => {
      console.log(`   • ${setting.key}: ${setting.value || '(empty)'}`);
    });
    console.log('');

    // Step 2: Confirm deletion
    console.log('⚠️  IMPORTANT: Before proceeding, verify that:');
    console.log('   1. You have run the migration script successfully');
    console.log('   2. Affiliate links are working with supplier-level config');
    console.log('   3. You have tested affiliate link generation for Amazon products\n');

    console.log('🗑️  Deleting Amazon affiliate settings from system_settings...');

    // Step 3: Delete the settings
    const deleteResult = await db
      .delete(systemSettings)
      .where(
        or(
          eq(systemSettings.key, 'amazon_associate_id'),
          eq(systemSettings.key, 'amazon_affiliate_url_template')
        )
      );

    console.log(`   ✅ Deleted ${existingSettings.length} settings\n`);

    // Step 4: Verify deletion
    console.log('🔍 Verifying deletion...');
    const remainingSettings = await db
      .select()
      .from(systemSettings)
      .where(
        or(
          eq(systemSettings.key, 'amazon_associate_id'),
          eq(systemSettings.key, 'amazon_affiliate_url_template')
        )
      );

    if (remainingSettings.length === 0) {
      console.log('   ✅ Verification successful: Settings have been deleted\n');
      console.log('✅ Cleanup completed successfully!\n');
      console.log('📝 Summary:');
      console.log(`   • Deleted ${existingSettings.length} deprecated settings`);
      console.log('   • Amazon affiliate configuration now lives in supplier record');
      console.log('   • System is now fully vendor-agnostic\n');
    } else {
      console.error('❌ Verification failed: Some settings still exist');
      console.error('   Remaining settings:', remainingSettings);
      console.error('\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Cleanup failed with error:');
    console.error(error);
    console.error('\n');
    process.exit(1);
  }
}

// Run cleanup
cleanupAmazonSystemSettings()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
