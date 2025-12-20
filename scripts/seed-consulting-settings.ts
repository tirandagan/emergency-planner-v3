import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

const consultingSettings = [
  {
    key: 'consulting_hourly_rate',
    value: '150',
    value_type: 'number',
    description: 'Hourly rate for consulting services (USD)',
    category: 'consulting',
    is_editable: true,
  },
  {
    key: 'consulting_calendly_url',
    value: 'https://calendly.com/your-org/emergency-prep-consulting',
    value_type: 'string',
    description: 'Calendly booking URL for consulting sessions',
    category: 'consulting',
    is_editable: true,
  },
  {
    key: 'consulting_feature_enabled',
    value: 'true',
    value_type: 'boolean',
    description: 'Enable/disable consulting services feature globally',
    category: 'consulting',
    is_editable: true,
  },
];

const seedConsultingSettings = async (): Promise<void> => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }

    console.log('🌱 Seeding consulting system settings...');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    for (const setting of consultingSettings) {
      // Check if setting already exists
      const { data: existing } = await supabase
        .from('system_settings')
        .select('key')
        .eq('key', setting.key)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping ${setting.key} (already exists)`);
        continue;
      }

      // Insert new setting
      const { error } = await supabase
        .from('system_settings')
        .insert(setting);

      if (error) {
        throw error;
      }

      console.log(`✅ Inserted ${setting.key}: ${setting.value}`);
    }

    console.log('\n✅ Consulting settings seeded successfully');
    console.log('\n📝 Default values:');
    console.log(`   - Hourly Rate: $150/hour`);
    console.log(`   - Calendly URL: https://calendly.com/your-org/emergency-prep-consulting`);
    console.log(`   - Feature Enabled: true`);
    console.log('\n💡 You can update these values in the Admin Panel → System Settings');

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed consulting settings:', error);
    process.exit(1);
  }
};

seedConsultingSettings();
