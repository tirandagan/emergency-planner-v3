# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Product Drag-and-Drop Sorting in Admin Catalog

### Goal Statement
**Goal:** Enable administrators to reorder specific products within master items using drag-and-drop functionality in the admin product catalog. The sort order will be persisted to the database and used to display products in a consistent, manually-curated order. This improves product presentation control and allows administrators to prioritize which products appear first within each master item category.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
✅ **CONDUCT STRATEGIC ANALYSIS** - Multiple viable technical approaches exist for implementing drag-and-drop functionality, and the choice impacts both user experience and database architecture.

### Problem Context
The current product catalog displays specific products under master items without any explicit ordering mechanism. Administrators need the ability to manually curate the display order of products within each master item to highlight preferred products, group related items, or arrange by relevance. This requires both a UI drag-and-drop interface and database schema changes to persist the sort order.

### Solution Options Analysis

#### Option 1: Simple sortOrder Integer Column
**Approach:** Add a `sortOrder` integer column to `specific_products` table. Products are ordered by this column ascending, with null values appearing last.

**Pros:**
- ✅ **Simple Implementation** - Single column addition, straightforward SQL ordering
- ✅ **Performant Queries** - Simple `ORDER BY sort_order ASC NULLS LAST` with index
- ✅ **Easy Maintenance** - Clear integer-based ordering logic
- ✅ **Flexible Reordering** - Easy to renumber entire master item when needed
- ✅ **Database Index Friendly** - Efficient B-tree index on integer column

**Cons:**
- ❌ **Renumbering Required** - When inserting between items, may need to renumber multiple products
- ❌ **Gap Management** - Need logic to handle gaps in numbering sequence
- ❌ **Concurrent Edit Conflicts** - Multiple admins reordering same master item could create conflicts

**Implementation Complexity:** Low - Single column, standard CRUD operations, simple drag-and-drop library integration

**Risk Level:** Low - Well-established pattern, minimal edge cases

#### Option 2: Lexicographic Ordering (Fractional Indexing)
**Approach:** Use string-based fractional indexing (like "a", "ab", "b") allowing insertion between any two items without renumbering.

**Pros:**
- ✅ **No Renumbering** - Can always insert between two items without touching others
- ✅ **Concurrent Edits** - Reduces conflicts when multiple admins reorder simultaneously
- ✅ **Efficient Updates** - Only update the moved item, not entire list

**Cons:**
- ❌ **Complex Logic** - Requires fractional indexing library or custom algorithm
- ❌ **String Growth** - Order strings can grow long over time with many reorders
- ❌ **Maintenance Complexity** - Harder to debug and understand ordering at a glance
- ❌ **Rebalancing Needed** - Eventually need to rebalance when strings get too long

**Implementation Complexity:** High - Requires fractional indexing library (e.g., fractional-indexing npm package), complex update logic

**Risk Level:** Medium - More moving parts, edge cases with string growth

#### Option 3: Linked List (Previous/Next References)
**Approach:** Each product has `previousProductId` and `nextProductId` foreign keys forming a doubly-linked list.

**Pros:**
- ✅ **No Renumbering** - Insert anywhere by updating only adjacent items
- ✅ **Explicit Relationships** - Clear representation of ordering

**Cons:**
- ❌ **Query Complexity** - Requires recursive CTE or multiple queries to retrieve ordered list
- ❌ **Data Integrity Issues** - Broken links can corrupt entire order
- ❌ **Performance Overhead** - Recursive queries can be slow for large lists
- ❌ **Maintenance Nightmare** - Debugging broken chains is difficult

**Implementation Complexity:** High - Complex queries, link maintenance logic, error recovery mechanisms

**Risk Level:** High - Data corruption risks, performance concerns, difficult debugging

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Simple sortOrder Integer Column

**Why this is the best choice:**
1. **Simplicity Wins** - The product lists are small (typically 2-10 products per master item), making renumbering trivial and infrequent
2. **Performance** - Integer ordering with B-tree index is fastest and most database-friendly
3. **Maintainability** - Future developers can immediately understand integer-based ordering
4. **Low Risk** - Well-established pattern with minimal edge cases or failure modes
5. **Development Speed** - Fastest to implement and test, allowing quicker delivery

**Key Decision Factors:**
- **Performance Impact:** Minimal - Small lists make renumbering negligible, indexed queries are very fast
- **User Experience:** Excellent - Auto-save on drop provides immediate feedback, simple mental model
- **Maintainability:** High - Clear, debuggable ordering logic with standard SQL patterns
- **Scalability:** Sufficient - Even 50 products per master item would reorder in <100ms
- **Security:** No concerns - Standard database operations with proper validation

**Alternative Consideration:**
Option 2 (Fractional Indexing) would be preferred for very large ordered lists (100+ items) or high-concurrency scenarios (10+ admins reordering simultaneously). However, our use case has small lists and typically single-admin usage, making the added complexity unjustified.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 1 - Simple sortOrder Integer Column), or would you prefer a different approach?

**Questions for you to consider:**
- Does the recommended solution align with your priorities?
- Do you expect very large product lists (50+ products per master item)?
- Will multiple admins frequently reorder the same master item simultaneously?
- Do you prefer simplicity over advanced features for this use case?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan and present you with next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS v4 for styling
- **Authentication:** Supabase Auth managed by middleware for protected routes
- **Key Architectural Patterns:**
  - Next.js App Router with Server Components for data fetching
  - Server Actions for mutations in `app/actions/` directory
  - Complex queries in `lib/` directory (if needed)
  - Client components in `components/` directory organized by feature
- **Relevant Existing Components:**
  - `src/app/(protected)/admin/products/page.client.tsx` - Main product catalog interface
  - `src/app/(protected)/admin/products/components/ProductRow.tsx` - Individual product row rendering
  - `src/app/(protected)/admin/products/components/MasterItemRow.tsx` - Master item row with expandable products
  - `src/db/schema/products.ts` - Database schema for master items and specific products

### Current State
The admin product catalog currently displays specific products under master items in a tree structure. Products are shown in an unordered or database-insertion-order manner. The catalog supports:
- Expanding/collapsing master items to reveal products
- Product selection with checkboxes
- Context menus for product operations
- Inline editing via QuickTagger and modals
- Bulk operations on selected products

**Current Product Display Pattern:**
Products are queried from the database and displayed in the order returned by Drizzle ORM, which defaults to creation order or primary key order. There is no explicit sort mechanism.

**Existing Context Providers Analysis:**
- **UserContext (`useUser()`):** Available throughout admin routes, provides authenticated user data
- **Context Hierarchy:** Admin layout provides UserContext, no product-specific context exists
- **Available Context Hooks:** `useUser()` for authentication state
- **🔍 Context Coverage Analysis:**
  - User authentication data already available via UserContext
  - Product catalog state managed locally via React state in page.client.tsx
  - No need for additional context providers for this feature

## 4. Context & Problem Definition

### Problem Statement
Administrators have no control over the display order of specific products within master items. Products appear in an arbitrary order (typically creation order), which doesn't allow for:
- Highlighting preferred or recommended products first
- Grouping similar products together
- Creating a curated shopping experience for customers
- Prioritizing products based on price, availability, or quality

This lack of ordering control reduces the effectiveness of product presentation and makes it harder to guide customers toward optimal product choices.

### Success Criteria
- [ ] **Drag-and-Drop UI** - Administrators can drag products to reorder them within a master item
- [ ] **Auto-Save** - Changes save immediately when product is dropped in new position
- [ ] **Persistent Ordering** - Sort order is saved to database and survives page refreshes
- [ ] **Consistent Display** - Products always display in the saved sort order across all admin views
- [ ] **Visual Feedback** - Clear visual indicators during drag operation (drag handle, drop zones, visual feedback)
- [ ] **Renumbering Logic** - All products in a master item are renumbered 1-N when any product is moved
- [ ] **Null Handling** - Products without explicit sort order appear after sorted products
- [ ] **New Product Behavior** - New products added to master items appear at the end of sorted list

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
- **Drag-and-Drop Interface:**
  - User can click and hold a product row to begin dragging
  - Visual drag handle icon appears on hover to indicate draggable area
  - Dragging displays a ghost/preview of the product being moved
  - Drop zones highlight when dragging over valid drop positions
  - Dropping product in new position immediately triggers save

- **Sort Order Persistence:**
  - System assigns sequential sort order numbers (1, 2, 3, ..., N) to all products in master item
  - When product is moved, all products in that master item are renumbered in their new order
  - Sort order is saved to `specific_products.sort_order` column

- **Display Logic:**
  - Products with explicit sort order (non-null) display first, ordered by `sort_order ASC`
  - Products without explicit sort order (null) display after sorted products, ordered by `name ASC`
  - Sort order is scoped per master item (product in Master Item A with sort_order=1 is independent of Master Item B)

- **New Product Behavior:**
  - New products added to master items start with `sort_order = NULL`
  - Appear at end of sorted products until manually reordered
  - Once any product in master item is reordered, all products get sequential sort orders

### Non-Functional Requirements
- **Performance:** Drag-and-drop operations complete in <300ms for lists up to 50 products
- **Security:** Only admin users can reorder products (verified via middleware and role check)
- **Usability:** Drag-and-drop works on desktop with mouse, clear visual feedback throughout
- **Responsive Design:** Must work on desktop (1024px+) - mobile support not required for admin catalog
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works in modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

### Technical Constraints
- Must use existing Drizzle ORM schema and query patterns
- Must integrate with existing product catalog UI in `page.client.tsx`
- Cannot modify Supabase database directly - must use Drizzle migrations
- Must follow project's server action pattern for mutations

---

## 7. Data & Database Changes

### Database Schema Changes
```sql
-- Add sort_order column to specific_products table
ALTER TABLE specific_products
ADD COLUMN sort_order INTEGER;

-- Create index for efficient ordering queries
CREATE INDEX idx_specific_products_sort_order
ON specific_products(master_item_id, sort_order);

-- Add comment for documentation
COMMENT ON COLUMN specific_products.sort_order IS
'Defines display order within master item. Lower numbers appear first. NULL values appear after sorted products.';
```

### Data Model Updates
```typescript
// Update Drizzle schema: src/db/schema/products.ts
export const specificProducts = pgTable(
  'specific_products',
  {
    // ... existing columns ...
    sortOrder: integer('sort_order'), // Add this column
    // ... rest of columns ...
  },
  (table) => ({
    // ... existing indexes ...
    // Add composite index for efficient sorting
    masterItemSortOrderIdx: index('idx_specific_products_master_item_sort_order')
      .on(table.masterItemId, table.sortOrder),
  })
);

// Update TypeScript type in lib/products-types.ts
export interface Product {
  // ... existing fields ...
  sortOrder: number | null; // Add this field
}
```

### Data Migration Plan
- [ ] **Generate Migration** - Run `npm run db:generate` to create migration file
- [ ] **Review SQL** - Verify generated SQL adds `sort_order` column and index correctly
- [ ] **Apply Migration** - Run `npm run db:migrate` to apply changes to database
- [ ] **No Data Backfill** - Existing products will have `sort_order = NULL` (acceptable per requirements)
- [ ] **Validate Schema** - Query database to confirm column and index exist

### 🚨 MANDATORY: Down Migration Safety Protocol
**CRITICAL REQUIREMENT:** Before running ANY database migration, you MUST create the corresponding down migration file following the `drizzle_down_migration.md` template process:

- [ ] **Step 1: Generate Migration** - Run `npm run db:generate` to create the migration file
- [ ] **Step 2: Create Down Migration** - Follow `drizzle_down_migration.md` template to analyze the migration and create the rollback file
- [ ] **Step 3: Create Subdirectory** - Create `drizzle/migrations/[timestamp_name]/` directory
- [ ] **Step 4: Generate down.sql** - Create the `down.sql` file with safe rollback operations
- [ ] **Step 5: Verify Safety** - Ensure all operations use `IF EXISTS` and include appropriate warnings
- [ ] **Step 6: Apply Migration** - Only after down migration is created, run `npm run db:migrate`

**🛑 NEVER run `npm run db:migrate` without first creating the down migration file!**

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

#### **MUTATIONS (Server Actions)** → `app/actions/products.ts` (existing file)
- [ ] **Add Server Action:** `reorderProducts(masterItemId, productOrder[])`
  - Input: Master item ID and array of product IDs in new order
  - Logic: Assign sequential sort orders (1, 2, 3, ..., N) to products in array order
  - Output: Success/error response with revalidation of product catalog page
- [ ] **What qualifies as mutations:** Updating `sort_order` column for multiple products

#### **QUERIES (Data Fetching)** → Direct in Server Components
- [ ] **Modify Existing Query** - Update product fetch query to order by `sort_order`
- [ ] **Query Location:** `src/app/(protected)/admin/products/actions.ts` - `getMasterItemProducts()`
- [ ] **Update ORDER BY Clause:**
  ```typescript
  .orderBy(
    sql`${specificProducts.sortOrder} IS NULL`, // Nulls last
    asc(specificProducts.sortOrder),             // Then by sort order
    asc(specificProducts.name)                   // Then by name
  )
  ```
- [ ] **Use when:** Fetching products for display in admin catalog (existing pattern)

#### **API Routes** → Not Needed
🛑 **No API routes required** - Server Actions handle all mutations, queries use direct database access

### Server Actions

**File:** `src/app/(protected)/admin/products/actions.ts` (existing file, add new action)

```typescript
/**
 * Reorder products within a master item
 * Assigns sequential sort orders (1, 2, 3, ..., N) to products based on new order
 *
 * @param masterItemId - UUID of master item containing products
 * @param productIds - Array of product UUIDs in desired display order
 * @returns Success response or error
 */
export async function reorderProducts(
  masterItemId: string,
  productIds: string[]
): Promise<{ success: boolean; error?: string }> {
  'use server';

  // Validate user is admin (existing pattern)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Verify admin role
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (profile?.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' };
  }

  // Update sort orders in transaction
  await db.transaction(async (tx) => {
    // Assign sequential sort orders 1, 2, 3, ..., N
    for (let i = 0; i < productIds.length; i++) {
      await tx
        .update(specificProducts)
        .set({ sortOrder: i + 1 })
        .where(
          and(
            eq(specificProducts.id, productIds[i]),
            eq(specificProducts.masterItemId, masterItemId)
          )
        );
    }
  });

  // Revalidate product catalog page
  revalidatePath('/admin/products', 'page');

  return { success: true };
}
```

### Database Queries

**Modify Existing Query** - `getMasterItemProducts()` in `src/app/(protected)/admin/products/actions.ts`

**Current Query Pattern:**
```typescript
const products = await db
  .select()
  .from(specificProducts)
  .where(eq(specificProducts.masterItemId, masterItemId));
```

**Updated Query with Ordering:**
```typescript
const products = await db
  .select()
  .from(specificProducts)
  .where(eq(specificProducts.masterItemId, masterItemId))
  .orderBy(
    sql`${specificProducts.sortOrder} IS NULL`, // Nulls appear last
    asc(specificProducts.sortOrder),             // Sorted products first
    asc(specificProducts.name)                   // Fallback to name
  );
```

### External Integrations
- **@dnd-kit/core** - Modern drag-and-drop library for React
  - Accessibility-focused with keyboard navigation support
  - Works with both mouse and touch devices
  - Provides collision detection and drop zone highlighting
  - Well-maintained with TypeScript support

---

## 9. Frontend Changes

### New Components
- [ ] **`components/admin/products/DraggableProductRow.tsx`** - Wraps ProductRow with drag-and-drop functionality
  - Props: `product`, `masterItem`, `isSelected`, `isTagging`, `dragHandleProps`, `isDragging`, `...ProductRowProps`
  - Functionality: Renders existing ProductRow with drag handle and drag state styling
  - Uses @dnd-kit/core `useSortable` hook for drag-and-drop behavior

**Component Requirements:**
- **Responsive Design:** Desktop-first (1024px+), drag-and-drop not critical for mobile admin
- **Theme Support:** Support both light and dark mode drag overlay styles
- **Accessibility:** Keyboard navigation for reordering (arrow keys + space to drop)
- **Text Sizing & Readability:** Maintain existing ProductRow text sizes (text-sm for product names)

### Page Updates
- [ ] **`/admin/products`** (page.client.tsx) - Add drag-and-drop context and handlers
  - Wrap product list with `<DndContext>` from @dnd-kit/core
  - Replace `<ProductRow>` with `<DraggableProductRow>` when rendering products under master items
  - Add `onDragEnd` handler to call `reorderProducts()` server action
  - Add optimistic UI update for immediate feedback before server response

### State Management
- **Local Component State:**
  - `isDragging: boolean` - Tracks active drag operation for visual feedback
  - `draggedProductId: string | null` - ID of currently dragged product

- **Optimistic Updates:**
  - Immediately reorder products in local state when dropped
  - Revert if server action fails
  - Show loading indicator during save operation

- **Data Fetching:**
  - Existing `getMasterItemProducts()` server action handles fetching
  - No changes to fetching strategy needed

### 🚨 CRITICAL: Context Usage Strategy

**MANDATORY: Before creating any component props or planning data fetching, verify existing context availability**

#### Context-First Design Pattern
- [ ] **✅ Check Available Contexts:** UserContext already provides authentication data
- [ ] **✅ Use Context Over Props:** No additional context needed for product sorting feature
- [ ] **✅ Avoid Prop Drilling:** Product data passed from server component to client components (existing pattern)
- [ ] **✅ Minimize Data Fetching:** Reuse existing `getMasterItemProducts()` query with updated ordering
- [ ] **✅ Context Provider Analysis:** No new context providers needed

**Context Coverage Analysis:**
- User authentication: Already available via UserContext ✅
- Product catalog data: Fetched server-side and passed to client components ✅
- Drag-and-drop state: Local React state appropriate (scoped to component) ✅
- No gaps identified - existing patterns sufficient ✅

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**Database Schema** (`src/db/schema/products.ts`):
```typescript
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
    // ... other columns ...
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    masterItemIdIdx: index('idx_specific_products_master_item_id').on(table.masterItemId),
    // ... other indexes ...
  })
);
```

**Product Query** (`src/app/(protected)/admin/products/actions.ts`):
```typescript
export async function getMasterItemProducts(masterItemId: string) {
  'use server';

  const products = await db
    .select()
    .from(specificProducts)
    .where(eq(specificProducts.masterItemId, masterItemId));
  // No explicit ordering - returns in database default order

  return products;
}
```

**Product Display** (`src/app/(protected)/admin/products/page.client.tsx`):
```typescript
// Products rendered as static list with no drag-and-drop
{masterItem.products?.map((product) => (
  <ProductRow
    key={product.id}
    product={product}
    masterItem={masterItem}
    isSelected={selectedProductIds.has(product.id)}
    isTagging={taggingProductId === product.id}
    onContextMenu={(e) => productMenu.openMenu(e, product)}
    onClick={(e) => handleProductClick(e, product.id)}
    onQuickTagClose={() => setTaggingProductId(null)}
  />
))}
```

### 📂 **After Refactor**

**Database Schema** (`src/db/schema/products.ts`):
```typescript
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
    sortOrder: integer('sort_order'), // NEW COLUMN
    // ... other columns ...
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    masterItemIdIdx: index('idx_specific_products_master_item_id').on(table.masterItemId),
    // NEW INDEX for efficient sorting
    masterItemSortOrderIdx: index('idx_specific_products_master_item_sort_order')
      .on(table.masterItemId, table.sortOrder),
    // ... other indexes ...
  })
);
```

**Product Query with Ordering** (`src/app/(protected)/admin/products/actions.ts`):
```typescript
export async function getMasterItemProducts(masterItemId: string) {
  'use server';

  const products = await db
    .select()
    .from(specificProducts)
    .where(eq(specificProducts.masterItemId, masterItemId))
    // NEW: Explicit ordering - sorted products first, then unsorted by name
    .orderBy(
      sql`${specificProducts.sortOrder} IS NULL`, // Nulls last
      asc(specificProducts.sortOrder),             // Sorted products ascending
      asc(specificProducts.name)                   // Fallback to name
    );

  return products;
}

// NEW: Reorder products server action
export async function reorderProducts(
  masterItemId: string,
  productIds: string[]
): Promise<{ success: boolean; error?: string }> {
  'use server';

  // Admin validation
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (profile?.role !== 'ADMIN') {
    return { success: false, error: 'Admin access required' };
  }

  // Assign sequential sort orders in transaction
  await db.transaction(async (tx) => {
    for (let i = 0; i < productIds.length; i++) {
      await tx
        .update(specificProducts)
        .set({ sortOrder: i + 1 })
        .where(
          and(
            eq(specificProducts.id, productIds[i]),
            eq(specificProducts.masterItemId, masterItemId)
          )
        );
    }
  });

  revalidatePath('/admin/products', 'page');
  return { success: true };
}
```

**Product Display with Drag-and-Drop** (`src/app/(protected)/admin/products/page.client.tsx`):
```typescript
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableProductRow } from './components/DraggableProductRow';

// Inside ProductCatalogClient component:
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 } // Prevent accidental drags
  })
);

const handleDragEnd = async (event: DragEndEvent, masterItemId: string) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const oldIndex = products.findIndex(p => p.id === active.id);
  const newIndex = products.findIndex(p => p.id === over.id);

  // Optimistic update - reorder locally
  const reorderedProducts = arrayMove(products, oldIndex, newIndex);
  setProducts(reorderedProducts);

  // Persist to database
  const productIds = reorderedProducts.map(p => p.id);
  const result = await reorderProducts(masterItemId, productIds);

  if (!result.success) {
    // Revert on failure
    setProducts(products);
    toast.error('Failed to save product order');
  }
};

// Render with drag-and-drop
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={(event) => handleDragEnd(event, masterItem.id)}
>
  <SortableContext
    items={masterItem.products?.map(p => p.id) || []}
    strategy={verticalListSortingStrategy}
  >
    {masterItem.products?.map((product) => (
      <DraggableProductRow // NEW: Draggable wrapper component
        key={product.id}
        product={product}
        masterItem={masterItem}
        isSelected={selectedProductIds.has(product.id)}
        isTagging={taggingProductId === product.id}
        onContextMenu={(e) => productMenu.openMenu(e, product)}
        onClick={(e) => handleProductClick(e, product.id)}
        onQuickTagClose={() => setTaggingProductId(null)}
      />
    ))}
  </SortableContext>
</DndContext>
```

**New Component** (`src/app/(protected)/admin/products/components/DraggableProductRow.tsx`):
```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { ProductRow, type ProductRowProps } from './ProductRow';

export function DraggableProductRow(props: ProductRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Existing ProductRow component */}
      <ProductRow {...props} />
    </div>
  );
}
```

### 🎯 **Key Changes Summary**
- [ ] **Database Schema:** Added `sort_order` integer column with composite index on `(master_item_id, sort_order)`
- [ ] **Product Query:** Updated `getMasterItemProducts()` to order by `sort_order` with null values last
- [ ] **New Server Action:** Created `reorderProducts()` to assign sequential sort orders in database transaction
- [ ] **Drag-and-Drop UI:** Integrated `@dnd-kit/core` library with `<DndContext>` and `<SortableContext>`
- [ ] **New Component:** Created `DraggableProductRow.tsx` wrapping existing `ProductRow` with drag handles
- [ ] **Optimistic Updates:** Local state update before server action for immediate feedback
- [ ] **Files Modified:**
  - `src/db/schema/products.ts` (schema update)
  - `src/app/(protected)/admin/products/actions.ts` (query + new action)
  - `src/app/(protected)/admin/products/page.client.tsx` (drag-and-drop integration)
  - `src/lib/products-types.ts` (TypeScript type update)
- [ ] **New Files Created:**
  - `src/app/(protected)/admin/products/components/DraggableProductRow.tsx`
  - `drizzle/migrations/[timestamp]_add_product_sort_order.sql`
- [ ] **Impact:** Enables manual product curation within master items, improves product presentation control

---

## 11. Implementation Plan

### Phase 1: Database Schema Changes (MANDATORY DOWN MIGRATION FIRST)
**Goal:** Add `sort_order` column and index to `specific_products` table with safe rollback capability

- [ ] **Task 1.1:** Update Drizzle Schema
  - Files: `src/db/schema/products.ts`, `src/lib/products-types.ts`
  - Details: Add `sortOrder: integer('sort_order')` column and composite index `(masterItemId, sortOrder)`

- [ ] **Task 1.2:** Generate Database Migration
  - Command: `npm run db:generate`
  - Details: Create migration file for `sort_order` column and index

- [ ] **Task 1.3:** Create Down Migration (MANDATORY)
  - Files: `drizzle/migrations/[timestamp]_add_product_sort_order/down.sql`
  - Details: Follow `drizzle_down_migration.md` template to create safe rollback:
    ```sql
    -- WARNING: Dropping sort_order column will lose all manual product ordering
    -- Products will return to default database order after rollback

    -- Drop index first
    DROP INDEX IF EXISTS idx_specific_products_master_item_sort_order;

    -- Drop column
    ALTER TABLE specific_products
    DROP COLUMN IF EXISTS sort_order;
    ```

- [ ] **Task 1.4:** Apply Migration
  - Command: `npm run db:migrate`
  - Details: Only run after down migration is created and verified

### Phase 2: Update Product Queries
**Goal:** Modify existing product queries to respect sort order

- [ ] **Task 2.1:** Update `getMasterItemProducts()` Query
  - Files: `src/app/(protected)/admin/products/actions.ts`
  - Details: Add `.orderBy()` clause with null-last logic and name fallback

- [ ] **Task 2.2:** Update TypeScript Types
  - Files: `src/lib/products-types.ts`
  - Details: Add `sortOrder: number | null;` to `Product` interface

### Phase 3: Create Reorder Server Action
**Goal:** Implement server-side logic to persist product order changes

- [ ] **Task 3.1:** Create `reorderProducts()` Server Action
  - Files: `src/app/(protected)/admin/products/actions.ts`
  - Details: Admin validation, transaction-based sequential sort order assignment, revalidation

- [ ] **Task 3.2:** Add Error Handling
  - Files: Same as 3.1
  - Details: Handle invalid product IDs, concurrent update conflicts, authorization failures

### Phase 4: Install Drag-and-Drop Library
**Goal:** Add @dnd-kit dependencies for drag-and-drop functionality

- [ ] **Task 4.1:** Install @dnd-kit Packages
  - Command: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
  - Details: Modern, accessible drag-and-drop library for React

- [ ] **Task 4.2:** Verify TypeScript Types
  - Files: Check `node_modules/@dnd-kit/*/package.json`
  - Details: Confirm TypeScript declarations are included

### Phase 5: Create Draggable Product Component
**Goal:** Build reusable draggable wrapper for ProductRow

- [ ] **Task 5.1:** Create `DraggableProductRow.tsx`
  - Files: `src/app/(protected)/admin/products/components/DraggableProductRow.tsx`
  - Details: Use `useSortable` hook, render drag handle, apply drag styling, wrap ProductRow

- [ ] **Task 5.2:** Style Drag States
  - Files: Same as 5.1
  - Details: Opacity change while dragging, drag handle visibility on hover, cursor states

### Phase 6: Integrate Drag-and-Drop in Product Catalog
**Goal:** Wire up drag-and-drop functionality in main catalog interface

- [ ] **Task 6.1:** Add DndContext to page.client.tsx
  - Files: `src/app/(protected)/admin/products/page.client.tsx`
  - Details: Wrap product lists with `<DndContext>` and configure sensors

- [ ] **Task 6.2:** Replace ProductRow with DraggableProductRow
  - Files: Same as 6.1
  - Details: Conditionally render draggable version when master item is expanded

- [ ] **Task 6.3:** Implement `onDragEnd` Handler
  - Files: Same as 6.1
  - Details: Optimistic local state update, call `reorderProducts()` action, error handling with revert

### Phase 7: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 7.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run `npm run lint` on modified files ONLY - NEVER run dev server, build, or start commands

- [ ] **Task 7.2:** Type Checking
  - Command: `npx tsc --noEmit`
  - Details: Verify TypeScript types are correct, no type errors introduced

- [ ] **Task 7.3:** Static Logic Review
  - Files: `actions.ts`, `DraggableProductRow.tsx`, `page.client.tsx`
  - Details: Read code to verify logic correctness, edge case handling, null safety

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 7, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 8: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 8.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [ ] **Task 8.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, check integration, provide detailed summary

### Phase 9: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for drag-and-drop functionality in browser

- [ ] **👤 USER TESTING - Task 9.1:** Test Drag-and-Drop in Browser
  - Details: User manually tests dragging products to reorder them
  - Verify: Visual feedback, auto-save, persistent ordering after refresh

- [ ] **👤 USER TESTING - Task 9.2:** Test Edge Cases
  - Details: User tests null sort orders, new products, multiple master items
  - Verify: Unsorted products appear last, new products at end, independent ordering per master item

- [ ] **👤 USER TESTING - Task 9.3:** Confirm Acceptance
  - Details: User confirms feature works as expected or reports issues

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date (fallback to web search if time tool unavailable)
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date (not assumed date)
- [ ] **Add brief completion notes** (file paths, key changes, etc.)
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - You must confirm you actually did what you said
  - [ ] **Provides user visibility** - Clear progress tracking throughout implementation
  - [ ] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [ ] **Creates audit trail** - Documentation of what was actually completed
  - [ ] **Enables better debugging** - If issues arise, easy to see what was changed

### Example Task Completion Format
```
### Phase 1: Database Schema Changes
**Goal:** Add `sort_order` column and index to `specific_products` table

- [x] **Task 1.1:** Update Drizzle Schema ✓ 2025-12-23
  - Files: `src/db/schema/products.ts` (added sortOrder column), `src/lib/products-types.ts` (updated Product type) ✓
  - Details: Added `sortOrder: integer('sort_order')` with composite index ✓
- [x] **Task 1.2:** Generate Database Migration ✓ 2025-12-23
  - Command: `npm run db:generate` executed successfully ✓
  - Files: `drizzle/migrations/0010_add_product_sort_order.sql` created ✓
```

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── src/
│   ├── app/(protected)/admin/products/
│   │   ├── components/
│   │   │   └── DraggableProductRow.tsx  # Drag-and-drop wrapper for ProductRow
│   │   └── actions.ts                    # (Modified) Add reorderProducts() action
├── drizzle/
│   └── migrations/
│       ├── [timestamp]_add_product_sort_order.sql      # Up migration
│       └── [timestamp]_add_product_sort_order/         # Down migration directory
│           └── down.sql                                 # Rollback SQL
```

### Files to Modify
- [ ] **`src/db/schema/products.ts`** - Add `sortOrder` column and composite index to `specificProducts` table
- [ ] **`src/lib/products-types.ts`** - Add `sortOrder: number | null` to `Product` interface
- [ ] **`src/app/(protected)/admin/products/actions.ts`** - Update `getMasterItemProducts()` query ordering, add `reorderProducts()` action
- [ ] **`src/app/(protected)/admin/products/page.client.tsx`** - Integrate `<DndContext>`, replace `<ProductRow>` with `<DraggableProductRow>`, add drag handlers

### Dependencies to Add
```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^9.0.0",
    "@dnd-kit/utilities": "^3.2.2"
  }
}
```

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** User drags product but server action fails to save order
  - **Code Review Focus:** `page.client.tsx` - Check error handling in `handleDragEnd()`, verify revert logic
  - **Potential Fix:** Ensure optimistic update is reverted on error, display toast notification to user

- [ ] **Error Scenario 2:** Concurrent admins reorder same master item simultaneously
  - **Code Review Focus:** `actions.ts` - Check transaction isolation level, potential race conditions
  - **Potential Fix:** Database transaction provides isolation, but consider adding optimistic locking or last-write-wins strategy

- [ ] **Error Scenario 3:** Invalid product IDs passed to `reorderProducts()`
  - **Code Review Focus:** `actions.ts` - Verify product IDs belong to specified master item
  - **Potential Fix:** Add validation to check all product IDs match the master item before updating

### Edge Cases to Consider
- [ ] **Edge Case 1:** Product with `sortOrder = NULL` added to master item with sorted products
  - **Analysis Approach:** Check query ordering in `getMasterItemProducts()` - verify NULL values appear last
  - **Recommendation:** Null-last ordering already implemented via `sql\`${specificProducts.sortOrder} IS NULL\``

- [ ] **Edge Case 2:** Admin deletes a product from middle of sorted list
  - **Analysis Approach:** Check if gaps in sort order (e.g., 1, 2, 4, 5) cause display issues
  - **Recommendation:** Gaps are acceptable - ordering is relative, not absolute. Renumbering only happens on explicit reorder.

- [ ] **Edge Case 3:** Master item with 100+ products (performance concern)
  - **Analysis Approach:** Check if drag-and-drop performance degrades with large lists
  - **Recommendation:** @dnd-kit handles large lists well, but consider pagination or virtualization if >50 products common

### Security & Access Control Review
- [ ] **Admin Access Control:** Are reorder operations properly restricted to admin users?
  - **Check:** `reorderProducts()` action in `actions.ts` - verify admin role check before database update
  - **Status:** ✅ Server action includes `profile?.role !== 'ADMIN'` check

- [ ] **Authentication State:** Does the system handle logged-out users appropriately?
  - **Check:** Middleware authentication in `(protected)` route group
  - **Status:** ✅ Protected route group ensures only authenticated users access admin catalog

- [ ] **Input Validation:** Are product IDs validated before processing?
  - **Check:** `reorderProducts()` action - verify product IDs are valid UUIDs and belong to master item
  - **Recommendation:** Add validation to check all product IDs exist and match master item ID:
    ```typescript
    const existingProducts = await db
      .select({ id: specificProducts.id })
      .from(specificProducts)
      .where(
        and(
          eq(specificProducts.masterItemId, masterItemId),
          inArray(specificProducts.id, productIds)
        )
      );
    if (existingProducts.length !== productIds.length) {
      return { success: false, error: 'Invalid product IDs' };
    }
    ```

- [ ] **SQL Injection Protection:** Are queries safe from injection attacks?
  - **Check:** Use of Drizzle ORM type-safe operators (`eq`, `and`, `inArray`)
  - **Status:** ✅ All queries use parameterized Drizzle methods, no raw SQL with user input

### AI Agent Analysis Approach
**Focus:** Review `reorderProducts()` server action for security gaps, verify admin role checks, validate input product IDs. Check drag-and-drop error handling for proper revert behavior. Examine query ordering for null value handling.

**Priority Order:**
1. **Critical:** Admin access control in `reorderProducts()` - ensure only admins can reorder
2. **Critical:** Input validation - verify product IDs belong to specified master item
3. **Important:** Concurrent update handling - transaction isolation prevents data corruption
4. **Nice-to-have:** Large list performance - pagination/virtualization if needed

---

## 15. Deployment & Configuration

### Environment Variables
No new environment variables required - uses existing Supabase and database connections.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **EVALUATE STRATEGIC NEED** - ✅ COMPLETED - Multiple viable drag-and-drop solutions analyzed
2. **STRATEGIC ANALYSIS** - ✅ COMPLETED - Presented 3 options with recommendation
3. **CREATE A TASK DOCUMENT** - ✅ CURRENT STEP - Task document created
4. **GET USER APPROVAL** of the task document
5. **IMPLEMENT THE FEATURE** only after approval

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates after each phase
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate (already done in strategic analysis)

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST** - ✅ COMPLETED
2. **STRATEGIC ANALYSIS SECOND** - ✅ COMPLETED
3. **CREATE TASK DOCUMENT THIRD** - ✅ COMPLETED
4. **PRESENT IMPLEMENTATION OPTIONS** - 🔄 CURRENT STEP

**👤 IMPLEMENTATION OPTIONS:**

**A) Preview High-Level Code Changes**
Would you like me to show you more detailed code snippets beyond what's in section 10? I can walk through the exact drag-and-drop implementation, database migration SQL, and component integration.

**B) Proceed with Implementation**
Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase, beginning with database schema changes.

**C) Provide More Feedback**
Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

**D) Choose Different Strategic Option**
Would you prefer Option 2 (Fractional Indexing) or Option 3 (Linked List) instead of the recommended simple integer sort order?

**Please choose A, B, C, or D to continue.**

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Add proper error handling
- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
  - [ ] **❌ NEVER write change history**: "Fixed this", "Removed function", "Updated to use new API"
  - [ ] **✅ ALWAYS explain business logic**: "Assign sequential sort orders to maintain consistent display order"
  - [ ] **✅ Write for future developers** - explain what/why the code does what it does
  - [ ] **Remove unused code completely** - don't leave comments explaining what was removed
- [ ] **🚨 MANDATORY: Use early returns to keep code clean and readable**
  - [ ] **Validate inputs early** and return immediately for invalid cases
  - [ ] **Handle error conditions first** before proceeding with main logic
  - [ ] **Example pattern**: `if (!user) return { success: false, error: 'Unauthorized' };`
- [ ] **🚨 MANDATORY: Use async/await instead of .then() chaining**
  - [ ] **Avoid Promise .then() chains** - use async/await for better readability
  - [ ] **Use try/catch blocks** for error handling instead of .catch() chaining
- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
  - [ ] **Fail fast and clearly** - don't mask issues with fallback behavior
  - [ ] **Single expected response format** - based on current API contract
  - [ ] **Throw descriptive errors** - explain exactly what format was expected vs received
- [ ] **🚨 MANDATORY: Create down migration files before running ANY database migration**
  - [ ] Follow `drizzle_down_migration.md` template process
  - [ ] Use `IF EXISTS` clauses for safe rollback operations
  - [ ] Include appropriate warnings for data loss risks
- [ ] **Ensure responsive design (desktop-first for admin, 1024px+ required)**
- [ ] **Test components in both light and dark mode**
- [ ] Follow accessibility guidelines (WCAG AA) - keyboard navigation for drag-and-drop
- [ ] Use semantic HTML elements
- [ ] **🚨 MANDATORY: Clean up removal artifacts**
  - [ ] **Never leave placeholder comments** or commented-out code
  - [ ] **Delete empty functions/components** completely
  - [ ] **Remove unused imports** and dependencies after deletions

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern**
  - [ ] Mutations → Server Actions (`app/actions/products.ts`) ✅
  - [ ] Queries → Updated existing query in `actions.ts` ✅
  - [ ] API routes → Not needed ✅
- [ ] **🚨 VERIFY: No server/client boundary violations in lib files**
  - [ ] No new lib files created - no boundary concerns ✅
- [ ] **🚨 VERIFY: Proper context usage patterns**
  - [ ] Components use available context providers (UserContext) ✅
  - [ ] No duplicate data fetching - reuse existing queries ✅
  - [ ] No unnecessary props when context alternative exists ✅

---

## 17. Notes & Additional Context

### Research Links
- [dnd-kit Documentation](https://docs.dndkit.com/) - Official drag-and-drop library docs
- [dnd-kit Sortable](https://docs.dndkit.com/presets/sortable) - Sortable list preset guide
- [Drizzle ORM Ordering](https://orm.drizzle.team/docs/select#order-by) - SQL ordering with Drizzle

### Design Considerations
- **Drag Handle Visibility:** Show drag handle (GripVertical icon) on hover to avoid UI clutter
- **Visual Feedback:** Reduce opacity of dragged item to 50% for clear drag state
- **Drop Zone Highlighting:** Use dnd-kit's built-in drop zone detection and highlighting
- **Keyboard Navigation:** Support arrow keys + space for accessibility (dnd-kit provides this)
- **Mobile:** Drag-and-drop not critical for mobile admin interface - focus on desktop experience

### Performance Considerations
- **Small List Optimization:** Renumbering 10-20 products takes <50ms in transaction
- **Optimistic Updates:** Local state update before server action prevents perceived lag
- **Database Index:** Composite index on `(master_item_id, sort_order)` ensures fast queries
- **Transaction Safety:** Batch updates in single transaction prevent partial saves

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

Before implementing any changes, the AI must systematically analyze potential second-order consequences and alert the user to any significant impacts.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** ❌ NO BREAKING CHANGES - `getMasterItemProducts()` still returns same data structure, just ordered differently
- [ ] **Database Dependencies:** ❌ NO BREAKING DEPENDENCIES - Adding nullable column doesn't affect existing queries
- [ ] **Component Dependencies:** ⚠️ MINOR IMPACT - ProductRow unchanged, new DraggableProductRow wrapper doesn't affect existing usage
- [ ] **Authentication/Authorization:** ✅ NO IMPACT - Uses existing admin role checks and middleware

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** ⚠️ ORDERING CHANGE - Products will display in sort order instead of creation order (expected behavior)
- [ ] **UI/UX Cascading Effects:** ✅ NO CASCADE - Drag-and-drop isolated to admin catalog, doesn't affect customer-facing views
- [ ] **State Management:** ✅ NO IMPACT - Local component state for drag operations, doesn't affect global state
- [ ] **Routing Dependencies:** ✅ NO IMPACT - No route changes, only component modifications

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** ✅ IMPROVED - Composite index on `(master_item_id, sort_order)` optimizes ordering queries
- [ ] **Bundle Size:** ⚠️ SMALL INCREASE - @dnd-kit packages add ~15KB gzipped to bundle (acceptable for admin-only feature)
- [ ] **Server Load:** ✅ MINIMAL - Reorder operations are infrequent, transaction-based updates are efficient
- [ ] **Caching Strategy:** ✅ NO IMPACT - `revalidatePath()` properly invalidates product catalog cache

#### 4. **Security Considerations**
- [ ] **Attack Surface:** ✅ NO NEW VULNERABILITIES - Admin-only operation behind authentication
- [ ] **Data Exposure:** ✅ NO RISK - Sort order is non-sensitive metadata
- [ ] **Permission Escalation:** ✅ PROTECTED - Admin role check in server action prevents unauthorized reordering
- [ ] **Input Validation:** ⚠️ NEEDS VALIDATION - Product IDs should be validated to belong to master item (recommendation in section 14)

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** ✅ ENHANCEMENT - Adds new capability without breaking existing workflows
- [ ] **Data Migration:** ✅ GRACEFUL - Existing products with `NULL` sort order display last (expected behavior)
- [ ] **Feature Deprecation:** ✅ NO DEPRECATION - Purely additive feature
- [ ] **Learning Curve:** ✅ LOW - Drag-and-drop is intuitive and familiar pattern

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** ✅ LOW - Simple integer ordering logic, well-documented drag-and-drop library
- [ ] **Dependencies:** ✅ STABLE - @dnd-kit is well-maintained with active community
- [ ] **Testing Overhead:** ⚠️ MODERATE - Requires manual browser testing for drag-and-drop (automated testing complex)
- [ ] **Documentation:** ✅ COVERED - Task document serves as comprehensive documentation

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [ ] **Database Migration Required:** ⚠️ YES - Adding `sort_order` column requires migration (minimal risk - nullable column)
- [ ] **Breaking API Changes:** ✅ NO - API surface unchanged, only query ordering modified
- [ ] **Performance Degradation:** ✅ NO - Composite index improves query performance
- [ ] **Security Vulnerabilities:** ⚠️ MINOR - Need to add product ID validation (recommendation provided)
- [ ] **User Data Loss:** ✅ NO RISK - Nullable column preserves existing data, sort order is metadata

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Increased Complexity:** ✅ MINIMAL - Drag-and-drop library handles complexity, logic is straightforward
- [ ] **New Dependencies:** ⚠️ YES - @dnd-kit adds 3 packages (~15KB gzipped), well-maintained and stable
- [ ] **UI/UX Changes:** ✅ ADDITIVE - New drag handles and visual feedback enhance existing interface
- [ ] **Maintenance Overhead:** ✅ LOW - Simple ordering logic, minimal edge cases

### Mitigation Strategies

#### Database Changes
- [ ] **Backup Strategy:** ✅ Development database - acceptable risk, down migration provided for rollback
- [ ] **Rollback Plan:** ✅ Down migration drops column cleanly, restores default ordering
- [ ] **Staging Testing:** ⚠️ RECOMMENDED - Test migration and drag-and-drop in staging before production
- [ ] **Gradual Migration:** ✅ NOT NEEDED - Nullable column is non-breaking, no data backfill required

#### Security
- [ ] **Input Validation:** ⚠️ RECOMMENDATION - Add product ID validation in `reorderProducts()` to verify IDs belong to master item (see section 14)
- [ ] **Admin Authorization:** ✅ IMPLEMENTED - Server action checks admin role before allowing reorder
- [ ] **SQL Injection Protection:** ✅ SAFE - Drizzle ORM uses parameterized queries

#### Performance
- [ ] **Database Indexing:** ✅ OPTIMIZED - Composite index on `(master_item_id, sort_order)` ensures fast queries
- [ ] **Bundle Size:** ✅ ACCEPTABLE - 15KB increase for admin-only feature is reasonable trade-off
- [ ] **Optimistic Updates:** ✅ IMPLEMENTED - Local state update prevents perceived lag during save

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections of impact assessment filled out
- [x] **Identify Critical Issues:** No critical red flags, minor yellow flags identified (input validation)
- [x] **Propose Mitigation:** Validation recommendation provided in section 14
- [x] **Alert User:** Yellow flag for input validation discussed, mitigation strategy clear
- [x] **Recommend Alternatives:** Strategic analysis already covered alternatives (section 2)

### Example Analysis Summary

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- ✅ NO BREAKING CHANGES - Nullable column addition is backward-compatible
- ✅ Product query ordering change is expected behavior (sorted products)

**Performance Implications:**
- ✅ IMPROVED - Composite index optimizes ordering queries
- ⚠️ MINOR - Bundle size increases by ~15KB (acceptable for admin feature)

**Security Considerations:**
- ⚠️ INPUT VALIDATION - Recommend adding product ID validation in reorderProducts()
- ✅ ADMIN AUTHORIZATION - Proper role checks implemented

**User Experience Impacts:**
- ✅ ENHANCEMENT - Adds drag-and-drop capability without disrupting workflows
- ✅ GRACEFUL MIGRATION - Existing products with NULL sort order display last

**Mitigation Recommendations:**
- Implement product ID validation in `reorderProducts()` server action (section 14)
- Test drag-and-drop thoroughly in staging environment before production
- Down migration provided for safe rollback if needed

**🚨 USER ATTENTION REQUIRED:**
Minor recommendation: Add product ID validation to ensure all IDs belong to the specified master item. This prevents potential errors from invalid input. Implementation details provided in section 14.
```

---

*Template Version: 1.3*
*Last Updated: 12/23/2025*
*Created By: Claude Code Assistant*
*Task Number: 074*
