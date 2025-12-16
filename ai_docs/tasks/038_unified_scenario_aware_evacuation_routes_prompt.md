# 038: Unified Scenario-Aware Evacuation Routes Prompt System

## 1. Task Overview

### Task Title
**Create Unified Scenario-Aware Evacuation Route Generation Prompt**

### Goal Statement
Design and implement a single, comprehensive prompt that generates 3-5 contextually appropriate evacuation routes for ANY emergency scenario or combination of scenarios (Natural Disaster, EMP/Grid Down, Nuclear, Civil Unrest, Pandemic, Multi-Year Sustainability), with proper waypoint structure, distance considerations, and scenario-specific route characteristics.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The application currently has two evacuation route prompts with significant limitations:
1. **emp-comprehensive-prompt.md**: Highly detailed but EMP-specific, doesn't handle other scenarios
2. **main-prompt.md**: Generic, scenario-agnostic, lacks depth and scenario-specific guidance

Users can select multiple scenarios in combination (e.g., EMP + Civil Unrest, Nuclear + EMP), but the current prompts cannot:
- Adapt route characteristics to scenario combinations
- Generate consistent 3-5 routes (sometimes only 1 route returned)
- Provide appropriate distance guidance (sometimes 1-mile local routes instead of evacuation distances)
- Handle scenario-specific requirements (foot travel for EMP, fallout avoidance for nuclear, backroads for civil unrest)

### Solution Options Analysis

#### Option 1: Scenario-Aware Unified Prompt with Conditional Logic
**Approach**: Create a single prompt with scenario detection and conditional route generation rules

**Pros:**
- ✅ One source of truth for all route generation
- ✅ Ensures consistent 3-5 route output requirement
- ✅ Adapts route characteristics based on active scenarios
- ✅ Handles scenario combinations intelligently (e.g., EMP + Civil Unrest = foot routes avoiding main roads)
- ✅ Maintainable in one location

**Cons:**
- ❌ More complex prompt structure
- ❌ Requires careful testing across all scenario combinations
- ❌ Single prompt must handle many edge cases

**Implementation Complexity:** Medium - Requires scenario detection logic and conditional route characteristics
**Risk Level:** Low - Clear requirements and testable combinations

#### Option 2: Multiple Specialized Prompts with Route Orchestrator
**Approach**: Keep specialized prompts for each scenario type, use orchestration layer to combine

**Pros:**
- ✅ Each prompt optimized for specific scenario
- ✅ Easier to add new scenarios without affecting existing

**Cons:**
- ❌ Complexity in orchestration layer
- ❌ Difficult to handle scenario combinations (which prompt takes precedence?)
- ❌ Multiple sources of truth to maintain
- ❌ Inconsistent route output across scenarios
- ❌ Doesn't solve current fragmentation problem

**Implementation Complexity:** High - Requires orchestration logic, prompt merging, conflict resolution
**Risk Level:** Medium - Combination logic complex, potential for inconsistent outputs

#### Option 3: Hybrid Approach with Base Template + Scenario Modules
**Approach**: Core route generation template with pluggable scenario-specific modules

**Pros:**
- ✅ Balance between unified and specialized
- ✅ Scenario modules can be tested independently
- ✅ Extensible for new scenarios

**Cons:**
- ❌ Additional complexity in template system
- ❌ Requires module integration logic
- ❌ May still have combination handling issues

**Implementation Complexity:** High - Template system, module loading, integration
**Risk Level:** Medium - Module interaction complexity

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Scenario-Aware Unified Prompt with Conditional Logic

**Why this is the best choice:**
1. **Simplicity**: Single prompt is easier to maintain, test, and debug than orchestration system
2. **Scenario Combinations**: Natural handling of combinations through conditional logic (if EMP AND Civil Unrest, then...)
3. **Consistency**: Single source guarantees 3-5 routes across all scenarios
4. **LLM-Native**: Modern LLMs excel at conditional logic and context-aware generation
5. **Proven Pattern**: EMP prompt shows detailed scenario-specific instructions work well

**Key Decision Factors:**
- **Performance Impact**: Single well-structured prompt performs better than multi-prompt orchestration
- **User Experience**: Consistent route quality regardless of scenario selection
- **Maintainability**: One file to update when route generation logic changes
- **Scalability**: Can add new scenarios by extending conditional sections
- **Testing**: Easier to test all combinations with single prompt

**Alternative Consideration:**
Option 2 could work if scenarios were completely independent, but they're not - many scenarios overlap (EMP affects civil unrest likelihood, nuclear events often trigger EMPs). The unified prompt naturally handles these interdependencies.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with Option 1 (Unified Scenario-Aware Prompt), or would you prefer a different approach?

**Questions for you to consider:**
- Does the recommended solution align with your priorities?
- Are there any specific scenario combinations that are particularly important to handle well?
- Do you have preferences for how routes should be prioritized when multiple scenarios are active?

**Next Steps:**
Once you approve the strategic direction, I'll create a detailed implementation plan showing exactly how the prompt will be structured and how it will handle all scenario types and combinations.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Framework**: Next.js 15.3 with React 19
- **Language**: TypeScript 5.4 with strict mode
- **AI Integration**: OpenRouter API for route generation
- **Prompt System**: Markdown-based prompts with variable substitution
- **Route Display**: Google Maps API for waypoint visualization and geocoding

### Current State

**Existing Prompts:**
1. **prompts/evacuation-routes/main-prompt.md**:
   - Generic route generation
   - Basic 3-route structure
   - Simple waypoint requirements
   - No scenario awareness
   - Currently NOT in use

2. **prompts/evacuation-routes/emp-comprehensive-prompt.md**:
   - Highly detailed EMP-specific instructions
   - Turn-by-turn navigation requirements
   - Vehicle vs. foot route differentiation
   - Detailed waypoint density requirements (6-10 for short, 15-25 for long)
   - Family context integration
   - Currently IN USE

**Issues Identified:**
- Sometimes generates only 1 route instead of minimum 3
- Occasionally produces very short routes (1 mile) instead of evacuation distances
- No handling of scenario combinations
- Waypoint numbering inconsistent
- Start/end markers (#B/#E) not systematically applied

**Scenario Types Available:**
1. Natural Disaster (hurricanes, earthquakes, floods, wildfires)
2. EMP/Grid Down (electronics failure, long-term infrastructure collapse)
3. Nuclear Event (detonation, power plant accident, dirty bomb)
4. Civil Unrest (riots, social instability, economic collapse)
5. Pandemic (infectious disease, isolation requirements)
6. Multi-Year Sustainability (extended societal collapse)

### Existing Context Providers Analysis
Not applicable to this prompt engineering task.

---

## 4. Context & Problem Definition

### Problem Statement

The current evacuation route generation system has three critical failures:

1. **Scenario Blindness**: Routes don't adapt to scenario-specific requirements (EMP routes should favor older vehicles + foot travel, nuclear routes should consider fallout patterns, civil unrest routes should avoid highways)

2. **Inconsistent Output**: Sometimes 1 route, sometimes 3, sometimes inappropriate distances (1-mile local vs 50-mile evacuation)

3. **Combination Handling**: Cannot intelligently combine scenario requirements (EMP + Civil Unrest = foot routes avoiding populated areas + main roads)

**User Impact:**
- Dangerous or impractical routes for specific scenarios
- Incomplete evacuation planning (missing alternative routes)
- False sense of security with inadequate routes

### Success Criteria

- [ ] **Always generates 3-5 routes** for any scenario or combination
- [ ] **Scenario-appropriate characteristics**:
  - EMP: Includes foot/bicycle routes, favors older vehicles, avoids electronics dependence
  - Nuclear: Considers fallout patterns, includes decontamination timing, perpendicular to wind
  - Civil Unrest: Uses backroads, avoids crowds, low-profile travel
  - Natural Disaster: Fastest routes + weather-aware alternates
  - Pandemic: Generally advises against evacuation unless to isolated location
- [ ] **Appropriate distances**: Minimum 10-50+ miles for true evacuation (not 1-mile local routes)
- [ ] **Proper waypoint structure**:
  - Numbered sequentially (1, 2, 3...)
  - Start marked as #B
  - End marked as #E
  - Google Maps-identifiable names (intersections, landmarks, addresses)
  - Density appropriate to distance (4-6 for short, 15-25 for long)
- [ ] **Intelligent combination handling**: Routes reflect merged requirements of multiple scenarios

---

## 5. Development Mode Context

- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes to prompts
- **Data loss acceptable** - existing routes can be regenerated
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and quality** over data preservation
- **Aggressive prompt refactoring allowed** - start fresh if needed

---

## 6. Technical Requirements

### Functional Requirements

**Route Generation:**
- System shall generate minimum 3 routes, maximum 5 routes
- Each route shall have minimum 4 waypoints, maximum 25 waypoints
- Waypoints shall be Google Maps-identifiable (specific intersections, landmarks, or addresses)
- Route distances shall be appropriate to scenario threat (10-100+ miles for evacuation)
- Routes shall head in different directions to provide true alternatives

**Scenario Awareness:**
- System shall detect active scenarios from input
- System shall adapt route characteristics to scenario requirements:
  - **EMP**: Foot/bicycle routes, older vehicle compatibility, no electronics dependency
  - **Nuclear**: Fallout avoidance, decontamination timing, wind direction awareness
  - **Civil Unrest**: Backroads preference, crowd avoidance, low-profile travel
  - **Natural Disaster**: Speed priority, infrastructure awareness, weather routing
  - **Pandemic**: Isolation preference, advise against evacuation unless necessary
  - **Multi-Year**: Rural destination priority, self-sufficiency considerations

**Scenario Combinations:**
- System shall merge requirements when multiple scenarios active
- Priority order for conflicting requirements:
  1. Safety (avoid immediate danger)
  2. Feasibility (routes must be physically possible)
  3. Speed (faster routes preferred if safety/feasibility met)
  4. Resources (fuel availability, water access, shelter options)

**Waypoint Requirements:**
- Start waypoint: #B marker, user's exact location or recognizable landmark
- Intermediate waypoints: Specific intersections (e.g., "I-40 and Exit 27") or highway junctions
- End waypoint: #E marker, specific geocodable destination with scenario rationale
- All waypoints: Include description, navigation notes, and distance markers

### Non-Functional Requirements

- **Performance**: Route generation shall complete within 45 seconds
- **Quality**: Routes shall be factually accurate (real roads, real intersections)
- **Usability**: Waypoint names shall be clear and unambiguous for Google Maps
- **Reliability**: Shall consistently generate full route count (not 1 when expecting 3)
- **Responsive Design**: Not applicable (prompt system)
- **Theme Support**: Not applicable (prompt system)

### Technical Constraints

- Must use existing OpenRouter API integration
- Must return JSON format compatible with existing parser
- Must work with variable substitution system ({{city}}, {{state}}, {{scenarios}}, etc.)
- Cannot exceed typical LLM context window (approximately 8K-16K tokens)

---

## 7. Data & Database Changes

### Database Schema Changes
No database changes required.

### Data Model Updates
No data model changes required.

### Data Migration Plan
Not applicable.

---

## 8. API & Backend Changes

No backend code changes required. This is a prompt engineering task only.

---

## 9. Frontend Changes

No frontend changes required for this task.

---

## 10. Code Changes Overview

### 📂 **Current Implementation**

**File: prompts/evacuation-routes/emp-comprehensive-prompt.md** (Currently in use)
- ~364 lines
- Highly detailed EMP-specific instructions
- Turn-by-turn navigation requirements with waypoint type system
- Comprehensive family context integration
- Detailed output JSON structure
- **Strengths**: Very detailed, clear requirements, good waypoint density guidance
- **Weaknesses**: EMP-only, cannot adapt to other scenarios

**File: prompts/evacuation-routes/main-prompt.md** (Not in use)
- ~164 lines
- Generic route generation
- Basic scenario text passthrough
- Simple 3-route structure
- **Strengths**: Scenario-agnostic (mentions {{scenarios}} variable)
- **Weaknesses**: No scenario-specific logic, lacks detail, no enforcement of route count

### 📂 **After Refactor**

**File: prompts/evacuation-routes/unified-scenario-aware-prompt.md** (NEW)
Will include:
- Scenario detection and conditional logic sections
- Merged best practices from both existing prompts
- Scenario-specific route characteristic tables
- Combination handling rules
- Enforced 3-5 route requirement with quality checks
- Waypoint structure requirements (#B, #E markers, Google Maps identification)
- Distance guidance by scenario type
- Mode selection logic (vehicle, foot, bicycle) based on scenarios
- Detailed examples for each scenario type

**Files to deprecate:**
- prompts/evacuation-routes/emp-comprehensive-prompt.md
- prompts/evacuation-routes/main-prompt.md

### 🎯 **Key Changes Summary**

- [ ] **New unified prompt**: Single prompt handles all scenarios and combinations
- [ ] **Scenario detection**: Conditional logic based on active scenarios
- [ ] **Route characteristics**: Scenario-specific distance, mode, hazard, and waypoint requirements
- [ ] **Consistent output**: Enforced 3-5 routes with quality validation
- [ ] **Waypoint structure**: Systematic #B/#E marking, numbering, and Google Maps compatibility
- [ ] **Combination handling**: Intelligent merging of multi-scenario requirements

**Files Modified:**
- Create: `/prompts/evacuation-routes/unified-scenario-aware-prompt.md` (NEW)
- Deprecate: `/prompts/evacuation-routes/emp-comprehensive-prompt.md`, `/prompts/evacuation-routes/main-prompt.md`

**Impact:**
- Evacuation route quality improves across all scenario types
- Consistent route count (always 3-5)
- Better waypoint structure for Google Maps integration
- Handles scenario combinations intelligently

---

## 11. Implementation Plan

### Phase 1: Prompt Analysis and Requirements Extraction
**Goal:** Extract all valuable patterns and requirements from existing prompts

- [ ] **Task 1.1:** Analyze emp-comprehensive-prompt.md structure
  - Files: `prompts/evacuation-routes/emp-comprehensive-prompt.md`
  - Details: Extract waypoint type system, navigation requirements, family context patterns
- [ ] **Task 1.2:** Analyze main-prompt.md scenario handling
  - Files: `prompts/evacuation-routes/main-prompt.md`
  - Details: Extract scenario variable usage, output format expectations
- [ ] **Task 1.3:** Document scenario characteristics from mission-generation prompts
  - Files: `prompts/mission-generation/scenarios/*.md`
  - Details: Extract key characteristics for each scenario type (already completed in this document)
- [ ] **Task 1.4:** Create scenario combination matrix
  - Details: Document all meaningful scenario combinations and their route requirements

### Phase 2: Unified Prompt Design
**Goal:** Design comprehensive prompt structure with scenario awareness

- [ ] **Task 2.1:** Design prompt structure outline
  - Details: Section organization, conditional logic placement, scenario detection approach
- [ ] **Task 2.2:** Create scenario detection and routing logic
  - Details: Conditional sections for each scenario type and combinations
- [ ] **Task 2.3:** Define route characteristic tables
  - Details: Distance ranges, mode preferences, hazard types by scenario
- [ ] **Task 2.4:** Design waypoint requirements section
  - Details: #B/#E markers, Google Maps identification, density requirements by distance
- [ ] **Task 2.5:** Create output format specification
  - Details: JSON structure, required fields, validation criteria

### Phase 3: Prompt Implementation
**Goal:** Create the unified scenario-aware prompt file

- [ ] **Task 3.1:** Write prompt header and scenario detection section
  - Files: `prompts/evacuation-routes/unified-scenario-aware-prompt.md`
  - Details: Introduction, scenario variable parsing, active scenario detection
- [ ] **Task 3.2:** Write scenario-specific route characteristic sections
  - Files: `prompts/evacuation-routes/unified-scenario-aware-prompt.md`
  - Details: One section per scenario type with route requirements
- [ ] **Task 3.3:** Write scenario combination handling section
  - Files: `prompts/evacuation-routes/unified-scenario-aware-prompt.md`
  - Details: Rules for merging requirements when multiple scenarios active
- [ ] **Task 3.4:** Write waypoint structure and requirements section
  - Files: `prompts/evacuation-routes/unified-scenario-aware-prompt.md`
  - Details: Numbering, #B/#E markers, Google Maps identification, density guidance
- [ ] **Task 3.5:** Write output format and validation section
  - Files: `prompts/evacuation-routes/unified-scenario-aware-prompt.md`
  - Details: JSON structure, field requirements, quality checks, 3-5 route enforcement
- [ ] **Task 3.6:** Add scenario-specific examples
  - Files: `prompts/evacuation-routes/unified-scenario-aware-prompt.md`
  - Details: Example routes for each scenario type to guide generation

### Phase 4: Testing and Validation
**Goal:** Verify prompt generates appropriate routes for all scenarios

- [ ] **Task 4.1:** Test single-scenario route generation
  - Details: Generate routes for each scenario type individually, verify characteristics
- [ ] **Task 4.2:** Test scenario combination route generation
  - Details: Test common combinations (EMP+Civil Unrest, Nuclear+EMP, etc.)
- [ ] **Task 4.3:** Validate route count consistency
  - Details: Verify 3-5 routes generated across multiple test runs
- [ ] **Task 4.4:** Validate waypoint structure
  - Details: Check #B/#E markers, numbering, Google Maps compatibility
- [ ] **Task 4.5:** Validate distance appropriateness
  - Details: Ensure routes are evacuation-distance (10-100+ miles), not local (1 mile)

### Phase 5: Integration and Deployment
**Goal:** Replace existing prompt and update references

- [ ] **Task 5.1:** Update route generation code to use new prompt
  - Files: Route generation API/action files
  - Details: Change prompt path reference
- [ ] **Task 5.2:** Deprecate old prompts
  - Files: `prompts/evacuation-routes/emp-comprehensive-prompt.md`, `prompts/evacuation-routes/main-prompt.md`
  - Details: Add deprecation notice, move to archive folder
- [ ] **Task 5.3:** Update documentation
  - Files: `prompts/README.md` or similar
  - Details: Document new unified prompt system

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

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

### New Files to Create
```
prompts/evacuation-routes/
├── unified-scenario-aware-prompt.md          # NEW: Main prompt file
└── archived/
    ├── emp-comprehensive-prompt.md           # MOVED: Original EMP prompt (archived)
    └── main-prompt.md                        # MOVED: Original generic prompt (archived)
```

### Files to Modify
None - this is purely prompt creation/replacement.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze

- [ ] **Error Scenario 1:** LLM fails to parse scenario list correctly
  - **Code Review Focus:** Scenario detection section of prompt
  - **Potential Fix:** Add explicit parsing examples and format requirements

- [ ] **Error Scenario 2:** Generated routes are too short (1 mile instead of evacuation distance)
  - **Code Review Focus:** Distance guidance section of prompt
  - **Potential Fix:** Add explicit minimum distance requirements by scenario type

- [ ] **Error Scenario 3:** Only 1 route generated instead of 3-5
  - **Code Review Focus:** Route count enforcement in prompt
  - **Potential Fix:** Add explicit "MUST generate minimum 3 routes, maximum 5 routes" with examples

- [ ] **Error Scenario 4:** Waypoints are vague and not Google Maps-identifiable
  - **Code Review Focus:** Waypoint naming requirements
  - **Potential Fix:** Add extensive examples of good vs bad waypoint names

### Edge Cases to Consider

- [ ] **Edge Case 1:** All scenarios selected at once
  - **Analysis Approach:** Test with all 6 scenarios active, verify logical combination handling
  - **Recommendation:** Prioritize immediate threats (Nuclear > EMP > Civil Unrest > Natural Disaster)

- [ ] **Edge Case 2:** Pandemic scenario active (should generally discourage evacuation)
  - **Analysis Approach:** Check if prompt correctly advises staying put vs evacuation to isolated location
  - **Recommendation:** Special handling for pandemic - only generate routes if destination is isolated location

- [ ] **Edge Case 3:** Urban location with limited evacuation options
  - **Analysis Approach:** Verify routes don't all use same highway
  - **Recommendation:** Enforce different directions and route diversity

- [ ] **Edge Case 4:** Very short evacuation distance (close to borders or safe zones)
  - **Analysis Approach:** Check if routes are still meaningful (not overlapping or redundant)
  - **Recommendation:** Minimum distance threshold enforcement

### Security & Access Control Review
Not applicable - this is prompt engineering, no security implications.

---

## 15. Deployment & Configuration

### Environment Variables
None required.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
Strategic analysis has been completed (Option 1 recommended). Awaiting user approval to proceed.

### Communication Preferences
- Ask for clarification on scenario prioritization if combinations are ambiguous
- Provide examples of route characteristics for user review before full implementation
- Flag any concerns about feasibility or quality immediately

### Implementation Approach - CRITICAL WORKFLOW

**After user approval:**

1. **Phase 1: Analysis** → Extract patterns from existing prompts and scenario descriptions
2. **Phase 2: Design** → Create detailed prompt structure with scenario logic
3. **Phase 3: Implementation** → Write unified prompt file
4. **Phase 4: Testing** → Validate with multiple scenario types and combinations
5. **Phase 5: Integration** → Update references and deprecate old prompts

---

## 17. Notes & Additional Context

### Research Links
- Existing prompts: `prompts/evacuation-routes/`
- Scenario descriptions: `prompts/mission-generation/scenarios/`
- Current route generation: Background generation with streaming display

### Key Insights from Scenario Analysis

**Natural Disaster:**
- Shelter-in-place vs evacuation decision critical
- Routes should avoid known hazard zones (flood plains, wildfire paths, coastal surge areas)
- Weather-aware routing (avoid storm tracks)
- Infrastructure awareness (damaged roads, bridges)

**EMP/Grid Down:**
- Most modern vehicles won't work (electronics fried)
- Favor routes for older vehicles (pre-1980s), foot travel, or bicycles
- Avoid areas dependent on electronics (traffic signals, fuel pumps)
- Consider water sources and shelter for multi-day foot travel
- Distance realistic for 10-20 miles per day on foot

**Nuclear Event:**
- Critical first 48 hours: shelter in place, NOT evacuation
- After 48-72 hours: radiation drops to 1% of initial (7-10 rule)
- Routes should be perpendicular to wind direction (avoid fallout path)
- Include decontamination points and timing guidance
- Destination at least 50-100 miles from blast/contamination zone

**Civil Unrest:**
- Avoid main highways and urban centers
- Use backroads and residential routes
- Low-profile travel (blend in, ordinary vehicle)
- Multiple alternates (roadblocks possible)
- Shorter distances acceptable (10-30 miles to safer areas)

**Pandemic:**
- Generally advise AGAINST evacuation (increases exposure)
- Exception: Evacuating TO isolated location (rural, family property)
- If evacuation necessary: minimize stops, full decontamination protocols
- Routes should avoid populated areas entirely

**Multi-Year Sustainability:**
- Destination should be rural, agricultural, with natural resources
- Focus on relocating TO sustainable location, not just away from danger
- Consider water sources, arable land, community presence
- May be one-way trip (permanent relocation)

### Scenario Combination Examples

**EMP + Civil Unrest:**
- No working vehicles PLUS social instability
- Routes: Foot/bicycle, backroads, avoid populated areas
- Distance: 10-30 miles to rural safer area
- Concerns: Resource competition, security, no law enforcement

**Nuclear + EMP:**
- Fallout radiation PLUS electronics failure
- Routes: Shelter 48+ hours FIRST, then evacuation on foot perpendicular to wind
- Distance: 50-100+ miles over multiple days
- Concerns: Radiation exposure during travel, decontamination without running water

**Natural Disaster + Civil Unrest:**
- Infrastructure damage PLUS social instability
- Routes: Fastest evacuation but avoid urban conflict zones
- Distance: Depends on disaster type
- Concerns: Damaged roads + roadblocks, resource scarcity

---

*Template Version: 1.3*
*Last Updated: 2025-12-14*
*Created By: Claude Sonnet 4.5*
