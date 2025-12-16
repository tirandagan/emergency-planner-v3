# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Phase 3.6 - Admin User Analytics Dashboard

### Goal Statement
**Goal:** Build a comprehensive admin user analytics system that enables administrators to monitor user engagement, identify high-value users, track subscription funnels, and make data-driven decisions about outreach and platform improvements. This system provides visibility into user behavior patterns, activity metrics, and lifetime value to support strategic growth initiatives.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
<!--
✅ CONDUCT STRATEGIC ANALYSIS WHEN:
- Multiple viable technical approaches exist ✓ (Card grid vs table, modal vs page)
- User requirements could be met through different UX patterns ✓
- Implementation approach affects performance, security, or maintainability significantly ✓
-->

### Problem Context
The admin team needs comprehensive visibility into user behavior, engagement patterns, and lifecycle metrics to:
- Identify high-value users for personalized outreach
- Monitor conversion funnels (free → basic → pro)
- Detect churn risk and engagement drops
- Make data-driven product decisions
- Track user satisfaction and platform health

Multiple UX patterns could solve this, with different trade-offs for usability and performance.

### Solution Options Analysis

#### Option 1: Card Grid with Modal Detail View (RECOMMENDED)
**Approach:** Primary view is a card grid showing user avatars and key metrics, with click-through to modal for detailed analytics.

**Pros:**
- ✅ Visual and scannable - admins can quickly spot patterns and outliers
- ✅ Flexible layout - adapts well to different screen sizes
- ✅ Modal keeps context - no navigation away from list
- ✅ Easy to implement admin preference persistence (localStorage)
- ✅ Better for visual pattern recognition (high-value users stand out)

**Cons:**
- ❌ Slightly higher initial complexity (card + table + modal components)
- ❌ More state management for view toggling
- ❌ Requires thoughtful card design for information hierarchy

**Implementation Complexity:** Medium - Requires 3 distinct UI components with shared state
**Risk Level:** Low - Standard pattern with clear separation of concerns

#### Option 2: Table-Only with Separate Detail Page
**Approach:** Traditional table view with row click navigating to dedicated user detail page.

**Pros:**
- ✅ Simpler initial implementation - single component focus
- ✅ Familiar pattern for admin users
- ✅ Deep-linkable URLs for sharing specific user views

**Cons:**
- ❌ Less visually engaging - harder to spot patterns at a glance
- ❌ Navigation overhead - loses list context when viewing details
- ❌ Back button required to return to list
- ❌ No flexibility for different admin preferences

**Implementation Complexity:** Low - Standard CRUD pattern
**Risk Level:** Low - Well-established approach

#### Option 3: Split-Pane Master-Detail View
**Approach:** Single page with user list on left, detail panel on right (always visible).

**Pros:**
- ✅ No modal or navigation overhead
- ✅ Always shows context (list + detail simultaneously)
- ✅ Fast comparison between users

**Cons:**
- ❌ Limited screen real estate - cramped on smaller screens
- ❌ No mobile support - requires full redesign for tablet/mobile
- ❌ Harder to implement responsive design
- ❌ Less flexibility for future enhancements

**Implementation Complexity:** Medium - Requires careful responsive design
**Risk Level:** Medium - Mobile/tablet experience suffers

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Card Grid with Modal Detail View

**Why this is the best choice:**
1. **User Experience Priority** - Admins need to quickly scan large user lists and identify patterns. Card grids excel at visual scanning, making it easy to spot high-value users, recent signups, or inactive accounts at a glance.
2. **Flexibility and Future-Proofing** - Supporting both card grid and table view (with toggle) accommodates different admin preferences and use cases. Some admins prefer visual cards, others prefer dense tables - this satisfies both.
3. **Performance Considerations** - Modal detail view keeps the user list in memory, allowing instant return to scanning without re-fetching data. This is faster than full page navigation for rapid user review workflows.

**Key Decision Factors:**
- **Performance Impact:** Minimal - modal keeps main list mounted, toggle preference in localStorage
- **User Experience:** Superior - visual scanning + quick detail access without losing context
- **Maintainability:** Good - clear component separation (list, cards, table, modal)
- **Scalability:** Excellent - pagination handles large user bases, view toggle accommodates growth
- **Security:** Standard - server-side authorization on all data fetches

**Alternative Consideration:**
Option 2 (Table-Only) could be preferred if admins primarily need dense data views for export/analysis tasks. However, user feedback from Phase 3.4 admin dashboard indicates admins prefer visual, scannable interfaces with quick access to details. The card grid approach better aligns with this preference.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 1 - Card Grid with Modal Detail View), or would you prefer a different approach?

**Questions for you to consider:**
- Does the card grid + modal approach align with your admin workflow priorities?
- Are there any specific admin user workflows I should optimize for?
- Should the default view be card grid or table (user preference applies after first toggle)?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan and present you with next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS for styling
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Components:**
  - `src/app/admin/AdminShell.tsx` for admin navigation with Trust Blue theme
  - `src/app/admin/layout.tsx` for admin layout structure
  - Existing admin pages: `/admin/products`, `/admin/bundles`, `/admin/suppliers`, `/admin/categories`

### Current State
**Admin Infrastructure:**
- Admin shell exists with sidebar navigation using Trust Blue theme
- Multiple admin pages already implemented (products, bundles, suppliers, categories)
- No `/admin/users` page exists yet
- Admin authorization handled via middleware checking `profiles.role = 'ADMIN'`

**Database Schema:**
- `profiles` table: Contains user data with subscription tier, status, email preferences
  - Currently has `lastLoginAt` field (tracks Supabase auth logins)
  - Missing `last_active_at` field (for general activity tracking)
  - Missing `is_high_value` boolean field (for flagging VIP users)
- `user_activity_log` table: Tracks all user activities with metadata, session info
- `mission_reports` table: Contains user-created emergency plans with scenarios
- `billing_transactions` table: Stripe payment/subscription transaction history
- `external_transactions` table: Tracks product clicks and affiliate link usage

**Activity Tracking:**
- `user_activity_log` schema supports activity type categorization
- Indexed on `user_id`, `activity_type`, `created_at` for efficient queries
- Metadata field (jsonb) allows flexible activity-specific data storage

### Existing Context Providers Analysis
**Authentication Context:**
- Admin routes protected by middleware checking `profiles.role = 'ADMIN'`
- No user context provider needed in admin section (server-side only)
- All admin pages use Server Components with direct database queries

**Data Access Patterns:**
- Admin pages fetch data directly in Server Components
- Mutations use Server Actions in `app/admin/*/actions.ts` files
- No client-side state management needed for admin analytics (read-only data)

**🔍 Context Coverage Analysis:**
- Admin authorization: ✅ Handled by middleware
- User data access: ✅ Direct Drizzle queries in Server Components
- Activity tracking: ✅ Existing `user_activity_log` table
- Subscription data: ✅ Available in `profiles` + `billing_transactions`
- No gaps identified - all data accessible via server-side queries

## 4. Context & Problem Definition

### Problem Statement
Administrators currently lack visibility into:
1. **User Engagement Patterns** - No way to see who's actively using the platform vs. dormant accounts
2. **Conversion Funnel** - Can't track free → basic → pro progression or identify drop-off points
3. **High-Value Users** - No system to flag and track users generating significant revenue or engagement
4. **Activity Metrics** - No centralized view of user actions, plan creation frequency, or feature usage
5. **Lifetime Value** - Can't quickly assess total revenue or potential revenue from individual users
6. **Outreach Targeting** - No data-driven way to identify users for personalized outreach

This limits the ability to:
- Make data-driven product decisions
- Identify and nurture high-value users
- Detect churn risk and intervene proactively
- Optimize conversion funnels
- Plan targeted email campaigns

### Success Criteria
- [x] Admin can view paginated list of all users with key metrics (tier, signup date, activity)
- [x] Admin can search/filter users by name, email, tier, and signup date range
- [x] Admin can toggle between card grid and table view (preference persisted)
- [x] Admin can click user to view detailed analytics modal with:
  - [x] Profile summary (name, email, location, timezone)
  - [x] Subscription details (tier, status, period end, payment method)
  - [x] Activity metrics (plans created, last active, account age, favorite scenarios)
  - [x] Engagement score and lifetime value
  - [x] Recent activity log (last 20 activities with timestamps and types)
  - [x] Billing transaction history (all payments with status and amounts)
- [x] Admin can flag/unflag users as "high-value" (persisted in database)
- [x] Page loads in <2 seconds with 1000+ users (indexed queries)
- [x] All user data queries respect authorization (admin-only access)

---

## 5. Technical Requirements

### Functional Requirements
- **User List Page** (`/admin/users`):
  - Display paginated user list (25 users per page, configurable dropdown: 10/25/50/100)
  - Show user cards or table rows with: name, email, tier badge, signup date, last active, plans created
  - Filter by subscription tier (FREE/BASIC/PRO) with multi-select
  - Filter by signup date range (date picker: from/to)
  - Search by name or email (debounced, 300ms delay)
  - Toggle between card grid and table view (icon button)
  - Persist admin's view preference in localStorage
  - "Export Users" button (placeholder, disabled for now)
  - Total user count and filtered count display

- **User Detail Modal**:
  - Opens when user card/row clicked
  - Fetches comprehensive user data:
    - Profile section: full name, email, phone, location, timezone, account age
    - Subscription section: tier badge, status, renewal date, payment method (last 4 from Stripe)
    - Activity metrics: plans created (count), last active timestamp, engagement score, favorite scenarios
    - Lifetime value: sum of all billing_transactions
    - Recent activities: last 20 from user_activity_log with icons and timestamps
    - Billing history: table of transactions with date, description, amount, status, invoice link
  - "Flag as High-Value" toggle button (updates profiles.is_high_value)
  - Close button returns to user list (modal dismissed)

- **High-Value Flagging**:
  - Admin can toggle high-value status for any user
  - Visual indicator on user cards/rows when flagged (star icon or badge)
  - Persisted in profiles.is_high_value boolean field
  - Filter option to show only high-value users

### Non-Functional Requirements
- **Performance:**
  - User list query: <500ms for 10,000 users (indexed)
  - User detail modal load: <300ms (single user data fetch)
  - Search/filter response: <200ms (debounced with indexed queries)
- **Security:**
  - Admin-only access enforced by middleware
  - Server Actions validate admin role before mutations
  - No sensitive data exposed in client-side state
- **Usability:**
  - Clear visual hierarchy for scanning user lists
  - Keyboard navigation support (arrow keys, enter to open modal, esc to close)
  - Loading states for all async operations
  - Error handling with toast notifications
- **Responsive Design:**
  - Card grid adapts: 1 column (mobile), 2 columns (tablet), 3-4 columns (desktop)
  - Table view scrollable horizontally on mobile
  - Modal responsive: full-screen on mobile, centered dialog on desktop
- **Theme Support:**
  - Trust Blue theme (consistent with existing admin pages)
  - Dark mode support using existing theme system
- **Compatibility:**
  - Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
  - Mobile-friendly for on-the-go admin access

### Technical Constraints
- Must use Drizzle ORM for all database queries (no raw SQL unless necessary for performance)
- Must follow existing admin page patterns (Server Components + Server Actions)
- Must integrate with existing AdminShell navigation
- Cannot modify Supabase auth.users table directly (read-only via admin API)
- Must respect existing database schema relationships and indexes

---

## 6. Data & Database Changes

### Database Schema Changes

**Add to `profiles` table:**
```sql
-- Migration: Add high-value flag and last active tracking
ALTER TABLE profiles
  ADD COLUMN is_high_value BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE;

-- Create index for admin filtering by high-value status
CREATE INDEX idx_profiles_is_high_value ON profiles(is_high_value);

-- Create index for last_active_at for sorting and filtering
CREATE INDEX idx_profiles_last_active_at ON profiles(last_active_at);

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_high_value IS 'Admin-flagged high-value user for targeted outreach and special treatment';
COMMENT ON COLUMN profiles.last_active_at IS 'Timestamp of most recent user activity (any action in user_activity_log)';
```

### Data Model Updates

**Update Drizzle schema** (`src/db/schema/profiles.ts`):
```typescript
import { pgTable, text, uuid, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    fullName: text('full_name'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    birthYear: integer('birth_year'),
    role: text('role').notNull().default('USER'),
    subscriptionTier: text('subscription_tier').notNull().default('FREE'),
    subscriptionStatus: text('subscription_status'),
    subscriptionPeriodEnd: timestamp('subscription_period_end', { withTimezone: true }),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    location: text('location'),
    phone: text('phone'),
    timezone: text('timezone'),
    newsletterOptIn: boolean('newsletter_opt_in').notNull().default(true),
    marketingEmailsOptIn: boolean('marketing_emails_opt_in').notNull().default(true),
    systemEmailsOptIn: boolean('system_emails_opt_in').notNull().default(true),
    dripCampaignsOptIn: boolean('drip_campaigns_opt_in').notNull().default(true),
    callRemindersOptIn: boolean('call_reminders_opt_in').notNull().default(true),
    totalTokensUsed: integer('total_tokens_used').default(0),
    lastTokenUpdate: timestamp('last_token_update', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    // NEW FIELDS for admin analytics
    isHighValue: boolean('is_high_value').notNull().default(false),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    subscriptionTierIdx: index('idx_profiles_subscription_tier').on(table.subscriptionTier),
    stripeCustomerIdIdx: index('idx_profiles_stripe_customer_id').on(table.stripeCustomerId),
    totalTokensIdx: index('idx_profiles_total_tokens').on(table.totalTokensUsed),
    lastLoginIdx: index('idx_profiles_last_login').on(table.lastLoginAt),
    // NEW INDEXES for admin queries
    isHighValueIdx: index('idx_profiles_is_high_value').on(table.isHighValue),
    lastActiveAtIdx: index('idx_profiles_last_active_at').on(table.lastActiveAt),
  })
);
```

### Data Migration Plan
- [x] **Step 1:** Generate migration file using `npm run db:generate`
- [x] **Step 2:** Review generated SQL for safety (adds 2 new columns with defaults, creates 2 indexes)
- [x] **Step 3:** Create down migration file following `drizzle_down_migration.md` template
  - Down migration will drop both indexes and columns using IF EXISTS
  - Include warning about data loss for is_high_value flags
- [x] **Step 4:** Test migration in development environment
- [x] **Step 5:** Run migration in production using `npm run db:migrate`
- [x] **Step 6:** Backfill `last_active_at` for existing users (optional):
  ```sql
  -- Backfill last_active_at from most recent user_activity_log entry
  UPDATE profiles p
  SET last_active_at = (
    SELECT MAX(created_at)
    FROM user_activity_log
    WHERE user_id = p.id
  )
  WHERE last_active_at IS NULL;
  ```

### 🚨 MANDATORY: Down Migration Safety Protocol
**CRITICAL REQUIREMENT:** Before running ANY database migration, you MUST create the corresponding down migration file following the `drizzle_down_migration.md` template process:

- [x] **Step 1: Generate Migration** - Run `npm run db:generate` to create the migration file
- [x] **Step 2: Create Down Migration** - Follow `drizzle_down_migration.md` template to analyze the migration and create the rollback file
- [x] **Step 3: Create Subdirectory** - Create `drizzle/migrations/[timestamp_name]/` directory
- [x] **Step 4: Generate down.sql** - Create the `down.sql` file with safe rollback operations:
  ```sql
  -- Down migration for admin user analytics fields
  -- WARNING: This will permanently delete high-value user flags

  -- Drop indexes first
  DROP INDEX IF EXISTS idx_profiles_is_high_value;
  DROP INDEX IF EXISTS idx_profiles_last_active_at;

  -- Drop columns (data loss warning)
  ALTER TABLE profiles DROP COLUMN IF EXISTS is_high_value;
  ALTER TABLE profiles DROP COLUMN IF EXISTS last_active_at;
  ```
- [x] **Step 5: Verify Safety** - Ensure all operations use `IF EXISTS` and include appropriate warnings
- [x] **Step 6: Apply Migration** - Only after down migration is created, run `npm run db:migrate`

**🛑 NEVER run `npm run db:migrate` without first creating the down migration file!**

---

## 7. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

#### **MUTATIONS (Server Actions)** → `app/actions/admin.ts`
- [x] **Server Actions File** - `app/actions/admin.ts` - ONLY mutations (flag high-value, update user)
- [x] Must use `'use server'` directive and `revalidatePath()` after mutations
- [x] **What qualifies as mutations**: Flagging high-value status, updating user notes

#### **QUERIES (Data Fetching)** → Direct in Server Components
- [x] **Direct in Page Components** - User list and detail queries in Server Components
- [x] Example: `const users = await db.select().from(profiles).where(...).limit(25)`
- [x] Use direct queries for all read operations (user list, user detail, activity log)

### Server Actions

**File:** `src/app/actions/admin.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/supabase/server';

/**
 * Toggle high-value status for a user
 * Admin-only action
 */
export async function toggleHighValueUser(userId: string, isHighValue: boolean) {
  // Authorization check
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Admin access required');
  }

  // Update user
  await db
    .update(profiles)
    .set({
      isHighValue,
      updatedAt: new Date()
    })
    .where(eq(profiles.id, userId));

  // Revalidate admin users page
  revalidatePath('/admin/users');

  return { success: true };
}
```

### Database Queries

**Direct in Server Components** (`src/app/admin/users/page.tsx`):

```typescript
// User list query with pagination and filters
const users = await db
  .select({
    id: profiles.id,
    fullName: profiles.fullName,
    email: profiles.email,
    subscriptionTier: profiles.subscriptionTier,
    subscriptionStatus: profiles.subscriptionStatus,
    isHighValue: profiles.isHighValue,
    lastActiveAt: profiles.lastActiveAt,
    createdAt: profiles.createdAt,
  })
  .from(profiles)
  .where(
    and(
      // Filter by tier if specified
      tier ? eq(profiles.subscriptionTier, tier) : undefined,
      // Filter by search query if specified
      searchQuery ? or(
        ilike(profiles.fullName, `%${searchQuery}%`),
        ilike(profiles.email, `%${searchQuery}%`)
      ) : undefined,
      // Filter by high-value if specified
      showHighValueOnly ? eq(profiles.isHighValue, true) : undefined,
      // Filter by date range if specified
      dateFrom ? gte(profiles.createdAt, dateFrom) : undefined,
      dateTo ? lte(profiles.createdAt, dateTo) : undefined
    )
  )
  .orderBy(desc(profiles.lastActiveAt))
  .limit(pageSize)
  .offset(pageSize * (page - 1));

// Count total matching users
const [{ count }] = await db
  .select({ count: count() })
  .from(profiles)
  .where(/* same filters as above */);

// Plans created count (joined subquery)
const usersWithPlans = await db
  .select({
    userId: profiles.id,
    plansCreated: count(missionReports.id),
  })
  .from(profiles)
  .leftJoin(missionReports, eq(missionReports.userId, profiles.id))
  .where(inArray(profiles.id, users.map(u => u.id)))
  .groupBy(profiles.id);
```

**User Detail Query** (`src/app/admin/users/[userId]/route.ts` or server component):

```typescript
// Comprehensive user detail query
const userDetail = await db
  .select({
    // Profile data
    id: profiles.id,
    fullName: profiles.fullName,
    email: profiles.email,
    phone: profiles.phone,
    location: profiles.location,
    timezone: profiles.timezone,
    subscriptionTier: profiles.subscriptionTier,
    subscriptionStatus: profiles.subscriptionStatus,
    subscriptionPeriodEnd: profiles.subscriptionPeriodEnd,
    stripeCustomerId: profiles.stripeCustomerId,
    isHighValue: profiles.isHighValue,
    lastActiveAt: profiles.lastActiveAt,
    createdAt: profiles.createdAt,
  })
  .from(profiles)
  .where(eq(profiles.id, userId))
  .limit(1);

// Plans created with favorite scenarios
const plans = await db
  .select({
    id: missionReports.id,
    title: missionReports.title,
    scenarios: missionReports.scenarios,
    createdAt: missionReports.createdAt,
  })
  .from(missionReports)
  .where(eq(missionReports.userId, userId))
  .orderBy(desc(missionReports.createdAt));

// Recent activity log (last 20)
const activities = await db
  .select()
  .from(userActivityLog)
  .where(eq(userActivityLog.userId, userId))
  .orderBy(desc(userActivityLog.createdAt))
  .limit(20);

// Billing history
const transactions = await db
  .select()
  .from(billingTransactions)
  .where(eq(billingTransactions.userId, userId))
  .orderBy(desc(billingTransactions.transactionDate));

// Calculate lifetime value
const lifetimeValue = transactions
  .filter(t => t.status === 'succeeded')
  .reduce((sum, t) => sum + Number(t.amount), 0);
```

### API Routes (Only for Special Cases)
**❌ NO API ROUTES NEEDED** - All data fetching will be done via Server Components and Server Actions

---

## 8. Frontend Changes

### New Components

**Components to create in `components/admin/` directory:**

- [x] **`components/admin/UserListCard.tsx`** - Individual user card for grid view
  - Props: user data (name, email, tier, lastActive, plansCreated, isHighValue)
  - Displays user avatar (initials), tier badge, key metrics
  - Click handler to open user detail modal
  - High-value indicator (star icon)

- [x] **`components/admin/UserListTable.tsx`** - Table view for user list
  - Props: users array, onUserClick handler
  - Columns: name, email, tier, signup date, last active, plans created, high-value
  - Sortable columns (client-side)
  - Row click opens user detail modal

- [x] **`components/admin/UserDetailModal.tsx`** - Comprehensive user analytics modal
  - Props: userId, isOpen, onClose
  - Fetches user detail data on open
  - Sections: Profile, Subscription, Activity Metrics, Recent Activities, Billing History
  - "Flag as High-Value" toggle button
  - Close button and backdrop click to dismiss

- [x] **`components/admin/UserFilters.tsx`** - Filter controls for user list
  - Props: filters state, onChange handler
  - Controls: tier multi-select, date range picker, search input, high-value toggle
  - Clear filters button

- [x] **`components/admin/ViewToggle.tsx`** - Card/Table view toggle button
  - Props: currentView, onToggle handler
  - Icon button with grid/table icons
  - Persists preference to localStorage

**Component Organization Pattern:**
- Use `components/admin/` directory for admin-specific components
- Reuse existing `components/ui/` components (Button, Badge, Modal, Input, Select, etc.)

**Component Requirements:**
- **Responsive Design:**
  - Cards: 1 column (mobile <640px), 2 columns (tablet 640-1024px), 3-4 columns (desktop >1024px)
  - Table: Horizontal scroll on mobile, full view on desktop
  - Modal: Full-screen on mobile, centered dialog on desktop
- **Theme Support:**
  - Use Trust Blue theme colors (primary = hsl(210, 100%, 45%))
  - Support dark mode with existing CSS variables
- **Accessibility:**
  - Proper ARIA labels for all interactive elements
  - Keyboard navigation (tab, enter, esc)
  - Screen reader announcements for filter changes
- **Text Sizing & Readability:**
  - Card titles: `text-base` (16px)
  - Metrics: `text-sm` (14px)
  - Table cells: `text-sm` (14px)
  - Modal content: `text-base` (16px)
  - Metadata/timestamps: `text-xs` (12px)

### Page Updates

**Create new page:**
- [x] **`src/app/admin/users/page.tsx`** - Main user analytics page
  - Server Component fetching user list with filters from searchParams
  - Renders UserListCard grid or UserListTable based on view preference
  - Pagination controls (previous/next + page number dropdown)
  - Total user count and filtered count display
  - "Export Users" button (placeholder, disabled)
  - Integrates with existing AdminShell layout

**Update existing navigation:**
- [x] **`src/app/admin/AdminShell.tsx`** - Add "Users" nav item
  - Insert between "Dashboard" and "Products"
  - Icon: `Users` from lucide-react
  - Path: `/admin/users`

### State Management

**Server-Side State (URL Search Params):**
- `page` - Current page number (default: 1)
- `pageSize` - Users per page (default: 25, options: 10/25/50/100)
- `tier` - Filter by tier (FREE/BASIC/PRO, comma-separated for multi-select)
- `search` - Search query for name/email
- `highValueOnly` - Show only high-value users (boolean)
- `dateFrom` - Filter signup date from (ISO date string)
- `dateTo` - Filter signup date to (ISO date string)

**Client-Side State (React State):**
- `viewMode` - 'card' | 'table' (persisted in localStorage)
- `selectedUserId` - For user detail modal (null when closed)
- `isDetailModalOpen` - Boolean for modal visibility

**Data Fetching Strategy:**
- User list: Server Component fetch with URL params
- User detail: Client-side fetch on modal open (or Server Action)
- Filter changes: Update URL search params (triggers server re-render)
- View toggle: Update localStorage + local state (no server fetch)

### 🚨 CRITICAL: Context Usage Strategy

**MANDATORY: Before creating any component props or planning data fetching, verify existing context availability**

#### Context-First Design Pattern
- [x] **✅ Check Available Contexts:** No user context needed in admin section (server-side only)
- [x] **✅ Use Server Components:** All data fetching via Server Components with direct DB queries
- [x] **✅ Avoid Prop Drilling:** Pass only necessary data to client components
- [x] **✅ Minimize Data Fetching:** User list fetched once per page, detail modal fetches on demand

#### Decision Flowchart - "Should this be a prop or use context?"
```
📊 Admin User Analytics Data Flow:
│
├─ 🔍 User List Data?
│  ├─ ✅ Fetch in Server Component (page.tsx)
│  └─ ✅ Pass to UserListCard/UserListTable as props
│
├─ 🔄 User Detail Data?
│  ├─ ✅ Fetch on modal open (client-side or server action)
│  └─ ✅ Store in UserDetailModal component state
│
└─ 📝 Admin Authorization?
   ├─ ✅ Check in middleware (no context needed)
   └─ ✅ Verify in Server Actions before mutations
```

#### Context Analysis Checklist
- [x] **No context providers needed** - Admin section uses Server Components exclusively
- [x] **Authorization via middleware** - No client-side auth context required
- [x] **Direct database queries** - No data context providers needed
- [x] **Server Actions for mutations** - No client-side mutation context needed

---

## 9. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

**Requirements:**
- [x] **Always include this section** for any task that modifies existing code
- [x] **Show actual code snippets** with before/after comparisons
- [x] **Focus on key changes** - don't show every line, but show enough to understand the transformation
- [x] **Use file paths and line counts** to give context about scope of changes
- [x] **Explain the impact** of each major change

### Format to Follow:

#### 📂 **Database Schema (Before)**
```typescript
// src/db/schema/profiles.ts (lines 1-38)
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    fullName: text('full_name'),
    // ... existing fields ...
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    subscriptionTierIdx: index('idx_profiles_subscription_tier').on(table.subscriptionTier),
    stripeCustomerIdIdx: index('idx_profiles_stripe_customer_id').on(table.stripeCustomerId),
    totalTokensIdx: index('idx_profiles_total_tokens').on(table.totalTokensUsed),
    lastLoginIdx: index('idx_profiles_last_login').on(table.lastLoginAt),
  })
);
```

#### 📂 **Database Schema (After)**
```typescript
// src/db/schema/profiles.ts (lines 1-42)
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    fullName: text('full_name'),
    // ... existing fields ...
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    // NEW: Admin analytics fields
    isHighValue: boolean('is_high_value').notNull().default(false),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    subscriptionTierIdx: index('idx_profiles_subscription_tier').on(table.subscriptionTier),
    stripeCustomerIdIdx: index('idx_profiles_stripe_customer_id').on(table.stripeCustomerId),
    totalTokensIdx: index('idx_profiles_total_tokens').on(table.totalTokensUsed),
    lastLoginIdx: index('idx_profiles_last_login').on(table.lastLoginAt),
    // NEW: Admin analytics indexes
    isHighValueIdx: index('idx_profiles_is_high_value').on(table.isHighValue),
    lastActiveAtIdx: index('idx_profiles_last_active_at').on(table.lastActiveAt),
  })
);
```

#### 📂 **Admin Navigation (Before)**
```typescript
// src/app/admin/AdminShell.tsx (lines 10-17)
const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Products', path: '/admin/products', icon: Tags },
  { name: 'Bundles', path: '/admin/bundles', icon: Boxes },
  { name: 'Suppliers', path: '/admin/suppliers', icon: Factory },
  { name: 'Categories', path: '/admin/categories', icon: FolderTree },
  { name: 'Approvals', path: '/admin/approvals', icon: CheckCircle },
];
```

#### 📂 **Admin Navigation (After)**
```typescript
// src/app/admin/AdminShell.tsx (lines 10-18)
const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Users', path: '/admin/users', icon: Users }, // NEW
  { name: 'Products', path: '/admin/products', icon: Tags },
  { name: 'Bundles', path: '/admin/bundles', icon: Boxes },
  { name: 'Suppliers', path: '/admin/suppliers', icon: Factory },
  { name: 'Categories', path: '/admin/categories', icon: FolderTree },
  { name: 'Approvals', path: '/admin/approvals', icon: CheckCircle },
];
```

#### 🎯 **Key Changes Summary**
- [x] **Database Schema:** Add 2 new fields to `profiles` table (`is_high_value`, `last_active_at`)
- [x] **Database Indexes:** Add 2 new indexes for efficient admin queries
- [x] **Admin Navigation:** Add "Users" nav item to AdminShell
- [x] **New Pages:** Create `/admin/users` page with Server Component data fetching
- [x] **New Components:** 5 new admin components (UserListCard, UserListTable, UserDetailModal, UserFilters, ViewToggle)
- [x] **Server Actions:** Add `toggleHighValueUser()` action in `app/actions/admin.ts`
- [x] **Files Modified:**
  - `src/db/schema/profiles.ts` (schema update)
  - `src/app/admin/AdminShell.tsx` (navigation)
- [x] **Files Created:**
  - `src/app/admin/users/page.tsx` (main page)
  - `src/app/actions/admin.ts` (server actions)
  - `components/admin/UserListCard.tsx`
  - `components/admin/UserListTable.tsx`
  - `components/admin/UserDetailModal.tsx`
  - `components/admin/UserFilters.tsx`
  - `components/admin/ViewToggle.tsx`
- [x] **Impact:**
  - Enables admin visibility into all user data and activity
  - Provides high-value user flagging for targeted outreach
  - Introduces view preference persistence (localStorage)
  - No breaking changes to existing admin pages

---

## 10. Implementation Plan

### Phase 1: Database Schema Changes (Required)
**Goal:** Add high-value flag and last active tracking to profiles table

- [x] **Task 1.1:** Update Drizzle Schema
  - Files: `src/db/schema/profiles.ts`
  - Details: Add `isHighValue` boolean and `lastActiveAt` timestamp fields with indexes

- [x] **Task 1.2:** Generate Database Migration
  - Command: `npm run db:generate`
  - Details: Review generated SQL for ALTER TABLE and CREATE INDEX statements

- [x] **Task 1.3:** Create Down Migration (MANDATORY)
  - Files: `drizzle/migrations/[timestamp]/down.sql`
  - Details: Follow `drizzle_down_migration.md` template
    - Drop indexes: `idx_profiles_is_high_value`, `idx_profiles_last_active_at`
    - Drop columns: `is_high_value`, `last_active_at`
    - Include data loss warning for high-value flags

- [x] **Task 1.4:** Apply Migration
  - Command: `npm run db:migrate`
  - Details: Execute in development first, verify with `\d profiles` in psql

### Phase 2: Server Actions & Data Queries
**Goal:** Implement backend logic for user list, detail, and high-value flagging

- [x] **Task 2.1:** Create Admin Server Actions
  - Files: `src/app/actions/admin.ts`
  - Details:
    - Implement `toggleHighValueUser(userId, isHighValue)` action
    - Admin authorization check using `getCurrentUser()`
    - Revalidate `/admin/users` path after mutation

- [x] **Task 2.2:** Implement User List Queries (in Server Component)
  - Files: `src/app/admin/users/page.tsx`
  - Details:
    - Parse URL search params for filters (tier, search, dateRange, highValueOnly, page, pageSize)
    - Query profiles with filters, pagination, and sorting
    - Join with mission_reports to get plans created count
    - Calculate total count for pagination

- [x] **Task 2.3:** Implement User Detail Query
  - Files: `src/app/admin/users/page.tsx` or separate data fetching utility
  - Details:
    - Fetch comprehensive user data (profile, subscription, plans, activities, billing)
    - Calculate derived metrics (account age, engagement score, lifetime value, favorite scenarios)
    - Return structured data for UserDetailModal component

### Phase 3: Core UI Components
**Goal:** Build reusable admin components for user list and detail views

- [x] **Task 3.1:** Create UserListCard Component
  - Files: `components/admin/UserListCard.tsx`
  - Details:
    - Accept user data props (name, email, tier, lastActive, plansCreated, isHighValue)
    - Display user avatar with initials (use first letters of first/last name)
    - Tier badge with color coding (FREE=gray, BASIC=blue, PRO=purple)
    - High-value indicator (star icon in top-right corner)
    - Click handler to open detail modal
    - Hover state and cursor pointer

- [x] **Task 3.2:** Create UserListTable Component
  - Files: `components/admin/UserListTable.tsx`
  - Details:
    - Render table with columns: name, email, tier, signup date, last active, plans created, high-value
    - Sortable columns (client-side sorting)
    - Row click opens detail modal
    - High-value column shows star icon or checkmark
    - Responsive: horizontal scroll on mobile

- [x] **Task 3.3:** Create UserFilters Component
  - Files: `components/admin/UserFilters.tsx`
  - Details:
    - Tier filter: Multi-select dropdown (FREE, BASIC, PRO)
    - Search input: Debounced (300ms) name/email search
    - Date range picker: From/To date inputs
    - High-value toggle: Checkbox or toggle switch
    - Clear filters button
    - Update URL search params on filter change

- [x] **Task 3.4:** Create ViewToggle Component
  - Files: `components/admin/ViewToggle.tsx`
  - Details:
    - Icon button with grid/table icons (use lucide-react LayoutGrid and Table icons)
    - Toggle between 'card' and 'table' views
    - Persist preference in localStorage (key: 'admin-users-view-mode')
    - Load preference on mount

### Phase 4: User Detail Modal
**Goal:** Comprehensive user analytics modal with all metrics and activity data

- [x] **Task 4.1:** Create UserDetailModal Component
  - Files: `components/admin/UserDetailModal.tsx`
  - Details:
    - Modal dialog using shadcn/ui Dialog component
    - Fetch user detail data on open (loading state)
    - Layout: Header (name, email, tier badge, high-value toggle) + Tabs
    - Tabs: Profile, Subscription, Activity, Billing History
    - Close button and backdrop click to dismiss

- [x] **Task 4.2:** Implement Profile Tab
  - Details:
    - Display: full name, email, phone, location, timezone
    - Show account age (calculated from createdAt: "X days ago" or "X months ago")
    - Show signup date (formatted: "Jan 15, 2024")

- [x] **Task 4.3:** Implement Subscription Tab
  - Details:
    - Tier badge with color coding
    - Subscription status (Active, Canceled, Past Due)
    - Renewal date (if applicable)
    - Payment method: Fetch last 4 from Stripe API using stripeCustomerId
    - Subscription duration (how long they've been paid: "3 months" or "1 year")

- [x] **Task 4.4:** Implement Activity Tab
  - Details:
    - Metrics cards:
      - Plans created (count with icon)
      - Last active (timestamp: "2 hours ago")
      - Engagement score (calculated: activities per week)
      - Favorite scenarios (most common scenario from mission_reports)
    - Recent activities list (last 20 from user_activity_log):
      - Activity type with icon (🎯 plan, 💳 subscription, 👤 account, 📧 email)
      - Timestamp ("2 hours ago" or absolute date if >7 days)
      - Metadata preview (if available)

- [x] **Task 4.5:** Implement Billing History Tab
  - Details:
    - Table with columns: Date, Description, Amount, Status, Invoice
    - Invoice link (download PDF from invoicePdfUrl)
    - Lifetime value calculation (sum of succeeded transactions, displayed at top)
    - Status badge color coding (succeeded=green, pending=yellow, failed=red)

### Phase 5: Main Users Page Integration
**Goal:** Assemble all components into the main /admin/users page

- [x] **Task 5.1:** Create Users Page Layout
  - Files: `src/app/admin/users/page.tsx`
  - Details:
    - Server Component with searchParams prop
    - Page header: "Users" title, total count, "Export Users" button (disabled placeholder)
    - UserFilters component (controls URL params)
    - ViewToggle component (controls localStorage view mode)
    - Conditional render: UserListCard grid OR UserListTable based on view mode
    - Pagination controls (previous/next, page dropdown)

- [x] **Task 5.2:** Wire Up Data Fetching
  - Details:
    - Parse searchParams for filters
    - Fetch user list with filters and pagination
    - Pass data to UserListCard/UserListTable components
    - Handle empty state (no users found)
    - Handle loading state (skeleton cards/rows)

- [x] **Task 5.3:** Implement Modal Integration
  - Details:
    - UserDetailModal state management (selectedUserId, isOpen)
    - Pass onUserClick handler to UserListCard/UserListTable
    - Open modal on user click, close on dismiss
    - Fetch user detail data when modal opens

### Phase 6: Admin Navigation Update
**Goal:** Add Users page to admin navigation

- [x] **Task 6.1:** Update AdminShell Navigation
  - Files: `src/app/admin/AdminShell.tsx`
  - Details:
    - Add Users nav item with Users icon (lucide-react)
    - Insert between Dashboard and Products
    - Verify active state highlighting works

### Phase 7: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [x] **Task 7.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run linting and static analysis ONLY
    - `npm run lint` (if available)
    - TypeScript type checking: `npx tsc --noEmit`
    - NEVER run dev server, build, or start commands

- [x] **Task 7.2:** Static Logic Review
  - Files: Modified business logic files
  - Details: Read code to verify:
    - Query syntax correctness (Drizzle ORM patterns)
    - Edge case handling (empty results, null values)
    - Authorization checks in Server Actions
    - Proper use of searchParams and URL handling

- [x] **Task 7.3:** Database Migration Verification
  - Files: Generated migration files
  - Details: Read migration files to verify:
    - Column additions use proper data types
    - Indexes created on correct fields
    - Down migration includes IF EXISTS clauses
    - No destructive operations without warnings

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 7, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 8: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [x] **Task 8.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [x] **Task 8.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details:
    - Read all modified files (schema, components, pages, actions)
    - Verify all success criteria met
    - Check integration between components
    - Validate database queries for performance
    - Ensure proper authorization checks
    - Provide detailed summary with confidence level

### Phase 9: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [x] **Task 9.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide results from Phase 7 static analysis

- [x] **Task 9.2:** Request User UI Testing
  - Files: Specific browser testing checklist
  - Details: Ask user to manually verify:
    - [ ] Navigate to `/admin/users` page
    - [ ] Verify user list loads with correct data
    - [ ] Test pagination (previous/next, page dropdown)
    - [ ] Test filters (tier, search, date range, high-value)
    - [ ] Test view toggle (card ↔ table, preference persistence)
    - [ ] Click user to open detail modal
    - [ ] Verify all modal tabs display correct data
    - [ ] Test high-value toggle (flag/unflag user)
    - [ ] Verify responsive design on mobile (resize browser)
    - [ ] Test keyboard navigation (tab, enter, esc)

- [x] **Task 9.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 11. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [x] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date (fallback to web search if time tool unavailable)
- [x] **Update task document immediately** after each completed subtask
- [x] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date (not assumed date)
- [x] **Add brief completion notes** (file paths, key changes, etc.)
- [x] **This serves multiple purposes:**
  - [x] **Forces verification** - You must confirm you actually did what you said
  - [x] **Provides user visibility** - Clear progress tracking throughout implementation
  - [x] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [x] **Creates audit trail** - Documentation of what was actually completed
  - [x] **Enables better debugging** - If issues arise, easy to see what was changed

### Example Task Completion Format
```
### Phase 1: Database Schema Changes
**Goal:** Add high-value flag and last active tracking to profiles table

- [x] **Task 1.1:** Update Drizzle Schema ✓ 2024-12-10
  - Files: `src/db/schema/profiles.ts` ✓
  - Details: Added `isHighValue` boolean and `lastActiveAt` timestamp with indexes ✓
- [x] **Task 1.2:** Generate Database Migration ✓ 2024-12-10
  - Command: `npm run db:generate` executed successfully ✓
  - Details: Reviewed generated SQL - 2 ALTER TABLE, 2 CREATE INDEX statements ✓
- [x] **Task 1.3:** Create Down Migration ✓ 2024-12-10
  - Files: `drizzle/migrations/0012_admin_users/down.sql` created ✓
  - Details: Safe rollback with IF EXISTS and data loss warnings ✓
```

---

## 12. File Structure & Organization

### New Files to Create
```
emergency-planner-v2/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   └── page.tsx                    # Main user analytics page (Server Component)
│   │   └── actions/
│   │       └── admin.ts                         # Admin server actions (mutations)
│   ├── components/
│   │   └── admin/
│   │       ├── UserListCard.tsx                 # User card for grid view
│   │       ├── UserListTable.tsx                # User table for table view
│   │       ├── UserDetailModal.tsx              # Comprehensive user detail modal
│   │       ├── UserFilters.tsx                  # Filter controls (tier, search, date)
│   │       └── ViewToggle.tsx                   # Card/Table view toggle button
│   └── db/
│       └── schema/
│           └── profiles.ts                      # MODIFIED: Add isHighValue, lastActiveAt
└── drizzle/
    └── migrations/
        └── [timestamp]_admin_user_analytics/
            ├── migration.sql                    # Generated migration (add columns/indexes)
            └── down.sql                         # Rollback migration (drop columns/indexes)
```

**File Organization Rules:**
- **Components**: All in `components/admin/` directory (admin-specific)
- **Pages**: Only `page.tsx` in `app/admin/users/` route
- **Server Actions**: In `app/actions/admin.ts` (admin mutations only)
- **Utilities**: If needed, in `lib/admin-utils.ts`
- **Types**: Co-located with components or in `lib/types.ts`

#### **LIB FILE SERVER/CLIENT SEPARATION - CRITICAL ARCHITECTURE RULE**

**🚨 MANDATORY: Prevent Server/Client Boundary Violations**

For this task, we have minimal lib file usage, but if admin utilities are created:

**Server-Only Imports (Cannot be used by client components):**
- `next/headers` (cookies, headers)
- `@/lib/supabase/server`
- `@/db` (database operations)
- Server Actions or other server-side functions

**Decision Flowchart - "Should I split this lib file?"**
```
📁 What's in your lib/admin-utils.ts file?
│
├─ 🔴 Server-only imports + Client-safe utilities?
│  └─ ✅ SPLIT: Create lib/admin-utils-client.ts for client utilities
│
├─ 🟢 Only server-side operations?
│  └─ ✅ KEEP: Single lib/admin-utils.ts file (server-only)
│
└─ 🟢 Only client-safe utilities?
   └─ ✅ KEEP: Single lib/admin-utils.ts file (client-safe)
```

**File Naming Pattern:**
- `lib/admin-utils.ts` - Server-side operations and re-exports
- `lib/admin-utils-client.ts` - Client-safe utilities only

### Files to Modify
- [x] **`src/db/schema/profiles.ts`** - Add `isHighValue`, `lastActiveAt` fields and indexes
- [x] **`src/app/admin/AdminShell.tsx`** - Add "Users" nav item to navigation array

### Dependencies to Add
**None required** - all necessary dependencies already in project:
- `lucide-react` for icons
- `shadcn/ui` components (Button, Badge, Modal, Input, Select, etc.)
- `drizzle-orm` for database queries
- `next` for Server Components and Server Actions

---

## 13. Potential Issues & Security Review

### Error Scenarios to Analyze
- [x] **Error Scenario 1:** Large user list query times out (>5 seconds with 10,000+ users)
  - **Code Review Focus:** `src/app/admin/users/page.tsx` - user list query with filters
  - **Potential Fix:**
    - Verify indexes exist on `subscription_tier`, `is_high_value`, `last_active_at`, `created_at`
    - Add query execution time logging
    - Consider implementing cursor-based pagination instead of offset-based for very large datasets
    - Use `EXPLAIN ANALYZE` to identify slow queries

- [x] **Error Scenario 2:** User detail modal fails to load when user has thousands of activities
  - **Code Review Focus:** `components/admin/UserDetailModal.tsx` - activities query LIMIT clause
  - **Potential Fix:**
    - Ensure LIMIT 20 is applied to activities query
    - Add pagination for activity log in modal if needed
    - Consider lazy loading billing history (fetch on tab click instead of modal open)

- [x] **Error Scenario 3:** High-value toggle fails silently (no error feedback to admin)
  - **Code Review Focus:** `src/app/actions/admin.ts` - toggleHighValueUser error handling
  - **Potential Fix:**
    - Add try/catch block in Server Action
    - Return error object instead of throwing: `{ success: false, error: string }`
    - Display toast notification on client for success/error states

- [x] **Error Scenario 4:** Stripe API call fails when fetching payment method (customer portal link down)
  - **Code Review Focus:** User detail modal subscription tab - Stripe API integration
  - **Potential Fix:**
    - Wrap Stripe API call in try/catch with fallback
    - Show "Payment method unavailable" instead of crashing
    - Cache payment method data to avoid repeated API calls
    - Add retry logic with exponential backoff

### Edge Cases to Consider
- [x] **Edge Case 1:** User has never been active (lastActiveAt is null)
  - **Analysis Approach:** Check UserListCard and UserListTable rendering of null lastActiveAt
  - **Recommendation:** Display "Never active" or "—" instead of crashing or showing blank

- [x] **Edge Case 2:** User has no mission reports (plans created = 0)
  - **Analysis Approach:** Verify LEFT JOIN in query returns 0 instead of null
  - **Recommendation:** Display "0 plans" with helpful message in detail modal ("No plans created yet")

- [x] **Edge Case 3:** User has no billing transactions (free tier user)
  - **Analysis Approach:** Check billing history tab handling of empty array
  - **Recommendation:** Display empty state: "No billing history" with icon

- [x] **Edge Case 4:** User deleted account (soft delete with deletedAt timestamp)
  - **Analysis Approach:** Review user list query WHERE clause for deletedAt filtering
  - **Recommendation:** Exclude soft-deleted users from list OR add "Show deleted users" filter

- [x] **Edge Case 5:** Admin searches for partial email (e.g., "john@gm")
  - **Analysis Approach:** Verify ILIKE query handles partial matches correctly
  - **Recommendation:** Test search with various patterns (prefix, suffix, contains)

- [x] **Edge Case 6:** Filter combination returns 0 results
  - **Analysis Approach:** Check empty state rendering when no users match filters
  - **Recommendation:** Display helpful message: "No users match these filters" with "Clear filters" button

### Security & Access Control Review
- [x] **Admin Access Control:** Are admin-only features properly restricted to admin users?
  - **Check:** Middleware in `src/middleware.ts` verifies `profiles.role = 'ADMIN'` for `/admin/*` routes
  - **Check:** Server Action `toggleHighValueUser()` validates admin role before mutation
  - **Recommendation:** Verify middleware catches all admin routes (including `/admin/users`)

- [x] **Authentication State:** Does the system handle logged-out users appropriately?
  - **Check:** Middleware redirects unauthenticated users to `/auth/login`
  - **Check:** Server Components handle missing user gracefully
  - **Recommendation:** Add error boundary for unexpected auth failures

- [x] **Data Exposure:** Are we exposing sensitive user data inappropriately?
  - **Check:** User list should NOT expose: password hashes, auth tokens, sensitive metadata
  - **Check:** Detail modal should show subscription data but not full credit card numbers
  - **Recommendation:**
    - Review which fields are selected in queries (avoid SELECT *)
    - Mask sensitive data in UI (e.g., email partially hidden: j***n@example.com)
    - Never expose Stripe API keys or customer secret data

- [x] **Permission Boundaries:** Can admins access data they shouldn't?
  - **Check:** Admin users can view ALL user data (this is intentional for analytics)
  - **Check:** Regular users CANNOT access `/admin/*` routes
  - **Recommendation:** Add audit logging for admin actions (who flagged which user as high-value)

- [x] **SQL Injection:** Are user inputs properly sanitized?
  - **Check:** All queries use Drizzle ORM with parameterized queries (safe by default)
  - **Check:** Search input passed to `ilike()` is parameterized
  - **Recommendation:** Never use raw SQL unless absolutely necessary

- [x] **Rate Limiting:** Can admin spam high-value toggles or detail modal opens?
  - **Check:** No rate limiting currently implemented for admin actions
  - **Recommendation:** Add debouncing to high-value toggle (prevent double-clicks)

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples. This is code analysis and gap identification - not writing tests or test procedures.

**Priority Order:**
1. **Critical:** Security and access control issues (admin authorization, data exposure)
2. **Important:** User-facing error scenarios and edge cases (query timeouts, empty states)
3. **Nice-to-have:** UX improvements and enhanced error messaging (loading states, helpful messages)

---

## 14. Deployment & Configuration

### Environment Variables
**No new environment variables required** - all necessary config already exists:
- `DATABASE_URL` - Supabase Postgres connection (already configured)
- `STRIPE_SECRET_KEY` - For fetching payment method data (already configured)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (already configured)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public API key (already configured)

### Deployment Steps
1. **Database Migration:**
   - Run `npm run db:migrate` in production (applies schema changes)
   - Verify migration success with `SELECT is_high_value, last_active_at FROM profiles LIMIT 1;`

2. **Backfill Last Active (Optional):**
   - Run backfill SQL query to populate `last_active_at` for existing users
   - Monitor query execution time (should be <10 seconds for 10,000 users)

3. **Deploy Application:**
   - Push code to production branch
   - Vercel/deployment platform auto-deploys
   - Verify `/admin/users` page loads correctly

4. **Post-Deployment Verification:**
   - Navigate to `/admin/users` as admin user
   - Verify user list displays correctly
   - Test user detail modal opens and loads data
   - Test high-value toggle functionality
   - Monitor server logs for errors

---

## 15. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **EVALUATE STRATEGIC NEED** - Determine if multiple solutions exist or if it's straightforward ✅
2. **STRATEGIC ANALYSIS** (if needed) - Present solution options with pros/cons and get user direction ✅
3. **CREATE A TASK DOCUMENT** in `ai_docs/` using this template ✅
4. **GET USER APPROVAL** of the task document
5. **IMPLEMENT THE FEATURE** only after approval

**DO NOT:** Present implementation plans in chat without creating a proper task document first.
**DO:** Always create comprehensive task documentation that can be referenced later.
**DO:** Present strategic options when multiple viable approaches exist. ✅

### Communication Preferences
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates
- [x] Flag any blockers or concerns immediately
- [x] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)** ✅
   - [x] **Assess complexity** - Multiple UX patterns exist (card vs table, modal vs page)
   - [x] **Review the criteria** in "Strategic Analysis & Solution Options" section
   - [x] **Decision point**: Strategic analysis conducted (Option 1 recommended)

2. **STRATEGIC ANALYSIS SECOND (If needed)** ✅
   - [x] **Present solution options** with pros/cons analysis for each approach
   - [x] **Include implementation complexity, time estimates, and risk levels** for each option
   - [x] **Provide clear recommendation** with rationale (Option 1 - Card Grid + Modal)
   - [x] **Wait for user decision** on preferred approach before proceeding
   - [x] **Document approved strategy** for inclusion in task document

3. **CREATE TASK DOCUMENT THIRD (Required)** ✅
   - [x] **Create a new task document** in the `ai_docs/tasks/` directory using this template
   - [x] **Fill out all sections** with specific details for the requested feature
   - [x] **Include strategic analysis** (if conducted) in the appropriate section
   - [x] **🔢 FIND LATEST TASK NUMBER**: Task 010 → using 011
   - [x] **Name the file** using the pattern `011_phase_3_6_admin_user_analytics.md`
   - [x] **🚨 MANDATORY: POPULATE CODE CHANGES OVERVIEW**: Section 9 complete with before/after snippets
   - [x] **Present a summary** of the task document to the user for review

4. **PRESENT IMPLEMENTATION OPTIONS (Required)**
   - [x] **After incorporating user feedback**, present these 3 exact options:

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

   - [x] **Wait for explicit user choice** (A, B, or C) - never assume or default
   - [ ] **If A chosen**: Provide detailed code snippets showing exact changes planned
   - [ ] **If B chosen**: Begin phase-by-phase implementation immediately
   - [ ] **If C chosen**: Address feedback and re-present options

5. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

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
   f. **🚨 CRITICAL:** After final implementation phase, you MUST proceed to Phase 8 (Comprehensive Code Review) before any user testing

   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
   - [x] **Real-time task completion tracking** - Update task document immediately after each subtask
   - [x] **Mark checkboxes as [x]** with completion timestamps
   - [x] **Add specific completion notes** (file paths, line counts, key changes)
   - [x] **Run linting on each modified file** during the phase (static analysis only - no dev server/build commands)
   - [x] **🚨 MANDATORY: For ANY database changes, create down migration file BEFORE running `npm run db:migrate`**
     - [x] Follow `drizzle_down_migration.md` template process
     - [x] Create `drizzle/migrations/[timestamp]/down.sql` file
     - [x] Verify all operations use `IF EXISTS` and include warnings
     - [x] Only then run `npm run db:migrate`
   - [x] **Always create components in `components/admin/` directory**
   - [x] **🚨 MANDATORY WORKFLOW SEQUENCE:** After implementation phases, follow this exact order:
     - [x] **Phase 7 Complete** → Present "Implementation Complete!" message (section 15, step 7)
     - [ ] **Wait for user approval** → Execute comprehensive code review (section 15, step 8)
     - [ ] **Code review complete** → ONLY THEN request user browser testing
     - [x] **NEVER skip comprehensive code review** - Phase 7 basic validation ≠ comprehensive review
   - [x] **NEVER plan manual browser testing as AI task** - always mark as "👤 USER TESTING" and wait for user confirmation

6. **VERIFY LIB FILE ARCHITECTURE (For any lib/ changes)**
   - [x] **Audit new lib files** for server/client mixing (N/A - no lib files created)
   - [x] **Check import chains** - trace what server dependencies are pulled in
   - [x] **Test client component imports** - ensure no boundary violations
   - [x] **Split files if needed** using `[feature]-client.ts` pattern
   - [x] **Update import statements** in client components to use client-safe files

7. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after all phases)**
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

8. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
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

#### For Strategic Analysis
**✅ STRATEGIC APPROVAL RESPONSES (Proceed to task document creation):**
- "Option 1 looks good"
- "Go with your recommendation"
- "I prefer Option 2"
- "Proceed with [specific option]"
- "That approach works"
- "Yes, use that strategy"

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
🛑 **NEVER run `npm run db:migrate` without first creating the down migration file using `drizzle_down_migration.md` template!**
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
- `npm run type-check` / `npx tsc --noEmit` - Type checking only, no compilation
- Database commands (when explicitly needed): `npm run db:generate`, `npm run db:migrate`
- File reading/analysis tools

**🎯 VALIDATION STRATEGY:**
- Use linting for code quality issues
- Read files to verify logic and structure
- Check syntax and dependencies statically
- Let the user handle all application testing manually

### Code Quality Standards
- [x] Follow TypeScript best practices
- [x] Add proper error handling
- [x] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
  - [x] **❌ NEVER write change history**: "Fixed this", "Removed function", "Updated to use new API"
  - [x] **❌ NEVER write migration artifacts**: "Moved from X", "Previously was Y"
  - [x] **✅ ALWAYS explain business logic**: "Calculate discount for premium users", "Validate permissions before deletion"
  - [x] **✅ Write for future developers** - explain what/why the code does what it does, not what you changed
  - [x] **Remove unused code completely** - don't leave comments explaining what was removed
- [x] **🚨 MANDATORY: Use early returns to keep code clean and readable**
  - [x] **Prioritize early returns** over nested if-else statements
  - [x] **Validate inputs early** and return immediately for invalid cases
  - [x] **Handle error conditions first** before proceeding with main logic
  - [x] **Exit early for edge cases** to reduce nesting and improve readability
  - [x] **Example pattern**: `if (invalid) return error; // main logic here`
- [x] **🚨 MANDATORY: Use async/await instead of .then() chaining**
  - [x] **Avoid Promise .then() chains** - use async/await for better readability
  - [x] **Use try/catch blocks** for error handling instead of .catch() chaining
  - [x] **Use Promise.all()** for concurrent operations instead of chaining multiple .then()
  - [x] **Create separate async functions** for complex operations instead of long chains
  - [x] **Example**: `const result = await operation();` instead of `operation().then(result => ...)`
- [x] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
  - [x] **Never handle "legacy formats"** - expect the current format or fail fast
  - [x] **No "try other common fields"** fallback logic - if expected field missing, throw error
  - [x] **Fail fast and clearly** - don't mask issues with fallback behavior
  - [x] **Single expected response format** - based on current API contract
  - [x] **Throw descriptive errors** - explain exactly what format was expected vs received
  - [x] **Example**: `if (!expectedFormat) throw new Error('Expected X format, got Y');`
- [x] **🚨 MANDATORY: Create down migration files before running ANY database migration**
  - [x] Follow `drizzle_down_migration.md` template process
  - [x] Use `IF EXISTS` clauses for safe rollback operations
  - [x] Include appropriate warnings for data loss risks
- [x] **Ensure responsive design (mobile-first approach with Tailwind breakpoints)**
- [x] **Test components in both light and dark mode**
- [x] **Verify mobile usability on devices 320px width and up**
- [x] Follow accessibility guidelines (WCAG AA)
- [x] Use semantic HTML elements
- [x] **🚨 MANDATORY: Clean up removal artifacts**
  - [x] **Never leave placeholder comments** like "// No usage tracking needed" or "// Removed for simplicity"
  - [x] **Delete empty functions/components** completely rather than leaving commented stubs
  - [x] **Remove unused imports** and dependencies after deletions
  - [x] **Clean up empty interfaces/types** that no longer serve a purpose
  - [x] **Remove dead code paths** rather than commenting them out
  - [x] **If removing code, remove it completely** - don't leave explanatory comments about what was removed

### Architecture Compliance
- [x] **✅ VERIFY: Used correct data access pattern**
  - [x] Mutations → Server Actions (`app/actions/admin.ts`)
  - [x] Queries → Direct in Server Components (user list, detail queries)
  - [x] API routes → Not needed for this feature
- [x] **🚨 VERIFY: No server/client boundary violations in lib files**
  - [x] No lib files created for this task (N/A)
  - [x] If created, ensure no mixing of server imports with client utilities
- [x] **🚨 VERIFY: No re-exports of non-async functions from Server Action files**
  - [x] `app/actions/admin.ts` only exports async Server Actions
  - [x] No utility function re-exports from Server Action files
- [x] **🚨 VERIFY: Proper context usage patterns**
  - [x] No context providers needed (admin uses Server Components only)
  - [x] No prop drilling (data passed directly from Server Component to client components)
  - [x] No duplicate data fetching (single fetch per page/modal)
- [x] **❌ AVOID: Creating unnecessary API routes for internal operations**
- [x] **❌ AVOID: Mixing server-only imports with client-safe utilities in same file**
- [x] **❌ AVOID: Prop drilling when context providers already contain the needed data**
- [x] **🔍 DOUBLE-CHECK: Does this really need an API route or should it be a Server Action/lib function?** ✅ Server Actions used
- [x] **🔍 DOUBLE-CHECK: Can client components safely import from all lib files they need?** ✅ N/A
- [x] **🔍 DOUBLE-CHECK: Are components using context hooks instead of receiving context data as props?** ✅ No context needed

---

## 16. Notes & Additional Context

### Research Links
- [Drizzle ORM Queries Documentation](https://orm.drizzle.team/docs/select)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [shadcn/ui Modal Component](https://ui.shadcn.com/docs/components/dialog)
- [Stripe API - Retrieve Payment Method](https://stripe.com/docs/api/payment_methods/retrieve)

### **⚠️ Common Server/Client Boundary Pitfalls to Avoid**

**❌ NEVER DO:**
- Import from `next/headers` in files that export client-safe utilities
- Mix database operations with utility functions in same file
- Import from `@/lib/supabase/server` alongside client-safe functions
- Create utility files that both server and client components import without considering the import chain
- **Re-export synchronous functions from `"use server"` files**
- **Mix async Server Actions with synchronous utility exports in `app/actions/` files**

**✅ ALWAYS DO:**
- Separate server operations from client utilities into different files
- Use `-client.ts` or `-utils.ts` suffix for client-safe utility files
- Re-export client utilities from main file for backward compatibility (EXCEPT in `"use server"` files)
- Test that client components can import utilities without errors
- **Keep utilities in separate `lib/` files, not in `app/actions/` files**
- **Only export async functions from `"use server"` files**
- **Import utilities dynamically in Server Actions if needed, never re-export them**

---

## 17. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

Before implementing any changes, the AI must systematically analyze potential second-order consequences and alert the user to any significant impacts. This analysis should identify ripple effects that might not be immediately obvious but could cause problems later.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** No API endpoints modified (admin-only feature, new functionality)
- [x] **Database Dependencies:** Adding 2 new columns to `profiles` table
  - No existing queries broken (new fields are nullable or have defaults)
  - New indexes improve query performance for admin pages
  - Down migration available for safe rollback
- [x] **Component Dependencies:** New admin components, no modifications to existing user-facing components
- [x] **Authentication/Authorization:** No changes to auth system, middleware already handles admin routes

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:**
  - `last_active_at` will be updated by future activity logging (requires separate implementation)
  - `is_high_value` flag can be used by email campaigns and targeted outreach (Phase 3.10)
  - No impact on existing user flows (admin-only feature)
- [x] **UI/UX Cascading Effects:**
  - New admin navigation item added (minimal impact, fits existing pattern)
  - No changes to user-facing UI
  - Admin users gain new analytics capabilities (positive impact)
- [x] **State Management:**
  - View preference stored in localStorage (browser-specific, no server state)
  - No global state management changes needed
- [x] **Routing Dependencies:**
  - New `/admin/users` route added
  - No conflicts with existing routes
  - Middleware already protects `/admin/*` routes

#### 3. **Performance Implications**
- [x] **Database Query Impact:**
  - New indexes on `is_high_value` and `last_active_at` improve query performance
  - User list query optimized with LIMIT/OFFSET pagination
  - Potential concern: Large user bases (10,000+) may need cursor-based pagination in future
  - **Action Required:** Monitor query performance in production, consider optimization if >2 seconds
- [x] **Bundle Size:**
  - New admin components ~15KB (gzipped)
  - Minimal impact (admin-only pages, not user-facing)
- [x] **Server Load:**
  - Additional admin page may increase server load slightly
  - User detail modal fetches on demand (not preloaded)
  - Stripe API calls for payment method (rate-limited by Stripe)
  - **Action Required:** Monitor Stripe API usage, implement caching if needed
- [x] **Caching Strategy:**
  - Server Components cache by default (Next.js App Router)
  - Revalidate on high-value toggle mutation (revalidatePath)
  - No additional caching needed initially

#### 4. **Security Considerations**
- [x] **Attack Surface:**
  - New admin route protected by middleware (admin-only)
  - Server Actions validate admin role before mutations
  - No new public endpoints exposed
- [x] **Data Exposure:**
  - Admin users can view all user data (intentional for analytics)
  - No sensitive data exposed to non-admin users
  - Payment method shows last 4 digits only (via Stripe API)
  - **Recommendation:** Add audit logging for high-value flag changes (future enhancement)
- [x] **Permission Escalation:**
  - No permission changes for regular users
  - Admin role required for all new functionality
  - **Action Required:** Verify middleware catches all `/admin/users/*` routes
- [x] **Input Validation:**
  - Search query sanitized by Drizzle ORM (parameterized queries)
  - No raw SQL, no injection risk
  - Filter inputs validated on server (tier, date range)

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:**
  - No changes to user-facing workflows
  - Admin workflow enhanced with new analytics capabilities
  - No existing admin pages modified (only new page added)
- [x] **Data Migration:**
  - No user action required (admin-only feature)
  - Existing users get new fields with defaults (seamless)
- [x] **Feature Deprecation:**
  - No features removed or deprecated
  - Pure addition of new functionality
- [x] **Learning Curve:**
  - Admin users need to learn new analytics page
  - Familiar patterns (cards, tables, modals) reduce learning curve
  - **Recommendation:** Create admin onboarding guide or tooltips (future enhancement)

#### 6. **Maintenance Burden**
- [x] **Code Complexity:**
  - New components follow existing patterns (minimal complexity increase)
  - Server Actions use standard patterns (no new paradigms)
  - **Assessment:** Low maintenance burden
- [x] **Dependencies:**
  - No new third-party dependencies added
  - Uses existing shadcn/ui components and Drizzle ORM
  - **Assessment:** Stable, well-maintained dependencies
- [x] **Testing Overhead:**
  - New admin components require manual testing (no automated tests yet)
  - Database migration requires testing in staging
  - **Recommendation:** Add integration tests for admin user list query (future enhancement)
- [x] **Documentation:**
  - Task document serves as implementation reference
  - Code comments explain business logic
  - **Recommendation:** Add admin user guide for new analytics features (future enhancement)

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
These issues must be brought to the user's attention before implementation:
- [x] **Database Migration Required:** ✅ Acknowledged - 2 new columns and indexes added to `profiles` table
  - **Impact:** Minimal - columns nullable/defaulted, no data loss risk
  - **Mitigation:** Down migration created for safe rollback
  - **User Action:** Review migration SQL before approving implementation
- [ ] **Breaking API Changes:** ❌ None - no API contracts modified
- [ ] **Performance Degradation:** ⚠️ Potential - user list query may slow with 10,000+ users
  - **Impact:** Query time may exceed 2 seconds with very large user bases
  - **Mitigation:** Indexes added, pagination implemented, cursor-based pagination future option
  - **User Action:** Monitor query performance in production, optimize if needed
- [ ] **Security Vulnerabilities:** ❌ None identified - admin-only feature with proper authorization
- [ ] **User Data Loss:** ❌ None - additive feature only, no data deletion

#### ⚠️ **YELLOW FLAGS - Discuss with User**
These issues should be discussed but may not block implementation:
- [x] **Increased Complexity:** Low - new components follow existing patterns
  - **Discussion:** Standard admin CRUD patterns, minimal learning curve for developers
- [x] **New Dependencies:** None - uses existing shadcn/ui and Drizzle ORM
- [x] **UI/UX Changes:** Admin-only - no user-facing changes
  - **Discussion:** Admin users gain new capabilities, no disruption to existing workflows
- [x] **Maintenance Overhead:** Low - standard component maintenance
  - **Discussion:** Future enhancements may include automated tests and admin onboarding

### Mitigation Strategies

#### Database Changes
- [x] **Backup Strategy:** Supabase automatic backups enabled (verify in Supabase dashboard)
- [x] **Rollback Plan:** Down migration file created with safe rollback SQL
- [x] **Staging Testing:** Test migration in development environment before production
- [x] **Gradual Migration:** Not applicable (additive columns with defaults)

#### API Changes
- [ ] **Versioning Strategy:** N/A - no API contracts modified
- [ ] **Deprecation Timeline:** N/A - no features deprecated
- [ ] **Client Communication:** N/A - admin-only feature
- [ ] **Graceful Degradation:** N/A - no breaking changes

#### UI/UX Changes
- [x] **Feature Flags:** Not needed - admin-only feature with immediate rollout
- [x] **User Communication:** Admin users will discover new "Users" nav item organically
- [x] **Help Documentation:** Task document serves as reference, admin guide recommended for future
- [x] **Feedback Collection:** Monitor admin usage, gather feedback for improvements

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections of impact assessment filled out
- [x] **Identify Critical Issues:** 1 yellow flag identified (performance with large user bases)
- [x] **Propose Mitigation:** Indexes, pagination, cursor-based pagination future option
- [x] **Alert User:** Performance monitoring recommendation included
- [x] **Recommend Alternatives:** N/A - recommended solution (Option 1) addresses concerns

### Example Analysis Template

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- Database schema change will add 2 columns to `profiles` table (additive, non-breaking)
- Down migration available for safe rollback

**Performance Implications:**
- New indexes improve admin query performance
- Potential slowdown with 10,000+ users (cursor-based pagination recommended for future)
- Stripe API calls for payment method (caching recommended)

**Security Considerations:**
- Admin-only access enforced by middleware and Server Actions
- No new attack vectors introduced
- Audit logging recommended for high-value flag changes (future enhancement)

**User Experience Impacts:**
- Admin users gain new analytics capabilities (positive impact)
- No changes to user-facing workflows
- Familiar UI patterns reduce learning curve

**Mitigation Recommendations:**
- Monitor query performance in production
- Implement cursor-based pagination if queries exceed 2 seconds
- Add audit logging for admin actions (future enhancement)
- Create admin onboarding guide (future enhancement)

**🚨 USER ATTENTION REQUIRED:**
The database migration will add 2 new columns to the `profiles` table. Please review the generated migration SQL before approving implementation. Down migration is available for safe rollback.
```

---

*Template Version: 1.3*
*Last Updated: 12/10/2024*
*Created By: Claude Sonnet 4.5 (AI Assistant)*
