# AI Task Template

> **Task Document:** Master Item Duplication Feature

---

## 1. Task Overview

### Task Title
**Title:** Add Duplicate Master Item Functionality to Product Management Interface

### Goal Statement
**Goal:** Enable administrators to quickly duplicate existing master items within the product catalog. This will streamline the workflow when creating similar master items under the same subcategory, reducing manual data entry and ensuring consistency. The duplicated item will inherit all properties from the source (name, description, tags) while getting a new unique ID and allowing immediate editing.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
**❌ SKIP STRATEGIC ANALYSIS** - This is a straightforward feature addition:
- Only one obvious technical solution exists (duplicate master item with new ID)
- Implementation pattern clearly established in existing codebase (`createMasterItem`)
- No significant architectural decisions or trade-offs
- Clear user requirements with no ambiguity

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS v4
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Components:**
  - `MasterItemContextMenu.tsx` - Right-click menu for master items
  - `MasterItemModal.tsx` - Modal for creating/editing master items
  - `actions.ts` - Server actions including `createMasterItem()` and `updateMasterItem()`

### Current State
The admin products page (`/admin/products`) displays a hierarchical view of categories, subcategories, master items, and specific products. Master items can currently be:
- Created via "Add Master Item" button
- Edited via context menu
- Moved to different categories via context menu
- Tags can be copied/pasted between master items

However, there is no direct "Duplicate" functionality. Users must manually create a new master item and re-enter all data, which is time-consuming when creating similar items.

### Existing Context Providers Analysis
- **UserContext (`useUser()`):** Provides user authentication data
- **UsageContext (`useUsage()`):** Not applicable to this admin feature
- **Context Hierarchy:** Admin routes are wrapped in auth protection middleware
- **Available Context Hooks:** useUser() available throughout admin pages

**🔍 Context Coverage Analysis:**
- User data is already available via middleware auth check (`checkAdmin()`)
- No additional context needed for this feature
- Server actions handle authentication internally

---

## 4. Context & Problem Definition

### Problem Statement
Administrators frequently need to create multiple similar master items within the same subcategory (e.g., "First Aid Kit - Basic", "First Aid Kit - Advanced", "First Aid Kit - Trauma"). Currently, they must:
1. Click "Add Master Item" button
2. Select the category/subcategory again
3. Manually re-enter all common fields (description, tags)
4. Only change the unique parts (name, specific details)

This process is repetitive and error-prone. A "Duplicate" feature would allow copying an existing master item with one click, then only modifying what differs.

### Success Criteria
- [x] User can right-click on any master item and see a "Duplicate" option in the context menu
- [x] Clicking "Duplicate" creates a new master item under the same subcategory with " (Copy)" appended to the name
- [x] All properties are copied: description, timeframes, demographics, locations, scenarios
- [x] The duplicated item gets a new unique ID and timestamp
- [x] The edit modal opens automatically after duplication for immediate customization
- [x] User receives clear feedback about successful duplication
- [x] Page revalidates to show the new duplicated item in the list

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
- User can right-click on a master item header to open the context menu
- Context menu displays a "Duplicate Master Item" option with an appropriate icon
- Clicking "Duplicate" creates a copy of the master item with:
  - New unique UUID
  - Same categoryId (stays in same subcategory)
  - Name with " (Copy)" appended
  - All other fields copied exactly (description, tags)
  - New createdAt timestamp
  - Empty changeHistory array (fresh history)
- After duplication, the edit modal opens automatically with the new item pre-loaded
- User can immediately edit the duplicated item (especially the name)
- Success toast notification confirms the duplication
- Page revalidates to display the new item

### Non-Functional Requirements
- **Performance:** Duplication should complete in <500ms
- **Security:** Admin-only access (protected by `checkAdmin()`)
- **Usability:** Single-click duplication from context menu, intuitive workflow
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works in all modern browsers

### Technical Constraints
- Must use existing Drizzle ORM patterns
- Must follow Server Action pattern for mutations
- Must integrate with existing context menu system
- Cannot modify database schema (all fields already exist)
- Must respect admin authorization checks

---

## 7. Data & Database Changes

### Database Schema Changes
**No database schema changes required** - all necessary fields already exist in `master_items` table.

### Data Model Updates
No new TypeScript types needed. Existing `MasterItem` type covers all fields.

### Data Migration Plan
Not applicable - no schema changes.

### 🚨 MANDATORY: Down Migration Safety Protocol
**Not applicable** - no database migrations required for this feature.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

#### **MUTATIONS (Server Actions)** → `app/actions/[feature].ts`
- [x] **Server Actions File** - `app/(protected)/admin/products/actions.ts` - Add `duplicateMasterItem()` function
- [x] This is a mutation (creates new record) - Server Action is appropriate
- [x] Will use `'use server'` directive and `revalidatePath()` after creation

### Server Actions
- [x] **`duplicateMasterItem(masterItemId: string)`** - New server action to duplicate a master item
  - Takes source master item ID as parameter
  - Fetches source master item from database
  - Creates new master item with copied data and new ID
  - Appends " (Copy)" to the name
  - Resets createdAt timestamp and changeHistory
  - Returns new master item data for opening edit modal
  - Revalidates `/admin/products` path

### Database Queries
- [x] **Direct in Server Action** - Simple query to fetch source master item and insert new one

### API Routes (Only for Special Cases)
**❌ NOT NEEDED** - This is an internal mutation, Server Action is appropriate.

---

## 9. Frontend Changes

### New Components
No new components needed. Will modify existing components:

**Component Requirements:**
- **Responsive Design:** Use mobile-first approach with Tailwind breakpoints
- **Theme Support:** Use CSS variables for colors, support `dark:` classes
- **Accessibility:** Proper ARIA labels, keyboard navigation support
- **Text Sizing:** Use `text-sm` for context menu items (consistent with existing)

### Page Updates
- [x] **`/admin/products`** - No changes to page component itself

### State Management
- Master item list state managed by server-side data fetching
- Context menu state managed by `useContextMenu` hook
- Modal state managed by `useModalState` hook
- Duplication triggers:
  1. Call `duplicateMasterItem()` server action
  2. Receive new master item data
  3. Open edit modal with new item pre-loaded
  4. Page automatically revalidates to show new item

### 🚨 CRITICAL: Context Usage Strategy

**✅ Context Analysis Complete:**
- User authentication handled by `checkAdmin()` in server actions
- No need for prop drilling - event handlers passed through component props as established pattern
- Context menu already receives callbacks from parent component
- No new context providers needed

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**File: `src/app/(protected)/admin/products/components/MasterItemContextMenu.tsx`**
```typescript
// Current context menu has these options:
export function MasterItemContextMenu({ ... }: MasterItemContextMenuProps) {
  return (
    <div className="...">
      <button onClick={() => onEdit(masterItem)}>Edit Master Item</button>
      <button onClick={() => onAddProduct(masterItem)}>Add Product</button>
      <button onClick={() => onMove(masterItem)}>Move Master Item</button>
      <div className="h-px bg-border my-1" /> {/* Divider */}
      <button onClick={() => onCopyTags(masterItem)}>Copy Tags</button>
      <button onClick={() => onPasteTags(masterItem)}>Paste Tags</button>
    </div>
  );
}
```

**File: `src/app/(protected)/admin/products/actions.ts`**
```typescript
// Existing createMasterItem function (lines 440-470)
export async function createMasterItem(formData: FormData) {
  await checkAdmin();
  // Extract fields from formData
  const name = formData.get('name') as string;
  const categoryId = formData.get('category_id') as string;
  // ... other fields

  // Insert new master item
  const [data] = await db.insert(masterItems).values({ ... }).returning();
  revalidatePath('/admin/products');
  return data;
}
```

**File: `src/app/(protected)/admin/products/page.client.tsx`**
```typescript
// Context menu handler (simplified)
const handleMasterItemContextMenu = (e: React.MouseEvent, item: MasterItem) => {
  masterItemMenu.openMenu(e, item, {
    onEdit: (item) => { /* open edit modal */ },
    onAddProduct: (item) => { /* open add product modal */ },
    onMove: (item) => { /* open move modal */ },
    onCopyTags: (item) => { /* copy tags to clipboard */ },
    onPasteTags: (item) => { /* paste tags */ }
  });
};
```

### 📂 **After Refactor**

**File: `src/app/(protected)/admin/products/components/MasterItemContextMenu.tsx`**
```typescript
import { Files } from 'lucide-react'; // Import duplicate icon

export interface MasterItemContextMenuProps {
  // ... existing props
  onDuplicate: (item: MasterItem) => void; // NEW PROP
}

export function MasterItemContextMenu({
  onDuplicate, // NEW
  // ... existing props
}: MasterItemContextMenuProps) {
  return (
    <div className="...">
      <button onClick={() => onEdit(masterItem)}>Edit Master Item</button>
      <button onClick={() => onAddProduct(masterItem)}>Add Product</button>
      <button onClick={() => onMove(masterItem)}>Move Master Item</button>

      {/* NEW: Duplicate option */}
      <button
        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm text-foreground flex items-center gap-3 transition-colors whitespace-nowrap"
        onClick={() => {
          onDuplicate(masterItem);
          onClose();
        }}
      >
        <Files className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2.5} />
        Duplicate Master Item
      </button>

      <div className="h-px bg-border my-1" />
      <button onClick={() => onCopyTags(masterItem)}>Copy Tags</button>
      <button onClick={() => onPasteTags(masterItem)}>Paste Tags</button>
    </div>
  );
}
```

**File: `src/app/(protected)/admin/products/actions.ts`**
```typescript
// NEW: Duplicate master item server action
export async function duplicateMasterItem(masterItemId: string) {
  await checkAdmin();

  // Fetch source master item
  const [source] = await db
    .select()
    .from(masterItems)
    .where(eq(masterItems.id, masterItemId))
    .limit(1);

  if (!source) throw new Error('Master item not found');

  // Create duplicate with new ID and modified name
  const [duplicate] = await db
    .insert(masterItems)
    .values({
      name: `${source.name} (Copy)`,
      categoryId: source.categoryId, // Same subcategory
      description: source.description,
      status: 'active',
      timeframes: source.timeframes,
      demographics: source.demographics,
      locations: source.locations,
      scenarios: source.scenarios,
      // New createdAt (automatic), new ID (automatic), empty changeHistory (default)
    })
    .returning();

  revalidatePath('/admin/products');
  return duplicate;
}
```

**File: `src/app/(protected)/admin/products/page.client.tsx`**
```typescript
// NEW: Handle duplicate action
const handleDuplicateMasterItem = async (item: MasterItem) => {
  try {
    const duplicate = await duplicateMasterItem(item.id);

    // Open edit modal with duplicated item
    setEditingMasterItem(duplicate);

    toast({
      title: "Master item duplicated",
      description: `Created "${duplicate.name}" - you can now edit it.`,
    });
  } catch (error) {
    toast({
      title: "Duplication failed",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive",
    });
  }
};

// Update context menu handler
const handleMasterItemContextMenu = (e: React.MouseEvent, item: MasterItem) => {
  masterItemMenu.openMenu(e, item, {
    onEdit: (item) => { /* existing */ },
    onAddProduct: (item) => { /* existing */ },
    onMove: (item) => { /* existing */ },
    onDuplicate: handleDuplicateMasterItem, // NEW
    onCopyTags: (item) => { /* existing */ },
    onPasteTags: (item) => { /* existing */ }
  });
};
```

### 🎯 **Key Changes Summary**
- [x] **Change 1:** Add `onDuplicate` prop and handler to `MasterItemContextMenu` component - adds UI button with Files icon
- [x] **Change 2:** Create new `duplicateMasterItem()` server action in `actions.ts` - handles data duplication logic
- [x] **Change 3:** Add `handleDuplicateMasterItem()` function in `page.client.tsx` - orchestrates duplication workflow
- [x] **Files Modified:** 3 files total
  - `MasterItemContextMenu.tsx` (~10 lines added)
  - `actions.ts` (~30 lines added)
  - `page.client.tsx` (~20 lines added)
- [x] **Impact:** Users can now duplicate master items with one click, reducing manual data entry for similar items

---

## 11. Implementation Plan

### Phase 1: Server Action Implementation
**Goal:** Create the server-side duplication logic

- [x] **Task 1.1:** Create `duplicateMasterItem()` Server Action
  - Files: `src/app/(protected)/admin/products/actions.ts`
  - Details:
    - Add new async function after `updateMasterItem()`
    - Check admin authorization with `checkAdmin()`
    - Fetch source master item by ID using Drizzle query
    - Create new master item with copied data
    - Append " (Copy)" to name
    - Reset changeHistory to empty array
    - Return new master item data
    - Call `revalidatePath('/admin/products')`

### Phase 2: Context Menu UI Update
**Goal:** Add "Duplicate" option to master item context menu

- [x] **Task 2.1:** Add Duplicate Button to Context Menu
  - Files: `src/app/(protected)/admin/products/components/MasterItemContextMenu.tsx`
  - Details:
    - Import `Files` icon from lucide-react
    - Add `onDuplicate` prop to interface
    - Add duplicate button after "Move Master Item"
    - Use same styling as other menu items
    - Position between "Move" and divider

- [x] **Task 2.2:** Update Context Menu Props Interface
  - Files: `src/app/(protected)/admin/products/components/MasterItemContextMenu.tsx`
  - Details: Add `onDuplicate: (item: MasterItem) => void` to `MasterItemContextMenuProps`

### Phase 3: Client-Side Integration
**Goal:** Wire up the duplicate action in the main page component

- [x] **Task 3.1:** Create Duplicate Handler Function
  - Files: `src/app/(protected)/admin/products/page.client.tsx`
  - Details:
    - Create `handleDuplicateMasterItem` async function
    - Call `duplicateMasterItem()` server action
    - Handle success: open edit modal with new item
    - Handle errors: show error toast
    - Show success toast with new item name

- [x] **Task 3.2:** Update Context Menu Callback
  - Files: `src/app/(protected)/admin/products/page.client.tsx`
  - Details: Add `onDuplicate: handleDuplicateMasterItem` to context menu props

### Phase 4: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [x] **Task 4.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run `npm run lint` on modified files - NEVER run dev server, build, or start commands

- [x] **Task 4.2:** Type Safety Check
  - Files: Modified TypeScript files
  - Details: Run `npm run type-check` to verify no type errors

- [x] **Task 4.3:** Static Logic Review
  - Files: `actions.ts`, `page.client.tsx`, `MasterItemContextMenu.tsx`
  - Details: Read code to verify duplication logic, error handling, UI integration

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 4, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 5: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [x] **Task 5.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [x] **Task 5.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 6: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [x] **Task 6.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing

- [x] **Task 6.2:** Request User UI Testing
  - Files: Browser testing checklist:
    - [ ] Right-click on a master item header
    - [ ] Verify "Duplicate Master Item" appears in context menu with Files icon
    - [ ] Click "Duplicate Master Item"
    - [ ] Verify new item created with " (Copy)" appended to name
    - [ ] Verify edit modal opens automatically with duplicated item
    - [ ] Verify all tags copied correctly (timeframes, demographics, locations, scenarios)
    - [ ] Edit the name and save
    - [ ] Verify duplicate appears in the product list under same subcategory
    - [ ] Test on mobile, tablet, and desktop viewports
    - [ ] Test in both light and dark mode

- [x] **Task 6.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [x] **🗓️ GET TODAY'S DATE FIRST** - Current date: 2025-12-19
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)

---

## 13. File Structure & Organization

### New Files to Create
**None** - All changes are modifications to existing files.

### Files to Modify
- [x] **`src/app/(protected)/admin/products/actions.ts`** - Add `duplicateMasterItem()` server action
- [x] **`src/app/(protected)/admin/products/components/MasterItemContextMenu.tsx`** - Add duplicate button and handler prop
- [x] **`src/app/(protected)/admin/products/page.client.tsx`** - Add duplicate handler function and wire to context menu

### Dependencies to Add
**None** - All required dependencies already installed (lucide-react for Files icon).

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [x] **Error Scenario 1:** Source master item not found (deleted between right-click and action)
  - **Code Review Focus:** `duplicateMasterItem()` server action - verify null check after database query
  - **Potential Fix:** Throw clear error message "Master item not found" if source doesn't exist

- [x] **Error Scenario 2:** Database constraint violation (category deleted, foreign key error)
  - **Code Review Focus:** `duplicateMasterItem()` - ensure try/catch with user-friendly error messages
  - **Potential Fix:** Wrap insert in try/catch, handle foreign key errors specifically

- [x] **Error Scenario 3:** Network failure during duplication
  - **Code Review Focus:** `handleDuplicateMasterItem()` in page.client.tsx - verify error toast shown
  - **Potential Fix:** Already handled by try/catch with destructive toast variant

### Edge Cases to Consider
- [x] **Edge Case 1:** Duplicating a master item multiple times creates "Item (Copy) (Copy) (Copy)"
  - **Analysis Approach:** This is acceptable behavior - user can rename immediately in edit modal
  - **Recommendation:** No change needed - keeps implementation simple

- [x] **Edge Case 2:** Very long master item names with " (Copy)" appended exceed reasonable length
  - **Analysis Approach:** Check if database has length constraint on name field
  - **Recommendation:** Add optional truncation if name + " (Copy)" > reasonable limit (e.g., 200 chars)

- [x] **Edge Case 3:** User duplicates while master item is being edited by another admin
  - **Analysis Approach:** Duplication creates independent copy, no conflict
  - **Recommendation:** No change needed - duplication is snapshot of current state

### Security & Access Control Review
- [x] **Admin Access Control:** `duplicateMasterItem()` server action uses `checkAdmin()` - properly restricted
- [x] **Authentication State:** Context menu only visible to logged-in admins (middleware protected route)
- [x] **Form Input Validation:** No user input beyond master item ID - ID comes from existing database record
- [x] **Permission Boundaries:** Admin-only feature, no cross-user data access concerns

**Priority Order:**
1. **Critical:** Ensure admin authorization check in server action ✅
2. **Important:** Handle "not found" error gracefully ✅
3. **Nice-to-have:** Name length truncation for very long names

---

## 15. Deployment & Configuration

### Environment Variables
**None required** - Feature uses existing database and authentication configuration.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
**✅ STRATEGIC ANALYSIS SKIPPED** - Straightforward implementation with clear pattern.

### Communication Preferences
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates
- [x] Flag any blockers or concerns immediately
- [x] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **✅ STRATEGIC ANALYSIS COMPLETE** - Skipped (straightforward implementation)

2. **✅ TASK DOCUMENT CREATED** - Current document

3. **PRESENT IMPLEMENTATION OPTIONS (Required)**
   - [ ] After user review, present these 3 exact options:

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

### Code Quality Standards
- [x] Follow TypeScript best practices
- [x] Add proper error handling with user-friendly messages
- [x] Use early returns for validation
- [x] Use async/await (no .then() chains)
- [x] No fallback behavior - fail fast with clear errors
- [x] Professional comments explaining business logic
- [x] Ensure responsive design (mobile-first)
- [x] Test in both light and dark mode
- [x] Follow accessibility guidelines (WCAG AA)

### Architecture Compliance
- [x] **✅ VERIFIED: Correct data access pattern** - Server Action for mutation
- [x] **✅ VERIFIED: No server/client boundary violations** - All server code in actions.ts
- [x] **✅ VERIFIED: Proper context usage** - Admin auth via checkAdmin()
- [x] **❌ AVOID: Creating unnecessary API routes** - Using Server Actions instead
- [x] **🔍 DOUBLE-CHECK: Does this need an API route?** - NO, Server Action is appropriate

---

## 17. Notes & Additional Context

### Research Links
- Existing Server Actions pattern: `src/app/(protected)/admin/products/actions.ts` (createMasterItem, updateMasterItem)
- Context Menu component: `src/app/(protected)/admin/products/components/MasterItemContextMenu.tsx`
- Master Item schema: `src/db/schema/products.ts` (masterItems table)

### **⚠️ Common Server/Client Boundary Pitfalls to Avoid**

**✅ ALWAYS DO:**
- Keep server actions in `actions.ts` files with `"use server"` directive
- Use `checkAdmin()` for authorization in server actions
- Call `revalidatePath()` after mutations to refresh server-side data
- Handle errors in client with try/catch and toast notifications

**❌ NEVER DO:**
- Mix database operations with client-side utilities in same file
- Forget to revalidate path after mutations
- Skip admin authorization checks in server actions

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** No API changes - new server action doesn't affect existing endpoints
- [x] **Database Dependencies:** No schema changes - uses existing master_items table
- [x] **Component Dependencies:** Context menu component gains new prop (backward compatible with default handler)
- [x] **Authentication/Authorization:** No changes to auth patterns - uses existing `checkAdmin()`

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** New master items appear in same location as manual creation - no UI surprises
- [x] **UI/UX Cascading Effects:** Context menu grows by one item - minimal visual impact
- [x] **State Management:** Uses existing modal state management - no new state patterns
- [x] **Routing Dependencies:** No routing changes - operates within existing admin/products page

#### 3. **Performance Implications**
- [x] **Database Query Impact:** Single SELECT + single INSERT - minimal performance impact (<100ms)
- [x] **Bundle Size:** Uses existing lucide-react Files icon - no new dependencies
- [x] **Server Load:** Duplication is user-initiated action, not automated - no load concerns
- [x] **Caching Strategy:** `revalidatePath()` invalidates cached product data - expected behavior

#### 4. **Security Considerations**
- [x] **Attack Surface:** No new public endpoints - server action protected by `checkAdmin()`
- [x] **Data Exposure:** Duplicates only data user already has access to - no privilege escalation
- [x] **Permission Escalation:** Admin-only feature with proper authorization checks
- [x] **Input Validation:** Master item ID validated via database query (non-existent IDs fail gracefully)

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:** Enhancement only - doesn't change existing workflows
- [x] **Data Migration:** No user action required - feature works immediately
- [x] **Feature Deprecation:** No features removed or changed
- [x] **Learning Curve:** Intuitive right-click action - minimal learning required

#### 6. **Maintenance Burden**
- [x] **Code Complexity:** Simple duplication logic - easy to understand and maintain
- [x] **Dependencies:** No new dependencies - uses existing patterns
- [x] **Testing Overhead:** Manual testing only - feature is straightforward
- [x] **Documentation:** This task document serves as implementation documentation

### Critical Issues Identification

#### 🟢 **NO RED FLAGS IDENTIFIED**
All critical security and functionality concerns addressed:
- ✅ Admin authorization properly implemented
- ✅ No breaking changes or data loss risks
- ✅ No performance degradation expected
- ✅ No security vulnerabilities introduced

#### 🟡 **YELLOW FLAGS - Minor Considerations**
- [x] **Name Length:** Very long names with " (Copy)" appended could be unwieldy
  - **Mitigation:** User can immediately edit name in auto-opened modal
  - **Decision:** Acceptable - prioritize simplicity over edge case handling

- [x] **Multiple Duplications:** Repeated duplication creates "Item (Copy) (Copy)"
  - **Mitigation:** User controls this workflow and can rename as needed
  - **Decision:** Acceptable - alternative (smart numbering) adds complexity

### Mitigation Strategies

#### Database Changes
**Not applicable** - no schema changes

#### API Changes
**Not applicable** - new server action, no breaking changes to existing APIs

#### UI/UX Changes
- [x] **Gradual Rollout:** Feature is additive - appears immediately without disrupting existing workflows
- [x] **User Communication:** No communication needed - intuitive right-click discovery
- [x] **Help Documentation:** Task document serves as reference for future developers

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections reviewed - no critical issues identified
- [x] **Identify Critical Issues:** No red flags, minor yellow flags documented with mitigations
- [x] **Propose Mitigation:** Mitigations described for edge cases (acceptable as-is)
- [x] **Alert User:** No significant second-order impacts requiring user attention
- [x] **Recommend Alternatives:** Current approach is optimal for requirements

### Impact Analysis Summary

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:** None ✅

**Performance Implications:**
- Single database query + insert operation (~50-100ms)
- No bundle size increase (uses existing icons)
- User-initiated action (no automated load)

**Security Considerations:**
- Admin-only access via checkAdmin() ✅
- No new attack surface
- Proper input validation via database constraints

**User Experience Impacts:**
- Purely additive feature - enhances existing workflow
- Auto-opens edit modal for immediate customization
- Intuitive right-click discovery

**Maintenance Considerations:**
- Simple, maintainable code following existing patterns
- No new dependencies or frameworks
- Well-documented via this task document

**🟢 NO USER ATTENTION REQUIRED**
All impacts are positive or neutral. No deployment concerns, breaking changes, or security risks. Feature is ready for implementation.
```

---

*Template Version: 1.3*
*Created: 2025-12-19*
*Task Number: 061*
