# AI Task Template

> **Task Document for Adding Household Members Profile Persistence to Plan Wizard**

---

## 1. Task Overview

### Task Title
**Add Household Members Profile Persistence to Plan Wizard Step 2**

### Goal Statement
Enable users to save and reuse their household member configurations across multiple emergency plan creations. When users configure household members in Step 2 of the plan wizard, their selections (names, ages, genders, medical conditions, special needs) should be saved to their profile and automatically available for future plan generation, streamlining the planning process and reducing repetitive data entry.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
This is a straightforward feature with a clear implementation path - adding a JSONB field to store household member data and implementing auto-save/auto-load logic. Strategic analysis can be skipped in favor of direct implementation.

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
  - `components/plans/wizard/steps/PersonnelStep.tsx` - Current Step 2 UI for household members
  - `components/plans/wizard/CompactPersonCard.tsx` - Individual family member card component
  - `components/plans/wizard/PlanWizard.tsx` - Main wizard orchestrator with form state management
  - `db/schema/profiles.ts` - User profiles table schema
  - `context/AuthContext.tsx` - Provides user data via `useAuth()` hook

### Current State
The plan wizard (`/plans/new`) currently has a 4-step flow:
1. **Scenario Selection** - Choose disaster scenarios
2. **Personnel Configuration** - Add household members (current step we're enhancing)
3. **Location & Context** - Set location and home details
4. **Generate Plan** - AI streaming generation

**Step 2 (PersonnelStep)** currently:
- Uses `react-hook-form` with field arrays to manage dynamic family member list
- Each family member has: `name`, `age`, `gender`, `medicalConditions`, `specialNeeds`
- Pre-fills first family member with user's profile data (name, age, gender) from `AuthContext`
- Allows adding/removing family members (1-20 limit)
- Validates input via Zod schema (`personnelConfigurationSchema`)
- Data is stored in localStorage during wizard session but **NOT saved to profile**

**Current Data Flow:**
1. User navigates to `/plans/new`
2. `PlanWizard` component loads user data from `useAuth()` context
3. First family member auto-populated with user's `firstName`, calculated age from `birthYear`, and `gender`
4. User adds additional family members or modifies existing ones
5. Form state saved to localStorage for session persistence
6. When wizard completes, data saved to `mission_reports` table but **NOT back to profile**

### Existing Context Providers Analysis
- **UserContext (`useAuth()`):** Provides authenticated user data including:
  - `id`, `email`, `name`, `firstName`, `lastName`, `birthYear`, `gender`, `role`
  - Available throughout the app via `AuthProvider` in root layout
  - `PlanWizard` already uses `useAuth()` to pre-populate first family member
- **No UsageContext:** This app does not use a UsageContext provider
- **Context Hierarchy:**
  - Root layout provides `AuthProvider` and `ThemeProvider`
  - All protected routes have access to `useAuth()` hook
  - `PlanWizard` is a client component that consumes `useAuth()` directly

**🔍 Context Coverage Analysis:**
- ✅ User profile data (name, age, gender) already available via `useAuth()`
- ❌ Household members data NOT currently in context (needs to be added to profile)
- ✅ Component is already inside `AuthProvider`, no additional providers needed
- ✅ No props needed for user data - already using `useAuth()` hook correctly

---

## 4. Context & Problem Definition

### Problem Statement
Users creating multiple emergency plans must re-enter their household member information (family composition) every single time they generate a new plan. This creates friction and wastes time, especially for users who have consistent household configurations (e.g., same family members, same medical conditions).

**Current Pain Points:**
- Repetitive data entry for every new plan generation
- Higher chance of errors or inconsistencies across plans
- Frustrating user experience for frequent plan creators
- No way to update household configuration globally

**User Impact:**
- Time wasted re-entering the same information (30-60 seconds per plan)
- Risk of forgetting to include important medical conditions or special needs
- Decreased likelihood of creating multiple scenario-specific plans

### Success Criteria
- [x] Users can toggle "Save selections to profile" on Step 2 (default: ON, remembers last state)
- [x] When toggle is ON and user completes Step 2, household members saved to profile automatically
- [x] When returning to Step 2 with saved household data, show "Quick Add" button to load previous configuration
- [x] Saved household members update on every Step 2 completion when toggle is ON (reflects latest changes)
- [x] Help modal (? icon) explains the feature clearly to users
- [x] User can modify/remove saved household members by editing in wizard and completing step
- [x] Feature only affects future plan generation (does not modify existing plans)

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
- User can toggle "Save selections to profile" at the top of Step 2 (PersonnelStep)
- Toggle defaults to user's last saved preference (stored in profile, initial default: ON)
- Question mark icon next to toggle opens help modal with feature explanation
- When toggle is ON and user advances from Step 2 → Step 3:
  - Save current household members array to profile JSONB field
  - Save toggle preference state to profile
- When user loads Step 2 and has saved household members in profile:
  - Display "Quick Add" button to load saved configuration
  - If clicked, populate form with saved household members
  - If not clicked, user can manually add household members as usual
- Saved household members update automatically every time user completes Step 2 (when toggle ON)
- If user removes a family member in wizard, removal reflected in saved profile data
- Existing mission plans unaffected (no retroactive updates)

### Non-Functional Requirements
- **Performance:** Database update should not block user progression to Step 3 (<500ms)
- **Security:** User can only access/modify their own household members data
- **Usability:** UI should clearly indicate when data is being saved and loaded from profile
- **Responsive Design:** Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support:** Must support both light and dark mode using existing theme system
- **Compatibility:** Browser support matching existing wizard (modern evergreen browsers)

### Technical Constraints
- Must use existing Drizzle ORM schema patterns (JSONB column in profiles table)
- Must integrate with existing react-hook-form state management in PlanWizard
- Cannot modify WizardFormData type structure (maintain compatibility with AI generation)
- Must use existing Server Actions pattern for profile updates
- Help modal should use existing shadcn Dialog component

---

## 7. Data & Database Changes

### Database Schema Changes
```sql
-- Migration: Add household_members and save_household_preference to profiles table
ALTER TABLE profiles
ADD COLUMN household_members JSONB DEFAULT NULL,
ADD COLUMN save_household_preference BOOLEAN DEFAULT TRUE;

-- Index for efficient JSONB queries (if needed for filtering/searching)
CREATE INDEX idx_profiles_household_members ON profiles USING GIN (household_members);
```

### Data Model Updates
```typescript
// Update profiles schema: src/db/schema/profiles.ts
import { pgTable, text, uuid, timestamp, integer, boolean, jsonb, index } from 'drizzle-orm/pg-core';
import type { FamilyMember } from '@/types/wizard';

export const profiles = pgTable(
  'profiles',
  {
    // ... existing fields ...

    // NEW: Saved household members configuration
    householdMembers: jsonb('household_members').$type<FamilyMember[]>(),

    // NEW: User preference for auto-saving household members
    saveHouseholdPreference: boolean('save_household_preference').default(true),

    // ... existing timestamps ...
  },
  (table) => ({
    // ... existing indexes ...

    // NEW: GIN index for JSONB queries (optional, for future filtering)
    householdMembersIdx: index('idx_profiles_household_members').using('gin', table.householdMembers),
  })
);

// Update User type: src/types/index.ts (or wherever User type is defined)
export interface User {
  // ... existing fields ...

  // NEW: Saved household members configuration
  householdMembers?: FamilyMember[];

  // NEW: User preference for saving household members
  saveHouseholdPreference?: boolean;
}
```

### Data Migration Plan
Since this is a new feature with no existing data dependencies:

- [x] **Step 1:** Generate migration with `npm run db:generate`
- [x] **Step 2:** Review generated SQL migration file
- [x] **Step 3:** Create down migration following `drizzle_down_migration.md` template
- [x] **Step 4:** Apply migration with `npm run db:migrate`
- [x] **Step 5:** Verify columns exist in database via Drizzle Studio

**Data Validation:**
- New columns are nullable and have safe defaults (no data corruption risk)
- Existing profiles automatically get `save_household_preference = true`
- JSONB column starts as `NULL` until user saves household members

### 🚨 MANDATORY: Down Migration Safety Protocol
**CRITICAL REQUIREMENT:** Before running ANY database migration, you MUST create the corresponding down migration file following the `drizzle_down_migration.md` template process:

- [ ] **Step 1: Generate Migration** - Run `npm run db:generate` to create the migration file
- [ ] **Step 2: Create Down Migration** - Follow `drizzle_down_migration.md` template to analyze the migration and create the rollback file
- [ ] **Step 3: Create Subdirectory** - Create `drizzle/migrations/[timestamp_name]/` directory
- [ ] **Step 4: Generate down.sql** - Create the `down.sql` file with safe rollback operations
- [ ] **Step 5: Verify Safety** - Ensure all operations use `IF EXISTS` and include appropriate warnings
- [ ] **Step 6: Apply Migration** - Only after down migration is created, run `npm run db:migrate`

**🛑 NEVER run `npm run db:migrate` without first creating the down migration file!**

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

#### **MUTATIONS (Server Actions)** → `app/actions/profile.ts`
- [x] **Server Actions File** - `app/actions/profile.ts` - Add `updateHouseholdMembers()` mutation
- [x] Function signature: `updateHouseholdMembers(userId: string, householdMembers: FamilyMember[], savePreference: boolean)`
- [x] Must use `'use server'` directive and `revalidatePath('/plans/new', 'page')` after mutation
- [x] **What qualifies as mutations**: Updating household_members JSONB and save_household_preference boolean

#### **QUERIES (Data Fetching)** → Direct in Server Components
- [x] **No complex queries needed** - User data already loaded via `AuthContext` with profile fields
- [x] New `householdMembers` and `saveHouseholdPreference` fields will be automatically included in existing user profile query
- [x] Client component (`PlanWizard`) will access via `useAuth()` hook after profile refresh

#### **API Routes** → Not needed for this feature
✅ **No API routes required** - Server Actions handle all mutations, context provides all queries

### Server Actions
Create new mutation in `src/app/actions/profile.ts`:

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { db } from '@/lib/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { FamilyMember } from '@/types/wizard';

/**
 * Update user's saved household members configuration
 * Called when user completes Step 2 with "Save to profile" toggle enabled
 */
export async function updateHouseholdMembers(
  householdMembers: FamilyMember[],
  savePreference: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(profiles)
      .set({
        householdMembers: householdMembers,
        saveHouseholdPreference: savePreference,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    // Invalidate cached profile so AuthContext picks up new data
    revalidatePath('/plans/new', 'page');

    return { success: true };
  } catch (error) {
    console.error('Error updating household members:', error);
    return { success: false, error: 'Failed to save household members' };
  }
}
```

### Database Queries
**No new query functions needed** - existing profile query in `lib/db.ts` (or wherever `getUserProfile()` is defined) will automatically include new `householdMembers` and `saveHouseholdPreference` fields once schema is updated.

### External Integrations
None required for this feature.

---

## 9. Frontend Changes

### New Components
- [x] **`components/plans/wizard/HouseholdSaveToggle.tsx`** - Toggle switch with help modal for saving household members to profile
  - Props: `value: boolean`, `onChange: (value: boolean) => void`, `onOpenHelp: () => void`
  - Renders toggle switch, question mark icon, and handles click events
  - Uses shadcn `Switch` and `Button` components
  - Responsive design with proper dark mode support

- [x] **`components/plans/wizard/HouseholdHelpModal.tsx`** - Modal explaining household member profile persistence feature
  - Props: `isOpen: boolean`, `onClose: () => void`
  - Uses shadcn `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
  - Clear explanation of feature benefits and how auto-save works
  - Accessible (proper ARIA labels, keyboard navigation)

- [x] **`components/plans/wizard/QuickAddButton.tsx`** - Button to load saved household members from profile
  - Props: `onClick: () => void`, `memberCount: number`
  - Shows count of saved household members (e.g., "Quick Add (3 members)")
  - Uses shadcn `Button` component with appropriate variant
  - Only rendered when saved household members exist

### Page Updates
- [x] **`components/plans/wizard/steps/PersonnelStep.tsx`** - Modified to include toggle, help modal, and quick add functionality
  - Add `HouseholdSaveToggle` component at top of step
  - Add `HouseholdHelpModal` component
  - Add `QuickAddButton` above "Add Another Person" button (conditionally rendered)
  - Add state management for toggle value and modal visibility
  - Pass user's saved household members and preference via props from `PlanWizard`

- [x] **`components/plans/wizard/PlanWizard.tsx`** - Modified to handle profile updates and data loading
  - Add state for save preference toggle (`saveHouseholdPreference`)
  - Load user's `householdMembers` and `saveHouseholdPreference` from `useAuth()` context
  - Implement "Quick Add" functionality to populate form with saved household members
  - Call `updateHouseholdMembers()` Server Action when advancing from Step 2 → Step 3 (if toggle ON)
  - Refresh user profile after successful save to update context
  - Pass saved household data and handlers as props to `PersonnelStep`

### State Management
**Data Flow:**
1. `AuthContext` loads user profile including new `householdMembers` and `saveHouseholdPreference` fields
2. `PlanWizard` component receives user data via `useAuth()` hook
3. `PlanWizard` manages toggle state and passes to `PersonnelStep` via props
4. User interacts with toggle, help modal, and quick add button in `PersonnelStep`
5. When user clicks "Next" from Step 2 → Step 3:
   - `PlanWizard` checks if toggle is ON
   - If ON, calls `updateHouseholdMembers()` Server Action with current form data
   - After success, calls `refreshProfile()` from `AuthContext` to update user context
   - Proceeds to Step 3 with updated profile data

**Local State (PlanWizard):**
- `saveHouseholdPreference: boolean` - Current toggle state (synced with profile)
- `isHelpModalOpen: boolean` - Help modal visibility state

**Form State (react-hook-form):**
- Existing `familyMembers` field array (no changes)
- Validation via existing `personnelConfigurationSchema`

### 🚨 CRITICAL: Context Usage Strategy

**MANDATORY: Before creating any component props or planning data fetching, verify existing context availability**

#### Context-First Design Pattern
- [x] **✅ Check Available Contexts:** `useAuth()` provides user profile data including new fields
- [x] **✅ Use Context Over Props:** `PlanWizard` uses `useAuth()` to get household members data
- [x] **✅ Avoid Prop Drilling:** Only pass handlers and state to `PersonnelStep`, not user data directly
- [x] **✅ Minimize Data Fetching:** No additional queries needed - profile data already in context
- [x] **✅ Context Provider Analysis:** `AuthProvider` covers all user data needs

#### Decision Summary
- **User data (householdMembers, saveHouseholdPreference):** From `useAuth()` context ✅
- **Toggle state and handlers:** Local state in `PlanWizard`, passed as props to `PersonnelStep` ✅
- **Form data (familyMembers):** react-hook-form state (existing pattern) ✅
- **Profile updates:** Server Action called from `PlanWizard`, refreshes context ✅

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**PersonnelStep.tsx** - Currently a simple form with family member cards:
```typescript
// src/components/plans/wizard/steps/PersonnelStep.tsx (lines 30-77)
export function PersonnelStep({ control, errors }: PersonnelStepProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'familyMembers',
  });

  const addFamilyMember = () => {
    append({
      name: '',
      age: 30,
      medicalConditions: '',
      specialNeeds: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Configure Personnel
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Add each person who will be part of your disaster preparedness plan...
        </p>
      </div>

      {/* Family Members */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <CompactPersonCard
            key={field.id}
            index={index}
            control={control}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
            error={errors?.familyMembers?.[index]}
          />
        ))}
      </div>

      {/* Add Person Button */}
      {fields.length < 20 && (
        <Button type="button" variant="outline" onClick={addFamilyMember}>
          <UserPlus className="!w-4 !h-4" />
          Add Another Person
        </Button>
      )}
    </div>
  );
}
```

**PlanWizard.tsx** - Currently loads user data but doesn't save back to profile:
```typescript
// src/components/plans/wizard/PlanWizard.tsx (lines 97-127)
// Calculate age from birth year
const userAge = user?.birthYear ? new Date().getFullYear() - user.birthYear : undefined;
const profileName = user?.firstName || '';
const profileGender = /* ... gender parsing logic ... */;

// Initial form data (will be populated with defaults, user profile, or edit data)
const INITIAL_FORM_DATA: Partial<WizardFormData> = useMemo(() => {
  if (isEditMode && initialData) return initialData;

  return {
    scenarios: [],
    familyMembers: [
      {
        name: profileName,
        age: userAge || 30,
        gender: profileGender,
        medicalConditions: '',
        specialNeeds: '',
      },
    ],
    durationDays: 7,
    homeType: 'house',
  };
}, [isEditMode, initialData, userAge, profileName, profileGender]);

// No saving back to profile when advancing steps
```

### 📂 **After Refactor**

**PersonnelStep.tsx** - Enhanced with toggle, help modal, and quick add button:
```typescript
// src/components/plans/wizard/steps/PersonnelStep.tsx
interface PersonnelStepProps {
  control: Control<WizardFormData>;
  errors?: FieldErrors<WizardFormData>;

  // NEW: Profile persistence props
  savedHouseholdMembers?: FamilyMember[];
  savePreference: boolean;
  onSavePreferenceChange: (value: boolean) => void;
  onQuickAdd: () => void;
}

export function PersonnelStep({
  control,
  errors,
  savedHouseholdMembers,
  savePreference,
  onSavePreferenceChange,
  onQuickAdd
}: PersonnelStepProps) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'familyMembers',
  });

  const handleQuickAdd = () => {
    if (savedHouseholdMembers && savedHouseholdMembers.length > 0) {
      replace(savedHouseholdMembers);
      onQuickAdd();
    }
  };

  return (
    <div className="space-y-6">
      {/* NEW: Save to Profile Toggle */}
      <HouseholdSaveToggle
        value={savePreference}
        onChange={onSavePreferenceChange}
        onOpenHelp={() => setIsHelpModalOpen(true)}
      />

      {/* Header */}
      <div>
        <h2>Configure Personnel</h2>
        <p>Add each person...</p>
      </div>

      {/* NEW: Quick Add Button (if saved data exists) */}
      {savedHouseholdMembers && savedHouseholdMembers.length > 0 && (
        <QuickAddButton
          onClick={handleQuickAdd}
          memberCount={savedHouseholdMembers.length}
        />
      )}

      {/* Family Members (existing) */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <CompactPersonCard key={field.id} ... />
        ))}
      </div>

      {/* Add Person Button (existing) */}
      {fields.length < 20 && (
        <Button onClick={addFamilyMember}>Add Another Person</Button>
      )}

      {/* NEW: Help Modal */}
      <HouseholdHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
```

**PlanWizard.tsx** - Enhanced to save household members to profile:
```typescript
// src/components/plans/wizard/PlanWizard.tsx
import { updateHouseholdMembers } from '@/app/actions/profile';
import { invalidateCachedProfile } from '@/lib/cache';

export function PlanWizard({ mode = 'create', ... }: PlanWizardProps) {
  const { user, refreshProfile } = useAuth();

  // NEW: State for save preference
  const [saveHouseholdPreference, setSaveHouseholdPreference] = useState(
    user?.saveHouseholdPreference ?? true
  );

  // NEW: Load saved household members from profile
  const savedHouseholdMembers = user?.householdMembers;

  // NEW: Sync toggle state with user profile
  useEffect(() => {
    if (user?.saveHouseholdPreference !== undefined) {
      setSaveHouseholdPreference(user.saveHouseholdPreference);
    }
  }, [user?.saveHouseholdPreference]);

  // MODIFIED: Handle next button click
  const handleNext = async () => {
    const isValid = await validateCurrentStep();

    if (isValid) {
      // NEW: Save household members to profile when leaving Step 2
      if (currentStep === 1 && saveHouseholdPreference) {
        try {
          await updateHouseholdMembers(
            formData.familyMembers,
            saveHouseholdPreference
          );

          // Refresh profile in context
          if (user?.id) {
            invalidateCachedProfile(user.id);
            await refreshProfile();
          }
        } catch (error) {
          console.error('Failed to save household members:', error);
          // Continue anyway - don't block progression
        }
      }

      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // NEW: Handler for quick add button
  const handleQuickAdd = () => {
    console.log('Loaded saved household members from profile');
  };

  // MODIFIED: Render PersonnelStep with new props
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonnelStep
            control={control}
            errors={errors}
            savedHouseholdMembers={savedHouseholdMembers}
            savePreference={saveHouseholdPreference}
            onSavePreferenceChange={setSaveHouseholdPreference}
            onQuickAdd={handleQuickAdd}
          />
        );
      // ... other cases
    }
  };

  return (
    // ... existing JSX
  );
}
```

### 🎯 **Key Changes Summary**
- [x] **Database Schema:** Added `household_members` JSONB and `save_household_preference` boolean to profiles table
- [x] **Server Action:** Created `updateHouseholdMembers()` in `app/actions/profile.ts` to save household data
- [x] **PersonnelStep Component:** Added toggle UI, help modal, and quick add button with proper props
- [x] **PlanWizard Component:** Added save logic on Step 2 → Step 3 transition, profile refresh after save
- [x] **New Components:** `HouseholdSaveToggle.tsx`, `HouseholdHelpModal.tsx`, `QuickAddButton.tsx`
- [x] **Files Modified:**
  - `src/db/schema/profiles.ts` (2 new fields + index)
  - `src/types/index.ts` (User interface update)
  - `src/app/actions/profile.ts` (new mutation function)
  - `src/components/plans/wizard/steps/PersonnelStep.tsx` (UI enhancements)
  - `src/components/plans/wizard/PlanWizard.tsx` (save/load logic)
- [x] **Impact:** Streamlines plan creation by eliminating repetitive household member data entry

---

## 11. Implementation Plan

### Phase 1: Database Changes
**Goal:** Add household member storage fields to profiles table with safe rollback capability

- [ ] **Task 1.1:** Update Profiles Schema
  - Files: `src/db/schema/profiles.ts`
  - Details: Add `householdMembers: jsonb('household_members').$type<FamilyMember[]>()` and `saveHouseholdPreference: boolean('save_household_preference').default(true)`, plus GIN index

- [ ] **Task 1.2:** Generate Database Migration
  - Command: `npm run db:generate`
  - Details: Drizzle generates migration SQL for new columns and index

- [ ] **Task 1.3:** Create Down Migration (MANDATORY)
  - Files: `drizzle/migrations/[timestamp]_add_household_members/down.sql`
  - Details: Follow `drizzle_down_migration.md` template to create safe rollback with `IF EXISTS` clauses

- [ ] **Task 1.4:** Apply Migration
  - Command: `npm run db:migrate`
  - Details: Run migration to add columns to profiles table (only after down migration created)

- [ ] **Task 1.5:** Update User Type
  - Files: `src/types/index.ts` (or wherever User type is defined)
  - Details: Add `householdMembers?: FamilyMember[]` and `saveHouseholdPreference?: boolean` fields to User interface

### Phase 2: Server Actions
**Goal:** Create mutation function to save household members to profile

- [ ] **Task 2.1:** Create Update Household Members Server Action
  - Files: `src/app/actions/profile.ts`
  - Details: Implement `updateHouseholdMembers()` async function with auth check, Drizzle update, and revalidatePath

- [ ] **Task 2.2:** Update Profile Query to Include New Fields
  - Files: Wherever `getUserProfile()` is defined (likely `lib/db.ts`)
  - Details: Verify that profile query selects new `household_members` and `save_household_preference` fields (may already be automatic with Drizzle schema changes)

### Phase 3: UI Components
**Goal:** Build reusable components for toggle, help modal, and quick add button

- [ ] **Task 3.1:** Create Household Save Toggle Component
  - Files: `src/components/plans/wizard/HouseholdSaveToggle.tsx`
  - Details:
    - Props: `value: boolean`, `onChange: (value: boolean) => void`, `onOpenHelp: () => void`
    - Layout: Horizontal flex with toggle switch (shadcn `Switch`), label text, and question mark icon button
    - Styling: Responsive, dark mode support, proper spacing
    - Accessibility: Proper labels, keyboard navigation

- [ ] **Task 3.2:** Create Household Help Modal Component
  - Files: `src/components/plans/wizard/HouseholdHelpModal.tsx`
  - Details:
    - Props: `isOpen: boolean`, `onClose: () => void`
    - Uses shadcn `Dialog` component with clear title and description
    - Content: Explains feature, benefits, and how auto-save works (see Phase 3.2 task for exact copy)
    - Styling: Consistent with app design system, readable text sizing
    - Accessibility: Proper ARIA labels, focus management, Escape key to close

- [ ] **Task 3.3:** Create Quick Add Button Component
  - Files: `src/components/plans/wizard/QuickAddButton.tsx`
  - Details:
    - Props: `onClick: () => void`, `memberCount: number`
    - Label: "Quick Add ([memberCount] saved members)" or similar
    - Uses shadcn `Button` with `variant="outline"` or `variant="secondary"`
    - Icon: Consider using a history/clock icon from lucide-react
    - Styling: Stands out but not as prominent as primary CTAs

### Phase 4: Integrate Components into PersonnelStep
**Goal:** Add toggle, help modal, and quick add button to Step 2 UI

- [ ] **Task 4.1:** Update PersonnelStep Props Interface
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details: Add new props: `savedHouseholdMembers?: FamilyMember[]`, `savePreference: boolean`, `onSavePreferenceChange: (value: boolean) => void`, `onQuickAdd: () => void`

- [ ] **Task 4.2:** Add Local State for Help Modal
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details: `const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);`

- [ ] **Task 4.3:** Render HouseholdSaveToggle Component
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details: Add toggle at top of step, before header, pass props from PlanWizard

- [ ] **Task 4.4:** Render QuickAddButton Component
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details:
    - Conditionally render only if `savedHouseholdMembers` exists and has length > 0
    - Place above "Add Another Person" button
    - On click, call `replace()` from useFieldArray to populate form with saved members
    - Also call `onQuickAdd()` callback for any logging/tracking

- [ ] **Task 4.5:** Render HouseholdHelpModal Component
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details: Add modal component at end of JSX, controlled by `isHelpModalOpen` state

### Phase 5: Integrate Save/Load Logic into PlanWizard
**Goal:** Implement auto-save when advancing from Step 2 and auto-load on wizard mount

- [ ] **Task 5.1:** Add State for Save Preference
  - Files: `src/components/plans/wizard/PlanWizard.tsx`
  - Details: `const [saveHouseholdPreference, setSaveHouseholdPreference] = useState(user?.saveHouseholdPreference ?? true);`

- [ ] **Task 5.2:** Sync Toggle State with User Profile
  - Files: `src/components/plans/wizard/PlanWizard.tsx`
  - Details: Add useEffect to update local toggle state when user profile changes

- [ ] **Task 5.3:** Modify handleNext to Save Household Members
  - Files: `src/components/plans/wizard/PlanWizard.tsx`
  - Details:
    - Add check: if `currentStep === 1 && saveHouseholdPreference`
    - Call `await updateHouseholdMembers(formData.familyMembers, saveHouseholdPreference)`
    - On success, invalidate cache and call `refreshProfile()` from AuthContext
    - Handle errors gracefully (log but don't block progression)

- [ ] **Task 5.4:** Create Quick Add Handler
  - Files: `src/components/plans/wizard/PlanWizard.tsx`
  - Details: Simple logging function for now: `const handleQuickAdd = () => { console.log('Loaded saved household members'); }`

- [ ] **Task 5.5:** Pass New Props to PersonnelStep
  - Files: `src/components/plans/wizard/PlanWizard.tsx`
  - Details: Update renderStep() case for step 1 to pass `savedHouseholdMembers`, `savePreference`, `onSavePreferenceChange`, `onQuickAdd`

### Phase 6: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 6.1:** Run Linting on Modified Files
  - Command: `npm run lint` (static analysis only)
  - Details: Verify no linting errors in modified TypeScript/React files

- [ ] **Task 6.2:** Run Type Checking
  - Command: `npx tsc --noEmit` (type check without compilation)
  - Details: Ensure no TypeScript errors in modified files

- [ ] **Task 6.3:** Read and Verify Component Logic
  - Files: All new component files
  - Details: Manual code review for proper prop types, state management, and event handling

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
    - **Test 1:** Navigate to `/plans/new`, verify toggle appears on Step 2 (default ON)
    - **Test 2:** Click question mark icon, verify help modal opens with clear explanation
    - **Test 3:** Toggle "Save selections to profile" to OFF, advance to Step 3, verify no save occurs
    - **Test 4:** Go back to Step 2, toggle ON, add family members, advance to Step 3, verify save occurs
    - **Test 5:** Start a new plan wizard, verify "Quick Add" button appears on Step 2 if saved data exists
    - **Test 6:** Click "Quick Add", verify form populates with previously saved household members
    - **Test 7:** Modify household members (add/remove), advance to Step 3, verify profile updates
    - **Test 8:** Test responsive design on mobile, tablet, desktop
    - **Test 9:** Test dark mode appearance and readability
    - **Test 10:** Verify accessibility (keyboard navigation, screen reader compatibility)

- [ ] **Task 8.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW
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
### Phase 1: Database Changes
**Goal:** Add household member storage fields to profiles table with safe rollback capability

- [x] **Task 1.1:** Update Profiles Schema ✓ 2025-01-15
  - Files: `src/db/schema/profiles.ts` ✓
  - Details: Added householdMembers JSONB field and saveHouseholdPreference boolean ✓
```

---

## 13. File Structure & Organization

### New Files to Create
```
emergency-planner-v2/
├── src/
│   ├── components/
│   │   └── plans/
│   │       └── wizard/
│   │           ├── HouseholdSaveToggle.tsx          # Toggle switch with help icon
│   │           ├── HouseholdHelpModal.tsx           # Feature explanation modal
│   │           └── QuickAddButton.tsx               # Load saved household members button
│   └── app/
│       └── actions/
│           └── profile.ts                           # Add updateHouseholdMembers() function
└── drizzle/
    └── migrations/
        └── [timestamp]_add_household_members/
            ├── migration.sql                        # Generated by Drizzle
            └── down.sql                             # Manual rollback migration
```

### Files to Modify
- [ ] **`src/db/schema/profiles.ts`** - Add `householdMembers` and `saveHouseholdPreference` fields
- [ ] **`src/types/index.ts`** - Update User interface with new fields
- [ ] **`src/components/plans/wizard/steps/PersonnelStep.tsx`** - Integrate toggle, modal, quick add button
- [ ] **`src/components/plans/wizard/PlanWizard.tsx`** - Add save/load logic and profile refresh

### Dependencies to Add
No new dependencies required - using existing shadcn components (`Switch`, `Dialog`, `Button`)

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Profile save fails but user advances to Step 3
  - **Code Review Focus:** `PlanWizard.tsx` handleNext function error handling
  - **Potential Fix:** Wrap updateHouseholdMembers in try/catch, log error but don't block progression (graceful degradation)

- [ ] **Error Scenario 2:** AuthContext doesn't refresh after profile update
  - **Code Review Focus:** `PlanWizard.tsx` profile refresh logic after save
  - **Potential Fix:** Ensure `invalidateCachedProfile()` and `refreshProfile()` are called in correct order

- [ ] **Error Scenario 3:** Quick Add button populates form with invalid/outdated data
  - **Code Review Focus:** Data validation in `replace()` call and schema compatibility
  - **Potential Fix:** Validate saved household members against current schema before populating form

### Edge Cases to Consider
- [ ] **Edge Case 1:** User has saved household members but toggle is OFF
  - **Analysis Approach:** Check if Quick Add button still appears when toggle is OFF
  - **Recommendation:** Quick Add button should always appear if saved data exists, regardless of toggle state (toggle only controls auto-save, not loading)

- [ ] **Edge Case 2:** User saves empty household members array
  - **Analysis Approach:** Verify behavior when familyMembers array is empty
  - **Recommendation:** Don't save if array is empty or only contains first member with no data (avoid cluttering profile with useless data)

- [ ] **Edge Case 3:** User switches toggle OFF mid-wizard after previous saves
  - **Analysis Approach:** Check if subsequent plan creations still show Quick Add button
  - **Recommendation:** Quick Add should remain available; toggle OFF only prevents NEW saves, doesn't delete existing data

### Security & Access Control Review
- [ ] **User Authorization:** Is `updateHouseholdMembers()` properly restricted to authenticated users?
  - **Check:** Server action uses `supabase.auth.getUser()` to verify authentication before updating profile

- [ ] **Data Isolation:** Can users access or modify other users' household member data?
  - **Check:** Drizzle query filters by `user.id` from auth session, ensuring users only update their own profile

- [ ] **Input Validation:** Are household member inputs sanitized before saving to database?
  - **Check:** Zod schema validation via `personnelConfigurationSchema` before data reaches server action

- [ ] **JSONB Injection:** Could malicious JSON structures break the database or application?
  - **Check:** TypeScript types enforce structure, Drizzle ORM handles JSONB serialization safely

### AI Agent Analysis Approach
**Focus:** Review existing code to identify potential failure points and security gaps. When issues are found, provide specific recommendations with file paths and code examples. This is code analysis and gap identification - not writing tests or test procedures.

**Priority Order:**
1. **Critical:** User authorization in `updateHouseholdMembers()` server action
2. **Important:** Graceful error handling in `handleNext()` save logic
3. **Nice-to-have:** Validation of saved data structure before populating form

---

## 15. Deployment & Configuration

### Environment Variables
No new environment variables required - uses existing Supabase and Drizzle configurations.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
This task has a straightforward implementation path, so strategic analysis was skipped. Proceeding directly to task document creation and implementation.

### Communication Preferences
- [x] Ask for clarification if requirements are unclear (already done in initial Q&A)
- [x] Provide regular progress updates after each phase
- [x] Flag any blockers or concerns immediately
- [x] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **✅ STRATEGIC ANALYSIS COMPLETED** - Skipped (straightforward implementation)

2. **✅ TASK DOCUMENT CREATED** - This document created in `ai_docs/tasks/077_save_household_members_to_profile.md`

3. **PRESENT IMPLEMENTATION OPTIONS (Required)**
   - [ ] **After user reviews task document**, present these 3 exact options:

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

   - [ ] **Wait for explicit user choice** (A, B, or C) - never assume or default

4. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

   **MANDATORY PHASE WORKFLOW:**

   For each phase, follow this exact pattern:

   a. **Execute Phase Completely** - Complete all tasks in current phase
   b. **Update Task Document** - Mark all completed tasks as [x] with timestamps
   c. **Provide Specific Phase Recap** using format from template
   d. **Wait for "proceed"** before starting next phase
   e. **Repeat for each phase** until all implementation complete
   f. **🚨 CRITICAL:** After final implementation phase, proceed to Phase 7 (Comprehensive Code Review) before any user testing

   **🚨 PHASE-SPECIFIC REQUIREMENTS:**
   - [ ] **Real-time task completion tracking** - Update task document immediately after each subtask
   - [ ] **Mark checkboxes as [x]** with completion timestamps
   - [ ] **Add specific completion notes** (file paths, line counts, key changes)
   - [ ] **Run linting on each modified file** during the phase (static analysis only)
   - [ ] **🚨 MANDATORY: Create down migration BEFORE running `npm run db:migrate`**
   - [ ] **For new components, follow naming conventions and shadcn patterns**
   - [ ] **NEVER plan manual browser testing as AI task** - mark as "👤 USER TESTING"

5. **FINAL CODE REVIEW RECOMMENDATION (Mandatory after all phases)**
   - [ ] **Present exact message from template** after all implementation complete
   - [ ] **Wait for user approval** of code review
   - [ ] **If approved:** Execute comprehensive code review process

6. **COMPREHENSIVE CODE REVIEW PROCESS (If user approves)**
   - [ ] Follow detailed review checklist from template section 16, step 8

### What Constitutes "Explicit User Approval"
(See template section 16 for full list of approval phrases)

**For Implementation Options (A/B/C):**
- Option A: "A", "Preview the changes", "Show me the code"
- Option B: "B", "Proceed", "Go ahead", "Approved"
- Option C: "C", "I have questions", "Can you modify"

**For Phase Continuation:**
- "proceed", "continue", "next phase", "go ahead", "looks good"

🛑 **NEVER start coding without explicit A/B/C choice from user!**
🛑 **NEVER continue to next phase without "proceed" confirmation!**
🛑 **NEVER skip comprehensive code review after implementation phases!**

### Code Quality Standards
- [ ] Follow TypeScript best practices with strict typing
- [ ] Add professional comments explaining business logic (never historical comments)
- [ ] Use early returns to keep code clean and readable
- [ ] Use async/await instead of .then() chaining
- [ ] NO FALLBACK BEHAVIOR - fail fast with clear errors
- [ ] Create down migration files before running ANY database migration
- [ ] Ensure responsive design (mobile-first with Tailwind breakpoints)
- [ ] Test in both light and dark mode
- [ ] Follow accessibility guidelines (WCAG AA)
- [ ] Clean up removal artifacts (no placeholder comments)

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern**
  - [x] Mutations → Server Actions (`app/actions/profile.ts`)
  - [x] Queries → Direct via AuthContext (user profile data)
  - [x] No API routes needed
- [ ] **✅ VERIFY: Proper context usage patterns**
  - [x] Using `useAuth()` to access user profile data
  - [x] No unnecessary props for data already in context
  - [x] Profile refresh after mutation to update context

---

## 17. Notes & Additional Context

### Help Modal Content (Draft)
```
## Save Household Members to Your Profile

When enabled, this feature automatically saves the household members you configure to your user profile. This means:

✅ **Faster Plan Creation** - Your household configuration loads automatically the next time you create a plan

✅ **Consistent Information** - Ensure medical conditions and special needs are always included

✅ **Easy Updates** - Changes you make in future plans update your saved configuration

### How It Works

1. Toggle "Save selections to profile" ON (default)
2. Configure your household members as usual
3. When you advance to the next step, your configuration is saved
4. Next time you create a plan, use "Quick Add" to load your saved household members

**Note:** This only affects future plan creation. Existing plans are not modified.
```

### Research Links
- Drizzle ORM JSONB documentation: https://orm.drizzle.team/docs/column-types/pg#jsonb
- shadcn Dialog component: https://ui.shadcn.com/docs/components/dialog
- shadcn Switch component: https://ui.shadcn.com/docs/components/switch
- react-hook-form useFieldArray: https://react-hook-form.com/docs/usefieldarray

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** No breaking changes - only adding new optional fields to profiles table
- [x] **Database Dependencies:** No existing tables reference profiles.household_members (new field)
- [x] **Component Dependencies:** PersonnelStep interface extended with optional props (backward compatible)
- [x] **Authentication/Authorization:** No changes to auth patterns or access controls

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** New fields added to User type in AuthContext → all components using `useAuth()` will have access (no breaking changes, optional fields)
- [x] **UI/UX Cascading Effects:** PersonnelStep receives new props, but backward compatible (props are optional)
- [x] **State Management:** PlanWizard adds local state for toggle, but doesn't affect existing wizard state management
- [x] **Routing Dependencies:** No routing changes

#### 3. **Performance Implications**
- [x] **Database Query Impact:** New JSONB column adds ~50-500 bytes per user profile (negligible), GIN index may add slight overhead but improves future query performance
- [x] **Bundle Size:** Three small new components (~2-3 KB total gzipped), no new dependencies
- [x] **Server Load:** One additional database update per plan creation (when toggle ON), minimal impact
- [x] **Caching Strategy:** Uses existing AuthContext cache invalidation pattern, no conflicts

#### 4. **Security Considerations**
- [x] **Attack Surface:** No new attack vectors - uses existing auth and Drizzle ORM patterns
- [x] **Data Exposure:** Household members data only accessible to authenticated user who owns the profile
- [x] **Permission Escalation:** No new permissions or roles introduced
- [x] **Input Validation:** Existing Zod schema validation applies to household member data

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:** Minimal - toggle defaults to ON, users can ignore Quick Add button if desired
- [x] **Data Migration:** No migration needed - new optional fields start as NULL/default
- [x] **Feature Deprecation:** No features removed or changed
- [x] **Learning Curve:** Help modal explains feature, very low learning curve

#### 6. **Maintenance Burden**
- [x] **Code Complexity:** Slight increase - three new components and one new server action (well-isolated, easy to maintain)
- [x] **Dependencies:** No new dependencies
- [x] **Testing Overhead:** Manual UI testing required for toggle, modal, quick add interactions
- [x] **Documentation:** Help modal provides user-facing docs, this task document provides developer docs

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
**NONE IDENTIFIED** - This is a low-risk additive feature with no breaking changes or data loss risks.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [x] **Increased Complexity:** PersonnelStep component gains 3 new props and additional UI elements (manageable, well-isolated)
- [x] **UI/UX Changes:** Step 2 gains new toggle and Quick Add button (minor change, non-disruptive)
  - **Mitigation:** Toggle defaults to ON (no behavior change for users who ignore it), Quick Add is optional convenience feature

### Mitigation Strategies

#### Database Changes
- [x] **Backup Strategy:** Not critical for dev environment (data loss acceptable per dev mode context)
- [x] **Rollback Plan:** Down migration will be created following `drizzle_down_migration.md` template
- [x] **Staging Testing:** Test migration in local dev database before any production deployment
- [x] **Gradual Migration:** No data migration needed (new nullable columns with safe defaults)

#### API Changes
**N/A** - No API changes, only new server action (additive, not breaking)

#### UI/UX Changes
- [x] **Feature Flags:** Not needed for dev environment (users are developers/testers)
- [x] **User Communication:** Help modal provides in-app explanation of feature
- [x] **Help Documentation:** Task document includes draft help modal content
- [x] **Feedback Collection:** Manual testing phase will validate UX

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections filled out above
- [x] **Identify Critical Issues:** No red flags identified
- [x] **Propose Mitigation:** Down migration template, help modal, backward-compatible props
- [x] **Alert User:** Yellow flag noted (minor UI changes and slight complexity increase)
- [x] **Recommend Alternatives:** No alternatives needed - straightforward implementation

### Impact Analysis Summary

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- NONE - This is an additive feature with backward-compatible changes

**Performance Implications:**
- New JSONB column: ~50-500 bytes per profile (negligible)
- GIN index: Slight write overhead, improves future query performance
- Bundle size increase: ~2-3 KB gzipped (three small components)
- Server load: One additional DB update per plan creation (minimal)

**Security Considerations:**
- Uses existing auth patterns (no new attack surface)
- Household members data isolated to authenticated user's profile
- Input validation via existing Zod schemas

**User Experience Impacts:**
- Toggle defaults to ON (non-disruptive for existing users)
- Quick Add button is optional convenience feature
- Help modal provides clear feature explanation
- Streamlines plan creation by reducing repetitive data entry

**Mitigation Recommendations:**
- Create down migration file before applying schema changes (mandatory)
- Test toggle, modal, and quick add interactions manually in browser
- Verify profile refresh works correctly after save

**⚠️ USER ATTENTION REQUIRED:**
Minor UI changes on Step 2 (new toggle and Quick Add button). These are additive, non-disruptive features with clear help documentation. No breaking changes or data loss risks.
```

---

*Template Version: 1.3*
*Task Created: 2025-01-15*
*Task Number: 077*
*Created By: Claude (AI Assistant)*
