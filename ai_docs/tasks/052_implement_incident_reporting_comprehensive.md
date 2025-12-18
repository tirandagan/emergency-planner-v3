# AI Task: Implement Comprehensive Incident Reporting

> **Task Number:** 052
> **Created:** 2025-12-18
> **Status:** Pending Approval

---

## 1. Task Overview

### Task Title
**Implement Comprehensive Incident Reporting Across All Critical Failure Points**

### Goal Statement
**Goal:** Implement the existing incident reporting system (`@/lib/system-logger.ts` and `@/lib/admin-notifications.ts`) across all critical failure points in the Emergency Planner application, while ensuring users receive appropriate feedback when their requests fail. Currently, the incident reporting infrastructure exists and is documented in `docs/INCIDENT_REPORTING.md`, but it's not being used in most of the codebase. This task will ensure that:
1. All external API failures, database errors, payment processing issues, and AI service failures are properly logged and reported to admins
2. Users receive user-friendly error messages via toast notifications (using Sonner) when their actions fail
3. Error messages inform users that admins have been notified and will address the issue
This enables proactive issue resolution, better system observability, and improved user experience during error scenarios.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
✅ **CONDUCT STRATEGIC ANALYSIS** - Multiple implementation approaches exist for rolling out incident reporting across 26+ files with varying priorities and risk levels.

### Problem Context
The Emergency Planner application has a fully-implemented incident reporting system with:
- System logger (`src/lib/system-logger.ts`) with categorized error logging
- Admin email notifications (`src/lib/admin-notifications.ts`) with beautiful HTML formatting
- Database schema (`src/db/schema/system-logs.ts`) for persistent storage
- Pre-configured error patterns for common failures (Google Maps, OpenRouter, Stripe)

However, analysis of the codebase reveals **26 critical locations across 27 files** where external APIs, database operations, and payment processing could fail, but **only 1 location** currently uses incident reporting properly. This creates blind spots where admins are unaware of production issues until users report them.

**Critical gaps identified:**
- **AI/OpenRouter errors** (3 files) - No reporting on mission generation failures
- **Stripe payment failures** (5 files) - Silent payment and webhook errors
- **Google Maps API issues** (2 files) - Geocoding failures go unreported
- **Database operation failures** (7 files) - Data persistence errors only logged to console
- **External API integrations** (9+ files) - Amazon PAAPI, SerpAPI failures invisible to admins

### Solution Options Analysis

#### Option 1: Phased Implementation by Severity
**Approach:** Implement incident reporting in three phases: Tier 1 (Critical), Tier 2 (High), Tier 3 (Medium), based on business impact and user-facing severity.

**Pros:**
- ✅ Addresses highest-risk failures first (payments, AI generation, auth)
- ✅ Allows time to validate incident reporting doesn't impact performance
- ✅ Gradual rollout reduces risk of introducing bugs in multiple systems simultaneously
- ✅ Early wins demonstrate value before committing to full implementation
- ✅ Can adjust approach based on learnings from Tier 1

**Cons:**
- ❌ Lower-priority issues remain invisible for longer period
- ❌ Requires careful dependency management between phases
- ❌ Multiple deployment cycles needed for full coverage
- ❌ Risk of Tier 2/3 getting deprioritized and never implemented

**Implementation Complexity:** Medium - Requires careful planning of phase boundaries and dependencies

**Risk Level:** Low - Isolated changes to critical paths with validation between phases

#### Option 2: Domain-Based Implementation
**Approach:** Implement incident reporting by functional domain (all AI errors, then all payment errors, then all database errors, etc.) regardless of severity.

**Pros:**
- ✅ Consistent error handling patterns within each domain
- ✅ Easier to test domain-specific error scenarios comprehensively
- ✅ Natural alignment with team specialization (if applicable)
- ✅ Error pattern development benefits entire domain at once

**Cons:**
- ❌ Lower-priority domains may not justify immediate attention
- ❌ Delays critical error reporting in some domains while working on others
- ❌ Harder to prioritize by business impact
- ❌ May implement low-value error reporting before high-value

**Implementation Complexity:** Medium - Clear domain boundaries make implementation straightforward per domain

**Risk Level:** Medium - Could miss critical errors in domains implemented later

#### Option 3: Big Bang Implementation
**Approach:** Implement incident reporting across all 26 locations in a single comprehensive update.

**Pros:**
- ✅ Complete coverage immediately - no blind spots remain
- ✅ Single deployment cycle minimizes coordination overhead
- ✅ Consistent error handling patterns across entire codebase
- ✅ Easier to verify complete coverage with one comprehensive test pass

**Cons:**
- ❌ High risk - changes to 27 files simultaneously increases chance of introducing bugs
- ❌ Large PR difficult to review thoroughly
- ❌ Harder to isolate issues if problems arise post-deployment
- ❌ Performance impact harder to identify if issues occur
- ❌ No opportunity to validate approach before full rollout

**Implementation Complexity:** High - Coordinated changes across many systems simultaneously

**Risk Level:** High - Significant change surface area with limited rollback options

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Phased Implementation by Severity

**Why this is the best choice:**
1. **Risk Mitigation** - Implementing critical paths first (payments, AI) ensures highest-impact issues are caught immediately while validating the incident reporting system doesn't introduce performance issues or unexpected side effects
2. **Business Value Prioritization** - Tier 1 includes payment failures and AI generation errors that directly impact revenue and core user experience - these failures need visibility immediately
3. **Learning Opportunity** - Early phases provide feedback on error pattern effectiveness, notification volume, and any needed adjustments before expanding to all systems
4. **Development Efficiency** - Smaller, focused changes are easier to review, test, and deploy confidently than one massive update

**Key Decision Factors:**
- **Performance Impact:** Minimal - incident reporting is async and non-blocking, but phased approach allows validation
- **User Experience:** Critical errors (payments, AI) impact users most - fixing these first maximizes user benefit
- **Maintainability:** Phased approach allows refinement of error patterns and notification formatting based on real-world usage
- **Scalability:** Incident reporting system already designed for high volume - phasing validates this in production
- **Security:** All tiers handle sensitive data appropriately - no security difference between approaches

**Alternative Consideration:**
Option 2 (Domain-Based) would be preferred if this were a new greenfield system where consistency within domains was more important than addressing critical failures first. However, given that we have production users and known high-severity failure points, severity-based phasing better serves the business.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended phased implementation (Option 1), or would you prefer a different approach?

**Questions for you to consider:**
- Do you agree with the severity classification (Tier 1: AI/Payments/Auth, Tier 2: Database/Maps, Tier 3: Admin/Exports)?
- Is there a specific domain (like payments) where you'd prefer 100% coverage immediately?
- Would you prefer to implement all tiers in this single task, or break them into separate tasks?
- Are there any specific error scenarios you want prioritized?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan with detailed file-by-file changes and present you with the standard implementation options (A/B/C).

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS
- **Authentication:** Supabase Auth managed by `middleware.ts`
- **Key Architectural Patterns:**
  - Next.js App Router
  - Server Components for data fetching
  - Server Actions for mutations
  - API routes for external webhooks and integrations
- **Relevant Existing Components:**
  - `src/lib/system-logger.ts` - Incident logging functions (logApiError, logAiError, logPaymentError, etc.)
  - `src/lib/admin-notifications.ts` - Email notification system
  - `src/db/schema/system-logs.ts` - Database schema for system logs
  - `docs/INCIDENT_REPORTING.md` - Complete documentation and examples

### Current State
**Incident Reporting Infrastructure:** ✅ FULLY IMPLEMENTED
- System logger with 5+ specialized logging functions
- Admin email notifications with beautiful HTML formatting
- Database persistence for all system logs
- Pre-configured error patterns for common failures
- Debug console UI at `/admin/debug?tab=logs`

**Current Usage:** ❌ SEVERELY UNDERUTILIZED
- Analysis of 27 critical files reveals incident reporting is used in **only 1 location** properly
- 26 critical failure points have console.error or generic error handling only
- Admins are blind to production issues in:
  - AI/OpenRouter failures (mission generation, streaming)
  - Payment processing errors (Stripe checkout, webhooks, subscriptions)
  - External API failures (Google Maps, Amazon PAAPI, SerpAPI)
  - Database operation failures (updates, inserts, critical queries)
  - Authentication and authorization errors

**Example of Current State (Typical Pattern):**
```typescript
// src/lib/ai/mission-generator.ts - Lines 35-118
try {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify({ /* ... */ }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
  }
} catch (error) {
  console.error('Error generating mission plan:', error);
  throw error; // ❌ No incident reporting - admin never notified
}
```

**What Should Be (Target State):**
```typescript
try {
  // ... same API call ...
} catch (error) {
  await logAiError(error, {
    model: 'anthropic/claude-3.5-sonnet',
    userId,
    userAction: 'Generating disaster preparedness plan',
    component: 'MissionGenerator',
    route: '/api/mission-plan/generate',
    requestData: { scenario: formData.scenario },
    responseData: error instanceof Response ? {
      status: error.status,
      statusText: error.statusText,
    } : undefined,
  });
  throw error; // ✅ Admin notified with full context
}
```

### Existing Context Providers Analysis
Not applicable - this task focuses on server-side error handling and logging, which doesn't interact with React context providers.

---

## 4. Context & Problem Definition

### Problem Statement
The Emergency Planner application processes critical user workflows including AI-powered mission plan generation, payment processing, external API integrations, and database operations. When these systems fail, **admins have no visibility** into the failures because incident reporting is not implemented at failure points.

**Specific pain points:**
1. **Silent Payment Failures:** Stripe checkout errors, webhook failures, and subscription sync issues only log to console - admins unaware until users complain
2. **AI Generation Blind Spots:** OpenRouter API failures during mission generation aren't reported - users see generic errors, admins don't know there's a problem
3. **External API Issues:** Google Maps geocoding failures, Amazon PAAPI errors go unreported - degrades user experience without admin awareness
4. **Database Operation Failures:** Critical data persistence errors only console.error - potential data loss without notification
5. **No Proactive Issue Resolution:** Admins can't fix issues before they impact multiple users because there's no alerting system

**User impact:**
- Users encounter errors and get frustrated without admin awareness
- Issues persist longer than necessary because admins aren't notified
- Pattern analysis impossible - can't identify recurring issues or systemic problems
- No audit trail for debugging or root cause analysis

**Why this needs to be solved now:**
- Production application with real users expecting reliability
- Payment processing errors directly impact revenue
- AI generation is core product value - failures need immediate attention
- Existing incident reporting infrastructure is unused - wasting existing investment
- Debug console exists but has no data - can't fulfill its purpose without logging

### Success Criteria
- [ ] **Tier 1 (Critical) - 100% Coverage:** All AI/OpenRouter errors, Stripe payment errors, and authentication failures have incident reporting
- [ ] **Tier 2 (High) - 100% Coverage:** All database operations, Google Maps API calls, and mission plan API routes report incidents
- [ ] **Tier 3 (Medium) - 100% Coverage:** Admin operations, export APIs, and third-party integrations report incidents
- [ ] **Admin Email Notifications:** Admins receive properly formatted email notifications for all `error` and `critical` severity incidents
- [ ] **Database Logging:** All incidents persist to `system_logs` table with full context for debugging
- [ ] **Debug Console Visibility:** All logged incidents visible in `/admin/debug?tab=logs` with filtering and search
- [ ] **User-Facing Error Messages:** All user-facing Server Actions return user-friendly error messages that inform users admins have been notified
- [ ] **Client Toast Notifications:** Client components display appropriate toast notifications for user-facing errors (payments, AI generation, profile updates)
- [ ] **No Performance Degradation:** Incident reporting doesn't impact user-facing response times (logging is async)
- [ ] **Zero False Positives:** Error patterns correctly identify root causes without spurious notifications

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a production application with active users**
- **No backwards compatibility concerns** for logging system - new functionality being added
- **Data loss acceptable for logs** - system_logs table can be wiped during testing if needed
- **Users are real customers** - changes must not impact user experience
- **Priority: Reliability and observability** - comprehensive error coverage essential
- **Non-breaking changes only** - incident reporting is additive to existing error handling

---

## 6. Technical Requirements

### Functional Requirements
- **Tier 1 (Critical Priority):**
  - [ ] AI/OpenRouter errors in mission generation must log with model, user context, and request/response data
  - [ ] Stripe payment errors (checkout, webhooks, portal) must log with customer ID, amount, and error details
  - [ ] Authentication failures must log with user context and attempted action
  - [ ] Mission report saving errors must log with user ID and operation details

- **Tier 2 (High Priority):**
  - [ ] Database update/insert failures must log with affected table, operation type, and user context
  - [ ] Google Maps API failures must log with request parameters and API response status
  - [ ] Mission plan check/cancel API errors must log with user action and request data

- **Tier 3 (Medium Priority):**
  - [ ] Admin operation failures must log with admin user, target entity, and permission context
  - [ ] Export API errors (CSV, PDF) must log with user and export type
  - [ ] Third-party API errors (Amazon PAAPI, SerpAPI) must log with request details and response

- **Cross-Cutting Requirements:**
  - [ ] All incident logging must be async/non-blocking to avoid impacting user response times
  - [ ] Error patterns must correctly categorize errors (external_service, payment_error, ai_error, database_error, etc.)
  - [ ] User context (userId, userAction, component, route) must be included in all logs
  - [ ] Sensitive data (passwords, API keys, full card numbers) must never be logged
  - [ ] Request/response data should be sanitized before logging

- **User-Facing Error Messages (Server Actions):**
  - [ ] Server Actions must return user-friendly error messages in structured response format: `{ success: false, error: string }`
  - [ ] Error messages should inform users that admins have been notified: `"We're experiencing issues with [operation]. Our team has been notified and will resolve this shortly."`
  - [ ] Error messages must be clear and actionable when possible: `"Unable to process payment. Please check your card details and try again."`
  - [ ] Generic fallback for unexpected errors: `"Something went wrong. Our team has been notified and will investigate."`
  - [ ] Server Actions must NOT import or use toast notifications (server-side only - see `.cursor/rules/no-toast-in-server-actions.mdc`)

- **Client-Side Toast Notifications:**
  - [ ] Client components calling Server Actions should display toast notifications based on returned error messages
  - [ ] Use Sonner's `toast.error()` for user-facing error feedback
  - [ ] Toast messages should match the error message returned from Server Action
  - [ ] User-facing errors (AI generation, payments, profile updates) require toast notifications
  - [ ] Background operations (webhooks, cron jobs, admin-only operations) don't need toast notifications

### Non-Functional Requirements
- **Performance:** Incident logging must complete asynchronously without blocking user requests (<10ms overhead maximum)
- **Security:**
  - No sensitive data (passwords, API keys, PII beyond user ID) in logs
  - Admin email notifications only sent to `ADMIN_EMAIL` environment variable
  - System logs table only accessible to admin users
- **Usability:**
  - Error messages must be user-friendly (from error patterns)
  - Admin notifications must provide actionable resolution suggestions
  - Debug console must allow filtering by severity, category, date range, user
- **Responsive Design:** Not applicable - server-side logging only
- **Theme Support:** Not applicable - server-side logging only
- **Compatibility:** Must work with existing Next.js 15, Supabase, Drizzle ORM stack

### Technical Constraints
- Must use existing `logApiError()`, `logAiError()`, `logPaymentError()`, `logExternalServiceError()`, `logSystemError()` functions
- Must not modify existing error handling flow - logging is additive only
- Must not introduce new dependencies - use existing system-logger and admin-notifications modules
- Must preserve existing console.error statements for development debugging
- Must handle logging failures gracefully (don't crash app if logging fails)

---

## 7. Data & Database Changes

### Database Schema Changes
**No database schema changes required** - `system_logs` table already exists with all necessary fields:
- `id`, `timestamp`, `severity`, `category`, `error_code`, `error_message`, `error_name`, `stack_trace`
- `user_id`, `user_action`, `component`, `route`
- `request_data`, `response_data`, `metadata`
- `resolved`, `resolved_at`, `resolved_by`, `resolution_notes`
- `admin_notified`, `admin_notified_at`

### Data Model Updates
**No type changes required** - existing types in `src/lib/system-logger.ts` are comprehensive:
```typescript
// Already defined - no changes needed
type SystemLogSeverity = 'critical' | 'error' | 'warning' | 'info' | 'debug';
type SystemLogCategory =
  | 'api_error' | 'auth_error' | 'database_error'
  | 'external_service' | 'payment_error' | 'ai_error'
  | 'validation_error' | 'permission_error'
  | 'system_error' | 'user_action';

interface SystemLogOptions {
  severity?: SystemLogSeverity;
  category?: SystemLogCategory;
  userId?: string;
  userAction?: string;
  component?: string;
  route?: string;
  requestData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  notifyAdmin?: boolean;
}
```

### Data Migration Plan
**No migration required** - this is additive functionality that populates existing tables with new log entries.

### 🚨 MANDATORY: Down Migration Safety Protocol
**Not applicable** - no database schema changes required.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**This task ONLY modifies error handling in existing functions - no new data access patterns needed.**

All incident reporting will be added to existing:
- ✅ Server Actions in `app/actions/*.ts`
- ✅ API Routes in `app/api/**/route.ts`
- ✅ Library functions in `lib/*.ts`

**No new API routes, Server Actions, or lib functions will be created.**

### Server Actions
**No new Server Actions** - only adding incident reporting to existing functions:
- `app/actions/subscriptions.ts`: Add `logPaymentError()` calls
- `app/actions/plans.ts`: Add `logSystemError()` calls
- `app/actions/auth.ts`: Add `logSystemError()` and auth error logging
- `app/actions/profile.ts`: Add `logSystemError()` and `logPaymentError()` calls
- `app/actions/admin.ts`: Add `logSystemError()` calls

### Database Queries
**No new queries** - incident reporting functions (`logAiError`, `logPaymentError`, etc.) already handle database inserts internally.

### API Routes (Only for Special Cases)
**No new API routes** - only adding incident reporting to existing routes:
- `app/api/mission-plan/generate/route.ts`: Add `logAiError()` calls
- `app/api/mission-plan/check/route.ts`: Add `logApiError()` calls
- `app/api/mission-plan/cancel/route.ts`: Add `logApiError()` calls
- `app/api/webhooks/stripe/route.ts`: Add `logPaymentError()` calls
- `app/api/cron/sync-subscriptions/route.ts`: Add `logPaymentError()` calls
- `app/api/search/route.ts`: Add `logExternalServiceError()` calls
- `app/api/amazon/product/route.ts`: Add `logExternalServiceError()` calls
- `app/api/activity/log-login/route.ts`: Add `logSystemError()` calls
- `app/api/export/billing-csv/route.ts`: Add `logApiError()` calls
- `app/api/export/billing-pdf/route.ts`: Add `logApiError()` calls
- `app/api/admin/users/[userId]/route.ts`: Add `logApiError()` calls

### External Integrations
**No changes to external integrations** - only adding error logging when integrations fail:
- OpenRouter API (already integrated, adding error logging)
- Google Maps APIs (already integrated, adding error logging)
- Stripe API (already integrated, adding error logging)
- Amazon PAAPI (already integrated, adding error logging)
- SerpAPI (already integrated, adding error logging)

---

## 9. Frontend Changes

### New Components
**No new components required** - this task focuses on server-side error handling and logging.

### Client Component Updates
**Minor updates may be required** for client components that call Server Actions with user-facing errors:

**User-Facing Server Actions (require client toast notifications):**
- Payment operations: Subscription checkout, portal session creation
- AI generation: Mission plan generation, streaming generation
- Profile updates: User profile changes, password resets
- Auth operations: Signup, login failures

**Client components calling these Server Actions should:**
1. Check the `success` field in the Server Action response
2. Display `toast.error(result.error)` if `success === false`
3. Handle success cases appropriately (redirect, refresh, etc.)

**Example client component pattern:**
```typescript
"use client";
import { toast } from "sonner";
import { serverAction } from "@/app/actions/example";

async function handleAction() {
  const result = await serverAction(data);
  if (result.success) {
    toast.success("Operation completed!");
  } else {
    toast.error(result.error); // User-friendly message from server
  }
}
```

**Background Operations (NO client changes needed):**
- Webhooks (Stripe webhook handler)
- Cron jobs (subscription sync)
- Admin-only operations (user management, system settings)
These operations don't have direct client interaction, so no toast notifications needed.

### Page Updates
**No page updates required** - existing debug console at `/admin/debug?tab=logs` already displays system logs.

### State Management
**Not applicable** - server-side logging doesn't affect client state.

### 🚨 CRITICAL: Context Usage Strategy
**Not applicable** - this task is server-side only and doesn't interact with React context.

---

## 10. Code Changes Overview

### 📂 **Pattern Overview (Before → After)**

**Current Pattern (Repeated across 26 locations):**
```typescript
// Example: src/lib/ai/mission-generator.ts
try {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify({ /* ... */ }),
  });

  if (!response.ok) {
    console.error('OpenRouter API error:', response.status);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }
} catch (error) {
  console.error('Error generating mission plan:', error);
  throw error; // ❌ Admin never notified
}
```

**After Refactor (Pattern applied to all 26 locations):**
```typescript
// Example: src/lib/ai/mission-generator.ts
import { logAiError } from '@/lib/system-logger';

try {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { /* ... */ },
    body: JSON.stringify({ /* ... */ }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API error:', response.status);

    // Create proper Error object with context
    const error = new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);

    // ✅ Log incident with full context
    await logAiError(error, {
      model: 'anthropic/claude-3.5-sonnet',
      userId: formData.userId || 'anonymous',
      userAction: 'Generating disaster preparedness plan',
      component: 'MissionGenerator',
      route: '/api/mission-plan/generate',
      requestData: {
        scenario: formData.scenario,
        location: formData.location,
      },
      responseData: {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      },
    });

    throw error;
  }
} catch (error) {
  console.error('Error generating mission plan:', error);

  // ✅ Log unexpected errors too
  await logAiError(error, {
    model: 'anthropic/claude-3.5-sonnet',
    userId: formData.userId || 'anonymous',
    userAction: 'Generating disaster preparedness plan',
    component: 'MissionGenerator',
    route: '/api/mission-plan/generate',
  });

  throw error;
}
```

### 📱 **User-Facing Error Pattern (Server Actions)**

**Pattern for Server Actions that users interact with directly:**

```typescript
// Example: src/app/actions/subscriptions.ts - createCheckoutSession()
"use server";
import { logPaymentError } from '@/lib/system-logger';

export async function createCheckoutSession(
  tier: SubscriptionTier,
  userId: string,
  userEmail: string
): Promise<CreateCheckoutSessionResult> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      mode: 'subscription',
      // ... session config
    });

    if (!session.url) {
      // ✅ Log incident for admin
      await logPaymentError(new Error('Checkout session created without URL'), {
        userId,
        stripeCustomerId: userEmail,
        component: 'SubscriptionActions',
        route: '/api/subscriptions/checkout',
      });

      // ✅ Return user-friendly error message
      return {
        success: false,
        error: "We're experiencing issues processing your subscription. Our team has been notified and will resolve this shortly.",
      };
    }

    return { success: true, checkoutUrl: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);

    // ✅ Log incident for admin with full context
    await logPaymentError(error, {
      userId,
      stripeCustomerId: userEmail,
      amount: tier === 'BASIC' ? 9.99 : 19.99,
      currency: 'usd',
      component: 'SubscriptionActions',
      route: '/api/subscriptions/checkout',
      requestData: { tier },
    });

    // ✅ Return user-friendly error message
    return {
      success: false,
      error: error instanceof Error
        ? `Unable to process subscription: ${error.message}. Our team has been notified.`
        : "We're experiencing technical difficulties. Our team has been notified and will resolve this shortly.",
    };
  }
}
```

**Client Component Pattern (displays toast based on Server Action response):**

```typescript
// Example: components/profile/SubscriptionCard.tsx
"use client";
import { toast } from "sonner";
import { createCheckoutSession } from "@/app/actions/subscriptions";

export function SubscriptionCard() {
  async function handleUpgrade(tier: SubscriptionTier) {
    // Call Server Action
    const result = await createCheckoutSession(tier, userId, userEmail);

    if (result.success) {
      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl;
    } else {
      // ✅ Display error toast to user (admin already notified via incident logging)
      toast.error(result.error);
    }
  }

  return <button onClick={() => handleUpgrade('BASIC')}>Upgrade</button>;
}
```

**Key Pattern Elements:**
1. **Server Action logs incident** using appropriate logging function (`logPaymentError`, `logAiError`, etc.)
2. **Server Action returns user-friendly error message** in structured response: `{ success: false, error: string }`
3. **Error message informs user** that admins have been notified: "Our team has been notified..."
4. **Client component displays toast** based on error message from Server Action
5. **No toast imports in Server Actions** - maintains proper server/client separation

### 🎯 **Key Changes Summary**

**Tier 1 Files (Critical - 4 files):**
1. **`src/lib/ai/mission-generator.ts`** (Lines 35-118)
   - Add `logAiError()` for OpenRouter API failures
   - Include model, userId, scenario details
   - Log both HTTP errors and unexpected exceptions

2. **`src/app/api/mission-plan/generate/route.ts`** (Lines 11-72)
   - Add `logApiError()` for route-level failures
   - Add `logAiError()` for mission generation failures
   - Include request data and user context
   - **Return user-friendly error messages** in API response

3. **`src/app/actions/subscriptions.ts`** (3 functions)
   - `createCheckoutSession()`: Add `logPaymentError()` for Stripe checkout failures
   - `createCustomerPortalSession()`: Add `logPaymentError()` for portal session failures
   - **Update error messages** to inform users that admins have been notified
   - `syncUserSubscription()`: Add `logPaymentError()` + `logSystemError()` for sync errors

4. **`src/app/api/webhooks/stripe/route.ts`** (Lines 16-100+)
   - Add `logPaymentError()` for webhook verification failures
   - Add `logPaymentError()` in event processing (checkout.session.completed, etc.)
   - Add `logSystemError()` for database update failures

**Tier 2 Files (High - 11 files):**
5. **`src/app/actions/plans.ts`** - Add `logSystemError()` for database operations
6. **`src/app/actions/auth.ts`** - Add `logSystemError()` for auth failures
7. **`src/app/actions/profile.ts`** - Add `logSystemError()` and `logPaymentError()`
8. **`src/lib/geocoding.ts`** - Add `logExternalServiceError()` for Google Maps failures
9. **`src/lib/google-routes.ts`** - Add `logExternalServiceError()` for Routes API failures
10. **`src/lib/ai/save-mission-report.ts`** - Add `logSystemError()` for database failures
11. **`src/app/api/mission-plan/check/route.ts`** - Add `logApiError()`
12. **`src/app/api/mission-plan/cancel/route.ts`** - Add `logApiError()`
13. **`src/app/actions/generate-mission-streaming.ts`** - Add `logAiError()`
14. **`src/app/api/cron/sync-subscriptions/route.ts`** - Add `logPaymentError()` for batch failures
15. **`src/app/api/activity/log-login/route.ts`** - Add `logSystemError()` for activity logging failures

**Tier 3 Files (Medium - 12 files):**
16. **`src/app/actions/admin.ts`** (2 functions) - Add `logSystemError()` for admin operations
17. **`src/app/api/search/route.ts`** - Add `logExternalServiceError()` for SerpAPI
18. **`src/app/api/amazon/product/route.ts`** - Add `logExternalServiceError()` for Amazon PAAPI
19. **`src/lib/amazon-paapi.ts`** - Add `logExternalServiceError()` for PAAPI SDK
20. **`src/app/api/export/billing-csv/route.ts`** - Add `logApiError()`
21. **`src/app/api/export/billing-pdf/route.ts`** - Add `logApiError()`
22. **`src/app/api/admin/users/[userId]/route.ts`** - Add `logApiError()` and `logSystemError()`

**Files Modified:** 27 files total
**Functions Modified:** 35+ functions
**Impact:** All critical failure points will now have admin visibility and email notifications

**What stays the same:**
- ✅ Existing error handling logic (try/catch blocks)
- ✅ Console.error statements (for local development)
- ✅ Error throwing behavior (errors still propagate to callers)
- ✅ User-facing error messages (no changes to UX)

**What changes:**
- ✅ Add incident logging calls in catch blocks
- ✅ Add import statements for logging functions
- ✅ Include user context, request/response data in logs
- ✅ Admins receive email notifications for critical/error severity
- ✅ All incidents visible in debug console

---

## 11. Implementation Plan

### Phase 1: Tier 1 - Critical Payment & AI Errors (Highest Priority)
**Goal:** Implement incident reporting for payment processing, AI generation, and authentication - the most critical user-facing failures

- [ ] **Task 1.1:** Add Payment Error Reporting to Stripe Actions
  - Files: `src/app/actions/subscriptions.ts`
  - Details: Add `logPaymentError()` to `createCheckoutSession()`, `createCustomerPortalSession()`, `syncUserSubscription()`
  - Context: Include userId, stripeCustomerId, amount, currency, route

- [ ] **Task 1.2:** Add Payment Error Reporting to Stripe Webhook
  - Files: `src/app/api/webhooks/stripe/route.ts`
  - Details: Add `logPaymentError()` for webhook verification and event processing failures
  - Context: Include event type, customer ID, webhook signature validation

- [ ] **Task 1.3:** Add AI Error Reporting to Mission Generator
  - Files: `src/lib/ai/mission-generator.ts`
  - Details: Add `logAiError()` for OpenRouter API failures (HTTP errors and exceptions)
  - Context: Include model, userId, scenario, location, request/response data

- [ ] **Task 1.4:** Add API Error Reporting to Mission Generation Route
  - Files: `src/app/api/mission-plan/generate/route.ts`
  - Details: Add `logApiError()` and `logAiError()` for route and generation failures
  - Context: Include userId, userAction, component, route, request data

- [ ] **Task 1.5:** Add Database Error Reporting to Mission Report Saving
  - Files: `src/lib/ai/save-mission-report.ts`
  - Details: Add `logSystemError()` for database insert/delete failures
  - Context: Include userId, operation type (insert/delete), table name

### Phase 2: Tier 2 - Database & External API Errors (High Priority)
**Goal:** Implement incident reporting for database operations and external API integrations

- [ ] **Task 2.1:** Add Database Error Reporting to Plan Actions
  - Files: `src/app/actions/plans.ts`
  - Details: Add `logSystemError()` to `updateMissionReport()`, `validateShareLimit()`
  - Context: Include userId, operation, affected table, component

- [ ] **Task 2.2:** Add Database Error Reporting to Profile Actions
  - Files: `src/app/actions/profile.ts`
  - Details: Add `logSystemError()` to `updateUserProfile()`, `logPaymentError()` to `getPaymentMethod()`
  - Context: Include userId, fields updated, operation type

- [ ] **Task 2.3:** Add Auth Error Reporting to Auth Actions
  - Files: `src/app/actions/auth.ts`
  - Details: Add `logSystemError()` to `signUpWithEmail()` for Supabase auth failures
  - Context: Include email (sanitized), userAction, component

- [ ] **Task 2.4:** Add External Service Error Reporting to Geocoding
  - Files: `src/lib/geocoding.ts`
  - Details: Add `logExternalServiceError()` for Google Maps Geocoding API failures
  - Context: Include waypoint, API status code, error message

- [ ] **Task 2.5:** Add External Service Error Reporting to Google Routes
  - Files: `src/lib/google-routes.ts`
  - Details: Add `logExternalServiceError()` for Google Routes API failures
  - Context: Include request parameters, API status, route

- [ ] **Task 2.6:** Add AI Error Reporting to Streaming Generation
  - Files: `src/app/actions/generate-mission-streaming.ts`
  - Details: Add `logAiError()` to `generateMissionPlanNonStreaming()`
  - Context: Include model, userId, scenario, streaming context

- [ ] **Task 2.7:** Add API Error Reporting to Mission Plan Routes
  - Files: `src/app/api/mission-plan/check/route.ts`, `src/app/api/mission-plan/cancel/route.ts`
  - Details: Add `logApiError()` for check and cancel route failures
  - Context: Include userId, operation (check/cancel), request data

- [ ] **Task 2.8:** Add Payment Error Reporting to Subscription Sync Cron
  - Files: `src/app/api/cron/sync-subscriptions/route.ts`
  - Details: Add `logPaymentError()` for batch subscription sync failures
  - Context: Include batch size, failed customer IDs, error summary

- [ ] **Task 2.9:** Add Database Error Reporting to Activity Logging
  - Files: `src/app/api/activity/log-login/route.ts`
  - Details: Add `logSystemError()` for activity insert failures
  - Context: Include userId, activity type, component

### Phase 3: Tier 3 - Admin & Export Errors (Medium Priority)
**Goal:** Implement incident reporting for admin operations and third-party integrations

- [ ] **Task 3.1:** Add Database Error Reporting to Admin Actions
  - Files: `src/app/actions/admin.ts`
  - Details: Add `logSystemError()` to `toggleHighValueUser()`, `updateSystemSetting()`
  - Context: Include admin userId, target entity, permission check, operation

- [ ] **Task 3.2:** Add External Service Error Reporting to Search API
  - Files: `src/app/api/search/route.ts`
  - Details: Add `logExternalServiceError()` for SerpAPI failures
  - Context: Include search query, API status, user context

- [ ] **Task 3.3:** Add External Service Error Reporting to Amazon PAAPI
  - Files: `src/app/api/amazon/product/route.ts`, `src/lib/amazon-paapi.ts`
  - Details: Add `logExternalServiceError()` for Amazon PAAPI failures
  - Context: Include ASIN, operation (getItems/searchItems), API error code

- [ ] **Task 3.4:** Add API Error Reporting to Export Routes
  - Files: `src/app/api/export/billing-csv/route.ts`, `src/app/api/export/billing-pdf/route.ts`
  - Details: Add `logApiError()` for export failures
  - Context: Include userId, export type (CSV/PDF), date range

- [ ] **Task 3.5:** Add API Error Reporting to Admin User Details
  - Files: `src/app/api/admin/users/[userId]/route.ts`
  - Details: Add `logApiError()` and `logSystemError()` for admin API failures
  - Context: Include admin userId, target userId, permission check, query failures

### Phase 4: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 4.1:** Code Quality Verification
  - Files: All modified files in Phases 1-3
  - Details: Run `npm run lint` on all modified files - NEVER run dev server, build, or start commands
  - Validation: Ensure no linting errors, proper TypeScript types, import statements correct

- [ ] **Task 4.2:** Static Logic Review
  - Files: All modified error handling blocks
  - Details: Read code to verify incident logging doesn't block user requests, error propagation preserved
  - Validation: Confirm async/await usage correct, no performance impact, errors still thrown

- [ ] **Task 4.3:** Import Statement Verification
  - Files: All modified files
  - Details: Verify all files import logging functions correctly from `@/lib/system-logger`
  - Validation: Check import statements, no circular dependencies, types resolved

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 4, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 5: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 5.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [ ] **Task 5.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all 27 files, verify incident logging added correctly, check context inclusion, provide detailed summary

### Phase 6: User Testing (Only After Code Review)
**Goal:** Request human testing for incident reporting functionality

- [ ] **Task 6.1:** Present AI Testing Results
  - Files: Summary of static analysis and code review
  - Details: Provide comprehensive results of all AI-verifiable testing

- [ ] **Task 6.2:** Request User Testing - Trigger Test Errors
  - Details: User should manually trigger errors (e.g., invalid API keys, database offline) to verify incident reporting
  - Checklist:
    - [ ] Trigger OpenRouter API error → Verify admin email received
    - [ ] Trigger Stripe payment error → Verify admin email received
    - [ ] Check `/admin/debug?tab=logs` → Verify incidents logged
    - [ ] Verify email formatting, context inclusion, resolution suggestions
    - [ ] Confirm no performance impact on normal operations

- [ ] **Task 6.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete testing and confirm incident reporting works as expected

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date (fallback to web search if time tool unavailable)
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date (not assumed date)
- [ ] **Add brief completion notes** (file paths, key changes, line counts)
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - You must confirm you actually did what you said
  - [ ] **Provides user visibility** - Clear progress tracking throughout implementation
  - [ ] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [ ] **Creates audit trail** - Documentation of what was actually completed
  - [ ] **Enables better debugging** - If issues arise, easy to see what was changed

### Example Task Completion Format
```
### Phase 1: Tier 1 - Critical Payment & AI Errors
**Goal:** Implement incident reporting for payment processing and AI generation

- [x] **Task 1.1:** Add Payment Error Reporting to Stripe Actions ✓ 2025-12-18
  - Files: `src/app/actions/subscriptions.ts` (+45 lines across 3 functions) ✓
  - Details: Added logPaymentError() to createCheckoutSession(), createCustomerPortalSession(), syncUserSubscription() ✓
  - Linting: ✅ No errors

- [x] **Task 1.2:** Add Payment Error Reporting to Stripe Webhook ✓ 2025-12-18
  - Files: `src/app/api/webhooks/stripe/route.ts` (+38 lines) ✓
  - Details: Added logPaymentError() for webhook verification and event processing ✓
  - Linting: ✅ No errors
```

---

## 13. File Structure & Organization

### New Files to Create
**No new files required** - all changes are modifications to existing files.

### Files to Modify (27 files total)

**Tier 1 (Critical - 4 files):**
- [ ] `src/lib/ai/mission-generator.ts` - Add `logAiError()` imports and calls
- [ ] `src/app/api/mission-plan/generate/route.ts` - Add `logApiError()` and `logAiError()`
- [ ] `src/app/actions/subscriptions.ts` - Add `logPaymentError()` imports and calls
- [ ] `src/app/api/webhooks/stripe/route.ts` - Add `logPaymentError()` imports and calls

**Tier 2 (High - 11 files):**
- [ ] `src/app/actions/plans.ts` - Add `logSystemError()` imports and calls
- [ ] `src/app/actions/auth.ts` - Add `logSystemError()` imports and calls
- [ ] `src/app/actions/profile.ts` - Add `logSystemError()` and `logPaymentError()`
- [ ] `src/lib/geocoding.ts` - Add `logExternalServiceError()` imports and calls
- [ ] `src/lib/google-routes.ts` - Add `logExternalServiceError()` imports and calls
- [ ] `src/lib/ai/save-mission-report.ts` - Add `logSystemError()` imports and calls
- [ ] `src/app/api/mission-plan/check/route.ts` - Add `logApiError()` imports and calls
- [ ] `src/app/api/mission-plan/cancel/route.ts` - Add `logApiError()` imports and calls
- [ ] `src/app/actions/generate-mission-streaming.ts` - Add `logAiError()` imports and calls
- [ ] `src/app/api/cron/sync-subscriptions/route.ts` - Add `logPaymentError()` imports and calls
- [ ] `src/app/api/activity/log-login/route.ts` - Add `logSystemError()` imports and calls

**Tier 3 (Medium - 12 files):**
- [ ] `src/app/actions/admin.ts` - Add `logSystemError()` imports and calls
- [ ] `src/app/api/search/route.ts` - Add `logExternalServiceError()` imports and calls
- [ ] `src/app/api/amazon/product/route.ts` - Add `logExternalServiceError()` imports and calls
- [ ] `src/lib/amazon-paapi.ts` - Add `logExternalServiceError()` imports and calls
- [ ] `src/app/api/export/billing-csv/route.ts` - Add `logApiError()` imports and calls
- [ ] `src/app/api/export/billing-pdf/route.ts` - Add `logApiError()` imports and calls
- [ ] `src/app/api/admin/users/[userId]/route.ts` - Add `logApiError()` and `logSystemError()`

### Dependencies to Add
**No new dependencies required** - using existing `src/lib/system-logger.ts` and `src/lib/admin-notifications.ts` modules.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze

- [ ] **Error Scenario 1:** Incident logging itself fails (database unavailable, email service down)
  - **Code Review Focus:** Examine `src/lib/system-logger.ts` error handling - does it fail gracefully?
  - **Current Implementation:** Line 110 shows `console.error` for logging failures - non-blocking ✅
  - **Potential Fix:** Already handled correctly - logging failures won't crash the app

- [ ] **Error Scenario 2:** High volume of errors causes email notification spam
  - **Code Review Focus:** Check if there's rate limiting or deduplication in `src/lib/admin-notifications.ts`
  - **Current Implementation:** No rate limiting found - could send many emails for repeated errors
  - **Potential Fix:** Consider adding error deduplication (e.g., only notify once per hour for same error pattern)

- [ ] **Error Scenario 3:** Incident logging adds significant latency to user requests
  - **Code Review Focus:** Verify all logging calls use `await` properly and don't block
  - **Current Implementation:** Logging functions are async, but `await` in catch blocks could block
  - **Potential Fix:** Already acceptable - logging should be fast (<10ms), blocking is minimal

- [ ] **Error Scenario 4:** Sensitive data (API keys, passwords) accidentally logged
  - **Code Review Focus:** Examine all `logPaymentError()`, `logApiError()` calls for data sanitization
  - **Current Implementation:** Request/response data passed as-is - no automatic sanitization
  - **Potential Fix:** Add sanitization functions or document safe data inclusion practices

### Edge Cases to Consider

- [ ] **Edge Case 1:** User not authenticated when error occurs (userId unavailable)
  - **Analysis Approach:** Check if logging functions handle undefined userId gracefully
  - **Current Implementation:** userId is optional in all logging functions - handles undefined ✅
  - **Recommendation:** Use `userId || 'anonymous'` pattern consistently

- [ ] **Edge Case 2:** Error occurs during database transaction (logging could fail mid-transaction)
  - **Analysis Approach:** Verify logging doesn't interfere with transaction rollback
  - **Current Implementation:** Logging is separate database operation - shouldn't affect transactions
  - **Recommendation:** No changes needed - logging is isolated from business logic transactions

- [ ] **Edge Case 3:** Circular error - logging an error causes another error
  - **Analysis Approach:** Check if `system-logger.ts` has protection against infinite recursion
  - **Current Implementation:** Line 110 uses console.error for logging failures - breaks recursion ✅
  - **Recommendation:** Already protected - logging failures don't trigger more logging

- [ ] **Edge Case 4:** Multiple errors in rapid succession for same user/operation
  - **Analysis Approach:** Determine if multiple log entries and emails are acceptable
  - **Current Implementation:** Each error creates separate log entry and email
  - **Recommendation:** Consider adding timestamp-based deduplication for identical errors within 5 minutes

### Security & Access Control Review

- [ ] **Admin Access Control:** Are admin-only features properly restricted to admin users?
  - **Check:** Debug console at `/admin/debug` should verify admin role
  - **Current Implementation:** Verify middleware.ts or page.tsx checks admin role
  - **Recommendation:** Ensure admin-only routes have role checks

- [ ] **Authentication State:** Does the system handle logged-out users appropriately?
  - **Check:** Error handling when userId is undefined or null
  - **Current Implementation:** userId is optional in logging functions - handles gracefully ✅
  - **Recommendation:** No changes needed

- [ ] **Form Input Validation:** Are user inputs validated before logging?
  - **Check:** Verify no XSS vulnerabilities in logged data displayed in debug console
  - **Current Implementation:** Debug console should escape HTML when displaying logs
  - **Recommendation:** Verify debug console UI properly escapes user-generated content

- [ ] **Permission Boundaries:** Can users access logs of other users' errors?
  - **Check:** System logs table should filter by userId or admin role
  - **Current Implementation:** Debug console should only show admin-accessible logs
  - **Recommendation:** Verify debug console enforces admin-only access

- [ ] **Sensitive Data Exposure:** Are API keys, passwords, or PII logged?
  - **Check:** Review all incident logging calls for sensitive data inclusion
  - **Current Implementation:** No automatic sanitization - relies on developer discretion
  - **Recommendation:** **HIGH PRIORITY** - Add sanitization utility or strict guidelines:
    - ❌ Never log: passwords, API keys, credit card numbers, SSNs
    - ✅ Safe to log: user IDs, email addresses (for admin), error messages, status codes
    - ⚠️ Sanitize: Request/response bodies (remove sensitive fields before logging)

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples.

**Priority Order:**
1. **Critical:** Sensitive data exposure in logs - MUST address before implementation
2. **Important:** Email notification spam - should address in Tier 1 or 2
3. **Nice-to-have:** Error deduplication, rate limiting - can address in future iteration

**Specific Action Items:**
- [ ] **Before Phase 1:** Create data sanitization utility function in `src/lib/system-logger.ts`
- [ ] **During implementation:** Use sanitization for all requestData/responseData
- [ ] **Phase 6 testing:** Verify no sensitive data appears in emails or debug console

---

## 15. Deployment & Configuration

### Environment Variables
**All required environment variables already configured:**
```bash
# Required for incident reporting (already in .env.local)
RESEND_API_KEY=re_...              # For sending admin email notifications
FROM_EMAIL=noreply@beprepared.ai   # Email sender address
ADMIN_EMAIL=admin@beprepared.ai    # Where incident reports are sent

# Database (already configured)
DATABASE_URL=postgresql://...      # For system_logs table persistence
```

**No new environment variables required.**

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
✅ Strategic analysis complete - phased implementation recommended (Option 1).

**Next Steps:**
1. **GET USER APPROVAL** of phased approach (Tier 1 → Tier 2 → Tier 3)
2. **PRESENT IMPLEMENTATION OPTIONS** (A/B/C choice as per template)
3. **IMPLEMENT PHASE-BY-PHASE** only after explicit approval

### Communication Preferences
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates (after each phase)
- [x] Flag any blockers or concerns immediately (especially sensitive data issues)
- [x] Suggest improvements or alternatives when appropriate (e.g., data sanitization utility)

### Implementation Approach - CRITICAL WORKFLOW

**🚨 CURRENT STATUS: Awaiting user decision on strategic approach (Option 1 vs 2 vs 3)**

**Once user approves Option 1 (Phased Implementation):**

1. ✅ **STRATEGIC ANALYSIS COMPLETE** - Option 1 (Phased) recommended

2. **SKIP - No strategic analysis needed** (already completed)

3. ✅ **TASK DOCUMENT CREATED** - This document (052_implement_incident_reporting_comprehensive.md)

4. **PRESENT IMPLEMENTATION OPTIONS (NEXT STEP)**
   - [ ] **After user approves phased approach**, present these 3 exact options:

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets from a few representative files (e.g., mission-generator.ts, subscriptions.ts) before implementing? I'll walk through exactly how incident logging will be added.

   **B) Proceed with Implementation**
   Ready to begin Tier 1 implementation (4 critical files)? Say "Approved" or "Go ahead" and I'll start phase-by-phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust tier priorities, add data sanitization utilities, or address specific concerns.

   - [ ] **Wait for explicit user choice** (A, B, or C) - never assume or default

5. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

   **MANDATORY PHASE WORKFLOW:**

   For each phase (Tier 1, Tier 2, Tier 3), follow this exact pattern:

   a. **Execute Phase Completely** - Complete all tasks in current tier
   b. **Update Task Document** - Mark all completed tasks as [x] with timestamps
   c. **Provide Specific Phase Recap** using this format:

   ```
   ✅ **Phase 1 Complete - Tier 1 Critical Errors**
   - Modified 4 files with ~180 total line changes
   - Key changes:
     • src/lib/ai/mission-generator.ts (+45 lines): Added logAiError() for OpenRouter failures
     • src/app/actions/subscriptions.ts (+52 lines): Added logPaymentError() to 3 functions
     • src/app/api/webhooks/stripe/route.ts (+48 lines): Added webhook error reporting
     • src/app/api/mission-plan/generate/route.ts (+35 lines): Added API route error logging
   - Commands executed: npm run lint (4 files)
   - Linting status: ✅ All files pass

   **🔄 Next: Phase 2 - Tier 2 Database & API Errors**
   - Will modify: 11 files (database operations, Google Maps, mission routes)
   - Changes planned: Add logSystemError(), logExternalServiceError(), logApiError()
   - Estimated scope: ~250 line changes across 11 files

   **Say "proceed" to continue to Phase 2**
   ```

   d. **Wait for "proceed"** before starting next phase
   e. **Repeat for each tier** (1 → 2 → 3) until implementation complete
   f. **🚨 CRITICAL:** After Tier 3, proceed to Phase 4 (Code Validation) then Phase 5 (Code Review)

   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
   - [ ] **Real-time task completion tracking** - Update task document immediately after each file
   - [ ] **Mark checkboxes as [x]** with completion timestamps
   - [ ] **Add specific completion notes** (file paths, line counts, functions modified)
   - [ ] **Run linting on each modified file** during the phase (`npm run lint <file>`)
   - [ ] **NEVER run application execution commands** - no `npm run dev`, `npm run build`, `npm start`
   - [ ] **Data sanitization check** - Verify no sensitive data logged in requestData/responseData
   - [ ] **Import statement verification** - Ensure `logAiError`, `logPaymentError`, etc. imported correctly
   - [ ] **Error propagation preserved** - Verify errors still thrown after logging
   - [ ] **Async/await correctness** - Confirm `await logAiError()` used properly

6. **VERIFY IMPLEMENTATION CORRECTNESS (For any changes)**
   - [ ] **Verify logging is async** - All `logXXXError()` calls use `await` properly
   - [ ] **Check error propagation** - Errors still thrown after logging (don't swallow exceptions)
   - [ ] **Validate context data** - userId, userAction, component, route included where available
   - [ ] **Sanitize sensitive data** - No passwords, API keys, or credit card numbers in logs
   - [ ] **Import statements correct** - All logging functions imported from `@/lib/system-logger`

7. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after Phase 3)**
   - [ ] **Present this exact message** to user after Tier 3 implementation complete:

   ```
   🎉 **Implementation Complete - All 3 Tiers Done!**

   All phases have been implemented successfully. I've added incident reporting to 27 files across 3 tiers.

   **📋 I recommend doing a thorough code review of all changes to ensure:**
   - No mistakes were introduced in error handling
   - All critical failure points now have incident reporting
   - Sensitive data is properly sanitized before logging
   - Admin email notifications will work as expected

   **Would you like me to proceed with the comprehensive code review?**

   This review will include:
   - Verifying all 27 files have correct incident logging
   - Running linting and type-checking on all modified files
   - Checking for sensitive data exposure in logs
   - Confirming all success criteria are met
   ```

   - [ ] **Wait for user approval** of code review
   - [ ] **If approved**: Execute comprehensive code review process below

8. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
   - [ ] **Read all 27 modified files** and verify incident logging matches task requirements
   - [ ] **Run linting and type-checking** on all modified files (`npm run lint`, `npm run type-check`)
   - [ ] **Check for sensitive data exposure** - Review all requestData/responseData for API keys, passwords, PII
   - [ ] **Verify all success criteria** from task document are met (Tier 1/2/3 coverage)
   - [ ] **Check error propagation** - Confirm errors still thrown after logging
   - [ ] **Validate import statements** - All logging functions imported correctly
   - [ ] **Provide detailed review summary** using this format:

   ```
   ✅ **Code Review Complete**

   **Files Reviewed:** 27 files with ~600 total line changes
   **Linting Status:** ✅ All files pass (or ❌ X files have issues: [list])
   **Type Checking:** ✅ No type errors (or ❌ [specific type issues])
   **Sensitive Data Check:** ✅ No API keys, passwords, or PII found in logs (or ❌ [issues found])
   **Requirements Met:** ✅ All Tier 1/2/3 success criteria achieved (or ❌ [missing requirements])

   **Tier 1 Coverage:** ✅ 4/4 files (AI, payments, auth)
   **Tier 2 Coverage:** ✅ 11/11 files (database, maps, routes)
   **Tier 3 Coverage:** ✅ 12/12 files (admin, exports, integrations)

   **Summary:** All critical failure points now have comprehensive incident reporting. Admin email notifications will be sent for all error/critical severity incidents. Debug console will display all logged incidents with full context.

   **Confidence Level:** High - All files reviewed, linting passed, no sensitive data exposed

   **Recommendations:**
   - Test with actual API failures to verify email notifications
   - Consider adding error deduplication to prevent email spam
   - Monitor admin email volume after deployment to adjust notification thresholds
   ```

### What Constitutes "Explicit User Approval"

#### For Strategic Analysis
**✅ STRATEGIC APPROVAL RESPONSES (Proceed to task document creation):**
- "Option 1 looks good"
- "Go with phased implementation"
- "I prefer Option 1"
- "Proceed with Tier 1 → 2 → 3 approach"
- "That approach works"

#### For Implementation Options (A/B/C Choice)
**✅ OPTION A RESPONSES (Show detailed code previews):**
- "A" or "Option A"
- "Preview the changes"
- "Show me the code changes"
- "Let me see examples"

**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start implementation"
- "Begin Tier 1"

**✅ OPTION C RESPONSES (Provide more feedback):**
- "C" or "Option C"
- "I have questions about..."
- "Can you modify..."
- "What about..." or "How will you handle..."

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

#### For Final Code Review
**✅ CODE REVIEW APPROVAL:**
- "proceed"
- "yes, review the code"
- "go ahead with review"
- "approved"

🛑 **NEVER start coding without explicit A/B/C choice from user!**
🛑 **NEVER continue to next phase without "proceed" confirmation!**
🛑 **NEVER skip comprehensive code review after implementation phases!**
🛑 **NEVER run application execution commands - user already has app running!**

### 🚨 CRITICAL: Command Execution Rules
**NEVER run application execution commands - the user already has their development environment running!**

**❌ FORBIDDEN COMMANDS (Will cause conflicts with running dev server):**
- `npm run dev` / `npm start` / `next dev` - User already running
- `npm run build` / `next build` - Expensive and unnecessary for validation
- Any command that starts/serves the application
- Any long-running processes or servers

**✅ ALLOWED COMMANDS (Safe static analysis only):**
- `npm run lint` - Static code analysis, safe to run
- `npm run type-check` / `tsc --noEmit` - Type checking only, no compilation
- File reading/analysis tools
- `git status`, `git diff` for code review

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
  - [x] **✅ ALWAYS explain business logic**: "Log AI generation failures for admin visibility", "Include user context for debugging"
  - [x] **✅ Write for future developers** - explain what/why the code does what it does
- [x] **🚨 MANDATORY: Use early returns to keep code clean and readable**
  - [x] **Validate inputs early** and return immediately for invalid cases
  - [x] **Handle error conditions first** before proceeding with main logic
- [x] **🚨 MANDATORY: Use async/await instead of .then() chaining**
  - [x] **Use try/catch blocks** for error handling instead of .catch() chaining
  - [x] **Example**: `await logAiError(error, {...})` instead of `logAiError(error, {...}).then(...)`
- [x] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
  - [x] **Fail fast and clearly** - don't mask issues with fallback behavior
  - [x] **Throw descriptive errors** - explain exactly what format was expected vs received
- [x] **Ensure responsive design (not applicable - server-side only)**
- [x] Follow accessibility guidelines (not applicable - server-side only)
- [x] Use semantic HTML elements (not applicable - server-side only)
- [x] **🚨 MANDATORY: Clean up removal artifacts**
  - [x] **Never leave placeholder comments** after adding logging
  - [x] **Remove unused imports** after adding incident reporting imports

### Architecture Compliance
- [x] **✅ VERIFY: Used correct data access pattern**
  - [x] No new Server Actions, API routes, or lib functions - only modifying existing
  - [x] Incident logging uses existing `logAiError()`, `logPaymentError()`, etc. functions
- [x] **🚨 VERIFY: No server/client boundary violations**
  - [x] All logging happens server-side only - no client component changes
- [x] **🚨 VERIFY: Proper error handling patterns**
  - [x] Incident logging added in catch blocks - doesn't change error throwing behavior
  - [x] Errors still propagate to callers after logging
  - [x] No swallowed exceptions - all errors re-thrown after logging
- [x] **🚨 VERIFY: Data sanitization for sensitive information**
  - [x] **HIGH PRIORITY:** No passwords, API keys, credit card numbers in requestData/responseData
  - [x] User IDs, email addresses (for admin), error messages, status codes are safe to log
  - [x] Request/response bodies sanitized to remove sensitive fields before logging

---

## 17. Notes & Additional Context

### Research Links
- **Incident Reporting Documentation:** `docs/INCIDENT_REPORTING.md` - Complete guide with examples
- **System Logger Implementation:** `src/lib/system-logger.ts` - All logging functions
- **Admin Notifications:** `src/lib/admin-notifications.ts` - Email notification system
- **Database Schema:** `src/db/schema/system-logs.ts` - System logs table definition

### **⚠️ Critical Implementation Considerations**

**Data Sanitization (HIGH PRIORITY):**
Before implementing, create a sanitization utility to prevent sensitive data exposure:

```typescript
// src/lib/system-logger.ts (add this utility function)

/**
 * Sanitize request/response data before logging to remove sensitive information
 */
function sanitizeLogData(data: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!data) return undefined;

  const sanitized = { ...data };
  const sensitiveKeys = [
    'password', 'apiKey', 'api_key', 'secret', 'token', 'creditCard', 'cardNumber',
    'cvv', 'ssn', 'privateKey', 'private_key', 'RESEND_API_KEY', 'OPENROUTER_API_KEY',
    'STRIPE_SECRET_KEY', 'NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY',
  ];

  // Recursively remove sensitive keys
  Object.keys(sanitized).forEach((key) => {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key] as Record<string, unknown>);
    }
  });

  return sanitized;
}
```

**Email Notification Volume Management:**
Consider adding error deduplication to prevent admin email spam:
- Same error pattern within 5 minutes → Don't send duplicate email
- High-volume errors (>10/minute) → Send summary email instead of individual notifications
- Implementation can be added in future iteration if needed

**Performance Monitoring:**
After deployment, monitor:
- Average time added to error handling paths (should be <10ms)
- Admin email volume (adjust notification thresholds if excessive)
- System logs table growth (consider retention policy if grows too large)

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

This section analyzes potential second-order consequences of implementing comprehensive incident reporting across 27 files.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** No changes to API endpoints or data contracts - incident logging is internal only ✅
- [x] **Database Dependencies:** No schema changes - using existing `system_logs` table ✅
- [x] **Component Dependencies:** No component changes - server-side logging only ✅
- [x] **Authentication/Authorization:** No changes to auth flow - logging added to existing error handlers ✅

**🟢 ZERO BREAKING CHANGES** - This is purely additive functionality with no user-facing changes.

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** No changes to data models - logging captures existing error information ✅
- [x] **UI/UX Cascading Effects:** No UI changes except debug console will have more data ✅
- [x] **State Management:** No state changes - logging is fire-and-forget async operation ✅
- [x] **Routing Dependencies:** No routing changes - logging added to existing routes ✅

**🟢 MINIMAL RIPPLE EFFECTS** - Logging is isolated from business logic with no cascading changes.

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** ⚠️ **POTENTIAL ISSUE** - New inserts to `system_logs` table for every error
  - **Analysis:** Each logged error = 1 database INSERT operation
  - **Impact:** Could slow down error handling by 5-15ms per error
  - **Mitigation:** Logging is async and non-blocking - won't impact user-facing response times
  - **Recommendation:** Monitor `system_logs` table size and consider retention policy (e.g., delete logs >90 days)

- [ ] **Server Load:** ⚠️ **POTENTIAL ISSUE** - Admin email notifications add external API calls (Resend API)
  - **Analysis:** Each error/critical severity incident = 1 email API call
  - **Impact:** Could add 50-200ms per error if email service is slow
  - **Mitigation:** Email notifications are async - won't block user requests
  - **Recommendation:** Monitor Resend API response times and add timeout (5s max)

- [x] **Bundle Size:** No impact - server-side logging only, no client bundle changes ✅

- [ ] **Caching Strategy:** ⚠️ **MINOR CONSIDERATION** - Logging doesn't invalidate caches, but debug console needs to refetch
  - **Analysis:** Debug console at `/admin/debug?tab=logs` should show latest logs
  - **Impact:** Admin may need to refresh debug console to see new incidents
  - **Mitigation:** Existing implementation likely doesn't cache logs
  - **Recommendation:** Verify debug console queries `system_logs` table directly without caching

#### 4. **Security Considerations**
- [ ] **Attack Surface:** ⚠️ **CRITICAL** - Logging user input could expose sensitive data
  - **Analysis:** Request/response data may contain passwords, API keys, credit card numbers
  - **Impact:** If not sanitized, sensitive data could appear in logs and admin emails
  - **Mitigation:** **HIGH PRIORITY** - Implement data sanitization utility (see section 17)
  - **Recommendation:** Create `sanitizeLogData()` function before implementing any tier

- [ ] **Data Exposure:** ⚠️ **MODERATE** - System logs contain user IDs and error details
  - **Analysis:** Debug console exposes error patterns and user activity to admins
  - **Impact:** Admins can see which users are encountering errors
  - **Mitigation:** Verify debug console is admin-only (requires role check)
  - **Recommendation:** Audit `/admin/debug` route protection before deployment

- [x] **Permission Escalation:** No risk - logging doesn't affect authorization logic ✅

- [ ] **Input Validation:** ⚠️ **MODERATE** - Logged data displayed in debug console could contain XSS
  - **Analysis:** User-generated content in error messages could contain malicious scripts
  - **Impact:** If debug console doesn't escape HTML, could execute XSS attacks
  - **Mitigation:** Verify debug console properly escapes all logged data
  - **Recommendation:** Review debug console UI implementation for XSS protection

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:** No disruption - logging is invisible to users ✅
- [x] **Data Migration:** No migration needed - additive functionality ✅
- [x] **Feature Deprecation:** No features removed ✅
- [x] **Learning Curve:** Admin-only feature - users unaffected ✅

**🟢 ZERO USER IMPACT** - Completely transparent to end users.

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** ⚠️ **MINOR INCREASE** - 27 files modified with incident logging calls
  - **Analysis:** Each error handler now has additional `await logXXXError()` call
  - **Impact:** Slightly more complex error handling code
  - **Mitigation:** Pattern is consistent across all files - easy to understand
  - **Recommendation:** Document pattern in developer guide for future error handlers

- [ ] **Dependencies:** ⚠️ **MINOR** - Reliance on Resend API for email notifications
  - **Analysis:** Email notifications depend on external service (Resend)
  - **Impact:** If Resend is down, notifications won't be sent (but errors still logged)
  - **Mitigation:** Logging gracefully handles email failures (line 110 in system-logger.ts)
  - **Recommendation:** Monitor Resend API uptime and have backup notification method (Slack, PagerDuty)

- [ ] **Testing Overhead:** ⚠️ **MODERATE** - Need to test incident reporting doesn't break existing error handling
  - **Analysis:** Each modified function should still throw errors correctly after logging
  - **Impact:** Requires testing error propagation and async/await correctness
  - **Mitigation:** Comprehensive code review (Phase 5) will catch issues
  - **Recommendation:** User testing (Phase 6) should trigger actual errors to verify notifications

- [ ] **Documentation:** ⚠️ **MINOR** - Need to update developer documentation with incident reporting patterns
  - **Analysis:** Future developers need to know when/how to add incident reporting
  - **Impact:** Without documentation, new code may not include proper logging
  - **Mitigation:** `docs/INCIDENT_REPORTING.md` already exists with examples
  - **Recommendation:** Add note in developer onboarding guide to reference incident reporting docs

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [ ] **Sensitive Data Exposure:** Request/response data in logs could contain passwords, API keys, credit cards
  - **Severity:** CRITICAL
  - **Action Required:** Implement data sanitization utility BEFORE starting implementation
  - **Blocker:** YES - Must address before any code changes

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Email Notification Volume:** High error rates could spam admin inbox
  - **Severity:** MODERATE
  - **Action Required:** Consider adding error deduplication (can be future iteration)
  - **Blocker:** NO - Can monitor post-deployment and adjust

- [ ] **System Logs Table Growth:** Continuous error logging could grow database table indefinitely
  - **Severity:** LOW
  - **Action Required:** Consider retention policy (delete logs >90 days)
  - **Blocker:** NO - Can implement retention policy later if needed

- [ ] **Debug Console XSS Protection:** Logged data displayed in UI could execute scripts
  - **Severity:** MODERATE
  - **Action Required:** Verify debug console escapes HTML properly
  - **Blocker:** NO - Verify during code review (Phase 5)

### Mitigation Strategies

#### Sensitive Data Protection (CRITICAL - Must Implement)
- [ ] **Create Sanitization Utility:** Add `sanitizeLogData()` function to `system-logger.ts` (see section 17)
- [ ] **Use Sanitization Everywhere:** Call `sanitizeLogData()` on all requestData/responseData before logging
- [ ] **Document Safe Practices:** Update `INCIDENT_REPORTING.md` with data sanitization guidelines
- [ ] **Code Review Focus:** Verify no sensitive data in logs during Phase 5 review

#### Email Notification Volume Management (Consider for Future)
- [ ] **Error Deduplication:** Track error patterns and only notify once per 5-minute window
- [ ] **Batch Notifications:** For high-volume errors (>10/minute), send summary email instead
- [ ] **Severity Thresholds:** Only notify for `error` and `critical` severity (already implemented)
- [ ] **Admin Configuration:** Allow admins to configure notification preferences (future enhancement)

#### Performance Monitoring (Post-Deployment)
- [ ] **Database Performance:** Monitor `system_logs` INSERT performance (should be <5ms)
- [ ] **Email API Latency:** Track Resend API response times (should be <200ms)
- [ ] **Error Handler Overhead:** Verify logging adds <10ms to error handling paths
- [ ] **Table Size Growth:** Monitor `system_logs` table size and implement retention policy if needed

#### Security Hardening (Verify During Code Review)
- [ ] **Debug Console Access:** Verify `/admin/debug` route requires admin role
- [ ] **XSS Protection:** Confirm debug console escapes all user-generated content
- [ ] **Log Data Filtering:** Ensure regular users can't access other users' error logs
- [ ] **Email Security:** Verify `ADMIN_EMAIL` is protected environment variable

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections of impact assessment filled out
- [x] **Identify Critical Issues:** Sensitive data exposure flagged as RED FLAG
- [x] **Propose Mitigation:** Data sanitization utility suggested (section 17)
- [x] **Alert User:** Clearly communicate sensitive data risk in recommendations below
- [x] **Recommend Implementation Order:** Address sanitization BEFORE Tier 1 implementation

### 🚨 **USER ATTENTION REQUIRED - CRITICAL SECURITY ISSUE**

**SENSITIVE DATA EXPOSURE RISK:**
Before implementing incident reporting, we MUST create a data sanitization utility to prevent logging sensitive information like passwords, API keys, and credit card numbers.

**Recommended Action:**
1. **Phase 0 (New):** Create `sanitizeLogData()` utility in `src/lib/system-logger.ts`
2. **Modify all logging functions** to automatically sanitize requestData/responseData
3. **Only then proceed** to Tier 1 implementation

**Example Sensitive Data at Risk:**
- `src/app/actions/subscriptions.ts`: Stripe API keys in headers
- `src/lib/ai/mission-generator.ts`: OpenRouter API key in headers
- `src/app/api/webhooks/stripe/route.ts`: Stripe webhook signatures
- `src/app/actions/auth.ts`: User passwords during signup

**Mitigation:** Add sanitization utility that redacts sensitive keys before logging (see section 17 for implementation).

**Decision Point:** Do you want me to implement data sanitization as Phase 0 before starting Tier 1, or would you prefer to review the sanitization approach first?

---

*Template Version: 1.3*
*Task Number: 052*
*Created: 2025-12-18*
*Status: Pending User Approval*
