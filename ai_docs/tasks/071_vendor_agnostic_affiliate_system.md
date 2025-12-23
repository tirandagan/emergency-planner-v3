# Task 071: Vendor-Agnostic Affiliate URL System

## 1. Task Overview

### Task Title
**Migrate from Amazon-Specific to Dynamic Vendor Affiliate URL System**

### Goal Statement
**Goal:** Transform the current Amazon-specific affiliate link system into a flexible, vendor-agnostic affiliate URL builder that supports any affiliate program. Move affiliate configuration from global system settings to supplier-level settings, enabling each vendor to have their own affiliate ID and custom URL template with dynamic field substitution. Support product variations in URL generation by allowing users to select variation combinations when the template references variation-specific fields.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The current implementation hardcodes Amazon affiliate link generation with global system settings (`amazon_associate_id`, `amazon_affiliate_url_template`). This approach doesn't scale to multiple affiliate partners and requires code changes to support new vendors. We need a flexible system where:
- Each supplier can have unique affiliate credentials and URL templates
- URL templates support dynamic field substitution from product data
- Product variations are handled intelligently when templates reference variation fields
- No code changes are needed to add new affiliate partners

### Solution Options Analysis

#### Option 1: Supplier-Level Configuration with Dynamic Template Engine
**Approach:** Add `affiliate_id` and `affiliate_url_template` fields to the `suppliers` table. Build a template parser that replaces `{field_name}` placeholders with actual product data. Auto-detect variation field usage and prompt for variation selection when needed.

**Pros:**
- ✅ Fully vendor-agnostic - works with any affiliate program
- ✅ No code changes needed to add new affiliate partners
- ✅ Flexible template system supports any URL structure
- ✅ Intelligent variation handling based on template analysis
- ✅ Data lives with the supplier record (better data model)

**Cons:**
- ❌ Requires database migration and data transformation
- ❌ More complex template parsing logic needed
- ❌ Need to validate template syntax on save
- ❌ Variation UI logic adds modal complexity

**Implementation Complexity:** Medium - Database migration + template parser + variation UI
**Risk Level:** Low - Well-defined requirements, clear migration path

#### Option 2: Keep Global Settings + Add Supplier Override
**Approach:** Keep existing system settings as defaults, allow suppliers to override with custom templates.

**Pros:**
- ✅ Backward compatible with existing Amazon setup
- ✅ Gradual migration path

**Cons:**
- ❌ Confusing data model (two sources of truth)
- ❌ Still requires code for each new vendor type
- ❌ Doesn't fully solve scalability problem
- ❌ Technical debt accumulation

**Implementation Complexity:** Low - Minimal changes
**Risk Level:** Medium - Introduces confusion, doesn't solve root problem

#### Option 3: Hybrid Approach with Vendor-Specific Modules
**Approach:** Keep global settings but add vendor-specific code modules for each affiliate type.

**Pros:**
- ✅ Customizable per vendor

**Cons:**
- ❌ Defeats purpose of vendor-agnostic system
- ❌ Requires developer intervention for each new vendor
- ❌ Code bloat and maintenance burden

**Implementation Complexity:** Medium-High - Code per vendor
**Risk Level:** High - Scaling issues, maintenance burden

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Supplier-Level Configuration with Dynamic Template Engine

**Why this is the best choice:**
1. **True Vendor Agnosticism** - Admins can add new affiliate partners through UI configuration alone, no code changes required
2. **Better Data Architecture** - Affiliate credentials belong with supplier records, not global settings
3. **Scalability** - System naturally scales to unlimited affiliate partners
4. **Flexibility** - Template system supports any URL structure, any field combination
5. **User Experience** - Variation handling provides clear UI for complex product structures

**Key Decision Factors:**
- **Performance Impact:** Minimal - template parsing is lightweight, one-time per URL generation
- **User Experience:** Improved - clearer error messages, variation selection UX
- **Maintainability:** Excellent - no code changes for new vendors, clear data model
- **Scalability:** Unlimited affiliate partners without code changes
- **Security:** Field validation prevents injection attacks, template validation on save

**Alternative Consideration:**
Option 2 could be considered if backward compatibility was critical, but since this is a new app in active development with no production users, a clean migration is preferable to technical debt.

### Decision Request

**✅ USER DECISION APPROVED:**
Proceeding with Option 1 - Supplier-Level Configuration with Dynamic Template Engine

**Clarifications Received:**
1. **Supplier Management:** Enhance existing `/admin/suppliers` edit form with affiliate config fields
2. **Variation Handling:** Variations may not be present; if present, variation fields take precedence over main product fields
3. **Template Parsing:** Case-insensitive - normalize to lowercase during parsing
4. **Button Visibility:** Both `affiliate_id` AND `affiliate_url_template` must be present for button to appear
5. **Migration:** Amazon supplier exists in database, no conflicts expected (fields don't exist yet)
6. **Field Priority:** Variation field wins if present; fallback to main product if variation field is undefined
7. **System Settings UI:** Located at `/admin/debug` (one of the tabs)

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15+ with App Router, React 19
- **Language:** TypeScript 5+ with strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS v4
- **Authentication:** Supabase Auth managed by middleware for protected routes
- **Key Architectural Patterns:** Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Components:**
  - `components/ui/dialog.tsx` - Modal base
  - `components/ui/button.tsx` - Button styles
  - `components/ui/select.tsx` - Dropdown for variation selection
  - Admin product catalog with existing affiliate link button/modal

### Current State
**Existing Amazon Affiliate Implementation:**
- **System Settings Table:** Stores `amazon_associate_id` and `amazon_affiliate_url_template` globally
- **Utility Function:** `lib/amazon-affiliate.ts` with `buildAmazonAffiliateUrl(asin: string)`
- **Server Action:** `app/(protected)/admin/products/actions/affiliate-link-actions.ts` - generates URLs
- **UI Components:**
  - `AffiliateLinkButton.tsx` - Triggers modal (currently only for Amazon)
  - `AffiliateLinkModal.tsx` - Displays generated URL, copy/open functionality
  - `AffiliateErrorModal.tsx` - Error handling with specific error types
- **Integration:** Button appears next to supplier name in ProductRow for Amazon products only

**Database Schema (Current):**
- `suppliers` table: `id, name, contactInfo, fulfillmentType, websiteUrl, logoUrl, createdAt`
- `specific_products` table: Includes `sku, asin, name, price, productUrl, variations (JSONB), supplierId`
- `system_settings` table: Contains `amazon_associate_id` and `amazon_affiliate_url_template`

**Variation Structure (Current):**
```json
{
  "config": {
    "toggles": { "sku": true, "price": true, "quantity": false },
    "attributes": [
      { "id": "uuid", "name": "Secondary color", "options": ["Yellow", "Blue", "Grey"] }
    ]
  },
  "values": {
    "[\"Blue\"]": { "sku": "B08C4RH7HB", "price": 24.99 },
    "[\"Grey\"]": { "sku": "B08C4RH7HC", "price": 25.99 },
    "[\"Yellow\"]": { "sku": "B08C4RH7HA" }
  }
}
```

### Existing Context Providers Analysis
**Not Applicable** - This feature operates in admin context with direct database access via Server Actions. No client-side context providers needed for this functionality.

---

## 4. Context & Problem Definition

### Problem Statement
The current affiliate link system is tightly coupled to Amazon, requiring code changes to support additional affiliate partners. System settings store global configuration that doesn't scale to multiple vendors with different affiliate programs. Product variations are not handled, making it impossible to generate accurate affiliate links for products with multiple SKUs, prices, or other variant-specific data.

**Pain Points:**
1. **Vendor Lock-in:** Only Amazon is supported, requires code changes for new partners
2. **Global Configuration:** Affiliate credentials are global, not per-supplier
3. **No Variation Support:** Cannot generate URLs for specific product variations
4. **Scalability:** Adding eBay, ShareASale, or custom affiliate programs requires development work
5. **Template Inflexibility:** URL structure is hardcoded, cannot adapt to different affiliate systems

### Success Criteria
- [ ] **Suppliers table** has `affiliate_id` and `affiliate_url_template` fields (optional, not required)
- [ ] **Template validation** prevents invalid field references on supplier save
- [ ] **Dynamic URL generation** works with any supplier using template + product data
- [ ] **Variation detection** auto-identifies when template references variation fields
- [ ] **Variation selection UI** appears when variation fields are detected in template
- [ ] **Field priority** respects variation > main product for overlapping fields
- [ ] **Amazon migration** successfully transfers existing settings to Amazon supplier record
- [ ] **System settings cleanup** removes old Amazon-specific fields from UI and optionally from schema
- [ ] **Error handling** provides clear messages for missing fields, invalid variations
- [ ] **Affiliate button** works for ANY supplier with affiliate configuration, not just Amazon

---

## 5. Development Mode Context

- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements
- **FR1:** Admin can configure `affiliate_id` and `affiliate_url_template` for any supplier
- **FR2:** Template syntax `{field_name}` supports these fields:
  - From `specific_products`: `sku`, `name`, `price`, `product_url`, `asin`
  - From `suppliers`: `affiliate_id`
  - From `variations.values[combination]`: Any field present in variation records
- **FR3:** Template validation on supplier save prevents invalid field references
- **FR4:** URL generation auto-detects variation field usage by parsing template
- **FR5:** When variation fields detected, modal shows variation selection UI with attribute names/options
- **FR6:** Field resolution priority: variation fields > main product fields > supplier fields
- **FR7:** Missing variation field values show clear error: "The {field_name} is missing for variation '{combination}' for this product"
- **FR8:** Migration script transfers `amazon_associate_id` → Amazon supplier `affiliate_id`
- **FR9:** Migration script transfers `amazon_affiliate_url_template` → Amazon supplier `affiliate_url_template`
- **FR10:** Cleanup script deletes old system settings (not auto-run, manual execution only)
- **FR11:** Affiliate link button appears for ANY supplier with `affiliate_id` configured (not just Amazon)
- **FR12:** URL template prevents internal IDs (validated on save)

### Non-Functional Requirements
- **Performance:** Template parsing <10ms, URL generation <50ms total
- **Security:** Field validation prevents SQL injection, XSS attacks via template syntax
- **Usability:** Variation selection UI is clear, shows attribute names from `config.attributes`
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works with existing product catalog, no breaking changes to product data structure

### Technical Constraints
- **Must use existing Drizzle ORM** for database operations
- **Cannot break existing product import workflows** - variation structure stays the same
- **Must maintain ProductRow component performance** - no expensive operations on render
- **Template parser must be server-side only** - security and performance

---

## 7. Data & Database Changes

### Database Schema Changes

```sql
-- Add affiliate fields to suppliers table
ALTER TABLE suppliers
ADD COLUMN affiliate_id TEXT,
ADD COLUMN affiliate_url_template TEXT;

-- Add index for suppliers with affiliate configuration
CREATE INDEX idx_suppliers_affiliate_id ON suppliers(affiliate_id)
WHERE affiliate_id IS NOT NULL;

-- Note: Fields are nullable (optional) - only required for suppliers with affiliate programs
```

### Data Model Updates

```typescript
// src/db/schema/suppliers.ts
import { pgTable, text, uuid, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  contactInfo: jsonb('contact_info').$type<{
    email?: string;
    phone?: string;
    address?: string;
    contact_name?: string;
    payment_terms?: string;
    tax_id?: string;
    notes?: string;
    join_date?: string;
  }>(),
  fulfillmentType: text('fulfillment_type').notNull().default('dropship'),
  websiteUrl: text('website_url'),
  logoUrl: text('logo_url'),

  // NEW: Affiliate program configuration (optional fields)
  affiliateId: text('affiliate_id'),
  affiliateUrlTemplate: text('affiliate_url_template'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // NEW: Index for querying suppliers with affiliate programs
  affiliateIdIdx: index('idx_suppliers_affiliate_id').on(table.affiliateId),
}));

// Type for variation structure (already exists, documented here for reference)
export type ProductVariation = {
  config: {
    toggles: {
      sku?: boolean;
      price?: boolean;
      quantity?: boolean;
      processing?: boolean;
    };
    attributes: Array<{
      id: string;
      name: string;
      options: string[];
    }>;
  };
  values: {
    [combination: string]: {
      sku?: string;
      price?: number;
      quantity?: number;
      [key: string]: any;
    };
  };
};
```

### Data Migration Plan

**Phase 1: Schema Migration**
- [ ] Generate Drizzle migration for supplier table changes
- [ ] Create down migration file (MANDATORY per template)
- [ ] Apply migration to add `affiliate_id` and `affiliate_url_template` columns

**Phase 2: Data Migration (Amazon Settings → Supplier Record)**
- [ ] Create migration script: `scripts/migrate-amazon-affiliate-settings.ts`
- [ ] Script reads `amazon_associate_id` and `amazon_affiliate_url_template` from `system_settings`
- [ ] Script finds Amazon supplier record (by name = 'Amazon')
- [ ] Script updates Amazon supplier with affiliate configuration
- [ ] Script validates successful transfer
- [ ] Log migration results (success/failure, values transferred)

**Phase 3: Cleanup Script (Manual Execution Only)**
- [ ] Create cleanup script: `scripts/cleanup-amazon-system-settings.ts`
- [ ] Script deletes `amazon_associate_id` and `amazon_affiliate_url_template` from `system_settings`
- [ ] Script logs what was deleted
- [ ] **Do NOT auto-run** - requires manual execution by admin
- [ ] Provide clear instructions for when to run cleanup script

**Validation Steps:**
- [ ] Verify Amazon supplier has `affiliate_id` and `affiliate_url_template` populated
- [ ] Generate test affiliate URL for Amazon product - verify it matches old system output
- [ ] Verify cleanup script exists but hasn't run (old settings still present until manual execution)

### 🚨 MANDATORY: Down Migration Safety Protocol

- [ ] **Step 1: Generate Migration** - Run `npm run db:generate` to create the migration file
- [ ] **Step 2: Create Down Migration** - Follow `drizzle_down_migration.md` template to analyze the migration and create the rollback file
- [ ] **Step 3: Create Subdirectory** - Create `drizzle/migrations/[timestamp_name]/` directory
- [ ] **Step 4: Generate down.sql** - Create the `down.sql` file with safe rollback operations:
```sql
-- Down migration: Remove affiliate fields from suppliers table
ALTER TABLE suppliers DROP COLUMN IF EXISTS affiliate_url_template;
ALTER TABLE suppliers DROP COLUMN IF EXISTS affiliate_id;
DROP INDEX IF EXISTS idx_suppliers_affiliate_id;
```
- [ ] **Step 5: Verify Safety** - Ensure all operations use `IF EXISTS` and include appropriate warnings
- [ ] **Step 6: Apply Migration** - Only after down migration is created, run `npm run db:migrate`

---

## 8. API & Backend Changes

### Data Access Pattern

#### Mutations (Server Actions) → `app/(protected)/admin/products/actions/affiliate-link-actions.ts`
- [ ] **`generateAffiliateUrl(productId: string, supplierId: string, variationCombination?: string)`**
  - Replaces Amazon-specific function with vendor-agnostic version
  - Fetches supplier's `affiliate_id` and `affiliate_url_template`
  - Fetches product data from `specific_products`
  - If `variationCombination` provided, extracts variation-specific fields
  - Parses template and replaces `{field_name}` placeholders
  - Returns `{ success: true, url: string }` or `{ success: false, errorType, missingField }`

- [ ] **`validateAffiliateTemplate(template: string)`**
  - New server action for validating template syntax on supplier save
  - Checks for valid `{field_name}` syntax
  - Validates field names against allowed list
  - Prevents internal ID references
  - Returns `{ valid: true }` or `{ valid: false, errors: string[] }`

#### Queries (lib/ functions) → `lib/affiliate-urls.ts`
- [ ] **`parseTemplateFields(template: string): string[]`**
  - Extracts all `{field_name}` placeholders from template
  - Returns array of field names referenced in template
  - Used to detect variation field usage

- [ ] **`buildAffiliateUrl(template: string, fieldValues: Record<string, any>): string`**
  - Core template parsing logic
  - Replaces all `{field_name}` with actual values from `fieldValues`
  - URL-encodes field values automatically
  - Throws error if required field is missing

- [ ] **`getVariationFields(product: Product): string[]`**
  - Analyzes `product.variations.config.toggles` to identify active variation fields
  - Returns list of field names that exist in variation records
  - Used to detect which template fields need variation selection

- [ ] **`resolveFieldValue(fieldName: string, product: Product, supplier: Supplier, variationCombination?: string): string | null`**
  - Implements field resolution priority: variation > product > supplier
  - Returns field value or null if not found
  - Handles special case for `affiliate_id` from supplier

### Migration Scripts (One-Time Execution)
- [ ] **`scripts/migrate-amazon-affiliate-settings.ts`**
  - Server-side script (not API route, not server action)
  - Transfers Amazon affiliate configuration from system settings to supplier record
  - Run once after schema migration

- [ ] **`scripts/cleanup-amazon-system-settings.ts`**
  - Server-side script for manual execution only
  - Deletes deprecated Amazon settings from system_settings table
  - Provides clear confirmation before deletion

---

## 9. Frontend Changes

### New Components

- [ ] **`components/admin/suppliers/AffiliateConfigForm.tsx`**
  - Form fields for `affiliate_id` and `affiliate_url_template`
  - Real-time template validation using `validateAffiliateTemplate` server action
  - Shows allowed field placeholders: `{sku}`, `{asin}`, `{name}`, `{price}`, `{product_url}`, `{affiliate_id}`
  - Error display for invalid template syntax
  - Used in supplier create/edit forms

- [ ] **`components/admin/products/VariationSelector.tsx`**
  - Displays variation attributes from `config.attributes`
  - Allows selection of variation combination
  - Shows selected combination's field values
  - Highlights missing fields referenced in template
  - Returns selected combination key (e.g., `["Blue"]` or `["Large","Red"]`)

### Component Updates

- [ ] **`AffiliateLinkButton.tsx`** - [Behavior change]
  - **OLD:** Only rendered for `supplier.name === 'Amazon'`
  - **NEW:** Rendered for any supplier with `supplier.affiliateId !== null`
  - Props remain the same

- [ ] **`AffiliateLinkModal.tsx`** - [Major refactor]
  - **NEW:** Auto-detect variation fields by comparing template fields vs product variation fields
  - **NEW:** Show `VariationSelector` component when variation fields detected
  - **NEW:** Pass `variationCombination` to `generateAffiliateUrl` server action
  - **NEW:** Display missing field errors: "The {field_name} is missing for variation '{combination}'"
  - **NEW:** Show supplier name instead of hardcoded "Amazon"
  - **KEEP:** Copy to clipboard, Open Link, error handling flows

- [ ] **`AffiliateErrorModal.tsx`** - [Error type updates]
  - **NEW:** Add `missing_field` error type with `{ fieldName: string, variationCombination: string }`
  - **NEW:** Add `no_affiliate_config` error type (supplier has no affiliate setup)
  - **KEEP:** Existing `no_asin`, `invalid_template` error types
  - **REMOVE:** `no_associate_id` error type (now `no_affiliate_config`)

- [ ] **`ProductRow.tsx`** - [Conditional rendering update]
  - **OLD:** `{product.supplier?.name === 'Amazon' && <AffiliateLinkButton />}`
  - **NEW:** `{product.supplier?.affiliateId && <AffiliateLinkButton />}`

### Page Updates

- [ ] **`/admin/suppliers/[id]/edit`** - Add `AffiliateConfigForm` component
- [ ] **`/admin/suppliers/new`** - Add `AffiliateConfigForm` component
- [ ] **`/admin/debug?tab=settings`** - Remove Amazon affiliate settings UI (show deprecation notice if script hasn't run yet)

### State Management
- **Modal State:** Local state in `ProductRow` for modal visibility
- **Variation Selection:** Local state in `AffiliateLinkModal` for selected combination
- **Template Validation:** Server-side validation on form submit (no client state)
- **Data Fetching:** Server Actions for URL generation, Server Components for supplier data

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**Supplier Schema:**
```typescript
// src/db/schema/suppliers.ts
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  contactInfo: jsonb('contact_info'),
  fulfillmentType: text('fulfillment_type').notNull().default('dropship'),
  websiteUrl: text('website_url'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// No affiliate fields - affiliate config is global in system_settings
```

**Amazon-Specific URL Builder:**
```typescript
// src/lib/amazon-affiliate.ts
export async function buildAmazonAffiliateUrl(asin: string): Promise<string> {
  const [associateId, urlTemplate] = await Promise.all([
    getSystemSetting<string>('amazon_associate_id'),
    getSystemSetting<string>('amazon_affiliate_url_template'),
  ]);

  if (!associateId) {
    throw new Error('Amazon Associate ID is not configured');
  }

  const template = urlTemplate || 'https://www.amazon.com/dp/{ASIN}?tag={amazon_associate_id}';
  return template.replace('{ASIN}', asin).replace('{amazon_associate_id}', associateId);
}
```

**Amazon-Only Affiliate Button:**
```typescript
// src/app/(protected)/admin/products/components/ProductRow.tsx (line 353)
{product.supplier?.name === 'Amazon' && (
  <AffiliateLinkButton product={product} onOpenModal={() => setIsAffiliateModalOpen(true)} />
)}
```

### 📂 **After Refactor**

**Supplier Schema with Affiliate Fields:**
```typescript
// src/db/schema/suppliers.ts
export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  contactInfo: jsonb('contact_info'),
  fulfillmentType: text('fulfillment_type').notNull().default('dropship'),
  websiteUrl: text('website_url'),
  logoUrl: text('logo_url'),

  // NEW: Affiliate configuration at supplier level
  affiliateId: text('affiliate_id'),
  affiliateUrlTemplate: text('affiliate_url_template'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  affiliateIdIdx: index('idx_suppliers_affiliate_id').on(table.affiliateId),
}));
```

**Vendor-Agnostic URL Builder:**
```typescript
// src/lib/affiliate-urls.ts (NEW FILE)
export async function buildAffiliateUrl(
  supplier: Supplier,
  product: Product,
  variationCombination?: string
): Promise<string> {
  if (!supplier.affiliateId || !supplier.affiliateUrlTemplate) {
    throw new Error('Supplier has no affiliate configuration');
  }

  const templateFields = parseTemplateFields(supplier.affiliateUrlTemplate);
  const fieldValues: Record<string, any> = {};

  for (const fieldName of templateFields) {
    const value = resolveFieldValue(fieldName, product, supplier, variationCombination);
    if (value === null) {
      throw new MissingFieldError(fieldName, variationCombination);
    }
    fieldValues[fieldName] = value;
  }

  return replaceTemplatePlaceholders(supplier.affiliateUrlTemplate, fieldValues);
}

// Field resolution with variation priority
function resolveFieldValue(
  fieldName: string,
  product: Product,
  supplier: Supplier,
  variationCombination?: string
): string | null {
  // Priority 1: Variation fields (if variation combination provided)
  if (variationCombination && product.variations) {
    const variationData = product.variations.values[variationCombination];
    if (variationData && fieldName in variationData) {
      return String(variationData[fieldName]);
    }
  }

  // Priority 2: Main product fields
  if (fieldName in product) {
    return String(product[fieldName as keyof Product]);
  }

  // Priority 3: Supplier fields (affiliate_id)
  if (fieldName === 'affiliate_id') {
    return supplier.affiliateId;
  }

  return null;
}
```

**Universal Affiliate Button (All Vendors):**
```typescript
// src/app/(protected)/admin/products/components/ProductRow.tsx (line 353)
{product.supplier?.affiliateId && (
  <AffiliateLinkButton product={product} onOpenModal={() => setIsAffiliateModalOpen(true)} />
)}
```

### 🎯 **Key Changes Summary**

- [ ] **Schema Change:** Added `affiliate_id` and `affiliate_url_template` to `suppliers` table
- [ ] **Architecture Shift:** Moved from global system settings to supplier-level configuration
- [ ] **Vendor Agnostic:** Replaced Amazon-specific logic with dynamic template parser
- [ ] **Variation Support:** Added variation field detection and selection UI
- [ ] **Field Resolution:** Implemented priority system (variation > product > supplier)
- [ ] **Template Validation:** Server-side validation prevents invalid field references
- [ ] **UI Generalization:** Affiliate button now works for ANY supplier with affiliate config

**Files Modified:**
- `src/db/schema/suppliers.ts` - Added affiliate fields
- `src/lib/amazon-affiliate.ts` - Deprecated (replaced by `lib/affiliate-urls.ts`)
- `src/lib/affiliate-urls.ts` - NEW: Vendor-agnostic template engine
- `src/app/(protected)/admin/products/actions/affiliate-link-actions.ts` - Refactored for dynamic templates
- `src/app/(protected)/admin/products/components/ProductRow.tsx` - Updated button condition
- `src/app/(protected)/admin/products/components/AffiliateLinkModal.tsx` - Added variation detection/selection
- `src/app/(protected)/admin/products/components/AffiliateErrorModal.tsx` - Updated error types
- `src/components/admin/suppliers/AffiliateConfigForm.tsx` - NEW: Supplier affiliate configuration UI

**Impact:** This change enables unlimited affiliate partners without code changes, improves data architecture, and supports complex product variation scenarios.

---

## 11. Implementation Plan

### Phase 1: Database Schema & Migration
**Goal:** Add affiliate fields to suppliers table and migrate Amazon configuration

- [ ] **Task 1.1:** Update Supplier Schema
  - Files: `src/db/schema/suppliers.ts`
  - Details: Add `affiliateId` and `affiliateUrlTemplate` text fields with index

- [ ] **Task 1.2:** Generate Database Migration
  - Command: `npm run db:generate`
  - Details: Generate migration SQL for supplier table changes

- [ ] **Task 1.3:** Create Down Migration (MANDATORY)
  - Files: `drizzle/migrations/[timestamp]/down.sql`
  - Details: Follow `drizzle_down_migration.md` template for safe rollback

- [ ] **Task 1.4:** Apply Migration
  - Command: `npm run db:migrate`
  - Details: Apply schema changes to database

- [ ] **Task 1.5:** Create Amazon Settings Migration Script
  - Files: `scripts/migrate-amazon-affiliate-settings.ts`
  - Details: Transfer `amazon_associate_id` and `amazon_affiliate_url_template` from system_settings to Amazon supplier record

- [ ] **Task 1.6:** Run Amazon Migration Script
  - Command: `npx tsx scripts/migrate-amazon-affiliate-settings.ts`
  - Details: Execute one-time data transfer, log results

- [ ] **Task 1.7:** Create System Settings Cleanup Script
  - Files: `scripts/cleanup-amazon-system-settings.ts`
  - Details: Script to delete old Amazon settings (NOT auto-executed)

### Phase 2: Core Template Engine & URL Builder
**Goal:** Build vendor-agnostic template parser and URL generation logic

- [ ] **Task 2.1:** Create Template Parsing Utilities
  - Files: `src/lib/affiliate-urls.ts`
  - Details: `parseTemplateFields()`, `buildAffiliateUrl()`, `resolveFieldValue()`, `getVariationFields()`

- [ ] **Task 2.2:** Create Template Validation Logic
  - Files: `src/lib/affiliate-urls.ts`
  - Details: `validateTemplateFields()` - checks for allowed field names, prevents internal IDs

- [ ] **Task 2.3:** Update Server Action for Dynamic Templates
  - Files: `src/app/(protected)/admin/products/actions/affiliate-link-actions.ts`
  - Details: Replace Amazon-specific logic with dynamic template-based URL generation

- [ ] **Task 2.4:** Add Template Validation Server Action
  - Files: `src/app/(protected)/admin/products/actions/affiliate-link-actions.ts`
  - Details: `validateAffiliateTemplate()` server action for supplier form validation

### Phase 3: Variation Detection & Selection UI
**Goal:** Implement variation field detection and user selection interface

- [ ] **Task 3.1:** Create Variation Selector Component
  - Files: `src/components/admin/products/VariationSelector.tsx`
  - Details: Display variation attributes, allow combination selection, show field values

- [ ] **Task 3.2:** Update Affiliate Link Modal for Variations
  - Files: `src/app/(protected)/admin/products/components/AffiliateLinkModal.tsx`
  - Details: Auto-detect variation fields, conditionally show VariationSelector, pass combination to server action

- [ ] **Task 3.3:** Add Missing Field Error Handling
  - Files: `src/app/(protected)/admin/products/components/AffiliateErrorModal.tsx`
  - Details: New error type for missing variation fields with clear messaging

### Phase 4: Supplier Affiliate Configuration UI
**Goal:** Add affiliate configuration to supplier management interface

- [ ] **Task 4.1:** Create Affiliate Config Form Component
  - Files: `src/components/admin/suppliers/AffiliateConfigForm.tsx`
  - Details: Form inputs for affiliate_id and affiliate_url_template with real-time validation

- [ ] **Task 4.2:** Integrate into Supplier Create/Edit Pages
  - Files: `src/app/(protected)/admin/suppliers/[id]/edit/page.tsx`, `src/app/(protected)/admin/suppliers/new/page.tsx`
  - Details: Add AffiliateConfigForm to supplier forms

### Phase 5: Update Existing Components for Vendor Agnosticism
**Goal:** Remove Amazon-specific logic and enable universal affiliate button

- [ ] **Task 5.1:** Update ProductRow Affiliate Button Condition
  - Files: `src/app/(protected)/admin/products/components/ProductRow.tsx`
  - Details: Change from `supplier.name === 'Amazon'` to `supplier.affiliateId !== null`

- [ ] **Task 5.2:** Update Affiliate Link Modal Generics
  - Files: `src/app/(protected)/admin/products/components/AffiliateLinkModal.tsx`
  - Details: Remove hardcoded "Amazon" text, use supplier.name dynamically

- [ ] **Task 5.3:** Update Error Modal for New Error Types
  - Files: `src/app/(protected)/admin/products/components/AffiliateErrorModal.tsx`
  - Details: Update error configurations for `no_affiliate_config`, `missing_field` errors

### Phase 6: System Settings Cleanup & Documentation
**Goal:** Remove deprecated Amazon-specific UI and update documentation

- [ ] **Task 6.1:** Remove Amazon Settings from System Settings UI
  - Files: `src/app/(protected)/admin/debug/components/SettingsTab.tsx` (or equivalent)
  - Details: Remove UI for `amazon_associate_id` and `amazon_affiliate_url_template`

- [ ] **Task 6.2:** Update Documentation
  - Files: `docs/amazon-affiliate-integration.md`
  - Details: Rename to `docs/vendor-affiliate-integration.md`, update for vendor-agnostic system

- [ ] **Task 6.3:** Add Migration Instructions
  - Files: `docs/vendor-affiliate-integration.md`
  - Details: Document cleanup script execution: `npx tsx scripts/cleanup-amazon-system-settings.ts`

### Phase 7: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 7.1:** Code Quality Verification
  - Command: `npm run lint`
  - Details: Lint all modified files for code quality

- [ ] **Task 7.2:** Type Checking
  - Command: `npx tsc --noEmit`
  - Details: Verify TypeScript types compile correctly

- [ ] **Task 7.3:** Static Logic Review
  - Files: All modified business logic files
  - Details: Review template parser, field resolution, variation detection logic

### Phase 8: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 8.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [ ] **Task 8.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 9: User Testing (Only After Code Review)
**Goal:** Admin manually tests affiliate configuration and URL generation

- [ ] **Task 9.1 (👤 USER TESTING):** Configure Affiliate Settings for Amazon
  - Action: Navigate to Amazon supplier edit page, verify affiliate fields present
  - Action: Verify existing Amazon affiliate_id and template were migrated successfully

- [ ] **Task 9.2 (👤 USER TESTING):** Test URL Generation for Simple Product
  - Action: Click affiliate button on Amazon product without variations
  - Action: Verify URL generates correctly with {asin} and {affiliate_id} replaced

- [ ] **Task 9.3 (👤 USER TESTING):** Test Variation Selection UI
  - Action: Click affiliate button on product with variations where template references variation field
  - Action: Verify VariationSelector appears, select combination, generate URL

- [ ] **Task 9.4 (👤 USER TESTING):** Test Missing Field Error
  - Action: Create test product variation with missing field referenced in template
  - Action: Verify clear error message: "The {field_name} is missing for variation '{combination}'"

- [ ] **Task 9.5 (👤 USER TESTING):** Test Template Validation
  - Action: Try to save supplier with invalid template (e.g., `{invalid_field}`)
  - Action: Verify validation error prevents save

- [ ] **Task 9.6 (👤 USER TESTING):** Test New Vendor Configuration
  - Action: Add new supplier (e.g., eBay) with custom affiliate_id and template
  - Action: Verify affiliate button appears for eBay products
  - Action: Verify URL generation works with eBay template

- [ ] **Task 9.7 (👤 USER TESTING):** Run Cleanup Script
  - Action: Execute `npx tsx scripts/cleanup-amazon-system-settings.ts`
  - Action: Verify old Amazon settings removed from system_settings table
  - Action: Verify affiliate links still work (data now in supplier record)

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── src/
│   ├── lib/
│   │   └── affiliate-urls.ts              # NEW: Vendor-agnostic template engine
│   ├── components/
│   │   └── admin/
│   │       ├── products/
│   │       │   └── VariationSelector.tsx  # NEW: Variation combination selector
│   │       └── suppliers/
│   │           └── AffiliateConfigForm.tsx # NEW: Affiliate config form fields
│   └── db/
│       └── schema/
│           └── suppliers.ts               # MODIFIED: Add affiliate fields
├── scripts/
│   ├── migrate-amazon-affiliate-settings.ts  # NEW: One-time migration script
│   └── cleanup-amazon-system-settings.ts     # NEW: Manual cleanup script
└── drizzle/
    └── migrations/
        └── [timestamp]_add_supplier_affiliate_fields/
            ├── up.sql                      # AUTO-GENERATED
            └── down.sql                    # MANUAL: Down migration
```

### Files to Modify
- [ ] **`src/db/schema/suppliers.ts`** - Add `affiliateId` and `affiliateUrlTemplate` fields
- [ ] **`src/app/(protected)/admin/products/actions/affiliate-link-actions.ts`** - Replace Amazon logic with dynamic template system
- [ ] **`src/app/(protected)/admin/products/components/ProductRow.tsx`** - Update affiliate button condition
- [ ] **`src/app/(protected)/admin/products/components/AffiliateLinkModal.tsx`** - Add variation detection and selection
- [ ] **`src/app/(protected)/admin/products/components/AffiliateErrorModal.tsx`** - Update error types
- [ ] **`src/app/(protected)/admin/suppliers/[id]/edit/page.tsx`** - Add affiliate config form
- [ ] **`src/app/(protected)/admin/suppliers/new/page.tsx`** - Add affiliate config form
- [ ] **`src/app/(protected)/admin/debug/components/SettingsTab.tsx`** - Remove Amazon settings UI
- [ ] **`docs/amazon-affiliate-integration.md`** - Rename and update for vendor-agnostic system

### Files to Deprecate (Not Delete)
- [ ] **`src/lib/amazon-affiliate.ts`** - Mark as deprecated, add comment pointing to `lib/affiliate-urls.ts`

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze

- [ ] **Error Scenario 1:** Template references field that doesn't exist in product or supplier
  - **Code Review Focus:** `lib/affiliate-urls.ts` - `resolveFieldValue()` function
  - **Potential Fix:** Return clear error message: "Template field {field_name} not found in product data"

- [ ] **Error Scenario 2:** Variation combination has missing field value (null/undefined)
  - **Code Review Focus:** `lib/affiliate-urls.ts` - variation field resolution logic
  - **Potential Fix:** Detect null values and show error: "The {field_name} is missing for variation '{combination}'"

- [ ] **Error Scenario 3:** Product has no variations but template references variation-only field
  - **Code Review Focus:** `AffiliateLinkModal.tsx` - variation detection logic
  - **Potential Fix:** Show error: "Product has no variations but template requires variation-specific data"

- [ ] **Error Scenario 4:** Template has malformed placeholder syntax (e.g., `{field_name` without closing brace)
  - **Code Review Focus:** `lib/affiliate-urls.ts` - `parseTemplateFields()` regex pattern
  - **Potential Fix:** Validation rejects templates with invalid syntax before save

### Edge Cases to Consider

- [ ] **Edge Case 1:** Product has multiple variation attributes (e.g., Size + Color)
  - **Analysis Approach:** Test `VariationSelector.tsx` with multi-attribute variations
  - **Recommendation:** Show all attributes, build combination key correctly (e.g., `["Large","Red"]`)

- [ ] **Edge Case 2:** Field exists in both variation and main product with different values
  - **Analysis Approach:** Verify `resolveFieldValue()` priority system (variation wins)
  - **Recommendation:** Document priority behavior clearly in code comments

- [ ] **Edge Case 3:** Supplier has `affiliate_id` but no `affiliate_url_template`
  - **Analysis Approach:** Check validation in `AffiliateConfigForm.tsx`
  - **Recommendation:** Require both fields if either is present (paired validation)

- [ ] **Edge Case 4:** Template includes special characters that need URL encoding
  - **Analysis Approach:** Review URL encoding in `buildAffiliateUrl()`
  - **Recommendation:** Use `encodeURIComponent()` for all field values

### Security & Access Control Review

- [ ] **Template Injection Prevention:** Validate template fields against whitelist on save
  - **Check:** `validateTemplateFields()` function in `lib/affiliate-urls.ts`
  - **Risk:** Admin could inject arbitrary fields, potentially exposing internal data

- [ ] **SQL Injection via Template:** Ensure field values are properly escaped
  - **Check:** All database queries use parameterized statements (Drizzle ORM handles this)
  - **Risk:** Low - Drizzle ORM provides protection

- [ ] **XSS via Generated URLs:** URL field values must be properly encoded
  - **Check:** `buildAffiliateUrl()` uses `encodeURIComponent()` for all dynamic values
  - **Risk:** Medium - user-controlled data in URLs could lead to XSS if not encoded

- [ ] **Admin-Only Access:** Affiliate configuration should only be accessible to admin users
  - **Check:** Supplier edit pages require admin role (check route protection middleware)
  - **Risk:** Low - admin routes already protected

---

## 15. Deployment & Configuration

### Environment Variables
No new environment variables required - affiliate configuration is stored in database.

### Post-Deployment Steps
1. **Run Amazon Migration Script:**
   ```bash
   npx tsx scripts/migrate-amazon-affiliate-settings.ts
   ```
   Expected output: "Successfully migrated Amazon affiliate settings to supplier record"

2. **Verify Amazon Affiliate Links Still Work:**
   - Navigate to `/admin/products`
   - Find Amazon product
   - Click affiliate button
   - Verify URL generates correctly

3. **Run Cleanup Script (Manual):**
   ```bash
   npx tsx scripts/cleanup-amazon-system-settings.ts
   ```
   Expected output: "Deleted 2 deprecated settings: amazon_associate_id, amazon_affiliate_url_template"

4. **Test New Vendor Configuration:**
   - Create new supplier or edit existing non-Amazon supplier
   - Add affiliate_id and affiliate_url_template
   - Verify affiliate button appears for products from that supplier
   - Test URL generation

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
**User has already reviewed and approved the strategic analysis (Option 1 recommended).**

### Communication Preferences
- [ ] Ask for clarification if implementation details are unclear
- [ ] Provide regular progress updates after each phase
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW

**👤 IMPLEMENTATION OPTIONS:**

**A) Preview High-Level Code Changes**
Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

**B) Proceed with Implementation**
Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

**C) Provide More Feedback**
Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

### Code Quality Standards
- [ ] Follow TypeScript best practices with explicit return types
- [ ] Add professional comments explaining business logic (not change history)
- [ ] Use early returns to keep code clean and readable
- [ ] Use async/await instead of .then() chaining
- [ ] NO FALLBACK BEHAVIOR - throw errors for unexpected formats
- [ ] Create down migration files before running ANY database migration
- [ ] Ensure responsive design (mobile-first with Tailwind breakpoints)
- [ ] Test components in both light and dark mode
- [ ] Follow accessibility guidelines (WCAG AA)
- [ ] Clean up removal artifacts (no placeholder comments)

### Architecture Compliance
- [ ] Mutations → Server Actions (`app/actions/`)
- [ ] Complex queries → lib functions (`lib/`)
- [ ] No API routes unless webhooks/file exports
- [ ] No server/client boundary violations in lib files
- [ ] Template parser is server-side only (security critical)

---

## 17. Notes & Additional Context

### Template Field Whitelist
**Allowed Fields (Validated on Save):**
- From `specific_products`: `sku`, `name`, `price`, `product_url`, `asin`
- From `suppliers`: `affiliate_id`
- From `variations.values[combination]`: Any field present in variation record that matches toggles (e.g., `sku`, `price`)

**Blocked Fields (Security):**
- Internal IDs: `id`, `masterItemId`, `supplierId`, `categoryId`
- Timestamps: `createdAt`, `updatedAt`
- System fields: `status`, `type`, `embedding`

### Example Templates for Different Vendors

**Amazon:**
```
https://www.amazon.com/dp/{asin}?tag={affiliate_id}&linkCode=ll1
```

**eBay Partner Network:**
```
https://rover.ebay.com/rover/1/{affiliate_id}/0?mpre=https://www.ebay.com/itm/{sku}
```

**ShareASale (custom merchant):**
```
https://shareasale.com/r.cfm?b={product_id}&u={affiliate_id}&m={merchant_id}
```

### Variation Combination Key Format
Variation combinations are stored as JSON-stringified arrays:
- Single attribute: `["Blue"]`
- Multiple attributes: `["Large", "Red"]`
- Order matches `config.attributes` array order

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No breaking changes - affiliate URL generation is internal admin feature
- [ ] **Database Dependencies:** Supplier schema change is additive (nullable fields) - no breaking changes
- [ ] **Component Dependencies:** `AffiliateLinkButton` condition change affects `ProductRow` but logic is compatible
- [ ] **Authentication/Authorization:** No impact - admin-only feature remains admin-only

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** Affiliate data now flows from supplier record instead of system settings (positive change)
- [ ] **UI/UX Cascading Effects:** Affiliate button will appear for MORE suppliers (positive UX improvement)
- [ ] **State Management:** No impact - local state only
- [ ] **Routing Dependencies:** No routing changes

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** New index on `suppliers.affiliate_id` improves query performance for suppliers with affiliate programs
- [ ] **Bundle Size:** Minimal increase - new components are admin-only, code-split automatically
- [ ] **Server Load:** Template parsing is lightweight (<10ms) - negligible impact
- [ ] **Caching Strategy:** No caching changes needed - URL generation is on-demand

#### 4. **Security Considerations**
- [ ] **Attack Surface:** Template injection risk mitigated by field whitelist validation on save
- [ ] **Data Exposure:** No sensitive data exposure - field whitelist blocks internal IDs
- [ ] **Permission Escalation:** No risk - admin-only feature with existing route protection
- [ ] **Input Validation:** Template validation on supplier save prevents invalid/malicious templates

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** Minimal - Amazon users see same affiliate button behavior
- [ ] **Data Migration:** Transparent - existing Amazon configuration migrated automatically
- [ ] **Feature Deprecation:** System settings UI removed but functionality preserved in supplier records
- [ ] **Learning Curve:** Slightly increased - admins need to configure affiliate settings per supplier

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Reduced - removed Amazon-specific hardcoding, replaced with generic template engine
- [ ] **Dependencies:** No new third-party dependencies
- [ ] **Testing Overhead:** Moderate - variation logic adds test complexity
- [ ] **Documentation:** Requires documentation update (planned in Phase 6)

### Critical Issues Identification

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Migration Risk:** One-time migration script must be tested carefully
  - **Mitigation:** Script includes validation and logging, manual cleanup script (not auto-run)
- [ ] **Template Validation Complexity:** Field whitelist must be maintained as product schema evolves
  - **Mitigation:** Centralized whitelist in code, clear error messages for invalid fields
- [ ] **Variation UI Complexity:** Multi-attribute variations could be confusing
  - **Mitigation:** Show attribute names from config, clear field value display

### Mitigation Strategies

#### Database Changes
- [ ] **Backup Strategy:** Database backups standard practice (not specific to this task)
- [ ] **Rollback Plan:** Down migration file created (MANDATORY per template)
- [ ] **Staging Testing:** Test migration script in development environment before production
- [ ] **Gradual Migration:** Amazon settings migrated first, other suppliers added incrementally

#### API Changes
- [ ] **No API changes** - this is admin UI feature only

#### UI/UX Changes
- [ ] **Feature Flags:** Not needed - additive changes (button appears for more suppliers)
- [ ] **User Communication:** Documentation update includes new vendor configuration instructions
- [ ] **Help Documentation:** Update affiliate integration guide (planned in Phase 6)
- [ ] **Feedback Collection:** Monitor admin usage patterns after deployment

### AI Agent Checklist

Before presenting the task document to the user:
- [x] **Complete Impact Analysis:** Filled out all sections of the impact assessment
- [x] **Identify Critical Issues:** Flagged yellow flag items (migration risk, template complexity)
- [x] **Propose Mitigation:** Suggested specific mitigation strategies
- [x] **Alert User:** Clearly communicated significant impacts in this section
- [x] **Recommend Alternatives:** Strategic analysis presented options (Option 1 recommended and approved)

### Second-Order Impact Summary

**🔍 SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- None - all changes are additive or backward-compatible migrations

**Performance Implications:**
- Template parsing adds <10ms per URL generation (negligible)
- New database index improves supplier query performance

**Security Considerations:**
- Template injection risk mitigated by field whitelist validation
- URL encoding prevents XSS via generated URLs
- Admin-only access already enforced by route middleware

**User Experience Impacts:**
- Positive: Affiliate button now works for ANY vendor (scalability)
- Neutral: Amazon users see same behavior (transparent migration)
- Slightly increased complexity: Per-supplier configuration vs. global settings

**Mitigation Recommendations:**
- Test migration script thoroughly in development environment
- Create down migration file before applying schema changes (MANDATORY)
- Document cleanup script execution for post-deployment
- Update affiliate integration documentation with vendor-agnostic examples

**🎉 USER ATTENTION:**
This migration enables unlimited affiliate partners without code changes. The one-time migration script will transfer existing Amazon configuration automatically. After verifying affiliate links work, you'll manually run the cleanup script to remove deprecated system settings.

---

*Task Document Version: 1.0*
*Created: 2025-12-22*
*Next Task Number: 072*
