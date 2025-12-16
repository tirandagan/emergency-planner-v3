# AI Task Template

## 1. Task Overview

### Task Title
**Title:** Map & Routes Tab with Background Route Generation

### Goal Statement
**Goal:** Implement an interactive Map tab in the plan details page that displays AI-generated evacuation routes on a Google Map. Routes are generated as a background task after the main report is saved, with polling to detect when routes are ready. This completes the deferred "Map & Routes tab" from Phase 4.5.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The current V2 implementation has route generation infrastructure in place (`evacuation-routes.ts`, `background-tasks.ts`, API endpoint) but lacks:
1. A UI to display the map and routes
2. A trigger to kick off background route generation after report save
3. Client-side polling to detect when routes are ready
4. The Map tab in `PlanDetailsTabs`

V1 had a working implementation using `@react-google-maps/api` with Google Directions Service to render actual road paths. We need to port this approach to V2 while integrating with the existing background task infrastructure.

### Solution Options Analysis

#### Option 1: Synchronous Route Generation (During Streaming)
**Approach:** Generate routes inline during the streaming report generation, before saving.

**Pros:**
- ✅ Routes available immediately when report loads
- ✅ Simpler architecture - no polling needed
- ✅ Single API call (routes in prompt)

**Cons:**
- ❌ Adds 5-10 seconds to streaming time
- ❌ Routes block user from reading report
- ❌ Requires changes to mega-prompt and streaming architecture
- ❌ Wastes API calls for BUG_IN scenarios that don't need routes

**Implementation Complexity:** Medium - prompt/streaming changes
**Risk Level:** Medium - affects core streaming experience

#### Option 2: Background Generation with Polling (Recommended)
**Approach:** Trigger route generation after report save, poll for completion, display in Map tab.

**Pros:**
- ✅ Infrastructure already exists (Task 021 created it)
- ✅ User can read report while routes generate
- ✅ Only generates routes when needed (BUG_OUT scenarios)
- ✅ Clean separation of concerns
- ✅ Graceful handling if generation fails

**Cons:**
- ❌ Requires polling logic on client
- ❌ User sees "Loading routes..." initially
- ❌ Slightly more complex state management

**Implementation Complexity:** Low - mostly UI work
**Risk Level:** Low - uses existing infrastructure

#### Option 3: On-Demand Route Generation
**Approach:** Generate routes only when user clicks the Map tab for the first time.

**Pros:**
- ✅ No wasted generation for users who don't view Map tab
- ✅ Simpler initial page load

**Cons:**
- ❌ User waits when they click Map tab
- ❌ Poor UX - unexpected loading state
- ❌ Can't pre-generate routes in background

**Implementation Complexity:** Low
**Risk Level:** Medium - UX concerns

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 2 - Background Generation with Polling

**Why this is the best choice:**
1. **Infrastructure Ready** - Task 021 already created `executeBackgroundTasks()`, `checkRoutesStatus()`, and the polling API endpoint
2. **Best UX** - User reads report while routes generate in background
3. **Efficient** - Only generates routes for scenarios that need them (nuclear, natural-disaster, civil-unrest)
4. **Graceful Degradation** - Map tab can show "No routes generated for shelter-in-place scenarios"

**Key Decision Factors:**
- **Performance Impact:** Zero impact on streaming - routes generate after save
- **User Experience:** User sees report immediately, routes appear within 10-15 seconds
- **Maintainability:** Uses existing infrastructure, clean separation
- **Scalability:** Background tasks can be expanded for future features

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS
- **Maps:** Google Maps JavaScript API via `@react-google-maps/api` (to be added)
- **AI:** OpenRouter with Gemini 2.0 Flash for route generation
- **Key Architectural Patterns:** Next.js App Router, Server Components, Server Actions

### Current State
**What exists (from Task 021):**
- `src/lib/mission-generation/evacuation-routes.ts` - Route generation logic ✅
- `src/lib/mission-generation/background-tasks.ts` - Task orchestration ✅
- `src/app/api/mission-reports/[id]/routes/route.ts` - Polling endpoint ✅
- `src/types/mission-report.ts` - `EvacuationRoute` type defined ✅
- `ReportDataV2.evacuationRoutes` - Field exists in report structure ✅

**What's missing:**
- Map tab component in `PlanDetailsTabs`
- `MapComponent.tsx` for Google Maps display
- `RouteCard.tsx` for route list display
- Trigger to call `executeBackgroundTasks()` after report save
- Client-side polling hook for route status
- Google Maps library installation and configuration

### Existing Context Providers Analysis
- **UserContext (`useUser()`):** User authentication available
- **No specific map context needed** - routes come from report data

---

## 4. Context & Problem Definition

### Problem Statement
Users who create Bug-Out plans (evacuation scenarios) need to see evacuation routes on an interactive map. The current implementation generates routes in the background but has no UI to display them. Without visual route display, the emergency planning experience is incomplete.

### Success Criteria
- [x] Map tab appears in `PlanDetailsTabs` for V2 reports
- [ ] Google Map renders with custom dark styling
- [ ] Evacuation routes display as polylines on the map
- [ ] Route waypoints show as markers with info windows
- [ ] Routes are color-coded by priority/danger level
- [ ] Background route generation triggers after report save
- [ ] Polling detects when routes are ready (≤15 seconds)
- [ ] Graceful fallback for BUG_IN scenarios ("No evacuation routes needed")
- [ ] Mobile-responsive map display

---

## 5. Development Mode Context
- **New application** - breaking changes acceptable
- **No backward compatibility concerns** - V1 map code is reference only
- **Data can be migrated** - existing reports without routes will show fallback
- **Speed and simplicity prioritized** over feature parity with V1

---

## 6. Technical Requirements

### Functional Requirements
- User can view Map tab in plan details
- Map shows evacuation routes with waypoints
- Routes render as actual road paths via Directions API
- User can click routes to highlight them
- Route cards show description, distance, hazards
- Routes are generated automatically for BUG_OUT scenarios
- Poll until routes are ready or timeout (20s)

### Non-Functional Requirements
- **Performance:** Map loads within 2 seconds after tab click
- **Security:** Routes only visible to report owner
- **Usability:** Clear loading states, error messages
- **Responsive Design:** Map usable on mobile (320px+)
- **Theme Support:** Dark mode map styling

### Technical Constraints
- Must use existing `@react-google-maps/api` library
- Must integrate with existing background task infrastructure
- Must not modify streaming architecture (routes are post-save)

---

## 7. Data & Database Changes

### Database Schema Changes
No schema changes required - `evacuationRoutes` already stored in `report_data` JSONB field.

### Data Model Updates
No changes needed - `EvacuationRoute` type already defined:
```typescript
export interface EvacuationRoute {
  name: string;
  description: string;
  distance: string;
  estimatedTime: string;
  waypoints: RouteWaypoint[];
  hazards: string[];
}
```

### Data Migration Plan
None required - existing reports without routes will show graceful fallback.

---

## 8. API & Backend Changes

### Data Access Pattern

#### MUTATIONS (Server Actions)
- [ ] **Modify `saveMissionReportFromStream`** - Trigger background tasks after save

#### QUERIES (Data Fetching)
- [ ] **Use existing `/api/mission-reports/[id]/routes`** - Polling endpoint already exists

### External Integrations
- **Google Maps JavaScript API** - Already configured via `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY`
- **Google Directions API** - For rendering actual road paths

---

## 9. Frontend Changes

### New Components
- [ ] **`components/plans/plan-details/MapTab.tsx`** - Container for map and route list
- [ ] **`components/plans/MapComponent.tsx`** - Google Maps wrapper with routes
- [ ] **`components/plans/RouteCard.tsx`** - Individual route display card
- [ ] **`hooks/useRoutePolling.ts`** - Client hook for polling route status

### Page Updates
- [ ] **`PlanDetailsTabs.tsx`** - Add Map tab
- [ ] **`save-mission-report.ts`** - Trigger background tasks after save

### State Management
- Map tab uses local component state for selected route
- Polling hook manages route loading state
- No global state needed

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**`src/app/actions/save-mission-report.ts`:**
```typescript
// Currently just saves and returns
const { reportId } = await saveMissionReportV2({
  userId: user.id,
  reportData,
  userTier: 'FREE',
});

return { success: true, reportId };
```

**`src/components/plans/plan-details/PlanDetailsTabs.tsx`:**
```typescript
// Current tabs - no Map tab
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'bundles', label: 'Bundles' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'skills', label: 'Skills' },
];
```

### 📂 **After Implementation**

**`src/app/actions/save-mission-report.ts`:**
```typescript
// After save, trigger background tasks
const { reportId } = await saveMissionReportV2({ ... });

// Trigger background route generation (fire and forget)
executeBackgroundTasks({
  reportId,
  location: formData.location,
  scenarios: formData.scenarios,
  mobility: 'BUG_IN', // Or from formData when wizard supports it
}).catch(console.error);

return { success: true, reportId };
```

**`src/components/plans/plan-details/PlanDetailsTabs.tsx`:**
```typescript
// Add Map tab
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'bundles', label: 'Bundles' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'skills', label: 'Skills' },
  { id: 'map', label: 'Map & Routes' }, // New
];
```

**New `src/components/plans/plan-details/MapTab.tsx`:**
```typescript
'use client';

import { useRoutePolling } from '@/hooks/useRoutePolling';
import { MapComponent } from '@/components/plans/MapComponent';
import { RouteCard } from '@/components/plans/RouteCard';
import type { EvacuationRoute } from '@/types/mission-report';

interface MapTabProps {
  reportId: string;
  initialRoutes?: EvacuationRoute[];
  scenarios: string[];
}

export function MapTab({ reportId, initialRoutes, scenarios }: MapTabProps) {
  const { routes, isLoading, error } = useRoutePolling(reportId, initialRoutes);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // If BUG_IN scenario, show message
  if (!shouldShowRoutes(scenarios)) {
    return <NoRoutesMessage />;
  }

  // Loading state
  if (isLoading && !routes.length) {
    return <LoadingRoutes />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <MapComponent routes={routes} selectedRoute={selectedRoute} />
      </div>
      <div className="space-y-4">
        {routes.map(route => (
          <RouteCard
            key={route.name}
            route={route}
            isSelected={selectedRoute === route.name}
            onSelect={() => setSelectedRoute(route.name)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 🎯 **Key Changes Summary**
- [ ] **Change 1:** Add Map tab to `PlanDetailsTabs` with conditional rendering for V2 reports
- [ ] **Change 2:** Create `MapComponent` using `@react-google-maps/api` with Directions Service
- [ ] **Change 3:** Create `RouteCard` for route list display with expand/collapse
- [ ] **Change 4:** Create `useRoutePolling` hook for client-side route status polling
- [ ] **Change 5:** Modify `saveMissionReportFromStream` to trigger background tasks
- [ ] **Files Modified:** ~6 files
- [ ] **Impact:** Users with BUG_OUT scenarios see evacuation routes on an interactive map

---

## 11. Implementation Plan

### Phase 1: Package Installation & Configuration
**Goal:** Install Google Maps library and verify API key works

- [ ] **Task 1.1:** Install `@react-google-maps/api` package
  - Command: `npm install @react-google-maps/api`
  - Details: React wrapper for Google Maps JavaScript API

- [ ] **Task 1.2:** Verify Google Maps API key configuration
  - Files: `.env.local`
  - Details: Confirm `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY` has Maps JavaScript API and Directions API enabled

### Phase 2: Core Map Components
**Goal:** Create the map display infrastructure

- [ ] **Task 2.1:** Create `MapComponent.tsx`
  - Files: `src/components/plans/MapComponent.tsx`
  - Details:
    - Google Maps wrapper with dark theme styling
    - Accept routes as prop
    - Render DirectionsRenderer for each route
    - Custom markers for start/end points
    - Info windows on marker click
    - Highlight active route

- [ ] **Task 2.2:** Create `RouteCard.tsx`
  - Files: `src/components/plans/RouteCard.tsx`
  - Details:
    - Collapsible card for each route
    - Show name, description, distance, estimated time
    - Hazards list with warning icons
    - Danger level color coding (if applicable)
    - Click to select/highlight on map

- [ ] **Task 2.3:** Create `useRoutePolling` hook
  - Files: `src/hooks/useRoutePolling.ts`
  - Details:
    - Poll `/api/mission-reports/[id]/routes` every 2 seconds
    - Stop polling when routes are ready or after 20 seconds
    - Return routes, isLoading, error states

### Phase 3: Map Tab Integration
**Goal:** Add Map tab to plan details page

- [ ] **Task 3.1:** Create `MapTab.tsx`
  - Files: `src/components/plans/plan-details/MapTab.tsx`
  - Details:
    - Container component for map and route list
    - Two-column layout (map 2/3, routes 1/3)
    - Handle loading, error, no-routes states
    - Determine if routes should be shown based on scenarios

- [ ] **Task 3.2:** Update `PlanDetailsTabs.tsx`
  - Files: `src/components/plans/plan-details/PlanDetailsTabs.tsx`
  - Details:
    - Add "Map & Routes" tab
    - Pass reportId and scenarios to MapTab
    - Only show for V2 reports with Bug-Out scenarios

### Phase 4: Background Task Trigger
**Goal:** Wire up background route generation after report save

- [ ] **Task 4.1:** Modify `saveMissionReportFromStream`
  - Files: `src/app/actions/save-mission-report.ts`
  - Details:
    - After successful save, call `executeBackgroundTasks()`
    - Fire and forget (don't block response)
    - Pass reportId, location, scenarios

- [ ] **Task 4.2:** Verify background task execution
  - Details:
    - Test that routes appear in database after ~10 seconds
    - Verify polling endpoint returns routes

### Phase 5: Testing & Polish
**Goal:** Verify everything works end-to-end

- [ ] **Task 5.1:** Test route generation flow
  - Details:
    - Create new plan with evacuation scenarios
    - Verify routes generate in background
    - Verify Map tab displays routes correctly

- [ ] **Task 5.2:** Test BUG_IN fallback
  - Details:
    - Create plan with shelter-in-place scenario
    - Verify Map tab shows "No evacuation routes needed"

- [ ] **Task 5.3:** Test mobile responsiveness
  - Details:
    - Verify map is usable on mobile devices
    - Route cards stack on small screens

- [ ] **Task 5.4:** Run linting and type-checking
  - Commands: `npm run lint`, `npx tsc --noEmit`
  - Details: Ensure all new files pass

---

## 12. Task Completion Tracking

**🗓️ Implementation Start Date:** [To be filled]
**🗓️ Implementation Completed:** [To be filled]

---

## 13. File Structure & Organization

### New Files to Create
```
src/
├── components/
│   └── plans/
│       ├── MapComponent.tsx          # Google Maps wrapper
│       ├── RouteCard.tsx             # Route display card
│       └── plan-details/
│           └── MapTab.tsx            # Map tab container
└── hooks/
    └── useRoutePolling.ts            # Client polling hook
```

### Files to Modify
- [ ] **`src/components/plans/plan-details/PlanDetailsTabs.tsx`** - Add Map tab
- [ ] **`src/app/actions/save-mission-report.ts`** - Trigger background tasks

### Dependencies to Add
```json
{
  "dependencies": {
    "@react-google-maps/api": "^2.20.3"
  }
}
```

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Route generation timeout** - Background task times out after 20 seconds
  - **Code Review Focus:** `executeBackgroundTasks` timeout handling
  - **Potential Fix:** Show "Routes unavailable" message, allow manual retry

- [ ] **Invalid waypoint coordinates** - AI generates bad lat/lng
  - **Code Review Focus:** `generateEvacuationRoutes` validation
  - **Potential Fix:** Validate coordinates, fallback to default routes

### Edge Cases to Consider
- [ ] **User navigates away during generation** - Routes still save to DB
  - **Analysis:** Fine - routes will be there on next visit

- [ ] **Google Directions API quota exceeded**
  - **Analysis:** Graceful degradation - show waypoints without road paths

### Security & Access Control Review
- [ ] **Route ownership:** Routes only accessible by report owner (existing check in API)
- [ ] **API key exposure:** Using NEXT_PUBLIC key, ensure domain restrictions set in Google Console

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# Already configured - verify these are enabled in Google Cloud Console:
# - Maps JavaScript API
# - Directions API
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=your_key_here
```

---

## 16. AI Agent Instructions

### Implementation Approach
1. **EVALUATE:** This is a straightforward implementation using existing infrastructure
2. **NO STRATEGIC ANALYSIS NEEDED:** Option 2 (background + polling) is clearly the right approach
3. **CREATE TASK DOCUMENT:** ✅ Done
4. **AWAIT USER APPROVAL:** Present options A/B/C before implementing

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Use early returns for clean code
- [ ] Add proper error handling
- [ ] Ensure responsive design (mobile-first)
- [ ] Test in both light and dark mode

---

## 17. Notes & Additional Context

### Reference Implementation
The v1 `MapComponent.tsx` provides a working reference for:
- Google Maps dark theme styling
- DirectionsService for route rendering
- Custom markers with info windows
- Route highlighting on selection

Key patterns to port:
- Load map with `@react-google-maps/api` `GoogleMap` component
- Use `DirectionsService` to compute routes between waypoints
- Use `DirectionsRenderer` with custom polyline options
- Fit bounds to show all route waypoints

### V1 vs V2 Differences
| Feature | V1 | V2 |
|---------|----|----|
| Route Generation | Inline during plan generation | Background task after save |
| Route Types | vehicle/foot with dangerLevel | Generic routes with hazards |
| Map Library | @react-google-maps/api | Same |
| Trigger | Automatic | After save via executeBackgroundTasks |

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment

#### Breaking Changes Analysis
- [ ] **Existing API Contracts:** None - new feature only
- [ ] **Database Dependencies:** None - uses existing JSONB field
- [ ] **Component Dependencies:** Minor change to PlanDetailsTabs

#### Performance Implications
- [ ] **Bundle Size:** +50-100KB for Google Maps library
- [ ] **API Calls:** Google Directions API calls per route render
- [ ] **Server Load:** Background tasks run after save (existing infrastructure)

#### Security Considerations
- [ ] **API Key:** Already protected by domain restrictions
- [ ] **Route Ownership:** Verified in existing API endpoint

### Mitigation Strategies
- Use lazy loading for map component to reduce initial bundle
- Cache Directions API results in component state
- Implement retry logic for failed route generations

---

*Template Version: 1.4*
*Task Created: 2025-12-11*
*Phase: 4.5 Plan Details - Map & Routes Tab*
*Status: 📋 READY FOR REVIEW*
