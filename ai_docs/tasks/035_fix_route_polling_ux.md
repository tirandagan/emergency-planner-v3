# Bug Triage & Fix: Route Polling UX Issue

> **Goal:** Fix route polling to properly display "Generating..." → "Ready" transition without requiring page refresh

---

## 🚨 STEP 1: Critical Info (REQUIRED)

**What's the actual error?**
- **Error message:** No error shown, but routes don't appear after generation completes
- **When it happens:** During route generation after user hovers/clicks Map & Routes tab
- **Where you see it:** Map & Routes tab shows "No Evacuation Routes Available" even after routes are saved to database
- **Browser/Environment:** Development environment, observed in terminal logs

**Can you reproduce it?**
- [x] Always happens
- [ ] Sometimes happens
- [ ] Only under specific conditions: [describe]

**User Experience Flow:**
1. User generates report with routes
2. User hovers/clicks Map & Routes tab
3. "Generating..." badge appears initially ✅
4. Geocoding completes successfully (all 11/11 waypoints geocoded) ✅
5. Routes saved to database successfully ✅
6. **BUG**: "Generating..." label disappears
7. **BUG**: Map tab shows "No Evacuation Routes Available"
8. **BUG**: User must refresh page + hover tab again to see "Ready" badge

**Terminal Evidence:**
```
✅ Geocoded "Watchung Reservation Loop Area, 452 New Providence Rd, Mountainside, NJ"
   → 40.6816634, -74.3811346
   → Matched: Watchung Reservation, Historic Trail, Mountainside, NJ 07092, USA

📊 Geocoding batch complete:
   ✅ Successful: 3/3

[DB] 💾 Updating report with routes: { reportId: '1a410691-4d94-4662-913f-d393834790c9', routeCount: 3 }
[DB] ✅ Database update successful: { reportId: '1a410691-4d94-4662-913f-d393834790c9', updated: true }
✅ Saved 3 routes to database

[BG-TASKS] ✅ Routes generated successfully, count: 3
```

Routes are successfully saved, but polling doesn't detect them until page refresh.

---

## ⚡ STEP 2: Quick Assessment

Based on error message, this looks like:
- [ ] **Simple Fix** (typo, syntax, obvious one-liner)
- [ ] **Missing File/Import** (404, import errors, file not found)
- [ ] **Type/Interface Issue** (TypeScript errors, wrong data types)
- [ ] **Environment/Config** (API keys, database, environment variables)
- [x] **Complex System Issue** (requires deeper investigation)

**Issue Category:** Polling mechanism / State management / Real-time updates

---

## 🔍 DEEP INVESTIGATION

### Step A: Systematic Codebase Exploration

**Files Involved:**
1. `src/hooks/useRoutePolling.ts` - Polling hook that checks route status
2. `src/components/plans/plan-details/PlanDetailsTabs.tsx` - Component using the hook
3. `src/app/api/mission-reports/[id]/routes/route.ts` - API endpoint being polled
4. `src/lib/mission-generation/background-tasks.ts` - Database query function

**Current Polling Logic:**
```typescript
// useRoutePolling.ts (lines 40-75)
const checkRouteStatus = async () => {
  try {
    const response = await fetch(`/api/mission-reports/${reportId}/routes`);
    const data = await response.json();

    if (data.ready) {
      setRoutes(data.routes ?? []);
      setIsLoading(false);
      return true; // Stop polling
    }

    pollCount++;
    if (pollCount >= maxPolls) {
      setError('Route generation is taking longer than expected. Please refresh the page.');
      setIsLoading(false);
      return true; // Stop polling
    }

    return false; // Continue polling
  } catch (err) {
    console.error('Error polling route status:', err);
    setError(err instanceof Error ? err.message : 'Failed to check route status');
    setIsLoading(false);
    return true; // Stop polling on error
  }
};
```

**Polling Configuration:**
- Interval: 2 seconds
- Max polls: 10 (20 seconds total)
- Starts immediately when enabled

### Step B: Root Cause Analysis

**📍 Suspected Issues:**

**Issue 1: Timing/Race Condition**
- Background task saves routes to database at time T
- Polling might check at time T-0.1s (before commit) or T+0.1s (after commit)
- If database transaction hasn't committed, polling gets `ready: false`
- Polling might timeout (20s) before next check succeeds

**Issue 2: API Response Caching**
- Next.js might be caching API responses
- Polling gets stale data (routes not ready) even after database update
- No cache-control headers preventing caching

**Issue 3: Database Query Issue**
- `checkRoutesStatus` might be querying incorrectly
- Transaction isolation level might prevent reading uncommitted data
- Drizzle ORM query might have caching

**Issue 4: State Management**
- Hook updates `routes` state correctly
- But parent component (`PlanDetailsTabs`) might not re-render
- Or `finalRoutes` calculation has issues

**🔄 Complete Flow Analysis:**
```
[Background Task] → [Save to DB] → [Polling checks] → [Should update UI]
                         ↓              ↓                     ↓
                   [Transaction]  [Query returns]      [State update]
                   [commits]      [ready: true]        [re-render]
                         ↓              ↓                     ↓
                   [Success ✅]   [Data: ???]          [Shows: "No routes"]
```

**🚨 Discrepancy Analysis:**
- **Expected:** Polling detects routes → Updates state → Shows "Ready" badge + routes
- **Actual:** Polling completes → State unclear → Shows "No routes" → Requires page refresh
- **Break Point:** Either polling doesn't get routes OR state update doesn't trigger re-render
- **Root Cause:** TBD - need to add logging to polling to see actual API responses

### Step C: Proposed Solutions

#### Option 1: Add Comprehensive Logging to Polling
**What:** Add detailed console logging to understand what's happening
**How:**
1. Log every polling attempt with timestamp
2. Log full API response (not just ready status)
3. Log state updates (before/after)
4. Log component re-renders

**Scope:** Simple - add logging only
**Pros:** ✅ Will reveal actual root cause
**Cons:** ❌ Doesn't fix the issue, just diagnoses it
**Risk:** Low
**Engineering Quality:** Diagnostic step, necessary for proper fix

#### Option 2: Add Cache-Control Headers to API Endpoint
**What:** Prevent Next.js from caching polling API responses
**How:**
```typescript
// route.ts
return NextResponse.json(
  { ready: status.ready, routes: status.routes ?? [] },
  {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }
);
```

**Scope:** Simple - 5-line fix
**Pros:** ✅ Prevents caching issues, common polling problem
**Cons:** ❌ Might not be the actual issue
**Risk:** Low
**Engineering Quality:** Best practice for polling endpoints

#### Option 3: Add Delay After Database Save
**What:** Add small delay between database save and marking routes as ready
**How:** Add 500ms delay after database update in background task
**Scope:** Simple - 1-line fix
**Pros:** ✅ Ensures database transaction fully commits before polling can detect
**Cons:** ❌ Band-aid solution, doesn't address root cause
**Risk:** Medium - artificial delays are code smell
**Engineering Quality:** Poor - masks underlying issue

#### Option 4: Optimize Polling Strategy
**What:** Improve polling mechanism with better error handling and logging
**How:**
1. Add exponential backoff (2s → 4s → 8s intervals)
2. Extend max polling time to 60 seconds
3. Add real-time logging of polling state
4. Show intermediate states to user ("Checking routes...")

**Scope:** Moderate - modify polling hook
**Pros:** ✅ More robust polling, better UX feedback
**Cons:** ❌ Doesn't address root cause if it's not timing-related
**Risk:** Low - improves existing code
**Engineering Quality:** Good - follows polling best practices

#### Option 5: Implement Server-Sent Events (SSE)
**What:** Replace polling with real-time push updates
**How:** Use SSE or WebSockets to push route completion to client
**Scope:** Complex - requires new infrastructure
**Pros:** ✅ Real-time updates, no polling overhead, better UX
**Cons:** ❌ Significant implementation time, architectural change
**Risk:** High - new technology, requires testing
**Engineering Quality:** Excellent - modern real-time architecture

### Step D: Recommended Implementation Strategy

**🎯 RECOMMENDED:** Multi-phase approach

**Phase 1: Diagnostic (Required First)**
- **Action:** Implement Option 1 (Add Comprehensive Logging)
- **Why:** Must understand actual root cause before fixing
- **Time:** 10 minutes
- **Output:** Clear understanding of where polling fails

**Phase 2: Quick Wins (While Investigating)**
- **Action:** Implement Option 2 (Cache-Control Headers)
- **Why:** Common issue, low risk, best practice
- **Time:** 5 minutes
- **Expected Impact:** May fix issue if caching is the problem

**Phase 3: Root Cause Fix (After Diagnosis)**
- **Action:** Depends on Phase 1 findings
- **Options:**
  - If timing issue: Extend polling duration, add retry logic
  - If caching issue: Already fixed in Phase 2
  - If query issue: Fix database query in `checkRoutesStatus`
  - If state issue: Fix state management in `PlanDetailsTabs`

**Phase 4: UX Improvements (Post-Fix)**
- **Action:** Add better loading states and user feedback
- **Examples:**
  - Show "Geocoding waypoints..." during geocoding
  - Show "Finalizing routes..." after geocoding
  - Show estimated time remaining
  - Add progress indicators

---

## 📋 Implementation Plan

### Phase 1: Add Diagnostic Logging ⏳ PENDING

**Goal:** Understand exactly what's happening during polling

- [ ] **Task 1.1:** Add detailed logging to useRoutePolling hook
  - Files: `src/hooks/useRoutePolling.ts`
  - Details: Log every poll attempt, API response, state changes

- [ ] **Task 1.2:** Add logging to API endpoint
  - Files: `src/app/api/mission-reports/[id]/routes/route.ts`
  - Details: Log when endpoint is called, what data is returned

- [ ] **Task 1.3:** Add logging to database query
  - Files: `src/lib/mission-generation/background-tasks.ts`
  - Details: Log query execution and results in `checkRoutesStatus`

### Phase 2: Add Cache-Control Headers ⏳ PENDING

**Goal:** Prevent API response caching

- [ ] **Task 2.1:** Add no-cache headers to routes API endpoint
  - Files: `src/app/api/mission-reports/[id]/routes/route.ts`
  - Details: Add Cache-Control, Pragma, Expires headers

### Phase 3: Test and Diagnose ⏳ PENDING

**Goal:** Generate new report and analyze logs

- [ ] **Task 3.1:** User generates new report with routes
  - Details: Observe polling behavior with new logging

- [ ] **Task 3.2:** Analyze diagnostic logs
  - Details: Identify exact point of failure in polling flow

- [ ] **Task 3.3:** Determine root cause fix
  - Details: Based on logs, decide on appropriate fix from options above

### Phase 4: Implement Root Cause Fix ⏳ PENDING

**Goal:** Fix the actual underlying issue

- [ ] **Task 4.1:** TBD based on Phase 3 findings
  - Files: TBD
  - Details: TBD

### Phase 5: UX Improvements ⏳ PENDING

**Goal:** Better user feedback during route generation

- [ ] **Task 5.1:** Add intermediate loading states
  - Files: `src/components/plans/plan-details/MapTab.tsx`
  - Details: Show geocoding progress, route finalization

- [ ] **Task 5.2:** Add progress indicators
  - Files: `src/components/plans/plan-details/PlanDetailsTabs.tsx`
  - Details: Show estimated time, current stage

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Implement Phase 1 & 2** (diagnostic logging + cache headers)
2. **User generates new report** to test with enhanced logging
3. **Analyze logs** to identify root cause
4. **Implement targeted fix** based on findings

**Status:** Ready to proceed with Phase 1 implementation

---

## 📝 Related Issues

- Enhanced logging already added to geocoding (✅ Complete)
- "Generating..." badge fix already implemented (✅ Complete)
- This task focuses specifically on polling and route loading UX

---

**Created:** 2025-12-12
**Status:** Investigation Required
**Priority:** High (Poor UX - requires page refresh)
