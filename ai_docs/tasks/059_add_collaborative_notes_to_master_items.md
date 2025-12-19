# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Add Collaborative Notes System for Master Items

### Goal Statement
**Goal:** Implement a Microsoft Word-style collaborative commenting system for master items in the products catalog, enabling admins to have threaded discussions about specific items. This will improve team collaboration by providing a dedicated space for notes, questions, and decisions related to product catalog management.

---

## 📊 Task Progress Summary

**Status:** 🟡 Planning Complete - Ready for Implementation
**Last Updated:** 2024-12-19 13:43 EST
**Progress:** 25% Complete (Planning Phase)

### ✅ Completed Steps
- [x] **Strategic Analysis** - Evaluated 3 solution options (JSON field, dedicated table, real-time) ✓ 2024-12-19
- [x] **User Decision** - Approved Option 1 (Simple JSON Field) for speed and simplicity ✓ 2024-12-19
- [x] **Task Documentation** - Created comprehensive task document (059_add_collaborative_notes_to_master_items.md) ✓ 2024-12-19
- [x] **Code Preview** - Provided detailed before/after code snippets for all changes ✓ 2024-12-19
- [x] **Architecture Design** - Documented JSON schema structure, Server Action approach, UI component hierarchy ✓ 2024-12-19

### ⏸️ Paused / Waiting
- [ ] **User Approval** - Awaiting "Approved" or "Go ahead" to begin phase-by-phase implementation
- [ ] **Implementation** - Ready to start Phase 1 (Database Changes) once approved

### 🎯 Next Steps When Resuming
1. Begin Phase 1: Add `comments` JSON field to `master_items` schema
2. Generate and review database migration
3. Create down migration file (MANDATORY before running migration)
4. Proceed through remaining phases (Backend → UI Components → Integration → Polish)

### 📋 Implementation Approach Summary
**Chosen Strategy:** Option 1 - Simple JSON Field
- Single column addition to existing table
- User data cached in comment objects (no JOINs)
- Client-side comment threading
- ~285 lines of new code, 4 new components, 3 modified files
- Estimated 1-2 days implementation time

---

## 2. Strategic Analysis & Solution Options

### Problem Context
Admin teams need a way to collaborate and discuss master items within the products catalog interface. Currently, there's no built-in communication mechanism for leaving notes, asking questions, or tracking discussions about specific master items. This leads to external communication tools being used, resulting in fragmented context and lost information.

### Solution Options Analysis

#### Option 1: Simple JSON Field with Client-Side Rendering
**Approach:** Add a `notes` JSON field to the `master_items` table containing an array of comment objects. All conversation logic handled client-side.

**Pros:**
- ✅ Fastest implementation - single migration, minimal backend changes
- ✅ Flexible schema - easy to add fields without migrations
- ✅ Lightweight - no additional tables or complex queries

**Cons:**
- ❌ Limited querying capability - can't easily search across all comments
- ❌ No relational integrity - can't enforce foreign key constraints for users
- ❌ Difficult to add advanced features later (reactions, mentions, notifications)
- ❌ No query optimization - must load all comments to access any

**Implementation Complexity:** Low - 1-2 days
**Risk Level:** Low - Simple schema change with minimal dependencies

#### Option 2: Dedicated Comments Table with Relations (RECOMMENDED)
**Approach:** Create a new `master_item_comments` table with proper foreign key relationships to master_items and profiles tables.

**Pros:**
- ✅ Proper relational structure - database enforces integrity
- ✅ Query optimization - can index, filter, and paginate comments efficiently
- ✅ Extensible architecture - easy to add features like reactions, editing history, soft deletes
- ✅ Better performance at scale - only load necessary comments
- ✅ Supports advanced features - mentions, notifications, search

**Cons:**
- ❌ More initial setup - requires new table, indexes, and query functions
- ❌ Additional queries - need JOINs to fetch comment data with user info
- ❌ Schema changes more complex - adding fields requires migrations

**Implementation Complexity:** Medium - 2-3 days
**Risk Level:** Low - Well-established pattern, clear implementation path

#### Option 3: Real-Time Collaboration with WebSockets
**Approach:** Implement real-time comment updates using WebSockets or Server-Sent Events for live collaboration.

**Pros:**
- ✅ Real-time updates - see comments appear instantly without refresh
- ✅ Modern UX - live presence indicators, typing notifications
- ✅ Better for active collaboration - multiple users editing simultaneously

**Cons:**
- ❌ Complex infrastructure - requires WebSocket server, connection management
- ❌ Higher maintenance - need to handle connection drops, reconnection logic
- ❌ Overkill for use case - admin catalog management doesn't require real-time collaboration
- ❌ Increased hosting costs - persistent connections consume resources

**Implementation Complexity:** High - 5-7 days
**Risk Level:** Medium - New infrastructure, potential scaling challenges

### Recommendation & Rationale

**🎯 ORIGINAL RECOMMENDATION:** Option 2 - Dedicated Comments Table with Relations

**✅ USER DECISION (APPROVED):** Option 1 - Simple JSON Field with Client-Side Rendering

**Why the user chose this approach:**
1. **Speed to Implementation** - Get the feature working quickly with minimal backend complexity
2. **Simplicity** - Single migration, no additional tables or complex query logic
3. **Flexibility** - Easy to iterate on the schema structure without migrations
4. **Sufficient for Current Needs** - Small admin team with moderate comment volume expected

**Implementation Approach:**
- Add `comments` JSON field to existing `master_items` table
- Store array of comment objects with structure: `{ id, userId, userName, content, timestamp, parentId?, replies? }`
- All comment manipulation handled client-side in React components
- Simple Server Action to update entire comments array when changes occur
- User info stored directly in comment object (no JOINs needed)

**Trade-offs Accepted:**
- Cannot efficiently query/search across all comments (acceptable for small team)
- User info duplicated in each comment (storage cheap, simplifies queries)
- Scaling to 100+ comments per item may require refactoring later (acceptable risk)

**Migration Path:**
If advanced features needed later, can migrate JSON data to dedicated table without data loss. Comment objects already structured for easy transformation.

### Decision Confirmation

**✅ APPROVED:** Option 1 - Simple JSON Field Approach

**Next Steps:**
Proceeding with simplified implementation plan focusing on JSON field storage and client-side comment management.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM
- **UI & Styling:** Shadcn/ui components with Tailwind CSS v4
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Components:**
  - `src/components/admin/` - Admin-specific components
  - `src/app/(protected)/admin/products/components/MasterItemRow.tsx` - Current master item display
  - `src/app/(protected)/admin/products/page.client.tsx` - Main products catalog page

### Current State
**Master Items Table Structure:**
```typescript
// src/db/schema/products.ts
export const masterItems = pgTable(
  'master_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id').notNull().references(() => categories.id),
    name: text('name').notNull(),
    description: text('description'),
    embedding: vector('embedding', { dimensions: 768 }),
    status: text('status').notNull().default('active'),
    timeframes: text('timeframes').array(),
    demographics: text('demographics').array(),
    locations: text('locations').array(),
    scenarios: text('scenarios').array(),
    changeHistory: jsonb('change_history').default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  }
);
```

**Master Item Display:**
- Rendered in collapsible sections within the products catalog
- Header shows name, description, and tag badges (scenarios, demographics, timeframes, locations)
- Right-click context menu for editing, moving, copying tags, etc.
- Currently no visual indicator for notes or comments
- Active/selected state shown with green highlight

**User Authentication:**
- Admin users already authenticated via Supabase
- User profile data available in `profiles` table
- Admin role checked via `profiles.role` column

### Existing Context Providers Analysis
- **UserContext (`useUser()`):** Not currently implemented in this codebase - user data fetched per-component
- **UsageContext (`useUsage()`):** Not applicable to admin features
- **Other Context Providers:** None found in contexts/ directory
- **Context Hierarchy:** Protected route layout provides authentication, no other context providers
- **Available Context Hooks:** None currently available

**🔍 Context Coverage Analysis:**
- User data currently fetched on-demand using `createClient()` from `@/utils/supabase/server`
- No central user context provider - each component fetches user data independently
- For comments feature, will need to pass user data to client components for display
- Consider adding a UserContext provider to admin layout in future refactoring

## 4. Context & Problem Definition

### Problem Statement
Admin teams managing the products catalog need a way to collaborate and communicate about specific master items directly within the interface. Currently, discussions about product categorization, naming conventions, or data quality issues happen in external tools (Slack, email, etc.), leading to:

1. **Lost Context:** Decisions and rationale scattered across multiple platforms
2. **Delayed Responses:** Team members unaware of questions until checking external tools
3. **Duplicate Work:** Multiple admins making conflicting changes without awareness
4. **Knowledge Silos:** New team members can't see historical discussions that led to current state
5. **Inefficient Workflow:** Constant context switching between catalog and communication tools

This collaborative notes feature will provide a dedicated space for discussions, reducing friction and improving team efficiency.

### Success Criteria
- [ ] Admins can add comments/notes to any master item via a yellow sticky note indicator
- [ ] Sidebar slides in from the right showing full conversation history
- [ ] Each comment displays the author's username and timestamp
- [ ] Different users' comments are visually distinguished with color-coding
- [ ] Comments support threaded replies (conversation format like Microsoft Word comments)
- [ ] Conversation history persists across sessions and page reloads
- [ ] Comments load quickly (<500ms) even for items with many comments
- [ ] UI is responsive and works on tablet screens (768px+)

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
- FR1: User can click a yellow sticky note icon on any master item to open the comments sidebar
- FR2: Sidebar slides in from the right (400px width), overlaying the product catalog
- FR3: Sidebar displays all comments for the selected master item in chronological order
- FR4: User can add a new comment via a text input at the bottom of the sidebar
- FR5: Each comment displays: author username, timestamp (relative format like "2 hours ago"), comment text
- FR6: Comments from different users are color-coded (max 6 colors, cycle through for 7+ users)
- FR7: User can reply to existing comments, creating a threaded conversation
- FR8: Comment text supports multi-line input and preserves line breaks in display
- FR9: Sidebar has a close button (X) to dismiss and return to catalog view
- FR10: Sticky note indicator shows a count badge when master item has comments (e.g., "3")
- FR11: Unread comments indicator (future enhancement - not in scope for MVP)

### Non-Functional Requirements
- **Performance:** Comments sidebar opens in <300ms, new comments appear in <500ms
- **Security:** Only authenticated admin users can view/add comments, user IDs validated server-side
- **Usability:** Keyboard shortcuts (ESC to close sidebar, Enter to submit comment)
- **Responsive Design:** Sidebar adapts to tablet (768px+) and desktop (1024px+) screen sizes
- **Theme Support:** Sidebar and comments support both light and dark mode
- **Compatibility:** Works in all modern browsers (Chrome, Firefox, Safari, Edge)

### Technical Constraints
- Must use existing Drizzle ORM schema patterns
- Must use Supabase Auth for user identification
- Must follow existing shadcn/ui component styling conventions
- Add JSON field to `master_items` table for storing comments
- Must use Server Actions for comment mutations (add/update comments JSON)
- Client-side logic for comment threading and display

---

## 7. Data & Database Changes

### Database Schema Changes
```sql
-- Add comments JSON field to existing master_items table
ALTER TABLE master_items
ADD COLUMN comments JSONB DEFAULT '[]'::jsonb;
```

### Data Model Updates
```typescript
// src/db/schema/products.ts - Update existing masterItems table
export const masterItems = pgTable(
  'master_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    embedding: vector('embedding', { dimensions: 768 }),
    status: text('status').notNull().default('active'),
    timeframes: text('timeframes').array(),
    demographics: text('demographics').array(),
    locations: text('locations').array(),
    scenarios: text('scenarios').array(),
    changeHistory: jsonb('change_history').default([]),
    comments: jsonb('comments').default([]), // NEW FIELD
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  // ... existing indexes
);

// Comment data structure (TypeScript types)
export interface MasterItemComment {
  id: string;                    // UUID for the comment
  userId: string;                 // User ID from profiles table
  userName: string;               // User's display name (cached for display)
  userEmail: string;              // User's email (cached for display)
  content: string;                // Comment text content
  timestamp: string;              // ISO 8601 timestamp
  parentId?: string | null;       // Optional parent comment ID for replies
  replies?: MasterItemComment[];  // Optional nested replies
}

// Example JSON structure stored in database:
// [
//   {
//     "id": "550e8400-e29b-41d4-a716-446655440000",
//     "userId": "123e4567-e89b-12d3-a456-426614174000",
//     "userName": "John Doe",
//     "userEmail": "john@example.com",
//     "content": "We should consider adding more suppliers for this item.",
//     "timestamp": "2024-12-19T10:30:00Z",
//     "parentId": null,
//     "replies": [
//       {
//         "id": "660e8400-e29b-41d4-a716-446655440001",
//         "userId": "223e4567-e89b-12d3-a456-426614174001",
//         "userName": "Jane Smith",
//         "userEmail": "jane@example.com",
//         "content": "I agree! Amazon has some good options.",
//         "timestamp": "2024-12-19T11:15:00Z",
//         "parentId": "550e8400-e29b-41d4-a716-446655440000"
//       }
//     ]
//   }
// ]
```

### Data Migration Plan
- [ ] Update schema file `src/db/schema/products.ts` to add `comments` field
- [ ] Generate migration file using `npm run db:generate`
- [ ] Review generated SQL for correctness (should be simple ALTER TABLE ADD COLUMN)
- [ ] Create down migration file following `drizzle_down_migration.md` template
- [ ] Test migration on development database
- [ ] No data migration needed (new field with default empty array)

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

#### **MUTATIONS (Server Actions)** → Modify existing `app/(protected)/admin/products/actions.ts`
- [ ] **Update Master Item Action** - Modify existing `updateMasterItem()` Server Action
- [ ] Accept full comments array as parameter and update JSON field
- [ ] Must use `'use server'` directive and `revalidatePath()` after mutations
- [ ] **What qualifies as mutations**: Updating the comments JSON array

#### **QUERIES (Data Fetching)** → Direct in Server Components
- [ ] **No complex queries needed** - Comments already included in master item data
- [ ] Master item query already fetches all fields including new `comments` JSON field
- [ ] Client-side parses and displays comment threads from JSON structure

### Server Actions
- [ ] **Modify `updateMasterItem(formData: FormData)`** - Update to accept and save comments JSON
  - Extract comments array from FormData
  - Validate comment structure (required fields: id, userId, userName, content, timestamp)
  - Update master_items record with new comments array
  - Revalidate path after update

### Database Queries
No new query functions needed - existing `getMasterItems()` already fetches comments field.

### API Routes (Only for Special Cases)
No API routes needed for this feature - Server Action mutation sufficient.

---

## 9. Frontend Changes

### New Components
- [ ] **`components/admin/master-item-comments/CommentsSidebar.tsx`** - Main sidebar component that slides in from right
- [ ] **`components/admin/master-item-comments/CommentThread.tsx`** - Displays a single comment with nested replies
- [ ] **`components/admin/master-item-comments/CommentInput.tsx`** - Text input for adding new comments or replies
- [ ] **`components/admin/master-item-comments/StickyNoteIndicator.tsx`** - Yellow sticky note icon with optional count badge

**Component Organization Pattern:**
- New feature-specific directory: `components/admin/master-item-comments/`
- All comment-related components in this directory
- Import into products catalog page

**Component Requirements:**
- **Responsive Design:** Sidebar 400px on desktop, 100% width on mobile (<768px)
- **Theme Support:** Use CSS variables for colors, support `dark:` classes
- **Accessibility:** Keyboard navigation (Tab, Enter, ESC), ARIA labels, semantic HTML
- **Text Sizing & Readability:**
  - Comment content: Use `text-base` (16px) for comfortable reading
  - Timestamps and metadata: Use `text-xs` (12px)
  - Username labels: Use `text-sm` (14px)

### Page Updates
- [ ] **`/admin/products`** - Add sticky note indicator to MasterItemRow component
- [ ] **`/admin/products`** - Integrate CommentsSidebar component with state management

### State Management
**Local State (useState):**
- `isSidebarOpen: boolean` - Controls sidebar visibility
- `selectedMasterItemId: string | null` - Tracks which master item's comments to show
- `comments: MasterItemCommentWithUser[]` - Comment data for selected master item
- `replyingToCommentId: string | null` - Tracks which comment user is replying to

**Data Flow:**
1. User clicks sticky note indicator → sets `selectedMasterItemId` and `isSidebarOpen: true`
2. Sidebar opens → fetches comments using `getCommentsByMasterItem(selectedMasterItemId)`
3. User types comment → controlled input state
4. User submits → calls `createComment()` Server Action → revalidates and updates local state
5. User clicks reply → sets `replyingToCommentId` → shows nested input
6. User submits reply → calls `replyToComment()` → updates local state

**No Context Providers Needed:**
- Comments are scoped to individual master items (not global state)
- User info fetched as part of comment queries (no separate user context needed)

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

#### 📂 **Current Implementation (Before)**

**Master Item Row (No Comments Feature):**
```typescript
// src/app/(protected)/admin/products/components/MasterItemRow.tsx (lines 77-100)
<div className="bg-card border rounded-xl overflow-hidden shadow-sm">
  {/* Master Item Header */}
  {masterGroup.masterItem && (
    <div className="px-6 py-3 cursor-pointer" onClick={...}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold">{masterGroup.masterItem.name}</h4>
          {/* Description and tag badges... */}
        </div>
        {/* Currently no sticky note indicator */}
      </div>
    </div>
  )}
  {/* Products table... */}
</div>
```

**Products Schema (No Comments Table):**
```typescript
// src/db/schema/products.ts
export const masterItems = pgTable('master_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').notNull(),
  name: text('name').notNull(),
  // ... other fields
  // No comments field or relation
});

// No master_item_comments table exists
```

#### 📂 **After Implementation**

**Master Item Row (With Comments Feature):**
```typescript
// src/app/(protected)/admin/products/components/MasterItemRow.tsx
import { StickyNoteIndicator } from '@/components/admin/master-item-comments/StickyNoteIndicator';

<div className="bg-card border rounded-xl overflow-hidden shadow-sm">
  {masterGroup.masterItem && (
    <div className="px-6 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4>{masterGroup.masterItem.name}</h4>
        </div>
        {/* NEW: Sticky note indicator */}
        <StickyNoteIndicator
          masterItemId={masterGroup.masterItem.id}
          commentCount={masterGroup.commentCount || 0}
          onClick={() => onOpenComments(masterGroup.masterItem.id)}
        />
      </div>
    </div>
  )}
</div>
```

**New Database Schema:**
```typescript
// src/db/schema/master-item-comments.ts (NEW FILE)
export const masterItemComments = pgTable(
  'master_item_comments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    masterItemId: uuid('master_item_id').notNull(),
    userId: uuid('user_id').notNull(),
    parentCommentId: uuid('parent_comment_id'), // For threading
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  // Indexes for performance...
);
```

**New Components Structure:**
```typescript
// components/admin/master-item-comments/CommentsSidebar.tsx (NEW FILE)
export function CommentsSidebar({ masterItemId, isOpen, onClose }) {
  // Fetch comments, render sidebar sliding from right
  // Display comment threads with user colors
  // Provide input for new comments/replies
}

// components/admin/master-item-comments/CommentThread.tsx (NEW FILE)
export function CommentThread({ comment, userColor, onReply }) {
  // Render single comment with author, timestamp, content
  // Show nested replies recursively
  // Color-code by user
}

// components/admin/master-item-comments/StickyNoteIndicator.tsx (NEW FILE)
export function StickyNoteIndicator({ commentCount, onClick }) {
  // Yellow sticky note icon
  // Badge showing comment count if > 0
}
```

#### 🎯 **Key Changes Summary**
- [ ] **Change 1:** Add `master_item_comments` table to database with proper foreign keys and indexes
- [ ] **Change 2:** Create new `components/admin/master-item-comments/` directory with 4 new components
- [ ] **Change 3:** Create `lib/master-item-comments.ts` for complex query functions (fetch comments with user info + replies)
- [ ] **Change 4:** Create `app/actions/master-item-comments.ts` for Server Actions (create comment, reply)
- [ ] **Change 5:** Integrate sticky note indicator into `MasterItemRow` component
- [ ] **Change 6:** Add sidebar state management to main products page (`page.client.tsx`)
- [ ] **Files Modified:**
  - `src/app/(protected)/admin/products/components/MasterItemRow.tsx` (add sticky note indicator)
  - `src/app/(protected)/admin/products/page.client.tsx` (add sidebar state and integration)
  - `src/db/schema/index.ts` (export new comments schema)
- [ ] **Impact:** Adds collaborative commenting capability to master items without affecting existing functionality. Comments load on-demand when sidebar opened, no performance impact on main catalog view.

---

## 11. Implementation Plan

### Phase 1: Database Changes
**Goal:** Create database schema for comments with safe rollback capability

- [ ] **Task 1.1:** Create Drizzle Schema for Comments
  - Files: `src/db/schema/master-item-comments.ts`, `src/db/schema/index.ts`
  - Details: Define `masterItemComments` table with foreign keys to `master_items` and `profiles`, add indexes
- [ ] **Task 1.2:** Generate Database Migration
  - Command: `npm run db:generate`
  - Details: Generate migration SQL from schema changes
- [ ] **Task 1.3:** Create Down Migration (MANDATORY)
  - Files: `drizzle/migrations/[timestamp]/down.sql`
  - Details: Follow `drizzle_down_migration.md` template to create safe rollback
- [ ] **Task 1.4:** Apply Migration
  - Command: `npm run db:migrate`
  - Details: Only run after down migration is created and verified

### Phase 2: Backend Query Functions
**Goal:** Create server-side functions for fetching and mutating comments

- [ ] **Task 2.1:** Create Comment Query Functions
  - Files: `src/lib/master-item-comments.ts`
  - Details: Implement `getCommentsByMasterItem()` with JOINs to profiles, nested reply threading
- [ ] **Task 2.2:** Create Server Actions for Comments
  - Files: `src/app/actions/master-item-comments.ts`
  - Details: Implement `createComment()` and `replyToComment()` with validation and revalidation
- [ ] **Task 2.3:** Add TypeScript Types
  - Files: `src/lib/types/master-item-comments.ts`
  - Details: Export `MasterItemComment`, `MasterItemCommentWithUser`, `CommentThread` types

### Phase 3: UI Components - Sticky Note Indicator
**Goal:** Create visual indicator for comments on master items

- [ ] **Task 3.1:** Create StickyNoteIndicator Component
  - Files: `src/components/admin/master-item-comments/StickyNoteIndicator.tsx`
  - Details: Yellow sticky note icon, count badge, click handler, dark mode support
- [ ] **Task 3.2:** Integrate Indicator into MasterItemRow
  - Files: `src/app/(protected)/admin/products/components/MasterItemRow.tsx`
  - Details: Add indicator to master item header, wire up onClick handler
- [ ] **Task 3.3:** Add Comment Count to Master Item Query
  - Files: `src/app/(protected)/admin/products/actions.ts`
  - Details: Modify `getMasterItems()` to include comment count via LEFT JOIN

### Phase 4: UI Components - Comments Sidebar
**Goal:** Build main sidebar component for displaying and creating comments

- [ ] **Task 4.1:** Create CommentsSidebar Component
  - Files: `src/components/admin/master-item-comments/CommentsSidebar.tsx`
  - Details: Slide-in animation, close button, comment list container, loading states
- [ ] **Task 4.2:** Create CommentThread Component
  - Files: `src/components/admin/master-item-comments/CommentThread.tsx`
  - Details: Render comment with user info, timestamp, content, nested replies, user color-coding
- [ ] **Task 4.3:** Create CommentInput Component
  - Files: `src/components/admin/master-item-comments/CommentInput.tsx`
  - Details: Textarea with auto-resize, submit button, keyboard shortcuts (Enter to submit, Shift+Enter for new line)
- [ ] **Task 4.4:** Implement User Color-Coding Logic
  - Files: `src/lib/user-colors.ts`
  - Details: Deterministic color assignment based on user ID (6 predefined colors, cycle for 7+ users)

### Phase 5: Integration and State Management
**Goal:** Wire up comments feature to products catalog page

- [ ] **Task 5.1:** Add Sidebar State to Products Page
  - Files: `src/app/(protected)/admin/products/page.client.tsx`
  - Details: Add `isSidebarOpen`, `selectedMasterItemId`, `comments` state variables
- [ ] **Task 5.2:** Implement Sidebar Open/Close Handlers
  - Files: `src/app/(protected)/admin/products/page.client.tsx`
  - Details: `handleOpenComments()`, `handleCloseSidebar()`, keyboard shortcut (ESC to close)
- [ ] **Task 5.3:** Integrate CommentsSidebar Component
  - Files: `src/app/(protected)/admin/products/page.client.tsx`
  - Details: Render sidebar with conditional display, pass props, handle comment submission

### Phase 6: Styling and Polish
**Goal:** Ensure responsive design, dark mode support, and smooth animations

- [ ] **Task 6.1:** Implement Responsive Sidebar Sizing
  - Files: `src/components/admin/master-item-comments/CommentsSidebar.tsx`
  - Details: 400px on desktop, 100% width on mobile, smooth transitions
- [ ] **Task 6.2:** Add Dark Mode Support
  - Files: All comment components
  - Details: Use CSS variables for colors, test in both light and dark themes
- [ ] **Task 6.3:** Implement Slide-In Animation
  - Files: `src/components/admin/master-item-comments/CommentsSidebar.tsx`
  - Details: Tailwind `animate-in slide-in-from-right` classes, smooth 300ms transition
- [ ] **Task 6.4:** Add User Color Distinction
  - Files: `src/components/admin/master-item-comments/CommentThread.tsx`
  - Details: Border-left color indicator, subtle background tint, 6 color palette

### Phase 7: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 7.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run linting and static analysis ONLY - NEVER run dev server, build, or start commands
- [ ] **Task 7.2:** Static Logic Review
  - Files: Modified business logic files
  - Details: Read code to verify logic syntax, edge case handling, fallback patterns
- [ ] **Task 7.3:** TypeScript Type Checking
  - Files: All TypeScript files
  - Details: Verify no type errors, proper type inference, correct prop types

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
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 9: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 9.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing
- [ ] **Task 9.2:** Request User UI Testing
  - Files: Specific browser testing checklist for user
  - Details: Test sticky note indicator visibility, sidebar slide-in animation, comment creation, reply threading, user color-coding, keyboard shortcuts
- [ ] **Task 9.3:** Wait for User Confirmation
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
│   ├── db/schema/
│   │   └── master-item-comments.ts          # New comments table schema
│   ├── lib/
│   │   ├── master-item-comments.ts          # Query functions for fetching comments
│   │   ├── types/
│   │   │   └── master-item-comments.ts      # TypeScript types for comments
│   │   └── user-colors.ts                   # User color-coding logic
│   ├── app/
│   │   └── actions/
│   │       └── master-item-comments.ts      # Server actions (create, reply)
│   └── components/admin/master-item-comments/
│       ├── CommentsSidebar.tsx              # Main sidebar component
│       ├── CommentThread.tsx                # Single comment display with replies
│       ├── CommentInput.tsx                 # Text input for comments/replies
│       └── StickyNoteIndicator.tsx          # Yellow sticky note icon with badge
└── drizzle/migrations/
    └── [timestamp]_add_master_item_comments/
        ├── migration.sql                     # Generated migration
        └── down.sql                          # Rollback migration (MANDATORY)
```

**File Organization Rules:**
- **Components**: New feature directory `components/admin/master-item-comments/`
- **Schema**: New file in `src/db/schema/master-item-comments.ts`
- **Server Actions**: New file `app/actions/master-item-comments.ts` (mutations only)
- **Query Functions**: New file `lib/master-item-comments.ts` (complex queries)
- **Types**: New directory `lib/types/` with `master-item-comments.ts`

### Files to Modify
- [ ] **`src/db/schema/index.ts`** - Export new `masterItemComments` schema
- [ ] **`src/app/(protected)/admin/products/components/MasterItemRow.tsx`** - Add sticky note indicator
- [ ] **`src/app/(protected)/admin/products/page.client.tsx`** - Integrate sidebar state and component
- [ ] **`src/app/(protected)/admin/products/actions.ts`** - Add comment count to master items query

### Dependencies to Add
No new dependencies required - using existing shadcn/ui, Tailwind, Drizzle, and Supabase packages.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** User tries to add comment while offline/connection drops
  - **Code Review Focus:** `app/actions/master-item-comments.ts` - error handling in `createComment()`
  - **Potential Fix:** Add try/catch with user-friendly error message, retry logic, optimistic UI update with rollback

- [ ] **Error Scenario 2:** Comments fail to load due to database connection timeout
  - **Code Review Focus:** `lib/master-item-comments.ts` - query timeout handling in `getCommentsByMasterItem()`
  - **Potential Fix:** Add query timeout (5s), graceful fallback to "Comments unavailable" message, retry button

- [ ] **Error Scenario 3:** User submits empty comment or reply
  - **Code Review Focus:** `components/admin/master-item-comments/CommentInput.tsx` - client-side validation
  - **Potential Fix:** Disable submit button when input empty, show error message on submit attempt

### Edge Cases to Consider
- [ ] **Edge Case 1:** Master item with 100+ comments causing performance issues
  - **Analysis Approach:** Check if `getCommentsByMasterItem()` implements pagination or limits
  - **Recommendation:** Implement pagination (20 comments per page) or lazy loading with "Load more" button

- [ ] **Edge Case 2:** Deeply nested reply threads (5+ levels) breaking UI layout
  - **Analysis Approach:** Verify `CommentThread.tsx` handles nested recursion with max depth limit
  - **Recommendation:** Flatten replies after 3 levels deep, use "Show more replies" expansion

- [ ] **Edge Case 3:** User deletes account but their comments remain
  - **Analysis Approach:** Check foreign key constraint behavior (`ON DELETE CASCADE` vs `SET NULL`)
  - **Recommendation:** Use `ON DELETE CASCADE` to remove comments when user deleted, or show "[Deleted User]" placeholder

### Security & Access Control Review
- [ ] **Admin Access Control:** Are comment features properly restricted to admin users?
  - **Check:** Verify Server Actions check user role via `profiles.role = 'ADMIN'` before allowing mutations

- [ ] **Authentication State:** Does the system handle logged-out users appropriately?
  - **Check:** Middleware already protects `/admin` routes, verify sidebar doesn't render for unauthenticated users

- [ ] **Form Input Validation:** Are user inputs validated before processing?
  - **Check:** Validate comment content length (max 5000 chars), sanitize HTML to prevent XSS, check for empty strings

- [ ] **Permission Boundaries:** Can users access comments for master items they shouldn't?
  - **Check:** All admins can view all master item comments (no additional restrictions needed per requirements)

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples. This is code analysis and gap identification - not writing tests or test procedures.

**Priority Order:**
1. **Critical:** Security and access control issues (XSS prevention, admin-only access)
2. **Important:** User-facing error scenarios (offline handling, empty submissions)
3. **Nice-to-have:** UX improvements (pagination for large threads, nested reply limits)

---

## 15. Deployment & Configuration

### Environment Variables
No new environment variables required - uses existing Supabase connection and authentication.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **EVALUATE STRATEGIC NEED** - Determine if multiple solutions exist or if it's straightforward
2. **STRATEGIC ANALYSIS** (if needed) - Present solution options with pros/cons and get user direction
3. **CREATE A TASK DOCUMENT** in `ai_docs/` using this template
4. **GET USER APPROVAL** of the task document
5. **IMPLEMENT THE FEATURE** only after approval

**DO NOT:** Present implementation plans in chat without creating a proper task document first.
**DO:** Always create comprehensive task documentation that can be referenced later.
**DO:** Present strategic options when multiple viable approaches exist.

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)**
   - [x] **Assess complexity** - Multiple viable approaches exist (JSON field vs dedicated table vs real-time)
   - [x] **Review the criteria** - Architectural decisions impact future development, touches multiple systems
   - [x] **Decision point** - CONDUCTED strategic analysis in section 2

2. **STRATEGIC ANALYSIS SECOND (If needed)**
   - [x] **Present solution options** - Presented 3 options with detailed pros/cons
   - [x] **Include implementation complexity, time estimates, and risk levels** - Included for each option
   - [x] **Provide clear recommendation** - Option 2 (Dedicated Comments Table) with detailed rationale
   - [ ] **Wait for user decision** - WAITING for user to approve strategic direction
   - [ ] **Document approved strategy** - Will update plan after user confirmation

3. **CREATE TASK DOCUMENT THIRD (Required)**
   - [x] **Create a new task document** - Created `059_add_collaborative_notes_to_master_items.md`
   - [x] **Fill out all sections** - All template sections completed with specific details
   - [x] **Include strategic analysis** - Section 2 contains comprehensive strategic analysis
   - [x] **🔢 FIND LATEST TASK NUMBER** - Found 058 as highest, using 059
   - [x] **Name the file** - Named `059_add_collaborative_notes_to_master_items.md`
   - [x] **🚨 MANDATORY: POPULATE CODE CHANGES OVERVIEW** - Section 10 shows before/after code snippets
   - [ ] **Present a summary** - Ready to present to user after saving document

4. **PRESENT IMPLEMENTATION OPTIONS (Required)**
   - [ ] **After incorporating user feedback**, present these 3 exact options:

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

---

## 17. Notes & Additional Context

### Research Links
- Microsoft Word Comments UI: Reference for comment threading and reply UX patterns
- Shadcn/ui Sheet Component: For sidebar slide-in animation pattern
- Tailwind CSS Animation: For smooth transitions and user experience

### Design Inspiration
**Color Palette for User Differentiation (6 colors):**
- User 1: Blue (#3B82F6)
- User 2: Green (#10B981)
- User 3: Purple (#8B5CF6)
- User 4: Orange (#F59E0B)
- User 5: Pink (#EC4899)
- User 6: Teal (#14B8A6)
- Users 7+: Cycle back to Blue, Green, etc.

**Color Assignment Algorithm:**
```typescript
const USER_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#14B8A6'];
const getUserColor = (userId: string): string => {
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return USER_COLORS[hash % USER_COLORS.length];
};
```

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

Before implementing any changes, the AI must systematically analyze potential second-order consequences and alert the user to any significant impacts. This analysis should identify ripple effects that might not be immediately obvious but could cause problems later.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No breaking changes - new feature with isolated schema
- [ ] **Database Dependencies:** New table references `master_items` and `profiles` - existing tables unaffected
- [ ] **Component Dependencies:** `MasterItemRow` component modified but backward compatible (sticky note indicator optional)
- [ ] **Authentication/Authorization:** Uses existing admin authentication, no changes to auth flow

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** Comments load on-demand, no impact on main catalog query performance
- [ ] **UI/UX Cascading Effects:** Sidebar overlays catalog, may obscure content - ESC key provides escape route
- [ ] **State Management:** Local state in products page, no global state conflicts
- [ ] **Routing Dependencies:** No routing changes, feature works within existing `/admin/products` page

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** New queries isolated to comment feature, indexed properly for sub-100ms response
- [ ] **Bundle Size:** +15-20KB for new components (CommentsSidebar, CommentThread, CommentInput)
- [ ] **Server Load:** Minimal - comments load on-demand, not with initial page render
- [ ] **Caching Strategy:** No caching needed initially, can add later if performance issues arise

#### 4. **Security Considerations**
- [ ] **Attack Surface:** New comment input field - potential XSS risk if not sanitized
- [ ] **Data Exposure:** Comments visible to all admins - no PII or sensitive data exposure risk
- [ ] **Permission Escalation:** Admin-only feature, no risk of non-admins accessing comments
- [ ] **Input Validation:** Must validate comment content length and sanitize HTML/script tags

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** New feature, doesn't change existing workflows - purely additive
- [ ] **Data Migration:** No migration needed - new feature with no existing data
- [ ] **Feature Deprecation:** No existing features removed
- [ ] **Learning Curve:** Intuitive sticky note indicator, similar to familiar comment UIs (Google Docs, Word)

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Moderate - new table and 4 components, but well-organized and isolated
- [ ] **Dependencies:** No new third-party dependencies, uses existing stack
- [ ] **Testing Overhead:** Requires testing comment creation, reply threading, user color-coding
- [ ] **Documentation:** Self-documenting code with TypeScript types and component props

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [ ] **XSS Vulnerability Risk:** Comment input must be sanitized to prevent script injection
  - **Mitigation:** Use built-in React XSS protection (text rendering, not dangerouslySetInnerHTML)
  - **Additional:** Server-side validation to reject comments with `<script>` or other dangerous HTML

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Performance at Scale:** 100+ comments could slow sidebar loading
  - **Mitigation:** Implement pagination (20 comments per page) or lazy loading in future enhancement
- [ ] **Deeply Nested Replies:** 5+ levels of threading could break UI layout
  - **Mitigation:** Flatten replies after 3 levels, use "Show more" expansion
- [ ] **Deleted User Handling:** What happens to comments when user account deleted?
  - **Mitigation:** Use `ON DELETE CASCADE` to remove comments or show "[Deleted User]" placeholder

### Mitigation Strategies

#### XSS Protection
- [ ] **React Protection:** Render comment content as plain text, never use `dangerouslySetInnerHTML`
- [ ] **Server Validation:** Reject comments containing `<script>`, `<iframe>`, or other dangerous tags
- [ ] **Content Sanitization:** Use DOMPurify library if rich text formatting needed in future

#### Performance Optimization
- [ ] **Lazy Loading:** Only fetch comments when sidebar opened, not on initial page load
- [ ] **Pagination:** Implement "Load more" button after 20 comments if performance issues arise
- [ ] **Index Optimization:** Composite index on `(master_item_id, created_at DESC)` for fast sorting

#### UI/UX Safeguards
- [ ] **Keyboard Shortcuts:** ESC key closes sidebar, Enter submits comment
- [ ] **Mobile Optimization:** Full-width sidebar on mobile (<768px) for better usability
- [ ] **Loading States:** Show skeleton loaders while fetching comments to prevent UI jank

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** Filled out all sections of the impact assessment
- [x] **Identify Critical Issues:** Flagged XSS vulnerability risk as red flag
- [x] **Propose Mitigation:** Suggested React XSS protection and server-side validation
- [x] **Alert User:** Documented security considerations in section 14
- [ ] **Recommend Alternatives:** No high-risk impacts that require alternative approaches

### Example Analysis Summary

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- None - This is a new feature with isolated schema and components

**Performance Implications:**
- Minimal initial impact - comments load on-demand when sidebar opened
- Potential future issue: 100+ comments could slow sidebar loading
- Mitigation: Implement pagination if needed, indexed queries ensure <100ms response

**Security Considerations:**
- 🚨 XSS Risk: Comment input field could be exploited if not properly sanitized
- Mitigation: Use React's built-in XSS protection (text rendering), add server-side validation
- Admin-only feature reduces attack surface (trusted users)

**User Experience Impacts:**
- Purely additive feature - doesn't change existing workflows
- Intuitive UI pattern (sticky note icon, familiar from Google Docs/Word comments)
- Keyboard shortcuts (ESC to close) provide escape routes

**Mitigation Recommendations:**
- Implement XSS protection at both client (React text rendering) and server (input validation)
- Add pagination for comment threads if performance issues arise (future enhancement)
- Use `ON DELETE CASCADE` for user foreign key to prevent orphaned comments
```

---

*Template Version: 1.3*
*Last Updated: 12/19/2024*
*Created By: AI Task Creator Skill*
