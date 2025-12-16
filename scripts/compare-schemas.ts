import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load .env.local file for destination database
config({ path: resolve(process.cwd(), '.env.local') });

interface MigrationConfig {
  sourceUrl: string;
  sourceKey: string;
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

    if (line.startsWith('#') || line === '') return;

    if (line.startsWith('[') && line.endsWith(']')) {
      currentSection = line.slice(1, -1);
      config[currentSection] = {};
      return;
    }

    const match = line.match(/^(.+?)\s*=\s*(.+)$/);
    if (match && currentSection) {
      const [, key, value] = match;
      config[currentSection][key.trim()] = value.trim();
    }
  });

  return {
    sourceUrl: config.source_supabase?.url || '',
    sourceKey: config.source_supabase?.service_role_key || '',
  };
}

/**
 * Get columns from a table
 */
async function getTableColumns(supabase: any, tableName: string): Promise<string[]> {
  // Fetch a single record to get all columns
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found, try to get columns from empty result
      const { data: emptyData } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (emptyData && emptyData.length === 0) {
        console.log(`⚠️  Table ${tableName} is empty, cannot determine schema`);
        return [];
      }
    }
    throw error;
  }

  if (!data) {
    console.log(`⚠️  Table ${tableName} has no data, cannot determine schema`);
    return [];
  }

  return Object.keys(data).sort();
}

/**
 * Compare schemas
 */
async function compareSchemas(): Promise<void> {
  console.log('🔍 Schema Comparison Tool\n');

  // Parse configuration
  const migrationConfig = parseIniFile('./migration-config.ini');

  if (!migrationConfig.sourceUrl || migrationConfig.sourceUrl.includes('your-old-project')) {
    console.error('❌ Please configure the source Supabase URL in migration-config.ini');
    process.exit(1);
  }

  if (!migrationConfig.sourceKey || migrationConfig.sourceKey.includes('your-old-service-role-key')) {
    console.error('❌ Please configure the source service role key in migration-config.ini');
    process.exit(1);
  }

  const destUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const destKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!destUrl || !destKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
    process.exit(1);
  }

  // Create Supabase clients
  const sourceSupabase = createClient(migrationConfig.sourceUrl, migrationConfig.sourceKey, {
    auth: { persistSession: false }
  });

  const destSupabase = createClient(destUrl, destKey, {
    auth: { persistSession: false }
  });

  console.log('📊 Comparing Schemas\n');
  console.log(`Source: ${migrationConfig.sourceUrl}`);
  console.log(`Destination: ${destUrl}\n`);

  // Compare specific_products
  console.log('=' .repeat(80));
  console.log('TABLE: specific_products');
  console.log('='.repeat(80));

  try {
    const sourceColumns = await getTableColumns(sourceSupabase, 'specific_products');
    const destColumns = await getTableColumns(destSupabase, 'specific_products');

    console.log(`\n📋 Source columns (${sourceColumns.length}):`);
    console.log(`   ${sourceColumns.join(', ')}\n`);

    console.log(`📋 Destination columns (${destColumns.length}):`);
    console.log(`   ${destColumns.join(', ')}\n`);

    // Find differences
    const extraInSource = sourceColumns.filter(col => !destColumns.includes(col));
    const extraInDest = destColumns.filter(col => !sourceColumns.includes(col));

    if (extraInSource.length > 0) {
      console.log(`⚠️  Extra columns in SOURCE (${extraInSource.length}):`);
      console.log(`   These will be stored in the metadata field:`);
      extraInSource.forEach(col => console.log(`   - ${col}`));
      console.log('');
    }

    if (extraInDest.length > 0) {
      console.log(`ℹ️  Extra columns in DESTINATION (${extraInDest.length}):`);
      console.log(`   These will be NULL for imported records:`);
      extraInDest.forEach(col => console.log(`   - ${col}`));
      console.log('');
    }

    if (extraInSource.length === 0 && extraInDest.length === 0) {
      console.log('✅ Schemas are identical!\n');
    }
  } catch (error: any) {
    console.error('❌ Error comparing specific_products:', error.message);
  }

  // Compare master_items
  console.log('\n' + '='.repeat(80));
  console.log('TABLE: master_items');
  console.log('='.repeat(80));

  try {
    const sourceColumns = await getTableColumns(sourceSupabase, 'master_items');
    const destColumns = await getTableColumns(destSupabase, 'master_items');

    console.log(`\n📋 Source columns (${sourceColumns.length}):`);
    console.log(`   ${sourceColumns.join(', ')}\n`);

    console.log(`📋 Destination columns (${destColumns.length}):`);
    console.log(`   ${destColumns.join(', ')}\n`);

    // Find differences
    const extraInSource = sourceColumns.filter(col => !destColumns.includes(col));
    const extraInDest = destColumns.filter(col => !sourceColumns.includes(col));

    if (extraInSource.length > 0) {
      console.log(`⚠️  Extra columns in SOURCE (${extraInSource.length}):`);
      console.log(`   These will be DROPPED during import (no metadata field):`);
      extraInSource.forEach(col => console.log(`   - ${col}`));
      console.log('');
    }

    if (extraInDest.length > 0) {
      console.log(`ℹ️  Extra columns in DESTINATION (${extraInDest.length}):`);
      console.log(`   These will be NULL for imported records:`);
      extraInDest.forEach(col => console.log(`   - ${col}`));
      console.log('');
    }

    if (extraInSource.length === 0 && extraInDest.length === 0) {
      console.log('✅ Schemas are identical!\n');
    }
  } catch (error: any) {
    console.error('❌ Error comparing master_items:', error.message);
  }

  console.log('='.repeat(80));
  console.log('\n✅ Schema comparison complete!');
  console.log('\nNext steps:');
  console.log('1. Review the differences above');
  console.log('2. Run migration with dry_run=true to test');
  console.log('3. Set dry_run=false to perform actual import\n');

  process.exit(0);
}

compareSchemas().catch((err) => {
  console.error('\n❌ Schema comparison failed:', err);
  process.exit(1);
});
