/**
 * Debug script to check supplier data
 */

import { db } from '@/db';
import { suppliers } from '@/db/schema/suppliers';
import { eq } from 'drizzle-orm';

async function debugSupplierData(): Promise<void> {
  console.log('🔍 Fetching Amazon supplier data...\n');

  try {
    const [amazonSupplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.name, 'Amazon'))
      .limit(1);

    if (!amazonSupplier) {
      console.error('❌ Amazon supplier not found in database\n');
      return;
    }

    console.log('✅ Found Amazon supplier:');
    console.log('   ID:', amazonSupplier.id);
    console.log('   Name:', amazonSupplier.name);
    console.log('   Affiliate ID:', amazonSupplier.affiliateId || '(not set)');
    console.log('   Affiliate URL Template:', amazonSupplier.affiliateUrlTemplate || '(not set)');
    console.log('\n📦 Full object keys:', Object.keys(amazonSupplier));
    console.log('\n📦 Full object:', JSON.stringify(amazonSupplier, null, 2));
  } catch (error) {
    console.error('❌ Error fetching supplier:', error);
  }
}

// Run debug
debugSupplierData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
