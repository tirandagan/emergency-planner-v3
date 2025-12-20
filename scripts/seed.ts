import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  slug: string;
  description: string;
}

interface Supplier {
  id: string;
  name: string;
  fulfillmentType: string;
  websiteUrl: string;
}

interface MasterItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  status: string;
  timeframes: string[];
  demographics: string[];
  locations: string[];
  scenarios: string[];
}

const runSeed = async (): Promise<void> => {
  console.log('🌱 Starting database seed...\n');

  // 1. Seed Categories
  console.log('📁 Seeding categories...');
  const categories: Category[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Water',
      parentId: null,
      slug: 'water',
      description: 'Water storage, purification, and hydration supplies',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Food',
      parentId: null,
      slug: 'food',
      description: 'Emergency food supplies, MREs, and long-term storage food',
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Shelter',
      parentId: null,
      slug: 'shelter',
      description: 'Tents, tarps, blankets, and emergency shelter equipment',
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'First Aid',
      parentId: null,
      slug: 'first-aid',
      description: 'Medical supplies, first aid kits, and emergency medications',
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Tools',
      parentId: null,
      slug: 'tools',
      description: 'Multi-tools, axes, saws, and emergency repair equipment',
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Light & Power',
      parentId: null,
      slug: 'light-power',
      description: 'Flashlights, batteries, generators, and solar chargers',
    },
    {
      id: '00000000-0000-0000-0000-000000000007',
      name: 'Communication',
      parentId: null,
      slug: 'communication',
      description: 'Radios, emergency beacons, whistles, and signaling devices',
    },
    {
      id: '00000000-0000-0000-0000-000000000008',
      name: 'Clothing',
      parentId: null,
      slug: 'clothing',
      description: 'Weather-appropriate clothing, boots, and protective gear',
    },
    {
      id: '00000000-0000-0000-0000-000000000009',
      name: 'Hygiene',
      parentId: null,
      slug: 'hygiene',
      description: 'Sanitation supplies, toiletries, and waste management',
    },
    {
      id: '00000000-0000-0000-0000-000000000010',
      name: 'Documents',
      parentId: null,
      slug: 'documents',
      description: 'Important documents, identification, and records storage',
    },
  ];

  const { error: categoriesError } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO categories (id, name, parent_id, slug, description)
      VALUES
        ${categories.map((c) => `('${c.id}', '${c.name}', ${c.parentId ? `'${c.parentId}'` : 'NULL'}, '${c.slug}', '${c.description}')`).join(',\n        ')}
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        parent_id = EXCLUDED.parent_id,
        description = EXCLUDED.description;
    `,
  });

  if (categoriesError) {
    console.error('❌ Error seeding categories:', categoriesError);
    throw categoriesError;
  }
  console.log(`✅ Seeded ${categories.length} categories\n`);

  // 2. Seed Suppliers
  console.log('🏪 Seeding suppliers...');
  const suppliers: Supplier[] = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'Amazon',
      fulfillmentType: 'dropship',
      websiteUrl: 'https://www.amazon.com',
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      name: 'Emergency Essentials',
      fulfillmentType: 'dropship',
      websiteUrl: 'https://www.emergencyessentials.com',
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      name: 'Ready Store',
      fulfillmentType: 'dropship',
      websiteUrl: 'https://www.readystore.com',
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      name: 'Mountain House',
      fulfillmentType: 'dropship',
      websiteUrl: 'https://www.mountainhouse.com',
    },
  ];

  const { error: suppliersError } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO suppliers (id, name, fulfillment_type, website_url)
      VALUES
        ${suppliers.map((s) => `('${s.id}', '${s.name}', '${s.fulfillmentType}', '${s.websiteUrl}')`).join(',\n        ')}
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        fulfillment_type = EXCLUDED.fulfillment_type,
        website_url = EXCLUDED.website_url;
    `,
  });

  if (suppliersError) {
    console.error('❌ Error seeding suppliers:', suppliersError);
    throw suppliersError;
  }
  console.log(`✅ Seeded ${suppliers.length} suppliers\n`);

  // 3. Seed Master Items
  console.log('📦 Seeding master items...');
  const masterItems: MasterItem[] = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      categoryId: '00000000-0000-0000-0000-000000000001',
      name: 'Water Storage Container (5 gallon)',
      description: '5-gallon water storage container for emergency water supply',
      status: 'active',
      timeframes: ['72-hour', '1-week', '1-month'],
      demographics: ['family', 'individual'],
      locations: ['urban', 'suburban', 'rural'],
      scenarios: ['earthquake', 'flood', 'hurricane', 'wildfire', 'power-outage'],
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      categoryId: '00000000-0000-0000-0000-000000000001',
      name: 'Water Purification Tablets',
      description: 'Tablets for purifying contaminated water',
      status: 'active',
      timeframes: ['72-hour', '1-week', '1-month'],
      demographics: ['family', 'individual', 'elderly'],
      locations: ['urban', 'suburban', 'rural', 'wilderness'],
      scenarios: ['earthquake', 'flood', 'hurricane', 'wildfire'],
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      categoryId: '00000000-0000-0000-0000-000000000002',
      name: 'Emergency Food Ration Bars',
      description: '3600 calorie emergency food bars, 5-year shelf life',
      status: 'active',
      timeframes: ['72-hour', '1-week'],
      demographics: ['family', 'individual'],
      locations: ['urban', 'suburban', 'rural'],
      scenarios: ['earthquake', 'flood', 'hurricane', 'wildfire', 'power-outage'],
    },
    {
      id: '20000000-0000-0000-0000-000000000004',
      categoryId: '00000000-0000-0000-0000-000000000002',
      name: 'Freeze-Dried Meals (4-person, 3-day supply)',
      description: 'Freeze-dried meal kit for 4 people, 3-day supply',
      status: 'active',
      timeframes: ['72-hour', '1-week', '1-month'],
      demographics: ['family'],
      locations: ['urban', 'suburban', 'rural'],
      scenarios: ['earthquake', 'flood', 'hurricane', 'wildfire', 'power-outage'],
    },
    {
      id: '20000000-0000-0000-0000-000000000005',
      categoryId: '00000000-0000-0000-0000-000000000004',
      name: 'First Aid Kit (Family Size)',
      description: 'Comprehensive first aid kit with 200+ pieces',
      status: 'active',
      timeframes: ['72-hour', '1-week', '1-month'],
      demographics: ['family', 'individual'],
      locations: ['urban', 'suburban', 'rural'],
      scenarios: ['earthquake', 'flood', 'hurricane', 'wildfire', 'tornado'],
    },
    {
      id: '20000000-0000-0000-0000-000000000006',
      categoryId: '00000000-0000-0000-0000-000000000006',
      name: 'LED Flashlight (High-Powered)',
      description: 'High-powered LED flashlight with multiple brightness settings',
      status: 'active',
      timeframes: ['72-hour', '1-week', '1-month'],
      demographics: ['family', 'individual', 'elderly'],
      locations: ['urban', 'suburban', 'rural'],
      scenarios: ['earthquake', 'power-outage', 'hurricane', 'tornado'],
    },
    {
      id: '20000000-0000-0000-0000-000000000007',
      categoryId: '00000000-0000-0000-0000-000000000006',
      name: 'AA Batteries (24-pack)',
      description: 'Pack of 24 AA batteries for flashlights and radios',
      status: 'active',
      timeframes: ['72-hour', '1-week', '1-month'],
      demographics: ['family', 'individual', 'elderly'],
      locations: ['urban', 'suburban', 'rural'],
      scenarios: ['earthquake', 'power-outage', 'hurricane', 'tornado', 'wildfire'],
    },
    {
      id: '20000000-0000-0000-0000-000000000008',
      categoryId: '00000000-0000-0000-0000-000000000007',
      name: 'Emergency Weather Radio',
      description: 'Hand-crank emergency radio with NOAA weather alerts',
      status: 'active',
      timeframes: ['72-hour', '1-week', '1-month'],
      demographics: ['family', 'individual', 'elderly'],
      locations: ['urban', 'suburban', 'rural'],
      scenarios: ['hurricane', 'tornado', 'wildfire', 'flood', 'blizzard'],
    },
    {
      id: '20000000-0000-0000-0000-000000000009',
      categoryId: '00000000-0000-0000-0000-000000000003',
      name: 'Emergency Tent (4-person)',
      description: '4-person waterproof tent for emergency shelter',
      status: 'active',
      timeframes: ['1-week', '1-month'],
      demographics: ['family'],
      locations: ['suburban', 'rural', 'wilderness'],
      scenarios: ['earthquake', 'wildfire', 'flood'],
    },
    {
      id: '20000000-0000-0000-0000-000000000010',
      categoryId: '00000000-0000-0000-0000-000000000003',
      name: 'Emergency Blanket (Pack of 4)',
      description: 'Mylar emergency blankets for warmth and shelter',
      status: 'active',
      timeframes: ['72-hour', '1-week', '1-month'],
      demographics: ['family', 'individual', 'elderly'],
      locations: ['urban', 'suburban', 'rural', 'wilderness'],
      scenarios: ['earthquake', 'blizzard', 'hurricane', 'tornado', 'wildfire'],
    },
  ];

  const masterItemsSQL = masterItems
    .map(
      (item) => `(
      '${item.id}',
      '${item.categoryId}',
      '${item.name.replace(/'/g, "''")}',
      '${item.description.replace(/'/g, "''")}',
      '${item.status}',
      ARRAY[${item.timeframes.map((t) => `'${t}'`).join(',')}]::text[],
      ARRAY[${item.demographics.map((d) => `'${d}'`).join(',')}]::text[],
      ARRAY[${item.locations.map((l) => `'${l}'`).join(',')}]::text[],
      ARRAY[${item.scenarios.map((s) => `'${s}'`).join(',')}]::text[]
    )`
    )
    .join(',\n      ');

  const { error: masterItemsError } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO master_items (id, category_id, name, description, status, timeframes, demographics, locations, scenarios)
      VALUES
      ${masterItemsSQL}
      ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        timeframes = EXCLUDED.timeframes,
        demographics = EXCLUDED.demographics,
        locations = EXCLUDED.locations,
        scenarios = EXCLUDED.scenarios;
    `,
  });

  if (masterItemsError) {
    console.error('❌ Error seeding master items:', masterItemsError);
    throw masterItemsError;
  }
  console.log(`✅ Seeded ${masterItems.length} master items\n`);

  console.log('✅ Database seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${suppliers.length} suppliers`);
  console.log(`   - ${masterItems.length} master items`);
  console.log('\n🎉 Seed complete!');

  process.exit(0);
};

runSeed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});




























