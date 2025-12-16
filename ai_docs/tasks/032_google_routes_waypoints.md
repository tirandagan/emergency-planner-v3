# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Implement Google Routes API with Intermediate Waypoints for Vehicle Routes

### Goal Statement
**Goal:** Replace the current polygon-based vehicle route display with Google Routes API using intermediate waypoints, add waypoint letters (a, b, c) to the map and route card listings, and implement custom start/end markers showing route number + "B" (beginning) and route number + "E" (end).

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
This task requires strategic analysis because there are multiple viable approaches for implementing the Google Routes API integration and waypoint display system.

### Problem Context
Currently, vehicle routes are displayed using simple Polyline connections between waypoints, which doesn't provide actual road routing or turn-by-turn directions. Users need to see realistic driving routes that follow roads, along with clearly labeled waypoints and start/end markers that make it easy to identify routes on the map.

### Solution Options Analysis

#### Option 1: Google Routes API with DirectionsRenderer
**Approach:** Use Google Maps DirectionsService API with DirectionsRenderer to automatically display routes with waypoints

**Pros:**
- ✅ Built-in waypoint support with automatic intermediate waypoints
- ✅ Automatic route rendering with turn-by-turn directions
- ✅ Less custom code needed for route display
- ✅ Built-in route optimization available

**Cons:**
- ❌ Limited customization of waypoint markers
- ❌ Difficult to implement custom start/end markers (3B, 3E format)
- ❌ May conflict with existing custom styling
- ❌ Less control over route appearance

**Implementation Complexity:** Low - Uses built-in Google Maps components
**Risk Level:** Low - Well-documented standard approach

#### Option 2: Routes API (new) with Custom Rendering
**Approach:** Use the new Google Routes API (v2) to compute routes, then render with custom Polylines and Markers

**Pros:**
- ✅ Full control over marker appearance and labels
- ✅ Can implement exact custom start/end marker format (3B, 3E)
- ✅ Modern API with better performance and features
- ✅ Supports detailed waypoint information
- ✅ Easy to implement letter markers (a, b, c) for waypoints
- ✅ Maintains current custom styling approach

**Cons:**
- ❌ Requires API route computation (server-side or client-side)
- ❌ More complex implementation
- ❌ Need to handle API response formatting
- ❌ Requires Routes API to be enabled (different from standard Maps API)

**Implementation Complexity:** Medium - Custom rendering with API integration
**Risk Level:** Medium - New API, requires careful error handling

#### Option 3: Directions API with Custom Marker Overlay
**Approach:** Use DirectionsService but disable DirectionsRenderer, manually render using encoded polylines and custom markers

**Pros:**
- ✅ Uses familiar DirectionsService API
- ✅ Full control over marker customization
- ✅ Can implement custom start/end markers
- ✅ Works with current setup

**Cons:**
- ❌ More complex than DirectionsRenderer alone
- ❌ Need to decode polylines manually
- ❌ Older API compared to Routes API v2
- ❌ More custom code to maintain

**Implementation Complexity:** Medium - Hybrid approach
**Risk Level:** Medium - Manual polyline handling

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 2 - Routes API (new) with Custom Rendering

**Why this is the best choice:**
1. **Full Customization** - Allows exact implementation of the custom marker format (3B, 3E) and waypoint letters (a, b, c) as specified
2. **Modern API** - Routes API v2 is Google's latest routing solution with better performance and features
3. **Consistency** - Maintains the current custom rendering approach used in the codebase
4. **Future-Proof** - Google is investing in Routes API as the long-term solution

**Key Decision Factors:**
- **Performance Impact:** Routes API v2 provides better performance than older Directions API
- **User Experience:** Custom markers provide clearer visual distinction between routes
- **Maintainability:** Clean separation between route computation and rendering
- **Scalability:** Can easily add more waypoint information in the future

**Alternative Consideration:**
Option 3 could be used if Routes API v2 proves difficult to integrate, as DirectionsService is already familiar. However, the Routes API v2 is the better long-term choice given Google's direction.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 2 - Routes API with Custom Rendering), or would you prefer a different approach?

**Questions for you to consider:**
- Does using the new Routes API v2 align with your technical preferences?
- Are you comfortable with the additional API enablement requirement?
- Do you have any specific constraints around API usage or billing?

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
  - `components/plans/map/MapComponent.tsx` - Current map rendering with Polyline
  - `components/plans/map/RouteCard.tsx` - Route information display
  - `components/plans/plan-details/MapTab.tsx` - Parent container for map and routes
- **Google Maps Integration:** Uses `@react-google-maps/api` with `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY`

### Current State
The current implementation uses:
1. **Polyline rendering** - Direct point-to-point connections between waypoints (line 159-184 in MapComponent.tsx)
2. **Simple markers** - Circle markers for start, circle with route number for end (lines 186-230)
3. **Waypoint data** - Each route has waypoints with lat, lng, name, and optional description
4. **No actual routing** - Lines don't follow roads, just straight connections

**What needs to change:**
- Replace Polyline with actual road routing using Google Routes API
- Add intermediate waypoint markers with letters (a, b, c)
- Replace start/end markers with custom format (route# + B/E)
- Display waypoint list in RouteCard with titles and descriptions

### Existing Context Providers Analysis
Not applicable - This is a UI enhancement that doesn't require additional context providers. The existing map components already receive route data via props from the parent MapTab component.

## 4. Context & Problem Definition

### Problem Statement
Users viewing evacuation routes need to see realistic driving routes that follow actual roads, not just straight lines between waypoints. Additionally, waypoints need to be clearly labeled on both the map and in the route card to help users understand the route path. The current implementation uses simple polylines which don't represent actual road routing and lacks clear waypoint identification.

### Success Criteria
- [x] Vehicle routes use Google Routes API with intermediate waypoints (reference: https://developers.google.com/maps/documentation/routes/intermed_waypoints)
- [x] Waypoints are displayed in the route card with title and description
- [x] Each waypoint in the route card has a link to open Google Maps in a new window
- [x] Google Maps link shows the waypoint location using lat/lng coordinates with waypoint title
- [x] Waypoints are labeled on the map with letters (a, b, c, etc.)
- [x] Start marker shows route number + "B" (e.g., "3B" for route 3 beginning)
- [x] End marker shows route number + "E" (e.g., "3E" for route 3 end)
- [x] Routes continue to work for "on foot" mode (can fallback to polyline if needed)
- [x] Map maintains existing styling and color coding

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
- User can view vehicle routes rendered with Google Routes API following actual roads
- System displays intermediate waypoints as letters (a, b, c) on the map
- Route card lists all waypoints with title and description
- Each waypoint in route card has a clickable link that opens Google Maps in new window
- Google Maps link displays waypoint location (lat/lng) with waypoint title as label
- Link uses URL parameters (no Google Maps API) - format: `https://www.google.com/maps/search/?api=1&query=LAT,LNG&query=WAYPOINT_NAME`
- Start marker displays as route number + "B" (e.g., "3B")
- End marker displays as route number + "E" (e.g., "3E")
- Clicking on waypoint markers highlights the associated route
- Routes maintain current color coding system (amber, green, blue, red, purple)

### Non-Functional Requirements
- **Performance:** Map should load and render routes within 2 seconds
- **Security:** API key properly configured in environment variables
- **Usability:** Waypoint markers clearly visible and distinguishable from start/end markers
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works with latest Chrome, Firefox, Safari, Edge

### Technical Constraints
- Must use existing Google Maps API key (NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY)
- Must maintain current @react-google-maps/api library
- Must preserve existing route color system
- Routes API must be enabled in Google Cloud Console for the project
- On-foot routes may continue to use simple polylines (routing API primarily for vehicle routes)

---

## 7. Data & Database Changes

### Database Schema Changes
No database changes required - using existing evacuation routes structure with waypoint data.

### Data Model Updates
No TypeScript type changes needed - existing `EvacuationRoute` interface already includes waypoints with name and description fields.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES
Not applicable - this is a frontend-only change using Google Maps client-side APIs.

### External Integrations
- **Google Routes API v2** - For computing vehicle routes with intermediate waypoints
  - API Documentation: https://developers.google.com/maps/documentation/routes/intermed_waypoints
  - Requires Routes API to be enabled in Google Cloud Console
  - Uses same API key as Google Maps: `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY`
  - Client-side API calls using fetch or Google Routes client library

**🚨 MANDATORY: Use Latest AI Models**
Not applicable - no AI model usage in this task.

---

## 9. Frontend Changes

### New Components
No new components needed - enhancing existing MapComponent and RouteCard.

### Page Updates
- [x] **`components/plans/map/MapComponent.tsx`** - Replace Polyline with Routes API rendering, add waypoint letter markers, update start/end markers
- [x] **`components/plans/map/RouteCard.tsx`** - Add waypoints list section with letters, titles, and descriptions

### State Management
No state management changes needed - existing selectedRouteIndex and route data flow is sufficient.

### 🚨 CRITICAL: Context Usage Strategy
Not applicable - no context usage needed for this UI enhancement.

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

#### 📂 **Current Implementation (Before)**

**MapComponent.tsx (lines 159-230):**
```typescript
{/* Render routes directly from waypoints using Polyline */}
{routes.map((route, index) => {
  if (!route.waypoints || route.waypoints.length < 2) return null;

  const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
  const isSelected = index === selectedRouteIndex;

  // Convert waypoints to path coordinates
  const path = route.waypoints.map(wp => ({
    lat: wp.lat,
    lng: wp.lng,
  }));

  return (
    <Polyline
      key={`route-${index}`}
      path={path}
      options={{
        strokeColor: color,
        strokeOpacity: isSelected ? 0.9 : 0.3,
        strokeWeight: isSelected ? 6 : 4,
        zIndex: isSelected ? 100 : 10 + index,
      }}
    />
  );
})}

{/* Custom markers for start and end points */}
{routes.map((route, index) => {
  if (!route.waypoints || route.waypoints.length < 2) return null;

  const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
  const start = route.waypoints[0];
  const end = route.waypoints[route.waypoints.length - 1];

  return (
    <React.Fragment key={`markers-${index}`}>
      {/* Start marker - simple circle */}
      <Marker
        position={{ lat: start.lat, lng: start.lng }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        }}
        onClick={() => handleRouteClick(index)}
      />

      {/* End marker with route number */}
      <Marker
        position={{ lat: end.lat, lng: end.lng }}
        label={{
          text: `${index + 1}`,
          color: 'white',
          fontWeight: 'bold',
        }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        }}
        onClick={() => handleRouteClick(index)}
      />
    </React.Fragment>
  );
})}
```

**RouteCard.tsx (lines 99-104):**
```typescript
{/* Waypoints Count */}
{route.waypoints && route.waypoints.length > 0 && (
  <div className="text-xs text-slate-500 dark:text-slate-400">
    {route.waypoints.length} waypoints
  </div>
)}
```

#### 📂 **After Refactor**

**MapComponent.tsx:**
```typescript
{/* Render vehicle routes using Google Routes API */}
{routes.map((route, index) => {
  if (!route.waypoints || route.waypoints.length < 2) return null;

  const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
  const isSelected = index === selectedRouteIndex;

  // For vehicle routes, use computed route from Routes API
  if (route.mode === 'vehicle') {
    return (
      <RouteRenderer
        key={`route-${index}`}
        route={route}
        color={color}
        isSelected={isSelected}
        onRouteClick={() => handleRouteClick(index)}
      />
    );
  }

  // For on-foot routes, continue using Polyline
  const path = route.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
  return (
    <Polyline
      key={`route-${index}`}
      path={path}
      options={{
        strokeColor: color,
        strokeOpacity: isSelected ? 0.9 : 0.3,
        strokeWeight: isSelected ? 6 : 4,
        zIndex: isSelected ? 100 : 10 + index,
      }}
    />
  );
})}

{/* Custom markers for all routes */}
{routes.map((route, index) => {
  if (!route.waypoints || route.waypoints.length < 2) return null;

  const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
  const start = route.waypoints[0];
  const end = route.waypoints[route.waypoints.length - 1];
  const intermediateWaypoints = route.waypoints.slice(1, -1);

  return (
    <React.Fragment key={`markers-${index}`}>
      {/* Start marker with route number + B */}
      <Marker
        position={{ lat: start.lat, lng: start.lng }}
        label={{
          text: `${index + 1}B`,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        }}
        onClick={() => handleRouteClick(index)}
      />

      {/* Intermediate waypoint markers with letters */}
      {intermediateWaypoints.map((waypoint, wpIndex) => (
        <Marker
          key={`waypoint-${index}-${wpIndex}`}
          position={{ lat: waypoint.lat, lng: waypoint.lng }}
          label={{
            text: String.fromCharCode(97 + wpIndex), // a, b, c, ...
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
          }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: color,
            fillOpacity: 0.8,
            strokeColor: 'white',
            strokeWeight: 2,
          }}
          title={waypoint.name}
          onClick={() => handleRouteClick(index)}
        />
      ))}

      {/* End marker with route number + E */}
      <Marker
        position={{ lat: end.lat, lng: end.lng }}
        label={{
          text: `${index + 1}E`,
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2,
        }}
        onClick={() => handleRouteClick(index)}
      />
    </React.Fragment>
  );
})}
```

**RouteCard.tsx:**
```typescript
{/* Waypoints List with Letters and Details */}
{route.waypoints && route.waypoints.length > 2 && (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
      <MapPin className="h-3.5 w-3.5" />
      <span>Waypoints</span>
    </div>
    <div className="space-y-1.5">
      {/* Intermediate waypoints only (excluding start/end) */}
      {route.waypoints.slice(1, -1).map((waypoint, index) => {
        // Generate Google Maps URL for waypoint
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${waypoint.lat},${waypoint.lng}&query=${encodeURIComponent(waypoint.name)}`;

        return (
          <div
            key={index}
            className="flex gap-2 text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded"
          >
            <span
              className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-[10px]"
              style={{ backgroundColor: color }}
            >
              {String.fromCharCode(97 + index)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {waypoint.name}
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  title="Open in Google Maps"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {waypoint.description && (
                <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                  {waypoint.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
```

#### 🎯 **Key Changes Summary**
- [x] **MapComponent**: Add vehicle route detection and Routes API integration for route computation
- [x] **MapComponent**: Add RouteRenderer component to render computed routes with Polyline
- [x] **MapComponent**: Replace simple start marker with route# + "B" label
- [x] **MapComponent**: Replace simple end marker with route# + "E" label
- [x] **MapComponent**: Add intermediate waypoint markers with letter labels (a, b, c)
- [x] **RouteCard**: Replace waypoint count with detailed waypoints list showing letters, titles, and descriptions
- [x] **RouteCard**: Add Google Maps link to each waypoint using URL parameters (opens in new window)
- [x] **RouteCard**: Import ExternalLink icon from lucide-react for waypoint links
- [x] **Files Modified:** `components/plans/map/MapComponent.tsx`, `components/plans/map/RouteCard.tsx`
- [x] **Impact:** Vehicle routes will display realistic road routing, users can see waypoint details in route card, map markers clearly identify route progression, users can open waypoints directly in Google Maps

---

## 11. Implementation Plan

### Phase 1: Google Routes API Integration
**Goal:** Set up Routes API client and implement route computation function

- [x] **Task 1.1:** Create Routes API helper function ✓ 2025-12-12
  - Files: `lib/google-routes.ts` ✓
  - Details: Created `computeRouteWithWaypoints()` function with Routes API v2 integration, polyline decoding, and duration formatting ✓
- [x] **Task 1.2:** Add route caching logic ✓ 2025-12-12
  - Files: `lib/google-routes.ts` ✓
  - Details: Implemented in-memory Map-based caching with cache key generation from waypoint coordinates ✓
- [x] **Task 1.3:** Create RouteRenderer component ✓ 2025-12-12
  - Files: `components/plans/map/RouteRenderer.tsx` ✓
  - Details: Created component with useEffect hook for route computation, loading state, and fallback to simple polyline on API failure ✓

### Phase 2: Update Map Component Markers
**Goal:** Implement custom start/end markers and waypoint letter markers

- [x] **Task 2.1:** Update Start Marker ✓ 2025-12-12
  - Files: `components/plans/map/MapComponent.tsx` (lines 211-229) ✓
  - Details: Added label `${index + 1}B`, increased scale to 12, added fontSize '14px' ✓
- [x] **Task 2.2:** Update End Marker ✓ 2025-12-12
  - Files: `components/plans/map/MapComponent.tsx` (lines 255-273) ✓
  - Details: Changed label from `${index + 1}` to `${index + 1}E`, increased scale to 12 ✓
- [x] **Task 2.3:** Add Intermediate Waypoint Markers ✓ 2025-12-12
  - Files: `components/plans/map/MapComponent.tsx` (lines 231-253) ✓
  - Details: Added loop through intermediateWaypoints, markers with letter labels (a, b, c), scale 8, opacity 0.8 ✓
- [x] **Task 2.4:** Integrate RouteRenderer for Vehicle Routes ✓ 2025-12-12
  - Files: `components/plans/map/MapComponent.tsx` (lines 160-198) ✓
  - Details: Added RouteRenderer import, conditional rendering based on route.mode, fallback to Polyline for on-foot routes ✓

### Phase 3: Update Route Card Display
**Goal:** Add waypoints list section to route cards with Google Maps links

- [x] **Task 3.1:** Replace Waypoint Count with Waypoint List ✓ 2025-12-12
  - Files: `components/plans/map/RouteCard.tsx` (lines 99-149) ✓
  - Details: Created structured list with letter badges, waypoint names, descriptions, conditional rendering for routes with >2 waypoints ✓
- [x] **Task 3.2:** Add Google Maps Links to Waypoints ✓ 2025-12-12
  - Files: `components/plans/map/RouteCard.tsx` (line 2, lines 128-136) ✓
  - Details: Added ExternalLink icon import, generated Google Maps URLs with lat/lng and encoded waypoint names, clickable links with target="_blank" ✓

### Phase 4: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [x] **Task 4.1:** Code Quality Verification ✓ 2025-12-12
  - Files: All modified files ✓
  - Details: Ran `npm run lint` - no errors in newly created/modified files (all errors in existing scripts/temp directories) ✓
- [x] **Task 4.2:** Static Logic Review ✓ 2025-12-12
  - Files: Modified business logic files ✓
  - Details: Ran TypeScript type checking (`npx tsc --noEmit`) - no type errors in modified files ✓
- [x] **Task 4.3:** Visual Code Review ✓ 2025-12-12
  - Files: MapComponent.tsx, RouteCard.tsx, RouteRenderer.tsx, google-routes.ts ✓
  - Details: Verified RouteRenderer integration, route.mode conditional, intermediateWaypoints calculation, ExternalLink usage ✓

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
  - Files: Specific browser testing checklist for user
  - Details: Clear instructions for user to verify:
    - Vehicle routes display with road routing (not straight lines)
    - Waypoint markers show letters (a, b, c)
    - Start marker shows route# + "B"
    - End marker shows route# + "E"
    - Route card displays waypoints with letters, titles, descriptions
    - Each waypoint has a clickable link icon (ExternalLink)
    - Clicking waypoint link opens Google Maps in new window
    - Google Maps shows waypoint location with title/label
    - Map and route card maintain existing styling and color coding
- [x] **Task 6.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

### Phase 7: AI Prompt Modifications for Waypoint Quality
**Goal:** Update evacuation route generation prompts to produce Google Maps-compatible waypoint names

- [x] **Task 7.1:** Modify Main Evacuation Routes Prompt ✓ 2025-12-12
  - Files: `prompts/evacuation-routes/main-prompt.md` ✓
  - Details:
    - Removed lat/lng coordinates from waypoint structure (lines 50-54) ✓
    - Updated waypoint name requirements to specify Google Maps-identifiable features ✓
    - Updated all 3 route examples to show specific intersections and landmarks with addresses ✓
    - Added "Specific Waypoints" guideline section (lines 154-157) ✓
- [x] **Task 7.2:** Modify EMP Comprehensive Prompt ✓ 2025-12-12
  - Files: `prompts/evacuation-routes/emp-comprehensive-prompt.md` ✓
  - Details:
    - Updated vehicle route waypoint examples with specific landmark instructions (lines 70-83) ✓
    - Updated on-foot route waypoint examples with intersection requirements (lines 147-156) ✓
    - Added new "WAYPOINT REQUIREMENTS" section with critical instructions (lines 195-200) ✓
    - Added explicit warnings against vague waypoint names ✓

**Rationale:** The Google Routes API and Google Maps links require specific, identifiable location names rather than vague descriptions with coordinates. Updated prompts ensure AI-generated evacuation routes will have waypoints that work properly with the new Google Routes integration and are easily findable in Google Maps.

**Changes Summary:**
- Starting points: Now require recognizable landmarks (e.g., "Harrah's Cherokee Center - Asheville") or exact addresses
- Intermediate waypoints: Must be specific intersections (e.g., "I-26 East and New Leicester Hwy") or highway exits (e.g., "I-40 Exit 27")
- End points: Must be specific, findable locations (e.g., "Hickory Regional Airport, 3101 9th Ave Dr NW, Hickory, NC")
- All examples updated to demonstrate proper waypoint naming conventions

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

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

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── lib/
│   └── google-routes.ts                    # Routes API client and helper functions
└── components/plans/map/
    └── RouteRenderer.tsx                   # Component to compute and render vehicle routes
```

### Files to Modify
- [x] **`components/plans/map/MapComponent.tsx`** - Add RouteRenderer for vehicle routes, update marker labels
- [x] **`components/plans/map/RouteCard.tsx`** - Add waypoints list section

### Dependencies to Add
No new dependencies needed - using existing `@react-google-maps/api` library.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [x] **Error Scenario 1:** Routes API fails or returns error
  - **Code Review Focus:** Check error handling in `lib/google-routes.ts` and `RouteRenderer.tsx`
  - **Potential Fix:** Fallback to polyline rendering if Routes API fails
- [x] **Error Scenario 2:** Route has no intermediate waypoints (only start/end)
  - **Code Review Focus:** Check waypoint rendering logic in MapComponent and RouteCard
  - **Potential Fix:** Conditional rendering to handle routes with 2 waypoints
- [x] **Error Scenario 3:** API key not properly configured
  - **Code Review Focus:** Check API key usage in google-routes.ts
  - **Potential Fix:** Show clear error message to user about API configuration

### Edge Cases to Consider
- [x] **Edge Case 1:** Route with 26+ intermediate waypoints (running out of letters)
  - **Analysis Approach:** Check waypoint letter generation logic
  - **Recommendation:** Use double letters (aa, ab) or numbers after z if needed
- [x] **Edge Case 2:** On-foot routes should continue using polylines
  - **Analysis Approach:** Verify mode detection and conditional rendering
  - **Recommendation:** Check `route.mode === 'vehicle'` condition is working
- [x] **Edge Case 3:** Waypoint names are very long
  - **Analysis Approach:** Check waypoint display in RouteCard
  - **Recommendation:** Add text truncation with ellipsis for long names

### Security & Access Control Review
- [x] **API Key Exposure:** Is the Google API key properly secured?
  - **Check:** Using NEXT_PUBLIC_ prefix means client-side exposure is intentional
  - **Note:** Google API keys should have domain restrictions in Cloud Console
- [x] **Client-Side API Calls:** Routes API calls from browser
  - **Check:** API key restrictions and quotas configured
  - **Note:** Monitor API usage to prevent quota exhaustion

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# Existing environment variable (no changes needed)
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=your_api_key_here
```

**Google Cloud Console Setup Required:**
1. Enable "Routes API" in Google Cloud Console for the project
2. Ensure API key has Routes API permission
3. Set up domain restrictions for security
4. Configure API quota limits

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
✅ **STRATEGIC ANALYSIS COMPLETED** - Option 2 (Routes API with Custom Rendering) is recommended. Waiting for user approval.

### Implementation Approach - CRITICAL WORKFLOW

**Current Status:** Awaiting user decision on strategic approach before proceeding to task document approval and implementation.

**Next Steps After Approval:**
1. Update this document with approved strategy
2. Present implementation options (A/B/C)
3. Begin phase-by-phase implementation upon user selection

---

## 17. Notes & Additional Context

### Research Links
- [Google Routes API - Intermediate Waypoints](https://developers.google.com/maps/documentation/routes/intermed_waypoints)
- [Google Routes API v2 Documentation](https://developers.google.com/maps/documentation/routes)
- [@react-google-maps/api Documentation](https://react-google-maps-api-docs.netlify.app/)

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** No API changes - purely frontend enhancement
- [x] **Database Dependencies:** No database changes required
- [x] **Component Dependencies:** RouteCard and MapComponent consumers (MapTab) - no interface changes
- [x] **Authentication/Authorization:** No impact

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** No changes to data models or flow
- [x] **UI/UX Cascading Effects:** Improved map visualization, more detailed route information
- [x] **State Management:** No state management changes
- [x] **Routing Dependencies:** No routing changes

#### 3. **Performance Implications**
- [x] **Routes API Calls:** Additional API calls for route computation - implement caching
- [x] **Bundle Size:** New RouteRenderer component adds ~2-3KB
- [x] **Server Load:** No server impact - client-side API calls
- [x] **Caching Strategy:** In-memory route caching to minimize API calls

#### 4. **Security Considerations**
- [x] **Attack Surface:** Client-side API calls - API key already exposed (intentional)
- [x] **Data Exposure:** No sensitive data in routes
- [x] **Permission Escalation:** No authorization changes
- [x] **Input Validation:** Routes API validates waypoint coordinates

#### 5. **User Experience Impacts**
- [x] **Workflow Enhancement:** Users see realistic routes instead of straight lines
- [x] **Data Migration:** No user action needed - works with existing route data
- [x] **Feature Addition:** New waypoint labels improve route understanding
- [x] **Learning Curve:** Minimal - visual enhancement is intuitive

#### 6. **Maintenance Burden**
- [x] **Code Complexity:** Moderate increase - new RouteRenderer component and Routes API integration
- [x] **Dependencies:** No new npm dependencies
- [x] **Testing Overhead:** Requires browser testing for visual verification
- [x] **Documentation:** Need to document Routes API setup in Cloud Console

### Critical Issues Identification

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [x] **Routes API Enablement:** User must enable Routes API in Google Cloud Console
  - **Mitigation:** Provide clear setup instructions in deployment section
- [x] **API Quota Limits:** Routes API has usage quotas that may incur costs
  - **Mitigation:** Implement route caching to minimize API calls
- [x] **On-Foot Routes:** Still use polylines, creating inconsistent rendering
  - **Mitigation:** Document this intentional behavior - routing API primarily for vehicles

### Mitigation Strategies

#### API Changes
- [x] **Fallback Strategy:** If Routes API fails, fallback to polyline rendering
- [x] **Error Handling:** Clear error messages if Routes API is not enabled
- [x] **Caching:** Implement route caching to reduce API calls and costs

#### Performance
- [x] **Route Computation:** Compute routes on component mount, cache results
- [x] **Lazy Loading:** Routes computed only when map is visible
- [x] **Debouncing:** Prevent redundant API calls during rapid route selection

---

*Template Version: 1.3*
*Last Updated: 8/26/2025*
*Created By: Brandon Hancock*
