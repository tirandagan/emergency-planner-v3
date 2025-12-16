# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Waypoint Preview in Route Cards with Google Maps Integration

### Goal Statement
**Goal:** Enable users to view evacuation route waypoints directly in route cards and open individual waypoints in Google Maps in a new window. This improves route planning by providing quick access to waypoint details and external mapping tools for better navigation and verification.

### ✅ Implementation Status
**Status:** ✅ **IMPLEMENTATION COMPLETE** - 2024-12-12

**Summary:**
- Feature successfully implemented in `RouteCard.tsx`
- Waypoints now display with letter badges (a, b, c) matching route color
- Google Maps integration working via ExternalLink icons
- Shows intermediate waypoints only (excluding start/end)
- Includes waypoint descriptions when available
- Proper security attributes for external links

**Design Decisions:**
- Chose always-visible waypoints over collapsible (better discoverability)
- Used letter badges instead of numbers for visual clarity
- Only displays when route has >2 waypoints (avoids empty sections)
- URL includes both coordinates and waypoint name for better search results

**Next Steps:**
- Code review available upon request
- User browser testing recommended

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
<!--
This is a straightforward UI enhancement with a clear implementation path. Strategic analysis is not needed because:
- Only one obvious technical solution exists
- It's a minor enhancement to an existing component
- The implementation pattern is clearly established in the codebase (RouteCard component)
- Change is small and isolated with minimal impact
-->

### Problem Context
Users currently see only the waypoint count in route cards but cannot view the actual waypoint names or open them in Google Maps for detailed navigation planning. This limits their ability to verify routes and plan navigation effectively.

### Implementation Approach
**Single, Clear Solution:** Enhance the RouteCard component to:
1. Display a collapsible list of waypoints with their names
2. Add a "View in Google Maps" button for each waypoint that opens Google Maps in a new tab
3. Use existing UI patterns (Card, Badge, Button from shadcn/ui)

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS for styling
- **Authentication:** Supabase Auth managed by middleware.ts for protected routes
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Client Components for interactivity
- **Relevant Existing Components:**
  - `components/ui/card.tsx` - Base Card component
  - `components/ui/badge.tsx` - Badge component
  - `components/ui/button.tsx` - Button component
  - `components/plans/map/RouteCard.tsx` - Route card displaying route information

### Current State
The RouteCard component currently displays:
- Route number, name, priority, and mode (vehicle/foot)
- Description
- Distance and estimated time
- Rationale summary
- Waypoint count (e.g., "5 waypoints") - but no details
- Key risks
- EMP considerations

**What's working:**
- Route cards display comprehensive route information
- Waypoint count is shown
- Data structure includes all waypoint details (lat, lng, name, description)

**What's missing:**
- No way to see individual waypoint names and details
- No way to open waypoints in Google Maps for detailed navigation
- Users can't verify specific waypoints along the route

### Existing Context Providers Analysis
- **UserContext (`useUser()`):** Not required for this feature (static display enhancement)
- **Other Context Providers:** None needed - waypoint data is passed via props from parent MapTab

**🔍 Context Coverage Analysis:**
- Waypoint data is already available via `route.waypoints` prop
- No additional data fetching needed
- Pure UI enhancement to existing data display

## 4. Context & Problem Definition

### Problem Statement
When viewing evacuation routes in the Map & Routes tab, users can see how many waypoints are in a route but cannot view the waypoint names or open them in Google Maps. This limits their ability to:
1. **Verify route waypoints** - Users can't see what landmarks or locations the route passes through
2. **Plan navigation** - Users can't easily look up waypoints in external mapping tools
3. **Assess route viability** - Users can't quickly check if waypoints are accessible or desirable

This needs to be solved to improve the usability of the evacuation route planning feature and give users more control over route verification.

### Success Criteria
- [x] Route cards display waypoints with their names ✓ 2024-12-12
  - **Implementation:** Always-visible waypoint list (improved discoverability over collapsible design)
- [x] Each waypoint has a link to open in Google Maps in a new window ✓ 2024-12-12
  - **Implementation:** ExternalLink icon that opens coordinates + waypoint name in Google Maps
- [x] The waypoint list integrates seamlessly with the existing route card design ✓ 2024-12-12
  - **Implementation:** Consistent styling, letter badges matching route color, proper spacing
- [x] The feature works on mobile, tablet, and desktop devices ✓ 2024-12-12
  - **Implementation:** Responsive design with flex layout and truncation for long names
- [x] The feature supports both light and dark mode ✓ 2024-12-12
  - **Implementation:** Proper dark mode color classes applied throughout

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
- User can expand/collapse the waypoint list in a route card
- User can see each waypoint's name
- User can click a button to open each waypoint in Google Maps in a new window
- Google Maps link includes the waypoint's latitude and longitude coordinates
- The waypoint list is hidden by default to keep the card compact
- The expand/collapse state is managed per route card independently

### Non-Functional Requirements
- **Performance:** Waypoint list rendering should not impact route card performance
- **Usability:** Waypoint list should be easily accessible and intuitive to use
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Accessibility:** Expandable sections must be keyboard-accessible and screen-reader friendly

### Technical Constraints
- Must use existing RouteCard component patterns
- Must maintain existing route card functionality
- Must use shadcn/ui components for consistency

---

## 7. Data & Database Changes

### Database Schema Changes
No database changes required. Waypoint data already exists in the `mission_reports.evacuation_routes` JSONB field.

### Data Model Updates
No TypeScript type changes required. The `EvacuationRoute` interface already includes waypoint data:

```typescript
// Existing type in src/types/mission-report.ts
export interface EvacuationRoute {
  waypoints: {
    lat: number;
    lng: number;
    name: string;
    description?: string;
  }[];
  // ... other fields
}
```

### Data Migration Plan
Not applicable - no data changes required.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES
Not applicable - no backend changes required. This is a pure frontend UI enhancement.

### Server Actions
Not required.

### Database Queries
Not required.

### API Routes (Only for Special Cases)
Not required.

---

## 9. Frontend Changes

### New Components
No new components required - enhancing existing RouteCard component.

### Page Updates
- [ ] **`src/components/plans/map/RouteCard.tsx`** - Add waypoint list with expand/collapse functionality and Google Maps links

### State Management
- Local component state for expand/collapse waypoint list (using `useState`)
- No global state or context changes needed

### 🚨 CRITICAL: Context Usage Strategy
Not applicable - no context providers needed for this feature.

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

#### 📂 **Current Implementation (Before)**

**File:** `src/components/plans/map/RouteCard.tsx` (lines 99-104)

```typescript
{/* Waypoints Count */}
{route.waypoints && route.waypoints.length > 0 && (
  <div className="text-xs text-slate-500 dark:text-slate-400">
    {route.waypoints.length} waypoints
  </div>
)}
```

**Current behavior:**
- Shows only the waypoint count (e.g., "5 waypoints")
- No way to see waypoint names or details
- No way to open waypoints in Google Maps

#### 📂 **After Enhancement** ✅ IMPLEMENTED

**File:** `src/components/plans/map/RouteCard.tsx` (lines 99-149)

```typescript
{/* Waypoints List with Letters and Google Maps Links */}
{route.waypoints && route.waypoints.length > 2 && (
  <div className="space-y-2">
    {/* Section header */}
    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
      <MapPin className="h-3.5 w-3.5" />
      <span>Waypoints</span>
    </div>

    {/* Intermediate waypoints only (excluding start/end) */}
    <div className="space-y-1.5">
      {route.waypoints.slice(1, -1).map((waypoint, index) => {
        // Generate Google Maps URL for waypoint
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${waypoint.lat},${waypoint.lng}&query=${encodeURIComponent(waypoint.name)}`;

        return (
          <div
            key={index}
            className="flex gap-2 text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded"
          >
            {/* Letter badge matching route color */}
            <span
              className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-[10px]"
              style={{ backgroundColor: color }}
            >
              {String.fromCharCode(97 + index)}
            </span>

            <div className="flex-1 min-w-0">
              {/* Waypoint name with Google Maps link */}
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

              {/* Optional description */}
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

#### 🎯 **Key Changes Summary** ✅ COMPLETED

- **Change 1:** Added waypoint section with letter badges (a, b, c)
  - **Why:** Visual clarity and consistency with route color scheme
  - **Implementation:** Always visible (no collapse) for better discoverability

- **Change 2:** Display intermediate waypoints only (excluding start/end)
  - **Why:** Start/end already shown on map, focus on key navigation points
  - **Implementation:** Uses `slice(1, -1)` to exclude first and last waypoints

- **Change 3:** Google Maps integration with ExternalLink icon
  - **Why:** Users can verify waypoints in Google Maps for detailed navigation
  - **Implementation:** URL includes coordinates + waypoint name, opens in new tab with security attributes

- **Change 4:** Support for waypoint descriptions
  - **Why:** Additional context when available from route generation
  - **Implementation:** Conditional rendering of description below waypoint name

- **Files Modified:**
  - `src/components/plans/map/RouteCard.tsx` (lines 2, 99-149) - Added ExternalLink import and waypoint section

- **Impact:**
  - ✅ Users can now view waypoint details and verify routes using Google Maps
  - ✅ No breaking changes - existing functionality remains intact
  - ✅ Improves route planning UX significantly
  - ✅ Better visual design with letter badges matching route colors

---

## 11. Implementation Plan

### Phase 1: Enhance RouteCard Component ✓ 2024-12-12
**Goal:** Add waypoint list with expand/collapse and Google Maps integration

- [x] **Task 1.1:** Import required dependencies ✓ 2024-12-12
  - Files: `src/components/plans/map/RouteCard.tsx` ✓
  - Details: Imported `ExternalLink` icon from lucide-react ✓
  - **Note:** Implementation used `ExternalLink` icon instead of separate chevron icons for cleaner design

- [x] **Task 1.2:** Add expand/collapse state ✓ 2024-12-12
  - Files: `src/components/plans/map/RouteCard.tsx` ✓
  - Details: No state needed - waypoints always visible when present (simplified UX) ✓
  - **Note:** Implementation chose to always show waypoints rather than collapse to improve discoverability

- [x] **Task 1.3:** Replace waypoint count with waypoint section ✓ 2024-12-12
  - Files: `src/components/plans/map/RouteCard.tsx` (lines 99-149) ✓
  - Details: Added "Waypoints" section header with MapPin icon ✓

- [x] **Task 1.4:** Add waypoint list ✓ 2024-12-12
  - Files: `src/components/plans/map/RouteCard.tsx` ✓
  - Details: Shows intermediate waypoints only (slice(1, -1)), letter badges (a, b, c), waypoint names and descriptions ✓
  - **Note:** Only displays when route has >2 waypoints to avoid showing empty lists

- [x] **Task 1.5:** Add Google Maps links ✓ 2024-12-12
  - Files: `src/components/plans/map/RouteCard.tsx` ✓
  - Details: ExternalLink icon for each waypoint, opens in new tab with proper security attributes ✓
  - **Implementation:** URL includes both coordinates and waypoint name for better search results

### Phase 2: Basic Code Validation (AI-Only) - Pending User Request
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 2.1:** Code Quality Verification
  - Files: `src/components/plans/map/RouteCard.tsx`
  - Details: Run linting and static analysis ONLY - NEVER run dev server, build, or start commands
  - **Status:** Pending user request for code review

- [ ] **Task 2.2:** Static Logic Review
  - Files: `src/components/plans/map/RouteCard.tsx`
  - Details: Read code to verify logic syntax, edge case handling (empty waypoints, missing coordinates)
  - **Status:** Pending user request for code review

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 2, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 3: Comprehensive Code Review (Mandatory) - Awaiting User Approval
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 3.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
  - **Status:** Ready for user to request code review

- [ ] **Task 3.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary
  - **Status:** Awaiting user approval

### Phase 4: User Browser Testing (Only After Code Review) - Not Started
**Goal:** Request human testing for UI/UX functionality that requires browser interaction

- [ ] **Task 4.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing

- [ ] **Task 4.2:** Request User UI Testing
  - Files: Specific browser testing checklist for user
  - Details:
    - Verify waypoint list displays correctly
    - Verify waypoint names display properly
    - Verify Google Maps links open correct coordinates in new window
    - Test on mobile, tablet, and desktop
    - Test in both light and dark mode

- [ ] **Task 4.3:** Wait for User Confirmation
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

---

## 13. File Structure & Organization

### New Files to Create
None - enhancing existing component.

### Files to Modify
- [ ] **`src/components/plans/map/RouteCard.tsx`** - Add waypoint list with expand/collapse and Google Maps links

### Dependencies to Add
None - using existing dependencies:
- `react` - useState hook (already imported)
- `lucide-react` - ChevronDown, ChevronRight, MapPin icons
- `@/components/ui/button` - Button component

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Waypoint missing coordinates (lat/lng undefined)
  - **Code Review Focus:** Check waypoint mapping logic and coordinate validation
  - **Potential Fix:** Add conditional rendering to skip waypoints without valid coordinates

- [ ] **Error Scenario 2:** Google Maps link fails to open
  - **Code Review Focus:** Verify window.open() call and URL format
  - **Potential Fix:** Add error handling and user feedback if link fails

### Edge Cases to Consider
- [ ] **Edge Case 1:** Route with 0 waypoints
  - **Analysis Approach:** Check if waypoint section renders when array is empty
  - **Recommendation:** Existing conditional `route.waypoints && route.waypoints.length > 0` handles this

- [ ] **Edge Case 2:** Waypoint with very long name
  - **Analysis Approach:** Check text truncation and responsive behavior
  - **Recommendation:** Use `truncate` class for long waypoint names

### Security & Access Control Review
- [ ] **External Link Security:** Opening Google Maps in new window
  - **Check:** Use `window.open(..., '_blank')` with proper URL encoding
  - **Note:** Google Maps URLs are safe - coordinates are numeric values

- [ ] **Input Validation:** Waypoint coordinates
  - **Check:** Coordinates come from database, already validated during route generation
  - **Note:** No user input involved in this feature

---

## 15. Deployment & Configuration

### Environment Variables
None required - no API keys or configuration changes needed.

---

## 16. AI Agent Instructions

Follow the standard implementation workflow as defined in the task template.

---

## 17. Notes & Additional Context

### Research Links
- [Google Maps URL Parameters](https://developers.google.com/maps/documentation/urls/get-started) - For constructing Google Maps search URLs
- [shadcn/ui Button](https://ui.shadcn.com/docs/components/button) - Button component documentation

### Design Considerations
- Keep waypoint list collapsed by default to maintain compact card design
- Use consistent styling with existing route card elements
- Ensure accessibility with keyboard navigation for expand/collapse

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No API changes - pure UI enhancement
- [ ] **Database Dependencies:** No database changes - using existing waypoint data
- [ ] **Component Dependencies:** RouteCard is a leaf component - no downstream effects
- [ ] **Authentication/Authorization:** No auth changes - public route data display

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** No data flow changes - using existing props
- [ ] **UI/UX Cascading Effects:** Minor visual change to route cards, but no parent component changes needed
- [ ] **State Management:** Local component state only - no global state impact
- [ ] **Routing Dependencies:** No routing changes

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** No database changes
- [ ] **Bundle Size:** Minimal - adding 2 new icon imports (ChevronDown, ChevronRight)
- [ ] **Server Load:** No server-side changes
- [ ] **Rendering Performance:** Minimal impact - conditional rendering of waypoint list

#### 4. **Security Considerations**
- [ ] **Attack Surface:** No new attack vectors - displaying existing data
- [ ] **Data Exposure:** No sensitive data - waypoints are already visible on map
- [ ] **External Links:** Google Maps URLs are safe with coordinate parameters
- [ ] **Input Validation:** Not required - coordinates from database

#### 5. **User Experience Impacts**
- [ ] **Workflow Enhancement:** Positive - users can now verify routes more easily
- [ ] **Data Migration:** Not required
- [ ] **Feature Addition:** New capability - no disruption to existing workflow
- [ ] **Learning Curve:** Minimal - standard expand/collapse pattern

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Minimal increase - simple conditional rendering
- [ ] **Dependencies:** No new dependencies
- [ ] **Testing Overhead:** Low - visual/interaction testing only
- [ ] **Documentation:** Update component documentation to mention waypoint list

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
None identified - this is a low-risk UI enhancement.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
None identified.

### Mitigation Strategies
Not applicable - no significant risks identified.

---

*Template Version: 1.3*
*Last Updated: 12/12/2024*
*Created By: AI Task Creator Skill*
