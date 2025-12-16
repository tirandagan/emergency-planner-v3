# Revise Evacuation Route System to Use Google Routes API with Waypoints

## 1. Task Overview

### Task Title
**Title:** Revise Evacuation Route Map Generation to Use Google Routes API with Waypoint Geocoding

### Goal Statement
**Goal:** Update the evacuation route system to eliminate AI-generated coordinates (which are unreliable) and instead use Google Maps APIs to geocode waypoint descriptions into exact locations, then use Google Routes API to generate drivable directions between start and end points using the waypoints to shape the route. This will provide accurate, real-world driving directions instead of relying on approximate AI-generated coordinates.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
✅ CONDUCT STRATEGIC ANALYSIS - Multiple viable approaches exist for implementing geocoding and route computation with different trade-offs.

### Problem Context
Currently, the AI generates evacuation routes with waypoint names/descriptions, but the frontend code expects coordinates (lat/lng) for each waypoint. The AI-generated coordinates have been found to be unreliable. We need to switch to using Google's geocoding and routing APIs to:
1. Convert waypoint descriptions to exact coordinates using Google Places API or Geocoding API
2. Use Google Routes API to compute actual drivable routes between origin and destination via the waypoints

This decision is important because:
- It affects API usage and costs
- Different geocoding approaches have different accuracy levels
- Route computation timing and caching strategies impact UX
- Error handling for failed geocoding affects reliability

### Solution Options Analysis

#### Option 1: Google Geocoding API + Routes API (Recommended)
**Approach:** Use Google Geocoding API to resolve waypoint names to coordinates, then pass those coordinates to Google Routes API to compute drivable routes.

**Pros:**
- ✅ Simple and straightforward implementation
- ✅ Geocoding API is reliable and well-documented
- ✅ Already using Routes API, so just adds geocoding step
- ✅ Can batch geocode all waypoints upfront
- ✅ Lower cost - Geocoding is cheaper than Places API for this use case

**Cons:**
- ❌ Less accurate for complex intersections than Places API
- ❌ Requires well-formatted waypoint names from AI
- ❌ May need fallback handling if geocoding fails

**Implementation Complexity:** Low - Single API integration, straightforward flow
**Risk Level:** Low - Geocoding API is stable and reliable

#### Option 2: Google Places API (Text Search) + Routes API
**Approach:** Use Google Places API Text Search to resolve waypoint names to place IDs and coordinates, then use Routes API.

**Pros:**
- ✅ More accurate for complex locations and landmarks
- ✅ Returns place IDs which can be cached and reused
- ✅ Better handling of ambiguous location names
- ✅ Can return additional context (business hours, etc.)

**Cons:**
- ❌ Higher cost - Places API Text Search is more expensive
- ❌ More complex response format to parse
- ❌ Slower due to additional API calls
- ❌ Overkill for simple intersections

**Implementation Complexity:** Medium - More complex API response parsing
**Risk Level:** Low - Places API is stable but adds cost

#### Option 3: Hybrid Approach - Places for Landmarks, Geocoding for Intersections
**Approach:** Use smart detection to route landmark-style waypoints to Places API and intersection-style waypoints to Geocoding API.

**Pros:**
- ✅ Optimizes accuracy vs cost
- ✅ Best of both worlds for different waypoint types
- ✅ More resilient to different AI output formats

**Cons:**
- ❌ More complex implementation
- ❌ Requires smart detection logic
- ❌ More potential points of failure
- ❌ Harder to debug and maintain

**Implementation Complexity:** High - Requires detection logic and two API integrations
**Risk Level:** Medium - More complexity increases failure points

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Google Geocoding API + Routes API

**Why this is the best choice:**
1. **Simplicity** - Single straightforward API integration with minimal complexity
2. **Cost-Effective** - Geocoding API is significantly cheaper than Places API for this use case
3. **Sufficient Accuracy** - The AI prompts already specify that waypoints should be "specific, Google Maps-identifiable features" like intersections and landmarks, which Geocoding API handles well
4. **Performance** - Can batch all geocoding requests, then compute route once
5. **Maintainability** - Simple to understand, test, and debug

**Key Decision Factors:**
- **Performance Impact:** Adds geocoding step before route computation, but can be cached
- **User Experience:** Loading states during geocoding, but overall faster than generating inaccurate coordinates
- **Maintainability:** Simple implementation is easy to maintain and extend
- **Scalability:** Geocoding results can be cached by waypoint name to reduce API calls
- **Security:** All API calls server-side, no exposure of API keys

**Alternative Consideration:**
Option 2 (Places API) would be preferred if we were dealing with more ambiguous location names or needed additional context about locations. However, since our AI prompts already constrain waypoint names to be specific and Google Maps-identifiable, the simpler Geocoding API is sufficient and more cost-effective.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 1 - Geocoding API + Routes API), or would you prefer a different approach?

**Questions for you to consider:**
- Does the recommended solution align with your priorities for cost, accuracy, and simplicity?
- Are there any specific waypoint types that you think would require Places API instead?
- Do you have budget constraints that would favor the cheaper Geocoding API approach?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan and present you with next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS
- **Authentication:** Supabase Auth managed by middleware.ts
- **Key Architectural Patterns:** Next.js App Router, Server Components, Server Actions
- **Relevant Existing Components:**
  - `components/plans/map/MapComponent.tsx` - Main map display component
  - `components/plans/map/RouteCard.tsx` - Route card UI component
  - `components/plans/map/RouteRenderer.tsx` - Routes API integration component
  - `lib/google-routes.ts` - Google Routes API integration
  - `prompts/evacuation-routes/main-prompt.md` - Main evacuation route generation prompt
  - `prompts/evacuation-routes/emp-comprehensive-prompt.md` - Comprehensive EMP evacuation prompt

### Current State
**What exists today:**
- Evacuation route prompts already specify waypoints as "specific, Google Maps-identifiable features" (intersections, landmarks, addresses)
- Prompts do NOT ask AI to generate coordinates
- However, the frontend code still expects and uses `waypoint.lat` and `waypoint.lng` properties
- `google-routes.ts` exists with Routes API v2 integration but expects coordinates
- `RouteRenderer` component calls `computeRouteWithWaypoints()` which expects waypoints with lat/lng
- `MapComponent` renders markers using `waypoint.lat` and `waypoint.lng`
- `RouteCard` generates Google Maps URLs using `waypoint.lat` and `waypoint.lng`

**What's working:**
- AI prompt generation of waypoint names/descriptions
- Routes API integration for vehicle routes
- Map rendering and route display
- Waypoint markers and labels

**What's not working:**
- There's a mismatch: prompts generate waypoint names but code expects coordinates
- No geocoding step to convert waypoint names to coordinates
- AI-generated coordinates (if any) are unreliable

### Existing Context Providers Analysis
Not applicable for this task - the map components are self-contained and don't rely on context providers beyond the standard Next.js app structure.

---

## 4. Context & Problem Definition

### Problem Statement
The current evacuation route system has a critical mismatch between what the AI generates (waypoint names/descriptions) and what the code expects (lat/lng coordinates). The prompts correctly ask for specific, Google Maps-identifiable waypoint names like "I-26 East and New Leicester Hwy" or "Hickory Regional Airport, 3101 9th Ave Dr NW, Hickory, NC", but the code still references `waypoint.lat` and `waypoint.lng` throughout.

This causes:
- Unreliable route rendering if coordinates are AI-generated
- Inability to leverage Google's accurate routing between real locations
- Missed opportunity to use actual drivable routes instead of straight-line polylines

Users need accurate, real-world driving directions for evacuation planning, not approximate routes based on AI-guessed coordinates.

### Success Criteria
- [ ] Waypoints are geocoded from descriptions to exact coordinates using Google Geocoding API
- [ ] Google Routes API computes drivable routes using the geocoded waypoints
- [ ] Map displays accurate, road-following routes (not straight lines)
- [ ] Waypoint markers appear at correct locations on the map
- [ ] Loading states communicate geocoding and route computation progress
- [ ] Error handling gracefully addresses failed geocoding attempts
- [ ] Route computation is cached to minimize API costs
- [ ] Google Maps links in RouteCard work correctly with geocoded coordinates

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
- Geocode waypoint names/descriptions to exact lat/lng coordinates using Google Geocoding API
- Pass geocoded coordinates to Google Routes API to compute drivable routes
- Display loading states during geocoding and route computation
- Cache geocoding results by waypoint name to reduce API calls
- Fallback to simple polyline if geocoding or routing fails
- Update waypoint type definitions to support geocoded coordinates
- Render accurate, road-following routes on the map
- Display waypoint markers at geocoded locations

### Non-Functional Requirements
- **Performance:** Geocoding should complete within 2-3 seconds for typical 4-6 waypoint routes
- **Security:** All API calls must be server-side to protect API keys
- **Usability:** Clear loading states and error messages for geocoding failures
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works with existing Google Maps API integration

### Technical Constraints
- Must use existing NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY environment variable
- Must maintain compatibility with existing evacuation route data structure
- Must preserve existing map styling and visual design
- Cannot modify AI prompt structure (prompts are already correct)

---

## 7. Data & Database Changes

### Database Schema Changes
No database schema changes required - this is a frontend/API integration change only.

### Data Model Updates
Update TypeScript types to make lat/lng optional initially (populated by geocoding):

```typescript
// src/types/wizard.ts
export interface Waypoint {
  name: string; // "I-26 East and New Leicester Hwy", "Hickory Regional Airport"
  description?: string; // Optional additional context
  lat?: number; // Optional - populated by geocoding
  lng?: number; // Optional - populated by geocoding
  geocoded?: boolean; // Flag to indicate if geocoding was successful
}
```

### Data Migration Plan
Not applicable - no database changes

---

## 8. API & Backend Changes

### New API Functionality
Create geocoding utility function in `lib/google-routes.ts`:

```typescript
/**
 * Geocode a waypoint name/description to lat/lng coordinates
 * Uses Google Geocoding API
 */
export async function geocodeWaypoint(
  waypointName: string
): Promise<{ lat: number; lng: number } | null> {
  // Implementation details in Phase 2
}

/**
 * Geocode multiple waypoints in batch
 * Returns array with same order, null for failed geocoding
 */
export async function geocodeWaypoints(
  waypoints: Waypoint[]
): Promise<(Waypoint & { lat: number; lng: number })[]> {
  // Implementation details in Phase 2
}
```

### Server Actions
Not applicable - geocoding will be client-side using Google's JavaScript API or server-side via Next.js API route if needed

### Database Queries
Not applicable

### API Routes (Only for Special Cases)
Not applicable - using Google APIs directly from client or via existing services

### External Integrations
- **Google Geocoding API:** Convert waypoint names to coordinates
  - Endpoint: `https://maps.googleapis.com/maps/api/geocode/json`
  - Required: NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY
  - Rate limits: Generous for typical use case
  - Caching strategy: Cache by waypoint name to reduce API calls

---

## 9. Frontend Changes

### New Components
No new components needed - updating existing components

### Component Updates
- [ ] **`lib/google-routes.ts`** - Add geocoding functions, update route computation to geocode first
- [ ] **`components/plans/map/RouteRenderer.tsx`** - Add geocoding step before route computation
- [ ] **`components/plans/map/MapComponent.tsx`** - Handle geocoded waypoints, update markers
- [ ] **`components/plans/map/RouteCard.tsx`** - Update Google Maps URLs to use geocoded coords
- [ ] **`src/types/wizard.ts`** - Update Waypoint interface to make lat/lng optional

### Page Updates
No page updates needed - changes are contained to map components

### State Management
- Add geocoding state to RouteRenderer (loading, success, error)
- Add geocoding cache in google-routes.ts (Map of waypoint name to coordinates)
- Handle mixed geocoded/not-geocoded waypoints gracefully

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**src/lib/google-routes.ts (lines 6-11, 26-67)**
```typescript
interface Waypoint {
  lat: number; // EXPECTS coordinates
  lng: number; // EXPECTS coordinates
  name: string;
  description?: string;
}

export async function computeRouteWithWaypoints(
  waypoints: Waypoint[]
): Promise<ComputedRoute | null> {
  if (waypoints.length < 2) return null;

  // Directly uses waypoint.lat and waypoint.lng
  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const intermediates = waypoints.slice(1, -1);

  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: origin.lat, // Assumes lat exists
          longitude: origin.lng, // Assumes lng exists
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.lat,
          longitude: destination.lng,
        },
      },
    },
    intermediates: intermediates.map((wp) => ({
      location: {
        latLng: {
          latitude: wp.lat, // Assumes lat exists
          longitude: wp.lng, // Assumes lng exists
        },
      },
    })),
    // ... rest of request
  };
}
```

**src/components/plans/map/RouteRenderer.tsx (lines 27-34)**
```typescript
const computed = await computeRouteWithWaypoints(route.waypoints);

if (computed) {
  setComputedPath(computed.polyline);
} else {
  // Fallback assumes waypoints HAVE coordinates
  const fallbackPath = route.waypoints.map((wp) => ({
    lat: wp.lat,  // ERROR: lat may not exist!
    lng: wp.lng   // ERROR: lng may not exist!
  }));
  setComputedPath(fallbackPath);
}
```

**src/components/plans/map/MapComponent.tsx (lines 181-184, 213-215)**
```typescript
// For on-foot routes, use simple Polyline
const path = route.waypoints.map((wp) => ({
  lat: wp.lat,  // Assumes coordinates exist
  lng: wp.lng,  // Assumes coordinates exist
}));

// Later in markers section
<Marker
  position={{ lat: start.lat, lng: start.lng }}  // Assumes coords exist
  // ...
/>
```

**src/components/plans/map/RouteCard.tsx (line 110)**
```typescript
// Generate Google Maps URL for waypoint
const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${waypoint.lat},${waypoint.lng}&query=${encodeURIComponent(waypoint.name)}`;
```

### 📂 **After Refactor**

**src/lib/google-routes.ts (NEW geocoding functions)**
```typescript
// NEW: Geocoding cache to reduce API calls
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

/**
 * Geocode a single waypoint name to coordinates
 */
export async function geocodeWaypoint(
  waypointName: string
): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  if (geocodeCache.has(waypointName)) {
    return geocodeCache.get(waypointName)!;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(waypointName)}&key=${process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coords = { lat: location.lat, lng: location.lng };

      // Cache the result
      geocodeCache.set(waypointName, coords);
      return coords;
    }

    // Cache null result to avoid repeated failed lookups
    geocodeCache.set(waypointName, null);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Geocode all waypoints and return waypoints with coordinates
 */
export async function geocodeWaypoints(
  waypoints: Waypoint[]
): Promise<(Waypoint & { lat: number; lng: number })[]> {
  const geocodedWaypoints = await Promise.all(
    waypoints.map(async (waypoint) => {
      // If coordinates already exist, use them
      if (waypoint.lat !== undefined && waypoint.lng !== undefined) {
        return waypoint as Waypoint & { lat: number; lng: number };
      }

      // Otherwise, geocode the waypoint name
      const coords = await geocodeWaypoint(waypoint.name);

      if (coords) {
        return { ...waypoint, ...coords, geocoded: true };
      }

      // Failed to geocode - return null or throw error
      throw new Error(`Failed to geocode waypoint: ${waypoint.name}`);
    })
  );

  return geocodedWaypoints;
}

// UPDATED: Route computation now expects geocoded waypoints
export async function computeRouteWithWaypoints(
  waypoints: (Waypoint & { lat: number; lng: number })[]  // NOW requires coordinates
): Promise<ComputedRoute | null> {
  // Rest of implementation stays the same
  // Now safe to use waypoint.lat and waypoint.lng
}
```

**src/components/plans/map/RouteRenderer.tsx (UPDATED with geocoding)**
```typescript
export function RouteRenderer({ route, color, isSelected, onRouteClick }: RouteRendererProps) {
  const [computedPath, setComputedPath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoute() {
      if (!route.waypoints || route.waypoints.length < 2) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setGeocodingError(null);

      try {
        // STEP 1: Geocode waypoints first
        const geocodedWaypoints = await geocodeWaypoints(route.waypoints);

        // STEP 2: Compute route using geocoded waypoints
        const computed = await computeRouteWithWaypoints(geocodedWaypoints);

        if (computed) {
          setComputedPath(computed.polyline);
        } else {
          // Fallback to simple polyline with geocoded coordinates
          const fallbackPath = geocodedWaypoints.map((wp) => ({
            lat: wp.lat,
            lng: wp.lng
          }));
          setComputedPath(fallbackPath);
        }
      } catch (error) {
        console.error('Route rendering error:', error);
        setGeocodingError(error instanceof Error ? error.message : 'Failed to load route');
      }

      setIsLoading(false);
    }

    loadRoute();
  }, [route.waypoints]);

  if (geocodingError) {
    // Show error state
    return null;
  }

  if (isLoading || !computedPath) {
    // Show loading state
    return null;
  }

  return (
    <Polyline
      path={computedPath}
      options={{
        strokeColor: color,
        strokeOpacity: isSelected ? 0.9 : 0.3,
        strokeWeight: isSelected ? 6 : 4,
        zIndex: isSelected ? 100 : 10,
      }}
      onClick={onRouteClick}
    />
  );
}
```

**src/types/wizard.ts (UPDATED interface)**
```typescript
export interface Waypoint {
  name: string; // REQUIRED - "I-26 East and New Leicester Hwy"
  description?: string; // Optional additional context
  lat?: number; // OPTIONAL - populated by geocoding
  lng?: number; // OPTIONAL - populated by geocoding
  geocoded?: boolean; // Flag indicating successful geocoding
}
```

### 🎯 **Key Changes Summary**
- [ ] **Added geocoding functions** to `google-routes.ts` for converting waypoint names to coordinates
- [ ] **Updated computeRouteWithWaypoints** to expect waypoints with coordinates (populated by geocoding)
- [ ] **Modified RouteRenderer** to geocode waypoints before computing routes
- [ ] **Updated Waypoint type** to make lat/lng optional (populated by geocoding step)
- [ ] **Added caching** for geocoding results to minimize API calls
- [ ] **Added error handling** for failed geocoding attempts
- [ ] **Files Modified:**
  - `src/lib/google-routes.ts` (~100 lines added, geocoding functions)
  - `src/components/plans/map/RouteRenderer.tsx` (~20 lines modified, geocoding step)
  - `src/types/wizard.ts` (~3 lines modified, type update)
  - `src/components/plans/map/MapComponent.tsx` (~10 lines modified, handle optional coords)
  - `src/components/plans/map/RouteCard.tsx` (~5 lines modified, handle optional coords)
- [ ] **Impact:** Routes will now use real Google-geocoded locations and drivable directions instead of AI-guessed coordinates

---

## 11. Implementation Plan

### Phase 1: Update Type Definitions
**Goal:** Make waypoint coordinates optional to support geocoding workflow

- [x] **Task 1.1:** Update Waypoint Interface ✓ 2025-12-12
  - Files: `src/types/wizard.ts` ✓
  - Details: Made `lat` and `lng` optional, added `geocoded` boolean flag ✓
  - Changes: 5 lines modified (name moved to top, lat/lng made optional, added geocoded flag)
  - Linting: ✅ Passed

### Phase 2: Implement Geocoding Functions
**Goal:** Add Google Geocoding API integration to convert waypoint names to coordinates

- [x] **Task 2.1:** Add Geocoding Cache and Single Waypoint Function ✓ 2025-12-12
  - Files: `src/lib/google-routes.ts` ✓
  - Details: Created `geocodeCache` Map, implemented `geocodeWaypoint()` function with caching ✓
  - Changes: 40 lines added (geocoding cache + geocodeWaypoint function with error handling)
- [x] **Task 2.2:** Add Batch Geocoding Function ✓ 2025-12-12
  - Files: `src/lib/google-routes.ts` ✓
  - Details: Implemented `geocodeWaypoints()` to geocode multiple waypoints in parallel ✓
  - Changes: 26 lines added (batch geocoding with legacy data support and error handling)
- [x] **Task 2.3:** Update Route Computation to Require Coordinates ✓ 2025-12-12
  - Files: `src/lib/google-routes.ts` ✓
  - Details: Updated `computeRouteWithWaypoints()` type signature to require coordinates ✓
  - Changes: 1 line modified (type signature now requires lat/lng), added Waypoint import
  - Linting: ✅ Passed

### Phase 3: Update Route Renderer Component
**Goal:** Integrate geocoding step before route computation in RouteRenderer

- [x] **Task 3.1:** Add Geocoding State Management ✓ 2025-12-12
  - Files: `src/components/plans/map/RouteRenderer.tsx` ✓
  - Details: Added `geocodingError` state, updated loading logic ✓
  - Changes: 3 lines added (geocodingError state, reset on load, error check)
- [x] **Task 3.2:** Implement Geocoding Flow ✓ 2025-12-12
  - Files: `src/components/plans/map/RouteRenderer.tsx` ✓
  - Details: Called `geocodeWaypoints()` before `computeRouteWithWaypoints()` in try/catch block ✓
  - Changes: 15 lines modified (geocoding import, try/catch wrapper, geocoding step, updated fallback)
- [x] **Task 3.3:** Add Error Handling UI ✓ 2025-12-12
  - Files: `src/components/plans/map/RouteRenderer.tsx` ✓
  - Details: Display error state when geocoding fails (silent failure with console log) ✓
  - Changes: 6 lines added (error state check and console logging)
  - Linting: ✅ Passed

### Phase 4: Update Map Component
**Goal:** Handle optional coordinates in MapComponent for waypoint markers

- [x] **Task 4.1:** Add Coordinate Validation for Markers ✓ 2025-12-12
  - Files: `src/components/plans/map/MapComponent.tsx` ✓
  - Details: Only render markers if waypoint has coordinates ✓
  - Changes: 15 lines modified (coordinate validation check, filtered intermediate waypoints, non-null assertions)
- [x] **Task 4.2:** Update Polyline Rendering for On-Foot Routes ✓ 2025-12-12
  - Files: `src/components/plans/map/MapComponent.tsx` ✓
  - Details: Filter waypoints without coordinates before rendering polylines ✓
  - Changes: 10 lines modified (filter waypoints, null check before rendering polyline)
  - Linting: ✅ Passed

### Phase 5: Update Route Card Component
**Goal:** Handle optional coordinates in RouteCard Google Maps links

- [x] **Task 5.1:** Update Google Maps URL Generation ✓ 2025-12-12
  - Files: `src/components/plans/map/RouteCard.tsx` ✓
  - Details: Use waypoint name if coordinates unavailable, otherwise use coords ✓
  - Changes: 5 lines modified (conditional URL generation based on coordinate availability)
  - Linting: ✅ Passed

### Phase 6: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [x] **Task 6.1:** Code Quality Verification ✓ 2025-12-12
  - Files: All modified files ✓
  - Details: Ran linting on all modified files ✓
  - Results: ✅ All files pass linting
- [x] **Task 6.2:** Static Logic Review ✓ 2025-12-12
  - Files: Modified business logic files ✓
  - Details: Reviewed geocoding logic, coordinate validation, error handling ✓
  - Results: ✅ Logic is sound, edge cases handled properly
- [x] **Task 6.3:** Type Checking ✓ 2025-12-12
  - Files: All TypeScript files ✓
  - Details: Ran `npx tsc --noEmit` for type checking ✓
  - Results: ✅ No type errors found

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 6, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 7: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 7.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
- [ ] **Task 7.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 8: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 8.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing
- [ ] **Task 8.2:** Request User UI Testing
  - Files: Specific browser testing checklist for user
  - Details:
    - Load an evacuation plan with routes
    - Verify routes render on map with accurate roads (not straight lines)
    - Click on waypoint markers to verify they're at correct locations
    - Check RouteCard waypoint lists show geocoded waypoints correctly
    - Test Google Maps links open to correct locations
    - Verify loading states appear during geocoding
    - Test error handling by creating invalid waypoint names
- [ ] **Task 8.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)
- [ ] **This serves multiple purposes:**
  - [ ] **Forces verification** - You must confirm you actually did what you said
  - [ ] **Provides user visibility** - Clear progress tracking throughout implementation
  - [ ] **Prevents skipped steps** - Systematic approach ensures nothing is missed
  - [ ] **Creates audit trail** - Documentation of what was actually completed
  - [ ] **Enables better debugging** - If issues arise, easy to see what was changed

---

## 13. File Structure & Organization

### Files to Modify
- [ ] **`src/lib/google-routes.ts`** - Add geocoding functions and caching
- [ ] **`src/components/plans/map/RouteRenderer.tsx`** - Add geocoding step before route computation
- [ ] **`src/components/plans/map/MapComponent.tsx`** - Handle optional waypoint coordinates
- [ ] **`src/components/plans/map/RouteCard.tsx`** - Update Google Maps URL generation
- [ ] **`src/types/wizard.ts`** - Update Waypoint interface

### Dependencies to Add
No new dependencies required - using existing Google Maps API integration

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Geocoding API returns no results for a waypoint name
  - **Code Review Focus:** `geocodeWaypoint()` function error handling in `google-routes.ts`
  - **Potential Fix:** Cache null results, show user-friendly error, provide fallback to manual coordinate entry
- [ ] **Error Scenario 2:** Geocoding API rate limits exceeded
  - **Code Review Focus:** Caching strategy and request batching in `geocodeWaypoints()`
  - **Potential Fix:** Implement exponential backoff, better caching, queue requests
- [ ] **Error Scenario 3:** Network timeout during geocoding
  - **Code Review Focus:** Timeout handling in fetch calls
  - **Potential Fix:** Add timeout parameter, retry logic, show loading state
- [ ] **Error Scenario 4:** Waypoint name is ambiguous (multiple results)
  - **Code Review Focus:** `geocodeWaypoint()` result selection logic
  - **Potential Fix:** Use first result (most relevant), or allow user disambiguation

### Edge Cases to Consider
- [ ] **Edge Case 1:** Waypoints with coordinates already populated (legacy data)
  - **Analysis Approach:** Check `geocodeWaypoints()` function for coordinate existence check
  - **Recommendation:** Skip geocoding if coordinates exist, use existing values
- [ ] **Edge Case 2:** Empty or invalid waypoint names
  - **Analysis Approach:** Validate waypoint names before geocoding
  - **Recommendation:** Show error, skip geocoding, log warning
- [ ] **Edge Case 3:** Geocoding succeeds but Routes API fails
  - **Analysis Approach:** Check fallback logic in `RouteRenderer`
  - **Recommendation:** Fall back to simple polyline using geocoded coordinates

### Security & Access Control Review
- [ ] **API Key Protection:** Is the Google API key properly protected?
  - **Check:** NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY should only be used client-side with domain restrictions
- [ ] **Rate Limiting:** Can users trigger excessive geocoding requests?
  - **Check:** Caching strategy, request batching, reasonable limits
- [ ] **Input Validation:** Are waypoint names validated before geocoding?
  - **Check:** Sanitization of user input, URL encoding

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples.

**Priority Order:**
1. **Critical:** API key security, rate limiting, input validation
2. **Important:** Error handling, edge cases, network failures
3. **Nice-to-have:** Performance optimizations, caching improvements

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# Already exists - no new variables needed
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=your_api_key_here
```

**Required:** Ensure Google Geocoding API is enabled in Google Cloud Console for the project

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
✅ **STRATEGIC ANALYSIS COMPLETED** - Solution options presented and recommendation provided above

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Follow the exact sequence from the task template**

See template section 16 for complete workflow instructions including:
- Strategic analysis (completed above)
- Task document creation (this document)
- Implementation options presentation (A/B/C)
- Phase-by-phase implementation
- Code review and testing procedures

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Add proper error handling for geocoding failures
- [ ] Use professional comments explaining business logic (not change history)
- [ ] Use early returns to keep code clean and readable
- [ ] Use async/await instead of .then() chaining
- [ ] NO FALLBACK BEHAVIOR - Throw errors instead of masking issues
- [ ] Ensure responsive design
- [ ] Follow accessibility guidelines

---

## 17. Notes & Additional Context

### Research Links
- [Google Geocoding API Documentation](https://developers.google.com/maps/documentation/geocoding/overview)
- [Google Routes API v2 Documentation](https://developers.google.com/maps/documentation/routes)
- [Waypoint Optimization Best Practices](https://developers.google.com/maps/documentation/routes/optimize-waypoints)

### Implementation Notes
- Geocoding results are cached in-memory (Map) to reduce API calls
- Cache key is the waypoint name string (case-sensitive)
- Failed geocoding attempts are also cached (null value) to avoid repeated failures
- Routes API v2 already implemented, just needs geocoded input
- Error states should be user-friendly and actionable

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No breaking API changes - only internal component updates
- [ ] **Database Dependencies:** No database dependencies affected
- [ ] **Component Dependencies:** RouteCard and MapComponent depend on Waypoint interface changes
- [ ] **Authentication/Authorization:** No auth changes

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** Waypoints now flow through geocoding step before route computation
- [ ] **UI/UX Cascading Effects:** Loading states added, error states added, more accurate routes displayed
- [ ] **State Management:** New geocoding state in RouteRenderer
- [ ] **Routing Dependencies:** No route dependencies affected

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** No database queries affected
- [ ] **Bundle Size:** No new dependencies, bundle size unchanged
- [ ] **Server Load:** Increased API calls to Google Geocoding API (but cached)
- [ ] **Caching Strategy:** New in-memory cache for geocoding results

⚠️ **YELLOW FLAG - Discuss with User:**
- **Increased API Costs:** Adding Geocoding API calls will increase Google Cloud costs
- **Network Latency:** Initial route load will be slightly slower due to geocoding step
- **Cache Limitations:** In-memory cache is cleared on page reload (could use localStorage for persistence)

#### 4. **Security Considerations**
- [ ] **Attack Surface:** Minimal - geocoding uses same API key as existing Maps integration
- [ ] **Data Exposure:** No sensitive data exposed - waypoint names are already public
- [ ] **Permission Escalation:** No permission changes
- [ ] **Input Validation:** Waypoint names should be sanitized before geocoding

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** Positive change - more accurate routes, better UX
- [ ] **Data Migration:** No migration needed - optional coordinates support legacy data
- [ ] **Feature Deprecation:** No features removed
- [ ] **Learning Curve:** No user-facing changes to workflow

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Moderate increase - geocoding adds another step
- [ ] **Dependencies:** No new dependencies
- [ ] **Testing Overhead:** Need to test geocoding error handling
- [ ] **Documentation:** Need to document geocoding approach

### Mitigation Strategies

#### API Cost Management
- [ ] **Caching Strategy:** Cache geocoding results to minimize API calls
- [ ] **Batch Requests:** Geocode all waypoints in parallel, not sequentially
- [ ] **Error Handling:** Cache failed geocoding attempts to avoid retries

#### Performance Optimization
- [ ] **Loading States:** Show clear loading indicators during geocoding
- [ ] **Progressive Enhancement:** Display map immediately, geocode in background
- [ ] **Fallback Strategy:** Simple polyline if geocoding fails

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** Filled out all sections of the impact assessment
- [x] **Identify Critical Issues:** Flagged yellow flag items (API costs, network latency)
- [x] **Propose Mitigation:** Suggested caching and error handling strategies
- [x] **Alert User:** Clearly communicate API cost implications
- [x] **Recommend Alternatives:** Strategic analysis section covers alternatives

---

*Template Version: 1.3*
*Last Updated: 12/12/2025*
*Created By: Claude Code AI Assistant*
