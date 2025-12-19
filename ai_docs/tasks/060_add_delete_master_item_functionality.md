# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Add Delete Master Item Functionality to Product Catalog Admin

### Goal Statement
**Goal:** Implement the ability to delete master items from the product catalog via right-click context menu. This functionality existed in v1 but was not ported to v2. The implementation must include robust confirmation workflows (2-step for items with products, 1-step for empty items) and leverage existing database cascade delete constraints.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The product catalog admin interface currently allows users to edit, add products to, move, and copy/paste tags for master items via right-click context menu, but lacks the ability to delete master items. This functionality existed in emergency-planner-v1 but was not ported during the v2 refactor.

Given that the infrastructure is already in place (context menu component, database cascade constraints, admin auth), this is a straightforward implementation with a clear path forward. **Strategic analysis is not needed** as there's only one obvious solution: add the delete option to the existing context menu and wire it up with proper confirmation flows.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM
- **UI & Styling:** Shadcn/ui components with Tailwind CSS v4
- **Authentication:** Supabase Auth with admin role checking via `checkAdmin()` helper
- **Key Architectural Patterns:**
  - Next.js App Router with Server Components
  - Server Actions for mutations (`app/(protected)/admin/products/actions.ts`)
  - Client-side context menus with memoized handlers
  - Reusable modal dialogs from shadcn/ui
- **Relevant Existing Components:**
  - `MasterItemContextMenu.tsx` - Context menu with edit, add product, move, copy/paste tags options
  - `MasterItemRow.tsx` - Master item header with right-click handling already wired up
  - `page.client.tsx` - Main product catalog page with context menu handlers
  - `DeleteCategoryDialog.tsx` - Existing delete confirmation pattern for categories

### Current State

**✅ Already Implemented:**
1. **Context Menu Infrastructure:** `MasterItemContextMenu` component exists with menu items for Edit, Add Product, Move, Copy/Paste Tags
2. **Right-Click Handling:** `MasterItemRow` has `onContextMenu` handler wired to `handleMasterItemContextMenu`
3. **Database Cascade Delete:** `specificProducts.masterItemId` has `{ onDelete: 'cascade' }` constraint in schema
4. **Admin Authorization:** `checkAdmin()` helper used in all mutation server actions
5. **Toast Notifications:** Toast system available via existing modal components

**❌ Missing (Needs Implementation):**
1. **Delete Server Action:** No `deleteMasterItem` function in `actions.ts`
2. **Delete Menu Option:** No "Delete Master Item" option in `MasterItemContextMenu`
3. **Delete Handler:** No `handleDeleteMasterItem` function in `page.client.tsx`
4. **Confirmation Modal:** No delete confirmation dialog component for master items
5. **Product Listing Query:** No helper to fetch associated products for warning modal

### Existing Context Providers Analysis
Not applicable to this task - master item deletion does not require context provider data. The operation is triggered from the admin UI with master item data already available in local state.

---

## 4. Context & Problem Definition

### Problem Statement
Product catalog administrators need the ability to delete master items that are no longer needed. Currently, the only way to remove a master item is through direct database access, which is error-prone and bypasses proper audit trails and user confirmation flows.

The v1 application had this functionality with a warning modal showing associated products and requiring confirmation. This was lost during the v2 refactor and needs to be restored with enhanced safety measures (2-step confirmation for items with products).

### Success Criteria
- [ ] Admin users can right-click on a master item header and see a "Delete Master Item" option in the context menu
- [ ] When deleting a master item **with associated products**:
  - [ ] First modal shows list of all products and requires user to type exact master item name
  - [ ] Second modal confirms the deletion one final time before executing
- [ ] When deleting a master item **without associated products**:
  - [ ] Single confirmation modal with simple yes/no choice
- [ ] Successful deletion shows brief success toast notification
- [ ] Failed deletion shows error toast with clear error message
- [ ] Product list automatically refreshes after successful deletion
- [ ] Database cascade automatically deletes associated products when master item is deleted

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
- User can right-click on master item header to open context menu
- Context menu displays "Delete Master Item" option with trash icon
- System checks if master item has associated products before showing confirmation
- **If master item has products:**
  - First modal displays scrollable list of all associated products with names and ASINs
  - Modal requires user to type exact master item name in text input to enable deletion
  - After name confirmation, second modal appears with final confirmation prompt
  - Both confirmations must be approved to proceed with deletion
- **If master item has no products:**
  - Single confirmation modal with simple "Are you sure?" message
  - User clicks "Delete" to confirm or "Cancel" to abort
- Server action validates admin permission before deletion
- Database cascade automatically removes associated products
- Success shows brief toast: "Master item deleted successfully"
- Error shows toast with specific error message
- Product list automatically refreshes after successful deletion

### Non-Functional Requirements
- **Performance:** Modal should open within 100ms of menu click
- **Security:** Only admin users can delete master items (enforced server-side)
- **Usability:** Confirmation flow must be clear and prevent accidental deletions
- **Responsive Design:** Modal works on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Modal supports both light and dark mode
- **Compatibility:** Works in all modern browsers (Chrome, Firefox, Safari, Edge)

### Technical Constraints
- Must use existing `MasterItemContextMenu` component pattern
- Must follow existing server action patterns in `actions.ts`
- Must use shadcn/ui dialog component for modals
- Must leverage existing database cascade delete constraint
- Cannot modify database schema (cascade constraint already exists)

---

## 7. Data & Database Changes

### Database Schema Changes
**No database changes required.** The `specificProducts` table already has cascade delete configured:

```typescript
// src/db/schema/products.ts (line 40)
masterItemId: uuid('master_item_id')
  .notNull()
  .references(() => masterItems.id, { onDelete: 'cascade' }),
```

This means when a master item is deleted, PostgreSQL automatically deletes all associated products.

### Data Model Updates
No type changes needed. Existing types are sufficient:
- `MasterItem` type already defined in `@/lib/products-types`
- `Product` type already defined for associated product listing

### Data Migration Plan
Not applicable - no schema changes needed.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

#### **MUTATIONS (Server Actions)** → `app/actions/[feature].ts`
- [ ] **Server Actions File** - `app/(protected)/admin/products/actions.ts` - Add `deleteMasterItem` mutation
- [ ] Must use `'use server'` directive and `revalidatePath()` after deletion
- [ ] Follow existing pattern from `deleteProduct` function

#### **QUERIES (Data Fetching)** → Simple query pattern
- [ ] **Direct Query in Server Action** - Fetch associated products count/list within delete action
- [ ] Simple query: `await db.select().from(specificProducts).where(eq(specificProducts.masterItemId, id))`

#### **API Routes** → Not needed
No API routes required - this is a straightforward server action mutation.

### Server Actions
- [ ] **`deleteMasterItem(id: string)`** - Delete master item by ID
  - Validates admin permission via `checkAdmin()`
  - Deletes master item from database
  - Database cascade automatically handles product deletion
  - Returns `{ success: true }` or `{ success: false, error: string }`
  - Revalidates `/admin/products` path after deletion

- [ ] **`getMasterItemProducts(id: string)`** - Get products for confirmation modal
  - Validates admin permission via `checkAdmin()`
  - Queries `specificProducts` table for products with matching `masterItemId`
  - Returns array of products with `{ id, name, asin }` for display in modal
  - Used by client to populate warning modal before deletion

### External Integrations
None required - purely internal CRUD operation.

---

## 9. Frontend Changes

### New Components
- [ ] **`components/admin/DeleteMasterItemDialog.tsx`** - Confirmation modal for master item deletion
  - Props: `isOpen`, `masterItem`, `products`, `onClose`, `onConfirm`
  - Two variants: with-products (2-step) and without-products (1-step)
  - With products: Shows scrollable list, requires name input, then final confirmation
  - Without products: Simple confirmation with Delete/Cancel buttons
  - Uses shadcn/ui Dialog component
  - Responsive design with mobile/tablet/desktop support
  - Light/dark mode support

**Component Requirements:**
- **Responsive Design:** Mobile-first with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- **Theme Support:** CSS variables for colors, `dark:` classes for dark mode
- **Accessibility:** WCAG AA compliance, proper ARIA labels, keyboard navigation
- **Text Sizing:**
  - Product list: `text-sm` (14px) for readability
  - Warning text: `text-base` (16px) for emphasis
  - Input field: `text-base` (16px) for typing comfort

### Page Updates
- [ ] **`/admin/products`** - Add delete handler and modal state
  - Add `handleDeleteMasterItem` function to fetch products and show confirmation
  - Add modal state for delete confirmation dialog
  - Wire up delete handler to context menu
  - Add success/error toast notifications

### State Management
- Local state in `page.client.tsx`:
  - `deleteMasterItemModal: { isOpen: boolean, masterItem: MasterItem | null, products: Product[] }`
  - `isDeleting: boolean` (loading state during deletion)

### Context Usage Strategy
Not applicable - master item deletion uses local state from context menu trigger. No additional context providers needed.

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

#### MasterItemContextMenu.tsx (current menu items)
```typescript
// Current menu options (line 80-142):
- Edit Master Item
- Add Product
- Move Master Item
- Copy Tags
- Paste Tags
// Missing: Delete Master Item option
```

#### page.client.tsx (current imports - line 18)
```typescript
import {
  bulkUpdateProducts, createMasterItem, deleteProduct, getMasterItems,
  updateMasterItem, updateProduct, updateProductTags
} from "./actions";
// Missing: deleteMasterItem import
```

#### actions.ts (current delete function - line 431)
```typescript
export async function deleteProduct(id: string) {
    await checkAdmin();

    await db.delete(specificProducts).where(eq(specificProducts.id, id));

    revalidatePath('/admin/products');
    revalidatePath('/admin/bundles');
}
// No deleteMasterItem function exists
```

### 📂 **After Implementation**

#### MasterItemContextMenu.tsx (new menu item added)
```typescript
// New delete option added after "Move Master Item" (before divider):
<button
  className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-destructive flex items-center gap-3 transition-colors whitespace-nowrap"
  onClick={() => {
    onDelete(masterItem);
    onClose();
  }}
>
  <Trash2 className="w-4 h-4 text-destructive flex-shrink-0" strokeWidth={2.5} />
  Delete Master Item
</button>
```

#### actions.ts (new functions added)
```typescript
// New server action to get products for confirmation modal
export async function getMasterItemProducts(id: string): Promise<Product[]> {
    await checkAdmin();

    const products = await db
        .select({
            id: specificProducts.id,
            name: specificProducts.name,
            asin: specificProducts.asin,
        })
        .from(specificProducts)
        .where(eq(specificProducts.masterItemId, id));

    return products;
}

// New server action to delete master item
export async function deleteMasterItem(id: string) {
    await checkAdmin();

    await db.delete(masterItems).where(eq(masterItems.id, id));

    revalidatePath('/admin/products');
    revalidatePath('/admin/bundles');
    return { success: true };
}
```

#### page.client.tsx (new handler added)
```typescript
// New delete handler added to context menu handlers section:
const handleDeleteMasterItem = async (masterItem: MasterItem) => {
    // Fetch associated products
    const products = await getMasterItemProducts(masterItem.id);

    // Open delete confirmation modal with product list
    setDeleteMasterItemModal({
        isOpen: true,
        masterItem,
        products
    });

    masterItemContextMenu.closeMenu();
};
```

### 🎯 **Key Changes Summary**
- [ ] **MasterItemContextMenu.tsx:** Add "Delete Master Item" button with Trash2 icon and `onDelete` handler
- [ ] **actions.ts:** Add `getMasterItemProducts()` and `deleteMasterItem()` server actions
- [ ] **page.client.tsx:** Add `handleDeleteMasterItem()` handler, modal state, and wire to context menu
- [ ] **New Component:** Create `DeleteMasterItemDialog.tsx` with 2-step/1-step confirmation logic
- [ ] **Files Modified:** 3 files (MasterItemContextMenu, actions, page.client)
- [ ] **Files Created:** 1 file (DeleteMasterItemDialog component)

---

## 11. Implementation Plan

### Phase 1: Server Actions (Backend)
**Goal:** Create server actions for fetching products and deleting master items

- [x] **Task 1.1:** Add `getMasterItemProducts` Server Action ✓ 2025-12-19
  - Files: `src/app/(protected)/admin/products/actions.ts` ✓
  - Details:
    - Add new exported async function `getMasterItemProducts(id: string)` ✓
    - Call `checkAdmin()` to enforce admin-only access ✓
    - Query `specificProducts` table with `eq(specificProducts.masterItemId, id)` ✓
    - Return array of products with `{ id, name, asin }` fields ✓
    - Follow existing query pattern from `getProducts()` function ✓

- [x] **Task 1.2:** Add `deleteMasterItem` Server Action ✓ 2025-12-19
  - Files: `src/app/(protected)/admin/products/actions.ts` ✓
  - Details:
    - Add new exported async function `deleteMasterItem(id: string)` ✓
    - Call `checkAdmin()` to enforce admin-only access ✓
    - Delete from `masterItems` table using `eq(masterItems.id, id)` ✓
    - Database cascade will automatically delete associated products ✓
    - Revalidate `/admin/products` and `/admin/bundles` paths ✓
    - Return `{ success: true }` on success ✓
    - Wrap in try/catch and return `{ success: false, error: string }` on error ✓
    - Follow existing pattern from `deleteProduct()` function ✓
    - Fixed TypeScript linting: Changed `error: any` to `error: unknown` with proper type guard ✓

### Phase 2: Delete Confirmation Modal Component
**Goal:** Create reusable confirmation dialog with 2-step and 1-step variants

- [x] **Task 2.1:** Create `DeleteMasterItemDialog` Component ✓ 2025-12-19
  - Files: `src/components/admin/DeleteMasterItemDialog.tsx` ✓
  - Details:
    - Create new React component using shadcn/ui Dialog ✓
    - Props: `{ isOpen, masterItem, products, onClose, onConfirm }` ✓
    - Implement two conditional variants based on `products.length`: ✓
      - **With products (2-step):** ✓
        - Step 1: Show warning message, scrollable product list, text input for name confirmation ✓
        - Step 2: Show final confirmation after name matches ✓
      - **Without products (1-step):** ✓
        - Show simple "Are you sure?" message with Delete/Cancel buttons ✓
    - Use Trash2 icon for delete button (destructive styling) ✓
    - Add loading state during deletion (`isDeleting` prop) ✓
    - Responsive design with mobile/tablet/desktop breakpoints ✓
    - Light/dark mode support using CSS variables ✓

- [x] **Task 2.2:** Style and Polish Modal ✓ 2025-12-19
  - Files: `src/components/admin/DeleteMasterItemDialog.tsx` ✓
  - Details:
    - Product list: scrollable container with max-height (200px), border, rounded corners ✓
    - Name input: prominent with clear placeholder text, auto-focus ✓
    - Delete button: red/destructive color, disabled until name matches ✓
    - Cancel button: secondary styling, always enabled ✓
    - Warning text: bold, red color for emphasis ✓
    - Mobile-friendly touch targets (44px minimum via shadcn defaults) ✓
    - Fixed ESLint warning: Added comment to justify setState in useEffect (modal reset) ✓

### Phase 3: Context Menu Integration
**Goal:** Add delete option to master item context menu and wire up handlers

- [x] **Task 3.1:** Update `MasterItemContextMenu` Component ✓ 2025-12-19
  - Files: `src/app/(protected)/admin/products/components/MasterItemContextMenu.tsx` ✓
  - Details:
    - Add `onDelete: (item: MasterItem) => void` to props interface ✓
    - Add new menu button after "Move Master Item" option (before divider) ✓
    - Button text: "Delete Master Item" ✓
    - Icon: `Trash2` with destructive color (`text-destructive`) ✓
    - onClick: call `onDelete(masterItem)` then `onClose()` ✓
    - Follow existing menu item pattern from other buttons ✓
    - Updated JSDoc comment to include delete option in documentation ✓
    - Added Trash2 to imports from lucide-react ✓

- [x] **Task 3.2:** Import and Export New Server Actions ✓ 2025-12-19
  - Files: `src/app/(protected)/admin/products/page.client.tsx` ✓
  - Details:
    - This task will be completed in Phase 4 alongside handler integration ✓
    - Server actions already exported from actions.ts, ready to import in page.client ✓

### Phase 4: Page Client Integration
**Goal:** Add delete handler, modal state, and wire everything together

- [x] **Task 4.1:** Add Delete Modal State ✓ 2025-12-19
  - Files: `src/app/(protected)/admin/products/page.client.tsx` ✓
  - Details:
    - Add state: `const [deleteMasterItemModal, setDeleteMasterItemModal] = useState<{ isOpen: boolean, masterItem: MasterItem | null, products: Product[] }>({ isOpen: false, masterItem: null, products: [] })` ✓
    - Add loading state: `const [isDeletingMasterItem, setIsDeletingMasterItem] = useState(false)` ✓
    - Added imports for deleteMasterItem and getMasterItemProducts ✓
    - Added import for DeleteMasterItemDialog component ✓

- [x] **Task 4.2:** Add `handleDeleteMasterItem` Handler ✓ 2025-12-19
  - Files: `src/app/(protected)/admin/products/page.client.tsx` ✓
  - Details:
    - Create memoized handler: `const handleDeleteMasterItem = useCallback(async (masterItem: MasterItem) => { ... })` ✓
    - Fetch products: `const products = await getMasterItemProducts(masterItem.id)` ✓
    - Open modal: `setDeleteMasterItemModal({ isOpen: true, masterItem, products })` ✓
    - Close context menu: `masterItemContextMenu.closeMenu()` ✓
    - Added error handling with console.error ✓

- [x] **Task 4.3:** Add Deletion Confirmation Logic ✓ 2025-12-19
  - Files: `src/app/(protected)/admin/products/page.client.tsx` ✓
  - Details:
    - Create `handleConfirmDeleteMasterItem` function to execute deletion ✓
    - Set loading state: `setIsDeletingMasterItem(true)` ✓
    - Call server action: `const result = await deleteMasterItem(masterItem.id)` ✓
    - Handle success: ✓
      - Close modal: `setDeleteMasterItemModal({ isOpen: false, masterItem: null, products: [] })` ✓
      - Refresh master items list: `await getMasterItems()` and `setAllMasterItems(updatedMasterItems)` ✓
    - Handle error: Show alert with error message ✓
    - Reset loading state: `setIsDeletingMasterItem(false)` in finally block ✓

- [x] **Task 4.4:** Wire Up Context Menu ✓ 2025-12-19
  - Files: `src/app/(protected)/admin/products/page.client.tsx` ✓
  - Details:
    - Find `MasterItemContextMenu` component render (line 1877) ✓
    - Add `onDelete={handleDeleteMasterItem}` prop ✓
    - Handler is memoized with useCallback for React.memo performance ✓

- [x] **Task 4.5:** Render Delete Modal ✓ 2025-12-19
  - Files: `src/app/(protected)/admin/products/page.client.tsx` ✓
  - Details:
    - Add `<DeleteMasterItemDialog>` component to JSX (line 2229) ✓
    - Pass props: `isOpen`, `masterItem`, `products`, `onClose`, `onConfirm`, `isDeleting` ✓
    - Place after MoveMasterItemDialog component near end of JSX ✓

### Phase 5: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 5.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run linting and static analysis ONLY - NEVER run dev server, build, or start commands

- [ ] **Task 5.2:** Static Logic Review
  - Files: Modified business logic files
  - Details: Read code to verify logic syntax, edge case handling, fallback patterns

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 5, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 6: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 6.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [ ] **Task 6.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 7: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 7.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing

- [ ] **Task 7.2:** Request User UI Testing
  - Files: Specific browser testing checklist for user
  - Details:
    - Right-click on master item with products → verify 2-step confirmation flow
    - Right-click on master item without products → verify 1-step confirmation flow
    - Verify name input validation works correctly
    - Verify toast notifications appear after deletion
    - Verify product list refreshes after deletion
    - Test on mobile, tablet, and desktop viewports
    - Test in light and dark mode

- [ ] **Task 7.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

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

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── src/
│   └── components/
│       └── admin/
│           └── DeleteMasterItemDialog.tsx  # New confirmation modal component
```

### Files to Modify
- [ ] **`src/app/(protected)/admin/products/actions.ts`** - Add `deleteMasterItem` and `getMasterItemProducts` server actions
- [ ] **`src/app/(protected)/admin/products/components/MasterItemContextMenu.tsx`** - Add delete menu option with `onDelete` prop
- [ ] **`src/app/(protected)/admin/products/page.client.tsx`** - Add delete handler, modal state, and wire to context menu

### Dependencies to Add
No new dependencies required - all functionality uses existing libraries (shadcn/ui Dialog, Drizzle ORM, React hooks).

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** User tries to delete master item but database constraint fails
  - **Code Review Focus:** Error handling in `deleteMasterItem` server action - does it catch and return user-friendly error?
  - **Potential Fix:** Wrap deletion in try/catch, return `{ success: false, error: 'Failed to delete master item. Please try again.' }`

- [ ] **Error Scenario 2:** User navigates away during 2-step confirmation flow
  - **Code Review Focus:** Modal state management - does closing modal properly reset state?
  - **Potential Fix:** Ensure `onClose` handler resets `deleteMasterItemModal` state to initial values

- [ ] **Error Scenario 3:** Products are added to master item between opening modal and confirming deletion
  - **Analysis Approach:** Review if products are fetched fresh before deletion or cached from initial fetch
  - **Recommendation:** Accept race condition (products are fetched once when modal opens) - edge case is acceptable

### Edge Cases to Consider
- [ ] **Edge Case 1:** Master item name contains special characters (quotes, apostrophes, etc.)
  - **Analysis Approach:** Check if name input validation handles special characters correctly
  - **Recommendation:** Use exact string comparison (case-sensitive) for name validation

- [ ] **Edge Case 2:** Very long master item name doesn't fit in modal input
  - **Analysis Approach:** Check if input field is scrollable or truncated
  - **Recommendation:** Use scrollable input field with full name visible on focus

- [ ] **Edge Case 3:** Hundreds of products associated with master item
  - **Analysis Approach:** Check if product list has max-height with scroll
  - **Recommendation:** Implement max-height (e.g., 300px) with overflow-y-auto

### Security & Access Control Review
- [ ] **Admin Access Control:** Are delete operations properly restricted to admin users?
  - **Check:** `checkAdmin()` called in both server actions (`deleteMasterItem`, `getMasterItemProducts`)
- [ ] **Authentication State:** Does the system handle logged-out users appropriately?
  - **Check:** Admin routes protected by middleware, `checkAdmin()` throws on non-admin
- [ ] **Input Validation:** Is master item ID validated before deletion?
  - **Check:** Drizzle query will fail gracefully if ID doesn't exist (no SQL injection risk)
- [ ] **Cascade Delete Safety:** Can cascade delete cause unintended data loss?
  - **Check:** Cascade is intentional and desired - products should be deleted with master item

### AI Agent Analysis Approach
**Focus:** Review server actions for proper error handling, admin authorization, and graceful failure modes. Verify modal state management handles edge cases (closing during confirmation, special characters in names). Ensure toast notifications provide clear feedback for success/error states.

**Priority Order:**
1. **Critical:** Admin authorization on server actions
2. **Important:** Error handling and user feedback (toast messages)
3. **Nice-to-have:** Edge case handling for very long names or large product lists

---

## 15. Deployment & Configuration

### Environment Variables
No new environment variables required - uses existing database connection and auth configuration.

---

## 16. AI Agent Instructions

### Default Workflow - IMPLEMENTATION ONLY (No Strategic Analysis Needed)
🎯 **This task has a clear path forward - skip strategic analysis and proceed directly to implementation:**

1. ✅ **Strategic Analysis:** SKIPPED (only one obvious solution)
2. ✅ **Task Document Created:** You're reading it now
3. ⏳ **Awaiting User Approval:** Present implementation options to user
4. ⏳ **Implementation:** Execute phase-by-phase after approval

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates after each phase
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **STRATEGIC ANALYSIS:** ✅ SKIPPED - Only one obvious solution exists

2. **TASK DOCUMENT CREATED:** ✅ COMPLETE - This document exists

3. **PRESENT IMPLEMENTATION OPTIONS (Required)**
   - [ ] **After user reviews this document**, present these 3 exact options:

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

   - [ ] **Wait for explicit user choice** (A, B, or C) - never assume or default
   - [ ] **If A chosen**: Provide detailed code snippets showing exact changes planned
   - [ ] **If B chosen**: Begin phase-by-phase implementation immediately
   - [ ] **If C chosen**: Address feedback and re-present options

4. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

   **MANDATORY PHASE WORKFLOW:**

   For each phase, follow this exact pattern:

   a. **Execute Phase Completely** - Complete all tasks in current phase
   b. **Update Task Document** - Mark all completed tasks as [x] with timestamps
   c. **Provide Specific Phase Recap** using this format:

   ```
   ✅ **Phase [X] Complete - [Phase Name]**
   - Modified [X] files with [Y] total line changes
   - Key changes: [specific file paths and what was modified]
   - Files updated:
     • file1.ts (+15 lines): [brief description of changes]
     • file2.tsx (-3 lines, +8 lines): [brief description of changes]
   - Commands executed: [list any commands run]
   - Linting status: ✅ All files pass / ❌ [specific issues found]

   **🔄 Next: Phase [X+1] - [Phase Name]**
   - Will modify: [specific files]
   - Changes planned: [brief description]
   - Estimated scope: [number of files/changes expected]

   **Say "proceed" to continue to Phase [X+1]**
   ```

   d. **Wait for "proceed"** before starting next phase
   e. **Repeat for each phase** until all implementation complete
   f. **🚨 CRITICAL:** After final implementation phase, you MUST proceed to Phase 6 (Comprehensive Code Review) before any user testing

   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
   - [ ] **Real-time task completion tracking** - Update task document immediately after each subtask
   - [ ] **Mark checkboxes as [x]** with completion timestamps
   - [ ] **Add specific completion notes** (file paths, line counts, key changes)
   - [ ] **Run linting on each modified file** during the phase (static analysis only - no dev server/build commands)
   - [ ] **Always create components in `components/[feature]/` directories**
   - [ ] **🚨 MANDATORY WORKFLOW SEQUENCE:** After implementation phases, follow this exact order:
     - [ ] **Phase 5 Complete** → Present "Implementation Complete!" message (section 16, step 7)
     - [ ] **Wait for user approval** → Execute comprehensive code review (section 16, step 8)
     - [ ] **Code review complete** → ONLY THEN request user browser testing
     - [ ] **NEVER skip comprehensive code review** - Phase 5 basic validation ≠ comprehensive review
   - [ ] **NEVER plan manual browser testing as AI task** - always mark as "👤 USER TESTING" and wait for user confirmation

5. **VERIFY LIB FILE ARCHITECTURE (For any lib/ changes)**
   - Not applicable to this task - no lib/ file changes

6. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after all phases)**
   - [ ] **Present this exact message** to user after all implementation complete:

   ```
   🎉 **Implementation Complete!**

   All phases have been implemented successfully. I've made changes to [X] files across [Y] phases.

   **📋 I recommend doing a thorough code review of all changes to ensure:**
   - No mistakes were introduced
   - All goals were achieved
   - Code follows project standards
   - Everything will work as expected

   **Would you like me to proceed with the comprehensive code review?**

   This review will include:
   - Verifying all changes match the intended goals
   - Running linting and type-checking on all modified files
   - Checking for any integration issues
   - Confirming all requirements were met
   ```

   - [ ] **Wait for user approval** of code review
   - [ ] **If approved**: Execute comprehensive code review process below

7. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
   - [ ] **Read all modified files** and verify changes match task requirements exactly
   - [ ] **Run linting and type-checking** on all modified files using appropriate commands
   - [ ] **Check for integration issues** between modified components
   - [ ] **Verify all success criteria** from task document are met
   - [ ] **Test critical workflows** affected by changes
   - [ ] **Provide detailed review summary** using this format:

   ```
   ✅ **Code Review Complete**

   **Files Reviewed:** [list all modified files with line counts]
   **Linting Status:** ✅ All files pass / ❌ [specific issues found]
   **Type Checking:** ✅ No type errors / ❌ [specific type issues]
   **Integration Check:** ✅ Components work together properly / ❌ [issues found]
   **Requirements Met:** ✅ All success criteria achieved / ❌ [missing requirements]

   **Summary:** [brief summary of what was accomplished and verified]
   **Confidence Level:** High/Medium/Low - [specific reasoning]
   **Recommendations:** [any follow-up suggestions or improvements]
   ```

### What Constitutes "Explicit User Approval"

#### For Implementation Options (A/B/C Choice)
**✅ OPTION A RESPONSES (Show detailed code previews):**
- "A" or "Option A"
- "Preview the changes"
- "Show me the code changes"
- "Let me see what will be modified"
- "Walk me through the changes"

**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start implementation"
- "Begin" or "Execute the plan"
- "Looks good, implement it"

**✅ OPTION C RESPONSES (Provide more feedback):**
- "C" or "Option C"
- "I have questions about..."
- "Can you modify..."
- "What about..." or "How will you handle..."
- "I'd like to change..."
- "Wait, let me think about..."

#### For Phase Continuation
**✅ PHASE CONTINUATION RESPONSES:**
- "proceed"
- "continue"
- "next phase"
- "go ahead"
- "looks good"

**❓ CLARIFICATION NEEDED (Do NOT continue to next phase):**
- Questions about the completed phase
- Requests for changes to completed work
- Concerns about the implementation
- No response or silence

#### For Final Code Review
**✅ CODE REVIEW APPROVAL:**
- "proceed"
- "yes, review the code"
- "go ahead with review"
- "approved"

🛑 **NEVER start coding without explicit A/B/C choice from user!**
🛑 **NEVER continue to next phase without "proceed" confirmation!**
🛑 **NEVER skip comprehensive code review after implementation phases!**
🛑 **NEVER proceed to user testing without completing code review first!**
🛑 **NEVER run application execution commands - user already has app running!**

### 🚨 CRITICAL: Command Execution Rules
**NEVER run application execution commands - the user already has their development environment running!**

**❌ FORBIDDEN COMMANDS (Will cause conflicts with running dev server):**
- `npm run dev` / `npm start` / `next dev` - User already running
- `npm run build` / `next build` - Expensive and unnecessary for validation
- Any command that starts/serves the application
- Any command that compiles/builds for production
- Any long-running processes or servers

**✅ ALLOWED COMMANDS (Safe static analysis only):**
- `npm run lint` - Static code analysis, safe to run
- `npm run type-check` / `tsc --noEmit` - Type checking only, no compilation
- Database commands (when explicitly needed): `npm run db:generate`, `npm run db:migrate`
- File reading/analysis tools

**🎯 VALIDATION STRATEGY:**
- Use linting for code quality issues
- Read files to verify logic and structure
- Check syntax and dependencies statically
- Let the user handle all application testing manually

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Add proper error handling
- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
  - [ ] **❌ NEVER write change history**: "Fixed this", "Removed function", "Updated to use new API"
  - [ ] **❌ NEVER write migration artifacts**: "Moved from X", "Previously was Y"
  - [ ] **✅ ALWAYS explain business logic**: "Calculate discount for premium users", "Validate permissions before deletion"
  - [ ] **✅ Write for future developers** - explain what/why the code does what it does, not what you changed
  - [ ] **Remove unused code completely** - don't leave comments explaining what was removed
- [ ] **🚨 MANDATORY: Use early returns to keep code clean and readable**
  - [ ] **Prioritize early returns** over nested if-else statements
  - [ ] **Validate inputs early** and return immediately for invalid cases
  - [ ] **Handle error conditions first** before proceeding with main logic
  - [ ] **Exit early for edge cases** to reduce nesting and improve readability
  - [ ] **Example pattern**: `if (invalid) return error; // main logic here`
- [ ] **🚨 MANDATORY: Use async/await instead of .then() chaining**
  - [ ] **Avoid Promise .then() chains** - use async/await for better readability
  - [ ] **Use try/catch blocks** for error handling instead of .catch() chaining
  - [ ] **Use Promise.all()** for concurrent operations instead of chaining multiple .then()
  - [ ] **Create separate async functions** for complex operations instead of long chains
  - [ ] **Example**: `const result = await operation();` instead of `operation().then(result => ...)`
- [ ] **Ensure responsive design (mobile-first approach with Tailwind breakpoints)**
- [ ] **Test components in both light and dark mode**
- [ ] **Verify mobile usability on devices 320px width and up**
- [ ] Follow accessibility guidelines (WCAG AA)
- [ ] Use semantic HTML elements

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern**
  - [ ] Mutations → Server Actions (`app/(protected)/admin/products/actions.ts`)
  - [ ] Queries → Direct in server action for simple product fetch
  - [ ] API routes → Not needed for this task
- [ ] **❌ AVOID: Creating unnecessary API routes for internal operations**
- [ ] **🔍 DOUBLE-CHECK: Are server actions properly authorized with `checkAdmin()`?**

---

## 17. Notes & Additional Context

### Research Links
- [DeleteCategoryDialog.tsx](src/components/admin/DeleteCategoryDialog.tsx) - Existing delete confirmation pattern to follow
- [MasterItemContextMenu.tsx](src/app/(protected)/admin/products/components/MasterItemContextMenu.tsx) - Context menu to modify
- [v1 Delete Implementation](ai_docs/refs/emergency-planner-v1/.specstory/history/2025-11-28_17-17Z-warn-before-deleting-master-items.md) - Original implementation reference

### Design Notes
- **2-Step Confirmation Flow:** More stringent than v1 (which only had 1-step with product list warning). User specifically requested name typing verification for destructive operations with associated products.
- **Cascade Delete:** Database already configured correctly - no schema changes needed.
- **Toast Notifications:** Brief, non-intrusive feedback following existing pattern in the app.

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

Before implementing any changes, the AI must systematically analyze potential second-order consequences and alert the user to any significant impacts. This analysis should identify ripple effects that might not be immediately obvious but could cause problems later.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No API changes - purely additive feature
- [ ] **Database Dependencies:** No schema changes - using existing cascade constraint
- [ ] **Component Dependencies:** Only adding new prop to `MasterItemContextMenu` (backwards compatible)
- [ ] **Authentication/Authorization:** No changes to auth flow - using existing `checkAdmin()` pattern

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** Deleting master item triggers cascade delete of products - **INTENTIONAL AND DESIRED**
- [ ] **UI/UX Cascading Effects:** No changes to parent/child components beyond context menu
- [ ] **State Management:** Local state in page.client.tsx - no impact on global state
- [ ] **Routing Dependencies:** Revalidation of `/admin/products` path refreshes data - **EXPECTED BEHAVIOR**

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** Single DELETE query + cascade - minimal impact (master items rarely have >100 products)
- [ ] **Bundle Size:** New modal component adds ~3KB - negligible impact
- [ ] **Server Load:** Admin-only feature with infrequent usage - minimal impact
- [ ] **Caching Strategy:** `revalidatePath()` invalidates cache appropriately

#### 4. **Security Considerations**
- [ ] **Attack Surface:** No new attack vectors - admin-only operation with server-side auth check
- [ ] **Data Exposure:** Product list shown in modal only to admins who already have access
- [ ] **Permission Escalation:** No risk - `checkAdmin()` enforced on all mutation actions
- [ ] **Input Validation:** Master item ID validated by database query (no SQL injection risk)

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** 2-step confirmation is MORE cautious than typical patterns - reduces accidental deletions
- [ ] **Data Migration:** No user action needed - feature is purely additive
- [ ] **Feature Deprecation:** No features removed or changed
- [ ] **Learning Curve:** Familiar right-click menu pattern - minimal learning curve

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Adds ~150 lines total - straightforward conditional logic
- [ ] **Dependencies:** No new third-party dependencies - uses existing shadcn/ui Dialog
- [ ] **Testing Overhead:** Manual testing only (2 scenarios: with/without products)
- [ ] **Documentation:** This task document serves as complete documentation

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
**NONE IDENTIFIED.** This is a low-risk additive feature:
- No database schema changes
- No breaking API changes
- No performance degradation
- No new security vulnerabilities
- No risk of user data loss (confirmation flow prevents accidents)

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Cascade Delete Behavior:** Deleting master item **permanently deletes all associated products**
  - **Mitigation:** 2-step confirmation with full product list display
  - **Recommendation:** User already approved this behavior in requirements
  - **Risk Level:** LOW (intentional design, protected by confirmation flow)

### Mitigation Strategies

#### Database Changes
Not applicable - no database changes required.

#### API Changes
Not applicable - no breaking API changes.

#### UI/UX Changes
- [ ] **2-Step Confirmation:** Prevents accidental deletions with multiple safeguards
- [ ] **Product List Display:** Shows full context before deletion
- [ ] **Name Typing Verification:** Additional safety layer for items with products

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** Reviewed all sections - no significant impacts identified
- [x] **Identify Critical Issues:** No red flags, one yellow flag (cascade delete - intentional)
- [x] **Propose Mitigation:** 2-step confirmation flow already designed to mitigate risks
- [x] **Alert User:** Yellow flag documented in analysis section
- [x] **Recommend Alternatives:** No alternatives needed - design is sound

### Analysis Summary

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
NONE - This is a purely additive feature.

**Performance Implications:**
- New modal component adds ~3KB to bundle (negligible)
- Single DELETE query with cascade - minimal database impact
- Admin-only feature with infrequent usage

**Security Considerations:**
- No new attack vectors (admin-only, server-side auth)
- No data exposure risks (admins already have access)
- Input validation handled by Drizzle ORM (no SQL injection)

**User Experience Impacts:**
- 2-step confirmation MORE cautious than typical patterns
- Prevents accidental deletions with multiple safeguards
- Familiar right-click menu interaction

**Cascade Delete Behavior (⚠️ YELLOW FLAG):**
Deleting master item permanently deletes all associated products. This is **intentional and desired** behavior, protected by:
- Full product list display in first confirmation
- Name typing verification for items with products
- Final confirmation before execution
- Success toast feedback after deletion

**RECOMMENDATION:**
✅ Proceed with implementation as designed. The 2-step confirmation flow adequately mitigates risks associated with cascade deletion.
```

---

*Template Version: 1.3*
*Last Updated: 12/19/2024*
*Created By: AI Agent (Claude Sonnet 3.5)*
