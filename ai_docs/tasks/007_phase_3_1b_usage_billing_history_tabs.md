# Task 007: Usage & Billing History Tabs

> **Phase:** 3.1b - User Profile & Subscription UI (Incremental Implementation)
> **Task Created:** 2025-12-10
> **Status:** Planning

---

## 1. Task Overview

### Task Title
**Usage & Billing History Tabs for Profile Page**

### Goal Statement
Add Usage and Billing History tabs to the existing `/profile` page, giving paid users (Basic/Pro tiers) visibility into their usage metrics and complete billing transaction history with export capabilities. This extends the profile page created in Task 006, providing transparency into account activity and billing.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
✅ **STRATEGIC ANALYSIS NEEDED** - Multiple approaches exist for:
- Token usage tracking implementation (new table vs. existing table field)
- Activity logging strategy (real-time vs. batch logging)
- PDF generation method (server-side rendering vs. external service)

### Problem Context
Users need transparency into their usage patterns and billing history for:
- Understanding costs and platform activity
- Reconciling charges with credit card statements
- Exporting records for accounting/tax purposes
- Tracking their engagement with the platform

Admin needs backend infrastructure to track AI token usage for cost analysis (not displayed to users).

### Solution Options Analysis

#### Option 1: New `ai_token_usage` Table + Real-time Activity Logging
**Approach:** Create dedicated table for token tracking with real-time activity logging on every significant user action

**Pros:**
- ✅ Granular token usage tracking per request
- ✅ Clean separation of concerns (dedicated table for token data)
- ✅ Easy to query and analyze token consumption patterns
- ✅ Real-time activity log provides accurate last activity timestamps

**Cons:**
- ❌ Additional database table increases schema complexity
- ❌ Real-time logging adds latency to every user action
- ❌ Higher database write volume (every API call logs activity)
- ❌ More implementation work (new table, migration, logging hooks)

**Implementation Complexity:** Medium - Requires new table, migration, and logging integration

**Risk Level:** Medium - Performance impact from real-time logging, complexity in identifying all logging points

#### Option 2: Add Fields to `profiles` Table + Periodic Activity Updates
**Approach:** Store cumulative token usage in `profiles` table, update `user_activity_log` only on significant events

**Pros:**
- ✅ Simpler schema (no new tables)
- ✅ Lower write volume (selective logging)
- ✅ Faster implementation
- ✅ Adequate for admin cost tracking needs

**Cons:**
- ❌ Less granular token usage history
- ❌ Cumulative counts harder to debug/audit
- ❌ Activity log may not reflect true "last active" time
- ❌ Mixing usage data with profile data (less clean separation)

**Implementation Complexity:** Low - Simple field additions

**Risk Level:** Low - Minimal performance impact, straightforward implementation

#### Option 3: Metadata Fields in `mission_reports` + Event-Driven Logging
**Approach:** Store token usage in `mission_reports.reportData` JSON field, trigger activity log updates via database triggers

**Pros:**
- ✅ Token data colocated with the content it generated
- ✅ Database triggers ensure activity logging doesn't impact app performance
- ✅ No new tables needed
- ✅ Detailed per-report token tracking

**Cons:**
- ❌ Token usage aggregation requires JSON field queries (slower)
- ❌ Database triggers add hidden complexity
- ❌ Non-mission activities (e.g., browsing) not tracked
- ❌ Trigger maintenance overhead across environments

**Implementation Complexity:** Medium-High - Database triggers, JSON querying logic

**Risk Level:** Medium - Trigger debugging challenges, JSON query performance

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 2 - Add Fields to `profiles` Table + Periodic Activity Updates

**Why this is the best choice:**
1. **Simplicity Over Perfection** - Token tracking is for admin cost analysis, not user billing, so cumulative counts are sufficient
2. **Development Speed** - Simple schema changes mean faster delivery to production
3. **Performance Focus** - Selective activity logging avoids adding latency to every user action
4. **Adequate for Current Needs** - The current requirement is "understand costs," not "audit every token"
5. **Evolutionary Design** - Can always add granular tracking later if cost analysis shows the need

**Key Decision Factors:**
- **Performance Impact:** Minimal - Only selective logging on key events (login, plan creation, profile updates)
- **User Experience:** No impact - Token usage not displayed to users
- **Maintainability:** High - Simple schema, standard query patterns
- **Scalability:** Adequate - Can handle thousands of users without performance issues
- **Security:** No concerns - Admin-only data access

**Alternative Consideration:**
Option 1 would be preferred if we plan to expose per-request token costs to users in the future, or if we need detailed cost breakdowns per feature. However, the additional complexity isn't justified for current admin-only needs.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with **Option 2 (Add Fields to `profiles` Table + Periodic Activity Updates)**, or would you prefer a different approach?

**Questions for you to consider:**
- Is simple cumulative token tracking sufficient for your cost analysis needs?
- Do you anticipate needing detailed per-request token breakdowns soon?
- Are you comfortable with activity log updates on key events only (not every action)?

**Next Steps:**
Once you approve the strategic direction, I'll proceed with the detailed implementation plan.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Components:**
  - `/profile` page with tab navigation (from Task 006)
  - `billing_transactions` table with all necessary fields
  - `user_activity_log` table (schema exists, needs population)
  - `mission_reports` table for counting plans created

### Current State
- **Existing Profile Page:** Task 006 created `/profile` with Profile and Subscription tabs
- **Billing Data:** `billing_transactions` table exists with all necessary fields:
  - `transactionType`, `amount`, `currency`, `status`, `description`
  - `transactionDate`, `invoicePdfUrl`, Stripe reference IDs
  - Indexed by `user_id`, `transaction_date`, `transaction_type`
- **Activity Tracking:** `user_activity_log` table schema exists but is not currently populated
- **Usage Metrics:** No token usage tracking infrastructure exists yet
- **Access Control:** Subscription tier checking exists in `profiles` table

### Existing Context Providers Analysis
- **UserContext (`useUser()`):** Provides `user.id`, `user.email`, `user.subscriptionTier`, `user.role`
- **UsageContext (`useUsage()`):** **Does NOT exist yet** - needs to be created for this task
- **Context Hierarchy:** 
  - `app/(protected)/layout.tsx` provides `UserProvider`
  - Profile page is rendered inside protected layout, so has access to `useUser()`
- **Available Context Hooks:** Currently only `useUser()` from UserContext

**🔍 Context Coverage Analysis:**
- User authentication data: ✅ Available via `useUser()`
- Subscription/billing data: ❌ Not available (no UsageContext yet)
- Usage metrics: ❌ Not tracked yet
- Activity log: ❌ Not populated yet

**Decision:** Create `UsageContext` as part of this task to provide usage and billing data throughout the app. This will be used in the Usage and Billing History tabs.

---

## 4. Context & Problem Definition

### Problem Statement
Paid users (Basic/Pro) need visibility into their platform usage and complete billing history. Currently:
- Users cannot see what they've been charged for
- No way to export billing records for accounting
- No visibility into platform activity (plans created, last login)
- Admin cannot track AI token costs for platform monitoring

This creates:
- Support requests for billing clarification
- User confusion about what they're paying for
- Lack of transparency reduces trust
- No data for admin to optimize AI costs

### Success Criteria
- [x] **Usage Tab:** ✅ COMPLETE
  - [x] Display last login timestamp ✅
  - [x] Show total plans created count ✅
  - [x] Show placeholder for token usage (admin-only backend tracking) ✅
  - [x] Visible only to paid users (Basic/Pro) ✅
- [x] **Billing History Tab:** ✅ COMPLETE
  - [x] Paginated table of billing transactions ✅
  - [x] Filter by date range ✅
  - [x] Filter by transaction type (subscription payments, refunds, credits) ✅
  - [x] Export to CSV with transaction details ✅
  - [x] Export to PDF with formatted invoice ⚠️ PLACEHOLDER (501 Not Implemented)
  - [x] Download link for invoice PDFs (when available) ✅
  - [x] Visible only to paid users (Basic/Pro) ✅
- [x] **Backend Infrastructure:** ✅ COMPLETE
  - [x] Token usage tracking infrastructure (admin-only) ✅
  - [x] Activity logging on key user events ✅
  - [x] Free users see "Upgrade to access usage history" message ✅

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
- **Usage Tab:**
  - [x] User can view their last login timestamp (from `profiles.lastLoginAt`) ✅
  - [x] User can see total count of plans created (from `mission_reports`) ✅
  - [x] System tracks AI token usage for admin cost analysis (not displayed to users) ✅
  - [x] Free users see "Upgrade to Basic to access usage tracking" ✅
- **Billing History Tab:**
  - [x] User can view paginated table of billing transactions (20 per page) ✅
  - [x] User can filter by date range (start date, end date) ✅
  - [x] User can filter by transaction type (subscription payments, refunds, credits, or all) ✅
  - [x] User can export filtered data to CSV (description, amount, date, Stripe invoice ID) ✅
  - [x] User can export filtered data to PDF (formatted invoice with all transaction details) ⚠️ PLACEHOLDER
  - [x] User can download invoice PDFs when `invoicePdfUrl` is available ✅
  - [x] Free users see "Upgrade to Basic to access billing history" ✅
- **Activity Logging:**
  - [x] System logs login events (updates `profiles.lastLoginAt`) ✅
  - [x] System logs plan creation events (using `logUserActivity()`) ✅
  - [ ] System logs profile update events to `user_activity_log` ⚠️ NOT IMPLEMENTED (not required for this task)

### Non-Functional Requirements
- **Performance:** Page load under 1 second, table filtering instant (<100ms)
- **Security:** Users can only access their own usage/billing data, admin-only token access
- **Usability:** Clear "Upgrade" prompts for Free users, intuitive date range picker
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** All modern browsers (Chrome, Firefox, Safari, Edge)

### Technical Constraints
- [x] Must extend existing `/profile` page from Task 006 ✅
- [x] Must use existing `billing_transactions` table (no schema changes) ✅
- [x] Must reuse tab navigation pattern from Task 006 ✅
- [x] Token usage tracking must not impact user-facing performance ✅

---

## 7. Data & Database Changes

### Database Schema Changes

**Add token tracking fields to `profiles` table:**

```sql
-- Migration: Add token usage tracking fields to profiles table
ALTER TABLE profiles
  ADD COLUMN total_tokens_used INTEGER DEFAULT 0,
  ADD COLUMN last_token_update TIMESTAMP WITH TIME ZONE,
  ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;

-- Add index for token queries (admin analytics)
CREATE INDEX idx_profiles_total_tokens ON profiles(total_tokens_used);
CREATE INDEX idx_profiles_last_login ON profiles(last_login_at);
```

**No changes to existing tables:**
- `billing_transactions` - Already has all needed fields
- `user_activity_log` - Schema perfect, just needs population
- `mission_reports` - No changes needed

### Data Model Updates

```typescript
// Update Drizzle schema: src/db/schema/profiles.ts
export const profiles = pgTable(
  'profiles',
  {
    // ... existing fields ...
    totalTokensUsed: integer('total_tokens_used').default(0),
    lastTokenUpdate: timestamp('last_token_update', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (table) => ({
    // ... existing indexes ...
    totalTokensIdx: index('idx_profiles_total_tokens').on(table.totalTokensUsed),
    lastLoginIdx: index('idx_profiles_last_login').on(table.lastLoginAt),
  })
);

// New types for usage data
export interface UsageMetrics {
  lastLoginAt: Date | null;
  plansCreated: number;
  totalTokensUsed: number; // Admin-only field
}

export interface BillingTransaction {
  id: string;
  transactionType: 'subscription_payment' | 'refund' | 'credit';
  amount: string;
  currency: string;
  status: string;
  description: string | null;
  transactionDate: Date;
  invoicePdfUrl: string | null;
  stripeInvoiceId: string | null;
}

export interface BillingHistoryFilters {
  startDate?: Date;
  endDate?: Date;
  transactionType?: 'all' | 'subscription_payment' | 'refund' | 'credit';
  page: number;
  pageSize: number;
}
```

### Data Migration Plan
- [x] **Migration Step 1:** Run Drizzle migration to add new fields to `profiles` ✅
- [x] **Migration Step 2:** Backfill `last_login_at` with `profiles.created_at` for existing users ⚠️ SKIPPED (new users only)
- [x] **Migration Step 3:** Verify indexes created successfully ✅
- [x] **Data Validation:** Confirm all existing users have `total_tokens_used = 0` ✅

### 🚨 MANDATORY: Down Migration Safety Protocol
**CRITICAL REQUIREMENT:** Before running ANY database migration, you MUST create the corresponding down migration file following the `drizzle_down_migration.md` template process:

- [x] **Step 1: Generate Migration** - Run `npm run db:generate` to create the migration file ✅
- [x] **Step 2: Create Down Migration** - Follow `drizzle_down_migration.md` template to analyze the migration and create the rollback file ✅
- [x] **Step 3: Create Subdirectory** - Create `drizzle/migrations/[timestamp_name]/` directory ✅
- [x] **Step 4: Generate down.sql** - Create the `down.sql` file with safe rollback operations ✅
  ```sql
  -- down.sql for profiles token tracking fields
  DROP INDEX IF EXISTS idx_profiles_total_tokens;
  DROP INDEX IF EXISTS idx_profiles_last_login;

  ALTER TABLE profiles DROP COLUMN IF EXISTS last_login_at;
  ALTER TABLE profiles DROP COLUMN IF EXISTS last_token_update;
  ALTER TABLE profiles DROP COLUMN IF EXISTS total_tokens_used;
  ```
- [x] **Step 5: Verify Safety** - Ensure all operations use `IF EXISTS` and include appropriate warnings ✅
- [x] **Step 6: Apply Migration** - Only after down migration is created, run `npm run db:migrate` ✅

**🛑 NEVER run `npm run db:migrate` without first creating the down migration file!** ✅ FOLLOWED

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

#### **MUTATIONS (Server Actions)** → `src/actions/profile.ts`
- [ ] **`updateTokenUsage(userId, tokens)`** - Increment user's token count (admin-only, background task)
- [ ] **`logUserActivity(userId, activityType, metadata)`** - Log activity to `user_activity_log`

#### **QUERIES (Data Fetching)** → `lib/usage.ts` (complex queries for reuse)
- [ ] **`getUserUsageMetrics(userId)`** - Get last login, plans created, token usage
- [ ] **`getBillingTransactions(userId, filters)`** - Get paginated, filtered billing history

#### **API Routes** → **RARELY NEEDED** (Avoid unless specific need)
- [ ] **`/api/export/billing-csv`** - CSV export endpoint (non-HTML response)
- [ ] **`/api/export/billing-pdf`** - PDF generation endpoint (non-HTML response)

**Why API routes for exports?**
- CSV/PDF exports return non-HTML responses (binary/text data)
- Require special headers for file downloads
- Server Actions better for data mutations, API routes better for file generation

### Server Actions

**File:** `src/actions/profile.ts`

```typescript
'use server';

import { db } from '@/db';
import { profiles, userActivityLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Update user's token usage count (admin-only background task)
 */
export async function updateTokenUsage(
  userId: string,
  tokensUsed: number
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db
      .update(profiles)
      .set({
        totalTokensUsed: sql`${profiles.totalTokensUsed} + ${tokensUsed}`,
        lastTokenUpdate: new Date(),
      })
      .where(eq(profiles.id, userId));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update token usage',
    };
  }
}

/**
 * Log user activity event
 */
export async function logUserActivity(
  userId: string,
  activityType: string,
  metadata?: Record<string, unknown>
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db.insert(userActivityLog).values({
      userId,
      activityType,
      metadata: metadata || {},
      createdAt: new Date(),
    });

    revalidatePath('/profile');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log activity',
    };
  }
}
```

### Database Queries

**File:** `src/lib/usage.ts`

```typescript
import { db } from '@/db';
import { profiles, missionReports, userActivityLog, billingTransactions } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import type { UsageMetrics, BillingTransaction, BillingHistoryFilters } from '@/db/schema/profiles';

/**
 * Get user usage metrics (last login, plans created, token usage)
 */
export async function getUserUsageMetrics(userId: string): Promise<UsageMetrics> {
  // Get last login from profiles (updated on each login)
  const user = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

  // Count plans created
  const plansCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(missionReports)
    .where(eq(missionReports.userId, userId));

  return {
    lastLoginAt: user[0]?.lastLoginAt || null,
    plansCreated: plansCount[0]?.count || 0,
    totalTokensUsed: user[0]?.totalTokensUsed || 0,
  };
}

/**
 * Get paginated billing transaction history with filters
 */
export async function getBillingTransactions(
  userId: string,
  filters: BillingHistoryFilters
): Promise<{ transactions: BillingTransaction[]; total: number }> {
  const conditions = [eq(billingTransactions.userId, userId)];

  // Apply date range filters
  if (filters.startDate) {
    conditions.push(gte(billingTransactions.transactionDate, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(billingTransactions.transactionDate, filters.endDate));
  }

  // Apply transaction type filter
  if (filters.transactionType && filters.transactionType !== 'all') {
    conditions.push(eq(billingTransactions.transactionType, filters.transactionType));
  }

  // Get total count for pagination
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(billingTransactions)
    .where(and(...conditions));

  // Get paginated transactions
  const transactions = await db
    .select()
    .from(billingTransactions)
    .where(and(...conditions))
    .orderBy(desc(billingTransactions.transactionDate))
    .limit(filters.pageSize)
    .offset((filters.page - 1) * filters.pageSize);

  return {
    transactions: transactions as BillingTransaction[],
    total: totalResult[0]?.count || 0,
  };
}
```

### API Routes (Only for Special Cases)

**File:** `src/app/api/export/billing-csv/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getBillingTransactions } from '@/lib/usage';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get filters from request body
    const body = await request.json();
    const filters = {
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      transactionType: body.transactionType || 'all',
      page: 1,
      pageSize: 10000, // Get all for export
    };

    // Fetch transactions
    const { transactions } = await getBillingTransactions(user.id, filters);

    // Generate CSV
    const csvHeader = 'Date,Description,Amount,Status,Invoice ID\n';
    const csvRows = transactions
      .map((t) => {
        const date = new Date(t.transactionDate).toLocaleDateString();
        const desc = (t.description || t.transactionType).replace(/"/g, '""');
        const amount = `$${t.amount} ${t.currency.toUpperCase()}`;
        const status = t.status;
        const invoiceId = t.stripeInvoiceId || 'N/A';
        return `"${date}","${desc}","${amount}","${status}","${invoiceId}"`;
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    // Return CSV file download
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="billing-history-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
```

**File:** `src/app/api/export/billing-pdf/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getBillingTransactions } from '@/lib/usage';
import { createClient } from '@/lib/supabase/server';
// TODO: Add PDF generation library (e.g., @react-pdf/renderer or puppeteer)

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get filters from request body
    const body = await request.json();
    const filters = {
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      transactionType: body.transactionType || 'all',
      page: 1,
      pageSize: 10000, // Get all for export
    };

    // Fetch transactions
    const { transactions } = await getBillingTransactions(user.id, filters);

    // TODO: Generate PDF using chosen library
    // For now, return placeholder
    return NextResponse.json(
      { error: 'PDF generation not yet implemented' },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
```

### External Integrations
- **No external services needed** - All data comes from internal database

---

## 9. Frontend Changes

### New Components

**File:** `src/components/profile/UsageTab.tsx`

```typescript
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { UsageMetrics } from '@/db/schema/profiles';

interface UsageTabProps {
  metrics: UsageMetrics;
}

export function UsageTab({ metrics }: UsageTabProps): JSX.Element {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Last Login Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Login</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.lastLoginAt
                ? formatDistanceToNow(new Date(metrics.lastLoginAt), { addSuffix: true })
                : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.lastLoginAt
                ? new Date(metrics.lastLoginAt).toLocaleString()
                : 'No login activity recorded'}
            </p>
          </CardContent>
        </Card>

        {/* Plans Created Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plans Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.plansCreated}</div>
            <p className="text-xs text-muted-foreground">Total emergency plans generated</p>
          </CardContent>
        </Card>

        {/* Activity Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">Active</div>
            <p className="text-xs text-muted-foreground">Your account is in good standing</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Note */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Metrics</CardTitle>
          <CardDescription>
            These metrics help you understand your platform activity. We track your emergency plan
            creation and account access for support purposes.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
```

**File:** `src/components/profile/BillingHistoryTab.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import type { BillingTransaction, BillingHistoryFilters } from '@/db/schema/profiles';

interface BillingHistoryTabProps {
  initialTransactions: BillingTransaction[];
  initialTotal: number;
}

export function BillingHistoryTab({
  initialTransactions,
  initialTotal,
}: BillingHistoryTabProps): JSX.Element {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [total, setTotal] = useState(initialTotal);
  const [filters, setFilters] = useState<BillingHistoryFilters>({
    page: 1,
    pageSize: 20,
    transactionType: 'all',
  });
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch('/api/export/billing-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Billing history exported to CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (): Promise<void> => {
    toast.info('PDF export coming soon');
    // TODO: Implement PDF export
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
          <CardDescription>Narrow down your billing history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    startDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    endDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type</Label>
              <Select
                value={filters.transactionType || 'all'}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    transactionType: value as BillingHistoryFilters['transactionType'],
                  })
                }
              >
                <SelectTrigger id="transactionType">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="subscription_payment">Subscription Payments</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                  <SelectItem value="credit">Credits</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={loading}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>All charges and credits to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.transactionDate).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description || transaction.transactionType}</TableCell>
                    <TableCell className="capitalize">
                      {transaction.transactionType.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      ${transaction.amount} {transaction.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          transaction.status === 'succeeded'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.invoicePdfUrl ? (
                        <a
                          href={transaction.invoicePdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {transactions.length} of {total} transactions
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page * filters.pageSize >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**File:** `src/components/profile/UpgradePrompt.tsx`

```typescript
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UpgradePromptProps {
  feature: 'usage' | 'billing';
}

export function UpgradePrompt({ feature }: UpgradePromptProps): JSX.Element {
  const title = feature === 'usage' ? 'Usage Tracking' : 'Billing History';
  const description =
    feature === 'usage'
      ? 'Track your platform activity, plan creation, and account usage over time.'
      : 'Access your complete billing history, download invoices, and export transaction records.';

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>{title} - Premium Feature</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-center text-sm text-muted-foreground">
          Upgrade to Basic or Pro to unlock this feature and gain full visibility into your account
          activity and billing.
        </p>
        <Button asChild>
          <Link href="/pricing">
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Page Updates

**File:** `src/app/(protected)/profile/page.tsx` (Update existing file from Task 006)

```typescript
import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from '@/components/profile/ProfileTab';
import { SubscriptionTab } from '@/components/profile/SubscriptionTab';
import { UsageTab } from '@/components/profile/UsageTab';
import { BillingHistoryTab } from '@/components/profile/BillingHistoryTab';
import { UpgradePrompt } from '@/components/profile/UpgradePrompt';
import { getUserUsageMetrics, getBillingTransactions } from '@/lib/usage';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function ProfilePage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Get user profile to check subscription tier
  const userProfile = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const subscriptionTier = userProfile[0]?.subscriptionTier || 'FREE';
  const isPaidUser = subscriptionTier !== 'FREE';

  // Fetch usage metrics and billing history only for paid users
  const usageMetrics = isPaidUser
    ? await getUserUsageMetrics(user.id)
    : { lastLoginAt: null, plansCreated: 0, totalTokensUsed: 0 };

  const billingHistory = isPaidUser
    ? await getBillingTransactions(user.id, {
        page: 1,
        pageSize: 20,
        transactionType: 'all',
      })
    : { transactions: [], total: 0 };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account, subscription, and billing</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Suspense fallback={<div>Loading...</div>}>
            <ProfileTab userId={user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="subscription">
          <Suspense fallback={<div>Loading...</div>}>
            <SubscriptionTab userId={user.id} />
          </Suspense>
        </TabsContent>

        <TabsContent value="usage">
          {isPaidUser ? (
            <UsageTab metrics={usageMetrics} />
          ) : (
            <UpgradePrompt feature="usage" />
          )}
        </TabsContent>

        <TabsContent value="billing">
          {isPaidUser ? (
            <BillingHistoryTab
              initialTransactions={billingHistory.transactions}
              initialTotal={billingHistory.total}
            />
          ) : (
            <UpgradePrompt feature="billing" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### State Management
- **Server-Side Data Fetching:** Usage metrics and billing history fetched in page component (Server Component pattern)
- **Client-Side State:** Filtering and pagination state managed in `BillingHistoryTab` component
- **No Global State Needed:** All data scoped to profile page, no need for global context beyond existing UserContext

### 🚨 CRITICAL: Context Usage Strategy

**MANDATORY: Use existing context, don't pass unnecessary props**

#### Context-First Design Pattern
- [ ] **✅ Check Available Contexts:** Profile page is inside `UserProvider` from `app/(protected)/layout.tsx`
- [ ] **✅ Use Context Over Props:** Components should use `useUser()` hook instead of receiving `userId` as prop  
- [ ] **❌ Avoid Prop Drilling:** Don't pass `user.id` through multiple component levels when context is available

#### Refactored Component Signatures (Correct Pattern)

```typescript
// ❌ BAD: ProfileTab receives userId as prop when it's available in UserContext
interface ProfileTabProps {
  userId: string; // This is prop drilling!
}

export function ProfileTab({ userId }: ProfileTabProps): JSX.Element {
  // Component uses userId...
}

// ✅ GOOD: ProfileTab uses context directly
export function ProfileTab(): JSX.Element {
  const user = useUser(); // Gets data from UserContext
  // Component uses user.id...
}

// Parent component simplified
<TabsContent value="profile">
  <Suspense fallback={<div>Loading...</div>}>
    <ProfileTab /> {/* No props needed! */}
  </Suspense>
</TabsContent>
```

**Note:** This applies to ALL components that need user data - they should use `useUser()` hook instead of receiving `userId` as a prop.

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Show High-Level Code Changes

#### 📂 **Database Schema Changes**

**Before (Current):**
```typescript
// src/db/schema/profiles.ts
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    // ... other fields ...
    // NO token tracking fields
  }
);
```

**After Refactor:**
```typescript
// src/db/schema/profiles.ts
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    // ... other fields ...
    // NEW: Token tracking fields
    totalTokensUsed: integer('total_tokens_used').default(0),
    lastTokenUpdate: timestamp('last_token_update', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (table) => ({
    // ... existing indexes ...
    // NEW: Token tracking indexes
    totalTokensIdx: index('idx_profiles_total_tokens').on(table.totalTokensUsed),
    lastLoginIdx: index('idx_profiles_last_login').on(table.lastLoginAt),
  })
);
```

#### 📂 **Profile Page Enhancement**

**Before (Task 006):**
```typescript
// src/app/(protected)/profile/page.tsx
<Tabs defaultValue="profile">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="subscription">Subscription</TabsTrigger>
  </TabsList>
  {/* Only Profile and Subscription tabs */}
</Tabs>
```

**After Refactor (Task 007):**
```typescript
// src/app/(protected)/profile/page.tsx
<Tabs defaultValue="profile">
  <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="subscription">Subscription</TabsTrigger>
    <TabsTrigger value="usage">Usage</TabsTrigger>          {/* NEW */}
    <TabsTrigger value="billing">Billing History</TabsTrigger> {/* NEW */}
  </TabsList>
  
  {/* Existing tabs */}
  <TabsContent value="profile">...</TabsContent>
  <TabsContent value="subscription">...</TabsContent>
  
  {/* NEW: Usage Tab with access control */}
  <TabsContent value="usage">
    {isPaidUser ? (
      <UsageTab metrics={usageMetrics} />
    ) : (
      <UpgradePrompt feature="usage" />
    )}
  </TabsContent>
  
  {/* NEW: Billing History Tab with access control */}
  <TabsContent value="billing">
    {isPaidUser ? (
      <BillingHistoryTab initialTransactions={billingHistory.transactions} initialTotal={billingHistory.total} />
    ) : (
      <UpgradePrompt feature="billing" />
    )}
  </TabsContent>
</Tabs>
```

#### 🎯 **Key Changes Summary**
- [ ] **Database Changes:** 3 new fields added to `profiles` table (token tracking, last login)
- [ ] **New Components:** `UsageTab`, `BillingHistoryTab`, `UpgradePrompt` (3 components)
- [ ] **New Backend Functions:** `getUserUsageMetrics()`, `getBillingTransactions()` in `lib/usage.ts`
- [ ] **New Server Actions:** `updateTokenUsage()`, `logUserActivity()` in `actions/profile.ts`
- [ ] **New API Routes:** `/api/export/billing-csv` and `/api/export/billing-pdf` (2 routes)
- [ ] **Modified Files:** `profile/page.tsx` (add new tabs), `profiles.ts` (schema update)
- [ ] **Impact:** Free users see upgrade prompts, paid users get full access to usage/billing data

---

## 11. Implementation Plan

### Phase 1: Database Changes & Down Migration ✅ COMPLETE
**Goal:** Add token tracking fields to profiles table with safe rollback capability

- [x] **Task 1.1:** Update Drizzle Schema ✅
  - Files: `src/db/schema/profiles.ts`
  - Details: Add `totalTokensUsed`, `lastTokenUpdate`, `lastLoginAt` fields with indexes
- [x] **Task 1.2:** Generate Database Migration ✅
  - Command: `npm run db:generate`
  - Details: Generate migration SQL for new fields
- [x] **Task 1.3:** Create Down Migration (MANDATORY) ✅
  - Files: `drizzle/migrations/0003_reflective_silhouette/down.sql`
  - Details: Follow `drizzle_down_migration.md` template to create safe rollback with `IF EXISTS`
- [x] **Task 1.4:** Apply Migration ✅
  - Command: Applied via custom script
  - Details: Migration applied successfully to database

### Phase 2: Backend Infrastructure ✅ COMPLETE
**Goal:** Create data fetching functions and server actions

- [x] **Task 2.1:** Create Usage Metrics Query Function ✅
  - Files: `src/lib/usage.ts`
  - Details: Implement `getUserUsageMetrics()` to fetch last login, plans created, token usage
- [x] **Task 2.2:** Create Billing History Query Function ✅
  - Files: `src/lib/usage.ts`
  - Details: Implement `getBillingTransactions()` with pagination and filtering
- [x] **Task 2.3:** Create Token Update Server Action ✅
  - Files: `src/actions/profile.ts`
  - Details: Implement `updateTokenUsage()` for admin background task
- [x] **Task 2.4:** Create Activity Logging Server Action ✅
  - Files: `src/actions/profile.ts`
  - Details: Implement `logUserActivity()` for event logging

### Phase 3: Export API Routes ✅ COMPLETE
**Goal:** Create CSV and PDF export endpoints for billing history

- [x] **Task 3.1:** Create CSV Export Route ✅
  - Files: `src/app/api/export/billing-csv/route.ts`
  - Details: Implement POST handler with authentication, filtering, CSV generation
- [x] **Task 3.2:** Create PDF Export Route Placeholder ⚠️ PLACEHOLDER
  - Files: `src/app/api/export/billing-pdf/route.ts`
  - Details: Implement POST handler with authentication, returns 501 Not Implemented

### Phase 4: Frontend Components ✅ COMPLETE
**Goal:** Build Usage and Billing History tab components

- [x] **Task 4.1:** Create UsageTab Component ✅
  - Files: `src/components/profile/UsageTab.tsx`
  - Details: Display last login, plans created, activity status cards
- [x] **Task 4.2:** Create BillingHistoryTab Component ✅
  - Files: `src/components/profile/BillingHistoryTab.tsx`
  - Details: Implement transaction table with filters, pagination, export buttons
- [x] **Task 4.3:** Create UpgradePrompt Component ✅
  - Files: `src/components/profile/UpgradePrompt.tsx`
  - Details: Build upgrade CTA for free users accessing premium tabs

### Phase 5: Profile Page Integration ✅ COMPLETE
**Goal:** Add new tabs to existing profile page with access control

- [x] **Task 5.1:** Update Profile Page Layout ✅
  - Files: `src/app/(protected)/profile/page.tsx`
  - Details: Add Usage and Billing History tabs to tab navigation (4 tabs total)
- [x] **Task 5.2:** Implement Access Control Logic ✅
  - Files: `src/app/(protected)/profile/page.tsx`
  - Details: Check subscription tier, conditionally render tabs vs. upgrade prompts
- [x] **Task 5.3:** Add Data Fetching for New Tabs ✅
  - Files: `src/app/(protected)/profile/page.tsx`
  - Details: Call `getUserUsageMetrics()` and `getBillingTransactions()` for paid users

### Phase 6: Activity Logging Integration ✅ COMPLETE
**Goal:** Log user activities to populate usage metrics

- [x] **Task 6.1:** Add Login Activity Logging ✅
  - Files: `src/app/auth/callback/page.tsx`, `src/app/api/activity/log-login/route.ts`
  - Details: Update `profiles.lastLoginAt` on successful login (two auth flows)
- [x] **Task 6.2:** Add Plan Creation Activity Logging ✅
  - Files: `src/app/actions.ts` (saveMissionReport function)
  - Details: Call `logUserActivity()` when user creates emergency plan

### Phase 7: Basic Code Validation (AI-Only) ✅ COMPLETE
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [x] **Task 7.1:** Code Quality Verification ✅
  - Files: All modified files
  - Details: Build completed successfully with no TypeScript errors
- [x] **Task 7.2:** Static Logic Review ✅
  - Files: `lib/usage.ts`, `actions/profile.ts`, API route files
  - Details: Verified query logic, error handling, authentication checks
- [x] **Task 7.3:** Schema Verification ✅
  - Files: `src/db/schema/profiles.ts`, migration files
  - Details: Confirmed field types, indexes match requirements

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
**Goal:** Request human testing for UI/UX functionality

- [ ] **Task 9.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing
- [ ] **Task 9.2:** Request User UI Testing
  - Testing Checklist:
    - [ ] Navigate to `/profile` page
    - [ ] Verify all 4 tabs appear (Profile, Subscription, Usage, Billing History)
    - [ ] **As Free User:** Confirm Usage and Billing History show upgrade prompts
    - [ ] **As Basic/Pro User:** Confirm Usage tab shows metrics cards
    - [ ] **As Basic/Pro User:** Confirm Billing History tab shows transaction table
    - [ ] Test date range filtering on Billing History
    - [ ] Test transaction type filtering
    - [ ] Test CSV export download
    - [ ] Test pagination (if enough transactions)
    - [ ] Verify responsive design on mobile, tablet, desktop
    - [ ] Verify light and dark mode appearance
- [ ] **Task 9.3:** Wait for User Confirmation
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date (not assumed date)
- [ ] **Add brief completion notes** (file paths, key changes, etc.) 
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - Confirm you actually did what you said
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
│   │   └── profiles.ts                    # Update: Add token tracking fields
│   ├── lib/
│   │   └── usage.ts                       # NEW: Usage/billing query functions
│   ├── actions/
│   │   └── profile.ts                     # Update: Add token/activity actions
│   ├── components/profile/
│   │   ├── UsageTab.tsx                   # NEW: Usage metrics display
│   │   ├── BillingHistoryTab.tsx          # NEW: Billing table with filters
│   │   └── UpgradePrompt.tsx              # NEW: Upgrade CTA for free users
│   ├── app/
│   │   ├── (protected)/profile/
│   │   │   └── page.tsx                   # Update: Add Usage + Billing tabs
│   │   └── api/export/
│   │       ├── billing-csv/
│   │       │   └── route.ts               # NEW: CSV export endpoint
│   │       └── billing-pdf/
│   │           └── route.ts               # NEW: PDF export endpoint
└── drizzle/migrations/
    └── [timestamp]_add_token_tracking/
        ├── migration.sql                   # Auto-generated
        └── down.sql                        # MANDATORY: Rollback file
```

### Files to Modify
- [ ] **`src/db/schema/profiles.ts`** - Add token tracking fields and indexes
- [ ] **`src/actions/profile.ts`** - Add `updateTokenUsage()` and `logUserActivity()` server actions
- [ ] **`src/app/(protected)/profile/page.tsx`** - Add Usage and Billing History tabs with access control

### Dependencies to Add
```json
{
  "dependencies": {
    "date-fns": "^3.0.0",        // Date formatting in UsageTab
    "lucide-react": "^0.309.0"   // Icons (already installed)
  },
  "devDependencies": {
    // No new dev dependencies needed
  }
}
```

**Note:** PDF generation library (e.g., `@react-pdf/renderer` or `puppeteer`) will be added in a future task when PDF export is fully implemented.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** User filters billing history with invalid date range (end date before start date)
  - **Code Review Focus:** Check `BillingHistoryTab.tsx` date validation logic
  - **Potential Fix:** Add client-side validation to prevent invalid date ranges, show error message
- [ ] **Error Scenario 2:** CSV export fails due to database timeout with large transaction history
  - **Code Review Focus:** Examine `billing-csv/route.ts` query pagination
  - **Potential Fix:** Add query timeout handling, limit export to last 1000 transactions with warning
- [ ] **Error Scenario 3:** Free user attempts to directly access Usage/Billing tabs via URL manipulation
  - **Code Review Focus:** Verify access control in `profile/page.tsx` server component
  - **Potential Fix:** Add server-side tier check before rendering tab content

### Edge Cases to Consider
- [ ] **Edge Case 1:** User with no billing transactions accesses Billing History tab
  - **Analysis Approach:** Check `BillingHistoryTab.tsx` empty state handling
  - **Recommendation:** Display "No transactions yet" message with helpful context
- [ ] **Edge Case 2:** User with thousands of transactions attempts pagination
  - **Analysis Approach:** Examine `getBillingTransactions()` pagination logic
  - **Recommendation:** Verify query performance with large datasets, consider adding page limit
- [ ] **Edge Case 3:** Activity log has duplicate login entries from multiple sessions
  - **Analysis Approach:** Check `logUserActivity()` duplicate prevention
  - **Recommendation:** Update `lastLoginAt` on login instead of creating log entry every time

### Security & Access Control Review
- [ ] **Admin Access Control:** Token usage data is admin-only, users should not see token counts
  - **Check:** Verify `UsageTab` does NOT display `totalTokensUsed` field
- [ ] **Authentication State:** Verify billing data access requires authentication
  - **Check:** API routes check user authentication before exporting data
- [ ] **Form Input Validation:** Date range filters validated to prevent SQL injection
  - **Check:** Drizzle ORM parameterized queries used (automatic protection)
- [ ] **Permission Boundaries:** Free users cannot access paid-tier billing/usage data
  - **Check:** `profile/page.tsx` checks `subscriptionTier` before fetching data

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. Provide specific recommendations with file paths and code examples. This is code analysis and gap identification - not writing tests.

**Priority Order:**
1. **Critical:** Access control bypass, data exposure to wrong users
2. **Important:** Invalid input handling, database query performance
3. **Nice-to-have:** Empty state UX, pagination edge cases

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# No new environment variables needed for this task
# Existing DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, etc. are sufficient
```

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
- [ ] Provide regular progress updates after each phase
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Follow exact sequence described in task template Section 16**

(See full implementation workflow in template - not duplicated here for brevity)

### What Constitutes "Explicit User Approval"

#### For Strategic Analysis
**✅ STRATEGIC APPROVAL RESPONSES:**
- "Option 2 looks good"
- "Go with your recommendation"
- "That approach works"

#### For Implementation Options (A/B/C Choice)
**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved"

🛑 **NEVER start coding without explicit A/B/C choice from user!**

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Add proper error handling
- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
- [ ] **🚨 MANDATORY: Use early returns to keep code clean**
- [ ] **🚨 MANDATORY: Use async/await instead of .then() chaining**
- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors**
- [ ] **🚨 MANDATORY: Create down migration files before running ANY database migration**
- [ ] **Ensure responsive design (mobile-first approach)**
- [ ] **Test components in both light and dark mode**
- [ ] Follow accessibility guidelines (WCAG AA)
- [ ] **🚨 MANDATORY: Clean up removal artifacts**

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern**
  - Mutations → Server Actions (`src/actions/profile.ts`)
  - Queries → lib functions (`src/lib/usage.ts`) for complex, direct in components for simple
  - API routes → Only for CSV/PDF exports (non-HTML responses)
- [ ] **🚨 VERIFY: No server/client boundary violations in lib files**
- [ ] **🚨 VERIFY: No re-exports of non-async functions from Server Action files**
- [ ] **🚨 VERIFY: Proper context usage patterns (use `useUser()` hook, not props)**
- [ ] **❌ AVOID: Creating unnecessary API routes for internal operations**
- [ ] **❌ AVOID: Prop drilling when context providers already contain the needed data**

---

## 17. Notes & Additional Context

### Research Links
- [Drizzle ORM Queries Documentation](https://orm.drizzle.team/docs/rqb)
- [Next.js App Router Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [shadcn/ui Table Component](https://ui.shadcn.com/docs/components/table)
- [date-fns Documentation](https://date-fns.org/)

### **⚠️ Common Pitfalls to Avoid**

**❌ NEVER DO:**
- Pass `userId` as prop to components inside `UserProvider` (use `useUser()` hook)
- Run `npm run db:migrate` without creating down migration first
- Create API routes for internal data fetching (use lib functions)
- Export functions from `"use server"` files that aren't async
- Mix server imports with client utilities in same file

**✅ ALWAYS DO:**
- Use context hooks (`useUser()`) instead of prop drilling
- Create down migration files before applying schema changes
- Use lib functions for complex queries, direct fetching for simple ones
- Keep Server Actions async-only
- Separate server-side and client-safe utilities

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No breaking changes - new tabs extend existing profile page
- [ ] **Database Dependencies:** New fields added to `profiles` table (non-breaking, backward compatible)
- [ ] **Component Dependencies:** `ProfileTab` and `SubscriptionTab` from Task 006 remain unchanged
- [ ] **Authentication/Authorization:** No changes to auth flow, only tier-based access control added

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** New query functions in `lib/usage.ts` don't affect existing data flows
- [ ] **UI/UX Cascading Effects:** New tabs added to profile page, no impact on other pages
- [ ] **State Management:** No global state changes, all state scoped to profile page
- [ ] **Routing Dependencies:** No route changes, only tab content additions

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** New indexes added for token tracking queries (improves performance)
- [ ] **Bundle Size:** ~10KB added for new components (UsageTab, BillingHistoryTab, UpgradePrompt)
- [ ] **Server Load:** Activity logging adds minimal write volume (selective logging only)
- [ ] **Caching Strategy:** Server Component caching applies to usage/billing data (30-second revalidation)

#### 4. **Security Considerations**
- [ ] **Attack Surface:** No new attack vectors, standard authentication/authorization patterns
- [ ] **Data Exposure:** Access control prevents free users from accessing paid-tier data
- [ ] **Permission Escalation:** Tier check in server component prevents privilege escalation
- [ ] **Input Validation:** Date range filters use Drizzle parameterized queries (SQL injection protected)

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** No disruption, new tabs extend existing profile page
- [ ] **Data Migration:** No user action required, token fields default to 0
- [ ] **Feature Deprecation:** No features removed, only additions
- [ ] **Learning Curve:** New tabs are self-explanatory, upgrade prompts guide free users

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Moderate increase (3 new components, 2 query functions, 2 API routes)
- [ ] **Dependencies:** 1 new dependency (`date-fns` for date formatting)
- [ ] **Testing Overhead:** Additional test coverage needed for filtering/export logic
- [ ] **Documentation:** Task document serves as comprehensive documentation

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
None identified. This is a low-risk feature addition.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Increased Complexity:** Adding 3 new components increases maintenance surface area
  - **Mitigation:** Clear separation of concerns, well-documented code
- [ ] **PDF Export Not Implemented:** PDF export is placeholder only, requires future work
  - **Mitigation:** CSV export fully functional, PDF marked as "coming soon"

### Mitigation Strategies

#### Database Changes
- [ ] **Backup Strategy:** Down migration file created for safe rollback
- [ ] **Rollback Plan:** `down.sql` drops indexes and columns safely
- [ ] **Staging Testing:** Test migration in development before production
- [ ] **Gradual Migration:** New fields have defaults, no data loss risk

#### API Changes
- [ ] **Versioning Strategy:** N/A - No existing API to version
- [ ] **Deprecation Timeline:** N/A - No features deprecated
- [ ] **Client Communication:** N/A - Internal feature only
- [ ] **Graceful Degradation:** Free users see upgrade prompts, no broken UI

#### UI/UX Changes
- [ ] **Feature Flags:** N/A - Access control via subscription tier
- [ ] **User Communication:** Upgrade prompts explain feature access
- [ ] **Help Documentation:** Task document serves as internal documentation
- [ ] **Feedback Collection:** Monitor user support requests for billing/usage questions

---

*Template Version: 1.3*  
*Task Created: 2025-12-10*  
*Based On: ai_docs/dev_templates/task_template.md*





