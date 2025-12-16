# AI Task Template

## 1. Task Overview

### Task Title
**Title:** Upgrade Evacuation Routes Generation with Comprehensive EMP-Focused Prompt and Enhanced Parsing

### Goal Statement
**Goal:** Replace the existing evacuation route generation system with a more comprehensive prompt that specifically handles EMP/grid-down scenarios with detailed family context, household preparedness variables, and risk assessment. The new system will generate routes with metadata, rationale, risks, and step-by-step directions that don't rely on GPS or functioning infrastructure. We need to implement robust parsing logic to handle the new JSON structure and properly integrate it with the existing evacuation routes flow.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
This task requires strategic analysis because:
- Multiple approaches exist for integrating the new prompt (replace vs. enhance existing)
- Trade-offs between data structure changes and backward compatibility
- Architectural decisions about where to source family/household data
- UX implications for displaying the significantly richer route information

### Problem Context
The current evacuation route system uses a simple prompt that generates basic routes with waypoints, distances, and hazards. However, it lacks:
1. Comprehensive EMP/grid-down scenario handling with vehicle vs. foot route differentiation
2. Family composition context (adults, children, seniors, medical needs)
3. Preparedness assumptions (duration, budget, water, food)
4. Risk assessment with likelihood, impact, and mitigation strategies
5. Step-by-step directions that work without GPS
6. Metadata about scenario assumptions and operational environment

The new prompt addresses all these gaps but requires significant changes to data models, parsing logic, and potentially the UI.

### Solution Options Analysis

#### Option 1: Complete Replacement with New Data Model
**Approach:** Replace the existing route generation entirely with the new prompt and create a new data model for the richer route structure.

**Pros:**
- ✅ Clean slate implementation without legacy constraints
- ✅ Full utilization of new prompt capabilities
- ✅ Better alignment with EMP-specific use cases
- ✅ Improved user value through comprehensive route planning

**Cons:**
- ❌ Requires database migration for existing reports
- ❌ More complex UI changes to display all new data
- ❌ Higher implementation risk and testing burden
- ❌ Potential breaking changes for existing functionality

**Implementation Complexity:** High - Requires database schema changes, new types, comprehensive parsing, UI updates

**Risk Level:** Medium - Well-defined scope but significant changes across multiple layers

#### Option 2: Hybrid Approach - Enhanced Prompt with Backward-Compatible Parsing
**Approach:** Use the new prompt but map the output to the existing `EvacuationRoute` data structure, storing additional data as JSON metadata.

**Pros:**
- ✅ Minimal database changes (add metadata JSON field)
- ✅ Faster implementation timeline
- ✅ Preserves existing UI and report generation
- ✅ Lower risk of breaking existing functionality
- ✅ Can progressively enhance UI to show new data

**Cons:**
- ❌ Doesn't fully leverage new prompt capabilities immediately
- ❌ Additional complexity in mapping new structure to old
- ❌ Metadata field may become a dumping ground
- ❌ May require refactoring later to fully utilize new data

**Implementation Complexity:** Medium - Focused changes to parsing and data mapping

**Risk Level:** Low - Incremental enhancement with safety net of existing structure

#### Option 3: Parallel Implementation with Feature Flag
**Approach:** Implement the new system alongside the old, using a feature flag to control which system is active.

**Pros:**
- ✅ Zero risk to existing functionality
- ✅ A/B testing capability
- ✅ Gradual rollout to users
- ✅ Easy rollback if issues arise

**Cons:**
- ❌ Highest code complexity maintaining two systems
- ❌ Double the testing burden
- ❌ Feature flag management overhead
- ❌ Eventually must choose and clean up one system

**Implementation Complexity:** High - Duplicate implementations and coordination logic

**Risk Level:** Low - Maximum safety but high maintenance cost

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 2 - Hybrid Approach with Backward-Compatible Parsing

**Why this is the best choice:**
1. **Balance of Value and Risk** - Delivers immediate value through the enhanced prompt while minimizing breaking changes
2. **Progressive Enhancement Path** - Allows UI improvements to be added incrementally as resources permit
3. **Development Mode Alignment** - Since this is active development with acceptable data loss, we can migrate existing reports if needed
4. **Lower Implementation Complexity** - Focused scope reduces implementation time and testing burden while still achieving core goals

**Key Decision Factors:**
- **Performance Impact:** Minimal - parsing logic changes only, no additional API calls
- **User Experience:** Immediate improvement in route quality and detail, UI enhancements can follow
- **Maintainability:** Cleaner than parallel systems, easier to evolve than complete replacement
- **Scalability:** Metadata approach allows future expansion without schema changes

**Alternative Consideration:**
Option 1 (Complete Replacement) would be preferred if we were building this from scratch or had a dedicated UI sprint planned. However, given the current development priorities and the need to validate the new prompt's effectiveness first, the hybrid approach provides better risk/reward balance. We can always migrate to Option 1 later if the new prompt proves highly successful.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with the recommended solution (Option 2 - Hybrid Approach), or would you prefer a different approach?

**Questions for you to consider:**
- Does the recommended solution align with your priorities?
- Are there any constraints or preferences I should factor in?
- Do you want to see the new route data displayed in the UI immediately, or is progressive enhancement acceptable?

**Next Steps:**
Once you approve the strategic direction, I'll update the implementation plan and present you with next step options.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15.3, React 19
- **Language:** TypeScript 5.4 with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **AI Integration:** OpenRouter with Claude Sonnet 3.5 for route generation
- **UI & Styling:** shadcn/ui components with Tailwind CSS
- **Authentication:** Supabase Auth managed by middleware.ts
- **Key Architectural Patterns:** Next.js App Router, Server Components for data fetching, Server Actions for mutations
- **Relevant Existing Components:**
  - `src/lib/mission-generation/evacuation-routes.ts` - Current route generation logic
  - `src/lib/prompts.ts` - Prompt building utilities with include/variable resolution
  - `prompts/evacuation-routes/main-prompt.md` - Current route prompt template
  - `src/types/mission-report.ts` - Type definitions for routes

### Current State
The evacuation route generation system currently:
1. Uses `buildRoutePrompt()` to load and process `prompts/evacuation-routes/main-prompt.md`
2. Calls Claude Sonnet 3.5 via OpenRouter to generate 3 routes
3. Parses JSON response into `EvacuationRoute[]` with basic structure:
   - name, description, distance, estimatedTime
   - waypoints with lat/lng/name/description
   - hazards as string array
4. Provides fallback routes if generation fails
5. Integrates with mission generation flow via `generateEvacuationRoutes()`

**Limitations:**
- No family composition or medical context
- No preparedness assumptions (budget, supplies, duration)
- Basic hazard listing without risk assessment
- No step-by-step directions for GPS-free navigation
- Limited EMP-specific guidance
- No metadata about assumptions or rationale

### Existing Context Providers Analysis
Not applicable - this is a server-side AI generation feature that doesn't use React context providers.

## 4. Context & Problem Definition

### Problem Statement
Emergency evacuation planning, especially for EMP/grid-down scenarios, requires significantly more context than just location and threat type. Families need routes that account for:
- Physical capabilities (children, seniors, medical conditions)
- Resource constraints (budget, supplies on hand)
- Infrastructure failures (no GPS, no traffic signals, no fuel)
- Multiple transportation modes (vehicle vs. foot vs. bicycle)

The current system generates generic routes that don't incorporate this critical context, limiting their practical value during an actual emergency.

### Success Criteria
- [x] New prompt template created with comprehensive EMP-focused variables
- [x] Enhanced parsing logic handles new JSON structure with metadata, rationale, risks, and directions
- [x] Route generation integrates family and household data from WizardFormData
- [x] Backward compatibility maintained with existing EvacuationRoute type
- [x] All existing route display functionality continues to work
- [x] New data fields accessible for future UI enhancements
- [x] Error handling and fallback logic preserved

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
- User can generate evacuation routes with comprehensive EMP/grid-down context
- System incorporates family composition (adults, children, seniors, medical needs)
- System integrates preparedness assumptions (duration, budget, water, food)
- Routes include metadata with scenario assumptions and general context
- Each route provides rationale with EMP-specific and family-specific considerations
- Risk assessment includes likelihood, impact, and mitigation for each route
- Step-by-step directions work without GPS or functioning infrastructure
- Fallback routes provided when generation fails

### Non-Functional Requirements
- **Performance:** Route generation completes within 15 seconds
- **Security:** No sensitive data exposed in prompts or responses
- **Usability:** Error messages are clear when generation fails
- **Responsive Design:** Not applicable (server-side feature)
- **Theme Support:** Not applicable (server-side feature)
- **Compatibility:** Works with existing mission generation flow

### Technical Constraints
- Must use existing OpenRouter integration and Claude Sonnet 3.5 model
- Must maintain compatibility with WizardFormData structure
- Must preserve existing EvacuationRoute type interface for backward compatibility
- Cannot introduce breaking changes to mission report generation flow

---

## 7. Data & Database Changes

### Database Schema Changes
No database schema changes required. The existing mission reports table stores routes as JSONB, which can accommodate the new structure.

### Data Model Updates
```typescript
// Extend existing EvacuationRoute type with optional new fields
export interface EvacuationRoute {
  // Existing fields (required for backward compatibility)
  name: string;
  description: string;
  distance: string;
  estimatedTime: string;
  waypoints: Waypoint[];
  hazards: string[];

  // New optional fields for enhanced data
  metadata?: RouteMetadata;
  route_id?: string;
  priority?: 'primary' | 'secondary' | 'tertiary';
  mode?: 'vehicle' | 'foot_or_bicycle';
  origin_description?: string;
  destination_description?: string;
  estimated_total_distance_km?: number;
  estimated_travel_time_hours_no_traffic?: number;
  estimated_travel_days?: number;
  rationale?: RouteRationale;
  risks?: RouteRisk[];
  directions?: RouteDirections;
}

export interface RouteMetadata {
  scenario: string;
  location: string;
  climate_zone: string;
  family_profile: {
    family_size: number;
    adults: number;
    children: number;
    seniors: number;
    medical_summary: string;
  };
  preparedness_assumptions: {
    duration_days_self_sufficient: number;
    budget_amount: string;
    water_72hr: string;
    food_calories_total: string;
  };
  general_assumptions_text: string;
}

export interface RouteRationale {
  summary: string;
  emp_specific_considerations: string[];
  family_specific_considerations: string[];
}

export interface RouteRisk {
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface RouteDirections {
  step_by_step: string[];
  special_instructions: string[];
}
```

### Data Migration Plan
Not required - existing reports will continue to work with their current route structure. New reports will include enhanced data.

### 🚨 MANDATORY: Down Migration Safety Protocol
Not applicable - no database migrations needed.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**This task follows the approved architecture:**
- Route generation is a query operation (data creation, not mutation)
- Uses `lib/mission-generation/evacuation-routes.ts` for complex route generation logic
- No API routes needed - internal server-side function
- No Server Actions needed - called directly by mission generation flow

### Server Actions
Not applicable - route generation is part of larger mission generation flow.

### Database Queries
Not applicable - this is AI generation, not database querying.

### API Routes (Only for Special Cases)
Not applicable - internal server-side function.

### External Integrations
- **OpenRouter with Claude Sonnet 3.5**: Generate evacuation routes
- **🚨 MANDATORY: Use Latest AI Models**
  - Currently using `anthropic/claude-3.5-sonnet` ✅

---

## 9. Frontend Changes

### New Components
Not applicable - this task focuses on backend route generation.

### Page Updates
Not applicable - existing pages will display routes using current UI components.

### State Management
Not applicable - server-side feature.

### 🚨 CRITICAL: Context Usage Strategy
Not applicable - server-side feature.

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

#### 📂 **Current Implementation (Before)**

**File: `prompts/evacuation-routes/main-prompt.md`** (181 lines)
```markdown
# Evacuation Route Generation

You are an emergency evacuation planning expert. Generate **EXACTLY 3 evacuation routes**...

## Location Context
- **City**: {{city}}
- **State**: {{state}}
- **Coordinates**: {{lat}}, {{lng}}
- **Climate Zone**: {{climate_zone}}

## Scenarios
{{scenarios}}

## Output Format
For each route, provide:
- **name**: A descriptive name
- **description**: Brief explanation
- **distance**: Estimated distance in miles
- **estimatedTime**: Estimated driving time
- **waypoints**: 3-5 key points with lat/lng
- **hazards**: Potential hazards array

[Example JSON with basic structure]
```

**File: `src/lib/prompts.ts`** - `buildRoutePrompt()` function (lines 380-415)
```typescript
export async function buildRoutePrompt(
  location: { city, state, country, coordinates, climateZone },
  scenarios: string[]
): Promise<string> {
  // Load main-prompt.md
  // Resolve includes
  // Replace variables: city, state, country, lat, lng, climate_zone, scenarios
  // Return prompt
}
```

**File: `src/lib/mission-generation/evacuation-routes.ts`** - `generateEvacuationRoutes()` (lines 34-125)
```typescript
export async function generateEvacuationRoutes(
  location: LocationData,
  scenarios: ScenarioType[]
): Promise<EvacuationRoute[]> {
  // Build prompt with buildRoutePrompt(location, scenarios)
  // Call Claude Sonnet 3.5 via OpenRouter
  // Parse JSON with simple regex match
  // Validate routes array exists
  // Sanitize routes to EvacuationRoute type:
  //   - name, description, distance, estimatedTime
  //   - waypoints with lat/lng/name/description
  //   - hazards string array
  // Return sanitized routes or fallback
}
```

#### 📂 **After Refactor**

**File: `prompts/evacuation-routes/emp-comprehensive-prompt.md`** (New, ~250 lines)
```markdown
# EMP/Grid-Down Evacuation Route Generation

You are an expert emergency preparedness and evacuation planner.

## SCENARIO
- EMP / grid-down event with widespread power loss
- Traffic signals not working, GPS unavailable
- Fuel pumps, ATMs, payment systems may not work
- Emergency services overwhelmed

## HOUSEHOLD & CONTEXT (VARIABLES)
- family_size: {{family_size}}
- location: "{{location}}"
- climate_zone: "{{climate_zone}}"
- duration_days: {{duration_days}}
- budget_amount: "{{budget_amount}}"
- water_72hr: "{{water_72hr}}"
- food_calories_total: "{{food_calories_total}}"
- adults: {{adults}}
- children: {{children}}
- seniors: {{seniors}}
- medical_summary: "{{medical_summary}}"

## OUTPUT REQUIREMENTS
Return ONLY valid JSON with:
{
  "metadata": { scenario, location, family_profile, preparedness_assumptions, general_assumptions_text },
  "routes": [
    {
      route_id, name, priority, mode, origin_description, destination_description,
      estimated_total_distance_km, estimated_travel_time_hours_no_traffic,
      waypoints: [ order, name, type, description, notes ],
      rationale: { summary, emp_specific_considerations, family_specific_considerations },
      risks: [ description, likelihood, impact, mitigation ],
      directions: { step_by_step, special_instructions }
    }
  ]
}
```

**File: `src/lib/prompts.ts`** - Enhanced `buildRoutePrompt()` function
```typescript
export async function buildRoutePrompt(
  location: LocationData,
  scenarios: ScenarioType[],
  formData: WizardFormData  // NEW PARAMETER
): Promise<string> {
  // Load emp-comprehensive-prompt.md
  // Resolve includes
  // Calculate family composition from formData.familyMembers
  // Calculate preparedness data from formData
  // Replace 15+ variables including:
  //   - All existing: city, state, country, lat, lng, climate_zone, scenarios
  //   - NEW: family_size, adults, children, seniors, medical_summary
  //   - NEW: duration_days, budget_amount, water_72hr, food_calories_total
  // Return comprehensive prompt
}
```

**File: `src/lib/mission-generation/evacuation-routes.ts`** - Enhanced parsing
```typescript
export async function generateEvacuationRoutes(
  location: LocationData,
  scenarios: ScenarioType[],
  formData: WizardFormData  // NEW PARAMETER
): Promise<EvacuationRoute[]> {
  // Build prompt with enhanced buildRoutePrompt(location, scenarios, formData)
  // Call Claude Sonnet 3.5 via OpenRouter
  // Parse JSON with improved error handling
  // Extract metadata (store for future use)
  // Validate routes array exists
  // Sanitize routes with backward-compatible mapping:
  //   EXISTING: name, description, distance (from estimated_total_distance_km),
  //             estimatedTime (from estimated_travel_time_hours), waypoints, hazards
  //   NEW (optional): metadata, route_id, priority, mode, rationale, risks, directions
  // Return sanitized routes with enhanced data or fallback
}
```

**File: `src/types/mission-report.ts`** - Extended type definitions
```typescript
// Add new optional fields to EvacuationRoute interface
// Add new RouteMetadata, RouteRationale, RouteRisk, RouteDirections interfaces
// Maintain backward compatibility with existing fields
```

#### 🎯 **Key Changes Summary**
- [x] **New comprehensive prompt** - Replaces basic prompt with EMP-focused, family-aware version
- [x] **Enhanced prompt building** - `buildRoutePrompt()` accepts WizardFormData and populates 15+ variables
- [x] **Improved parsing** - Handles new JSON structure with metadata, rationale, risks, directions
- [x] **Backward-compatible mapping** - New fields stored as optional, existing fields preserved
- [x] **Type extensions** - New TypeScript interfaces for enhanced route data
- [x] **Files Modified:**
  - `prompts/evacuation-routes/emp-comprehensive-prompt.md` (new)
  - `src/lib/prompts.ts` (buildRoutePrompt signature and logic)
  - `src/lib/mission-generation/evacuation-routes.ts` (generateEvacuationRoutes signature and parsing)
  - `src/types/mission-report.ts` (type extensions)
- [x] **Impact:** Route generation now includes family context, preparedness assumptions, risk assessment, and GPS-free directions while maintaining full backward compatibility with existing route display logic

---

## 11. Implementation Plan

### Phase 1: Create New Prompt Template
**Goal:** Create comprehensive EMP-focused prompt with all required variables

- [x] **Task 1.1:** Create New Prompt File
  - Files: `prompts/evacuation-routes/emp-comprehensive-prompt.md`
  - Details: Copy the complete prompt from user's request, verify all variable placeholders
- [x] **Task 1.2:** Verify Prompt Syntax
  - Files: `prompts/evacuation-routes/emp-comprehensive-prompt.md`
  - Details: Ensure all {{variable}} placeholders are correctly formatted

### Phase 2: Extend Type Definitions
**Goal:** Add TypeScript types for enhanced route data

- [x] **Task 2.1:** Extend EvacuationRoute Interface
  - Files: `src/types/mission-report.ts`
  - Details: Add optional fields for metadata, rationale, risks, directions
- [x] **Task 2.2:** Create New Supporting Interfaces
  - Files: `src/types/mission-report.ts`
  - Details: Add RouteMetadata, RouteRationale, RouteRisk, RouteDirections interfaces

### Phase 3: Enhance Prompt Building Logic
**Goal:** Update buildRoutePrompt to accept and use WizardFormData

- [x] **Task 3.1:** Update buildRoutePrompt Signature
  - Files: `src/lib/prompts.ts`
  - Details: Add formData parameter, maintain backward compatibility
- [x] **Task 3.2:** Calculate Family Composition Variables
  - Files: `src/lib/prompts.ts`
  - Details: Extract adults, children, seniors counts from familyMembers array
- [x] **Task 3.3:** Calculate Preparedness Variables
  - Files: `src/lib/prompts.ts`
  - Details: Extract duration, budget, water, food from formData
- [x] **Task 3.4:** Load New Prompt Template
  - Files: `src/lib/prompts.ts`
  - Details: Update to load emp-comprehensive-prompt.md instead of main-prompt.md
- [x] **Task 3.5:** Replace All Template Variables
  - Files: `src/lib/prompts.ts`
  - Details: Extend variables object with 15+ fields from formData

### Phase 4: Update Route Generation and Parsing
**Goal:** Enhance generateEvacuationRoutes to handle new structure

- [x] **Task 4.1:** Update generateEvacuationRoutes Signature
  - Files: `src/lib/mission-generation/evacuation-routes.ts`
  - Details: Add formData parameter, update buildRoutePrompt call
- [x] **Task 4.2:** Enhance JSON Parsing Logic
  - Files: `src/lib/mission-generation/evacuation-routes.ts`
  - Details: Extract metadata from response, improve error handling
- [x] **Task 4.3:** Update Route Sanitization Logic
  - Files: `src/lib/mission-generation/evacuation-routes.ts`
  - Details: Map new JSON fields to extended EvacuationRoute type, preserve existing fields
- [x] **Task 4.4:** Update Fallback Route Generation
  - Files: `src/lib/mission-generation/evacuation-routes.ts`
  - Details: Ensure fallback routes work with new type structure

### Phase 5: Update Mission Generation Integration
**Goal:** Pass formData through mission generation flow

- [x] **Task 5.1:** Update Mission Generation Call Site
  - Files: Find where generateEvacuationRoutes is called
  - Details: Pass formData to generateEvacuationRoutes function

### Phase 6: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only

- [x] **Task 6.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run `npm run lint` on changed files
- [x] **Task 6.2:** Type Checking
  - Files: All modified TypeScript files
  - Details: Run `npx tsc --noEmit` to verify type safety
- [x] **Task 6.3:** Static Logic Review
  - Files: Modified business logic files
  - Details: Read code to verify logic, edge case handling, error handling

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 6, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 7: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [x] **Task 7.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
- [x] **Task 7.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 8: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for route generation functionality

- [x] **Task 8.1:** Present AI Testing Results
  - Files: Summary of automated test results
  - Details: Provide comprehensive results of all AI-verifiable testing
- [x] **Task 8.2:** Request User Testing
  - Files: Specific testing checklist for user
  - Details: Instructions for testing route generation in browser
- [x] **Task 8.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [x] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── prompts/evacuation-routes/
│   └── emp-comprehensive-prompt.md    # New comprehensive EMP prompt
```

### Files to Modify
- [x] **`src/types/mission-report.ts`** - Extend EvacuationRoute type with optional new fields
- [x] **`src/lib/prompts.ts`** - Update buildRoutePrompt to accept formData and populate new variables
- [x] **`src/lib/mission-generation/evacuation-routes.ts`** - Update generateEvacuationRoutes to use formData and parse new structure
- [x] **Call site in mission generation flow** - Pass formData to generateEvacuationRoutes

### Dependencies to Add
No new dependencies required.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [x] **Error Scenario 1:** AI returns invalid JSON or missing required fields
  - **Code Review Focus:** JSON parsing logic in evacuation-routes.ts, fallback handling
  - **Potential Fix:** Robust try-catch with detailed logging, fallback to default routes
- [x] **Error Scenario 2:** Family composition calculation fails (empty familyMembers array)
  - **Code Review Focus:** Variable extraction logic in buildRoutePrompt
  - **Potential Fix:** Default values for adults=2, children=0, seniors=0 when array is empty
- [x] **Error Scenario 3:** Missing preparedness data in formData
  - **Code Review Focus:** Variable extraction in buildRoutePrompt
  - **Potential Fix:** Provide sensible defaults for duration, budget, water, food

### Edge Cases to Consider
- [x] **Edge Case 1:** Non-EMP scenarios with new prompt (nuclear, civil-unrest, etc.)
  - **Analysis Approach:** Test prompt with different scenario types
  - **Recommendation:** Prompt is flexible enough to handle all evacuation scenarios, not just EMP
- [x] **Edge Case 2:** Very large families (>10 members) or complex medical needs
  - **Analysis Approach:** Review prompt handling of edge case family compositions
  - **Recommendation:** Prompt should handle variable family sizes gracefully
- [x] **Edge Case 3:** Locations with limited route options (islands, remote areas)
  - **Analysis Approach:** Test with constrained geography
  - **Recommendation:** AI should provide realistic routes even with constraints, fallback available

### Security & Access Control Review
- [x] **Admin Access Control:** Not applicable - all authenticated users can generate routes
- [x] **Authentication State:** Route generation requires authenticated user (via mission generation flow)
- [x] **Form Input Validation:** WizardFormData should be validated before reaching route generation
- [x] **Permission Boundaries:** No permission issues - users can only generate routes for their own plans

### AI Agent Analysis Approach
Focus on robust error handling, data validation, and graceful degradation when AI returns unexpected output or when input data is incomplete.

---

## 15. Deployment & Configuration

### Environment Variables
No new environment variables required. Continues to use:
```bash
OPENROUTER_API_KEY=existing_api_key
```

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
✅ Strategic analysis completed and approved by user.

### Communication Preferences
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates
- [x] Flag any blockers or concerns immediately
- [x] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
Follow the mandatory 8-step workflow from the template.

### Code Quality Standards
- [x] Follow TypeScript best practices
- [x] Add proper error handling
- [x] Write professional comments explaining business logic
- [x] Use early returns to keep code clean
- [x] Use async/await instead of .then() chaining
- [x] NO FALLBACK BEHAVIOR - throw errors for unexpected formats
- [x] Ensure responsive design (not applicable - server-side)
- [x] Clean up removal artifacts

### Architecture Compliance
- [x] ✅ VERIFY: Used correct data access pattern (lib/ functions for complex queries)
- [x] ✅ VERIFY: No server/client boundary violations
- [x] ✅ VERIFY: No re-exports of non-async functions from Server Action files (not applicable)
- [x] ✅ VERIFY: Proper context usage patterns (not applicable - server-side)

---

## 17. Notes & Additional Context

### Research Links
- OpenRouter Claude Sonnet 3.5 documentation
- Existing evacuation-routes.ts implementation
- WizardFormData type definition

### ⚠️ Common Server/Client Boundary Pitfalls to Avoid
Not applicable - all code is server-side only.

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** generateEvacuationRoutes signature changes - requires updating call sites
- [x] **Database Dependencies:** No database changes - JSONB field accommodates new structure
- [x] **Component Dependencies:** UI components consume EvacuationRoute type - backward compatible via optional fields
- [x] **Authentication/Authorization:** No changes to access control

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** Mission generation flow must pass formData through to route generation
- [x] **UI/UX Cascading Effects:** UI can progressively display new fields - no breaking changes
- [x] **State Management:** No state management changes - server-side only
- [x] **Routing Dependencies:** No routing changes

#### 3. **Performance Implications**
- [x] **AI Generation Time:** Slightly longer due to more comprehensive prompt (~5-10% increase expected)
- [x] **Token Usage:** Higher token usage due to richer output structure (~30-50% increase)
- [x] **Bundle Size:** No impact - server-side only
- [x] **Caching Strategy:** No changes to caching

#### 4. **Security Considerations**
- [x] **Attack Surface:** No new attack surface - same AI generation flow
- [x] **Data Exposure:** Medical summary in prompt - ensure no PII in logs
- [x] **Permission Escalation:** No permission changes
- [x] **Input Validation:** Validate familyMembers array and formData before prompt building

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:** No disruption - enhanced data available but not required
- [x] **Data Migration:** No migration needed - new reports get enhanced data
- [x] **Feature Deprecation:** No features removed
- [x] **Learning Curve:** No learning curve - UI unchanged initially

#### 6. **Maintenance Burden**
- [x] **Code Complexity:** Slightly higher due to variable extraction logic
- [x] **Dependencies:** No new dependencies
- [x] **Testing Overhead:** Need to test with various family compositions and preparedness data
- [x] **Documentation:** Update route generation documentation to reflect new capabilities

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
None identified - this is an enhancement with backward compatibility.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [x] **Increased Token Usage:** 30-50% higher AI costs per route generation
- [x] **Prompt Complexity:** More complex prompt may occasionally produce unexpected output
- [x] **Medical Data in Logs:** Ensure medical_summary doesn't contain PII and is not logged

### Mitigation Strategies

#### Prompt Changes
- [x] **Validation Strategy:** Parse and validate JSON structure before accepting
- [x] **Fallback Plan:** Use existing fallback route generation if parsing fails
- [x] **Testing:** Test with various family compositions and edge cases

#### Cost Management
- [x] **Token Optimization:** Monitor token usage and optimize prompt if costs spike
- [x] **Rate Limiting:** Existing rate limiting should handle increased token usage
- [x] **Model Selection:** Continue using Claude Sonnet 3.5 - appropriate for this task

#### Data Privacy
- [x] **Medical Data Handling:** Do not log full prompts containing medical_summary
- [x] **User Consent:** Users already provide medical info in wizard - no new consent needed
- [x] **Data Retention:** Medical info in prompts not stored beyond generation time

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections filled out
- [x] **Identify Critical Issues:** Yellow flags identified (token usage, medical data)
- [x] **Propose Mitigation:** Mitigation strategies provided
- [x] **Alert User:** Token usage increase and medical data handling flagged
- [x] **Recommend Alternatives:** Hybrid approach recommended in strategic analysis

---

*Template Version: 1.3*
*Last Updated: 8/26/2025*
*Created By: Brandon Hancock*
