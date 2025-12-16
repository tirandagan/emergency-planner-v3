# Task 025: Map & Escape Routes UI with Streaming Background Generation

## 1. Task Overview

### Task Title
**Title:** Implement Map & Escape Routes Tab with Background Generation and Progressive Enhancement

### Goal Statement
**Goal:** Create a visually striking Google Maps interface displaying AI-generated evacuation routes that begins generating in the background as soon as the user views the plan details page. The tab starts dim/disabled with a loading indicator, continues generating even if the user navigates away, and becomes fully enabled when routes are ready. This provides a seamless, non-blocking user experience while leveraging the existing background task infrastructure from Task 021.

---

## 2. Strategic Analysis & Solution Options

### Problem Context

The Map & Routes tab was deferred in Task 021 after implementing the background generation infrastructure. We now need to implement the UI layer with these requirements:

1. **Background Generation**: Routes must generate asynchronously without blocking the user
2. **Progressive Enhancement**: Tab starts disabled, becomes enabled when ready
3. **Visual Excellence**: Striking map design matching v1's tactical/military aesthetic
4. **Persistence**: Generation continues even if user navigates away
5. **Polling Architecture**: Client polls for route readiness via existing API

### Solution Options Analysis

#### Option 1: Optimistic UI with Skeleton Loading
**Approach:** Show the Map tab immediately with skeleton UI, poll for routes, display when ready

**Pros:**
- ✅ Familiar UX pattern - users expect loading states
- ✅ Tab is always visible and clickable
- ✅ Clear visual feedback with skeleton loaders
- ✅ Matches existing streaming report UX patterns

**Cons:**
- ❌ User might click into empty tab before routes ready
- ❌ Requires more complex skeleton design for map area
- ❌ Could feel "incomplete" if generation takes long

**Implementation Complexity:** Medium - Requires skeleton UI design and state management
**Risk Level:** Low - Well-established UX pattern

#### Option 2: Disabled Tab with Badge Indicator (RECOMMENDED)
**Approach:** Tab starts disabled with "Generating..." badge, becomes enabled when routes complete, shows notification

**Pros:**
- ✅ Clear communication - user knows routes are being prepared
- ✅ No "empty state" confusion - tab disabled until ready
- ✅ Visual notification when routes complete (badge color change)
- ✅ Matches v1 tactical/military aesthetic (mission prep → mission ready)
- ✅ Simple implementation - just enable/disable tab state
- ✅ Background generation fully non-blocking

**Cons:**
- ❌ User cannot interact with map until ready
- ❌ If generation fails, user sees no map at all (needs error handling)

**Implementation Complexity:** Low - Simple tab state toggling with badge
**Risk Level:** Low - Existing background task infrastructure handles generation

#### Option 3: Hybrid - Enabled Tab with "Generating Routes" Message
**Approach:** Tab is always enabled, shows map with "Routes generating..." overlay, updates when ready

**Pros:**
- ✅ User can see map immediately (even without routes)
- ✅ Can display user's location pin while waiting
- ✅ Progressive disclosure - map first, then routes overlay

**Cons:**
- ❌ More complex state management (map loaded, routes pending)
- ❌ Two loading phases (map loads, then routes load)
- ❌ Could be confusing why map shows but no routes

**Implementation Complexity:** High - Two-phase loading, overlay management
**Risk Level:** Medium - More moving parts, potential UX confusion

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 2 - Disabled Tab with Badge Indicator

**Why this is the best choice:**

1. **Clear User Communication** - Badge immediately shows "Generating Routes..." status, no ambiguity about why tab is disabled
2. **Matches Existing Patterns** - Streaming report already shows progressive generation, this extends that UX
3. **Non-Blocking UX** - User can explore other tabs (Overview, Details, Skills, Simulation) while routes generate
4. **Simple Implementation** - Just toggle tab disabled state and badge text/color when routes ready
5. **Tactical Aesthetic** - "Mission prep → Mission ready" progression fits the preparedness theme

**Key Decision Factors:**

- **Performance Impact:** Background generation already implemented, no additional server load
- **User Experience:** Clear status indication without blocking other functionality
- **Maintainability:** Simple state management, easy to debug and extend
- **Scalability:** Pattern can extend to other background tasks (weather data, skill matching)
- **Security:** Uses existing auth middleware and ownership checks from Task 021

**Alternative Consideration:**

Option 1 (Optimistic UI) would be preferred if route generation was guaranteed to be very fast (<2 seconds), but since we're dealing with AI generation that could take 10-20 seconds, a disabled state with clear messaging is more honest and less jarring than showing skeleton loaders for an extended period.

### Decision Request

**👤 USER DECISION REQUIRED:**

Based on this analysis, do you want to proceed with the recommended solution (Option 2 - Disabled Tab with Badge), or would you prefer a different approach?

**Questions for you to consider:**
- Do you want users to see the map immediately even without routes (Option 3)?
- Is showing skeleton loaders for 10-20 seconds acceptable (Option 1)?
- Does the "mission prep → mission ready" UX align with your vision?

**Next Steps:**

Once you approve the strategic direction, I'll update the implementation plan with detailed code changes and present you with implementation options.

---

## 3. Project Analysis & Current State

### Technology & Architecture

- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS for styling
- **Authentication:** Supabase Auth managed by `middleware.ts` for protected routes
- **Key Architectural Patterns:**
  - Next.js App Router with Server Components for data fetching
  - Server Actions for mutations
  - Background task orchestration via `executeBackgroundTasks()`
  - Client-side polling for async task completion
- **Relevant Existing Components:**
  - `src/components/plans/plan-details/PlanDetailsTabs.tsx` - Tab navigation container
  - `src/lib/mission-generation/background-tasks.ts` - Background task orchestration
  - `src/lib/mission-generation/evacuation-routes.ts` - Route generation logic (now uses prompt templates)
  - `src/app/api/mission-reports/[id]/routes/route.ts` - Route polling endpoint

### Current State

**Task 021 Implementation (70% Complete):**

✅ **Completed:**
- Background task orchestration infrastructure (`executeBackgroundTasks()`)
- Route generation logic using AI (Gemini 2.0 Flash)
- Route polling API endpoint (`/api/mission-reports/[id]/routes`)
- Database schema supports `evacuationRoutes` field in `reportData`
- Prompt externalization system (completed in current session)

❌ **Missing:**
- Map & Routes tab UI implementation
- Client-side polling hook for route readiness
- Google Maps integration
- Route visualization components
- Tab enable/disable logic based on route status

**V1 Analysis Findings:**

From emergency-planner-v1, we have proven patterns for:
- `@react-google-maps/api` integration (v2.20.7)
- Google Directions Service for street-level routing
- Dark theme map styling (tactical aesthetic)
- 5-color route visualization (amber, green, blue, red, purple)
- Custom markers with route numbers
- Route type distinction (vehicle vs. foot routes)

### Existing Context Providers Analysis

**No additional context providers needed** - This feature uses existing auth context from layout.

- **UserContext (`useUser()`):** Available throughout `/plans` routes, provides authentication state
- **Context Hierarchy:** `app/(protected)/layout.tsx` → `AuthContext` → plan pages
- **Available Context Hooks:** `useUser()` for auth state

**🔍 Context Coverage Analysis:**
- User authentication already validated by layout middleware
- Report ownership verified by API endpoint
- No props needed - components use hooks and route params

---

## 4. Context & Problem Definition

### Problem Statement

Users need to visualize evacuation routes on a map, but route generation takes 10-20 seconds via AI. Blocking the UI during generation creates a poor user experience. The solution must:

1. **Start generation immediately** when user views plan details
2. **Allow navigation** to other tabs while routes generate
3. **Provide clear status** about route generation progress
4. **Enable the Map tab** when routes are ready
5. **Handle failures gracefully** if route generation fails
6. **Persist generation** even if user navigates away from the page

### Success Criteria

- [ ] Map tab shows "Generating Routes..." badge when routes are being created
- [ ] Tab is visually disabled (dimmed) until routes are ready
- [ ] Background generation continues even if user navigates to other tabs or pages
- [ ] Tab becomes enabled with "Routes Ready" indicator when generation completes
- [ ] Map displays all routes with distinct colors and interactive selection
- [ ] Polling stops automatically when routes are ready or after timeout
- [ ] User can view location and routes on Google Maps with tactical dark theme styling
- [ ] Route cards show name, description, distance, time, hazards
- [ ] Mobile responsive design works on 320px+ screens

---

## 5. Development Mode Context

- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements

- User can see Map & Routes tab in plan details navigation
- Tab displays "Generating Routes..." badge while routes are being created
- Tab is disabled (not clickable) until routes are ready
- Client polls `/api/mission-reports/[id]/routes` every 2 seconds
- When routes ready, tab becomes enabled and badge shows "Routes Ready"
- Clicking enabled tab displays Google Maps with all evacuation routes
- Each route renders with distinct color (cycling through 5 colors)
- User can select a route to highlight it
- Route cards display route metadata (name, description, distance, time, hazards)
- Map shows start marker, end marker, and intermediate waypoints
- Routes use Google Directions Service for street-level routing

### Non-Functional Requirements

- **Performance:** Map loads within 2 seconds after tab click
- **Security:** Route API enforces user ownership via `userOwnsMissionReport()`
- **Usability:** Clear visual feedback at all stages (generating, ready, failed)
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support dark mode using tactical map styling from v1
- **Compatibility:** Works in Chrome, Firefox, Safari, Edge

### Technical Constraints

- Must use existing background task infrastructure from Task 021
- Must use `@react-google-maps/api` for map display (proven v1 pattern)
- Must use Google Directions Service for route rendering
- Cannot block main report generation - routes generate separately
- Must respect Google Maps API quotas (polling interval, request caching)

---

## 7. Data & Database Changes

### Database Schema Changes

**No database changes required** - Task 021 already added `evacuationRoutes` support to `reportData` JSON field.

Existing schema (for reference):
```typescript
// src/db/schema/index.ts
missionReports table:
  - reportData: json (contains evacuationRoutes array)

// EvacuationRoute type already defined in src/types/mission-report.ts
interface EvacuationRoute {
  name: string;
  description: string;
  distance: string;
  estimatedTime: string;
  waypoints: Array<{
    lat: number;
    lng: number;
    name: string;
    description?: string;
  }>;
  hazards: string[];
}
```

### Data Migration Plan

- No migration needed - field already exists in v2 schema
- Existing reports without routes will show "No routes available" message
- Future reports will include routes via background generation

---

## 8. API & Backend Changes

### Server Actions

**No new server actions needed** - Route generation already handled by background tasks.

### Database Queries

- **Existing:** `checkRoutesStatus()` in `src/lib/mission-generation/background-tasks.ts`
  - Used by polling API to check if routes are ready
  - Returns `{ ready: boolean, routes?: EvacuationRoute[] }`

### API Routes

**Existing:** `src/app/api/mission-reports/[id]/routes/route.ts`
- Already implemented in Task 021
- GET endpoint returns route status and data
- Enforces user ownership via `userOwnsMissionReport()`

---

## 9. Frontend Changes

### New Components

- [ ] **`src/components/plans/map/MapComponent.tsx`** - Google Maps wrapper with route polylines and markers
  - Props: `{ routes: EvacuationRoute[], location: LocationData }`
  - Renders GoogleMap with dark theme styling
  - Shows DirectionsRenderer for each route
  - Handles route selection and highlighting

- [ ] **`src/components/plans/map/RouteCard.tsx`** - Route information card
  - Props: `{ route: EvacuationRoute, isSelected: boolean, onSelect: () => void, color: string }`
  - Displays route name, description, distance, time
  - Shows hazards list
  - Clickable to select/highlight route on map

- [ ] **`src/components/plans/plan-details/MapTab.tsx`** - Map tab container
  - Props: `{ reportId: string, location: LocationData }`
  - Uses `useRoutePolling` hook
  - Handles loading/error/ready states
  - Renders MapComponent when routes ready

- [ ] **`src/hooks/useRoutePolling.ts`** - Client polling hook for route readiness
  - Returns: `{ routes, isLoading, error }`
  - Polls `/api/mission-reports/[id]/routes` every 2 seconds
  - Stops after routes ready or 20 seconds timeout
  - Handles error states

**Component Requirements:**
- **Responsive Design:** Use mobile-first approach with Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- **Theme Support:** Use dark theme map styling from v1 (tactical aesthetic)
- **Accessibility:** Proper ARIA labels, keyboard navigation for route selection
- **Text Sizing:** Route cards use `text-base` (16px) for readability

### Page Updates

- [ ] **`src/components/plans/plan-details/PlanDetailsTabs.tsx`** - Add Map tab to navigation
  - Add `map` tab to tabs array
  - Implement disabled state logic based on route polling status
  - Show badge indicator with generation status
  - Render MapTab component when selected

### State Management

**Client-Side State:**
- `useRoutePolling()` hook manages polling state
- MapComponent manages selected route state
- Tab disabled state derived from polling hook status

**No global state needed** - all state is component-scoped

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**No Map tab exists - deferred in Task 021:**

```typescript
// src/components/plans/plan-details/PlanDetailsTabs.tsx (current)
const tabs = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'details', label: 'Details', icon: FileText },
  { id: 'skills', label: 'Skills', icon: Lightbulb },
  { id: 'simulation', label: 'Simulation', icon: Clock },
  // Map tab missing
];
```

**Background infrastructure exists but unused:**

```typescript
// src/lib/mission-generation/background-tasks.ts (existing)
export async function executeBackgroundTasks(input: BackgroundTaskInput) {
  // Generates routes in background
  // Saves to reportData.evacuationRoutes
}

// src/app/api/mission-reports/[id]/routes/route.ts (existing)
export async function GET(request, { params }) {
  // Returns { ready: boolean, routeCount: number, routes: [] }
}
```

### 📂 **After Implementation**

**New polling hook for route status:**

```typescript
// src/hooks/useRoutePolling.ts (NEW)
export function useRoutePolling(reportId: string) {
  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/mission-reports/${reportId}/routes`);
      const data = await response.json();

      if (data.ready) {
        setRoutes(data.routes);
        setIsLoading(false);
        clearInterval(interval);
      }
    }, 2000);

    // Cleanup after 20 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (isLoading) {
        setError('Route generation timed out');
        setIsLoading(false);
      }
    }, 20000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [reportId]);

  return { routes, isLoading, error };
}
```

**Updated tab navigation with Map tab:**

```typescript
// src/components/plans/plan-details/PlanDetailsTabs.tsx (modified)
export function PlanDetailsTabs({ reportId, reportData }: Props) {
  const { routes, isLoading } = useRoutePolling(reportId);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'skills', label: 'Skills', icon: Lightbulb },
    { id: 'simulation', label: 'Simulation', icon: Clock },
    {
      id: 'map',
      label: 'Map & Routes',
      icon: Map,
      disabled: isLoading,
      badge: isLoading ? 'Generating...' : routes.length > 0 ? 'Ready' : null
    },
  ];

  return (
    <>
      {/* Tab navigation with disabled state */}
      {tabs.map(tab => (
        <button
          disabled={tab.disabled}
          className={cn(tab.disabled && 'opacity-50 cursor-not-allowed')}
        >
          {tab.label}
          {tab.badge && <Badge>{tab.badge}</Badge>}
        </button>
      ))}

      {/* Tab content */}
      {activeTab === 'map' && (
        <MapTab reportId={reportId} location={reportData.location} />
      )}
    </>
  );
}
```

**New Map component with Google Maps:**

```typescript
// src/components/plans/map/MapComponent.tsx (NEW)
import { GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';

export function MapComponent({ routes, location }: Props) {
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [directionsMap, setDirectionsMap] = useState<Map<string, DirectionsResult>>();

  // Calculate directions for each route
  useEffect(() => {
    routes.forEach(route => {
      directionsService.route({
        origin: route.waypoints[0],
        destination: route.waypoints[route.waypoints.length - 1],
        waypoints: route.waypoints.slice(1, -1).map(wp => ({ location: wp })),
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result) => {
        setDirectionsMap(prev => new Map(prev).set(route.name, result));
      });
    });
  }, [routes]);

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '600px' }}
      center={location.coordinates}
      zoom={10}
      options={{ styles: darkMapStyles }} // Tactical theme
    >
      {routes.map((route, index) => (
        <DirectionsRenderer
          key={route.name}
          directions={directionsMap.get(route.name)}
          options={{
            polylineOptions: {
              strokeColor: routeColors[index % 5],
              strokeOpacity: index === selectedRoute ? 0.9 : 0.2,
              strokeWeight: index === selectedRoute ? 6 : 4,
            }
          }}
        />
      ))}
    </GoogleMap>
  );
}
```

### 🎯 **Key Changes Summary**

- [ ] **New polling hook** - `useRoutePolling()` checks route status every 2 seconds
- [ ] **Tab state management** - Disabled/enabled based on route readiness
- [ ] **Badge indicators** - Show "Generating..." → "Ready" status
- [ ] **Google Maps integration** - Display routes with DirectionsRenderer
- [ ] **Route visualization** - 5-color scheme with selection highlighting
- [ ] **Files Created:**
  - `src/hooks/useRoutePolling.ts`
  - `src/components/plans/map/MapComponent.tsx`
  - `src/components/plans/map/RouteCard.tsx`
  - `src/components/plans/plan-details/MapTab.tsx`
- [ ] **Files Modified:**
  - `src/components/plans/plan-details/PlanDetailsTabs.tsx` (add Map tab)
- [ ] **Impact:** Map & Routes functionality complete, background generation working end-to-end

---

## 11. Implementation Plan

### Phase 1: Install Dependencies and Setup Google Maps
**Goal:** Add Google Maps library and configure API key

- [ ] **Task 1.1:** Install @react-google-maps/api
  - Files: `package.json`
  - Command: `npm install @react-google-maps/api`
  - Details: Install v2.20.7 or latest compatible version

- [ ] **Task 1.2:** Verify Google Maps API Key in Environment
  - Files: `.env.local`
  - Details: Confirm `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY` exists and includes Maps JavaScript API, Directions API
  - Note: API key already configured (verified in .env.local)

### Phase 2: Create Client Polling Hook
**Goal:** Implement useRoutePolling hook for background status checking

- [ ] **Task 2.1:** Create useRoutePolling Hook
  - Files: `src/hooks/useRoutePolling.ts`
  - Details: Implement polling logic with 2-second intervals, 20-second timeout, error handling
  - Returns: `{ routes, isLoading, error }`

- [ ] **Task 2.2:** Add TypeScript Types
  - Files: `src/types/mission-report.ts`
  - Details: Verify EvacuationRoute type exists (already defined from Task 021)

### Phase 3: Build Map Components
**Goal:** Create reusable map visualization components

- [ ] **Task 3.1:** Create RouteCard Component
  - Files: `src/components/plans/map/RouteCard.tsx`
  - Details: Route info display with name, description, distance, time, hazards, color indicator

- [ ] **Task 3.2:** Create MapComponent with Google Maps
  - Files: `src/components/plans/map/MapComponent.tsx`
  - Details: GoogleMap wrapper, DirectionsRenderer for routes, custom markers, dark theme styles

- [ ] **Task 3.3:** Create MapTab Container
  - Files: `src/components/plans/plan-details/MapTab.tsx`
  - Details: Container using useRoutePolling, loading/error/ready states, two-column layout (map + route list)

### Phase 4: Integrate Map Tab into PlanDetailsTabs
**Goal:** Add Map tab to navigation with disabled state logic

- [ ] **Task 4.1:** Add Map Tab to Navigation
  - Files: `src/components/plans/plan-details/PlanDetailsTabs.tsx`
  - Details: Add 'map' tab to tabs array, import Map icon from lucide-react

- [ ] **Task 4.2:** Implement Tab Disabled State
  - Files: `src/components/plans/plan-details/PlanDetailsTabs.tsx`
  - Details: Use useRoutePolling hook, disable tab when isLoading=true, show badge indicators

- [ ] **Task 4.3:** Add MapTab to Tab Content Rendering
  - Files: `src/components/plans/plan-details/PlanDetailsTabs.tsx`
  - Details: Render MapTab component when activeTab === 'map'

### Phase 5: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 5.1:** Code Quality Verification
  - Files: All modified files
  - Command: `npm run lint`
  - Details: Verify linting passes on all new components

- [ ] **Task 5.2:** TypeScript Type Check
  - Files: All TypeScript files
  - Command: `npx tsc --noEmit`
  - Details: Ensure no type errors in new code

- [ ] **Task 5.3:** Import Path Verification
  - Files: All new components
  - Details: Read files to verify correct import paths, component props

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

- [ ] **👤 USER TESTING 7.1:** Verify Tab Disabled State
  - Action: Navigate to existing plan, confirm Map tab shows "Generating..." badge and is disabled
  - Expected: Tab is dimmed/not clickable while routes generate

- [ ] **👤 USER TESTING 7.2:** Verify Tab Becomes Enabled
  - Action: Wait for route generation (or manually trigger), confirm tab becomes enabled with "Ready" badge
  - Expected: Tab becomes clickable, badge changes to "Ready"

- [ ] **👤 USER TESTING 7.3:** Verify Map Display
  - Action: Click enabled Map tab
  - Expected: Google Maps loads with all routes displayed in different colors

- [ ] **👤 USER TESTING 7.4:** Verify Route Selection
  - Action: Click different route cards
  - Expected: Selected route highlights on map with increased opacity/weight

- [ ] **👤 USER TESTING 7.5:** Verify Mobile Responsive
  - Action: Test on mobile viewport (320px width)
  - Expected: Map and route cards stack vertically, remain functional

- [ ] **👤 USER TESTING 7.6:** Verify Dark Mode Styling
  - Action: Toggle dark mode
  - Expected: Map uses tactical dark theme, route cards readable

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

**🗓️ GET TODAY'S DATE FIRST** - Use time tool to get correct current date before adding completion timestamps

**Update task document immediately** after each completed subtask:
- Mark checkboxes as [x] with completion timestamp
- Add brief completion notes (file paths, key changes, etc.)
- This creates audit trail and enables better debugging

### Example Task Completion Format
```
### Phase 3: Build Map Components
**Goal:** Create reusable map visualization components

- [x] **Task 3.1:** Create RouteCard Component ✓ 2025-12-11
  - Files: `src/components/plans/map/RouteCard.tsx` ✓
  - Details: Route info card with color indicator and hazards list ✓
- [x] **Task 3.2:** Create MapComponent with Google Maps ✓ 2025-12-11
  - Files: `src/components/plans/map/MapComponent.tsx` ✓
  - Details: Integrated DirectionsRenderer with 5-color route scheme ✓
```

---

## 13. File Structure & Organization

### New Files to Create

```
project-root/
├── src/
│   ├── hooks/
│   │   └── useRoutePolling.ts                # Client polling hook for route status
│   ├── components/plans/map/
│   │   ├── MapComponent.tsx                  # Google Maps wrapper with routes
│   │   ├── RouteCard.tsx                     # Route information card
│   │   └── MapTab.tsx                        # Map tab container
```

### Files to Modify

- [ ] **`src/components/plans/plan-details/PlanDetailsTabs.tsx`** - Add Map tab with disabled state logic
- [ ] **`package.json`** - Add @react-google-maps/api dependency

### Dependencies to Add

```json
{
  "dependencies": {
    "@react-google-maps/api": "^2.20.7"
  }
}
```

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze

- [ ] **Error Scenario 1:** Google Maps API fails to load
  - **Code Review Focus:** MapComponent.tsx error boundaries, loading state handling
  - **Potential Fix:** Show fallback message with retry button, log API errors

- [ ] **Error Scenario 2:** Route generation times out (>20 seconds)
  - **Code Review Focus:** useRoutePolling.ts timeout logic, error state display
  - **Potential Fix:** Show "Generation taking longer than expected" message with manual refresh option

- [ ] **Error Scenario 3:** DirectionsService API quota exceeded
  - **Code Review Focus:** MapComponent.tsx DirectionsService error handling
  - **Potential Fix:** Cache directions results, show error message about API limits

- [ ] **Error Scenario 4:** User navigates away during polling
  - **Code Review Focus:** useRoutePolling.ts cleanup on unmount
  - **Potential Fix:** Ensure interval/timeout cleared in useEffect cleanup

### Edge Cases to Consider

- [ ] **Edge Case 1:** Report has no evacuation routes (scenarios don't need evacuation)
  - **Analysis Approach:** Check MapTab.tsx handling of empty routes array
  - **Recommendation:** Show "No evacuation routes needed for your scenarios" message

- [ ] **Edge Case 2:** Route generation fails (AI error, invalid location)
  - **Analysis Approach:** Check error prop handling in MapTab
  - **Recommendation:** Show error message with option to regenerate or contact support

- [ ] **Edge Case 3:** Very long route with many waypoints
  - **Analysis Approach:** Check DirectionsService waypoint limits (max 25)
  - **Recommendation:** Truncate waypoints if needed, show warning if route simplified

- [ ] **Edge Case 4:** User has multiple tabs open polling same report
  - **Analysis Approach:** Check if multiple polling intervals cause issues
  - **Recommendation:** Polling is idempotent, multiple instances OK but could add tab visibility API to pause

### Security & Access Control Review

- [ ] **Authentication State:** Does the system handle logged-out users appropriately?
  - **Check:** Middleware redirects to login, API returns 401
  - **Status:** ✅ Already handled by existing middleware

- [ ] **Permission Boundaries:** Can users access routes for reports they don't own?
  - **Check:** `/api/mission-reports/[id]/routes` uses `userOwnsMissionReport()`
  - **Status:** ✅ Already secured in Task 021

- [ ] **API Key Exposure:** Is Google Maps API key properly restricted?
  - **Check:** `.env.local` uses `NEXT_PUBLIC_*` prefix (necessary for client-side Maps API)
  - **Recommendation:** Ensure API key has domain restrictions in Google Cloud Console

- [ ] **XSS in Route Data:** Could malicious route names/descriptions cause XSS?
  - **Check:** React auto-escapes text content, verify no dangerouslySetInnerHTML used
  - **Status:** ✅ React's default escaping protects against XSS

### AI Agent Analysis Approach

**Focus:** Review MapComponent.tsx and useRoutePolling.ts for proper error handling, cleanup, and security. Verify API key usage follows best practices. Check that empty/error states are user-friendly.

**Priority Order:**
1. **Critical:** API key security, user ownership verification
2. **Important:** Polling cleanup on unmount, timeout handling
3. **Nice-to-have:** Better error messages, retry mechanisms

---

## 15. Deployment & Configuration

### Environment Variables

```bash
# Already configured in .env.local
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=AIzaSyDQ3_HR-cV86l8ADimGrlmvRr6gIGK10SI

# Verify Google Cloud Console settings:
# - Maps JavaScript API enabled
# - Directions API enabled
# - API key restricted to domain (production) or HTTP referrers (dev)
```

**🚨 MANDATORY: Use Latest AI Models**
- Route generation already uses **gemini-2.0-flash-exp** (set in Task 021)
- No AI model changes needed for this UI task

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST

**User has already approved Option 2** in the strategic analysis section above.

### Communication Preferences

- [ ] Ask for clarification if requirements are unclear
- [ ] Provide regular progress updates
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW

**🎯 READY TO IMPLEMENT - User approved Option 2**

1. **✅ STRATEGIC ANALYSIS COMPLETE** - User approved disabled tab with badge approach
2. **✅ TASK DOCUMENT CREATED** - Comprehensive plan documented
3. **⏳ WAITING FOR USER APPROVAL** - Present implementation options

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

**V1 Reference Implementation:**
- MapComponent.tsx: `/home/tiran/emergency-planner-v2/ai_docs/refs/emergency-planner-v1/src/components/MapComponent.tsx`
- Route generation: `/home/tiran/emergency-planner-v2/ai_docs/refs/emergency-planner-v1/src/app/actions.ts`
- Dark map styles: Tactical theme with geometry #242f3e, roads #38414e

**Google Maps Documentation:**
- @react-google-maps/api: https://react-google-maps-api-docs.netlify.app/
- Directions Service: https://developers.google.com/maps/documentation/javascript/directions
- Map Styling: https://developers.google.com/maps/documentation/javascript/styling

### Design Specifications

**Route Color Scheme (from v1):**
```javascript
const routeColors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];
// Amber, Green, Blue, Red, Purple - cycle through for multiple routes
```

**Map Styling (Dark Theme):**
- Geometry: `#242f3e` (dark blue-gray)
- Roads: `#38414e` (darker gray)
- Highways: `#746855` (tan)
- Labels: `#746855` text on dark background
- Borders: White with weight 2

**Badge Design:**
- Generating: Amber/yellow badge with spinner icon
- Ready: Green badge with checkmark icon
- Error: Red badge with X icon

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No breaking changes - using existing route API from Task 021
- [ ] **Database Dependencies:** No schema changes - routes already stored in reportData
- [ ] **Component Dependencies:** PlanDetailsTabs modified, but backward compatible (new tab added)
- [ ] **Authentication/Authorization:** No changes - uses existing middleware and ownership checks

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** Background task flow unchanged - UI simply consumes existing data
- [ ] **UI/UX Cascading Effects:** New tab added, no impact on existing tabs
- [ ] **State Management:** New polling hook is self-contained, no global state changes
- [ ] **Routing Dependencies:** No route changes - /plans/[reportId] path unchanged

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** No new queries - uses existing checkRoutesStatus()
- [ ] **Bundle Size:** +~50KB for @react-google-maps/api (lazy loaded on tab click)
- [ ] **Server Load:** Polling every 2s for 20s max = 10 requests per report view (acceptable)
- [ ] **Caching Strategy:** DirectionsService results cached in component state

#### 4. **Security Considerations**
- [ ] **Attack Surface:** Google Maps API key exposed client-side (necessary, mitigate with domain restrictions)
- [ ] **Data Exposure:** No sensitive data - routes are plan-specific, already authorized
- [ ] **Permission Escalation:** No new permissions - uses existing ownership checks
- [ ] **Input Validation:** Route data generated by AI and saved server-side, no user input

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** Positive - adds new capability without disrupting existing flow
- [ ] **Data Migration:** No migration needed - new feature, no legacy data
- [ ] **Feature Deprecation:** No features removed
- [ ] **Learning Curve:** Minimal - standard map interaction patterns

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Low - uses proven patterns from v1, simple polling hook
- [ ] **Dependencies:** @react-google-maps/api well-maintained, stable API
- [ ] **Testing Overhead:** Manual testing required for map interactions, Google API mocking for unit tests
- [ ] **Documentation:** Component props documented with JSDoc, usage clear from types

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [ ] **Google Maps API Costs:** DirectionsService calls count toward API quota
  - **Mitigation:** Cache directions results, limit polling to 20 seconds
  - **Recommendation:** Monitor API usage in Google Cloud Console, set budget alerts

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Bundle Size Increase:** +50KB for Google Maps library
  - **Mitigation:** Lazy load MapComponent only when tab clicked
  - **Impact:** Acceptable for feature value, one-time cost per session

- [ ] **Polling Overhead:** 10 API requests per report view
  - **Mitigation:** Short polling window (20s), low request rate (2s interval)
  - **Impact:** Minimal server load, acceptable for UX benefit

### Mitigation Strategies

#### Google Maps API Costs
- [ ] **Budget Alerts:** Set up billing alerts in Google Cloud Console
- [ ] **Domain Restrictions:** Restrict API key to production domain
- [ ] **Caching:** Cache DirectionsService results in component state
- [ ] **Lazy Loading:** Only load Maps library when Map tab clicked

#### Performance Optimization
- [ ] **Code Splitting:** Dynamic import MapComponent with next/dynamic
- [ ] **Polling Cleanup:** Ensure intervals cleared on component unmount
- [ ] **Request Debouncing:** 2-second polling interval prevents excessive requests
- [ ] **Timeout Protection:** 20-second max polling window

#### Error Handling
- [ ] **API Failures:** Show user-friendly error messages with retry option
- [ ] **Timeout Handling:** Clear messaging if generation takes too long
- [ ] **Empty State:** Graceful handling of reports without routes
- [ ] **Network Errors:** Retry logic with exponential backoff

---

*Template Version: 1.3*
*Last Updated: 2025-12-11*
*Created By: Claude Sonnet 4.5*
