import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load .env.local file for destination database
config({ path: resolve(process.cwd(), '.env.local') });

interface MigrationConfig {
  sourceUrl: string;
  sourceKey: string;
  batchSize: number;
  table: 'master_items' | 'specific_products' | 'suppliers' | 'bundles' | 'bundle_items' | 'bundle_recommendations' | 'bundles_all' | 'both' | 'all';
  skipDuplicates: boolean;
  dryRun: boolean;
}

/**
 * Parse the migration-config.ini file
 */
function parseIniFile(filePath: string): MigrationConfig {
  const content = readFileSync(filePath, 'utf-8');
  const config: any = {};

  let currentSection = '';

  content.split('\n').forEach(line => {
    line = line.trim();

    // Skip comments and empty lines
    if (line.startsWith('#') || line === '') return;

    // Section header
    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1);
      config[currentSection] = {};
      return;
    }

    // Key-value pair
    const match = line.match(/^(.+?)\s*=\s*(.+)$/);
    if (match && currentSection) {
      const [, key, value] = match;
      config[currentSection][key.trim()] = value.trim();
    }
  });

  return {
    sourceUrl: config.source_supabase?.url || '',
    sourceKey: config.source_supabase?.service_role_key || '',
    batchSize: parseInt(config.options?.batch_size || '100'),
    table: (config.options?.table || 'specific_products') as any,
    skipDuplicates: config.options?.skip_duplicates !== 'false',
    dryRun: config.options?.dry_run === 'true',
  };
}

/**
 * Valid columns in the new suppliers schema
 */
const VALID_SUPPLIERS_COLUMNS = [
  'id',
  'name',
  'contact_info',
  'fulfillment_type',
  'website_url',
  'logo_url',
  'created_at',
];

/**
 * Transform old supplier record to match new schema
 * Maps old individual fields into contact_info JSONB structure
 */
function transformSupplier(oldSupplier: any): any {
  const newSupplier: any = {};
  const contactInfo: any = {};

  // Map basic fields
  if (oldSupplier.id) newSupplier.id = oldSupplier.id;
  if (oldSupplier.name) newSupplier.name = oldSupplier.name;
  if (oldSupplier.fulfillment_type) newSupplier.fulfillment_type = oldSupplier.fulfillment_type;
  if (oldSupplier.website_url) newSupplier.website_url = oldSupplier.website_url;
  if (oldSupplier.logo_url) newSupplier.logo_url = oldSupplier.logo_url;

  // Use join_date as created_at if available
  if (oldSupplier.join_date) {
    newSupplier.created_at = oldSupplier.join_date;
  } else if (oldSupplier.created_at) {
    newSupplier.created_at = oldSupplier.created_at;
  }

  // Map contact info fields
  if (oldSupplier.email) contactInfo.email = oldSupplier.email;
  if (oldSupplier.phone) contactInfo.phone = oldSupplier.phone;

  // Build address string from components
  const addressParts = [];
  if (oldSupplier.address_line1) addressParts.push(oldSupplier.address_line1);
  if (oldSupplier.address_line2) addressParts.push(oldSupplier.address_line2);

  const cityStateZip = [];
  if (oldSupplier.city) cityStateZip.push(oldSupplier.city);
  if (oldSupplier.state) cityStateZip.push(oldSupplier.state);
  if (oldSupplier.zip_code) cityStateZip.push(oldSupplier.zip_code);
  if (cityStateZip.length > 0) addressParts.push(cityStateZip.join(', '));

  if (oldSupplier.country) addressParts.push(oldSupplier.country);

  if (addressParts.length > 0) {
    contactInfo.address = addressParts.join('\n');
  }

  // Store additional fields in contact_info
  if (oldSupplier.contact_name) contactInfo.contact_name = oldSupplier.contact_name;
  if (oldSupplier.payment_terms) contactInfo.payment_terms = oldSupplier.payment_terms;
  if (oldSupplier.tax_id) contactInfo.tax_id = oldSupplier.tax_id;
  if (oldSupplier.notes) contactInfo.notes = oldSupplier.notes;

  // Add contact_info to supplier if it has any data
  if (Object.keys(contactInfo).length > 0) {
    newSupplier.contact_info = contactInfo;
  }

  return newSupplier;
}

/**
 * Import suppliers from source to destination
 */
async function importSuppliers(
  source: any,
  destination: any,
  config: MigrationConfig
): Promise<{ success: number; failed: number; skipped: number }> {
  console.log('\n📦 Importing suppliers...');

  let offset = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch batch from source
    const { data: suppliers, error: fetchError } = await source
      .from('suppliers')
      .select('*')
      .range(offset, offset + config.batchSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching suppliers:', fetchError);
      throw fetchError;
    }

    if (!suppliers || suppliers.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`\n  Processing batch: ${offset + 1} to ${offset + suppliers.length}`);

    // Process each supplier
    for (const supplier of suppliers) {
      try {
        if (config.dryRun) {
          console.log(`  [DRY RUN] Would import: ${supplier.name} (ID: ${supplier.id})`);
          totalSuccess++;
          continue;
        }

        // Check if supplier already exists
        const { data: existing } = await destination
          .from('suppliers')
          .select('id')
          .eq('id', supplier.id)
          .single();

        if (existing && config.skipDuplicates) {
          console.log(`  ⏭️  Skipping duplicate: ${supplier.name}`);
          totalSkipped++;
          continue;
        }

        // Transform the supplier to match new schema
        const transformedSupplier = transformSupplier(supplier);

        // Insert or update
        const { error: insertError } = await destination
          .from('suppliers')
          .upsert(transformedSupplier, { onConflict: 'id' });

        if (insertError) {
          console.error(`  ❌ Failed to import ${supplier.name}:`, insertError.message);
          totalFailed++;
        } else {
          console.log(`  ✅ Imported: ${supplier.name}`);
          totalSuccess++;
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing ${supplier.name}:`, error.message);
        totalFailed++;
      }
    }

    offset += suppliers.length;

    if (suppliers.length < config.batchSize) {
      hasMore = false;
    }
  }

  return { success: totalSuccess, failed: totalFailed, skipped: totalSkipped };
}

/**
 * Valid columns in the new master_items schema
 */
const VALID_MASTER_ITEMS_COLUMNS = [
  'id',
  'category_id',
  'name',
  'description',
  'embedding',
  'status',
  'timeframes',
  'demographics',
  'locations',
  'scenarios',
  'created_at',
];

/**
 * Transform old master item record to match new schema
 * Note: master_items doesn't have a metadata field, so extra fields are simply dropped
 */
function transformMasterItem(oldItem: any): any {
  const newItem: any = {};
  const droppedFields: string[] = [];

  // Only keep valid columns
  for (const [key, value] of Object.entries(oldItem)) {
    if (VALID_MASTER_ITEMS_COLUMNS.includes(key)) {
      newItem[key] = value;
    } else {
      droppedFields.push(key);
    }
  }

  if (droppedFields.length > 0) {
    console.log(`    ⚠️  Dropped fields: ${droppedFields.join(', ')}`);
  }

  return newItem;
}

/**
 * Import master_items from source to destination
 */
async function importMasterItems(
  source: any,
  destination: any,
  config: MigrationConfig
): Promise<{ success: number; failed: number; skipped: number }> {
  console.log('\n📦 Importing master_items...');

  let offset = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch batch from source
    const { data: items, error: fetchError } = await source
      .from('master_items')
      .select('*')
      .range(offset, offset + config.batchSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching master_items:', fetchError);
      throw fetchError;
    }

    if (!items || items.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`\n  Processing batch: ${offset + 1} to ${offset + items.length}`);

    // Process each item
    for (const item of items) {
      try {
        if (config.dryRun) {
          console.log(`  [DRY RUN] Would import: ${item.name} (ID: ${item.id})`);
          totalSuccess++;
          continue;
        }

        // Check if item already exists
        const { data: existing } = await destination
          .from('master_items')
          .select('id')
          .eq('id', item.id)
          .single();

        if (existing && config.skipDuplicates) {
          console.log(`  ⏭️  Skipping duplicate: ${item.name}`);
          totalSkipped++;
          continue;
        }

        // Transform the item to match new schema
        const transformedItem = transformMasterItem(item);

        // Insert or update
        const { error: insertError } = await destination
          .from('master_items')
          .upsert(transformedItem, { onConflict: 'id' });

        if (insertError) {
          console.error(`  ❌ Failed to import ${item.name}:`, insertError.message);
          totalFailed++;
        } else {
          console.log(`  ✅ Imported: ${item.name}`);
          totalSuccess++;
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing ${item.name}:`, error.message);
        totalFailed++;
      }
    }

    offset += items.length;

    if (items.length < config.batchSize) {
      hasMore = false;
    }
  }

  return { success: totalSuccess, failed: totalFailed, skipped: totalSkipped };
}

/**
 * Valid columns in the new specific_products schema
 */
const VALID_SPECIFIC_PRODUCTS_COLUMNS = [
  'id',
  'master_item_id',
  'supplier_id',
  'name',
  'description',
  'price',
  'sku',
  'asin',
  'image_url',
  'product_url',
  'type',
  'status',
  'metadata',
  'variations',
  'timeframes',
  'demographics',
  'locations',
  'scenarios',
  'created_at',
  'updated_at',
];

/**
 * Transform old product record to match new schema
 * - Filters out invalid columns
 * - Stores extra columns in metadata field
 */
function transformSpecificProduct(oldProduct: any): any {
  const newProduct: any = {};
  const extraFields: any = {};

  // Separate valid columns from extra columns
  for (const [key, value] of Object.entries(oldProduct)) {
    if (VALID_SPECIFIC_PRODUCTS_COLUMNS.includes(key)) {
      newProduct[key] = value;
    } else {
      // Store in extra fields to be added to metadata
      extraFields[key] = value;
    }
  }

  // Merge extra fields into metadata
  if (Object.keys(extraFields).length > 0) {
    const existingMetadata = newProduct.metadata || {};
    newProduct.metadata = {
      ...existingMetadata,
      ...extraFields,
      _imported_extra_fields: true, // Flag to indicate this has extra fields
    };
  }

  return newProduct;
}

/**
 * Import specific_products from source to destination
 */
async function importSpecificProducts(
  source: any,
  destination: any,
  config: MigrationConfig
): Promise<{ success: number; failed: number; skipped: number }> {
  console.log('\n📦 Importing specific_products...');

  let offset = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch batch from source
    const { data: products, error: fetchError } = await source
      .from('specific_products')
      .select('*')
      .range(offset, offset + config.batchSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching specific_products:', fetchError);
      throw fetchError;
    }

    if (!products || products.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`\n  Processing batch: ${offset + 1} to ${offset + products.length}`);

    // Process each product
    for (const product of products) {
      try {
        if (config.dryRun) {
          const transformed = transformSpecificProduct(product);
          const extraFieldsCount = transformed.metadata?._imported_extra_fields
            ? Object.keys(transformed.metadata).length - 1
            : 0;
          console.log(
            `  [DRY RUN] Would import: ${product.name} (ID: ${product.id})` +
            (extraFieldsCount > 0 ? ` [${extraFieldsCount} extra fields → metadata]` : '')
          );
          totalSuccess++;
          continue;
        }

        // Check if product already exists
        const { data: existing } = await destination
          .from('specific_products')
          .select('id')
          .eq('id', product.id)
          .single();

        if (existing && config.skipDuplicates) {
          console.log(`  ⏭️  Skipping duplicate: ${product.name}`);
          totalSkipped++;
          continue;
        }

        // Transform the product to match new schema
        const transformedProduct = transformSpecificProduct(product);

        // Insert or update
        const { error: insertError } = await destination
          .from('specific_products')
          .upsert(transformedProduct, { onConflict: 'id' });

        if (insertError) {
          console.error(`  ❌ Failed to import ${product.name}:`, insertError.message);
          totalFailed++;
        } else {
          console.log(`  ✅ Imported: ${product.name}`);
          totalSuccess++;
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing ${product.name}:`, error.message);
        totalFailed++;
      }
    }

    offset += products.length;

    if (products.length < config.batchSize) {
      hasMore = false;
    }
  }

  return { success: totalSuccess, failed: totalFailed, skipped: totalSkipped };
}

/**
 * Valid columns in the new bundles schema
 */
const VALID_BUNDLES_COLUMNS = [
  'id',
  'name',
  'description',
  'slug',
  'image_url',
  'total_estimated_price',
  'scenarios',
  'min_people',
  'max_people',
  'gender',
  'age_groups',
  'climates',
  'created_at',
  'updated_at',
];

/**
 * Transform old bundle record to match new schema
 */
function transformBundle(oldBundle: any): any {
  const newBundle: any = {};
  const droppedFields: string[] = [];

  // Only keep valid columns
  for (const [key, value] of Object.entries(oldBundle)) {
    if (VALID_BUNDLES_COLUMNS.includes(key)) {
      newBundle[key] = value;
    } else {
      droppedFields.push(key);
    }
  }

  if (droppedFields.length > 0) {
    console.log(`    ⚠️  Dropped fields: ${droppedFields.join(', ')}`);
  }

  return newBundle;
}

/**
 * Import bundles from source to destination
 */
async function importBundles(
  source: any,
  destination: any,
  config: MigrationConfig
): Promise<{ success: number; failed: number; skipped: number }> {
  console.log('\n📦 Importing bundles...');

  let offset = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch batch from source
    const { data: bundles, error: fetchError } = await source
      .from('bundles')
      .select('*')
      .range(offset, offset + config.batchSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching bundles:', fetchError);
      throw fetchError;
    }

    if (!bundles || bundles.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`\n  Processing batch: ${offset + 1} to ${offset + bundles.length}`);

    // Process each bundle
    for (const bundle of bundles) {
      try {
        if (config.dryRun) {
          console.log(`  [DRY RUN] Would import: ${bundle.name} (ID: ${bundle.id})`);
          totalSuccess++;
          continue;
        }

        // Check if bundle already exists
        const { data: existing } = await destination
          .from('bundles')
          .select('id')
          .eq('id', bundle.id)
          .single();

        if (existing && config.skipDuplicates) {
          console.log(`  ⏭️  Skipping duplicate: ${bundle.name}`);
          totalSkipped++;
          continue;
        }

        // Transform the bundle to match new schema
        const transformedBundle = transformBundle(bundle);

        // Insert or update
        const { error: insertError } = await destination
          .from('bundles')
          .upsert(transformedBundle, { onConflict: 'id' });

        if (insertError) {
          console.error(`  ❌ Failed to import ${bundle.name}:`, insertError.message);
          totalFailed++;
        } else {
          console.log(`  ✅ Imported: ${bundle.name}`);
          totalSuccess++;
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing ${bundle.name}:`, error.message);
        totalFailed++;
      }
    }

    offset += bundles.length;

    if (bundles.length < config.batchSize) {
      hasMore = false;
    }
  }

  return { success: totalSuccess, failed: totalFailed, skipped: totalSkipped };
}

/**
 * Valid columns in the new bundle_items schema
 */
const VALID_BUNDLE_ITEMS_COLUMNS = [
  'id',
  'bundle_id',
  'specific_product_id',
  'quantity',
  'is_optional',
];

/**
 * Transform old bundle item record to match new schema
 */
function transformBundleItem(oldItem: any, config: MigrationConfig): any {
  const newItem: any = {};
  const droppedFields: string[] = [];

  // Only keep valid columns
  for (const [key, value] of Object.entries(oldItem)) {
    if (VALID_BUNDLE_ITEMS_COLUMNS.includes(key)) {
      newItem[key] = value;
    } else {
      droppedFields.push(key);
    }
  }

  if (droppedFields.length > 0 && !config.dryRun) {
    console.log(`    ⚠️  Dropped fields: ${droppedFields.join(', ')}`);
  }

  return newItem;
}

/**
 * Import bundle_items from source to destination
 */
async function importBundleItems(
  source: any,
  destination: any,
  config: MigrationConfig
): Promise<{ success: number; failed: number; skipped: number }> {
  console.log('\n📦 Importing bundle_items...');

  let offset = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch batch from source
    const { data: items, error: fetchError } = await source
      .from('bundle_items')
      .select('*')
      .range(offset, offset + config.batchSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching bundle_items:', fetchError);
      throw fetchError;
    }

    if (!items || items.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`\n  Processing batch: ${offset + 1} to ${offset + items.length}`);

    // Process each item
    for (const item of items) {
      try {
        if (config.dryRun) {
          console.log(`  [DRY RUN] Would import: Bundle Item (ID: ${item.id})`);
          totalSuccess++;
          continue;
        }

        // Check if item already exists
        const { data: existing } = await destination
          .from('bundle_items')
          .select('id')
          .eq('id', item.id)
          .single();

        if (existing && config.skipDuplicates) {
          console.log(`  ⏭️  Skipping duplicate: Bundle Item (ID: ${item.id})`);
          totalSkipped++;
          continue;
        }

        // Transform the item to match new schema
        const transformedItem = transformBundleItem(item, config);

        // Insert or update
        const { error: insertError } = await destination
          .from('bundle_items')
          .upsert(transformedItem, { onConflict: 'id' });

        if (insertError) {
          console.error(`  ❌ Failed to import Bundle Item ${item.id}:`, insertError.message);
          totalFailed++;
        } else {
          console.log(`  ✅ Imported: Bundle Item (ID: ${item.id})`);
          totalSuccess++;
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing Bundle Item ${item.id}:`, error.message);
        totalFailed++;
      }
    }

    offset += items.length;

    if (items.length < config.batchSize) {
      hasMore = false;
    }
  }

  return { success: totalSuccess, failed: totalFailed, skipped: totalSkipped };
}

/**
 * Valid columns in the new bundle_recommendations schema
 */
const VALID_BUNDLE_RECOMMENDATIONS_COLUMNS = [
  'id',
  'bundle_id',
  'specific_product_id',
  'reason',
];

/**
 * Transform old bundle recommendation record to match new schema
 */
function transformBundleRecommendation(oldRec: any, config: MigrationConfig): any {
  const newRec: any = {};
  const droppedFields: string[] = [];

  // Only keep valid columns
  for (const [key, value] of Object.entries(oldRec)) {
    if (VALID_BUNDLE_RECOMMENDATIONS_COLUMNS.includes(key)) {
      newRec[key] = value;
    } else {
      droppedFields.push(key);
    }
  }

  if (droppedFields.length > 0 && !config.dryRun) {
    console.log(`    ⚠️  Dropped fields: ${droppedFields.join(', ')}`);
  }

  return newRec;
}

/**
 * Import bundle_recommendations from source to destination
 */
async function importBundleRecommendations(
  source: any,
  destination: any,
  config: MigrationConfig
): Promise<{ success: number; failed: number; skipped: number }> {
  console.log('\n📦 Importing bundle_recommendations...');

  let offset = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch batch from source
    const { data: recommendations, error: fetchError } = await source
      .from('bundle_recommendations')
      .select('*')
      .range(offset, offset + config.batchSize - 1);

    if (fetchError) {
      console.error('❌ Error fetching bundle_recommendations:', fetchError);
      throw fetchError;
    }

    if (!recommendations || recommendations.length === 0) {
      hasMore = false;
      break;
    }

    console.log(`\n  Processing batch: ${offset + 1} to ${offset + recommendations.length}`);

    // Process each recommendation
    for (const rec of recommendations) {
      try {
        if (config.dryRun) {
          console.log(`  [DRY RUN] Would import: Bundle Recommendation (ID: ${rec.id})`);
          totalSuccess++;
          continue;
        }

        // Check if recommendation already exists
        const { data: existing } = await destination
          .from('bundle_recommendations')
          .select('id')
          .eq('id', rec.id)
          .single();

        if (existing && config.skipDuplicates) {
          console.log(`  ⏭️  Skipping duplicate: Bundle Recommendation (ID: ${rec.id})`);
          totalSkipped++;
          continue;
        }

        // Transform the recommendation to match new schema
        const transformedRec = transformBundleRecommendation(rec, config);

        // Insert or update
        const { error: insertError } = await destination
          .from('bundle_recommendations')
          .upsert(transformedRec, { onConflict: 'id' });

        if (insertError) {
          console.error(`  ❌ Failed to import Bundle Recommendation ${rec.id}:`, insertError.message);
          totalFailed++;
        } else {
          console.log(`  ✅ Imported: Bundle Recommendation (ID: ${rec.id})`);
          totalSuccess++;
        }
      } catch (error: any) {
        console.error(`  ❌ Error processing Bundle Recommendation ${rec.id}:`, error.message);
        totalFailed++;
      }
    }

    offset += recommendations.length;

    if (recommendations.length < config.batchSize) {
      hasMore = false;
    }
  }

  return { success: totalSuccess, failed: totalFailed, skipped: totalSkipped };
}

/**
 * Main migration function
 */
async function runMigration(): Promise<void> {
  console.log('🚀 Starting product migration...\n');

  // Parse configuration
  const migrationConfig = parseIniFile('./migration-config.ini');

  // Validate configuration
  if (!migrationConfig.sourceUrl || migrationConfig.sourceUrl.includes('your-old-project')) {
    console.error('❌ Please configure the source Supabase URL in migration-config.ini');
    process.exit(1);
  }

  if (!migrationConfig.sourceKey || migrationConfig.sourceKey.includes('your-old-service-role-key')) {
    console.error('❌ Please configure the source service role key in migration-config.ini');
    process.exit(1);
  }

  // Get destination credentials
  const destUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const destKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!destUrl || !destKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`  Source: ${migrationConfig.sourceUrl}`);
  console.log(`  Destination: ${destUrl}`);
  console.log(`  Table: ${migrationConfig.table}`);
  console.log(`  Batch size: ${migrationConfig.batchSize}`);
  console.log(`  Skip duplicates: ${migrationConfig.skipDuplicates}`);
  console.log(`  Dry run: ${migrationConfig.dryRun ? 'YES (no data will be imported)' : 'NO'}\n`);

  // Create Supabase clients
  const sourceSupabase = createClient(migrationConfig.sourceUrl, migrationConfig.sourceKey, {
    auth: { persistSession: false }
  });

  const destSupabase = createClient(destUrl, destKey, {
    auth: { persistSession: false }
  });

  // Test connections
  console.log('🔍 Testing connections...');
  const { error: sourceError } = await sourceSupabase.from('specific_products').select('count').limit(1);
  if (sourceError) {
    console.error('❌ Cannot connect to source database:', sourceError);
    process.exit(1);
  }

  const { error: destError } = await destSupabase.from('specific_products').select('count').limit(1);
  if (destError) {
    console.error('❌ Cannot connect to destination database:', destError);
    process.exit(1);
  }

  console.log('✅ Connections successful\n');

  // Run migrations based on configuration
  const results = {
    suppliers: { success: 0, failed: 0, skipped: 0 },
    master_items: { success: 0, failed: 0, skipped: 0 },
    specific_products: { success: 0, failed: 0, skipped: 0 },
    bundles: { success: 0, failed: 0, skipped: 0 },
    bundle_items: { success: 0, failed: 0, skipped: 0 },
    bundle_recommendations: { success: 0, failed: 0, skipped: 0 },
  };

  // Import order matters for foreign key constraints:
  // 1. suppliers (no dependencies)
  // 2. master_items (depends on categories)
  // 3. specific_products (depends on suppliers and master_items)
  // 4. bundles (no dependencies on migrated tables)
  // 5. bundle_items (depends on bundles and specific_products)
  // 6. bundle_recommendations (depends on bundles and specific_products)

  if (migrationConfig.table === 'suppliers' || migrationConfig.table === 'all') {
    results.suppliers = await importSuppliers(sourceSupabase, destSupabase, migrationConfig);
  }

  if (migrationConfig.table === 'master_items' || migrationConfig.table === 'both' || migrationConfig.table === 'all') {
    results.master_items = await importMasterItems(sourceSupabase, destSupabase, migrationConfig);
  }

  if (migrationConfig.table === 'specific_products' || migrationConfig.table === 'both' || migrationConfig.table === 'all') {
    results.specific_products = await importSpecificProducts(sourceSupabase, destSupabase, migrationConfig);
  }

  if (migrationConfig.table === 'bundles' || migrationConfig.table === 'bundles_all' || migrationConfig.table === 'all') {
    results.bundles = await importBundles(sourceSupabase, destSupabase, migrationConfig);
  }

  if (migrationConfig.table === 'bundle_items' || migrationConfig.table === 'bundles_all' || migrationConfig.table === 'all') {
    results.bundle_items = await importBundleItems(sourceSupabase, destSupabase, migrationConfig);
  }

  if (migrationConfig.table === 'bundle_recommendations' || migrationConfig.table === 'bundles_all' || migrationConfig.table === 'all') {
    results.bundle_recommendations = await importBundleRecommendations(sourceSupabase, destSupabase, migrationConfig);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));

  if (migrationConfig.table === 'suppliers' || migrationConfig.table === 'all') {
    console.log('\nSuppliers:');
    console.log(`  ✅ Successful: ${results.suppliers.success}`);
    console.log(`  ❌ Failed: ${results.suppliers.failed}`);
    console.log(`  ⏭️  Skipped: ${results.suppliers.skipped}`);
  }

  if (migrationConfig.table === 'master_items' || migrationConfig.table === 'both' || migrationConfig.table === 'all') {
    console.log('\nMaster Items:');
    console.log(`  ✅ Successful: ${results.master_items.success}`);
    console.log(`  ❌ Failed: ${results.master_items.failed}`);
    console.log(`  ⏭️  Skipped: ${results.master_items.skipped}`);
  }

  if (migrationConfig.table === 'specific_products' || migrationConfig.table === 'both' || migrationConfig.table === 'all') {
    console.log('\nSpecific Products:');
    console.log(`  ✅ Successful: ${results.specific_products.success}`);
    console.log(`  ❌ Failed: ${results.specific_products.failed}`);
    console.log(`  ⏭️  Skipped: ${results.specific_products.skipped}`);
  }

  if (migrationConfig.table === 'bundles' || migrationConfig.table === 'bundles_all' || migrationConfig.table === 'all') {
    console.log('\nBundles:');
    console.log(`  ✅ Successful: ${results.bundles.success}`);
    console.log(`  ❌ Failed: ${results.bundles.failed}`);
    console.log(`  ⏭️  Skipped: ${results.bundles.skipped}`);
  }

  if (migrationConfig.table === 'bundle_items' || migrationConfig.table === 'bundles_all' || migrationConfig.table === 'all') {
    console.log('\nBundle Items:');
    console.log(`  ✅ Successful: ${results.bundle_items.success}`);
    console.log(`  ❌ Failed: ${results.bundle_items.failed}`);
    console.log(`  ⏭️  Skipped: ${results.bundle_items.skipped}`);
  }

  if (migrationConfig.table === 'bundle_recommendations' || migrationConfig.table === 'bundles_all' || migrationConfig.table === 'all') {
    console.log('\nBundle Recommendations:');
    console.log(`  ✅ Successful: ${results.bundle_recommendations.success}`);
    console.log(`  ❌ Failed: ${results.bundle_recommendations.failed}`);
    console.log(`  ⏭️  Skipped: ${results.bundle_recommendations.skipped}`);
  }

  console.log('\n' + '='.repeat(60));

  const totalFailed = results.suppliers.failed + results.master_items.failed + results.specific_products.failed + results.bundles.failed + results.bundle_items.failed + results.bundle_recommendations.failed;

  if (totalFailed > 0) {
    console.log('\n⚠️  Migration completed with errors. Please review the errors above.');
    process.exit(1);
  }

  if (migrationConfig.dryRun) {
    console.log('\n✅ Dry run completed successfully! Set dry_run=false to perform actual import.');
  } else {
    console.log('\n✅ Migration completed successfully!');
  }

  process.exit(0);
}

// Run the migration
runMigration().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
