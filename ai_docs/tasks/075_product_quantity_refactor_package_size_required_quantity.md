# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Product Quantity Refactor - Separate Package Size from Required Quantity

### Goal Statement
**Goal:** Refactor the product catalog system to distinguish between **supplier package size** (how many units per package/ASIN) and **required quantity** (how many packages needed to fulfill the master item definition). This separation enables accurate inventory calculations, pricing, and order management for products that require multiple supplier packages.

**Example:** Amazon sells a "6-month food supply" as 9 buckets (package_size = 9). Our master item "1-year food supply" requires 2 of those packages (required_quantity = 2), totaling 18 buckets.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The current system uses a single ambiguous `metadata.quantity` field that represents the supplier's package size (e.g., "9 buckets in this ASIN"). However, this doesn't capture **how many of those supplier packages are needed** to fulfill our master item definition (e.g., "2 of those 9-bucket packages = 1 year supply").

This creates confusion in:
- **Inventory calculations** - Can't determine how many ASINs to order
- **Price calculations** - Can't calculate total cost to fulfill master item
- **Product recommendations** - Can't accurately suggest quantities to users
- **Bundle creation** - Can't properly compose multi-package bundles

### Solution Options Analysis

#### Option 1: Add `requiredQuantity` Field to `specific_products` Table ✅ SELECTED
**Approach:** Add new database columns `package_size` and `required_quantity` to replace ambiguous `metadata.quantity`

**Pros:**
- ✅ **Clear semantic separation** - `package_size` = supplier's bundle, `required_quantity` = how many to order
- ✅ **Database integrity** - First-class columns with validation, indexing, NOT NULL constraints
- ✅ **Query performance** - Can filter/sort directly without JSON path extraction
- ✅ **Simple calculations** - `total_units = package_size × required_quantity`
- ✅ **UI clarity** - Can display "Order 2 packages of 9 buckets = 18 total buckets"
- ✅ **Backward compatible** - Default `required_quantity = 1` preserves existing behavior

**Cons:**
- ❌ **Database migration required** - Need to copy `metadata.quantity` → `package_size`
- ❌ **Code updates** - Must update all places that read `metadata.quantity`

**Implementation Complexity:** Medium - Database migration + UI updates + calculation logic updates
**Risk Level:** Low - Clear upgrade path, testable in isolation

#### Option 2: Structured JSON in `metadata` Field (Not Selected)
**Approach:** Use existing `metadata` JSONB field with structured quantity object

**Pros:**
- ✅ **No database migration** - Uses existing JSONB field

**Cons:**
- ❌ **No database-level validation** - Can't enforce NOT NULL or numeric constraints
- ❌ **Harder to query** - JSON path queries more complex than column queries
- ❌ **No indexes** - Can't efficiently filter/sort by quantity values

**Implementation Complexity:** Low
**Risk Level:** Medium - Data consistency issues

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Add `package_size` and `required_quantity` columns to `specific_products` table

**Why this is the best choice:**
1. **Clarity of Intent** - Two explicit fields make the business logic immediately obvious
2. **Database Integrity** - First-class columns allow NOT NULL defaults, proper indexing, and type safety
3. **Query Performance** - Direct column access vs. JSON path extraction
4. **Migration Simplicity** - Copy existing `metadata.quantity` → `package_size`, default `required_quantity = 1`

**Key Decision Factors:**
- **Performance Impact:** Negligible - Two integer columns vs. JSON parsing
- **User Experience:** Dramatically improved - Clear "(12 x 2)" display in catalog
- **Maintainability:** High - Explicit schema is self-documenting
- **Scalability:** Excellent - Indexed columns support efficient filtering

### Decision Request

**👤 USER DECISION:** ✅ **APPROVED** - Proceed with Option 1

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS
- **Authentication:** Supabase Auth managed by middleware
- **Key Architectural Patterns:** Next.js App Router, Server Components, Server Actions
- **Relevant Existing Components:**
  - `src/db/schema/products.ts` - Current product schema with `metadata` JSONB field
  - `src/app/(protected)/admin/products/components/ProductEditDialog.tsx` - Product edit form
  - `src/app/(protected)/admin/products/components/VariationsModal.tsx` - Variations configuration
  - `src/lib/products-types.ts` - TypeScript type definitions

### Current State
**Database Schema:**
- `specific_products` table has `metadata` JSONB field containing `{ quantity?: number }`
- No explicit columns for package size or required quantity
- Variations system has `toggles.quantity` boolean to enable quantity variations

**UI Behavior:**
- Product catalog tree displays quantity in parentheses next to product name: `(12)`
- Product edit dialog has single "Quantity" field in metadata section
- Variations modal has single "Quantity" toggle

**Data Flow:**
- `metadata.quantity` is read/written as optional number in ProductMetadata interface
- Inventory tracking uses separate `inventory_items.quantity_owned` field (total units)

### Existing Context Providers Analysis
Not applicable - this is a database schema and admin UI refactor with no context provider changes needed.

## 4. Context & Problem Definition

### Problem Statement
The product catalog currently cannot distinguish between:
1. **Supplier package size** - How many items are in each supplier package/SKU/ASIN (e.g., "9 buckets per package")
2. **Required quantity** - How many of those supplier packages are needed to fulfill the master item definition (e.g., "need 2 packages for 1-year supply")

This conflation causes:
- **Ordering confusion** - Can't tell users "order 2 of these" vs "this contains 2 items"
- **Price miscalculation** - Can't compute total cost as `price × required_quantity`
- **Inventory errors** - Users can't determine how many supplier packages to purchase
- **Catalog ambiguity** - "(12)" could mean "12-pack" or "order 12 of these"

**Real-world example:**
- Amazon ASIN B00XYZ sells "6-Month Food Supply (9 buckets)"
- Our master item is "1-Year Food Supply"
- We need to specify: `package_size = 9`, `required_quantity = 2` → total 18 buckets

### Success Criteria
- [x] Database schema updated with `package_size` and `required_quantity` integer columns
- [x] Migration successfully copies `metadata.quantity` → `package_size` with default values
- [x] Product edit dialog split into two fields with help text and calculated total
- [x] Variations system supports independent `package_size` and `required_quantity` toggles
- [x] Catalog tree displays quantity as "(12 x 2)" format with smart fallback logic
- [x] All existing products migrated without data loss
- [x] Form validation prevents invalid values (< 1) for new/edited products
- [x] TypeScript types updated to reflect new schema

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements
- User can set both `package_size` and `required_quantity` independently in product edit dialog
- System displays quantity as "(package_size x required_quantity)" in catalog tree with smart formatting
- Variations system allows toggling `package_size` and `required_quantity` independently
- Calculated total displays in product edit form: "(= X total units)"
- Migration preserves existing `metadata.quantity` values as `package_size`
- Default values prevent null/invalid data: `package_size = 1`, `required_quantity = 1`

### Non-Functional Requirements
- **Performance:** No measurable degradation - integer columns are highly efficient
- **Security:** No new security concerns - admin-only functionality
- **Usability:** Clear labels, help text, and calculated totals improve comprehension
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works with existing Drizzle ORM patterns and migrations

### Technical Constraints
- Must use Drizzle ORM migration system with down migration safety
- Cannot break existing inventory tracking system (uses separate `quantity_owned` field)
- Must maintain existing sort order logic (manual `sortOrder` field)
- Cannot modify bundle recommendation engine (deferred to future work)

---

## 7. Data & Database Changes

### Database Schema Changes
```sql
-- Add new columns to specific_products table
ALTER TABLE specific_products
  ADD COLUMN package_size INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN required_quantity INTEGER NOT NULL DEFAULT 1;

-- Migrate existing metadata.quantity values to package_size
UPDATE specific_products
SET package_size = COALESCE((metadata->>'quantity')::INTEGER, 1)
WHERE metadata->>'quantity' IS NOT NULL;

-- Create index for efficient queries
CREATE INDEX idx_specific_products_quantities ON specific_products(package_size, required_quantity);

-- Remove metadata.quantity from JSONB (cleanup)
UPDATE specific_products
SET metadata = metadata - 'quantity'
WHERE metadata ? 'quantity';
```

### Data Model Updates
```typescript
// Update ProductMetadata interface - REMOVE quantity field
export interface ProductMetadata {
  brand?: string;
  // quantity?: number | string; // ❌ REMOVE - replaced by top-level columns
  weight?: number | string;
  weight_unit?: string;
  volume?: number | string;
  volume_unit?: string;
  size?: string;
  color?: string;
  upc?: string;
  model_number?: string;
  dimensions?: string;
  rating?: number | string;
  reviews?: number | string;
  x1_multiplier?: boolean;
}

// Update VariationConfig toggles - REPLACE quantity with two fields
export interface VariationConfig {
  attributes: VariationAttribute[];
  toggles: {
    price: boolean;
    sku: boolean;
    asin: boolean;
    package_size: boolean;      // ✅ NEW - replaces quantity
    required_quantity: boolean; // ✅ NEW - replaces quantity
    processing: boolean;
  };
}

// Update Product interface - ADD new fields
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  asin?: string | null;
  price?: string | number | null;
  package_size: number;        // ✅ NEW - items per supplier package
  required_quantity: number;   // ✅ NEW - packages needed for master item
  type?: string | null;
  productUrl?: string | null;
  imageUrl?: string | null;
  masterItemId: string;
  supplierId: string | null;
  supplier?: {
    name: string;
    affiliateId?: string | null;
    affiliateUrlTemplate?: string | null;
  } | null;
  masterItem?: { name: string } | null;
  metadata?: ProductMetadata | null;
  timeframes?: string[] | null;
  demographics?: string[] | null;
  locations?: string[] | null;
  scenarios?: string[] | null;
  sortOrder?: number | null;
  variations?: ProductVariations | null;
  changeHistory?: ChangeHistory;
}
```

### Drizzle Schema Updates
```typescript
// src/db/schema/products.ts
export const specificProducts = pgTable(
  'specific_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    masterItemId: uuid('master_item_id')
      .notNull()
      .references(() => masterItems.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id')
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }),
    sku: text('sku'),
    asin: text('asin'),
    packageSize: integer('package_size').notNull().default(1),        // ✅ NEW
    requiredQuantity: integer('required_quantity').notNull().default(1), // ✅ NEW
    imageUrl: text('image_url'),
    productUrl: text('product_url'),
    type: text('type').notNull().default('product'),
    status: text('status').notNull().default('active'),
    metadata: jsonb('metadata'),
    variations: jsonb('variations'),
    timeframes: text('timeframes').array(),
    demographics: text('demographics').array(),
    locations: text('locations').array(),
    scenarios: text('scenarios').array(),
    sortOrder: integer('sort_order'),
    changeHistory: jsonb('change_history').default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    masterItemIdIdx: index('idx_specific_products_master_item_id').on(table.masterItemId),
    supplierIdIdx: index('idx_specific_products_supplier_id').on(table.supplierId),
    asinIdx: index('idx_specific_products_asin').on(table.asin),
    statusIdx: index('idx_specific_products_status').on(table.status),
    quantitiesIdx: index('idx_specific_products_quantities').on(table.packageSize, table.requiredQuantity), // ✅ NEW
    metadataIdx: index('idx_specific_products_metadata').using('gin', table.metadata),
    scenariosIdx: index('idx_specific_products_scenarios').using('gin', table.scenarios),
    sortOrderIdx: index('idx_specific_products_sort_order').on(table.masterItemId, table.sortOrder),
  })
);
```

### Data Migration Plan
- [x] **Step 1:** Generate migration with new columns (default values prevent nulls)
- [x] **Step 2:** Create down migration for safe rollback
- [x] **Step 3:** Apply migration to add columns with defaults
- [x] **Step 4:** Run data migration to copy `metadata.quantity` → `package_size`
- [x] **Step 5:** Verify data integrity (check all products have valid values)
- [x] **Step 6:** Remove `metadata.quantity` from JSONB (cleanup)
- [x] **Step 7:** Update TypeScript types and remove `quantity` from ProductMetadata

### 🚨 MANDATORY: Down Migration Safety Protocol
**CRITICAL REQUIREMENT:** Before running ANY database migration, you MUST create the corresponding down migration file following the `drizzle_down_migration.md` template process:

- [x] **Step 1: Generate Migration** - Run `npm run db:generate` to create the migration file
- [x] **Step 2: Create Down Migration** - Follow `drizzle_down_migration.md` template to analyze the migration and create the rollback file
- [x] **Step 3: Create Subdirectory** - Create `drizzle/migrations/[timestamp_name]/` directory
- [x] **Step 4: Generate down.sql** - Create the `down.sql` file with safe rollback operations
- [x] **Step 5: Verify Safety** - Ensure all operations use `IF EXISTS` and include appropriate warnings
- [x] **Step 6: Apply Migration** - Only after down migration is created, run `npm run db:migrate`

**🛑 NEVER run `npm run db:migrate` without first creating the down migration file!**

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

#### **MUTATIONS (Server Actions)** → `app/actions/[feature].ts`
- [x] **Server Actions File** - `app/actions/products.ts` - Product CRUD operations
- [x] Examples: `createProduct()`, `updateProduct()`, `deleteProduct()`
- [x] Must use `'use server'` directive and `revalidatePath()` after mutations

#### **QUERIES (Data Fetching)** → Direct in Server Components
- [x] **Direct in Page Components** - Simple `await db.select().from(specificProducts)` calls
- [x] Use when: Product list queries for admin pages

### Server Actions
- [x] **`createProduct`** - Update to include `package_size` and `required_quantity` in insert
- [x] **`updateProduct`** - Update to validate and save new quantity fields
- [x] **`deleteProduct`** - No changes needed (existing implementation)

### Database Queries
- [x] **Direct in Server Components** - Product list queries already fetch all columns
- [x] **No new query functions needed** - Existing patterns handle new columns automatically

---

## 9. Frontend Changes

### New Components
No new components needed - updating existing components only.

### Component Updates

#### 1. **`src/app/(protected)/admin/products/components/ProductEditDialog.tsx`**
**Changes:**
- Split "Quantity" field into two separate fields: "Package Size" and "Required Quantity"
- Add help text below each field explaining their purpose
- Add calculated total display: "(= X total units)" beneath the fields
- Update form submission to include both new fields
- Remove `metadata.quantity` from metadata section

**Layout:**
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <label>Package Size</label>
    <input type="number" min="1" value={formState.package_size || 1} />
    <p className="text-xs text-muted-foreground">Items per supplier package</p>
  </div>
  <div>
    <label>Required Quantity</label>
    <input type="number" min="1" value={formState.required_quantity || 1} />
    <p className="text-xs text-muted-foreground">Packages needed for this master item</p>
  </div>
</div>
<p className="text-sm text-muted-foreground">
  (= {(formState.package_size || 1) * (formState.required_quantity || 1)} total units)
</p>
```

#### 2. **`src/app/(protected)/admin/products/components/ProductRow.tsx`**
**Changes:**
- Update quantity display logic to show "(package_size x required_quantity)" format
- Smart formatting:
  - If `required_quantity = 1`: show `(12)` not `(12 x 1)`
  - If both are 1: show `(1)` not `(1 x 1)`
  - If `package_size` is null/missing: show `(? x 2)`

**Display Logic:**
```typescript
function formatQuantityDisplay(packageSize: number | null, requiredQuantity: number): string {
  const pkgSize = packageSize ?? '?';

  if (requiredQuantity === 1) {
    return `(${pkgSize})`;
  }

  return `(${pkgSize} x ${requiredQuantity})`;
}
```

#### 3. **`src/app/(protected)/admin/products/components/VariationsModal.tsx`**
**Changes:**
- Replace single `quantity` toggle with two toggles: `package_size` and `required_quantity`
- Label them: "Package Size varies by option" and "Required Quantity varies by option"
- Default both toggles to OFF (use base product values)
- Update toggle handler to manage both fields independently

**Toggle Section:**
```tsx
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={config.toggles.package_size}
      onChange={() => handleToggle('package_size')}
    />
    <label>Package Size varies by option</label>
  </div>
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={config.toggles.required_quantity}
      onChange={() => handleToggle('required_quantity')}
    />
    <label>Required Quantity varies by option</label>
  </div>
</div>
```

#### 4. **`src/app/(protected)/admin/products/components/VariationsTable.tsx`**
**Changes:**
- If `package_size` toggle is ON, show "Package Size" column
- If `required_quantity` toggle is ON, show "Required Quantity" column
- Allow editing each field independently
- Validate both fields >= 1 on input

### Page Updates
- [x] **`/admin/products`** - Product edit dialog and catalog display updated
- [x] **`/admin/products/[id]`** - Individual product pages reflect new fields

### State Management
- Form state in `ProductEditDialog` updated to include `package_size` and `required_quantity`
- Variations state updated to handle two separate toggle fields
- No global state changes needed

### 🚨 CRITICAL: Context Usage Strategy
Not applicable - this is an admin UI refactor with no context provider dependencies.

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**Database Schema:**
```typescript
// src/db/schema/products.ts - Current (Lines 32-70)
export const specificProducts = pgTable(
  'specific_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // ... other fields ...
    metadata: jsonb('metadata'),  // Contains { quantity?: number }
    // No explicit package_size or required_quantity columns
  }
);
```

**TypeScript Types:**
```typescript
// src/lib/products-types.ts - Current (Lines 35-50)
export interface ProductMetadata {
  brand?: string;
  quantity?: number | string;  // ❌ Ambiguous - package size or required qty?
  weight?: number | string;
  // ... other fields ...
}

export interface VariationConfig {
  attributes: VariationAttribute[];
  toggles: {
    price: boolean;
    sku: boolean;
    asin: boolean;
    quantity: boolean;  // ❌ Single toggle for ambiguous quantity
    processing: boolean;
  };
}
```

**Product Edit Dialog:**
```tsx
// ProductEditDialog.tsx - Current (conceptual, ~line 300-350)
<InputGroup label="Metadata">
  <TextInput
    label="Quantity"
    type="number"
    value={formState.metadata?.quantity}
    onChange={(e) => setFormState({
      ...formState,
      metadata: { ...formState.metadata, quantity: Number(e.target.value) }
    })}
  />
</InputGroup>
```

**Catalog Display:**
```tsx
// ProductRow.tsx - Current (conceptual, ~line 50-70)
<span className="text-sm text-muted-foreground">
  {product.metadata?.quantity ? `(${product.metadata.quantity})` : ''}
</span>
```

### 📂 **After Refactor**

**Database Schema:**
```typescript
// src/db/schema/products.ts - After refactor
export const specificProducts = pgTable(
  'specific_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // ... other fields ...
    packageSize: integer('package_size').notNull().default(1),        // ✅ NEW
    requiredQuantity: integer('required_quantity').notNull().default(1), // ✅ NEW
    metadata: jsonb('metadata'),  // No longer contains quantity
  },
  (table) => ({
    // ... existing indexes ...
    quantitiesIdx: index('idx_specific_products_quantities')
      .on(table.packageSize, table.requiredQuantity), // ✅ NEW INDEX
  })
);
```

**TypeScript Types:**
```typescript
// src/lib/products-types.ts - After refactor
export interface ProductMetadata {
  brand?: string;
  // quantity field REMOVED - now top-level columns
  weight?: number | string;
  // ... other fields ...
}

export interface VariationConfig {
  attributes: VariationAttribute[];
  toggles: {
    price: boolean;
    sku: boolean;
    asin: boolean;
    package_size: boolean;      // ✅ RENAMED from quantity
    required_quantity: boolean; // ✅ NEW - independent toggle
    processing: boolean;
  };
}

export interface Product {
  id: string;
  // ... existing fields ...
  package_size: number;        // ✅ NEW - items per package
  required_quantity: number;   // ✅ NEW - packages needed
  metadata?: ProductMetadata | null;
  // ... other fields ...
}
```

**Product Edit Dialog:**
```tsx
// ProductEditDialog.tsx - After refactor
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="text-sm font-medium">Package Size</label>
    <input
      type="number"
      min="1"
      value={formState.package_size || 1}
      onChange={(e) => setFormState({
        ...formState,
        package_size: Number(e.target.value)
      })}
      className="w-full px-3 py-2 border rounded"
    />
    <p className="text-xs text-muted-foreground mt-1">
      Items per supplier package
    </p>
  </div>
  <div>
    <label className="text-sm font-medium">Required Quantity</label>
    <input
      type="number"
      min="1"
      value={formState.required_quantity || 1}
      onChange={(e) => setFormState({
        ...formState,
        required_quantity: Number(e.target.value)
      })}
      className="w-full px-3 py-2 border rounded"
    />
    <p className="text-xs text-muted-foreground mt-1">
      Packages needed for this master item
    </p>
  </div>
</div>
<p className="text-sm text-muted-foreground mt-2">
  (= {(formState.package_size || 1) * (formState.required_quantity || 1)} total units)
</p>
```

**Catalog Display:**
```tsx
// ProductRow.tsx - After refactor
function formatQuantityDisplay(packageSize: number | null, requiredQuantity: number): string {
  const pkgSize = packageSize ?? '?';

  // Smart formatting
  if (requiredQuantity === 1) {
    return `(${pkgSize})`;  // "(12)" not "(12 x 1)"
  }

  return `(${pkgSize} x ${requiredQuantity})`;  // "(12 x 2)"
}

<span className="text-sm text-muted-foreground">
  {formatQuantityDisplay(product.package_size, product.required_quantity)}
</span>
```

### 🎯 **Key Changes Summary**
- [x] **Database:** Added `package_size` and `required_quantity` integer columns with defaults
- [x] **Migration:** Copy `metadata.quantity` → `package_size`, remove old field from JSONB
- [x] **Types:** Removed `quantity` from `ProductMetadata`, added to `Product` interface
- [x] **UI Split:** Single "Quantity" field → Two fields with help text and calculated total
- [x] **Variations:** Single `quantity` toggle → Two independent toggles
- [x] **Display:** Smart formatting logic for catalog tree quantity display
- [x] **Files Modified:**
  - `src/db/schema/products.ts` (schema update)
  - `src/lib/products-types.ts` (type updates)
  - `src/app/(protected)/admin/products/components/ProductEditDialog.tsx` (form split)
  - `src/app/(protected)/admin/products/components/ProductRow.tsx` (display logic)
  - `src/app/(protected)/admin/products/components/VariationsModal.tsx` (toggle split)
  - `src/app/(protected)/admin/products/actions.ts` (CRUD operations)
  - `drizzle/migrations/XXXX_add_quantity_fields.sql` (new migration)

**Impact:** This refactor enables accurate multi-package product modeling, clearer admin UI, and sets the foundation for proper inventory calculations and bundle pricing.

---

## 11. Implementation Plan

### Phase 1: Database Schema Changes
**Goal:** Add new columns and migrate existing data safely

- [ ] **Task 1.1:** Update Drizzle Schema Definition
  - Files: `src/db/schema/products.ts`
  - Details: Add `packageSize` and `requiredQuantity` integer columns with NOT NULL defaults
- [ ] **Task 1.2:** Generate Database Migration
  - Command: `npm run db:generate`
  - Details: Drizzle generates SQL migration file with new columns
- [ ] **Task 1.3:** Create Down Migration (MANDATORY)
  - Files: `drizzle/migrations/[timestamp]_add_quantity_fields/down.sql`
  - Details: Follow `drizzle_down_migration.md` template for safe rollback
- [ ] **Task 1.4:** Apply Migration
  - Command: `npm run db:migrate`
  - Details: Execute migration to add columns with default values
- [ ] **Task 1.5:** Run Data Migration Script
  - Files: `scripts/migrate-quantity-fields.ts` (create new)
  - Details: Copy `metadata.quantity` → `package_size`, default nulls to 1
- [ ] **Task 1.6:** Verify Data Integrity
  - Command: Query database to check all products have valid values
  - Details: Ensure no nulls, all values >= 1
- [ ] **Task 1.7:** Remove Old Metadata Field
  - Command: SQL update to remove `quantity` key from metadata JSONB
  - Details: Cleanup after successful migration

### Phase 2: TypeScript Type Updates
**Goal:** Update type definitions to reflect new schema

- [ ] **Task 2.1:** Update ProductMetadata Interface
  - Files: `src/lib/products-types.ts`
  - Details: Remove `quantity?: number | string` field
- [ ] **Task 2.2:** Update Product Interface
  - Files: `src/lib/products-types.ts`
  - Details: Add `package_size: number` and `required_quantity: number` fields
- [ ] **Task 2.3:** Update VariationConfig Interface
  - Files: `src/lib/products-types.ts`
  - Details: Replace `quantity: boolean` toggle with `package_size: boolean` and `required_quantity: boolean`

### Phase 3: Server Action Updates
**Goal:** Update CRUD operations to handle new fields

- [ ] **Task 3.1:** Update createProduct Action
  - Files: `src/app/(protected)/admin/products/actions.ts`
  - Details: Include `package_size` and `required_quantity` in insert, validate >= 1
- [ ] **Task 3.2:** Update updateProduct Action
  - Files: `src/app/(protected)/admin/products/actions.ts`
  - Details: Include new fields in update, validate >= 1, remove `metadata.quantity` handling
- [ ] **Task 3.3:** Update Product Queries
  - Files: `src/app/(protected)/admin/products/page.tsx`
  - Details: Ensure queries select new columns (automatic with Drizzle schema)

### Phase 4: Product Edit Dialog Refactor
**Goal:** Split quantity field into two separate inputs with validation

- [ ] **Task 4.1:** Update Form State Interface
  - Files: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
  - Details: Add `package_size` and `required_quantity` to formState type
- [ ] **Task 4.2:** Split Quantity Input Field
  - Files: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
  - Details: Replace single "Quantity" field with grid of two fields
- [ ] **Task 4.3:** Add Help Text and Labels
  - Files: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
  - Details: Add descriptive labels and help text below each field
- [ ] **Task 4.4:** Add Calculated Total Display
  - Files: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
  - Details: Show "(= X total units)" beneath the grid
- [ ] **Task 4.5:** Add Form Validation
  - Files: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
  - Details: Validate both fields >= 1, show error messages for invalid values
- [ ] **Task 4.6:** Update Form Submission
  - Files: `src/app/(protected)/admin/products/components/ProductEditDialog.tsx`
  - Details: Include both fields in FormData, remove `metadata.quantity`

### Phase 5: Variations System Refactor
**Goal:** Split quantity toggle into two independent toggles

- [ ] **Task 5.1:** Update Variations Config Type
  - Files: `src/app/(protected)/admin/products/components/VariationsModal.tsx`
  - Details: Replace `quantity` toggle with `package_size` and `required_quantity`
- [ ] **Task 5.2:** Update Toggle UI
  - Files: `src/app/(protected)/admin/products/components/VariationsModal.tsx`
  - Details: Show two checkboxes with descriptive labels
- [ ] **Task 5.3:** Update Toggle Handlers
  - Files: `src/app/(protected)/admin/products/components/VariationsModal.tsx`
  - Details: Handle both toggles independently, default both OFF
- [ ] **Task 5.4:** Update Variations Table
  - Files: `src/app/(protected)/admin/products/components/VariationsTable.tsx`
  - Details: Show columns for each toggle when enabled, allow editing

### Phase 6: Catalog Display Updates
**Goal:** Update product list to show smart quantity formatting

- [ ] **Task 6.1:** Create Quantity Formatting Helper
  - Files: `src/app/(protected)/admin/products/components/ProductRow.tsx`
  - Details: Implement `formatQuantityDisplay()` with smart fallback logic
- [ ] **Task 6.2:** Update Product Row Display
  - Files: `src/app/(protected)/admin/products/components/ProductRow.tsx`
  - Details: Replace `metadata.quantity` with formatted display
- [ ] **Task 6.3:** Test Edge Cases
  - Details: Verify display for: (12), (12 x 2), (1), (? x 2)

### Phase 7: Code Cleanup
**Goal:** Remove all references to old `metadata.quantity` field

- [ ] **Task 7.1:** Search Codebase for `metadata.quantity`
  - Command: `grep -r "metadata.quantity" src/`
  - Details: Find and remove all remaining references
- [ ] **Task 7.2:** Search Codebase for `toggles.quantity`
  - Command: `grep -r "toggles.quantity" src/`
  - Details: Replace with `toggles.package_size` or `toggles.required_quantity`
- [ ] **Task 7.3:** Update Any Remaining Type Definitions
  - Files: Check `src/types.ts`, `src/types/wizard.ts`, etc.
  - Details: Ensure no lingering `quantity` fields in metadata types

### Phase 8: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 8.1:** Code Quality Verification
  - Files: All modified TypeScript files
  - Command: `npm run lint`
  - Details: Ensure no linting errors in modified files
- [ ] **Task 8.2:** Type Check Verification
  - Command: `npx tsc --noEmit`
  - Details: Verify no TypeScript errors introduced
- [ ] **Task 8.3:** Database Schema Review
  - Files: Generated migration SQL files
  - Details: Read migration files to verify correct DDL statements

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 8, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 9: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 9.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
- [ ] **Task 9.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, provide detailed summary

### Phase 10: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality

- [ ] **Task 10.1:** Present AI Testing Results
  - Details: Summary of linting, type checking, schema validation
- [ ] **Task 10.2:** Request User UI Testing
  - Details: User verifies product edit dialog, variations modal, catalog display
- [ ] **Task 10.3:** Wait for User Confirmation
  - Details: User tests in browser and confirms working correctly

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - You must confirm you actually did what you said
  - [ ] **Provides user visibility** - Clear progress tracking throughout implementation
  - [ ] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [ ] **Creates audit trail** - Documentation of what was actually completed
  - [ ] **Enables better debugging** - If issues arise, easy to see what was changed

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── drizzle/migrations/
│   └── [timestamp]_add_quantity_fields/
│       ├── migration.sql              # Generated migration file
│       └── down.sql                   # Rollback migration (MANDATORY)
└── scripts/
    └── migrate-quantity-fields.ts     # Data migration script
```

### Files to Modify
- [ ] **`src/db/schema/products.ts`** - Add `packageSize` and `requiredQuantity` columns
- [ ] **`src/lib/products-types.ts`** - Update `ProductMetadata`, `Product`, `VariationConfig` interfaces
- [ ] **`src/app/(protected)/admin/products/actions.ts`** - Update CRUD operations
- [ ] **`src/app/(protected)/admin/products/components/ProductEditDialog.tsx`** - Split quantity field UI
- [ ] **`src/app/(protected)/admin/products/components/ProductRow.tsx`** - Update display logic
- [ ] **`src/app/(protected)/admin/products/components/VariationsModal.tsx`** - Split quantity toggle
- [ ] **`src/app/(protected)/admin/products/components/VariationsTable.tsx`** - Show separate columns

### Dependencies to Add
No new dependencies required - uses existing Drizzle ORM and UI components.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1: Migration fails partway through**
  - **Code Review Focus:** Check migration SQL for syntax errors, constraint violations
  - **Potential Fix:** Use down migration to rollback, fix issues, re-apply

- [ ] **Error Scenario 2: Existing products have invalid `metadata.quantity` values**
  - **Analysis Approach:** Query database for non-numeric or negative quantity values
  - **Recommendation:** Data migration script should handle nulls, strings, negatives gracefully

- [ ] **Error Scenario 3: Form validation allows zero or negative values**
  - **Code Review Focus:** Check input field `min` attribute and server-side validation
  - **Potential Fix:** Add validation in both client (ProductEditDialog) and server (actions.ts)

- [ ] **Error Scenario 4: Variations with old `quantity` toggle break**
  - **Analysis Approach:** Search for products with variations, check JSON structure
  - **Recommendation:** Migration script should update variation configs to new format

### Edge Cases to Consider
- [ ] **Edge Case 1: Product with variations and null package_size**
  - **Analysis Approach:** Check if variations table shows "?" correctly
  - **Recommendation:** Variations table should handle null gracefully with fallback

- [ ] **Edge Case 2: User enters extremely large values (> 1000)**
  - **Analysis Approach:** Check if UI handles large numbers without overflow
  - **Recommendation:** Add optional max validation if needed (e.g., max 9999)

- [ ] **Edge Case 3: Product duplication copies both fields correctly**
  - **Analysis Approach:** Test duplicate product action preserves both fields
  - **Recommendation:** Ensure duplicate action includes new columns in copy

### Security & Access Control Review
- [ ] **Admin Access Control:** Product edit operations already restricted to admin role
  - **Check:** Middleware protects `/admin/products` routes
- [ ] **Form Input Validation:** Client-side validation prevents invalid values
  - **Check:** Server-side validation in `createProduct` and `updateProduct` actions
- [ ] **SQL Injection Prevention:** Drizzle ORM parameterizes all queries
  - **Check:** No raw SQL concatenation with user input
- [ ] **Data Integrity:** Database defaults prevent null values
  - **Check:** Migration includes `NOT NULL DEFAULT 1` constraints

---

## 15. Deployment & Configuration

### Environment Variables
No new environment variables required - uses existing database connection.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
✅ **COMPLETED** - Strategic analysis presented, user approved Option 1

### Communication Preferences
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates
- [x] Flag any blockers or concerns immediately
- [x] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST** ✅ DONE
2. **STRATEGIC ANALYSIS SECOND** ✅ DONE - User approved Option 1
3. **CREATE TASK DOCUMENT THIRD** ✅ DONE - This document
4. **PRESENT IMPLEMENTATION OPTIONS** - NEXT STEP

**👤 IMPLEMENTATION OPTIONS:**

**A) Preview High-Level Code Changes**
Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

**B) Proceed with Implementation**
Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

**C) Provide More Feedback**
Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

### Code Quality Standards
- [x] Follow TypeScript best practices
- [x] Add proper error handling in migrations and server actions
- [x] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
- [x] **🚨 MANDATORY: Use early returns to keep code clean and readable**
- [x] **🚨 MANDATORY: Use async/await instead of .then() chaining**
- [x] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
- [x] **🚨 MANDATORY: Create down migration files before running ANY database migration**
- [x] Ensure responsive design (mobile-first approach)
- [x] Test components in both light and dark mode
- [x] Follow accessibility guidelines (WCAG AA)
- [x] Use semantic HTML elements
- [x] **🚨 MANDATORY: Clean up removal artifacts** (no placeholder comments)

### Architecture Compliance
- [x] **✅ VERIFY: Used correct data access pattern** - Server Actions for mutations, direct queries for reads
- [x] **✅ VERIFY: No server/client boundary violations** - No new lib files created
- [x] **✅ VERIFY: Proper context usage patterns** - Not applicable (admin UI only)
- [x] **❌ AVOID: Creating unnecessary API routes** - Not creating any API routes
- [x] **❌ AVOID: Mixing server-only imports with client-safe utilities** - Not applicable

---

## 17. Notes & Additional Context

### Research Links
- Drizzle ORM Documentation: https://orm.drizzle.team/docs/overview
- Next.js Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- PostgreSQL INTEGER Type: https://www.postgresql.org/docs/current/datatype-numeric.html

### **⚠️ Common Migration Pitfalls to Avoid**

**❌ NEVER DO:**
- Run `npm run db:migrate` without creating down migration first
- Forget to set default values for NOT NULL columns (causes migration failure)
- Copy non-numeric `metadata.quantity` values to integer column without validation
- Remove `metadata.quantity` before verifying new columns work correctly

**✅ ALWAYS DO:**
- Create down migration using `drizzle_down_migration.md` template
- Test migration on development database before production
- Verify data integrity after migration (query to check all products)
- Keep data migration scripts for documentation

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** No external API contracts - admin-only feature
- [x] **Database Dependencies:** Inventory system uses separate `quantity_owned` field - no conflicts
- [x] **Component Dependencies:** Product edit dialog and variations modal updated together
- [x] **Authentication/Authorization:** No changes to auth - admin access already enforced

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** Product queries automatically include new columns (Drizzle schema)
- [x] **UI/UX Cascading Effects:** ProductRow and ProductEditDialog updated together
- [x] **State Management:** Form state updated in single component - no global state changes
- [x] **Routing Dependencies:** No route changes - existing `/admin/products` routes unchanged

#### 3. **Performance Implications**
- [x] **Database Query Impact:** Two integer columns are highly efficient - negligible impact
- [x] **Bundle Size:** No new dependencies - zero bundle size increase
- [x] **Server Load:** No additional queries - same number of database calls
- [x] **Caching Strategy:** No caching mechanism affected - admin-only UI

#### 4. **Security Considerations**
- [x] **Attack Surface:** No new attack vectors - form validation prevents invalid input
- [x] **Data Exposure:** No sensitive data - package sizes are non-confidential
- [x] **Permission Escalation:** No permission changes - admin role already required
- [x] **Input Validation:** Client and server validation prevent negative/zero values

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:** Admins see two fields instead of one - minimal learning curve
- [x] **Data Migration:** No user action required - automatic backend migration
- [x] **Feature Deprecation:** No features removed - enhancement only
- [x] **Learning Curve:** Help text and calculated total make fields self-explanatory

#### 6. **Maintenance Burden**
- [x] **Code Complexity:** Two fields more explicit than one ambiguous field - actually reduces complexity
- [x] **Dependencies:** No new third-party dependencies - zero maintenance overhead
- [x] **Testing Overhead:** Form validation and display logic need testing - moderate overhead
- [x] **Documentation:** Task document serves as comprehensive documentation

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [ ] ⚠️ **Database Migration Required** - User aware, development database migration acceptable
- [ ] **Breaking API Changes** - None - admin-only feature
- [ ] **Performance Degradation** - None - integer columns are efficient
- [ ] **Security Vulnerabilities** - None - form validation in place
- [ ] **User Data Loss** - None - migration copies existing data

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [x] **Increased Complexity** - Two fields instead of one, but clearer semantics
- [x] **New Dependencies** - None
- [x] **UI/UX Changes** - Admin UI changes minimal, help text aids understanding
- [x] **Maintenance Overhead** - Minimal - straightforward validation logic

### Mitigation Strategies

#### Database Changes
- [x] **Backup Strategy** - Development database can be wiped/recreated
- [x] **Rollback Plan** - Down migration created using `drizzle_down_migration.md` template
- [x] **Staging Testing** - Not applicable - development-only application
- [x] **Gradual Migration** - Not needed - small dataset, instant migration

#### API Changes
- [x] **Versioning Strategy** - Not applicable - no external API
- [x] **Deprecation Timeline** - Not applicable - internal admin UI
- [x] **Client Communication** - Not applicable - internal development team
- [x] **Graceful Degradation** - Not applicable - admin-only feature

#### UI/UX Changes
- [x] **Feature Flags** - Not needed - development application, instant deployment
- [x] **User Communication** - Development team aware via this task document
- [x] **Help Documentation** - Help text in form provides inline documentation
- [x] **Feedback Collection** - User can provide feedback during testing phase

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis** - All sections filled out above
- [x] **Identify Critical Issues** - No red flags, yellow flags acceptable
- [x] **Propose Mitigation** - Down migration and validation strategies in place
- [x] **Alert User** - No significant second-order impacts requiring immediate attention
- [x] **Recommend Alternatives** - Strategic analysis provided Option 1 as best approach

### Example Analysis Template

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:** None - admin-only feature with backward-compatible defaults

**Performance Implications:** Negligible - two integer columns highly efficient

**Security Considerations:** Form validation prevents invalid input (< 1), admin access already enforced

**User Experience Impacts:** Two fields instead of one, but help text and calculated total improve clarity

**Mitigation Recommendations:**
- Down migration created for safe rollback
- Form validation enforces data integrity
- Help text reduces learning curve
- Migration copies existing data safely

**✅ NO CRITICAL ISSUES REQUIRING USER ATTENTION**
All impacts are positive (clarity improvement) or negligible (performance). Safe to proceed with implementation.
```

---

*Template Version: 1.3*
*Last Updated: 12/23/2025*
*Created By: AI Task Template System*
