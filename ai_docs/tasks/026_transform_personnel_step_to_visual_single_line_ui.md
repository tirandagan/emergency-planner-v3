# Transform Personnel Step to Visual Single-Line UI

> **Task Type:** UI/UX Transformation - Convert multi-line form interface to compact visual single-line design

---

## 1. Task Overview

### Task Title
**Transform Plan Wizard Personnel Step into Intuitive Visual Single-Line Interface**

### Goal Statement
Transform the current multi-line personnel configuration form into an engaging, visual, single-line interface that makes it quick and easy for users to configure family members through intuitive icons, visual selectors, and tap-friendly controls. Each person's complete configuration (age, gender, medical conditions, special needs) should fit on a single compact card, optimized for both mobile tap and desktop click interactions.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The current PersonnelStep uses traditional form inputs (text fields, dropdowns, multi-line textareas) that spread each person's configuration across multiple rows. This creates several UX issues:

1. **Visual clutter** - Each person takes 4+ rows of vertical space
2. **Slow data entry** - Multiple clicks and typing required for basic information
3. **Poor mobile experience** - Dropdowns and textareas are cumbersome on mobile
4. **No visual feedback** - Generic form appearance without engaging visual elements
5. **Inefficient scanning** - Hard to quickly review all configured personnel

This needs strategic consideration because there are multiple valid approaches to solving this UX problem.

### Solution Options Analysis

#### Option 1: Single-Line Compact Cards with Icon-Based Quick Selection
**Approach:** Each person fits on one card with visual age icons (👶 baby, 🧒 child, 👦 teen, 👨 adult, �� senior), inline gender buttons, and chip-based medical/special needs input with common presets.

**Pros:**
- ✅ **Maximum information density** - All data visible at once on single line
- ✅ **Visual engagement** - Icons and visual elements make interface more intuitive
- ✅ **Fast data entry** - One-tap quick selection for common scenarios
- ✅ **Excellent mobile UX** - Large touch targets, no dropdown menus
- ✅ **Quick scanning** - See all personnel configuration at a glance
- ✅ **Professional appearance** - Modern, polished design vs generic forms

**Cons:**
- ❌ **Higher implementation complexity** - Custom components vs standard form inputs
- ❌ **Potential horizontal scroll on mobile** - Need careful responsive design
- ❌ **May feel cramped on very small screens** - Need mobile breakpoint strategy

**Implementation Complexity:** Medium - Requires custom components, chip input system, responsive design
**Risk Level:** Low - No data model changes, purely UI transformation

#### Option 2: Accordion-Style Expandable Cards with Visual Headers
**Approach:** Each person shows compact visual summary (age icon, gender, badge count for conditions/needs), expands to full form on click.

**Pros:**
- ✅ **Vertical space efficiency** - Collapsed cards take minimal space
- ✅ **Progressive disclosure** - Show details only when needed
- ✅ **Simpler implementation** - Can reuse existing form inputs inside accordion
- ✅ **No horizontal scroll concerns** - Vertical expansion pattern

**Cons:**
- ❌ **Extra clicks required** - Must expand card to edit
- ❌ **Can't see all data at once** - Reduced scanability
- ❌ **Still uses traditional form inputs** - Misses opportunity for visual improvement
- ❌ **Less engaging** - More similar to current generic form approach

**Implementation Complexity:** Low - Primarily layout changes with existing inputs
**Risk Level:** Low - Conservative approach with minimal changes

#### Option 3: Hybrid Approach - Visual Quick Add + Traditional Detail Form
**Approach:** Quick-add row with visual selectors for common scenarios (adult male, adult female, child, etc.), then expanded traditional form for medical/special needs details.

**Pros:**
- ✅ **Fast common cases** - One-click to add typical family members
- ✅ **Detailed when needed** - Full form available for complex requirements
- ✅ **Easier implementation** - Combines new quick-add UI with existing form logic
- ✅ **Familiar pattern** - Quick add + details is recognizable UX pattern

**Cons:**
- ❌ **Split interaction model** - Two different UX paradigms in one interface
- ❌ **Still requires expansion** - Medical/special needs hidden by default
- ❌ **Missed opportunity** - Doesn't fully achieve single-line goal
- ❌ **Inconsistent experience** - Simple vs complex entries feel different

**Implementation Complexity:** Medium - New quick-add component + refactored existing form
**Risk Level:** Low - Gradual enhancement approach

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Single-Line Compact Cards with Icon-Based Quick Selection

**Why this is the best choice:**

1. **Maximum UX improvement** - Fully achieves the goal of intuitive, visual, single-line interface that the user specifically requested
2. **Mobile-first design** - Large touch targets and visual selectors are superior to dropdowns on mobile
3. **Professional appearance** - Creates engaging, modern interface vs generic form that elevates brand perception
4. **Information density** - All personnel data visible at once improves decision-making and reduces cognitive load
5. **Aligns with user request** - User specifically asked for "visuals, icons, react components that make it quick and easy to click/tap"

**Key Decision Factors:**
- **Performance Impact:** Minimal - All client-side rendering, no API changes
- **User Experience:** Significant improvement - faster data entry, better visual feedback, more engaging interaction
- **Maintainability:** Moderate - New components but clean separation of concerns
- **Scalability:** Excellent - Chip system handles arbitrary medical conditions/special needs
- **Security:** No impact - Same form validation, client-side only changes

**Alternative Consideration:**
If horizontal space becomes too constrained on mobile (<360px), we can implement responsive breakpoint that stacks age/gender on one line, medical/special needs on second line while maintaining visual design. However, modern mobile-first design with proper spacing should comfortably fit on 320px+ screens.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 1 - Single-Line Compact Cards), or would you prefer a different approach?

**Questions for you to consider:**
- Does Option 1 align with your vision of "visuals, icons, and quick tap/click" interface?
- Are there specific medical conditions or special needs you want as quick-add presets?
- Would you like drag-to-reorder capability for people, or is add/remove sufficient?
- Any concerns about horizontal space on mobile that we should address?

**Next Steps:**
Once you approve Option 1, I'll update the implementation plan with specific component designs and present next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 16.0.7, React 19.2
- **Language:** TypeScript 5 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **UI & Styling:** shadcn/ui components with Tailwind CSS 4
- **Form Management:** React Hook Form 7.68 with Zod validation
- **Icon System:** Lucide React 0.554
- **Key Architectural Patterns:** Next.js App Router, Client Components for interactive forms
- **Relevant Existing Components:** 
  - `components/ui/button.tsx` - Base button with variants and automatic icon spacing
  - `components/ui/input.tsx` - Form input components
  - `components/ui/select.tsx` - Radix UI select dropdowns (to be replaced)
  - `components/ui/label.tsx` - Form labels
  - `components/plans/wizard/steps/PersonnelStep.tsx` - Current implementation

### Current State
The PersonnelStep component currently uses traditional form inputs:
- **Age:** Number input (vertical layout)
- **Gender:** Select dropdown with 4 options (vertical layout)
- **Medical Conditions:** Multi-line textarea (full width, 2 rows)
- **Special Needs:** Multi-line textarea (full width, 2 rows)

Each person requires approximately 250-300px of vertical space. The form uses React Hook Form's `useFieldArray` for dynamic person management. Data is stored in `WizardFormData.familyMembers` array matching the `FamilyMember` interface.

### Existing Context Providers Analysis
This component operates within the wizard form context:
- **Form Context:** React Hook Form manages all wizard state
- **No additional context providers** - Component receives `register`, `control`, `errors` as props
- **Self-contained component** - No parent context dependencies beyond form state

**🔍 Context Coverage Analysis:**
- Wizard state managed entirely through React Hook Form
- No user context needed (wizard runs before plan creation)
- Component is fully self-contained with clear prop interface
- No unnecessary prop drilling - form control passed explicitly

---

## 4. Context & Problem Definition

### Problem Statement
The current personnel configuration interface uses traditional multi-line form inputs that create several UX problems:

1. **Poor information density** - Each person spreads across 4+ rows making it hard to see overview
2. **Slow mobile interaction** - Dropdowns require multiple taps, textareas need keyboard switching
3. **Low engagement** - Generic form appearance doesn't invite interaction
4. **Inefficient data entry** - Common scenarios (adult with no conditions) still require multiple inputs
5. **Poor scanability** - Can't quickly review all configured personnel at a glance

**User Impact:** Users configuring emergency preparedness plans need to quickly add family members with minimal friction. Current interface creates unnecessary cognitive load and interaction steps, particularly on mobile devices where the wizard is frequently used.

### Success Criteria
- [x] Each person's configuration fits on a single compact card (one line on desktop, max 2 on mobile)
- [x] Visual age range selector with icon-based quick selection
- [x] Inline gender selection buttons (no dropdown)
- [x] Chip-based medical conditions input with common presets
- [x] Chip-based special needs input with common presets
- [x] All interactive elements have minimum 44x44px touch targets for mobile
- [x] Responsive design works from 320px to 1920px+ screens
- [x] Maintains full accessibility (keyboard navigation, screen readers)
- [x] Data validation and error handling preserved from current implementation
- [x] Smooth animations for add/remove person actions

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
- User can add up to 20 people to the preparedness plan
- User can select age using visual range icons OR manual number input
- User can select gender using inline button group (Male, Female, Other, Prefer not to say)
- User can add medical conditions using:
  - Quick-add preset chips (Diabetes, Asthma, Heart Disease, Allergies, etc.)
  - Custom condition via text input with chip creation
  - Remove conditions by clicking chip X button
- User can add special needs using:
  - Quick-add preset chips (Mobility Assistance, Dietary Restrictions, Infant Care, etc.)
  - Custom need via text input with chip creation
  - Remove needs by clicking chip X button
- User can remove any person except the first (must have at least 1)
- Form validates age (0-120), gender (required), and preserves all data on step navigation

### Non-Functional Requirements
- **Performance:** Instant interaction feedback (<100ms), smooth animations (60fps)
- **Security:** No security concerns - client-side form only, no sensitive data storage
- **Usability:** 
  - Minimum 44x44px touch targets for all interactive elements
  - Clear visual feedback on hover/tap
  - Intuitive icon meanings without requiring documentation
  - Error messages inline and contextual
- **Responsive Design:** 
  - Mobile-first approach: 320px+ (stacked layout if needed)
  - Tablet: 768px+ (single-line compact cards)
  - Desktop: 1024px+ (full single-line layout with optimal spacing)
- **Theme Support:** Full light/dark mode support using existing CSS variables
- **Compatibility:** Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

### Technical Constraints
- Must use React Hook Form with existing `familyMembers` field array
- Must preserve `FamilyMember` interface - no data model changes
- Must integrate with existing wizard step navigation and validation
- Must use existing shadcn/ui design tokens and Tailwind theme
- Must maintain WCAG AA accessibility standards

---

## 7. Data & Database Changes

### Database Schema Changes
No database changes required - purely UI transformation.

### Data Model Updates
No data model changes - `FamilyMember` interface remains unchanged:

```typescript
export interface FamilyMember {
  age: number; // 0-120
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  medicalConditions?: string; // Optional medical conditions (comma-separated)
  specialNeeds?: string; // Optional special needs (comma-separated)
}
```

**Note:** Medical conditions and special needs will be stored as comma-separated strings to maintain existing data format while enabling chip-based UI.

### Data Migration Plan
No migration needed - client-side UI change only.

---

## 8. API & Backend Changes

### Data Access Pattern
No backend changes required - purely client-side component transformation.

### Server Actions
Not applicable - no server-side changes.

### Database Queries
Not applicable - no data access changes.

### API Routes
Not applicable - no API changes.

---

## 9. Frontend Changes

### New Components

#### Component 1: `components/plans/wizard/PersonCard.tsx`
**Purpose:** Single compact card displaying one person's complete configuration on a single line (or 2 lines on mobile)

**Props:**
```typescript
interface PersonCardProps {
  index: number;
  value: FamilyMember;
  onChange: (field: keyof FamilyMember, value: any) => void;
  onRemove: () => void;
  canRemove: boolean;
  error?: FieldError;
}
```

**Features:**
- Visual age selector with icons (👶 0-2, 🧒 3-12, 👦 13-17, 👨 18-64, 👴 65+)
- Manual age input for precise control
- Inline gender button group
- Chip-based medical conditions with presets
- Chip-based special needs with presets
- Remove person button
- Responsive layout (single line desktop, stacked mobile)

#### Component 2: `components/plans/wizard/ChipInput.tsx`
**Purpose:** Reusable chip input component for medical conditions and special needs

**Props:**
```typescript
interface ChipInputProps {
  value: string; // Comma-separated string
  onChange: (value: string) => void;
  presets: string[]; // Quick-add preset chips
  placeholder: string;
  icon: LucideIcon;
  maxChips?: number;
}
```

**Features:**
- Display existing chips from comma-separated value
- Quick-add preset buttons
- Custom chip creation via text input
- Remove chips with X button
- Visual distinction between preset and custom chips
- Keyboard navigation support

#### Component 3: `components/plans/wizard/AgeSelector.tsx`
**Purpose:** Visual age range selector with icon-based quick selection

**Props:**
```typescript
interface AgeSelectorProps {
  value: number;
  onChange: (age: number) => void;
  error?: FieldError;
}
```

**Features:**
- 5 age range buttons with icons (Baby, Child, Teen, Adult, Senior)
- Sets age to range midpoint on click (1, 8, 15, 40, 70)
- Manual number input for precise age
- Visual highlight of selected range
- Smooth transitions between ranges

### Modified Components

#### `components/plans/wizard/steps/PersonnelStep.tsx`
**Current Implementation:**
- Uses traditional form inputs (Input, Select, Textarea)
- Vertical layout with each field stacked
- 250-300px vertical space per person
- Generic form appearance

**Planned Changes:**
- Replace with compact `PersonCard` components
- Horizontal layout with visual selectors
- 80-120px vertical space per person (60% reduction)
- Professional, engaging visual design
- Remove Select and Textarea components entirely
- Integrate new visual components (AgeSelector, ChipInput, inline gender buttons)

### Page Updates
No page changes - component is used within existing wizard flow.

### State Management
State managed by React Hook Form `useFieldArray`:
- `fields` - Array of family members
- `append` - Add new person
- `remove` - Remove person
- `register` - Form field registration
- Form validation via Zod schema (unchanged)

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**File: `src/components/plans/wizard/steps/PersonnelStep.tsx` (lines 61-195)**
```typescript
// Current person card - vertical layout, traditional form inputs
<div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
  {/* Header */}
  <div className="flex items-center justify-between">
    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
      Person {index + 1}
    </h3>
    {/* Remove button */}
  </div>

  {/* Fields Grid - 2 columns on desktop */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Age - Number Input */}
    <div className="space-y-2">
      <Label>Age *</Label>
      <Input type="number" min={0} max={120} {...register(...)} />
    </div>

    {/* Gender - Dropdown Select */}
    <div className="space-y-2">
      <Label>Gender *</Label>
      <Select defaultValue={field.gender} onValueChange={...}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
          <SelectItem value="other">Other</SelectItem>
          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Medical Conditions - Full-width Textarea */}
    <div className="space-y-2 md:col-span-2">
      <Label>Medical Conditions (Optional)</Label>
      <Textarea
        rows={2}
        placeholder="e.g., Diabetes, asthma, allergies..."
        {...register(...)}
      />
    </div>

    {/* Special Needs - Full-width Textarea */}
    <div className="space-y-2 md:col-span-2">
      <Label>Special Needs (Optional)</Label>
      <Textarea
        rows={2}
        placeholder="e.g., Mobility assistance, dietary restrictions, infant care..."
        {...register(...)}
      />
    </div>
  </div>
</div>
```

**Problems:**
- ❌ Takes 250-300px vertical space per person
- ❌ Dropdown requires 2 clicks to select gender on mobile
- ❌ Textareas require keyboard focus and typing for common conditions
- ❌ No visual engagement or quick-selection options
- ❌ Hard to scan multiple people at once
- ❌ Generic form appearance

### 📂 **After Refactor**

**File: `src/components/plans/wizard/steps/PersonnelStep.tsx` (using new components)**
```typescript
// New person card - compact horizontal layout, visual selectors
<PersonCard
  key={field.id}
  index={index}
  value={field}
  onChange={(field, value) => {
    // Update form value through register
  }}
  onRemove={() => remove(index)}
  canRemove={fields.length > 1}
  error={errors?.familyMembers?.[index]}
/>
```

**File: `src/components/plans/wizard/PersonCard.tsx` (new file)**
```typescript
// Compact single-line card with visual components
<div className="group relative p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/50 transition-colors">
  {/* Header - Person # and Remove button */}
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
      Person {index + 1}
    </span>
    {canRemove && (
      <Button variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="w-4 h-4" />
      </Button>
    )}
  </div>

  {/* Single-line compact grid */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
    {/* Age Selector - Visual + Manual */}
    <div className="lg:col-span-3">
      <AgeSelector 
        value={value.age}
        onChange={(age) => onChange('age', age)}
        error={error?.age}
      />
    </div>

    {/* Gender Buttons - Inline */}
    <div className="lg:col-span-3">
      <div className="flex gap-1">
        <Button
          variant={value.gender === 'male' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('gender', 'male')}
        >
          Male
        </Button>
        <Button
          variant={value.gender === 'female' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('gender', 'female')}
        >
          Female
        </Button>
        <Button
          variant={value.gender === 'other' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('gender', 'other')}
        >
          Other
        </Button>
        <Button
          variant={value.gender === 'prefer_not_to_say' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange('gender', 'prefer_not_to_say')}
        >
          <EyeOff className="w-4 h-4" />
        </Button>
      </div>
    </div>

    {/* Medical Conditions - Chip Input */}
    <div className="lg:col-span-3">
      <ChipInput
        value={value.medicalConditions || ''}
        onChange={(val) => onChange('medicalConditions', val)}
        presets={['Diabetes', 'Asthma', 'Heart Disease', 'Allergies']}
        placeholder="Medical conditions"
        icon={Pill}
      />
    </div>

    {/* Special Needs - Chip Input */}
    <div className="lg:col-span-3">
      <ChipInput
        value={value.specialNeeds || ''}
        onChange={(val) => onChange('specialNeeds', val)}
        presets={['Mobility Assistance', 'Dietary Restrictions', 'Infant Care']}
        placeholder="Special needs"
        icon={Accessibility}
      />
    </div>
  </div>
</div>
```

**File: `src/components/plans/wizard/AgeSelector.tsx` (new file)**
```typescript
// Visual age selector with icon-based quick selection
<div className="space-y-2">
  <Label>Age</Label>
  <div className="flex gap-1 mb-2">
    {AGE_RANGES.map(range => (
      <Button
        key={range.name}
        variant={isInRange(value, range) ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange(range.defaultAge)}
        title={range.label}
      >
        <span className="text-base">{range.icon}</span>
      </Button>
    ))}
  </div>
  <Input
    type="number"
    min={0}
    max={120}
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
  />
</div>

// Age range definitions
const AGE_RANGES = [
  { name: 'baby', icon: '👶', label: 'Baby (0-2)', min: 0, max: 2, defaultAge: 1 },
  { name: 'child', icon: '🧒', label: 'Child (3-12)', min: 3, max: 12, defaultAge: 8 },
  { name: 'teen', icon: '👦', label: 'Teen (13-17)', min: 13, max: 17, defaultAge: 15 },
  { name: 'adult', icon: '👨', label: 'Adult (18-64)', min: 18, max: 64, defaultAge: 40 },
  { name: 'senior', icon: '👴', label: 'Senior (65+)', min: 65, max: 120, defaultAge: 70 },
];
```

**File: `src/components/plans/wizard/ChipInput.tsx` (new file)**
```typescript
// Chip-based input with presets and custom entries
<div className="space-y-2">
  <div className="flex items-center gap-2 flex-wrap">
    {icon && <Icon className="w-4 h-4 text-slate-500" />}
    
    {/* Existing chips */}
    {chips.map(chip => (
      <Badge key={chip} variant="secondary" className="gap-1">
        {chip}
        <X className="w-3 h-3 cursor-pointer" onClick={() => removeChip(chip)} />
      </Badge>
    ))}

    {/* Preset quick-add buttons */}
    {presets.filter(p => !chips.includes(p)).map(preset => (
      <Button
        key={preset}
        variant="outline"
        size="sm"
        onClick={() => addChip(preset)}
      >
        + {preset}
      </Button>
    ))}

    {/* Custom chip input */}
    <Input
      placeholder={placeholder}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addChip(inputValue);
          setInputValue('');
        }
      }}
      className="flex-1 min-w-[120px]"
    />
  </div>
</div>
```

### 🎯 **Key Changes Summary**
- **Component Architecture:** Extracted PersonCard, AgeSelector, ChipInput as reusable components
- **Layout Transformation:** Vertical multi-row form → Horizontal single-line compact grid
- **Visual Enhancement:** Text inputs → Icon-based visual selectors and chip system
- **Mobile Optimization:** Dropdown → Inline buttons, Textarea → Chip input with presets
- **Space Efficiency:** 250-300px per person → 80-120px per person (60% reduction)
- **Interaction Speed:** 5+ clicks for basic person → 1-2 clicks with visual selectors
- **Accessibility:** Maintained keyboard navigation, added ARIA labels, improved touch targets

### Files Modified:
1. `src/components/plans/wizard/steps/PersonnelStep.tsx` - Refactored to use new components
2. `src/components/plans/wizard/PersonCard.tsx` - NEW compact card component
3. `src/components/plans/wizard/AgeSelector.tsx` - NEW visual age selector
4. `src/components/plans/wizard/ChipInput.tsx` - NEW chip input system

### Impact:
- **User Experience:** Dramatic improvement in data entry speed and visual engagement
- **Mobile UX:** Eliminates dropdown and textarea friction on mobile devices
- **Information Density:** 60% reduction in vertical space while improving scanability
- **Brand Perception:** Professional, modern UI vs generic form appearance
- **Accessibility:** Enhanced with better touch targets and keyboard navigation

---

## 11. Implementation Plan

### Phase 1: Create ChipInput Component
**Goal:** Build reusable chip input component with preset quick-add and custom entry

- [ ] **Task 1.1:** Create ChipInput Component Structure
  - Files: `src/components/plans/wizard/ChipInput.tsx`
  - Details: Basic component with value/onChange props, chip display logic
- [ ] **Task 1.2:** Implement Chip Display and Removal
  - Files: `src/components/plans/wizard/ChipInput.tsx`
  - Details: Parse comma-separated value, render Badge chips, X button removal
- [ ] **Task 1.3:** Add Preset Quick-Add Buttons
  - Files: `src/components/plans/wizard/ChipInput.tsx`
  - Details: Filter shown presets, Button onClick to add preset chip
- [ ] **Task 1.4:** Implement Custom Chip Input
  - Files: `src/components/plans/wizard/ChipInput.tsx`
  - Details: Input field with Enter key handler to create custom chip
- [ ] **Task 1.5:** Add Icon Support and Styling
  - Files: `src/components/plans/wizard/ChipInput.tsx`
  - Details: Optional icon prop, responsive layout, dark mode support

### Phase 2: Create AgeSelector Component
**Goal:** Build visual age range selector with icon-based quick selection

- [ ] **Task 2.1:** Create AgeSelector Component Structure
  - Files: `src/components/plans/wizard/AgeSelector.tsx`
  - Details: Component with value/onChange props, age range definitions
- [ ] **Task 2.2:** Implement Age Range Buttons
  - Files: `src/components/plans/wizard/AgeSelector.tsx`
  - Details: 5 buttons with emoji icons, onClick sets range midpoint
- [ ] **Task 2.3:** Add Manual Age Input
  - Files: `src/components/plans/wizard/AgeSelector.tsx`
  - Details: Number input for precise age control
- [ ] **Task 2.4:** Implement Range Highlighting
  - Files: `src/components/plans/wizard/AgeSelector.tsx`
  - Details: Visual indication of which range current age falls into
- [ ] **Task 2.5:** Add Validation and Error Display
  - Files: `src/components/plans/wizard/AgeSelector.tsx`
  - Details: Min/max validation, error prop display, accessibility labels

### Phase 3: Create PersonCard Component
**Goal:** Build compact single-line person card integrating all visual components

- [ ] **Task 3.1:** Create PersonCard Component Structure
  - Files: `src/components/plans/wizard/PersonCard.tsx`
  - Details: Component with index, value, onChange, onRemove props
- [ ] **Task 3.2:** Implement Card Header and Remove Button
  - Files: `src/components/plans/wizard/PersonCard.tsx`
  - Details: Person # display, remove button with canRemove prop check
- [ ] **Task 3.3:** Add AgeSelector Integration
  - Files: `src/components/plans/wizard/PersonCard.tsx`
  - Details: Integrate AgeSelector with onChange handler for age field
- [ ] **Task 3.4:** Implement Gender Button Group
  - Files: `src/components/plans/wizard/PersonCard.tsx`
  - Details: 4 inline buttons (Male, Female, Other, Icon for prefer not to say)
- [ ] **Task 3.5:** Integrate ChipInput for Medical Conditions
  - Files: `src/components/plans/wizard/PersonCard.tsx`
  - Details: ChipInput with medical presets, onChange handler
- [ ] **Task 3.6:** Integrate ChipInput for Special Needs
  - Files: `src/components/plans/wizard/PersonCard.tsx`
  - Details: ChipInput with special needs presets, onChange handler
- [ ] **Task 3.7:** Implement Responsive Grid Layout
  - Files: `src/components/plans/wizard/PersonCard.tsx`
  - Details: 12-column grid on desktop, stacked on mobile, proper breakpoints

### Phase 4: Refactor PersonnelStep
**Goal:** Replace traditional form inputs with new PersonCard components

- [ ] **Task 4.1:** Update PersonnelStep to Use PersonCard
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details: Replace existing card JSX with PersonCard component instances
- [ ] **Task 4.2:** Wire Up React Hook Form Integration
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details: Connect PersonCard onChange to form register, field array updates
- [ ] **Task 4.3:** Implement Error Handling
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details: Pass errors to PersonCard, display inline validation messages
- [ ] **Task 4.4:** Remove Unused Imports
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details: Remove Select, SelectContent, SelectItem, Textarea imports
- [ ] **Task 4.5:** Add Smooth Animations
  - Files: `src/components/plans/wizard/steps/PersonnelStep.tsx`
  - Details: Fade-in animation for new cards, fade-out for removed cards

### Phase 5: Polish and Accessibility
**Goal:** Ensure professional appearance and full accessibility compliance

- [ ] **Task 5.1:** Add Hover and Focus States
  - Files: All new components
  - Details: Hover effects on buttons, focus rings, smooth transitions
- [ ] **Task 5.2:** Implement Keyboard Navigation
  - Files: All new components
  - Details: Tab order, Enter/Space key handlers, Escape to cancel
- [ ] **Task 5.3:** Add ARIA Labels and Screen Reader Support
  - Files: All new components
  - Details: aria-label, aria-describedby, role attributes
- [ ] **Task 5.4:** Verify Dark Mode Support
  - Files: All new components
  - Details: Test dark mode colors, ensure proper contrast ratios
- [ ] **Task 5.5:** Test Responsive Breakpoints
  - Files: All new components
  - Details: Verify 320px, 768px, 1024px, 1920px layouts
- [ ] **Task 5.6:** Optimize Touch Targets
  - Files: All new components
  - Details: Ensure minimum 44x44px for all interactive elements

### Phase 6: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 6.1:** Code Quality Verification
  - Files: All modified and new files
  - Details: Run linting (`npm run lint`) - NEVER run dev server, build, or start commands
- [ ] **Task 6.2:** Static Logic Review
  - Files: PersonCard.tsx, AgeSelector.tsx, ChipInput.tsx
  - Details: Read code to verify component logic, prop types, edge case handling
- [ ] **Task 6.3:** Component Integration Verification
  - Files: PersonnelStep.tsx
  - Details: Read code to verify React Hook Form integration, error handling

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
  - Details: Test visual selectors, chip input, responsive layout, dark mode, accessibility
- [ ] **Task 8.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── src/components/plans/wizard/
│   ├── PersonCard.tsx              # NEW - Compact person card
│   ├── AgeSelector.tsx             # NEW - Visual age selector
│   └── ChipInput.tsx               # NEW - Chip input component
```

### Files to Modify
- [ ] **`src/components/plans/wizard/steps/PersonnelStep.tsx`** - Refactor to use new components
- [ ] Remove Select, SelectContent, SelectItem, Textarea imports
- [ ] Replace card JSX with PersonCard component instances
- [ ] Wire up form integration with new components

### Dependencies to Add
No new dependencies required - using existing:
- `lucide-react` - Icons (already installed)
- `react-hook-form` - Form management (already installed)
- `@/components/ui/button` - Button component (already exists)
- `@/components/ui/input` - Input component (already exists)
- `@/components/ui/label` - Label component (already exists)
- `@/components/ui/badge` - Badge for chips (already exists)

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** User enters age outside 0-120 range
  - **Code Review Focus:** AgeSelector validation, Input min/max attributes
  - **Potential Fix:** Add validation error display, prevent invalid values
- [ ] **Error Scenario 2:** User adds too many chips causing horizontal overflow
  - **Code Review Focus:** ChipInput overflow handling, max chip limit
  - **Potential Fix:** Add scrolling container or max chip limit with user feedback
- [ ] **Error Scenario 3:** Comma in custom chip input breaks parsing
  - **Code Review Focus:** ChipInput value parsing and serialization logic
  - **Potential Fix:** Escape commas or use different separator (semicolon, pipe)

### Edge Cases to Consider
- [ ] **Edge Case 1:** Very long custom chip text breaks layout
  - **Analysis Approach:** Test ChipInput with 50+ character strings
  - **Recommendation:** Add text truncation with tooltip for full text
- [ ] **Edge Case 2:** User with JavaScript disabled
  - **Analysis Approach:** Check if form still submits without client-side JS
  - **Recommendation:** Ensure progressive enhancement with form fallback
- [ ] **Edge Case 3:** Screen reader navigation through chip input
  - **Analysis Approach:** Test with VoiceOver/NVDA screen readers
  - **Recommendation:** Add proper ARIA labels and live region announcements

### Security & Access Control Review
- [ ] **Form Input Validation:** Are user inputs validated before processing?
  - **Check:** Age validation (0-120), required fields, Zod schema validation
- [ ] **XSS Prevention:** Are chip inputs properly sanitized?
  - **Check:** React automatically escapes text content, no dangerouslySetInnerHTML used
- [ ] **Data Integrity:** Can malformed chip data break form submission?
  - **Check:** Comma-separated parsing handles empty strings, trim whitespace

**Note:** No authentication or authorization concerns - wizard runs client-side before plan creation.

---

## 15. Deployment & Configuration

### Environment Variables
No environment variables needed - client-side component only.

---

## 16. AI Agent Instructions

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Always follow this exact sequence:**

1. **EVALUATE STRATEGIC NEED FIRST (Required)**
   - [x] **Assessed complexity** - Multiple viable UI approaches exist
   - [x] **Reviewed criteria** - Strategic analysis needed for UX transformation
   - [x] **Decision**: Strategic analysis completed in section 2

2. **STRATEGIC ANALYSIS SECOND (Completed)**
   - [x] **Presented solution options** - 3 options with pros/cons analyzed
   - [x] **Included complexity/risk levels** - Medium complexity, Low risk
   - [x] **Provided recommendation** - Option 1 with detailed rationale
   - [x] **Awaiting user decision** - Wait for approval before implementation

3. **CREATE TASK DOCUMENT THIRD (Required)**
   - [x] **Created task document** - `ai_docs/tasks/026_transform_personnel_step_to_visual_single_line_ui.md`
   - [x] **Filled all sections** - Complete analysis and implementation plan
   - [x] **FOUND LATEST TASK NUMBER** - Used 026 (after 025)
   - [x] **POPULATED CODE CHANGES OVERVIEW** - Section 10 with before/after code
   - [x] **Ready for user review** - Awaiting approval

4. **PRESENT IMPLEMENTATION OPTIONS (Next Step)**
   
   **👤 IMPLEMENTATION OPTIONS:**
   
   **A) Preview High-Level Code Changes** 
   Would you like me to show you additional detailed code snippets beyond section 10? I can walk through component APIs, interaction patterns, and responsive breakpoints.
   
   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase with the recommended Option 1 approach.
   
   **C) Provide More Feedback** 
   Have questions about the approach, want to choose a different option (2 or 3), or need modifications to the plan?

---

## 17. Notes & Additional Context

### Design References
- **Chip Input Pattern:** Similar to tag input in Gmail, GitHub labels
- **Visual Age Selector:** Inspired by emoji-based quick reactions in messaging apps
- **Compact Cards:** Mobile-first design following Material Design principles
- **Touch Targets:** Following Apple/Google 44x44px minimum guidelines

### Implementation Notes
- Use existing Trust Blue theme colors for primary interactions
- Maintain consistent border radius (0.5rem) with existing wizard steps
- Leverage existing button variants to reduce custom styling
- Consider adding subtle hover scale (1.02) for tactile feedback

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No API changes - purely UI transformation
- [ ] **Database Dependencies:** No database changes - `FamilyMember` interface unchanged
- [ ] **Component Dependencies:** PersonnelStep is self-contained, no parent dependencies
- [ ] **Authentication/Authorization:** Not applicable - wizard runs client-side

**Conclusion:** No breaking changes - purely additive UI enhancement.

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** No changes - React Hook Form integration preserved
- [ ] **UI/UX Cascading Effects:** Positive - improved UX may set expectations for other wizard steps
- [ ] **State Management:** No changes - useFieldArray pattern maintained
- [ ] **Routing Dependencies:** No changes - component used within existing wizard route

**Consideration:** Success of this transformation may create user expectation for similar visual enhancements in other wizard steps (Scenario, Location).

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** Not applicable - no database queries
- [ ] **Bundle Size:** Minimal increase (+3 new components, ~8KB estimated)
- [ ] **Server Load:** No impact - client-side only
- [ ] **Caching Strategy:** Not applicable

**Conclusion:** Negligible performance impact, possible slight improvement from removing Select dropdown components.

#### 4. **Security Considerations**
- [ ] **Attack Surface:** No new attack vectors - same form validation
- [ ] **Data Exposure:** No change - same client-side data handling
- [ ] **Permission Escalation:** Not applicable - no auth involved
- [ ] **Input Validation:** Enhanced - chip parsing adds validation layer

**Conclusion:** No security concerns, potential minor improvement through additional input sanitization.

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** Low risk - existing users will find new UI more intuitive
- [ ] **Data Migration:** Not applicable - no existing user data (development phase)
- [ ] **Feature Deprecation:** Select and Textarea replaced but no functionality lost
- [ ] **Learning Curve:** Reduced - visual selectors are more intuitive than dropdowns

**Positive Impact:** Significant improvement in mobile UX, faster data entry, more engaging interface.

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Slight increase - 3 new components vs inline form inputs
- [ ] **Dependencies:** No new third-party dependencies
- [ ] **Testing Overhead:** Moderate increase - need to test chip input edge cases
- [ ] **Documentation:** Component-level JSDoc comments, no additional docs needed

**Consideration:** New components are reusable and well-structured, maintaining long-term code quality.

### Critical Issues Identification

#### 🚨 **RED FLAGS - None Identified**
No critical issues that would block implementation.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **UI Consistency:** Other wizard steps use traditional form inputs - may create inconsistent experience
  - **Mitigation:** Consider applying similar visual enhancements to other steps in future iterations
- [ ] **Mobile Horizontal Scroll:** Compact single-line layout may require horizontal scroll on very small screens (<360px)
  - **Mitigation:** Responsive breakpoint stacks age/gender on line 1, conditions/needs on line 2 for <360px

### Mitigation Strategies

#### UI/UX Changes
- [ ] **Feature Flags:** Not needed - development phase allows direct changes
- [ ] **User Communication:** Not needed - no existing production users
- [ ] **Help Documentation:** Not needed - visual UI is self-explanatory
- [ ] **Feedback Collection:** Monitor user testing feedback for edge cases

### AI Agent Checklist

- [x] **Complete Impact Analysis:** All sections assessed - minimal risk, high reward
- [x] **Identify Critical Issues:** No red flags, 2 yellow flags with clear mitigation
- [x] **Propose Mitigation:** Responsive breakpoints, potential future step enhancements
- [x] **Alert User:** Yellow flags documented, no blocking issues
- [x] **Recommend Alternatives:** Option 1 recommended, Options 2 and 3 available if concerns arise

### 🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- None - purely additive UI transformation

**Performance Implications:**
- Minimal bundle size increase (~8KB for 3 new components)
- Possible slight improvement from removing Select component overhead
- No runtime performance impact - same React rendering patterns

**User Experience Impacts:**
- **Positive:** 60% reduction in vertical space, faster data entry, improved mobile UX
- **Consideration:** Sets higher UX bar for other wizard steps - may need consistency updates

**Mitigation Recommendations:**
- Implement responsive breakpoints to handle <360px screens
- Consider applying similar visual enhancements to other wizard steps for consistency
- Add thorough mobile testing across device sizes (320px-768px range)

**⚠️ USER ATTENTION REQUIRED:**
The new visual design significantly improves UX but creates a visual/interaction gap with other wizard steps that still use traditional form inputs. Should we plan to enhance the Scenario and Location steps with similar visual patterns in a future task?

---

*Template Version: 1.3*  
*Task Created: 2024-12-11*  
*Created By: Claude (Sonnet 4.5)*

---

## IMPLEMENTATION PROGRESS

### Phase 1: Create ChipInput Component ✓ 2024-12-11

- [x] **Task 1.1:** Create ChipInput Component Structure ✓ 2024-12-11
  - Files: `src/components/plans/wizard/ChipInput.tsx` ✓
  - Details: Component with value/onChange props, chip display logic ✓
- [x] **Task 1.2:** Implement Chip Display and Removal ✓ 2024-12-11
  - Files: `src/components/plans/wizard/ChipInput.tsx` ✓
  - Details: Parse comma-separated value, render Badge chips, X button removal with fade animation ✓
- [x] **Task 1.3:** Add Preset Quick-Add Buttons ✓ 2024-12-11
  - Files: `src/components/plans/wizard/ChipInput.tsx` ✓
  - Details: Filter shown presets (max 3 visible), Button onClick to add preset chip with dashed border ✓
- [x] **Task 1.4:** Implement Custom Chip Input ✓ 2024-12-11
  - Files: `src/components/plans/wizard/ChipInput.tsx` ✓
  - Details: Input field with Enter key handler to create custom chip, prevents duplicates ✓
- [x] **Task 1.5:** Add Icon Support and Styling ✓ 2024-12-11
  - Files: `src/components/plans/wizard/ChipInput.tsx` ✓
  - Details: LucideIcon prop support, responsive flex-wrap layout, dark mode support, maxChips limit ✓

### Phase 2: Create AgeSelector Component ✓ 2024-12-11

- [x] **Task 2.1:** Create AgeSelector Component Structure ✓ 2024-12-11
  - Files: `src/components/plans/wizard/AgeSelector.tsx` ✓
  - Details: Component with value/onChange props, 5 age range definitions (Baby, Child, Teen, Adult, Senior) ✓
- [x] **Task 2.2:** Implement Age Range Buttons ✓ 2024-12-11
  - Files: `src/components/plans/wizard/AgeSelector.tsx` ✓
  - Details: 5 emoji icon buttons (👶🧒👦👨👴), onClick sets range midpoint (1,8,15,40,70) ✓
- [x] **Task 2.3:** Add Manual Age Input ✓ 2024-12-11
  - Files: `src/components/plans/wizard/AgeSelector.tsx` ✓
  - Details: Number input for precise age control (0-120 validation) ✓
- [x] **Task 2.4:** Implement Range Highlighting ✓ 2024-12-11
  - Files: `src/components/plans/wizard/AgeSelector.tsx` ✓
  - Details: isInRange function determines button variant (default vs outline), visual indication of current age range ✓
- [x] **Task 2.5:** Add Validation and Error Display ✓ 2024-12-11
  - Files: `src/components/plans/wizard/AgeSelector.tsx` ✓
  - Details: Min/max validation in onChange, error prop display with aria-invalid, aria-describedby, hover scale animation ✓

### Phase 3: Create PersonCard Component ✓ 2024-12-11

- [x] **Task 3.1:** Create PersonCard Component Structure ✓ 2024-12-11
  - Files: `src/components/plans/wizard/PersonCard.tsx` ✓
  - Details: Component with index, value, onChange, onRemove, canRemove, error props ✓
- [x] **Task 3.2:** Implement Card Header and Remove Button ✓ 2024-12-11
  - Files: `src/components/plans/wizard/PersonCard.tsx` ✓
  - Details: Person # display, Trash2 icon remove button with canRemove check, hover border transition ✓
- [x] **Task 3.3:** Add AgeSelector Integration ✓ 2024-12-11
  - Files: `src/components/plans/wizard/PersonCard.tsx` ✓
  - Details: Integrated AgeSelector with onChange handler for age field, lg:col-span-3 grid layout ✓
- [x] **Task 3.4:** Implement Gender Button Group ✓ 2024-12-11
  - Files: `src/components/plans/wizard/PersonCard.tsx` ✓
  - Details: 4 inline buttons (Male, Female, Other, EyeOff icon for prefer not to say), grid-cols-4 layout, responsive text ✓
- [x] **Task 3.5:** Integrate ChipInput for Medical Conditions ✓ 2024-12-11
  - Files: `src/components/plans/wizard/PersonCard.tsx` ✓
  - Details: ChipInput with 6 medical presets (Diabetes, Asthma, Heart Disease, Allergies, High Blood Pressure, Arthritis), Pill icon, maxChips=10 ✓
- [x] **Task 3.6:** Integrate ChipInput for Special Needs ✓ 2024-12-11
  - Files: `src/components/plans/wizard/PersonCard.tsx` ✓
  - Details: ChipInput with 6 special needs presets (Mobility Assistance, Dietary Restrictions, Infant Care, Vision/Hearing Impairment, Wheelchair User), Accessibility icon, maxChips=10 ✓
- [x] **Task 3.7:** Implement Responsive Grid Layout ✓ 2024-12-11
  - Files: `src/components/plans/wizard/PersonCard.tsx` ✓
  - Details: 12-column grid on desktop (lg:col-span-3 per section), stacked on mobile (grid-cols-1), proper breakpoints, error display for all fields ✓
