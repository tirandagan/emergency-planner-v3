# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Phase 4.4 - Mission Dashboard Enhancement

### Goal Statement
**Goal:** Enhance the existing `/dashboard` page to provide authenticated users with a polished home experience featuring a welcome header, saved plans grid with inline editing, free tier enforcement, and a readiness summary widget placeholder for Phase 6.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
**SKIP STRATEGIC ANALYSIS** - This is a straightforward enhancement task with clear requirements from the roadmap. The existing Dashboard component provides a solid foundation, and the implementation path is well-defined.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15, React 19
- **Language:** TypeScript 5.x with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS
- **Authentication:** Supabase Auth with middleware protection
- **Key Architectural Patterns:** Next.js App Router, Server Components, Server Actions

### Current State
**Existing Dashboard (`/src/components/Dashboard.tsx`):**
- Uses `useAuth()` hook for user data
- Fetches saved scenarios via `getSavedScenarios(user.id)`
- Displays:
  - Overall Readiness Score card (mock data: 58/100)
  - Critical Gaps list (mock data: 3 items)
  - Next Action card with CTA
  - "Your Emergency Plans" grid (real data from DB)
  - Category Breakdown radar chart (mock data)
  - Preparedness Timeline bar chart (mock data)
- Plan cards show: scenario type badge, title, location, date, score, delete button, view link
- Links to old `/planner/report?id={id}` route (needs updating to `/plans/{id}`)

**Key Issues to Address:**
1. No welcome message with user name
2. No "Create New Plan" hero CTA
3. Plan cards lack inline title editing
4. No free tier enforcement UI on dashboard
5. Readiness widget uses mock data (Phase 6 will provide real calculations)
6. Links point to old route structure

### Existing Context Providers Analysis
- **AuthContext (`useAuth()`):** Provides `user` object with `id`, `email`, profile data; `isLoading`, `isAdmin`
- **Sidebar receives:** `userName`, `userEmail`, `userTier`, `planCount`, `planLimit` from protected layout
- **Available in layout headers:** `x-user-tier`, `x-user-name`, `x-user-email`, `x-user-id`

**Context Coverage Analysis:**
- User data available via `useAuth()` ✅
- Tier data available via headers in layout, need to pass to Dashboard component
- Plan count needs to be fetched (use `getMissionReportCount()`)

## 4. Context & Problem Definition

### Problem Statement
The current dashboard provides basic functionality but lacks the polished UX specified in the wireframes. Users need a clear home base with:
- Personalized welcome experience
- Easy access to create new plans
- Visual plan cards with inline editing
- Clear tier status and upgrade prompts
- Preview of readiness features (Phase 6)

### Success Criteria
- [ ] Dashboard displays personalized "Welcome back, [Name]" header
- [ ] Large "Create New Plan" CTA button prominently displayed
- [ ] Readiness summary widget shows skeleton/placeholder UI
- [ ] Plan cards display in responsive grid (1/2/3/4 columns)
- [ ] Plan titles are editable inline (pencil icon → modal)
- [ ] FREE tier users see "1/1 Plans Saved" badge
- [ ] FREE tier upgrade modal appears when creating new plan at limit
- [ ] Plan card links navigate to `/plans/[reportId]`
- [ ] Empty state shows helpful prompt for new users

---

## 5. Development Mode Context

### Development Mode Context
- **This is a new application in active development**
- **No backwards compatibility concerns** - can refactor existing Dashboard.tsx
- **Data loss acceptable** - mock data can be replaced
- **Priority: Speed and simplicity** over preserving old patterns

---

## 6. Technical Requirements

### Functional Requirements
- User sees personalized welcome message with their display name
- User can click "Create New Plan" to navigate to wizard (with tier check)
- User sees all saved mission reports in a responsive card grid
- User can click pencil icon on plan card to edit title via modal
- User sees scenario badges, readiness score, last updated on each card
- FREE tier user sees plan count badge (1/1) in warning color when at limit
- FREE tier user sees upgrade modal when trying to create at limit
- User can choose to upgrade or overwrite existing plan
- User sees readiness summary widget with placeholder/skeleton UI

### Non-Functional Requirements
- **Performance:** Dashboard loads in <2s, smooth card animations
- **Responsive Design:** Mobile (1 col), tablet (2 col), desktop (3 col), wide (4 col)
- **Theme Support:** Full dark/light mode support
- **Accessibility:** ARIA labels on interactive elements, keyboard navigation

### Technical Constraints
- Must use existing `useAuth()` hook for user data
- Must use `getMissionReportsByUserId()` from `lib/mission-reports.ts`
- Must use shadcn/ui components for consistency
- Must integrate with existing Stripe checkout for upgrades

---

## 7. Data & Database Changes

### Database Schema Changes
No database changes required - using existing `mission_reports` table.

### Data Model Updates
No schema changes needed. Using existing:
```typescript
interface MissionReport {
  id: string
  userId: string
  title: string
  location: string | null
  scenarios: string[]
  readinessScore: number | null
  createdAt: Date
  updatedAt: Date
}
```

### Data Migration Plan
N/A - no migrations needed.

---

## 8. API & Backend Changes

### Server Actions
- [ ] **`updateMissionReportTitle(reportId, userId, title)`** - Already exists in `lib/mission-reports.ts`, verify it works

### Database Queries
- [ ] **`getMissionReportsByUserId(userId)`** - Already exists, use instead of `getSavedScenarios`
- [ ] **`getMissionReportCount(userId)`** - Already exists, use for tier enforcement

### API Routes
No new API routes needed - using Server Actions.

---

## 9. Frontend Changes

### New Components
- [ ] **`components/dashboard/DashboardHeader.tsx`** - Welcome message, readiness gauge placeholder, Create Plan CTA
- [ ] **`components/dashboard/PlanCard.tsx`** - Individual plan card with edit functionality
- [ ] **`components/dashboard/PlanGrid.tsx`** - Responsive grid of PlanCards
- [ ] **`components/dashboard/ReadinessSummary.tsx`** - Placeholder widget for Phase 6
- [ ] **`components/dashboard/EditTitleModal.tsx`** - Modal for editing plan title
- [ ] **`components/dashboard/UpgradeModal.tsx`** - Modal for FREE tier upgrade prompt
- [ ] **`components/dashboard/EmptyPlansState.tsx`** - Empty state for new users
- [ ] **`components/ui/CircularGauge.tsx`** - Reusable circular progress gauge

### Page Updates
- [ ] **`/dashboard`** - Refactor to use new component structure

### State Management
- Plan data fetched via `useAuth()` user ID + `getMissionReportsByUserId()`
- Tier data passed from layout or fetched
- Local state for modals (edit title, upgrade prompt)

---

## 10. Code Changes Overview

### Current Implementation (Before)
```typescript
// Dashboard.tsx - Current structure
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);

  // Fetches via old getSavedScenarios action
  // Shows generic "Emergency Preparedness Dashboard" title
  // Mock readiness data
  // Links to /planner/report?id={id}
}
```

### After Refactor
```typescript
// Dashboard.tsx - New structure
const Dashboard: React.FC<{ userTier: SubscriptionTier }> = ({ userTier }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<MissionReport[]>([]);
  const [planCount, setPlanCount] = useState(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <DashboardHeader
        userName={user?.name}
        planCount={planCount}
        planLimit={getTierLimits(userTier).maxPlans}
        userTier={userTier}
      />

      <ReadinessSummary isPlaceholder={true} />

      <PlanGrid
        plans={plans}
        userTier={userTier}
        onTitleEdit={handleTitleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
```

### Key Changes Summary
- [ ] **Refactor Dashboard.tsx** to use new component structure
- [ ] **Add DashboardHeader** with welcome, gauge placeholder, CTA
- [ ] **Create PlanCard** with inline edit trigger
- [ ] **Create EditTitleModal** for title editing
- [ ] **Create UpgradeModal** for FREE tier prompts
- [ ] **Create ReadinessSummary** skeleton widget
- [ ] **Update plan links** from `/planner/report?id=` to `/plans/[id]`

---

## 11. Implementation Plan

### Phase 1: Create Reusable UI Components ✅ 2025-12-11
**Goal:** Build foundational components for the dashboard

- [x] **Task 1.1:** Create CircularGauge component ✅ 2025-12-11
  - Files: `src/components/ui/CircularGauge.tsx` ✅
  - Details: SVG-based circular progress with customizable size, color, value, auto-color based on score
- [x] **Task 1.2:** Create ReadinessSummary skeleton widget ✅ 2025-12-11
  - Files: `src/components/dashboard/ReadinessSummary.tsx` ✅
  - Details: Placeholder with skeleton bars, "Coming Soon" badge, scenario breakdown placeholders, dashed borders
  - **EXTRA:** Added shadcn Skeleton component via `npx shadcn@latest add skeleton`

### Phase 2: Dashboard Header Section ✅ 2025-12-11
**Goal:** Build the welcome header with CTA

- [x] **Task 2.1:** Create DashboardHeader component ✅ 2025-12-11
  - Files: `src/components/dashboard/DashboardHeader.tsx` ✅
  - Details: Welcome message, circular gauge placeholder, "Create New Plan" button, tier badge
- [x] **Task 2.2:** Create UpgradeModal component ✅ 2025-12-11
  - Files: `src/components/dashboard/UpgradeModal.tsx` ✅
  - Details: Tier limit warning, upgrade CTA, overwrite option

### Phase 3: Plan Cards & Grid ✅ 2025-12-11
**Goal:** Build the saved plans display

- [x] **Task 3.1:** Create PlanCard component ✅ 2025-12-11
  - Files: `src/components/dashboard/PlanCard.tsx` ✅
  - Details: Card with title, badges, score, date, edit/delete/view actions
- [x] **Task 3.2:** Create EditTitleModal component ✅ 2025-12-11
  - Files: `src/components/dashboard/EditTitleModal.tsx` ✅
  - Details: Modal with input field, save/cancel buttons
- [x] **Task 3.3:** Create PlanGrid component ✅ 2025-12-11
  - Files: `src/components/dashboard/PlanGrid.tsx` ✅
  - Details: Responsive grid wrapper, empty state handling
- [x] **Task 3.4:** Create EmptyPlansState component ✅ 2025-12-11
  - Files: `src/components/dashboard/EmptyPlansState.tsx` ✅
  - Details: Friendly empty state with illustration, CTA

### Phase 4: Dashboard Integration ✅ 2025-12-11
**Goal:** Wire everything together

- [x] **Task 4.1:** Refactor Dashboard.tsx ✅ 2025-12-11
  - Files: `src/components/Dashboard.tsx` ✅
  - Details: Replace old structure with new components, update data fetching
- [x] **Task 4.2:** Update dashboard page to pass tier data ✅ 2025-12-11
  - Files: `src/app/(protected)/dashboard/page.tsx` ✅
  - Details: Pass userTier and userName to Dashboard component
- [x] **Task 4.3:** Add updateMissionReportTitle action ✅ 2025-12-11
  - Files: `src/app/actions.ts` ✅
  - Details: Server action to update plan titles
- [x] **Task 4.4:** Plan links updated to new route structure ✅ 2025-12-11
  - Files: `src/components/dashboard/PlanCard.tsx` ✅
  - Details: Links go to `/plans/[reportId]`

### Phase 5: Basic Code Validation (AI-Only) ✅ 2025-12-11
**Goal:** Run safe static analysis only

- [x] **Task 5.1:** Code Quality Verification ✅ 2025-12-11
  - Files: All modified files
  - Details: All dashboard components pass `npm run lint`
- [x] **Task 5.2:** Static Logic Review ✅ 2025-12-11
  - Files: Dashboard components
  - Details: Props typed, state management verified, event handlers working

### Phase 6: Comprehensive Code Review (Mandatory) ✅ 2025-12-11
**Goal:** Present implementation completion and request thorough code review

- [x] **Task 6.1:** Present "Implementation Complete!" Message ✅ 2025-12-11
- [x] **Task 6.2:** All dashboard components pass lint ✅ 2025-12-11

### Phase 7: User Browser Testing (Only After Code Review) ✅ 2025-12-11
**Goal:** Request human testing

- [x] **Task 7.1:** User starts dev server and tests `/dashboard` ✅ 2025-12-11
- [x] **Task 7.2:** User UI Testing Checklist: ✅ 2025-12-11
    - [x] Welcome message displays correct user name
    - [x] Create New Plan button works (check tier enforcement)
    - [x] Plan cards display correctly in responsive grid
    - [x] Edit title modal opens and saves correctly
    - [x] Upgrade modal appears for FREE tier at limit
    - [x] Plan links navigate to `/plans/[id]`
    - [x] Dark/light theme renders properly
    - [x] Mobile responsive layout works

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking
- [ ] **GET TODAY'S DATE FIRST** - Use time tool before adding timestamps
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp

---

## 13. File Structure & Organization

### New Files to Create
```
components/
├── dashboard/
│   ├── DashboardHeader.tsx      # Welcome + gauge + CTA
│   ├── PlanCard.tsx             # Individual plan card
│   ├── PlanGrid.tsx             # Responsive grid wrapper
│   ├── ReadinessSummary.tsx     # Phase 6 placeholder widget
│   ├── EditTitleModal.tsx       # Title edit modal
│   ├── UpgradeModal.tsx         # FREE tier upgrade prompt
│   └── EmptyPlansState.tsx      # Empty state for no plans
└── ui/
    └── CircularGauge.tsx        # Reusable circular gauge
```

### Files to Modify
- [ ] **`components/Dashboard.tsx`** - Refactor to use new components
- [ ] **`app/(protected)/dashboard/page.tsx`** - Pass tier prop if needed

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** User has no plans - empty state should display
- [ ] **Error Scenario 2:** Title update fails - show error toast, revert UI
- [ ] **Error Scenario 3:** Tier data unavailable - default to FREE tier behavior

### Edge Cases to Consider
- [ ] **Edge Case 1:** Very long plan titles - truncate with ellipsis
- [ ] **Edge Case 2:** Many scenarios on one plan - wrap badges or show count
- [ ] **Edge Case 3:** User rapidly clicking edit - debounce/prevent double submit

### Security & Access Control Review
- [ ] **User Authorization:** updateMissionReportTitle verifies userId ownership
- [ ] **Input Validation:** Title length limits, sanitization

---

## 15. Deployment & Configuration

### Environment Variables
No new environment variables required.

---

## 16. AI Agent Instructions

### Default Workflow
Follow the phase-by-phase implementation plan. Start with Phase 1 (ReadinessSummary widget) as requested by user.

### Communication Preferences
- Ask for clarification if requirements are unclear
- Provide phase recaps after each phase
- Wait for "proceed" between phases

### Code Quality Standards
- Use TypeScript strict mode
- Follow existing component patterns
- Use early returns
- Use async/await, not .then() chains
- No historical comments

---

## 17. Notes & Additional Context

### Design Decisions
**Circular Gauge Design Proposal:**
- SVG-based ring with stroke-dasharray animation
- Trust Blue (#1E90FF) for progress stroke
- Gray background ring
- Center shows percentage number
- Size: 120px for header, 48px for plan cards

**Plan Card Layout:**
```
┌────────────────────────────────────┐
│ [Badge] [Badge]           [Edit] ✎ │
│                                    │
│ Plan Title Here                    │
│ 📍 Location, State                 │
│ 📅 Dec 11, 2025                    │
│                                    │
│ ────────────────────────────────── │
│ Score: [Gauge 72]    [View Plan →] │
└────────────────────────────────────┘
```

### Research Links
- shadcn/ui Card: https://ui.shadcn.com/docs/components/card
- shadcn/ui Dialog: https://ui.shadcn.com/docs/components/dialog

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. Breaking Changes Analysis
- [ ] **Existing API Contracts:** No breaking changes - using existing server actions
- [ ] **Database Dependencies:** None - no schema changes
- [ ] **Component Dependencies:** Dashboard.tsx refactor may affect tests if any exist

#### 2. Ripple Effects Assessment
- [ ] **Data Flow Impact:** Minimal - using same data sources
- [ ] **UI/UX Cascading Effects:** Plan links will point to new route - ensure `/plans/[id]` exists

#### 3. Performance Implications
- [ ] **Bundle Size:** Minor increase from new components
- [ ] **Server Load:** No change - same queries

#### 4. Security Considerations
- [ ] **Permission Boundaries:** Title edit verifies user ownership

### Critical Issues Identification
**No RED FLAGS identified.**

**YELLOW FLAGS:**
- [ ] Plan link route change requires `/plans/[reportId]` route to exist and work

### Mitigation Strategies
- Verify `/plans/[reportId]` route is functional before updating links

---

*Template Version: 1.3*
*Last Updated: 2025-12-11*
*Task Number: 016*
