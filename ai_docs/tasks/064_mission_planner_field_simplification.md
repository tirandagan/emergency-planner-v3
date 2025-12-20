# AI Task Template - Mission Planner Field Simplification

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Mission Planner Field Simplification - Remove Preparedness Level, Budget Range, 2-Week Duration & Reorder Home Type

### Goal Statement
**Goal:** Simplify the mission planner wizard by removing unnecessary fields (existing preparedness level, budget range, 2-week duration option) and reorganizing the UI to improve user flow. This change will streamline the planning experience and reduce complexity in the AI prompt system while maintaining all essential functionality. The changes should be reflected consistently across the entire application including forms, data display, database schema, and AI prompts.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The current mission planner wizard includes fields that add unnecessary complexity to both the user experience and the AI prompt system. Specifically:
- **Preparedness level** is difficult for users to self-assess accurately and adds complexity to AI prompts
- **Budget range** creates constraints that may discourage users from comprehensive planning
- **2-week duration** is an awkward middle ground between 1-week and 1-month options
- **Home type placement** should come earlier in the flow for better context gathering

These fields exist throughout the application ecosystem - in wizard forms, validation schemas, TypeScript types, database transformations, AI prompts, and potentially in product tagging systems.

### Solution Options Analysis

#### Option 1: Complete Removal with AI Prompt Refactoring
**Approach:** Remove all traces of preparedness level, budget tier, and 2-week duration from the wizard, database transformations, TypeScript types, validation schemas, and AI prompts. Reorder home type to appear immediately after location.

**Pros:**
- ✅ Simplest user experience - fewer fields to complete
- ✅ Cleaner AI prompts without budget/preparedness context
- ✅ Removes subjective self-assessment burden from users
- ✅ Faster wizard completion time
- ✅ Single source of truth - no inconsistencies across app

**Cons:**
- ❌ Existing saved wizard states in localStorage will have orphaned data
- ❌ Existing plans created with these fields cannot be edited (form won't populate)
- ❌ AI prompts need careful review to ensure they don't reference removed fields
- ❌ Product tagging system (if using 2-week timeframe) needs updating

**Implementation Complexity:** Medium - Requires changes across 15+ files including wizard components, schemas, prompts, and transformations
**Risk Level:** Medium - Primarily affects wizard flow; existing plan reports remain unchanged

#### Option 2: Deprecation with Backward Compatibility
**Approach:** Mark fields as deprecated/optional in the database and forms, but keep them in the schema for backward compatibility with existing saved states.

**Pros:**
- ✅ Existing saved wizard states won't break
- ✅ Existing plans can still be edited without data loss
- ✅ Gradual migration path for users
- ✅ Easier rollback if issues arise

**Cons:**
- ❌ Increased code complexity maintaining deprecated fields
- ❌ Confusion in codebase about which fields are active
- ❌ AI prompts become more complex with conditional logic
- ❌ Technical debt accumulates over time
- ❌ Unclear data model for future developers

**Implementation Complexity:** High - Requires conditional logic throughout the stack
**Risk Level:** Low - Very safe but creates technical debt

#### Option 3: Phased Removal with Migration Strategy
**Approach:** Phase 1: Hide fields from wizard UI but keep in schema. Phase 2: Remove from schema after 30 days when saved states expire.

**Pros:**
- ✅ Balances clean user experience with compatibility
- ✅ Provides migration window for users with saved states
- ✅ AI prompts can be updated immediately without breaking changes
- ✅ Clear timeline for complete removal

**Cons:**
- ❌ Two-phase implementation requires more planning
- ❌ Temporary complexity during transition period
- ❌ Requires calendar-based task tracking for Phase 2
- ❌ Still maintains some technical debt for 30 days

**Implementation Complexity:** High - Two separate implementation phases
**Risk Level:** Low - Gradual change minimizes disruption

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Complete Removal with AI Prompt Refactoring

**Why this is the best choice:**
1. **Development Stage Advantage** - Based on the CLAUDE.md context, this is "a new application in active development" with "no backwards compatibility concerns" and "data loss acceptable"
2. **User Base Context** - "Users are developers/testers" not production users, so breaking saved wizard states is acceptable
3. **Long-term Code Quality** - Eliminates technical debt rather than accumulating it with deprecated fields
4. **Consistent Experience** - Single, clean implementation across all parts of the application
5. **Simpler AI Prompts** - Removes complexity from prompt system that references budget/preparedness levels

**Key Decision Factors:**
- **Performance Impact:** Positive - Fewer fields to validate and process
- **User Experience:** Positive - Simpler wizard with fewer decisions
- **Maintainability:** Positive - Cleaner codebase without deprecated fields
- **Scalability:** Positive - Simpler data model scales better
- **Security:** Neutral - No security implications

**Alternative Consideration:**
Option 3 (Phased Removal) would be the better choice if this were a production application with paying users. However, given the development context and user base, the complexity of a phased approach isn't justified.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 1 - Complete Removal), or would you prefer a different approach?

**Questions for you to consider:**
- Does the recommended solution align with your priorities for simplifying the wizard?
- Are there any specific concerns about removing these fields completely?
- Do you have existing test data or plans that need to be preserved?
- Are there other fields or aspects of the wizard you'd like to address simultaneously?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan with detailed steps and present you with next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** PostgreSQL via Supabase, Drizzle ORM for queries
- **UI & Styling:** Shadcn/ui components with Tailwind CSS v4 for styling
- **Authentication:** Supabase Auth managed by middleware.ts for protected routes
- **AI Integration:** OpenRouter API (Claude Sonnet 3.5) with file-based prompts in `prompts/` directory
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Components:**
  - `src/components/plans/wizard/PlanWizard.tsx` - Main wizard orchestrator
  - `src/components/plans/wizard/steps/LocationStep.tsx` - Step 3 UI with fields to remove
  - `src/components/plans/wizard/steps/PersonnelStep.tsx` - Step 2 (no changes needed)
  - `src/lib/wizard/transform-plan-data.ts` - Data transformation utilities
  - `prompts/mission-generation/` - AI prompt templates

### Current State

**Wizard Flow (4 steps):**
1. **Scenarios** - Select disaster scenarios to plan for
2. **Personnel** - Configure family members and their needs
3. **Location & Context** - Specify location, duration, home type, preparedness level, budget (TO BE MODIFIED)
4. **Generate Plan** - AI streaming generation

**Fields to Remove:**
- `existingPreparedness`: 'none' | 'basic' | 'moderate' | 'advanced' (LocationStep line 113-118, 229-289)
- `budgetTier`: 'LOW' | 'MEDIUM' | 'HIGH' (LocationStep line 120-124, 354-413)
- `durationDays: 14` from duration options array (LocationStep line 98)

**Fields to Reorder:**
- Move `homeType` selection to appear immediately after `location` (currently in Row 2, line 294-352)
- New order: Location → Home Type → Duration (without 2 weeks)

**Current File Structure:**
- **Wizard UI:** `src/components/plans/wizard/steps/LocationStep.tsx` (lines 95-417)
- **Validation:** `src/lib/validation/wizard.ts` (lines 89-110 for locationContextSchema)
- **Types:** `src/types/wizard.ts` (lines 46-59 for WizardFormData)
- **Transform:** `src/lib/wizard/transform-plan-data.ts` (lines 62-78 for defaults)
- **Prompts:** Multiple files in `prompts/` directory reference {{budget_tier}} and preparedness
- **Products:** `src/db/schema/products.ts` - timeframes array may contain "2 weeks" tags

### Existing Context Providers Analysis
- **UserContext (`useUser()`):** Provides user authentication state, profile data
- **UsageContext (`useUsage()`):** Provides billing/subscription data
- **Context Hierarchy:** Protected routes use both contexts via (protected)/layout.tsx
- **Available Context Hooks:** `useUser()`, `useUsage()`

**🔍 Context Coverage Analysis:**
- User data already available via UserContext (no props needed for user info)
- Wizard components don't currently use context providers
- Plan wizard operates independently with form state management
- No context changes needed for this task

## 4. Context & Problem Definition

### Problem Statement
The mission planner wizard currently asks users to self-assess their "preparedness level" and specify a "budget range", both of which create unnecessary complexity:

**Preparedness Level Issues:**
- Subjective and difficult for users to self-assess accurately
- Adds complexity to AI prompt generation
- Not consistently used in final plan generation
- Creates cognitive overhead during wizard completion

**Budget Range Issues:**
- May discourage users from comprehensive planning ("I selected LOW budget, so I'll get bare-minimum recommendations")
- Creates artificial constraints in AI recommendations
- Not necessary for generating useful preparedness plans
- Referenced in 40+ locations across prompts

**2-Week Duration Issues:**
- Awkward middle ground between 1 week and 1 month
- Not a standard preparedness timeframe
- May be tagged in product classification system
- Creates validation complexity (must be one of 6 specific values)

**Home Type Ordering Issues:**
- Currently appears after duration and preparedness level
- Should appear earlier for better context flow
- Location → Home Type is a logical progression

### Success Criteria
- [ ] Wizard no longer displays preparedness level selection
- [ ] Wizard no longer displays budget range selection
- [ ] Duration options exclude 2-week option (show only: 3 days, 1 week, 1 month, 3 months, 1 year+)
- [ ] Home type appears immediately after location selection
- [ ] TypeScript types updated to remove optional fields
- [ ] Validation schemas no longer require these fields
- [ ] AI prompts no longer reference {{preparedness}}, {{budget_tier}}, or {{existingPreparedness}}
- [ ] Product tagging system doesn't reference "2 weeks" timeframe
- [ ] Transform utilities handle missing fields gracefully
- [ ] Existing wizard localStorage states won't break (or are cleared)
- [ ] Application compiles without TypeScript errors
- [ ] Wizard flow remains smooth and intuitive

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
- Wizard Step 3 (Location & Context) displays only: Location, Home Type, Duration
- Home Type section appears immediately after Location section
- Duration options are: 3 days, 7 days, 30 days, 90 days, 365 days (no 14 days)
- Wizard validation passes without preparedness/budget fields
- AI prompt system generates plans without budget/preparedness context
- Form defaults populate without budget/preparedness values
- Edit mode for existing plans works without requiring these fields

### Non-Functional Requirements
- **Performance:** No performance impact - removing fields improves wizard speed
- **Security:** No security implications
- **Usability:** Improved user experience with fewer fields to complete
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Works in modern browsers (Chrome, Firefox, Safari, Edge)

### Technical Constraints
- Must maintain existing wizard localStorage save/restore mechanism (or clear on breaking changes)
- Cannot modify database schema (no migration needed - these fields aren't stored in mission_reports)
- Must maintain type safety throughout wizard flow
- AI prompts must remain coherent without budget/preparedness context

---

## 7. Data & Database Changes

### Database Schema Changes
**NO DATABASE MIGRATION REQUIRED**

Analysis of database schema:
- `mission_reports` table does NOT store `existingPreparedness` or `budgetTier` directly
- These fields are used only during wizard flow and AI prompt generation
- Final mission reports store only the generated plan content, not wizard inputs
- The `transform-plan-data.ts` utility sets defaults for editing, but these can be removed

### Data Model Updates
```typescript
// src/types/wizard.ts - WizardFormData interface (lines 46-59)
// BEFORE:
export interface WizardFormData {
  // Step 1: Scenario Selection
  scenarios: ScenarioType[];

  // Step 2: Personnel Configuration
  familyMembers: FamilyMember[];

  // Step 3: Location & Context
  location: LocationData;
  durationDays: number; // 3, 7, 14, 30, 90, 365
  homeType: 'apartment' | 'house' | 'condo' | 'rural' | 'mobile' | 'other';
  existingPreparedness: 'none' | 'basic' | 'moderate' | 'advanced'; // REMOVE
  budgetTier: 'LOW' | 'MEDIUM' | 'HIGH'; // REMOVE
}

// AFTER:
export interface WizardFormData {
  // Step 1: Scenario Selection
  scenarios: ScenarioType[];

  // Step 2: Personnel Configuration
  familyMembers: FamilyMember[];

  // Step 3: Location & Context
  location: LocationData;
  homeType: 'apartment' | 'house' | 'condo' | 'rural' | 'mobile' | 'other';
  durationDays: number; // 3, 7, 30, 90, 365 (removed 14)
}
```

```typescript
// src/lib/validation/wizard.ts - locationContextSchema (lines 89-110)
// BEFORE:
export const locationContextSchema = z.object({
  location: locationDataSchema,
  durationDays: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number',
    })
    .int('Duration must be a whole number')
    .refine(
      (val) => [3, 7, 14, 30, 90, 365].includes(val),
      'Duration must be 3, 7, 14, 30, 90, or 365 days'
    ),
  homeType: z.enum(['apartment', 'house', 'condo', 'rural', 'mobile', 'other'], {
    errorMap: () => ({ message: 'Please select a home type' }),
  }),
  existingPreparedness: z.enum(['none', 'basic', 'moderate', 'advanced'], { // REMOVE
    errorMap: () => ({ message: 'Please select your current preparedness level' }),
  }),
  budgetTier: z.enum(['LOW', 'MEDIUM', 'HIGH'], { // REMOVE
    errorMap: () => ({ message: 'Please select a budget tier' }),
  }),
});

// AFTER:
export const locationContextSchema = z.object({
  location: locationDataSchema,
  homeType: z.enum(['apartment', 'house', 'condo', 'rural', 'mobile', 'other'], {
    errorMap: () => ({ message: 'Please select a home type' }),
  }),
  durationDays: z
    .number({
      required_error: 'Duration is required',
      invalid_type_error: 'Duration must be a number',
    })
    .int('Duration must be a whole number')
    .refine(
      (val) => [3, 7, 30, 90, 365].includes(val),
      'Duration must be 3, 7, 30, 90, or 365 days'
    ),
});
```

### Data Migration Plan
- [ ] Clear wizard localStorage states on first load after update (optional - will auto-clear on validation failure)
- [ ] No database migration needed - fields not persisted
- [ ] Existing mission reports remain unchanged

### 🚨 MANDATORY: Down Migration Safety Protocol
**NOT REQUIRED** - No database schema changes are being made. These fields exist only in the TypeScript type system and wizard UI, not in the database.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

#### **NO API CHANGES NEEDED**
This task affects only:
- Client-side wizard UI components
- TypeScript types and validation schemas
- AI prompt template files (static markdown files)
- Data transformation utilities

#### **NO SERVER ACTIONS CHANGES NEEDED**
The existing server action for mission generation (`src/app/actions/generate-mission-streaming.ts`) will receive a simplified `WizardFormData` object, but the function signature doesn't change.

#### **NO DATABASE QUERIES CHANGES NEEDED**
Database queries are unaffected because these fields were never persisted to the database.

### Server Actions
No server action changes required.

### Database Queries
No database query changes required.

### API Routes (Only for Special Cases)
No API route changes required.

### External Integrations
- **OpenRouter API:** Continues to work with simplified prompts
- **Google Places API:** Continues to work for location autocomplete
- **AI Prompt System:** Requires updates to remove {{budget_tier}} and {{preparedness}} placeholders

**🚨 MANDATORY: Use Latest AI Models**
- Continue using **gemini-2.5-flash** for any Gemini operations
- Continue using **gpt-4o** for any OpenAI operations
- OpenRouter Claude Sonnet 3.5 (primary model) unchanged

---

## 9. Frontend Changes

### New Components
No new components needed.

### Modified Components

#### Component 1: `src/components/plans/wizard/steps/LocationStep.tsx`
**Purpose:** Remove preparedness level and budget tier selections, remove 2-week duration, reorder home type
**Current Location:** Lines 95-417
**Changes Needed:**
- Remove `PREPAREDNESS_LEVELS` constant (lines 113-118)
- Remove `BUDGET_TIERS` constant (lines 120-124)
- Remove 14-day option from `DURATION_OPTIONS` array (line 98)
- Move home type section (lines 294-352) to appear after location section (currently at line 166)
- Remove preparedness level UI section (lines 229-289)
- Remove budget tier UI section (lines 354-413)
- Update grid layout from 2-column to single-column for remaining fields

#### Component 2: `src/components/plans/wizard/PlanWizard.tsx`
**Purpose:** Update default form values
**Current Location:** Lines 91-105
**Changes Needed:**
- Remove `existingPreparedness: 'none'` from INITIAL_FORM_DATA (line 103)
- Remove `budgetTier: 'MEDIUM'` from INITIAL_FORM_DATA (line 104)
- Update durationDays default to 7 (currently correct, line 101)

#### Component 3: `src/lib/wizard/transform-plan-data.ts`
**Purpose:** Remove default values for removed fields
**Current Location:** Lines 13-81
**Changes Needed:**
- Remove lines 62-63: `wizardData.existingPreparedness = 'basic';`
- Remove lines 65-78: Budget tier mapping logic
- Update function to not set these fields

### Page Updates
No page-level changes needed.

### State Management
- React Hook Form state management remains the same
- localStorage save/restore mechanism remains functional
- Validation will automatically fail for old saved states with extra fields (acceptable behavior)

### 🚨 CRITICAL: Context Usage Strategy

**Context Analysis:**
- Wizard components operate independently with local form state
- No context providers are used in wizard flow
- User data (if needed) is accessed via props passed from parent
- No changes to context usage needed for this task

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

#### File: `src/components/plans/wizard/steps/LocationStep.tsx`
```tsx
// Lines 95-102: Duration options including 2 weeks
const DURATION_OPTIONS = [
  { value: 3, label: '3 days', description: 'Short-term', dots: 0.5, isMax: false },
  { value: 7, label: '1 week', description: 'Basic prep', dots: 1, isMax: false },
  { value: 14, label: '2 weeks', description: 'Standard', dots: 2, isMax: false }, // REMOVE
  { value: 30, label: '1 month', description: 'Extended', dots: 4, isMax: false },
  { value: 90, label: '3 months', description: 'Long-term', dots: 12, isMax: false },
  { value: 365, label: '1 year+', description: 'Maximum', dots: 12, isMax: true },
];

// Lines 113-124: Preparedness and Budget constants - REMOVE ENTIRELY
const PREPAREDNESS_LEVELS = [
  { value: 'none', label: 'No Preparation', description: 'From scratch', icon: ShieldOff },
  { value: 'basic', label: 'Basic', description: 'Some supplies', icon: Shield },
  { value: 'moderate', label: 'Moderate', description: 'Good foundation', icon: ShieldCheck },
  { value: 'advanced', label: 'Advanced', description: 'Comprehensive', icon: ShieldAlert },
];

const BUDGET_TIERS = [
  { value: 'LOW', label: 'Budget', description: 'Under $500', icon: Coins },
  { value: 'MEDIUM', label: 'Standard', description: '$500 - $1,500', icon: DollarSign },
  { value: 'HIGH', label: 'Premium', description: '$1,500+', icon: Banknote },
];

// Current layout structure (simplified):
<div className="space-y-8">
  {/* Location - stays */}
  <LocationAutocomplete />

  {/* Row 1: Duration + Preparedness - REMOVE preparedness, keep duration */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <DurationSelection />
    <PreparednessSelection /> {/* REMOVE */}
  </div>

  {/* Row 2: Home Type + Budget - MOVE home type up, REMOVE budget */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <HomeTypeSelection /> {/* MOVE THIS UP */}
    <BudgetSelection /> {/* REMOVE */}
  </div>
</div>
```

#### File: `src/types/wizard.ts`
```typescript
// Lines 46-59: Current interface
export interface WizardFormData {
  // Step 1: Scenario Selection
  scenarios: ScenarioType[];

  // Step 2: Personnel Configuration
  familyMembers: FamilyMember[];

  // Step 3: Location & Context
  location: LocationData;
  durationDays: number; // 3, 7, 14, 30, 90, 365
  homeType: 'apartment' | 'house' | 'condo' | 'rural' | 'mobile' | 'other';
  existingPreparedness: 'none' | 'basic' | 'moderate' | 'advanced'; // REMOVE
  budgetTier: 'LOW' | 'MEDIUM' | 'HIGH'; // REMOVE
}
```

#### File: `prompts/mission-generation/system-prompt.md`
```markdown
<!-- Lines 8, 20, 122 reference budget -->
- **Resource Optimization:** Budget-conscious recommendations without sacrificing safety

1. **Personalization Over Generic Advice**
   - Respect budget constraints while maintaining safety

- ✅ Account for budget tiers (alternatives at different price points)
```

### 📂 **After Refactor**

#### File: `src/components/plans/wizard/steps/LocationStep.tsx`
```tsx
// Duration options WITHOUT 2 weeks
const DURATION_OPTIONS = [
  { value: 3, label: '3 days', description: 'Short-term', dots: 0.5, isMax: false },
  { value: 7, label: '1 week', description: 'Basic prep', dots: 1, isMax: false },
  { value: 30, label: '1 month', description: 'Extended', dots: 4, isMax: false },
  { value: 90, label: '3 months', description: 'Long-term', dots: 12, isMax: false },
  { value: 365, label: '1 year+', description: 'Maximum', dots: 12, isMax: true },
];

// REMOVED: PREPAREDNESS_LEVELS constant
// REMOVED: BUDGET_TIERS constant

// New simplified layout structure:
<div className="space-y-8">
  {/* Location - stays */}
  <LocationAutocomplete />

  {/* Home Type - MOVED UP, now appears right after location */}
  <HomeTypeSelection />

  {/* Duration - now standalone, no grid */}
  <DurationSelection />
</div>
```

#### File: `src/types/wizard.ts`
```typescript
// Simplified interface
export interface WizardFormData {
  // Step 1: Scenario Selection
  scenarios: ScenarioType[];

  // Step 2: Personnel Configuration
  familyMembers: FamilyMember[];

  // Step 3: Location & Context
  location: LocationData;
  homeType: 'apartment' | 'house' | 'condo' | 'rural' | 'mobile' | 'other';
  durationDays: number; // 3, 7, 30, 90, 365
}
```

#### File: `prompts/mission-generation/system-prompt.md`
```markdown
<!-- Budget references REMOVED or made generic -->
- **Resource Optimization:** Practical recommendations balancing cost and safety

1. **Personalization Over Generic Advice**
   - Provide practical, achievable solutions

- ✅ Provide alternatives at different price points as relevant
```

### 🎯 **Key Changes Summary**
- **LocationStep.tsx:**
  - Removed PREPAREDNESS_LEVELS constant (6 lines)
  - Removed BUDGET_TIERS constant (6 lines)
  - Removed 2-week option from DURATION_OPTIONS (1 line)
  - Removed preparedness UI section (~60 lines)
  - Removed budget UI section (~60 lines)
  - Reordered home type to appear after location (~10 lines moved)
  - Simplified grid layout structure

- **wizard.ts types:**
  - Removed existingPreparedness field (1 line)
  - Removed budgetTier field (1 line)
  - Updated durationDays comment (removed 14)

- **validation/wizard.ts:**
  - Removed existingPreparedness enum validation (3 lines)
  - Removed budgetTier enum validation (3 lines)
  - Updated durationDays refine array (removed 14)

- **PlanWizard.tsx:**
  - Removed existingPreparedness from defaults (1 line)
  - Removed budgetTier from defaults (1 line)

- **transform-plan-data.ts:**
  - Removed existingPreparedness default assignment (2 lines)
  - Removed budgetTier mapping logic (15 lines)

- **AI Prompts (40+ files):**
  - Remove/update all references to {{budget_tier}}
  - Remove/update all references to {{preparedness}} or {{existingPreparedness}}
  - Update selection-criteria.md budget scoring logic

- **Files Modified:**
  - 1 main component (LocationStep.tsx)
  - 3 TypeScript files (types, validation, transform)
  - 1 wizard orchestrator (PlanWizard.tsx)
  - 40+ prompt template files

- **Impact:**
  - ~150 lines of UI code removed
  - Simplified wizard flow from 5 inputs to 3 inputs in Step 3
  - Cleaner AI prompts without budget/preparedness context
  - Better user flow with home type appearing earlier

---

## 11. Implementation Plan

### Phase 1: TypeScript Types and Validation Updates
**Goal:** Update core type definitions and validation schemas

- [ ] **Task 1.1:** Update WizardFormData Interface
  - Files: `src/types/wizard.ts` (line 57-58)
  - Details: Remove `existingPreparedness` and `budgetTier` fields
- [ ] **Task 1.2:** Update Validation Schema
  - Files: `src/lib/validation/wizard.ts` (lines 98-109)
  - Details: Remove preparedness and budget validation, update duration array
- [ ] **Task 1.3:** Verify TypeScript Compilation
  - Command: `npm run type-check`
  - Details: Ensure no type errors after removing fields

### Phase 2: Wizard UI Component Updates
**Goal:** Remove UI elements and reorder home type

- [ ] **Task 2.1:** Update LocationStep Constants
  - Files: `src/components/plans/wizard/steps/LocationStep.tsx` (lines 95-124)
  - Details: Remove PREPAREDNESS_LEVELS, BUDGET_TIERS, remove 14 from DURATION_OPTIONS
- [ ] **Task 2.2:** Reorder Home Type Section
  - Files: `src/components/plans/wizard/steps/LocationStep.tsx` (lines 294-352)
  - Details: Move home type section to appear after location section (after line 166)
- [ ] **Task 2.3:** Remove Preparedness UI Section
  - Files: `src/components/plans/wizard/steps/LocationStep.tsx` (lines 229-289)
  - Details: Delete entire preparedness level selection UI
- [ ] **Task 2.4:** Remove Budget UI Section
  - Files: `src/components/plans/wizard/steps/LocationStep.tsx` (lines 354-413)
  - Details: Delete entire budget tier selection UI
- [ ] **Task 2.5:** Update Layout Grid Structure
  - Files: `src/components/plans/wizard/steps/LocationStep.tsx`
  - Details: Simplify grid layouts from 2-column to single-column where needed

### Phase 3: Wizard Defaults and Transform Updates
**Goal:** Update default values and data transformation utilities

- [ ] **Task 3.1:** Update PlanWizard Defaults
  - Files: `src/components/plans/wizard/PlanWizard.tsx` (lines 103-104)
  - Details: Remove existingPreparedness and budgetTier from INITIAL_FORM_DATA
- [ ] **Task 3.2:** Update Transform Utility
  - Files: `src/lib/wizard/transform-plan-data.ts` (lines 62-78)
  - Details: Remove preparedness default and budget mapping logic

### Phase 4: AI Prompt System Updates
**Goal:** Remove budget/preparedness references from all prompt templates

- [ ] **Task 4.1:** Update System Prompt
  - Files: `prompts/mission-generation/system-prompt.md` (lines 8, 20, 122)
  - Details: Remove or genericize budget references
- [ ] **Task 4.2:** Update Scenario Prompts
  - Files: `prompts/mission-generation/scenarios/*.md`
  - Details: Remove {{budget_tier}} placeholders from all scenario files
- [ ] **Task 4.3:** Update Bundle Recommendation Prompts
  - Files: `prompts/bundle-recommendations/*.md`
  - Details: Remove budget tier filtering and scoring logic
- [ ] **Task 4.4:** Verify Prompt Template Syntax
  - Files: All files in `prompts/` directory
  - Details: Search for remaining {{budget}}, {{preparedness}} references

### Phase 5: Product Tagging Review (Optional)
**Goal:** Check if 2-week timeframe is used in product tagging

- [ ] **Task 5.1:** Search Product Timeframes
  - Files: Database query on `master_items.timeframes` and `specific_products.timeframes`
  - Details: Check if any products are tagged with "2 weeks" or "14 days"
- [ ] **Task 5.2:** Update Product Tags (If Found)
  - Files: Database update if "2 weeks" tags exist
  - Details: Decide on replacement tag (1 week or 1 month) and update

### Phase 6: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only

- [ ] **Task 6.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run `npm run lint` - NEVER run dev server, build, or start commands
- [ ] **Task 6.2:** TypeScript Compilation Check
  - Files: All TypeScript files
  - Details: Run `npm run type-check` to verify no type errors
- [ ] **Task 6.3:** Static Logic Review
  - Files: Modified wizard components
  - Details: Read code to verify logic, edge cases, validation handling

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
**Goal:** Request human testing for wizard functionality

- [ ] **Task 8.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing
- [ ] **Task 8.2:** Request User Wizard Testing
  - Files: Specific browser testing checklist for user
  - Details:
    - Test wizard flow from start to finish
    - Verify location → home type → duration order
    - Confirm no preparedness/budget fields appear
    - Test form validation
    - Test wizard save/restore (may clear localStorage)
    - Generate a test plan to verify AI prompts work correctly
- [ ] **Task 8.3:** Wait for User Confirmation
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
### Phase 1: TypeScript Types and Validation Updates
**Goal:** Update core type definitions and validation schemas

- [x] **Task 1.1:** Update WizardFormData Interface ✓ 2025-12-20
  - Files: `src/types/wizard.ts` ✓
  - Details: Removed existingPreparedness and budgetTier fields (lines 57-58) ✓
- [x] **Task 1.2:** Update Validation Schema ✓ 2025-12-20
  - Files: `src/lib/validation/wizard.ts` ✓
  - Details: Removed preparedness enum (lines 104-106), removed budget enum (lines 107-109), updated duration array to exclude 14 (line 98) ✓
- [x] **Task 1.3:** Verify TypeScript Compilation ✓ 2025-12-20
  - Command: `npm run type-check` executed successfully ✓
  - Details: Zero type errors after field removal ✓
```

---

## 13. File Structure & Organization

### New Files to Create
None - all changes are modifications to existing files.

### Files to Modify
- [ ] **`src/types/wizard.ts`** - Remove preparedness and budget fields from WizardFormData
- [ ] **`src/lib/validation/wizard.ts`** - Remove field validation, update duration options
- [ ] **`src/components/plans/wizard/steps/LocationStep.tsx`** - Major UI refactor
- [ ] **`src/components/plans/wizard/PlanWizard.tsx`** - Update default values
- [ ] **`src/lib/wizard/transform-plan-data.ts`** - Remove default assignments
- [ ] **`prompts/mission-generation/system-prompt.md`** - Remove budget references
- [ ] **`prompts/mission-generation/scenarios/*.md`** - Remove {{budget_tier}} placeholders
- [ ] **`prompts/bundle-recommendations/*.md`** - Remove budget filtering logic

### Dependencies to Add
None - no new dependencies required.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Old wizard localStorage states with preparedness/budget fields
  - **Code Review Focus:** `PlanWizard.tsx` loadSavedState function (lines 28-44)
  - **Potential Fix:** Validation will fail gracefully, wizard will start fresh (acceptable)
- [ ] **Error Scenario 2:** AI prompt system receives undefined for removed fields
  - **Code Review Focus:** `src/lib/prompts.ts` buildMegaPrompt function
  - **Potential Fix:** Remove template placeholders before building prompts
- [ ] **Error Scenario 3:** Form validation fails for edited plans
  - **Code Review Focus:** Validation schema in `wizard.ts`, transform in `transform-plan-data.ts`
  - **Potential Fix:** Ensure transform utility doesn't set removed fields

### Edge Cases to Consider
- [ ] **Edge Case 1:** User has wizard in progress with preparedness/budget filled
  - **Analysis Approach:** Test localStorage restore with old saved state
  - **Recommendation:** Clear localStorage on app load or let validation fail gracefully
- [ ] **Edge Case 2:** Product catalog has "2 weeks" in timeframes array
  - **Analysis Approach:** Query database for products with "2 weeks" tag
  - **Recommendation:** Update tags to "1 week" or "1 month" based on product type
- [ ] **Edge Case 3:** Existing mission reports reference budget/preparedness
  - **Analysis Approach:** Check mission_reports table schema
  - **Recommendation:** No action needed - reports store generated text, not wizard inputs

### Security & Access Control Review
- [ ] **Admin Access Control:** No admin features affected
  - **Check:** No changes to admin routes or permissions
- [ ] **Authentication State:** No authentication changes
  - **Check:** Wizard still requires authentication via middleware
- [ ] **Form Input Validation:** Simplified validation reduces attack surface
  - **Check:** Fewer fields to validate, same security standards apply
- [ ] **Permission Boundaries:** No permission changes
  - **Check:** Users can still only edit their own plans

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points from removing fields. Verify that:
1. Form validation handles missing fields gracefully
2. AI prompt system doesn't break with undefined template variables
3. Data transformation utilities don't crash without these fields
4. Type system catches any remaining references to removed fields

**Priority Order:**
1. **Critical:** Type safety - ensure TypeScript compilation succeeds
2. **Important:** Form validation - ensure wizard flow works without fields
3. **Nice-to-have:** Clear localStorage to avoid confusion with old states

---

## 15. Deployment & Configuration

### Environment Variables
No environment variable changes needed.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
When a user requests any new feature, improvement, or significant change, your **DEFAULT BEHAVIOR** should be:

1. **EVALUATE STRATEGIC NEED** - Determine if multiple solutions exist or if it's straightforward ✓ (COMPLETED)
2. **STRATEGIC ANALYSIS** (if needed) - Present solution options with pros/cons and get user direction ✓ (COMPLETED)
3. **CREATE A TASK DOCUMENT** in `ai_docs/` using this template ✓ (COMPLETED)
4. **GET USER APPROVAL** of the task document (PENDING)
5. **IMPLEMENT THE FEATURE** only after approval

### Communication Preferences
- [ ] Ask for clarification if requirements are unclear ✓
- [ ] Provide regular progress updates during implementation
- [ ] Flag any blockers or concerns immediately
- [ ] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)** ✓ COMPLETED

2. **STRATEGIC ANALYSIS SECOND (If needed)** ✓ COMPLETED

3. **CREATE TASK DOCUMENT THIRD (Required)** ✓ COMPLETED

4. **PRESENT IMPLEMENTATION OPTIONS (Required)**

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples. (Note: Section 10 already includes this preview)

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns. Specific areas you might want clarified:
   - Should we also review other wizard fields while we're at it?
   - Do you want to preserve any existing saved wizard states in localStorage?
   - Are there specific AI prompt templates that need extra attention?
   - Should we update any other parts of the app that display these fields?

5. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

   **MANDATORY PHASE WORKFLOW:**

   For each phase, follow this exact pattern:

   a. **Execute Phase Completely** - Complete all tasks in current phase
   b. **Update Task Document** - Mark all completed tasks as [x] with timestamps
   c. **Provide Specific Phase Recap** with file paths and changes
   d. **Wait for "proceed"** before starting next phase
   e. **Repeat for each phase** until all implementation complete
   f. **🚨 CRITICAL:** After final implementation phase, proceed to comprehensive code review

   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
   - [ ] Real-time task completion tracking
   - [ ] Run linting on modified files (static analysis only)
   - [ ] NEVER run dev server/build commands
   - [ ] Always create components in proper directories
   - [ ] Update task document after each subtask

6. **VERIFY LIB FILE ARCHITECTURE (For any lib/ changes)**
   - Not applicable for this task (no lib/ file architecture changes)

7. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after all phases)**
   - Present "Implementation Complete!" message
   - Wait for user approval of code review
   - Execute comprehensive code review process

8. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
   - Read all modified files
   - Run linting and type-checking
   - Check for integration issues
   - Verify all success criteria met
   - Provide detailed review summary

### What Constitutes "Explicit User Approval"

#### For Implementation Options (A/B/C Choice)
**✅ OPTION A RESPONSES (Show detailed code previews):**
- "A" or "Option A"
- "Show me the changes"
- "Preview first"

**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start"
- "Looks good, implement it"

**✅ OPTION C RESPONSES (Provide more feedback):**
- "C" or "Option C"
- "I have questions about..."
- "Can you modify..."

🛑 **NEVER start coding without explicit A/B/C choice from user!**

### Code Quality Standards
- [ ] Follow TypeScript best practices ✓
- [ ] Add proper error handling
- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
- [ ] **🚨 MANDATORY: Use early returns to keep code clean and readable**
- [ ] **🚨 MANDATORY: Use async/await instead of .then() chaining**
- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
- [ ] Ensure responsive design (mobile-first approach)
- [ ] Test components in both light and dark mode
- [ ] Follow accessibility guidelines (WCAG AA)
- [ ] Use semantic HTML elements
- [ ] **🚨 MANDATORY: Clean up removal artifacts**

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern** (no server changes needed)
- [ ] **🚨 VERIFY: No server/client boundary violations in lib files** (not applicable)
- [ ] **🚨 VERIFY: Proper context usage patterns** (not applicable - no context used)

---

## 17. Notes & Additional Context

### Research Links
- Wizard validation patterns: `src/lib/validation/wizard.ts`
- AI prompt template system: `prompts/README.md`
- Mission generation flow: `ai_docs/diagrams/001_plan_creation_to_report_generation.md`

### Questions to Clarify with User
1. Should we completely clear localStorage wizard states, or let them fail validation naturally?
2. Are there any specific AI prompt files you want me to pay special attention to?
3. Do you want to review the product tagging system for "2 weeks" references, or defer this?
4. Should we add any new fields to replace preparedness/budget, or keep it truly simplified?
5. Are there any other wizard fields you'd like to reconsider while we're refactoring?

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No API contracts broken - wizard is client-side only
- [ ] **Database Dependencies:** No database dependencies - fields not persisted
- [ ] **Component Dependencies:** LocationStep is self-contained; parent components unaffected
- [ ] **Authentication/Authorization:** No auth/authz changes

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** Simplified data flow - fewer fields to validate and pass to AI
- [ ] **UI/UX Cascading Effects:** Home type reordering improves context flow
- [ ] **State Management:** localStorage states with old fields will be invalidated (acceptable)
- [ ] **Routing Dependencies:** No routing changes

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** No database queries affected
- [ ] **Bundle Size:** Slight reduction from removing UI components
- [ ] **Server Load:** Reduced AI prompt complexity may slightly improve generation speed
- [ ] **Caching Strategy:** No caching changes needed

#### 4. **Security Considerations**
- [ ] **Attack Surface:** Reduced attack surface with fewer form fields
- [ ] **Data Exposure:** No data exposure risks
- [ ] **Permission Escalation:** No permission changes
- [ ] **Input Validation:** Simplified validation with fewer fields

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** Positive - faster wizard completion
- [ ] **Data Migration:** Users with in-progress wizards will restart (acceptable in dev)
- [ ] **Feature Deprecation:** Removing subjective fields improves clarity
- [ ] **Learning Curve:** Reduced learning curve with simpler wizard

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Reduced complexity with fewer fields
- [ ] **Dependencies:** No new dependencies
- [ ] **Testing Overhead:** Reduced testing surface with fewer fields
- [ ] **Documentation:** Prompt templates require updates

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
None identified - this is a simplification with no major risks.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Existing Wizard States:** Users with in-progress wizards will need to restart
- [ ] **AI Prompt Updates:** Need to verify all 40+ prompt files are updated correctly
- [ ] **Product Tagging:** May need to update product timeframes if "2 weeks" is used

### Mitigation Strategies

#### Wizard State Handling
- [ ] **Clear State on Load:** Optionally clear wizard localStorage on first load after update
- [ ] **Validation Fallback:** Let validation fail gracefully for old states
- [ ] **User Communication:** No communication needed (development users)

#### AI Prompt Verification
- [ ] **Systematic Search:** Search all prompt files for {{budget}}, {{preparedness}} references
- [ ] **Template Testing:** Generate test plan to verify prompts work without these fields
- [ ] **Gradual Rollout:** Update prompts in phases (system → scenarios → bundles)

#### Product Tagging Review
- [ ] **Database Query:** Check if any products use "2 weeks" timeframe
- [ ] **Tag Replacement:** Update to nearest valid option (1 week or 1 month)
- [ ] **Admin Notification:** Note in admin panel if manual review needed

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections of impact assessment filled out
- [x] **Identify Critical Issues:** No red flags identified, 3 yellow flags noted
- [x] **Propose Mitigation:** Mitigation strategies provided for wizard states, prompts, tagging
- [x] **Alert User:** Yellow flags will be mentioned in implementation options
- [x] **Recommend Alternatives:** Option 1 (complete removal) recommended based on development context

### Example Analysis Summary

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- No breaking changes to APIs or database
- Client-side wizard state in localStorage will be invalidated (acceptable in dev)

**Performance Implications:**
- Positive: Fewer form fields to validate
- Positive: Simpler AI prompts may speed up generation slightly
- Neutral: No significant bundle size change

**User Experience Impacts:**
- Positive: Faster wizard completion (3 fields instead of 5 in Step 3)
- Positive: Less cognitive overhead (no subjective self-assessment)
- Neutral: Home type appears earlier (better context flow)

**Mitigation Recommendations:**
- Let localStorage validation fail gracefully (no special handling needed)
- Systematically update all AI prompt templates
- Query database for "2 weeks" product tags and update if found

**🚨 USER ATTENTION REQUIRED:**
None - this is a simplification with minimal risk. All impacts are neutral or positive.
```

---

*Template Version: 1.3*
*Last Updated: 12/20/2025*
*Created By: Claude Sonnet 4.5*
