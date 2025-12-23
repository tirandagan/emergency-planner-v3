import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function addAmazonSetting(): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    console.log('🔍 Checking Amazon affiliate settings...');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Settings to add
    const settings = [
      {
        key: 'amazon_associate_id',
        value: '',
        value_type: 'string',
        description: 'Amazon Associates affiliate tag used to generate affiliate product links',
        category: 'integrations',
        is_editable: true,
        environment: 'all',
      },
      {
        key: 'amazon_affiliate_url_template',
        value: 'https://www.amazon.com/dp/{ASIN}?&linkCode=ll1&tag={amazon_associate_id}&ref_=as_li_ss_tl',
        value_type: 'string',
        description: 'URL template for Amazon affiliate links. Use {ASIN} and {amazon_associate_id} as placeholders for automatic substitution',
        category: 'integrations',
        is_editable: true,
        environment: 'all',
      },
    ];

    let addedCount = 0;
    let existingCount = 0;

    for (const setting of settings) {
      // Check if setting already exists
      const { data: existing, error: checkError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', setting.key)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        throw checkError;
      }

      if (existing) {
        console.log(`✅ ${setting.key} already exists (value: ${existing.value || '(empty)'})`);
        existingCount++;
        continue;
      }

      console.log(`➕ Adding ${setting.key}...`);

      // Insert the new setting
      const { error: insertError } = await supabase
        .from('system_settings')
        .insert(setting);

      if (insertError) {
        throw insertError;
      }

      addedCount++;
    }

    console.log(`\n✅ Summary: ${addedCount} setting(s) added, ${existingCount} already existed`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding Amazon affiliate setting:', error);
    process.exit(1);
  }
}

addAmazonSetting();
