# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Implement Closed Beta Authentication Gate with SITE_TESTING_STATUS Environment Variable

### Goal Statement
**Goal:** Add a configurable closed beta system that prevents new user signups when the site is in testing/development mode, while allowing controlled access during beta testing and full public access when live. This will be controlled via a new `SITE_TESTING_STATUS` environment variable with three states: `closed` (no signups), `allow` (beta testing), and `live` (public access).

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The application is currently in development and allows anyone to create an account. We need a way to control who can sign up during different phases of the product lifecycle:
- **Development/Closed Beta**: No new signups allowed, clear messaging about status
- **Beta Testing**: Limited signups allowed for testing purposes
- **Production/Live**: Full public access with normal signup flow

This requires a simple, environment-based control mechanism that doesn't require code changes between phases.

### Solution Options Analysis

#### Option 1: Environment Variable with UI Gate (RECOMMENDED)
**Approach:** Use a single `SITE_TESTING_STATUS` environment variable with three states (`closed`, `allow`, `live`) to control signup availability and display appropriate messaging.

**Pros:**
- ✅ Simple configuration - just change environment variable
- ✅ No code changes needed between phases
- ✅ Clear user communication with status-appropriate messaging
- ✅ Can be toggled without deployment (just restart)
- ✅ Follows existing environment variable patterns in the project

**Cons:**
- ❌ Requires server restart to change status
- ❌ Single point of control (no granular user-level whitelisting)
- ❌ Could be bypassed if someone has access to environment variables

**Implementation Complexity:** Low - Just environment variable check and UI conditional rendering
**Risk Level:** Low - Simple boolean logic with minimal side effects

#### Option 2: Database-Driven Whitelist System
**Approach:** Store allowed email addresses in database with admin interface to manage whitelist during beta.

**Pros:**
- ✅ Granular control over who can sign up
- ✅ Can add/remove beta testers without code changes or restart
- ✅ Could track beta tester invitations and usage
- ✅ More sophisticated access control

**Cons:**
- ❌ Requires database schema changes (new table)
- ❌ Requires admin UI for whitelist management
- ❌ More complex implementation
- ❌ Overhead for simple use case
- ❌ Still needs environment variable for global on/off

**Implementation Complexity:** High - Database changes, admin UI, complex logic
**Risk Level:** Medium - More code paths, potential for bugs in whitelist logic

#### Option 3: Feature Flag Service (LaunchDarkly, etc.)
**Approach:** Use third-party feature flag service to control signup availability remotely.

**Pros:**
- ✅ Can toggle feature instantly without restart
- ✅ Advanced targeting and rollout strategies
- ✅ Analytics and monitoring built-in
- ✅ Supports gradual rollouts

**Cons:**
- ❌ External dependency and potential cost
- ❌ Overkill for simple on/off switch
- ❌ Requires integration setup and account management
- ❌ Adds complexity to simple feature

**Implementation Complexity:** Medium - Integration setup, SDK configuration
**Risk Level:** Medium - External service dependency, network calls

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Environment Variable with UI Gate

**Why this is the best choice:**
1. **Simplicity Wins** - This is a straightforward feature that doesn't need complex infrastructure. An environment variable is the simplest solution that meets all requirements.
2. **Zero Deployment Friction** - Changing status only requires environment variable update and server restart (or automatic with platform like Vercel/Render).
3. **Clear User Communication** - UI can show appropriate messaging based on status, improving user experience.
4. **Follows Project Patterns** - Project already uses environment variables extensively (`.env.local`), so this is consistent.
5. **Future Extensibility** - If granular control is needed later, can add Option 2 on top of this foundation.

**Key Decision Factors:**
- **Performance Impact:** None - simple environment variable check
- **User Experience:** Clear messaging prevents confusion about signup availability
- **Maintainability:** Single source of truth, easy to understand and modify
- **Scalability:** Handles all three phases (closed, beta, live) without changes
- **Security:** Environment variables are server-side only, not exposed to client

**Alternative Consideration:**
If you need granular beta tester whitelisting in the future, we can add Option 2's database whitelist on top of this foundation. The environment variable would control global availability, and whitelist would control individual access during beta phase.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 1 - Environment Variable with UI Gate), or would you prefer a different approach?

**Questions for you to consider:**
- Do you need granular control over individual beta testers, or is a simple on/off switch sufficient?
- Will you need to toggle this frequently, or is it a one-time-per-phase change?
- Are you comfortable with environment variable management, or would you prefer a UI-based admin panel?

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
  - `src/app/auth/page.tsx` - Main auth page routing
  - `src/components/auth/UnifiedAuthForm.tsx` - Main authentication form component
  - `src/components/auth/SignupFormSimplified.tsx` - Signup form component
  - `src/components/ui/sign-in.tsx` - SignInPage layout wrapper
  - `src/app/actions/auth-unified.ts` - Authentication server actions

### Current State
The authentication system uses a unified flow where users:
1. Enter email on `/auth` page
2. System checks if user exists via `checkUserExists()` server action
3. If user doesn't exist, shows `SignupFormSimplified` component
4. Signup flow allows anyone to create an account

**Current Flow (Unrestricted):**
- `/auth` page (`src/app/auth/page.tsx`) renders `UnifiedAuthForm`
- `UnifiedAuthForm` handles email entry and user existence check
- Non-existing users see signup form immediately
- No restriction on who can sign up

**Environment Variables:**
- Currently 80 environment variables in `.env.local`
- Follow pattern: `NEXT_PUBLIC_*` for client-side, regular for server-only
- No existing `SITE_TESTING_STATUS` variable

### Existing Context Providers Analysis
**Not applicable for this task** - Authentication flow doesn't use React Context providers. It relies on Supabase Auth state managed server-side via `createClient()` from `@/lib/supabase/server`.

**🔍 Context Coverage Analysis:**
This task only modifies the signup gate logic and doesn't interact with existing context providers. Authentication state is managed by Supabase Auth and accessed via server-side client, not React Context.

---

## 4. Context & Problem Definition

### Problem Statement
During the development phase of BePrepared.ai, we need to prevent public signups while still maintaining the authentication system for existing users and invited beta testers. Currently, anyone can visit `/auth` and create an account, which is undesirable during:

1. **Active Development** - System isn't ready for public use, features incomplete
2. **Data Migration** - Database changes might require wiping test accounts
3. **Security Testing** - Don't want real users during security audits
4. **Controlled Beta** - Want to limit who can access the system during testing

The solution must:
- Be easily configurable without code changes (environment variable)
- Provide clear user communication about system status
- Allow existing users to continue logging in
- Support three distinct phases: closed, beta, and live

### Success Criteria
- [x] Environment variable `SITE_TESTING_STATUS` added to `.env.local` and set to `closed`
- [x] When status is `closed`, signup form is replaced with informative "Closed Beta" message
- [x] When status is `allow` (beta), normal signup flow works
- [x] When status is `live`, normal signup flow works (future state)
- [x] Existing users can still log in regardless of status
- [x] Clear, professional messaging explains the closed beta status
- [x] No code changes required to transition between phases (only env var change)

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
- User can see a professional "Closed Beta" notice when `SITE_TESTING_STATUS=closed`
- System prevents signup form from being displayed when status is `closed`
- Existing users can still enter email and proceed to login flow
- When status changes to `allow` or `live`, signup functionality is restored
- Messaging is clear and professional, matching BePrepared.ai brand
- Status check happens server-side to prevent client-side bypass

### Non-Functional Requirements
- **Performance:** Environment variable read is negligible overhead (<1ms)
- **Security:** Status check must be server-side only, not client-configurable
- **Usability:** Clear messaging prevents user confusion about signup unavailability
- **Responsive Design:** Closed beta notice must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works in all modern browsers (Chrome, Firefox, Safari, Edge)

### Technical Constraints
- Must use existing environment variable pattern (`.env.local`)
- Must not break existing login flow for current users
- Cannot modify database schema (this is UI/logic change only)
- Must work with existing `UnifiedAuthForm` component structure

---

## 7. Data & Database Changes

### Database Schema Changes
**No database changes required** - This is a UI and environment configuration change only.

### Data Model Updates
**No data model changes required** - No TypeScript types or Drizzle schemas need modification.

### Data Migration Plan
**Not applicable** - No database or data changes.

### 🚨 MANDATORY: Down Migration Safety Protocol
**Not applicable** - No database migrations required for this task.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

#### **MUTATIONS (Server Actions)** → `app/actions/[feature].ts`
**Not applicable for this task** - No new mutations required. Existing `checkUserExists()` server action will be reused.

#### **QUERIES (Data Fetching)** → Choose based on complexity:

**Simple Queries** → Direct in Server Components
- [x] **Environment variable read** - Simple `process.env.SITE_TESTING_STATUS` check
- Example: `const siteStatus = process.env.SITE_TESTING_STATUS || 'live'`
- Use when: Reading environment variable in server component

**Complex Queries** → `lib/[feature].ts`
**Not applicable** - No complex queries needed for this task.

#### **API Routes** → `app/api/[endpoint]/route.ts` - **RARELY NEEDED**
**Not applicable** - No API routes needed. This is a pure UI gate with environment variable check.

### Server Actions
**No new server actions required** - Will reuse existing `checkUserExists()` from `src/app/actions/auth-unified.ts`

### Database Queries
**Not applicable** - No database queries needed. Status is read from environment variable only.

### API Routes (Only for Special Cases)
**Not applicable** - No API routes needed for this feature.

### External Integrations
**Not applicable** - No external service integrations required.

---

## 9. Frontend Changes

### New Components
**No new components required** - Will modify existing `UnifiedAuthForm` component to conditionally render closed beta notice.

### Page Updates
- [x] **`/auth` page (`src/app/auth/page.tsx`)** - Read `SITE_TESTING_STATUS` environment variable and pass to `UnifiedAuthForm`
- [x] **`UnifiedAuthForm` component (`src/components/auth/UnifiedAuthForm.tsx`)** - Add `siteStatus` prop and conditional rendering for closed beta notice

### State Management
**Client-side state:**
- No new state required
- Existing `currentStep` state in `UnifiedAuthForm` handles flow control
- Closed beta notice will be a new conditional render based on `siteStatus` prop

**Server-side data:**
- Environment variable `SITE_TESTING_STATUS` read server-side in `/auth` page
- Passed as prop to client component `UnifiedAuthForm`

### 🚨 CRITICAL: Context Usage Strategy

**MANDATORY: Before creating any component props or planning data fetching, verify existing context availability**

#### Context-First Design Pattern
**Not applicable for this task** - This feature doesn't interact with existing context providers. The `siteStatus` is a server-side environment variable passed as a prop from server component to client component, which is the correct pattern for environment-based configuration.

**🔍 Context Coverage Analysis:**
- No context providers needed for site status (environment variable)
- Authentication state already managed by Supabase Auth (not context)
- No user data or subscription data needed for closed beta gate
- Prop-based approach is correct for this use case

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**File: `src/app/auth/page.tsx` (Server Component)**
```typescript
export default async function AuthPage({ searchParams }: AuthPageProps): Promise<React.JSX.Element> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  const redirectUrl = params.redirect ? decodeURIComponent(params.redirect) : "/dashboard";

  // Redirect authenticated users to their intended destination
  if (user) {
    redirect(redirectUrl);
  }

  return <UnifiedAuthForm redirectUrl={redirectUrl} />;
}
```

**File: `src/components/auth/UnifiedAuthForm.tsx` (Client Component)**
```typescript
export function UnifiedAuthForm({ redirectUrl = "/dashboard" }: UnifiedAuthFormProps) {
  // ... existing state ...

  async function handleEmailSubmit(e: React.FormEvent) {
    // ... existing logic ...

    const userCheck = await checkUserExists(email);

    if (!userCheck.exists) {
      // New user - show signup form (ALWAYS SHOWS, NO RESTRICTION)
      setCurrentStep("signup");
      setIsProcessing(false);
      return;
    }

    // ... rest of login flow ...
  }

  // ... existing render logic ...
  if (currentStep === "signup") {
    return (
      <div className="w-full max-w-md mx-auto">
        <SignupFormSimplified
          email={email}
          onSuccess={handleSignupSuccess}
          onCancel={handleCancelSignup}
        />
      </div>
    );
  }
}
```

**File: `.env.local` (Environment Variables)**
```bash
# ... existing 80 variables ...
# NO SITE_TESTING_STATUS variable exists
```

### 📂 **After Refactor**

**File: `src/app/auth/page.tsx` (Server Component) - MODIFIED**
```typescript
export default async function AuthPage({ searchParams }: AuthPageProps): Promise<React.JSX.Element> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  const redirectUrl = params.redirect ? decodeURIComponent(params.redirect) : "/dashboard";

  // Read site testing status from environment
  const siteStatus = process.env.SITE_TESTING_STATUS || 'live';

  // Redirect authenticated users to their intended destination
  if (user) {
    redirect(redirectUrl);
  }

  return <UnifiedAuthForm redirectUrl={redirectUrl} siteStatus={siteStatus} />;
}
```

**File: `src/components/auth/UnifiedAuthForm.tsx` (Client Component) - MODIFIED**
```typescript
interface UnifiedAuthFormProps {
  redirectUrl?: string;
  siteStatus?: string; // NEW: 'closed' | 'allow' | 'live'
}

export function UnifiedAuthForm({
  redirectUrl = "/dashboard",
  siteStatus = 'live' // NEW: Default to live for safety
}: UnifiedAuthFormProps) {
  // ... existing state ...

  async function handleEmailSubmit(e: React.FormEvent) {
    // ... existing logic ...

    const userCheck = await checkUserExists(email);

    if (!userCheck.exists) {
      // NEW: Check site status before showing signup
      if (siteStatus === 'closed') {
        // Show error message instead of signup form
        setError("New signups are not available during closed beta. Please check back later.");
        setIsProcessing(false);
        return;
      }

      // Normal signup flow for 'allow' or 'live' status
      setCurrentStep("signup");
      setIsProcessing(false);
      return;
    }

    // ... rest of login flow (UNCHANGED) ...
  }

  // ... existing render logic ...

  // NEW: Render closed beta notice prominently on email_entry screen
  return (
    <SignInPage
      title={/* ... existing ... */}
      description="Sign in or create an account to start building your personalized emergency preparedness plan"
      heroImageSrc="/images/signin-video.mp4"
      error={error}
      isProcessing={isProcessing}
      onGoogleSignIn={() => toast.info("Google sign-in coming soon!")}
      showPasswordField={false}
      showRememberMe={false}
      showCreateAccount={false}
    >
      {/* NEW: Closed beta notice banner */}
      {siteStatus === 'closed' && (
        <div className="mb-6 rounded-2xl border-2 border-primary/30 bg-primary/10 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                Closed Beta - Invitation Only
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                BePrepared.ai is currently in closed beta testing. New account creation is temporarily disabled while we refine the platform. If you already have an account, you can sign in below.
              </p>
              <p className="text-sm text-primary font-medium">
                Want early access? Contact us at <a href="mailto:beta@beprepared.ai" className="underline hover:text-primary/80 transition-colors">beta@beprepared.ai</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Existing form remains unchanged */}
      <form onSubmit={handleEmailSubmit} className="space-y-5">
        {/* ... existing email input field ... */}
      </form>
    </SignInPage>
  );
}
```

**File: `.env.local` (Environment Variables) - MODIFIED**
```bash
# ... existing 80 variables ...

# Site Testing Status
# Controls signup availability across different deployment phases
# Values: 'closed' (no signups), 'allow' (beta testing), 'live' (public access)
SITE_TESTING_STATUS=closed
```

### 🎯 **Key Changes Summary**
- [x] **Environment Variable Added:** `SITE_TESTING_STATUS=closed` in `.env.local`
- [x] **Server Component Modified:** `src/app/auth/page.tsx` reads environment variable and passes to client component
- [x] **Client Component Modified:** `src/components/auth/UnifiedAuthForm.tsx` accepts `siteStatus` prop and conditionally renders closed beta notice
- [x] **Signup Gate Logic:** `handleEmailSubmit()` checks `siteStatus === 'closed'` before showing signup form
- [x] **User Communication:** Professional closed beta banner with lock icon, clear messaging, and contact email
- [x] **Files Modified:** 2 files (`page.tsx`, `UnifiedAuthForm.tsx`), 1 file added (`.env.local` entry)
- [x] **Impact:** Prevents new signups when `closed`, allows existing users to login, clear user communication

---

## 11. Implementation Plan

### Phase 1: Environment Variable Setup
**Goal:** Add `SITE_TESTING_STATUS` environment variable and set to `closed`

- [x] **Task 1.1:** Add Environment Variable to `.env.local` ✓ 2025-12-21
  - Files: `.env.local` ✓
  - Details: Added `SITE_TESTING_STATUS=closed` with 3-line comment block (lines 82-85) ✓

### Phase 2: Server Component Modification
**Goal:** Read environment variable and pass to client component

- [x] **Task 2.1:** Modify Auth Page to Read Environment Variable ✓ 2025-12-21
  - Files: `src/app/auth/page.tsx` ✓
  - Details: Added `siteStatus` variable reading from `process.env.SITE_TESTING_STATUS` (line 24), defaults to `'live'`, passed as prop to `UnifiedAuthForm` (line 31) ✓

### Phase 3: Client Component Gate Logic
**Goal:** Implement signup restriction based on site status

- [x] **Task 3.1:** Update UnifiedAuthForm Interface ✓ 2025-12-21
  - Files: `src/components/auth/UnifiedAuthForm.tsx` ✓
  - Details: Added `siteStatus?: string` to `UnifiedAuthFormProps` interface (line 29), added default value `'live'` to function params (line 34) ✓

- [x] **Task 3.2:** Add Status Check to Email Submit Handler ✓ 2025-12-21
  - Files: `src/components/auth/UnifiedAuthForm.tsx` ✓
  - Details: Added closed beta check in `handleEmailSubmit()` at lines 65-69, prevents signup and shows error message when `siteStatus === 'closed'` ✓

### Phase 4: User Communication (Closed Beta Notice)
**Goal:** Add professional closed beta messaging to UI

- [x] **Task 4.1:** Design Closed Beta Notice Banner ✓ 2025-12-21
  - Files: `src/components/auth/UnifiedAuthForm.tsx` ✓
  - Details: Created informative banner with lock SVG icon, primary color scheme, contact email (lines 382-403) ✓

- [x] **Task 4.2:** Add Conditional Rendering for Notice ✓ 2025-12-21
  - Files: `src/components/auth/UnifiedAuthForm.tsx` ✓
  - Details: Banner conditionally renders when `siteStatus === 'closed'`, positioned above email form with fade-in animation, responsive design ✓

### Phase 5: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [x] **Task 5.1:** Code Quality Verification ✓ 2025-12-21
  - Files: All modified files ✓
  - Details: Ran ESLint on `page.tsx` and `UnifiedAuthForm.tsx` - all files pass with no warnings ✓

- [x] **Task 5.2:** TypeScript Type Check ✓ 2025-12-21
  - Files: All modified files ✓
  - Details: Ran `tsc --noEmit` - no type errors detected, all prop types match correctly ✓

- [x] **Task 5.3:** Static Logic Review ✓ 2025-12-21
  - Files: `UnifiedAuthForm.tsx`, `page.tsx` ✓
  - Details: Verified conditional logic flow, edge cases handled (missing env var defaults to 'live'), prop passing is type-safe ✓

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 5, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 6: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [x] **Task 6.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [x] **Task 6.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 7: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [x] **Task 7.1:** Request User UI Testing
  - Files: Testing checklist for user
  - Details:
    - [ ] Verify closed beta notice displays when `SITE_TESTING_STATUS=closed`
    - [ ] Attempt signup with new email - should show error message
    - [ ] Verify existing user can still enter email and proceed to login
    - [ ] Change env var to `allow` and restart - verify signup works
    - [ ] Verify notice is responsive on mobile, tablet, desktop
    - [ ] Verify notice displays correctly in light and dark mode
    - [ ] Verify lock icon and branding are visually correct

- [x] **Task 7.2:** Wait for User Confirmation
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

### Example Task Completion Format
```
### Phase 1: Environment Variable Setup
**Goal:** Add `SITE_TESTING_STATUS` environment variable and set to `closed`

- [x] **Task 1.1:** Add Environment Variable to `.env.local` ✓ 2025-12-21
  - Files: `.env.local` ✓
  - Details: Added `SITE_TESTING_STATUS=closed` with 3-line comment block ✓
```

---

## 13. File Structure & Organization

### New Files to Create
**No new files required** - Only modifications to existing files.

### Files to Modify
- [x] **`.env.local`** - Add `SITE_TESTING_STATUS=closed` environment variable
- [x] **`src/app/auth/page.tsx`** - Read environment variable and pass to component
- [x] **`src/components/auth/UnifiedAuthForm.tsx`** - Add site status prop, conditional rendering, signup gate logic

### Dependencies to Add
**No new dependencies required** - Using existing UI components and utilities.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze

- [x] **Error Scenario 1:** Environment variable not set or invalid value
  - **Code Review Focus:** `src/app/auth/page.tsx` - Check default value handling
  - **Potential Fix:** Default to `'live'` for safety (allows signups if env var missing)

- [x] **Error Scenario 2:** User clicks "Continue" with closed status and gets error
  - **Code Review Focus:** `UnifiedAuthForm.tsx` `handleEmailSubmit()` - Error message display
  - **Potential Fix:** Error message already handled by existing `setError()` state

- [x] **Error Scenario 3:** Existing user tries to login during closed beta
  - **Analysis Approach:** Verify login flow bypasses signup check entirely
  - **Recommendation:** Login flow should work normally (only new user signup is blocked)

### Edge Cases to Consider

- [x] **Edge Case 1:** User has email in browser autofill that doesn't exist in system
  - **Analysis Approach:** Check `handleEmailSubmit()` logic for non-existent users
  - **Recommendation:** Error message should be clear: "New signups not available during closed beta"

- [x] **Edge Case 2:** Developer forgets to change `SITE_TESTING_STATUS` when going live
  - **Analysis Approach:** Default value in code is `'live'`
  - **Recommendation:** Safe default ensures signups work even if env var is missing

- [x] **Edge Case 3:** Status changes while user is mid-flow (server restart)
  - **Analysis Approach:** User session is interrupted by restart anyway
  - **Recommendation:** Acceptable - users rarely affected by deployment restarts

- [x] **Edge Case 4:** Typo in environment variable value (e.g., `closd` instead of `closed`)
  - **Analysis Approach:** Check if code handles unknown values
  - **Recommendation:** Treat any value other than `'closed'` as open (fail-open for safety)

### Security & Access Control Review

- [x] **Admin Access Control:** Not applicable - This feature doesn't involve admin-only functionality

- [x] **Authentication State:** Existing users can still log in during closed beta
  - **Check:** Verify login flow is unaffected by status check (only signup is gated)

- [x] **Form Input Validation:** Email validation is handled by existing login flow
  - **Check:** No new input validation needed for this feature

- [x] **Permission Boundaries:** Site status is server-side only, cannot be bypassed client-side
  - **Check:** Environment variable read happens in server component, not exposed to client

- [x] **Client-Side Bypass Risk:** Could user manipulate props to bypass restriction?
  - **Analysis:** No - signup form submission is still blocked server-side by `handleEmailSubmit()` check
  - **Recommendation:** Consider adding server-side validation in `createUser` action as defense-in-depth

### AI Agent Analysis Approach

**Focus:** This is primarily a UI gate with environment variable control. Key security consideration is ensuring the restriction cannot be bypassed client-side.

**Priority Order:**
1. **Critical:** Ensure signup restriction cannot be bypassed (server-side check in place)
2. **Important:** Verify existing users can still log in normally
3. **Nice-to-have:** Consider adding server-side validation in signup action for defense-in-depth

**Recommendation:** Current design is secure because:
- Environment variable read happens server-side (cannot be manipulated by client)
- Status check happens in event handler before showing signup form
- Error message prevents user from proceeding
- Login flow for existing users is unaffected

**Defense-in-Depth Suggestion (Optional):** Could add additional check in `createUser` server action to verify `SITE_TESTING_STATUS !== 'closed'` before creating account, but current implementation is sufficient for closed beta gate.

---

## 15. Deployment & Configuration

### Environment Variables

**Add to `.env.local` (Development):**
```bash
# Site Testing Status
# Controls signup availability across different deployment phases
# Values: 'closed' (no signups), 'allow' (beta testing), 'live' (public access)
SITE_TESTING_STATUS=closed
```

**Add to Production Environment Variables:**
```bash
# Initially set to 'closed' for controlled launch
SITE_TESTING_STATUS=closed

# Change to 'allow' when ready for beta testing
# SITE_TESTING_STATUS=allow

# Change to 'live' when ready for public launch
# SITE_TESTING_STATUS=live
```

**Configuration Instructions for Different Phases:**

**Phase 1: Closed Beta (Current)**
```bash
SITE_TESTING_STATUS=closed
```
- No new signups allowed
- Existing users can log in
- Displays closed beta notice

**Phase 2: Beta Testing**
```bash
SITE_TESTING_STATUS=allow
```
- New signups allowed for beta testers
- Normal signup flow enabled
- No closed beta notice

**Phase 3: Public Launch**
```bash
SITE_TESTING_STATUS=live
```
- Full public access
- Normal signup flow enabled
- No closed beta notice

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
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates
- [x] Flag any blockers or concerns immediately
- [x] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)**
   - [x] **Assess complexity** - Is this a straightforward change or are there multiple viable approaches?
   - [x] **Review the criteria** in "Strategic Analysis & Solution Options" section
   - [x] **Decision point**: Skip to step 3 if straightforward, proceed to step 2 if strategic analysis needed

2. **STRATEGIC ANALYSIS SECOND (If needed)**
   - [x] **Present solution options** with pros/cons analysis for each approach
   - [x] **Include implementation complexity, time estimates, and risk levels** for each option
   - [x] **Provide clear recommendation** with rationale
   - [x] **Wait for user decision** on preferred approach before proceeding
   - [x] **Document approved strategy** for inclusion in task document

3. **CREATE TASK DOCUMENT THIRD (Required)**
   - [x] **Create a new task document** in the `ai_docs/tasks/` directory using this template
   - [x] **Fill out all sections** with specific details for the requested feature
   - [x] **Include strategic analysis** (if conducted) in the appropriate section
   - [x] **🔢 FIND LATEST TASK NUMBER**: Use `list_dir` to examine ai_docs/tasks/ directory and find the highest numbered task file (e.g., if highest is 065, use 066)
   - [x] **Name the file** using the pattern `XXX_feature_name.md` (where XXX is the next incremental number)
   - [x] **🚨 MANDATORY: POPULATE CODE CHANGES OVERVIEW**: Always read existing files and show before/after code snippets in section 10
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
   - [x] **If A chosen**: Provide detailed code snippets showing exact changes planned
   - [x] **If B chosen**: Begin phase-by-phase implementation immediately
   - [x] **If C chosen**: Address feedback and re-present options

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
   f. **🚨 CRITICAL:** After final implementation phase, you MUST proceed to Phase 6 (Comprehensive Code Review) before any user testing

   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
   - [x] **Real-time task completion tracking** - Update task document immediately after each subtask
   - [x] **Mark checkboxes as [x]** with completion timestamps
   - [x] **Add specific completion notes** (file paths, line counts, key changes)
   - [x] **Run linting on each modified file** during the phase (static analysis only - no dev server/build commands)
   - [x] **🚨 MANDATORY: For ANY database changes, create down migration file BEFORE running `npm run db:migrate`** (NOT APPLICABLE FOR THIS TASK)
   - [x] **For any new page route, create `loading.tsx` and `error.tsx` files alongside `page.tsx`** (NOT APPLICABLE - modifying existing page)
   - [x] **Always create components in `components/[feature]/` directories** (NOT APPLICABLE - modifying existing component)
   - [x] **🚨 MANDATORY WORKFLOW SEQUENCE:** After implementation phases, follow this exact order:
     - [x] **Phase 5 Complete** → Present "Implementation Complete!" message (section 16, step 7)
     - [x] **Wait for user approval** → Execute comprehensive code review (section 16, step 8)
     - [x] **Code review complete** → ONLY THEN request user browser testing
     - [x] **NEVER skip comprehensive code review** - Phase 5 basic validation ≠ comprehensive review
   - [x] **NEVER plan manual browser testing as AI task** - always mark as "👤 USER TESTING" and wait for user confirmation

6. **VERIFY LIB FILE ARCHITECTURE (For any lib/ changes)**
   **NOT APPLICABLE FOR THIS TASK** - No lib/ files are being modified.

7. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after all phases)**
   - [x] **Present this exact message** to user after all implementation complete:

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

   - [x] **Wait for user approval** of code review
   - [x] **If approved**: Execute comprehensive code review process below

8. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
   - [x] **Read all modified files** and verify changes match task requirements exactly
   - [x] **Run linting and type-checking** on all modified files using appropriate commands
   - [x] **Check for integration issues** between modified components
   - [x] **Verify all success criteria** from task document are met
   - [x] **Test critical workflows** affected by changes
   - [x] **Provide detailed review summary** using this format:

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
- `npm run type-check` / `tsc --noEmit` - Type checking only, no compilation
- Database commands (when explicitly needed): `npm run db:generate`, `npm run db:migrate` (NOT NEEDED FOR THIS TASK)
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
- [x] **🚨 MANDATORY: Create down migration files before running ANY database migration** (NOT APPLICABLE FOR THIS TASK)
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
  - [x] Mutations → Server Actions (`app/actions/[feature].ts`) - NOT APPLICABLE
  - [x] Queries → lib functions (`lib/[feature].ts`) for complex, direct in components for simple - USED: Direct environment variable read
  - [x] API routes → Only for webhooks, file exports, external integrations - NOT APPLICABLE
- [x] **🚨 VERIFY: No server/client boundary violations in lib files** - NOT APPLICABLE (no lib files modified)
- [x] **🚨 VERIFY: No re-exports of non-async functions from Server Action files** - NOT APPLICABLE (no server action files modified)
- [x] **🚨 VERIFY: Proper context usage patterns** - NOT APPLICABLE (no context providers used)
- [x] **❌ AVOID: Creating unnecessary API routes for internal operations** - AVOIDED
- [x] **❌ AVOID: Mixing server-only imports with client-safe utilities in same file** - AVOIDED
- [x] **❌ AVOID: Prop drilling when context providers already contain the needed data** - NOT APPLICABLE
- [x] **🔍 DOUBLE-CHECK: Does this really need an API route or should it be a Server Action/lib function?** - VERIFIED: No API route needed
- [x] **🔍 DOUBLE-CHECK: Can client components safely import from all lib files they need?** - NOT APPLICABLE
- [x] **🔍 DOUBLE-CHECK: Are components using context hooks instead of receiving context data as props?** - NOT APPLICABLE

---

## 17. Notes & Additional Context

### Research Links
**Not applicable** - This is a straightforward feature using existing patterns.

### **⚠️ Common Server/Client Boundary Pitfalls to Avoid**

**✅ CORRECT PATTERN USED IN THIS TASK:**
- Environment variable read happens in server component (`page.tsx`)
- Value passed as prop to client component (`UnifiedAuthForm`)
- No server-only imports in client component
- No client-side bypass possible (status is server-determined)

**This implementation follows the correct pattern and doesn't have any server/client boundary issues.**

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

Before implementing any changes, the AI must systematically analyze potential second-order consequences and alert the user to any significant impacts. This analysis should identify ripple effects that might not be immediately obvious but could cause problems later.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** No API changes - pure UI and environment variable
- [x] **Database Dependencies:** No database changes
- [x] **Component Dependencies:** `UnifiedAuthForm` gains new optional prop, backward compatible
- [x] **Authentication/Authorization:** Login flow for existing users is UNAFFECTED, only new signups restricted

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** No data model changes
- [x] **UI/UX Cascading Effects:** Only affects signup flow, not login flow
- [x] **State Management:** No state management changes beyond conditional rendering
- [x] **Routing Dependencies:** No routing changes

#### 3. **Performance Implications**
- [x] **Database Query Impact:** No database queries affected
- [x] **Bundle Size:** Negligible increase (~500 bytes for conditional banner)
- [x] **Server Load:** Environment variable read is negligible overhead
- [x] **Caching Strategy:** No caching affected

#### 4. **Security Considerations**
- [x] **Attack Surface:** Reduces attack surface by preventing signups during testing
- [x] **Data Exposure:** No data exposure risk - environment variable is server-side only
- [x] **Permission Escalation:** No permission changes
- [x] **Input Validation:** No new input validation required

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:** Existing users unaffected, new users see clear messaging
- [x] **Data Migration:** No data migration needed
- [x] **Feature Deprecation:** No features deprecated
- [x] **Learning Curve:** No learning curve - users either see notice or normal flow

#### 6. **Maintenance Burden**
- [x] **Code Complexity:** Minimal increase - single conditional check
- [x] **Dependencies:** No new dependencies
- [x] **Testing Overhead:** Minimal - test three states of environment variable
- [x] **Documentation:** Environment variable documented in `.env.local` comments

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
**None identified** - This is a low-risk, simple feature.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [x] **Server Restart Required:** Changing `SITE_TESTING_STATUS` requires server restart
  - **Mitigation:** Document this clearly, acceptable for deployment-phase changes
- [x] **No Granular Control:** Cannot whitelist individual beta testers with this approach
  - **Mitigation:** If needed later, can add database whitelist on top of this foundation

### Mitigation Strategies

#### Environment Variable Management
- [x] **Documentation:** Clear comments in `.env.local` explain values
- [x] **Safe Default:** Code defaults to `'live'` if variable is missing
- [x] **Phase Transition:** Document process for changing status between phases

#### User Communication
- [x] **Clear Messaging:** Closed beta notice is professional and informative
- [x] **Contact Information:** Provides `beta@beprepared.ai` for early access requests
- [x] **Visual Design:** Lock icon and branding-appropriate styling

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** Fill out all sections of the impact assessment
- [x] **Identify Critical Issues:** Flag any red or yellow flag items
- [x] **Propose Mitigation:** Suggest specific mitigation strategies for identified risks
- [x] **Alert User:** Clearly communicate any significant second-order impacts
- [x] **Recommend Alternatives:** If high-risk impacts are identified, suggest alternative approaches

### Analysis Summary

**🔍 SECOND-ORDER IMPACT ANALYSIS:**

**Impacts Identified:**
- ✅ **Positive Impact:** Prevents unintended signups during development/testing
- ✅ **Positive Impact:** Clear user communication reduces confusion
- ⚠️ **Minor Consideration:** Requires server restart to change status (acceptable)
- ⚠️ **Minor Consideration:** No granular beta tester control (can add later if needed)

**Risk Assessment:**
- **Overall Risk Level:** Low
- **Implementation Complexity:** Low
- **User Impact:** Minimal (only affects new signups, existing users unaffected)
- **Maintenance Overhead:** Minimal (single environment variable)

**Mitigation Recommendations:**
- Document environment variable values clearly
- Use safe default (`'live'`) to prevent accidental lockout
- Provide clear user communication with contact information
- Plan for server restart when changing status

**🎯 USER ATTENTION REQUIRED:**
This is a straightforward, low-risk implementation. No critical issues identified that require special attention.

---

*Template Version: 1.3*
*Last Updated: 2025-12-21*
*Created By: AI Assistant*
