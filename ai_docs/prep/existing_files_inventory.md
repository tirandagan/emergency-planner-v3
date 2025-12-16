# Existing Files Inventory - Emergency Planner v2
**Generated:** December 9, 2025  
**Purpose:** Reference document for safe file cleanup during frontend rebuild

---

## 🎯 Inventory Strategy

This document catalogs ALL existing files and categorizes them into:
- **PRESERVE** - Critical backend/admin functionality and database models (DO NOT DELETE)
- **REMOVE LATER** - Old frontend components and routes (safe to delete after new frontend is built)
- **EVALUATE** - Files that need case-by-case evaluation during migration

**CRITICAL:** Never delete anything that could corrupt the Supabase database or break admin functionality.

---

## 🔒 PRESERVE - Admin Backend & Database (DO NOT DELETE)

### Database & Data Models

**Drizzle ORM Layer (NEW - Phase 0)**
- `src/db/index.ts` - Drizzle client initialization (NEW - replaces Supabase client for queries)
- `src/db/schema/` - Drizzle schema definitions (NEW)
  - `src/db/schema/users.ts` - User and profile tables
  - `src/db/schema/products.ts` - Product catalog tables
  - `src/db/schema/bundles.ts` - Bundle and bundle_items tables
  - `src/db/schema/categories.ts` - Category hierarchy tables
  - `src/db/schema/suppliers.ts` - Vendor/supplier tables
  - `src/db/schema/mission-reports.ts` - Mission reports and related tables
  - `src/db/schema/inventory.ts` - Inventory tracking tables
  - `src/db/schema/subscriptions.ts` - Subscription and billing tables
- `src/db/queries/` - Type-safe query functions (NEW)
  - `src/db/queries/users.ts` - User queries (replaces `db.getUserProfile()` etc.)
  - `src/db/queries/products.ts` - Product queries (replaces `db.getProducts()` etc.)
  - `src/db/queries/bundles.ts` - Bundle queries
  - `src/db/queries/categories.ts` - Category queries
  - `src/db/queries/suppliers.ts` - Supplier queries
  - `src/db/queries/mission-reports.ts` - Mission report queries
  - `src/db/queries/inventory.ts` - Inventory queries
  - `src/db/queries/analytics.ts` - Analytics and metrics queries
- `drizzle.config.ts` - Drizzle configuration (NEW - root level)
- `drizzle/` - Drizzle migrations directory (NEW - root level)

**Authentication Layer (Supabase Auth - PRESERVE)**
- `src/lib/supabaseClient.ts` - Supabase client (for auth only)
- `src/lib/supabaseAdmin.ts` - Supabase admin client (for auth only)
- `src/utils/supabase/server.ts` - Server-side Supabase utilities (for auth/session)
- `src/utils/supabase/middleware.ts` - Supabase middleware for auth

**Legacy Database Layer (REMOVE in Phase 4)**
- `src/lib/db.ts` - Old Supabase query layer (REPLACE with Drizzle in Phase 0)

**Type Definitions (PRESERVE and enhance)**
- `src/types.ts` - Core type definitions (User, Product, SupplyItem, KitItem, Route, etc.)
  - Note: Drizzle will generate types from schema, but keep this for backwards compatibility during migration
- `src/types/paapi5-nodejs-sdk.d.ts` - Amazon Product API type definitions

**Service Layer**
- `src/lib/masterItemService.ts` - Master item CRUD operations
- `src/lib/categoryService.ts` - Category management operations
- `src/lib/embeddings.ts` - Semantic embedding generation for product matching
- `src/lib/amazon-paapi.ts` - Amazon Product Advertising API integration
- `src/lib/decodo.ts` - Decodo API integration (product data)
- `src/lib/scraper.ts` - Web scraping utilities
- `src/lib/googleMaps.ts` - Google Maps API integration

### Admin Backend Actions & Routes

**Admin Server Actions** (Backend logic - PRESERVE)
- `src/app/admin/actions.ts` - Core admin operations
- `src/app/admin/bundles/actions.ts` - Bundle management operations
- `src/app/admin/products/actions.ts` - Product catalog operations
- `src/app/admin/suppliers/actions.ts` - Vendor/supplier management operations
- `src/app/admin/import/actions.ts` - Import operations (CSV, bulk)
- `src/app/admin/debug/actions.ts` - Debug/testing operations

**Admin API Routes**
- `src/app/api/search/route.ts` - Search API endpoint
- `src/app/api/amazon/product/route.ts` - Amazon product lookup endpoint

**Admin Constants & Config**
- `src/app/admin/products/constants.ts` - Product catalog constants
- `src/lib/adminAuth.ts` - Admin authentication utilities

### Admin Frontend Components (Preserve functionality, restyle)

**Admin Layout & Shell**
- `src/app/admin/layout.tsx` - Admin layout wrapper (restyle with Trust Blue)
- `src/app/admin/AdminShell.tsx` - Admin navigation shell (restyle with Trust Blue)
- `src/app/admin/page.tsx` - Admin dashboard homepage (restyle)

**Admin Pages** (Preserve functionality, restyle with Trust Blue)
- `src/app/admin/bundles/page.tsx` - Bundle manager (Server Component)
- `src/app/admin/bundles/page.client.tsx` - Bundle manager (Client Component)
- `src/app/admin/products/page.tsx` - Product catalog (Server Component)
- `src/app/admin/products/page.client.tsx` - Product catalog (Client Component)
- `src/app/admin/categories/page.tsx` - Category management
- `src/app/admin/suppliers/page.tsx` - Vendor/supplier management (Server Component)
- `src/app/admin/suppliers/page.client.tsx` - Vendor/supplier management (Client Component)
- `src/app/admin/import/page.tsx` - Import tools (Server Component)
- `src/app/admin/import/page.client.tsx` - Import tools (Client Component)
- `src/app/admin/approvals/page.tsx` - Approval workflow (if implemented)
- `src/app/admin/debug/page.tsx` - Debug tools

**Admin Reusable Components** (Preserve logic, restyle with Trust Blue)
- `src/app/admin/bundles/components/MultiSelectPills.tsx`
- `src/app/admin/bundles/components/CompactTagFilter.tsx`
- `src/app/admin/products/components/AddProductChoiceModal.tsx`
- `src/app/admin/products/components/TagSelector.tsx`
- `src/app/admin/products/components/MasterItemModal.tsx`
- `src/app/admin/products/components/ProductCatalogFilter.tsx`
- `src/app/admin/products/components/VariationsTable.tsx`
- `src/app/admin/products/components/SupplierModal.tsx`
- `src/app/admin/products/components/VariationsTableModal.tsx`
- `src/app/admin/products/components/CompactCategoryTreeSelector.tsx`
- `src/app/admin/products/components/AmazonSearchDialog.tsx`
- `src/app/admin/products/components/VariationsModal.tsx`
- `src/app/admin/products/components/InheritanceWarningModal.tsx`
- `src/app/admin/products/components/ProductEditDialog.tsx`
- `src/app/admin/products/components/ProductFormElements.tsx`
- `src/app/admin/products/components/AddToBundleModal.tsx`
- `src/app/admin/products/modals/ProductSearchModal.tsx`
- `src/app/admin/products/modals/DuplicateProductWarningModal.tsx`
- `src/app/admin/products/modals/DecodoErrorModal.tsx`

**Note:** All admin components above should have their functionality preserved but be restyled to use:
- Trust Blue theme (HSL 220, 85%, 55%)
- shadcn/ui components (consistent with new frontend)
- Modern responsive design patterns
- Maintain existing modal patterns, popup logic, and data flow

---

## 🗑️ REMOVE LATER - Old Frontend (Safe to delete after new frontend is built)

### Old User-Facing Components

**Legacy User Components** (Will be completely replaced)
- `src/components/Planner.tsx` - Old plan generator (replace with new multi-step wizard)
- `src/components/Dashboard.tsx` - Old dashboard (replace with new mission dashboard)
- `src/components/Store.tsx` - Old store/marketplace (replace with new bundle system)
- `src/components/MissionReport.tsx` - Old mission report view (replace with new plan details)
- `src/components/SaveReportModal.tsx` - Old save modal (replace with new UI)
- `src/components/MapComponent.tsx` - Old map component (evaluate - may have useful logic)
- `src/components/CriticalSkills.tsx` - Old skills display (replace with new skills training page)
- `src/components/Charts.tsx` - Old chart components (replace with new readiness dashboard charts)
- `src/components/Hero.tsx` - Old landing page hero (replace with new landing page)
- `src/components/Navbar.tsx` - Old navigation (replace with new responsive sidebar)
- `src/components/Footer.tsx` - Old footer (replace with new footer)
- `src/components/Login.tsx` - Old login component (replace with new auth flow)
- `src/components/AdminPanel.tsx` - Old admin panel (if different from new admin shell)

### Old User-Facing Routes

**Legacy App Routes** (Will be replaced with new structure)
- `src/app/page.tsx` - Current landing page (replace)
- `src/app/planner/page.tsx` - Old planner route (replace with `/plans/new`)
- `src/app/planner/report/page.tsx` - Old report route (replace with `/plans/[planId]`)
- `src/app/dashboard/page.tsx` - Old dashboard route (replace with new `/dashboard`)
- `src/app/store/page.tsx` - Old store route (replace with `/bundles`)
- `src/app/login/page.tsx` - Old login route (replace with `/auth/login`)
- `src/app/about/page.tsx` - Old about page (evaluate - may not be needed)

### Legacy Utilities & Context

**User-Facing Utilities** (Evaluate during migration)
- `src/components/LocationAutocomplete.tsx` - Location picker (evaluate - may reuse logic)
- `src/context/AuthContext.tsx` - Old auth context (evaluate - may need refactoring for new auth)
- `src/data/loadingTips.ts` - Loading screen tips (evaluate - may reuse for plan generation)

---

## ⚖️ EVALUATE - Case-by-Case Assessment

### Authentication & Session Management

**Files to Evaluate**
- `src/actions/auth.ts` - Auth actions (may need refactoring for new auth flow)
- `src/actions/dev.ts` - Dev/testing actions (evaluate if still needed)
- `src/app/actions.ts` - Generic actions (evaluate what's needed)
- `src/app/auth/callback/page.tsx` - OAuth callback (preserve if using OAuth)

**Decision Criteria:**
- If current auth uses Supabase Auth → preserve and adapt
- If switching auth systems → refactor but preserve user data migration logic

### Shared Utilities

**Files to Evaluate**
- `src/lib/utils.ts` - Utility functions (evaluate what's needed, likely preserve some)
- `src/proxy.ts` - Proxy configuration (evaluate if needed for new setup)

**Decision Criteria:**
- Keep utility functions that are framework-agnostic
- Remove utilities tightly coupled to old frontend

### UI Components Library

**Current shadcn/ui Components** (PRESERVE - needed for new frontend)
- `src/components/ui/checkbox.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/switch.tsx`

**Note:** These are the foundation for the new UI. Will need to add more shadcn components:
- Button, Input, Card, Dialog, Dropdown, Tabs, etc.

### Root Layout & Configuration

**Files to Evaluate**
- `src/app/layout.tsx` - Root layout (preserve but update for new design)
- `src/app/globals.css` - Global styles (preserve but update with Trust Blue theme - already updated)
- `src/app/favicon.ico` - Favicon (preserve)
- `src/app/apple-icon.png` - Apple icon (preserve)

**Decision Criteria:**
- Layout structure: Preserve but update styling and meta tags
- Globals CSS: Already updated with Trust Blue theme
- Icons: Keep existing unless replaced with new branding

---

## 📁 Directory Structure Summary

### Directories to PRESERVE

```
src/
├── lib/                          # PRESERVE - All database & service layer
├── utils/supabase/               # PRESERVE - Supabase utilities
├── app/admin/                    # PRESERVE - All admin backend + restyle frontend
├── app/api/                      # PRESERVE - API routes
├── types/                        # PRESERVE - Type definitions
└── types.ts                      # PRESERVE - Core types
```

### Directories to REMOVE LATER

```
src/
├── components/                   # REMOVE (except /ui/ folder)
│   ├── Planner.tsx              # Delete after new plan generator built
│   ├── Dashboard.tsx            # Delete after new dashboard built
│   ├── Store.tsx                # Delete after new bundle system built
│   ├── MissionReport.tsx        # Delete after new plan details built
│   ├── Hero.tsx                 # Delete after new landing page built
│   ├── Navbar.tsx               # Delete after new navigation built
│   ├── Footer.tsx               # Delete after new footer built
│   └── ...                      # All old user-facing components
├── app/planner/                 # REMOVE - Old planner routes
├── app/dashboard/               # REMOVE - Old dashboard route
├── app/store/                   # REMOVE - Old store route
└── app/login/                   # REMOVE - Old login route
```

### Directories to EVALUATE

```
src/
├── context/                      # EVALUATE - AuthContext may need refactor
├── actions/                      # EVALUATE - Some may be reusable
└── data/                         # EVALUATE - Loading tips may be reused
```

---

## 🔄 Migration Strategy

### Phase 0: Drizzle ORM Setup (FIRST - Before Frontend Rebuild)
**Critical:** Set up Drizzle ORM before building new features to avoid double migration work.

1. **Install Drizzle dependencies**
   ```bash
   npm install drizzle-orm postgres
   npm install -D drizzle-kit
   ```

2. **Create Drizzle schema files** (`src/db/schema/`)
   - Map existing Supabase tables to Drizzle schema
   - Preserve all table structures and relationships
   - Use existing database - don't recreate tables

3. **Create Drizzle config** (`drizzle.config.ts`)
   - Point to existing Supabase PostgreSQL connection
   - Configure migrations directory

4. **Create new database layer** (`src/db/`)
   - `src/db/index.ts` - Drizzle client initialization
   - `src/db/queries/` - Type-safe query functions
   - Replace `src/lib/db.ts` Supabase queries with Drizzle queries

5. **Migrate existing admin queries** (one table at a time)
   - Start with simple tables (categories, suppliers)
   - Test admin functions after each table migration
   - Preserve exact same functionality
   - Keep `src/lib/db.ts` as fallback during migration

6. **Migrate authentication queries**
   - Keep Supabase Auth for authentication (common pattern)
   - Use Drizzle for profiles/user data queries
   - Maintain session management with Supabase

7. **Test all admin operations** before proceeding
   - Bundle creation/editing
   - Product management
   - Category management
   - Vendor management
   - Ensure no data corruption

**Why Phase 0 comes first:**
- Avoid migrating old frontend code to Drizzle unnecessarily
- New frontend will use Drizzle from day one
- Admin backend migrated once with testing
- Reduces technical debt
- Cleaner codebase post-migration

---

### Phase 1: Setup New Frontend Structure
1. Create new route groups: `(public)`, `(auth)`, `(protected)`, `(admin)`
2. Build new landing page at root `/`
3. Create new auth flow at `/auth/*` (using Supabase Auth + Drizzle queries)
4. Leave admin routes unchanged (already migrated to Drizzle in Phase 0)

### Phase 2: Build Core User Experience (Using Drizzle)
1. Create `/dashboard` (new mission dashboard)
2. Create `/plans/new` (new plan generator wizard)
3. Create `/plans/[planId]` (new plan details)
4. Create `/bundles` (new bundle marketplace)
5. Create `/inventory` (new inventory tracker)
6. Create `/readiness` (new readiness dashboard)

**All new features use:**
- Drizzle ORM for database queries
- Server Actions for internal operations
- Type-safe queries from `src/db/queries/`

### Phase 3: Supporting Features
1. Create `/maps`, `/simulation`, `/skills`, `/expert-calls`
2. Create `/profile` (unified account dashboard)
3. Build responsive navigation sidebar

### Phase 4: Cleanup Old Files
**Only after Phase 1-3 are complete and tested:**
1. Delete old components from `src/components/` (except `/ui/`)
2. Delete old routes (`/planner`, `/dashboard`, `/store`, `/login`)
3. Delete unused utilities and context providers
4. **Delete old Supabase query layer** (`src/lib/db.ts` - replaced by Drizzle)
5. Run linter and tests to ensure nothing broken
6. Commit with clear message: "Remove legacy frontend files"

### Phase 5: Admin Restyling
**After user-facing frontend is stable:**
1. Apply Trust Blue theme to all admin components
2. Replace old UI elements with shadcn/ui components
3. Ensure all existing admin functionality still works (already on Drizzle)
4. Test all admin operations (bundle creation, product management, etc.)

---

## 🗄️ Drizzle ORM Migration Details

### Current State (Supabase Client Queries)
The existing codebase uses Supabase client directly for all database operations via `src/lib/db.ts`:

```typescript
// Current pattern (Supabase)
export const db = {
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  },
  // ... more Supabase queries
};
```

### Target State (Drizzle ORM)
New architecture uses Drizzle for type-safe database queries:

```typescript
// New pattern (Drizzle)
import { db } from '@/db';
import { profiles } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function getUserProfile(userId: string): Promise<User | null> {
  const profile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile[0] || null;
}
```

### Drizzle Schema Structure

**Proposed schema organization:**
```
src/db/
├── index.ts                     # Drizzle client initialization
├── schema/
│   ├── index.ts                 # Export all schemas
│   ├── users.ts                 # profiles, user_settings tables
│   ├── auth.ts                  # auth-related tables (if needed)
│   ├── products.ts              # products, master_items tables
│   ├── bundles.ts               # bundles, bundle_items, bundle_tags tables
│   ├── categories.ts            # categories, category_hierarchy tables
│   ├── suppliers.ts             # suppliers, supplier_products tables
│   ├── mission-reports.ts       # mission_reports, report_scenarios tables
│   ├── inventory.ts             # inventory_items, inventory_history tables
│   ├── subscriptions.ts         # subscriptions, invoices tables
│   ├── skills.ts                # skills_training, user_progress tables
│   ├── calls.ts                 # scheduled_calls, call_history tables
│   └── analytics.ts             # analytics_events, metrics tables
└── queries/
    ├── users.ts                 # User CRUD operations
    ├── products.ts              # Product queries
    ├── bundles.ts               # Bundle matching and filtering
    ├── categories.ts            # Category tree operations
    ├── suppliers.ts             # Supplier management
    ├── mission-reports.ts       # Mission report CRUD
    ├── inventory.ts             # Inventory aggregation
    ├── subscriptions.ts         # Subscription status queries
    ├── skills.ts                # Skills tracking queries
    ├── calls.ts                 # Call scheduling queries
    └── analytics.ts             # Platform metrics
```

### Migration Steps (Detailed)

**Step 1: Install Drizzle**
```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

**Step 2: Create Drizzle config**
```typescript
// drizzle.config.ts (root level)
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema/*',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**Step 3: Create schema files (one table at a time)**
Start with simple tables, progressively migrate complex ones:
1. Categories (no foreign keys)
2. Suppliers (no foreign keys)
3. Products (references categories, suppliers)
4. Master items (references categories)
5. Bundles (references master items)
6. Users/profiles
7. Mission reports (references users)
8. Inventory (references users, master items)

**Step 4: Introspect existing database**
```bash
npx drizzle-kit introspect:pg
```
This generates schema from existing Supabase tables.

**Step 5: Create query layer**
Migrate each file in `src/lib/db.ts` to new `src/db/queries/*.ts` files.

**Step 6: Update admin actions**
Replace Supabase calls with Drizzle queries in:
- `src/app/admin/bundles/actions.ts`
- `src/app/admin/products/actions.ts`
- `src/app/admin/suppliers/actions.ts`
- `src/app/admin/actions.ts`

**Step 7: Test thoroughly**
- Run all admin operations
- Verify no data corruption
- Check query performance
- Test role-based access

**Step 8: Update service layer**
Migrate remaining services:
- `src/lib/masterItemService.ts`
- `src/lib/categoryService.ts`
- `src/lib/embeddings.ts` (if it queries DB)

### Authentication Strategy

**Recommended approach: Hybrid**
- **Supabase Auth** - Authentication, sessions, OAuth (preserve existing)
- **Drizzle ORM** - All data queries (profiles, products, bundles, etc.)

**Rationale:**
- Supabase Auth is battle-tested and handles complex auth flows
- No need to rewrite auth logic
- Drizzle excellent for type-safe data queries
- Clean separation of concerns

**Implementation:**
```typescript
// Auth - Use Supabase
import { createServerClient } from '@supabase/ssr';
const supabase = createServerClient(/* ... */);
const { data: { session } } = await supabase.auth.getSession();

// Data - Use Drizzle
import { db } from '@/db';
import { profiles } from '@/db/schema/users';
const profile = await db.select().from(profiles).where(eq(profiles.id, session.user.id));
```

### Database Connection

**Existing Supabase PostgreSQL connection:**
- Keep same database
- Drizzle connects via connection string
- No schema changes needed
- Just query layer changes

**Connection string:**
```env
# .env.local
DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"
```

### Type Safety Benefits

**Before (Supabase):**
```typescript
// No compile-time type checking
const { data } = await supabase
  .from('products')
  .select('name, price, category_id')
  .eq('id', productId);

// data is 'any', runtime errors possible
console.log(data.nam); // Typo not caught!
```

**After (Drizzle):**
```typescript
// Full type safety
const product = await db
  .select({
    name: products.name,
    price: products.price,
    categoryId: products.categoryId,
  })
  .from(products)
  .where(eq(products.id, productId));

// TypeScript catches typos
console.log(product[0].nam); // ❌ Compile error!
console.log(product[0].name); // ✅ Type-safe
```

### Performance Considerations

- Drizzle generates optimized SQL
- No over-fetching (select only needed columns)
- Query builder is lightweight
- Connection pooling via Postgres driver
- Prepared statements for security

### Testing Strategy

**During migration:**
1. Run queries in parallel (Supabase + Drizzle)
2. Compare results for consistency
3. Log performance metrics
4. Gradually switch over table by table
5. Keep Supabase fallback during testing

**Example migration testing:**
```typescript
// During migration - run both
const supabaseResult = await db.getUserProfile(userId); // Old
const drizzleResult = await getUserProfile(userId); // New

// Compare
assert.deepEqual(supabaseResult, drizzleResult);
```

---

## ⚠️ Critical Safety Rules

### DO NOT DELETE
- **Anything in `src/lib/`** - Core database and service layer
- **Anything with "actions.ts"** in admin folders - Backend operations
- **API routes** - External integrations
- **Type definitions** - Database models and interfaces
- **Supabase utilities** - Authentication and database access

### SAFE TO DELETE (After New Frontend Built)
- **Old user components** in `src/components/` (except `/ui/`)
- **Old user routes** (`/planner`, `/dashboard`, `/store`, `/login`)
- **Unused context providers** (after verifying not used by admin)

### REQUIRES CAREFUL EVALUATION
- **Auth actions** - May be reused or refactored
- **Shared utilities** - Check for admin dependencies
- **Root layout** - Update but don't delete

---

## 📊 File Count Summary

**Total Files Inventoried:** ~90 files

**PRESERVE (Admin Backend + Database):** ~55 files
- Database layer: 13 files
- Admin backend: 6 files
- Admin frontend (restyle): 36 files
- UI components: 3 files

**REMOVE LATER (Old Frontend):** ~25 files
- Legacy components: 13 files
- Legacy routes: 7 files
- Legacy utilities: 5 files

**EVALUATE (Case-by-Case):** ~10 files
- Auth: 4 files
- Utilities: 3 files
- Context: 1 file
- Config: 2 files

---

## 🧪 Testing Checklist Before Cleanup

Before deleting ANY old frontend files, verify:

- [ ] All new user routes are functional (`/dashboard`, `/plans/*`, `/bundles`, etc.)
- [ ] Authentication flow works end-to-end (signup, login, logout, password reset)
- [ ] Admin panel is accessible and all functions work (bundle creation, product management)
- [ ] Database queries still work (mission reports CRUD, inventory tracking)
- [ ] API routes respond correctly (search, Amazon product lookup)
- [ ] No import errors or broken references in admin code
- [ ] Supabase connection is stable
- [ ] All admin modals and popups function correctly
- [ ] Trust Blue theme applied consistently across admin
- [ ] Responsive design works on mobile, tablet, desktop

---

## 📝 Cleanup Commands (Run ONLY after new frontend is complete)

```bash
# Phase 4: Remove old user-facing files (SAFE AFTER NEW FRONTEND BUILT)

# Remove old user components (keep ui folder)
rm -rf src/components/Planner.tsx
rm -rf src/components/Dashboard.tsx
rm -rf src/components/Store.tsx
rm -rf src/components/MissionReport.tsx
rm -rf src/components/SaveReportModal.tsx
rm -rf src/components/MapComponent.tsx
rm -rf src/components/CriticalSkills.tsx
rm -rf src/components/Charts.tsx
rm -rf src/components/Hero.tsx
rm -rf src/components/Navbar.tsx
rm -rf src/components/Footer.tsx
rm -rf src/components/Login.tsx
rm -rf src/components/AdminPanel.tsx

# Remove old user routes
rm -rf src/app/planner/
rm -rf src/app/dashboard/
rm -rf src/app/store/
rm -rf src/app/login/
rm -rf src/app/about/

# Evaluate and remove if unused
# (Check for admin dependencies first!)
rm -rf src/components/LocationAutocomplete.tsx  # If rebuilt for new UI
rm -rf src/data/loadingTips.ts  # If not using loading tips

# Run linter to check for broken imports
npm run lint

# Run type check
npm run type-check

# Test admin functionality
# Navigate to /admin/* routes and test all features

# Commit cleanup
git add .
git commit -m "chore: remove legacy frontend files after new UI rebuild"
```

---

## 🚨 Emergency Recovery

If you accidentally delete critical files:

1. **Immediately stop and don't commit**
2. Check git status: `git status`
3. Restore deleted files: `git restore <file-path>`
4. Or restore all: `git restore .`

**Critical files to NEVER delete:**
- `src/lib/db.ts`
- `src/lib/supabase*.ts`
- `src/app/admin/*/actions.ts`
- `src/types.ts`
- Anything in `src/app/api/`

---

## ✅ Completion Checklist

When you're ready to clean up old frontend files:

- [ ] New frontend is 100% functional
- [ ] All user stories from Phase 1 are implemented
- [ ] Authentication works end-to-end
- [ ] Admin panel tested and working
- [ ] Database operations verified
- [ ] Backup created (git commit before cleanup)
- [ ] Ran linter and type-check before cleanup
- [ ] Deleted old components one-by-one (not all at once)
- [ ] Tested admin after each deletion batch
- [ ] Verified no broken imports
- [ ] Final lint and type-check passed
- [ ] Created git commit with cleanup changes

---

**End of Inventory Report**

This document should be updated if:
- New admin functionality is added (add to PRESERVE list)
- New files are created (categorize as PRESERVE/REMOVE/EVALUATE)
- Migration strategy changes (update phases)

