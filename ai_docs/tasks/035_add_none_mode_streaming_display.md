# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Add 'none' Mode to Streaming Display - Progress Checkmarks Only

### Goal Statement
**Goal:** Extend the NEXT_PUBLIC_STREAMING_DISPLAY_MODE environment variable to support a 'none' value that hides all streaming text output and displays only the stage checkmarks during plan wizard execution. This provides users with a minimal, progress-focused view without the distraction of streaming text.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
<!-- This is a straightforward enhancement with a clear implementation path - no strategic analysis needed -->

**Skip Strategic Analysis - Straightforward Implementation**

This is a direct feature enhancement with one clear approach:
- Extend existing display mode logic to handle a third value ('none')
- Hide text display components when mode is 'none'
- Ensure stage checkmarks remain visible
- Adjust layout to focus on progress indicators only

No multiple viable approaches or significant trade-offs exist for this feature.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS
- **Environment Variables:** NEXT_PUBLIC_STREAMING_DISPLAY_MODE supports 'full' and 'compact' modes

### Current State

**Existing Display Modes:**
1. **'full'** - Shows complete streaming text with all details
2. **'compact'** - Shows condensed streaming text

**Current Implementation Location:**
- Streaming display logic is handled in the plan wizard streaming step component
- Environment variable is read from `.env.local`
- Layout adjusts based on the current mode

### Existing Context Providers Analysis
- Not applicable for this feature - this is a UI display mode enhancement that doesn't require context providers

---

## 4. Context & Problem Definition

### Problem Statement
Currently, users can choose between 'full' and 'compact' streaming display modes during the plan wizard execution. However, some users may prefer an even more minimal experience that shows only the progress checkmarks for each stage without any text output. This would provide a cleaner, distraction-free view focused solely on tracking completion status.

### Success Criteria
- [ ] Environment variable NEXT_PUBLIC_STREAMING_DISPLAY_MODE accepts 'none' as a valid value
- [ ] When set to 'none', no streaming text is displayed during wizard execution
- [ ] Stage checkmarks/progress indicators remain visible and functional
- [ ] Layout adjusts to focus on progress indicators without text window
- [ ] Existing 'full' and 'compact' modes continue to work as before

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
- User can set NEXT_PUBLIC_STREAMING_DISPLAY_MODE='none' in `.env.local`
- When mode is 'none', the streaming text display area is hidden
- Stage progress checkmarks/indicators remain visible and update in real-time
- Layout is optimized for progress-only view (no wasted space for hidden text)
- System gracefully handles invalid mode values (defaults to existing behavior)

### Non-Functional Requirements
- **Performance:** No performance degradation with new mode
- **Usability:** Clear visual feedback of progress even without text
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works across all modern browsers

### Technical Constraints
- Must maintain existing 'full' and 'compact' mode functionality
- Must use existing environment variable pattern
- Must integrate seamlessly with current wizard streaming architecture

---

## 7. Data & Database Changes

### Database Schema Changes
No database changes required for this feature.

### Data Model Updates
No data model updates required.

### Data Migration Plan
No data migration needed.

---

## 8. API & Backend Changes

### Server Actions
No new server actions required.

### Database Queries
No database query changes needed.

### API Routes
No API route changes required.

### External Integrations
No external integration changes.

---

## 9. Frontend Changes

### New Components
No new components needed - modifications to existing streaming display component.

### Page Updates
- [ ] **Streaming Generation Step Component** - Add logic to handle 'none' mode
  - Conditionally render text display based on mode
  - Adjust layout when text is hidden
  - Ensure progress indicators remain visible

### State Management
- No state management changes needed
- Mode is determined by environment variable read at runtime

### Component Requirements
- **Responsive Design:** Progress indicators must be clearly visible on all screen sizes
- **Theme Support:** Dark mode compatibility for progress indicators
- **Accessibility:** Progress indicators must have proper ARIA labels for screen readers

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

#### 📂 **Current Implementation (Before)**
```typescript
// StreamingGenerationStep.tsx (conceptual - need to read actual file)

// Currently handles 'full' and 'compact' modes
const displayMode = process.env.NEXT_PUBLIC_STREAMING_DISPLAY_MODE || 'full';

return (
  <div className="streaming-container">
    {/* Text display area shown for both 'full' and 'compact' */}
    <div className="streaming-text">
      {streamingContent}
    </div>

    {/* Progress checkmarks */}
    <div className="progress-indicators">
      {stages.map(stage => <StageCheckmark key={stage.id} stage={stage} />)}
    </div>
  </div>
);
```

#### 📂 **After Refactor**
```typescript
// StreamingGenerationStep.tsx (conceptual - need to read actual file)

// Now handles 'full', 'compact', and 'none' modes
const displayMode = process.env.NEXT_PUBLIC_STREAMING_DISPLAY_MODE || 'full';

return (
  <div className="streaming-container">
    {/* Text display area hidden when mode is 'none' */}
    {displayMode !== 'none' && (
      <div className="streaming-text">
        {streamingContent}
      </div>
    )}

    {/* Progress checkmarks always visible */}
    <div className={cn(
      "progress-indicators",
      displayMode === 'none' && "progress-only-layout"
    )}>
      {stages.map(stage => <StageCheckmark key={stage.id} stage={stage} />)}
    </div>
  </div>
);
```

#### 🎯 **Key Changes Summary**
- [ ] **Add 'none' mode check:** Conditional rendering of text display based on mode
- [ ] **Layout adjustment:** Apply special styling when mode is 'none' to optimize space
- [ ] **Progress indicators:** Ensure checkmarks remain visible and prominent in 'none' mode
- [ ] **Files Modified:**
  - `src/components/plans/wizard/steps/StreamingGenerationStep.tsx` (main changes)
  - `.env.example` (document new 'none' option)
  - Type definitions if streaming mode types exist

**Impact:** Users can now choose a minimal progress-only view during wizard execution. This provides a cleaner experience for users who prefer to focus solely on completion status without streaming text.

---

## 11. Implementation Plan

### Phase 1: Read Current Implementation
**Goal:** Understand existing streaming display architecture

- [x] **Task 1.1:** Read StreamingGenerationStep Component ✓ 2025-12-12
  - Files: `src/components/plans/wizard/steps/StreamingGenerationStep.tsx` ✓
  - Details: Identified that StreamingReportView.tsx contains the actual display mode logic ✓
- [x] **Task 1.2:** Identify Display Mode Logic ✓ 2025-12-12
  - Files: `src/components/planner/StreamingReportView.tsx` ✓
  - Details: Found DISPLAY_MODE constant on line 14, isCompactMode check on line 140 ✓

### Phase 2: Implement 'none' Mode Support
**Goal:** Add 'none' mode handling to streaming display logic

- [x] **Task 2.1:** Add 'none' Mode Conditional Rendering ✓ 2025-12-12
  - Files: `src/components/planner/StreamingReportView.tsx` (+69 lines) ✓
  - Details: Added isNoneMode constant and complete 'none' mode rendering block (lines 209-277) ✓
- [x] **Task 2.2:** Adjust Layout for Progress-Only View ✓ 2025-12-12
  - Files: `src/components/planner/StreamingReportView.tsx` ✓
  - Details: Centered progress card layout, larger icons (h-5 w-5), text-base labels, max-w-md container ✓
- [x] **Task 2.3:** Update Type Definitions (if applicable) ✓ 2025-12-12
  - Files: No type definition files needed ✓
  - Details: Mode is string literal, no explicit type definitions required ✓

### Phase 3: Update Documentation
**Goal:** Document the new 'none' mode option

- [x] **Task 3.1:** Update .env.example ✓ 2025-12-12
  - Files: `.env.example` (+3 lines) ✓
  - Details: Added NEXT_PUBLIC_STREAMING_DISPLAY_MODE with documentation of all three modes ✓
- [x] **Task 3.2:** Update README if needed ✓ 2025-12-12
  - Files: `README.md` (skipped - .env.example sufficient) ✓
  - Details: Environment variable documentation in .env.example is sufficient for developers ✓

### Phase 4: Basic Code Validation (AI-Only)
**Goal:** Verify implementation without running application

- [x] **Task 4.1:** Lint Modified Files ✓ 2025-12-12
  - Files: `src/components/planner/StreamingReportView.tsx` ✓
  - Details: `npm run lint` passed with no errors ✓
- [x] **Task 4.2:** Type Check ✓ 2025-12-12
  - Files: All modified files ✓
  - Details: Pre-existing error in evacuation-routes.ts (unrelated), new code is type-safe ✓
- [x] **Task 4.3:** Read Final Implementation ✓ 2025-12-12
  - Files: `src/components/planner/StreamingReportView.tsx` ✓
  - Details: Verified 'none' mode rendering logic is correct and complete ✓

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 4, present "Implementation Complete!" message and wait for user approval of code review.

### Phase 5: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 5.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
- [ ] **Task 5.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, provide detailed summary

### Phase 6: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for UI/UX functionality

- [ ] **Task 6.1:** Present Testing Instructions
  - Files: N/A
  - Details: Provide clear instructions for user to test:
    - Set NEXT_PUBLIC_STREAMING_DISPLAY_MODE='none' in .env.local
    - Run plan wizard and verify text is hidden
    - Verify progress checkmarks are visible and update correctly
    - Test on different screen sizes
    - Test in both light and dark mode
- [ ] **Task 6.2:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp
- [ ] **Add brief completion notes** (file paths, key changes, etc.)

---

## 13. File Structure & Organization

### New Files to Create
No new files needed for this feature.

### Files to Modify
- [ ] **`src/components/plans/wizard/steps/StreamingGenerationStep.tsx`** - Add 'none' mode handling
- [ ] **`.env.example`** - Document new 'none' option
- [ ] **Type definition files** (if applicable) - Add 'none' to valid mode types

### Dependencies to Add
No new dependencies needed.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Invalid display mode value in environment variable
  - **Code Review Focus:** Default/fallback behavior when mode is not 'full', 'compact', or 'none'
  - **Potential Fix:** Gracefully default to 'full' mode with console warning

- [ ] **Error Scenario 2:** Progress indicators not visible in 'none' mode
  - **Code Review Focus:** CSS styling and layout in 'none' mode
  - **Potential Fix:** Ensure adequate spacing and visibility for progress elements

### Edge Cases to Consider
- [ ] **Edge Case 1:** Very narrow mobile screens in 'none' mode
  - **Analysis Approach:** Verify progress indicators are responsive and visible on 320px width
  - **Recommendation:** Test on mobile devices and adjust layout if needed

- [ ] **Edge Case 2:** Dark mode visibility of progress indicators
  - **Analysis Approach:** Verify contrast and visibility in dark theme
  - **Recommendation:** Ensure proper color contrast for accessibility

### Security & Access Control Review
- [ ] **No security concerns** - This is a UI display preference feature
- [ ] **No authentication/authorization changes** - Feature affects only display mode

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# Add to .env.local (or use existing variable)
# Valid values: 'full', 'compact', 'none'
NEXT_PUBLIC_STREAMING_DISPLAY_MODE=none
```

Update `.env.example` to document all three valid options.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
This task is straightforward and does not require strategic analysis - proceed directly to implementation after user approval of task document.

### Communication Preferences
- [ ] Ask for clarification if the exact location of display mode logic is unclear
- [ ] Provide updates after each phase completion
- [ ] Flag any unexpected complexity discovered during implementation

### Implementation Approach - CRITICAL WORKFLOW
Follow the standard workflow defined in the template:
1. ✅ Strategic evaluation complete (skipped - straightforward implementation)
2. ✅ Task document created and populated
3. Present implementation options to user (A/B/C choice)
4. Implement phase-by-phase after approval
5. Execute comprehensive code review
6. Request user browser testing

---

## 17. Notes & Additional Context

### Research Links
- Existing streaming display implementation in StreamingGenerationStep.tsx
- Current environment variable usage patterns in the project

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
This is a low-risk UI enhancement with minimal second-order effects.

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **No breaking changes** - Existing 'full' and 'compact' modes unaffected
- [ ] **Backward compatible** - Invalid values fall back to default behavior

#### 2. **Ripple Effects Assessment**
- [ ] **No data flow impact** - Only affects UI rendering
- [ ] **No cascading component effects** - Changes isolated to streaming display component
- [ ] **No state management changes** - Mode read from environment variable

#### 3. **Performance Implications**
- [ ] **Slight performance improvement** - Less DOM rendering when text is hidden
- [ ] **No database impact** - UI-only change
- [ ] **No bundle size increase** - Using existing React patterns

#### 4. **Security Considerations**
- [ ] **No security impact** - UI display preference only
- [ ] **No data exposure risk** - Doesn't affect data handling

#### 5. **User Experience Impacts**
- [ ] **Positive UX enhancement** - Provides users with more choice
- [ ] **No workflow disruption** - Optional feature, doesn't change defaults
- [ ] **No learning curve** - Simple on/off for text display

#### 6. **Maintenance Burden**
- [ ] **Minimal maintenance** - Simple conditional rendering logic
- [ ] **No new dependencies** - Using existing React/Tailwind patterns
- [ ] **Easy to test** - Visual verification of three display modes

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [ ] No critical issues identified

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Documentation:** Should we add user-facing documentation about display modes?
- [ ] **Default behavior:** Should we consider changing the default mode?

### Mitigation Strategies
Not applicable - low-risk UI enhancement.

---

*Template Version: 1.3*
*Last Updated: 12/12/2025*
*Created By: AI Assistant*
