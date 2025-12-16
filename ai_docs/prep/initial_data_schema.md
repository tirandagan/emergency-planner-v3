# Strategic Database Planning Document

## App Summary
**End Goal:** Build complete disaster readiness plans (from 72-hour survival to multi-year sustainability) within minutes using AI that generates location-specific survival strategies with calculated supply quantities, barter-economy trade goods, critical skill gaps, and budget-optimized product recommendations.

**Template Used:** RAG-SaaS (AI generation with semantic search/matching)

**Core Features:**
- Multi-scenario AI survival plan generation
- Curated bundle marketplace with customization
- Inventory tracking (owned vs needed)
- Freemium subscription tiers (Free/Basic/Pro)
- Skills training resource library
- Expert call scheduling and networking
- Amazon affiliate → Dropship commerce transition

---

## 🗄️ Current Database State

### Existing Tables (16 Tables - Excellent Foundation)

Your database is **95% ready for Phase 1 launch**. The existing schema demonstrates sophisticated architecture with proper normalization, flexible metadata, and AI-powered matching capabilities.

#### **Core Product Catalog** (6 tables - COMPLETE)

##### `categories` ✅
Hierarchical tree structure for product organization.
- `id` (UUID, PK)
- `name` (Text) - Category name
- `parent_id` (UUID, FK → categories.id) - Self-referencing for tree
- `slug` (Text) - URL-friendly identifier
- `description` (Text)
- `created_at` (Timestamptz)
- **Indexes:** `parent_id` (B-Tree for traversal)
- **Purpose:** Supports multi-level categorization (Water → Water Filters → Portable Filters)

##### `master_items` ✅
Generic product concepts (the "Platonic ideal" of products).
- `id` (UUID, PK)
- `category_id` (UUID, FK → categories.id)
- `name` (Text) - Generic name (e.g., "Portable Water Filter")
- `description` (Text)
- `embedding` (Vector 768) - For AI semantic matching
- `status` (Text) - 'active' | 'pending_review'
- `timeframes` (Text[]) - Duration tags
- `demographics` (Text[]) - User type tags
- `locations` (Text[]) - Climate/geography tags
- `scenarios` (Text[]) - Disaster scenario tags
- `created_at` (Timestamptz)
- **Indexes:** `category_id` (B-Tree), `embedding` (IVFFlat for similarity search)
- **Purpose:** AI-powered product matching, deduplication, admin curation

##### `specific_products` ✅
Buyable SKUs (the actual products users can purchase).
- `id` (UUID, PK)
- `master_item_id` (UUID, FK → master_items.id)
- `supplier_id` (UUID, FK → suppliers.id)
- `name` (Text) - Full product name with variants
- `description` (Text)
- `price` (Numeric) - Current selling price
- `sku` (Text) - Internal or vendor SKU
- `asin` (Text) - Amazon Standard ID (unique constraint)
- `image_url` (Text)
- `product_url` (Text) - Affiliate link or product page
- `type` (Text) - 'AFFILIATE' | 'DROP_SHIP'
- `status` (Text) - 'verified' | 'pending'
- `metadata` (JSONB) - Flexible attributes (weight, dimensions, brand, color, size, quantity, volume, rating, reviews, etc.)
- `timeframes` (Text[]) - Inheritable from master or overridden
- `demographics` (Text[])
- `locations` (Text[])
- `scenarios` (Text[])
- `variations` (JSONB) - Product variations (size, color options)
- `created_at` (Timestamptz)
- **Indexes:** `master_item_id` (B-Tree), `supplier_id` (B-Tree), `asin` (Unique), `metadata` (GIN for attribute filtering)
- **Purpose:** The actual products users see, buy, and add to plans

##### `suppliers` ✅
Vendor management.
- `id` (UUID, PK)
- `name` (Text) - Supplier name (e.g., "Amazon", "Mountain House")
- `contact_info` (JSONB) - Email, phone, portal URL
- `fulfillment_type` (Text) - 'AFFILIATE' | 'DROP_SHIP'
- `website_url` (Text)
- `created_at` (Timestamptz)
- **Purpose:** Track vendors for Phase 2 dropship transition

##### `product_offers` ✅ (Legacy/Optional)
Multi-offer support per product (if multiple sellers).
- Purpose: Historical data or future multi-seller marketplace
- **Status:** Evaluate if needed; may merge into `specific_products`

##### `scraped_queue` ✅
Amazon product scraping queue.
- `id` (UUID, PK)
- Queue management for batch Amazon data fetching
- **Purpose:** Admin tool for bulk product imports via Decodo API

##### `unmatched_items` ❌ REMOVED
- **Status:** Feature removed - automatic master item appending discontinued
- **Note:** Master item embeddings retained for search/discovery features
- **Action:** Can drop table if no longer needed

---

#### **Bundle System** (3 tables - COMPLETE)

##### `bundles` ✅
Curated product collections (e.g., "72-Hour Family Bug-Out Kit").
- `id` (UUID, PK)
- `name` (Text)
- `description` (Text)
- `slug` (Text, Unique) - URL routing
- `image_url` (Text)
- `total_estimated_price` (Numeric)
- `scenarios` (Text[]) - Disaster scenario tags ['NATURAL_DISASTER', 'EMP']
- `min_people` (Integer) - Minimum family size
- `max_people` (Integer) - Maximum family size
- `gender` (Text[]) - Gender-specific considerations
- `age_groups` (Text[]) - Age group tags
- `climates` (Text[]) - Climate suitability
- `created_at` (Timestamptz)
- **Indexes:** `scenarios` (GIN), `slug` (Unique)
- **Purpose:** Admin-curated bundles with AI matching tags for recommendations
- **AI Matching:** Filter bundles by scenario, family size, climate, demographics

##### `bundle_items` ✅
Links bundles to specific products.
- `id` (UUID, PK)
- `bundle_id` (UUID, FK → bundles.id)
- `specific_product_id` (UUID, FK → specific_products.id)
- `quantity` (Integer) - Default quantity
- `is_optional` (Boolean) - Can user remove this item?
- **Purpose:** Define bundle contents with customization rules

##### `bundle_recommendations` ⚠️ (DEFER - Phase 2/3)
Suggested add-ons for bundles.
- `id` (UUID, PK)
- `bundle_id` (UUID, FK → bundles.id)
- `specific_product_id` (UUID, FK → specific_products.id)
- `reason` (Text) - Why recommended
- **Status:** Table exists but unpopulated
- **Future Use:** "Customers who bought this also added..." upselling
- **Phase 3:** AI-powered recommendations based on user behavior

---

#### **Mission Reports** (1 table - COMPLETE)

##### `mission_reports` ✅
AI-generated survival plans (the core app output).
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `title` (Text) - User-editable plan name
- `location` (Text) - City, state, coordinates
- `scenarios` (Text[]) - Selected disaster scenarios
- `family_size` (Integer)
- `duration_days` (Integer)
- `mobility_type` (Text) - 'BUG_OUT' | 'SHELTER_IN_PLACE'
- `budget_amount` (Numeric)
- `report_data` (JSONB) - Complete GeneratedKit object:
  ```typescript
  {
    scenarios: string[],
    summary: string,
    readinessScore: number,
    simulationLog: string,
    rationPlan: string,
    supplies: SupplyItem[],  // AI-generated needs
    items: KitItem[],        // Matched to specific_products
    requiredSkills: string[],
    evacuationRoutes: Route[],
    skillResources: SkillResource[]
  }
  ```
- `created_at` (Timestamptz)
- `updated_at` (Timestamptz)
- **Purpose:** Store complete survival plans with AI recommendations
- **Tier Enforcement:** Free tier = 1 saved report (overwrite), Basic+ = unlimited

##### `saved_scenarios` ❌ DEPRECATED
- **Status:** Legacy table from prototype
- **Migration:** Mark as deprecated, use `mission_reports` going forward
- **Action:** Add `deprecated` boolean, prevent new inserts
- **Optional:** One-time migration script if needed

---

#### **Commerce & Fulfillment** (5 tables - Phase 2 Ready)

##### `orders` ✅
Drop-ship order records.
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `stripe_session_id` (Text)
- `stripe_payment_intent_id` (Text)
- `subtotal_amount` (Numeric)
- `shipping_cost` (Numeric)
- `tax_amount` (Numeric)
- `total_amount` (Numeric)
- `currency` (Text) DEFAULT 'USD'
- `status` (Text) - 'PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'
- `shipping_address` (JSONB)
- `created_at` (Timestamptz)
- **Purpose:** Phase 2 dropship transactions (currently Phase 1 uses affiliate links)

##### `order_items` ⚠️ NEEDS ENHANCEMENT
Line items for orders with bundle tracking and substitution detection.
- `id` (UUID, PK)
- `order_id` (UUID, FK → orders.id)
- `specific_product_id` (UUID, FK → specific_products.id)
- `quantity` (Integer)
- `unit_price` (Numeric) - Price at purchase time
- `supplier_status` (Text) - 'PENDING_ORDER', 'ORDERED', 'SHIPPED'
- **NEW:** `bundle_id` (UUID, FK → bundles.id) - Source bundle recommendation
- **NEW:** `is_original_product` (Boolean) - True if default, false if substituted
- **NEW:** `original_specific_product_id` (UUID, FK → specific_products.id) - If substituted, what was original?
- **Purpose:** Track bundle performance and substitution patterns for analytics

##### `shipments` ✅
Package tracking.
- `id` (UUID, PK)
- `order_id` (UUID, FK → orders.id)
- `carrier` (Text) - 'UPS', 'FedEx', 'USPS'
- `tracking_number` (Text)
- `tracking_url` (Text)
- `shipped_at` (Timestamptz)
- `estimated_delivery` (Timestamptz)
- `notes` (Text)
- `created_at` (Timestamptz)

##### `shipment_items` ✅
Partial shipment support (links shipments to order items).
- `id` (UUID, PK)
- `shipment_id` (UUID, FK → shipments.id)
- `order_item_id` (UUID, FK → order_items.id)
- `quantity` (Integer)

##### `external_transactions` ⚠️ NEEDS ENHANCEMENT
Affiliate click tracking with bundle context (analytics).
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `specific_product_id` (UUID, FK → specific_products.id)
- `clicked_at` (Timestamptz)
- `source` (Text) - 'BUNDLE_CHECKOUT', 'PRODUCT_PAGE'
- **NEW:** `bundle_id` (UUID, FK → bundles.id) - Which bundle recommended this product
- **NEW:** `is_original_product` (Boolean) - Was this the default recommendation or substitution?
- **Purpose:** Track bundle conversion rates and customization impact on affiliate revenue

---

### Template Assessment

**✅ 95% Perfect:** Your existing schema is production-ready for Phase 1 with minimal additions.

**Strengths:**
- ✅ 3-tier product hierarchy (categories → master_items → specific_products) enables AI matching
- ✅ Vector embeddings on master_items for semantic product search and discovery
- ✅ Flexible JSONB metadata for diverse product attributes
- ✅ Comprehensive tagging (scenarios, demographics, timeframes, locations)
- ✅ Bundle system with AI matching tags already implemented
- ✅ Mission reports store complete AI-generated plans
- ✅ Commerce tables ready for Phase 2 dropship transition
- ✅ Admin workflows (scraped_queue) for product curation

**Gaps (Minor):**
- ❌ No subscription tier tracking in `profiles`
- ❌ No inventory tracking for users
- ❌ No skills resource caching
- ❌ No expert call scheduling
- ❌ No user activity logging
- ❌ No billing transaction history
- ⚠️ Commerce tables need bundle tracking and substitution detection

---

## ⚡ Feature-to-Schema Mapping

### Phase 1 Core Features → Database Tables

| Feature | Tables Used | Status | Notes |
|---------|-------------|--------|-------|
| **AI Plan Generation** | `mission_reports` | ✅ READY | Full GeneratedKit storage in JSONB |
| **Multi-Scenario Selection** | `mission_reports.scenarios[]` | ✅ READY | Array field supports multiple |
| **Personnel Configuration** | `mission_reports.report_data` | ✅ READY | Stored in JSONB |
| **Bundle Recommendations** | `bundles`, `bundle_items`, `specific_products` | ✅ READY | AI matching via tags |
| **Bundle Customization** | `bundle_items.is_optional` | ✅ READY | Swap/remove logic |
| **Purchase Tracking** | `inventory_items` | ❌ NEED TABLE | Track owned vs needed |
| **Inventory Management** | `inventory_items` | ❌ NEED TABLE | Basic+ tier feature |
| **Readiness Score** | Calculated from `mission_reports` + `inventory_items` | ⚠️ PARTIAL | Need inventory data |
| **Evacuation Routes** | `mission_reports.report_data.evacuationRoutes` | ✅ READY | Stored in JSONB |
| **Simulation Logs** | `mission_reports.report_data.simulationLog` | ✅ READY | Day-by-day narrative |
| **Skills Training** | `skills_resources` | ❌ NEED TABLE | Cache YouTube/articles |
| **Product Catalog** | `categories`, `master_items`, `specific_products` | ✅ READY | Full hierarchy |
| **Admin Product Mgmt** | All catalog tables + `scraped_queue` | ✅ READY | Already implemented |
| **User Tiers (Free/Basic/Pro)** | `profiles` (add fields) | ❌ NEED COLUMNS | Add subscription tracking |
| **Stripe Integration** | `profiles.stripe_customer_id` | ❌ NEED COLUMN | Link to Stripe |
| **Expert Calls** | `expert_calls`, `call_attendance` | ❌ NEED TABLES | Schedule & track |
| **User Activity Tracking** | `user_activity_log` | ❌ NEED TABLE | Admin analytics |
| **Billing History** | `billing_transactions` | ❌ NEED TABLE | User & admin visibility |

### Phase 2 Growth Features → Database Tables

| Feature | Tables Used | Status |
|---------|-------------|--------|
| **Dropship Commerce** | `orders`, `order_items`, `shipments` | ✅ READY |
| **Vendor Portal** | `suppliers`, `orders` | ✅ READY |
| **Multi-Location Planning** | Add `location_id` to `mission_reports` | ⚠️ ENHANCEMENT |
| **Offline PWA** | No schema changes | ✅ READY |
| **Bundle Expiration Tracking** | Add `expiration_date` to `inventory_items` | ⚠️ ENHANCEMENT |
| **Influencer Marketplace** | New tables (deferred) | ❌ FUTURE |

### Phase 3 Advanced Features → Database Tables

| Feature | Tables Used | Status |
|---------|-------------|--------|
| **Service Provider Marketplace** | New tables (deferred) | ❌ FUTURE |
| **Real-Time Threat Intelligence** | New tables (deferred) | ❌ FUTURE |
| **AI Scenario Simulation** | Enhance `mission_reports` | ⚠️ FUTURE |
| **Communication Planning (HAM)** | New tables (deferred) | ❌ FUTURE |

---

## 📋 Recommended Changes

**Bottom Line:** Add **6 new tables** and **enhance 3 existing tables** to achieve full Phase 1 functionality with complete bundle analytics.

### New Tables Needed (Priority Order)

#### 1. `profiles` Enhancement (CRITICAL - Phase 1)
**Action:** Add subscription tracking to existing `profiles` table.

**New Columns:**
```sql
-- Add to existing profiles table
alter table profiles add column stripe_customer_id text;
alter table profiles add column subscription_tier text default 'FREE' 
  check (subscription_tier in ('FREE', 'BASIC', 'PRO'));
alter table profiles add column subscription_status text default 'active' 
  check (subscription_status in ('active', 'canceled', 'past_due', 'trialing'));
alter table profiles add column subscription_period_end timestamptz;

-- Index for tier-based queries
create index idx_profiles_subscription_tier on profiles(subscription_tier);
create index idx_profiles_stripe_customer on profiles(stripe_customer_id);
```

**Drizzle Schema:**
```typescript
// src/db/schema/profiles.ts
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  role: text('role').default('USER'),
  full_name: text('full_name'),
  email: text('email'),
  
  // NEW: Subscription fields
  stripeCustomerId: text('stripe_customer_id'),
  subscriptionTier: text('subscription_tier')
    .default('FREE')
    .$type<'FREE' | 'BASIC' | 'PRO'>(),
  subscriptionStatus: text('subscription_status')
    .default('active')
    .$type<'active' | 'canceled' | 'past_due' | 'trialing'>(),
  subscriptionPeriodEnd: timestamp('subscription_period_end'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  tierIdx: index('idx_profiles_subscription_tier').on(table.subscriptionTier),
  stripeIdx: index('idx_profiles_stripe_customer').on(table.stripeCustomerId)
}));
```

**Why profiles vs separate subscriptions table:**
- ✅ Simpler queries (no joins for tier checks)
- ✅ Follows Stripe documentation pattern
- ✅ Single source of truth for user state
- ✅ Easier middleware/RLS policies

---

#### 2. `order_items` Enhancement (CRITICAL - Phase 2 Analytics)
**Action:** Add bundle tracking and substitution detection.

**New Columns:**
```sql
-- Add to existing order_items table
alter table order_items add column bundle_id uuid references bundles(id);
alter table order_items add column is_original_product boolean default true;
alter table order_items add column original_specific_product_id uuid references specific_products(id);

-- Indexes for analytics queries
create index idx_order_items_bundle on order_items(bundle_id);
create index idx_order_items_substitution on order_items(is_original_product) 
  where is_original_product = false;
```

**Drizzle Schema:**
```typescript
// src/db/schema/commerce.ts
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id),
  specificProductId: uuid('specific_product_id')
    .notNull()
    .references(() => specificProducts.id),
  quantity: integer('quantity').default(1),
  unitPrice: numeric('unit_price').notNull(),
  supplierStatus: text('supplier_status')
    .default('PENDING_ORDER')
    .$type<'PENDING_ORDER' | 'ORDERED' | 'SHIPPED'>(),
  
  // NEW: Bundle tracking
  bundleId: uuid('bundle_id').references(() => bundles.id),
  isOriginalProduct: boolean('is_original_product').default(true),
  originalSpecificProductId: uuid('original_specific_product_id')
    .references(() => specificProducts.id),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  orderIdx: index('idx_order_items_order').on(table.orderId),
  bundleIdx: index('idx_order_items_bundle').on(table.bundleId),
  substitutionIdx: index('idx_order_items_substitution')
    .on(table.isOriginalProduct)
    .where(eq(table.isOriginalProduct, false))
}));
```

**Use Cases:**
```typescript
// Track which bundles drive revenue
const bundleRevenue = await db
  .select({
    bundleId: orderItems.bundleId,
    bundleName: bundles.name,
    totalRevenue: sql<number>`sum(${orderItems.unitPrice} * ${orderItems.quantity})`,
    orderCount: sql<number>`count(distinct ${orderItems.orderId})`
  })
  .from(orderItems)
  .leftJoin(bundles, eq(orderItems.bundleId, bundles.id))
  .groupBy(orderItems.bundleId, bundles.name);

// Find most-substituted products
const substitutions = await db
  .select({
    originalProduct: specificProducts.name,
    substitutionCount: sql<number>`count(*)`
  })
  .from(orderItems)
  .leftJoin(specificProducts, eq(orderItems.originalSpecificProductId, specificProducts.id))
  .where(eq(orderItems.isOriginalProduct, false))
  .groupBy(specificProducts.name)
  .orderBy(desc(sql`count(*)`));
```

**Analytics Enabled:**
- "Which bundles generate the most revenue?"
- "What's the conversion rate per bundle?"
- "Which products get substituted most often?"
- "Do customized bundles have higher order values?"

---

#### 3. `external_transactions` Enhancement (CRITICAL - Phase 1 Analytics)
**Action:** Add bundle context to affiliate click tracking.

**New Columns:**
```sql
-- Add to existing external_transactions table
alter table external_transactions add column bundle_id uuid references bundles(id);
alter table external_transactions add column is_original_product boolean default true;

-- Indexes for analytics
create index idx_external_trans_bundle on external_transactions(bundle_id);
create index idx_external_trans_user_date on external_transactions(user_id, clicked_at);
```

**Drizzle Schema:**
```typescript
// src/db/schema/analytics.ts
export const externalTransactions = pgTable('external_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  specificProductId: uuid('specific_product_id')
    .references(() => specificProducts.id),
  clickedAt: timestamp('clicked_at').defaultNow(),
  source: text('source'),  // 'BUNDLE_CHECKOUT', 'PRODUCT_PAGE', 'INVENTORY'
  
  // NEW: Bundle context
  bundleId: uuid('bundle_id').references(() => bundles.id),
  isOriginalProduct: boolean('is_original_product').default(true),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdx: index('idx_external_trans_user').on(table.userId),
  bundleIdx: index('idx_external_trans_bundle').on(table.bundleId),
  dateIdx: index('idx_external_trans_date').on(table.clickedAt),
  userDateIdx: index('idx_external_trans_user_date')
    .on(table.userId, table.clickedAt)
}));
```

**Use Cases:**
```typescript
// Bundle click-through rates
const bundleCTR = await db
  .select({
    bundleId: bundles.id,
    bundleName: bundles.name,
    impressions: sql<number>`count(distinct ${missionReports.userId})`,  // Users who saw bundle
    clicks: sql<number>`count(${externalTransactions.id})`,
    ctr: sql<number>`count(${externalTransactions.id})::numeric / count(distinct ${missionReports.userId})`
  })
  .from(bundles)
  .leftJoin(externalTransactions, eq(bundles.id, externalTransactions.bundleId))
  .groupBy(bundles.id, bundles.name);

// Customization impact on conversions
const customizationImpact = await db
  .select({
    isOriginal: externalTransactions.isOriginalProduct,
    clicks: sql<number>`count(*)`,
    conversionRate: sql<number>`
      count(*) filter (where source = 'BUNDLE_CHECKOUT')::numeric / 
      count(*)::numeric
    `
  })
  .from(externalTransactions)
  .where(isNotNull(externalTransactions.bundleId))
  .groupBy(externalTransactions.isOriginalProduct);
```

**Analytics Enabled:**
- "Which bundles have the highest click-through rates?"
- "Do customized bundles convert better than defaults?"
- "What's the affiliate revenue per bundle?"
- "Which scenarios drive the most product clicks?"

---

### Bundle Analytics Architecture

The enhanced commerce tables create a complete **recommendation lineage** system:

```
User Views Bundle → Customizes → Clicks Product → Purchases
     ↓                ↓              ↓              ↓
  bundles      bundle_items   external_trans   order_items
                                    ↓              ↓
                            All reference bundle_id + track substitutions
```

**Key Insights Enabled:**

1. **Bundle Performance Funnel:**
   - Bundle views (mission_reports with bundle recommendations)
   - Customization rate (how many users modify defaults)
   - Click-through rate (external_transactions)
   - Conversion rate (order_items / external_transactions)
   - Revenue per bundle

2. **Product Intelligence:**
   - Which products get substituted most (weak recommendations)
   - Which products never get substituted (strong recommendations)
   - Substitution patterns (Product A → Product B)
   - Price sensitivity (do substitutions cost more or less?)

3. **User Behavior:**
   - Do "customizers" convert better than "accepters"?
   - Which scenarios lead to most customization?
   - Optimal bundle size (fewer items = more customization?)

4. **Revenue Attribution:**
   - Affiliate revenue by bundle
   - Revenue by scenario type
   - ROI per bundle (curation cost vs revenue)

**Example Analytics Queries:**

```sql
-- Complete bundle funnel
with bundle_funnel as (
  select 
    b.id as bundle_id,
    b.name,
    count(distinct mr.user_id) as impressions,
    count(distinct et.user_id) as clickers,
    count(distinct o.user_id) as purchasers,
    sum(oi.unit_price * oi.quantity) as revenue
  from bundles b
  left join mission_reports mr on b.id = any(/* bundles recommended in report */)
  left join external_transactions et on et.bundle_id = b.id
  left join order_items oi on oi.bundle_id = b.id
  left join orders o on o.id = oi.order_id
  group by b.id, b.name
)
select 
  bundle_id,
  name,
  impressions,
  clickers,
  purchasers,
  round(clickers::numeric / nullif(impressions, 0) * 100, 2) as ctr_pct,
  round(purchasers::numeric / nullif(clickers, 0) * 100, 2) as cvr_pct,
  revenue
from bundle_funnel
order by revenue desc;
```

---

#### 4. `inventory_items` (CRITICAL - Phase 1)
Track what users own vs need.

**Schema:**
```sql
create table inventory_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Link to product (flexible: can be master_item or specific_product)
  master_item_id uuid references master_items(id),
  specific_product_id uuid references specific_products(id),
  
  -- Inventory data
  quantity_owned integer default 0,
  quantity_needed integer default 1,
  status text not null default 'NEEDED' 
    check (status in ('OWNED', 'NEEDED', 'ORDERED', 'PARTIAL')),
  
  -- Purchase tracking
  purchase_date timestamptz,
  purchase_price numeric,
  purchase_url text,  -- Where they bought it
  
  -- Expiration tracking (Phase 2 - Pro tier)
  expiration_date date,
  
  -- Source tracking
  mission_report_id uuid references mission_reports(id),  -- Which plan recommended this
  bundle_id uuid references bundles(id),  -- Which bundle it came from
  
  notes text,  -- User notes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_inventory_user on inventory_items(user_id);
create index idx_inventory_status on inventory_items(user_id, status);
create index idx_inventory_expiration on inventory_items(user_id, expiration_date) 
  where expiration_date is not null;
```

**Drizzle Schema:**
```typescript
// src/db/schema/inventory.ts
import { pgTable, uuid, integer, text, timestamp, numeric, date, index } from 'drizzle-orm/pg-core';

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  masterItemId: uuid('master_item_id').references(() => masterItems.id),
  specificProductId: uuid('specific_product_id').references(() => specificProducts.id),
  
  quantityOwned: integer('quantity_owned').default(0),
  quantityNeeded: integer('quantity_needed').default(1),
  status: text('status')
    .notNull()
    .default('NEEDED')
    .$type<'OWNED' | 'NEEDED' | 'ORDERED' | 'PARTIAL'>(),
  
  purchaseDate: timestamp('purchase_date'),
  purchasePrice: numeric('purchase_price'),
  purchaseUrl: text('purchase_url'),
  expirationDate: date('expiration_date'),
  
  missionReportId: uuid('mission_report_id').references(() => missionReports.id),
  bundleId: uuid('bundle_id').references(() => bundles.id),
  
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdx: index('idx_inventory_user').on(table.userId),
  statusIdx: index('idx_inventory_status').on(table.userId, table.status),
  expirationIdx: index('idx_inventory_expiration').on(table.userId, table.expirationDate)
}));
```

**Purpose:**
- Track owned vs needed items per user
- Calculate readiness score improvements
- Enable inventory history (Basic+ tier)
- Support spending analytics
- Phase 2: Expiration alerts (Pro tier)

---

#### 3. `skills_resources` (HIGH - Phase 1)
Cached training materials library.

**Schema:**
```sql
create table skills_resources (
  id uuid primary key default uuid_generate_v4(),
  
  -- Skill identification
  skill_name text not null,  -- "First Aid", "Water Purification"
  category text not null,     -- "Medical", "Water", "Shelter", "Communication"
  
  -- Resource details
  resource_type text not null check (resource_type in ('VIDEO', 'ARTICLE', 'PDF', 'COURSE')),
  title text not null,
  url text not null,
  thumbnail_url text,
  author text,
  source text,  -- "YouTube", "Red Cross", "FEMA"
  
  duration_minutes integer,  -- For videos/courses
  difficulty text check (difficulty in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  
  -- Caching fields for AI-generated content
  summary text,  -- AI-generated summary
  key_techniques jsonb,  -- ["CPR steps", "Tourniquet application"]
  prerequisites text[],  -- Other skills needed first
  related_skills text[],  -- Similar/complementary skills
  
  -- Scenario mapping (consistent with products)
  scenarios text[],  -- ['NATURAL_DISASTER', 'EMP', 'PANDEMIC']
  
  -- Quality metrics
  rating numeric,
  view_count integer default 0,
  is_verified boolean default false,  -- Admin-approved
  is_featured boolean default false,  -- Highlight in UI
  
  -- Admin notes
  admin_notes text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for fast lookups during plan generation
create index idx_skills_by_name on skills_resources(skill_name);
create index idx_skills_by_category on skills_resources(category);
create index idx_skills_by_scenario on skills_resources using gin(scenarios);
create index idx_skills_verified on skills_resources(is_verified) where is_verified = true;
```

**Drizzle Schema:**
```typescript
// src/db/schema/skills.ts
export const skillsResources = pgTable('skills_resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  skillName: text('skill_name').notNull(),
  category: text('category').notNull(),
  
  resourceType: text('resource_type')
    .notNull()
    .$type<'VIDEO' | 'ARTICLE' | 'PDF' | 'COURSE'>(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  author: text('author'),
  source: text('source'),
  
  durationMinutes: integer('duration_minutes'),
  difficulty: text('difficulty').$type<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>(),
  
  summary: text('summary'),
  keyTechniques: jsonb('key_techniques').$type<string[]>(),
  prerequisites: text('prerequisites').array(),
  relatedSkills: text('related_skills').array(),
  
  scenarios: text('scenarios').array(),
  
  rating: numeric('rating'),
  viewCount: integer('view_count').default(0),
  isVerified: boolean('is_verified').default(false),
  isFeatured: boolean('is_featured').default(false),
  
  adminNotes: text('admin_notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  nameIdx: index('idx_skills_by_name').on(table.skillName),
  categoryIdx: index('idx_skills_by_category').on(table.category),
  scenarioIdx: index('idx_skills_by_scenario').using('gin', table.scenarios),
  verifiedIdx: index('idx_skills_verified').on(table.isVerified).where(eq(table.isVerified, true))
}));
```

**Purpose:**
- Cache skill resources to avoid re-fetching from YouTube API
- AI pre-generates summaries for faster loading
- Admin curates quality content (is_verified flag)
- Map skills to scenarios for relevant recommendations

**Workflow:**
1. First time "First Aid" skill needed → Fetch from YouTube → Save to DB → Show to user
2. Subsequent times → Query cached resources → Instant results
3. Admin reviews → Flags best as `is_verified` → Prioritized in UI

---

#### 4. `expert_calls` (HIGH - Phase 1)
Scheduled expert call sessions.

**Schema:**
```sql
create table expert_calls (
  id uuid primary key default uuid_generate_v4(),
  
  -- Call details
  call_type text not null check (call_type in ('FOUNDER_GROUP', 'EXPERT_GROUP', 'ONE_ON_ONE')),
  title text not null,
  description text,
  
  -- Scheduling
  scheduled_date timestamptz not null,
  duration_minutes integer default 60,
  timezone text default 'America/New_York',
  
  -- Access control
  tier_required text not null default 'BASIC' 
    check (tier_required in ('FREE', 'BASIC', 'PRO')),
  max_attendees integer,  -- NULL = unlimited
  
  -- Expert info (for EXPERT_GROUP and ONE_ON_ONE)
  expert_name text,
  expert_bio text,
  expert_photo_url text,
  expert_specialty text,  -- "Medical", "HAM Radio", "Tactics"
  
  -- Meeting details
  zoom_link text,
  zoom_meeting_id text,
  zoom_password text,
  
  -- Recording
  recording_url text,
  recording_available_date timestamptz,
  
  -- Status
  status text default 'SCHEDULED' 
    check (status in ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  
  -- Admin notes
  admin_notes text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_calls_by_date on expert_calls(scheduled_date);
create index idx_calls_by_type on expert_calls(call_type);
create index idx_calls_by_status on expert_calls(status);
```

**Drizzle Schema:**
```typescript
// src/db/schema/calls.ts
export const expertCalls = pgTable('expert_calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  callType: text('call_type')
    .notNull()
    .$type<'FOUNDER_GROUP' | 'EXPERT_GROUP' | 'ONE_ON_ONE'>(),
  title: text('title').notNull(),
  description: text('description'),
  
  scheduledDate: timestamp('scheduled_date').notNull(),
  durationMinutes: integer('duration_minutes').default(60),
  timezone: text('timezone').default('America/New_York'),
  
  tierRequired: text('tier_required')
    .notNull()
    .default('BASIC')
    .$type<'FREE' | 'BASIC' | 'PRO'>(),
  maxAttendees: integer('max_attendees'),
  
  expertName: text('expert_name'),
  expertBio: text('expert_bio'),
  expertPhotoUrl: text('expert_photo_url'),
  expertSpecialty: text('expert_specialty'),
  
  zoomLink: text('zoom_link'),
  zoomMeetingId: text('zoom_meeting_id'),
  zoomPassword: text('zoom_password'),
  
  recordingUrl: text('recording_url'),
  recordingAvailableDate: timestamp('recording_available_date'),
  
  status: text('status')
    .default('SCHEDULED')
    .$type<'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>(),
  
  adminNotes: text('admin_notes'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  dateIdx: index('idx_calls_by_date').on(table.scheduledDate),
  typeIdx: index('idx_calls_by_type').on(table.callType),
  statusIdx: index('idx_calls_by_status').on(table.status)
}));
```

**Purpose:**
- Schedule founder group calls (Basic+ tier)
- Schedule expert calls (Pro tier)
- Manage 1-on-1 sessions (Pro tier, quarterly quota)
- Store recordings for Pro tier library

---

#### 5. `call_attendance` (HIGH - Phase 1)
Track who registered and attended calls.

**Schema:**
```sql
create table call_attendance (
  id uuid primary key default uuid_generate_v4(),
  call_id uuid not null references expert_calls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Registration
  registered_at timestamptz not null default now(),
  
  -- Attendance
  attended boolean default false,
  joined_at timestamptz,
  left_at timestamptz,
  duration_minutes integer,
  
  -- Feedback (optional)
  rating integer check (rating between 1 and 5),
  feedback_text text,
  
  -- Admin notes
  admin_notes text,
  
  created_at timestamptz default now(),
  
  -- Prevent duplicate registrations
  unique(call_id, user_id)
);

-- Indexes
create index idx_attendance_by_call on call_attendance(call_id);
create index idx_attendance_by_user on call_attendance(user_id);
create index idx_attendance_attended on call_attendance(attended) where attended = true;
```

**Drizzle Schema:**
```typescript
// src/db/schema/calls.ts
export const callAttendance = pgTable('call_attendance', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id')
    .notNull()
    .references(() => expertCalls.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  registeredAt: timestamp('registered_at').notNull().defaultNow(),
  
  attended: boolean('attended').default(false),
  joinedAt: timestamp('joined_at'),
  leftAt: timestamp('left_at'),
  durationMinutes: integer('duration_minutes'),
  
  rating: integer('rating'),  // 1-5
  feedbackText: text('feedback_text'),
  
  adminNotes: text('admin_notes'),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  callIdx: index('idx_attendance_by_call').on(table.callId),
  userIdx: index('idx_attendance_by_user').on(table.userId),
  attendedIdx: index('idx_attendance_attended').on(table.attended).where(eq(table.attended, true)),
  uniqueAttendance: unique().on(table.callId, table.userId)
}));
```

**Purpose:**
- Track registrations and attendance
- Enforce max attendee limits
- Collect feedback for quality improvement
- Admin analytics on call popularity

---

#### 6. `user_activity_log` (MEDIUM - Phase 1)
Track all user actions for analytics.

**Schema:**
```sql
create table user_activity_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,  -- NULL for anonymous
  
  -- Activity tracking
  activity_type text not null,  -- 'REPORT_GENERATED', 'BUNDLE_VIEWED', 'PLAN_SAVED', etc.
  
  -- Flexible metadata
  metadata jsonb default '{}'::jsonb,
  -- Examples:
  -- { "scenario_types": ["NATURAL_DISASTER"], "duration_days": 7 }
  -- { "bundle_id": "uuid", "bundle_name": "72-Hour Kit" }
  -- { "mission_report_id": "uuid", "readiness_score": 75 }
  -- { "product_id": "uuid", "clicked_url": "https://..." }
  
  -- Context
  session_id text,
  ip_address inet,
  user_agent text,
  
  created_at timestamptz default now()
);

-- Indexes
create index idx_activity_by_user on user_activity_log(user_id);
create index idx_activity_by_type on user_activity_log(activity_type);
create index idx_activity_by_date on user_activity_log(created_at);
create index idx_activity_metadata on user_activity_log using gin(metadata);

-- Partition by month for performance (optional for large scale)
-- create table user_activity_log_y2025m01 partition of user_activity_log
--   for values from ('2025-01-01') to ('2025-02-01');
```

**Drizzle Schema:**
```typescript
// src/db/schema/analytics.ts
export const userActivityLog = pgTable('user_activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  activityType: text('activity_type').notNull(),
  // Activity types:
  // - REPORT_GENERATED
  // - PLAN_SAVED
  // - PLAN_EDITED
  // - BUNDLE_VIEWED
  // - BUNDLE_CUSTOMIZED
  // - PRODUCT_CLICKED
  // - SKILL_RESOURCE_VIEWED
  // - CALL_REGISTERED
  // - INVENTORY_UPDATED
  // - TIER_UPGRADED
  
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  sessionId: text('session_id'),
  ipAddress: text('ip_address'),  // Use inet type in SQL
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdx: index('idx_activity_by_user').on(table.userId),
  typeIdx: index('idx_activity_by_type').on(table.activityType),
  dateIdx: index('idx_activity_by_date').on(table.createdAt),
  metadataIdx: index('idx_activity_metadata').using('gin', table.metadata)
}));
```

**Purpose:**
- Admin analytics: User journey, conversion funnels, feature usage
- User behavior insights: What scenarios are popular?
- Cohort analysis: Do users who customize bundles convert better?
- Performance tracking: How long does plan generation take?

**Privacy:** Anonymize after 90 days or comply with GDPR data retention policies.

---

#### 7. `billing_transactions` (MEDIUM - Phase 1)
Complete financial history for users and admin.

**Schema:**
```sql
create table billing_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Transaction classification
  transaction_type text not null check (transaction_type in (
    'SUBSCRIPTION_PAYMENT',
    'SUBSCRIPTION_REFUND',
    'ORDER_PAYMENT',
    'ORDER_REFUND',
    'ONE_TIME_CALL'
  )),
  
  -- Stripe integration
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_charge_id text,
  
  -- Financial details
  amount numeric not null,
  currency text default 'USD',
  status text not null check (status in ('SUCCEEDED', 'FAILED', 'PENDING', 'REFUNDED', 'CANCELED')),
  
  -- Description
  description text not null,  -- "Pro Plan - Jan 2025" or "Bundle Order #1234"
  
  -- Invoice
  invoice_pdf_url text,  -- Stripe-hosted invoice PDF
  
  -- Additional context
  metadata jsonb default '{}'::jsonb,
  -- Examples:
  -- { "subscription_tier": "PRO", "billing_period_start": "2025-01-01" }
  -- { "order_id": "uuid", "bundle_ids": ["uuid1", "uuid2"] }
  -- { "call_id": "uuid", "call_type": "ONE_ON_ONE" }
  
  -- Timestamps
  transaction_date timestamptz not null default now(),
  created_at timestamptz default now()
);

-- Indexes
create index idx_billing_by_user on billing_transactions(user_id);
create index idx_billing_by_date on billing_transactions(transaction_date);
create index idx_billing_by_type on billing_transactions(transaction_type);
create index idx_billing_by_stripe_invoice on billing_transactions(stripe_invoice_id);
```

**Drizzle Schema:**
```typescript
// src/db/schema/billing.ts
export const billingTransactions = pgTable('billing_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  transactionType: text('transaction_type')
    .notNull()
    .$type<'SUBSCRIPTION_PAYMENT' | 'SUBSCRIPTION_REFUND' | 'ORDER_PAYMENT' | 'ORDER_REFUND' | 'ONE_TIME_CALL'>(),
  
  stripeInvoiceId: text('stripe_invoice_id'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripeChargeId: text('stripe_charge_id'),
  
  amount: numeric('amount').notNull(),
  currency: text('currency').default('USD'),
  status: text('status')
    .notNull()
    .$type<'SUCCEEDED' | 'FAILED' | 'PENDING' | 'REFUNDED' | 'CANCELED'>(),
  
  description: text('description').notNull(),
  invoicePdfUrl: text('invoice_pdf_url'),
  
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  
  transactionDate: timestamp('transaction_date').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdx: index('idx_billing_by_user').on(table.userId),
  dateIdx: index('idx_billing_by_date').on(table.transactionDate),
  typeIdx: index('idx_billing_by_type').on(table.transactionType),
  stripeIdx: index('idx_billing_by_stripe_invoice').on(table.stripeInvoiceId)
}));
```

**Purpose:**
- User billing history page (`/profile/billing-history`)
- Admin revenue reporting and analytics
- Unified view of ALL financial transactions
- Stripe webhook automation (auto-populate on events)
- Support for Phase 2 dropship orders

**Usage:**
```typescript
// Stripe webhook: invoice.paid
await db.insert(billingTransactions).values({
  userId: subscription.metadata.userId,
  transactionType: 'SUBSCRIPTION_PAYMENT',
  stripeInvoiceId: invoice.id,
  amount: invoice.amount_paid / 100,
  status: 'SUCCEEDED',
  description: `${tierName} Plan - ${monthYear}`,
  invoicePdfUrl: invoice.invoice_pdf,
  metadata: { subscription_tier: 'PRO', billing_period_start: invoice.period_start }
});
```

---

### Implementation Priority

**Sprint 1 (Week 1-2) - CRITICAL:**
1. ✅ Enhance `profiles` with subscription columns
2. ✅ Enhance `order_items` with bundle tracking
3. ✅ Enhance `external_transactions` with bundle context
4. ✅ Create `inventory_items` table
5. ✅ Create `billing_transactions` table

**Sprint 2 (Week 3-4) - HIGH:**
6. ✅ Create `skills_resources` table
7. ✅ Create `expert_calls` table
8. ✅ Create `call_attendance` table

**Sprint 3 (Week 5-6) - MEDIUM:**
9. ✅ Create `user_activity_log` table
10. ✅ Deprecate `saved_scenarios` (mark legacy)
11. ✅ Drop `unmatched_items` table (feature removed)

---

## 🎯 Strategic Advantage

Your existing database demonstrates **exceptional architectural quality**:

✅ **3-tier product hierarchy** - Industry best practice (categories → master_items → specific_products)  
✅ **AI-powered matching** - Vector embeddings enable semantic product search and discovery  
✅ **Flexible metadata** - JSONB fields handle diverse product attributes without schema changes  
✅ **Comprehensive tagging** - scenarios, demographics, timeframes, locations support multi-dimensional filtering  
✅ **Future-proof commerce** - Orders, shipments, and tracking tables ready for Phase 2 dropship  
✅ **Bundle lineage tracking** - Complete recommendation attribution from view to purchase  
✅ **Admin workflows** - Scraping queue enables efficient product curation  

**Key Strengths:**
- Database is **95% ready** for Phase 1 launch
- Only **6 new tables + 3 enhancements** needed
- All critical Phase 2 infrastructure already built
- Complete analytics pipeline from bundle recommendation to revenue
- Substitution tracking enables AI improvement (learn which products users prefer)
- Drizzle ORM transition will be straightforward (types already well-defined)

**Next Steps:**
1. Enhance `profiles` with 4 subscription columns
2. Enhance `order_items` with bundle tracking (3 columns)
3. Enhance `external_transactions` with bundle context (2 columns)
4. Create 6 new tables via Drizzle migrations
5. Mark `saved_scenarios` as deprecated, drop `unmatched_items`
6. Build out Phase 1 features using existing + new tables
7. Phase 2: Enable dropship with full bundle attribution analytics

---

## 📊 Database Migration Strategy

### Approach: Drizzle ORM with Supabase

**Current State:** Direct Supabase SQL schema  
**Target State:** Drizzle ORM for type-safe queries and migrations

**Migration Path:**

1. **Introspect existing schema:**
   ```bash
   npx drizzle-kit introspect:pg
   ```

2. **Generate initial Drizzle schema from existing tables:**
   - Place in `src/db/schema/` organized by domain
   - Preserve all existing column names and types
   - Add proper TypeScript types

3. **Create migration for new tables:**
   ```bash
   npm run db:generate  # Generate migration files
   npm run db:migrate   # Apply to Supabase
   ```

4. **Update existing queries:**
   - Replace raw Supabase queries with Drizzle
   - Use type-safe `eq()`, `inArray()`, etc. operators
   - Leverage Drizzle's relationship queries

**File Structure:**
```
src/db/
├── index.ts                    # Drizzle client
├── schema/
│   ├── index.ts                # Export all schemas
│   ├── profiles.ts             # profiles table (enhanced)
│   ├── products.ts             # categories, master_items, specific_products, suppliers
│   ├── bundles.ts              # bundles, bundle_items, bundle_recommendations
│   ├── mission-reports.ts      # mission_reports (deprecate saved_scenarios)
│   ├── inventory.ts            # inventory_items
│   ├── commerce.ts             # orders, order_items, shipments, shipment_items
│   ├── skills.ts               # skills_resources
│   ├── calls.ts                # expert_calls, call_attendance
│   ├── analytics.ts            # user_activity_log, external_transactions
│   └── billing.ts              # billing_transactions
└── migrations/
    ├── 0000_initial.sql        # Existing schema (snapshot)
    ├── 0001_add_subscriptions.sql
    ├── 0002_add_inventory.sql
    └── 0003_add_skills_and_calls.sql
```

**RLS Policies:** Maintain existing Supabase RLS policies for security.

---

## 🔄 Data Migration Notes

### `saved_scenarios` → `mission_reports`

**Status:** `mission_reports` is already in use. `saved_scenarios` is legacy.

**Migration Strategy:**
1. **Mark as deprecated:**
   ```sql
   alter table saved_scenarios add column deprecated boolean default true;
   -- Prevent new inserts via RLS policy or trigger
   ```

2. **Check for orphaned data:**
   ```sql
   select count(*) from saved_scenarios 
   where id not in (select id from mission_reports);
   ```

3. **Optional: Migrate old data if needed**
   ```sql
   -- If any old scenarios exist, migrate to mission_reports format
   insert into mission_reports (user_id, title, location, scenarios, report_data, ...)
   select user_id, scenario_type, location, 
          array[scenario_type], 
          data::jsonb, ...
   from saved_scenarios
   where deprecated = false;
   ```

4. **Update application code:**
   - Remove imports of `saved_scenarios`
   - Use `mission_reports` exclusively
   - Update any legacy APIs

---

## 📈 Scalability Considerations

**Current Scale:** Early stage (< 10K users)  
**Future Scale:** 100K+ users (Phase 2-3)

**Optimizations Already In Place:**
- ✅ UUID primary keys (distributed friendly)
- ✅ Proper indexes on foreign keys
- ✅ GIN indexes for JSONB and array fields
- ✅ IVFFlat index for vector similarity search

**Future Optimizations (when needed):**

1. **Partitioning:** `user_activity_log` and `billing_transactions` by month
2. **Archiving:** Move old transactions to cold storage after 2 years
3. **Caching:** Redis for frequently accessed data (bundle recommendations)
4. **Read Replicas:** Supabase read replicas for analytics queries
5. **JSONB optimization:** Extract frequently queried fields to columns

---

## 🎬 Development Approach

### Drizzle ORM Best Practices

**Query Patterns:**
```typescript
// ✅ Use type-safe operators
import { eq, inArray, and, or, isNull } from 'drizzle-orm';

// Get user's bundles for scenarios
const userBundles = await db
  .select()
  .from(bundles)
  .where(
    and(
      inArray(bundles.scenarios, ['NATURAL_DISASTER', 'EMP']),
      eq(bundles.minPeople, 4)
    )
  );

// Get inventory with product details
const userInventory = await db
  .select()
  .from(inventoryItems)
  .leftJoin(specificProducts, eq(inventoryItems.specificProductId, specificProducts.id))
  .leftJoin(masterItems, eq(specificProducts.masterItemId, masterItems.id))
  .where(eq(inventoryItems.userId, userId));
```

**Relations:**
```typescript
// Define relations for easier joins
export const missionReportsRelations = relations(missionReports, ({ one, many }) => ({
  user: one(profiles, {
    fields: [missionReports.userId],
    references: [profiles.id]
  }),
  inventoryItems: many(inventoryItems)
}));
```

**Transactions:**
```typescript
// Use transactions for multi-table operations
await db.transaction(async (tx) => {
  const report = await tx.insert(missionReports).values({...}).returning();
  await tx.insert(inventoryItems).values(
    items.map(item => ({ ...item, missionReportId: report[0].id }))
  );
});
```

---

## ✅ Validation Checklist

**Before Launch:**
- [ ] All 6 new tables created via Drizzle migrations
- [ ] `profiles` enhanced with subscription columns
- [ ] `saved_scenarios` marked as deprecated
- [ ] Existing queries migrated to Drizzle ORM
- [ ] RLS policies tested for all new tables
- [ ] Stripe webhook handlers populate `billing_transactions`
- [ ] Activity logging implemented on key user actions
- [ ] Skills resources cache populated with initial data
- [ ] Expert calls scheduling tested (Basic/Pro tiers)
- [ ] Inventory tracking functional (owned vs needed)
- [ ] Admin analytics queries tested
- [ ] User billing history page implemented

**Testing:**
- [ ] Subscription tier enforcement (Free = 1 report, Basic = unlimited)
- [ ] Bundle filtering by scenario, family size, climate
- [ ] Inventory readiness score calculation
- [ ] Skills resource caching (no duplicate API calls)
- [ ] Expert call registration limits
- [ ] User activity logging (no performance impact)
- [ ] Billing transaction webhook integration

---

## 🚀 Ready to Build

Your database architecture is **production-ready with minimal enhancements**. The existing schema demonstrates:

- ✅ **Mature data modeling** - 3-tier product hierarchy, flexible metadata, comprehensive tagging
- ✅ **AI-first design** - Vector embeddings, semantic matching, JSONB flexibility
- ✅ **Future-proof commerce** - Order/shipment tables ready for Phase 2 dropship
- ✅ **Admin efficiency** - Scraping workflows, product curation, bulk operations

**Add 6 tables + enhance 3 existing → Full Phase 1 functionality + powerful analytics.**

**Bundle lineage tracking → Know exactly which bundles drive revenue and what users customize.**

**Migrate to Drizzle ORM → Type-safe queries, better DX, easier migrations.**

**Phase 2 and beyond → Database already supports advanced features.**

You've built an excellent foundation with sophisticated analytics built-in. Time to ship! 🎯

