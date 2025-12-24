#!/usr/bin/env tsx
/**
 * Quick script to add sort_order column to specific_products table
 * This bypasses the slow db:push schema comparison
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSortOrderColumn(): Promise<void> {
  console.log('🔧 Adding sort_order column to specific_products table...');

  try {
    // Add the column
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE specific_products
        ADD COLUMN IF NOT EXISTS sort_order integer;
      `
    });

    if (columnError) {
      console.error('❌ Failed to add column:', columnError.message);
      process.exit(1);
    }

    console.log('✅ Column added successfully');

    // Add the index
    console.log('🔧 Creating index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_specific_products_sort_order
        ON specific_products USING btree (master_item_id, sort_order);
      `
    });

    if (indexError) {
      console.error('❌ Failed to create index:', indexError.message);
      process.exit(1);
    }

    console.log('✅ Index created successfully');
    console.log('');
    console.log('🎉 Database migration complete! Refresh your browser to test drag-and-drop.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

addSortOrderColumn();
