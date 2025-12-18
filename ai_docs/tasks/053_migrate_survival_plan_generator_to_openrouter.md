# Task 053: Migrate All Gemini Functions to OpenRouter

> **Task Type:** Technical Migration
> **Priority:** High
> **Estimated Complexity:** High
> **Dependencies:** OpenRouter integration already configured

---

## 1. Task Overview

### Task Title
**Migrate All Remaining Gemini Functions (4 total) from Direct Google Gemini API to OpenRouter**

### Goal Statement
**Goal:** Complete the OpenRouter consolidation by migrating all 4 remaining Gemini-dependent functions in `src/app/actions.ts` to use OpenRouter exclusively. This eliminates the need for separate GEMINI_API_KEY management (except for embeddings), simplifies the AI provider architecture, and standardizes all text generation on the Vercel AI SDK with OpenRouter.

**Functions to Migrate:**
1. `generateSurvivalPlan` - Complex survival plan generation (Sonnet recommended)
2. `assessInventory` - Simple readiness scoring (Haiku recommended)
3. `filterVideosWithLLM` - YouTube video filtering (Haiku recommended)
4. `filterTextResourcesWithLLM` - Article/PDF filtering (Haiku recommended)

---

## 2. Strategic Analysis & Solution Options

### Problem Context
The `generateSurvivalPlan` function currently uses Google's Gemini SDK directly with custom `Type` enum schemas for structured JSON generation. As part of the consolidation effort to use OpenRouter exclusively (except for embeddings), this function needs migration to the Vercel AI SDK with OpenRouter.

The function is critical - it generates the core survival plan with supplies, routes, skills, and simulation logs. We need to maintain identical functionality while switching the underlying provider.

### Solution Options Analysis

#### Option 1: Claude Sonnet 3.5 via OpenRouter (RECOMMENDED)
**Approach:** Use Claude Sonnet 3.5 through OpenRouter with Zod schema validation via Vercel AI SDK's `generateObject`

**Pros:**
- ✅ **Superior structured output quality** - Claude excels at complex JSON generation
- ✅ **Better prompt adherence** - More reliable at following detailed instructions
- ✅ **Proven reliability** - Already using Sonnet successfully for mission generation
- ✅ **Strong safety guardrails** - Less likely to generate inappropriate content
- ✅ **Zod integration** - Better TypeScript typing than Gemini's Type enum

**Cons:**
- ❌ **Higher cost** - ~$3/million input tokens vs Gemini's free tier
- ❌ **Slightly slower** - ~2-3s response time vs Gemini's ~1-2s

**Implementation Complexity:** Medium - Requires Zod schema conversion
**Risk Level:** Low - Pattern already proven in other parts of codebase

#### Option 2: Gemini 2.0 Flash via OpenRouter
**Approach:** Keep using Gemini but route through OpenRouter instead of direct API

**Pros:**
- ✅ **Cost effective** - Free tier available
- ✅ **Fast** - Quick response times
- ✅ **Familiar** - Similar to current implementation

**Cons:**
- ❌ **Lower quality** - Gemini Flash less reliable for complex structured outputs
- ❌ **Still requires Zod conversion** - Same migration effort as Option 1
- ❌ **Less consistent** - More prone to schema violations

**Implementation Complexity:** Medium - Same Zod schema conversion needed
**Risk Level:** Medium - Gemini Flash quality less proven for complex tasks

#### Option 3: GPT-4 Turbo via OpenRouter
**Approach:** Use OpenAI's GPT-4 Turbo through OpenRouter

**Pros:**
- ✅ **Good structured output** - Reliable JSON generation
- ✅ **Well-documented** - Extensive examples and patterns
- ✅ **Moderate cost** - Between Gemini and Claude

**Cons:**
- ❌ **Not best-in-class** - Claude Sonnet outperforms for this use case
- ❌ **No clear advantage** - Doesn't excel over Claude for this task

**Implementation Complexity:** Medium - Same Zod schema conversion
**Risk Level:** Low - But no compelling reason to choose over Claude

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option 1 - Claude Sonnet 3.5 via OpenRouter

**Why this is the best choice:**
1. **Quality First** - The survival plan generation is a critical user-facing feature that requires high-quality, reliable output. Claude Sonnet's superior prompt adherence and structured output quality justify the slightly higher cost.
2. **Consistency** - We're already using Claude Sonnet for other mission generation tasks. Standardizing on one high-quality model simplifies monitoring and optimization.
3. **Future-proof** - Claude's strong performance on complex tasks positions us well for future enhancements to the survival plan generation logic.

**Key Decision Factors:**
- **Performance Impact:** Minimal - 1-2s additional latency acceptable for this use case
- **User Experience:** Improved - Higher quality plans with better adherence to requirements
- **Maintainability:** Better - Unified around Claude ecosystem, fewer AI providers to manage
- **Scalability:** Excellent - Claude handles increased complexity well as we enhance features
- **Security:** Superior - Claude's safety guardrails reduce risk of inappropriate content

**Alternative Consideration:**
If cost becomes a concern at scale, we can re-evaluate using Gemini 2.0 Flash for simple queries while keeping Sonnet for complex generation. However, for initial migration, prioritizing quality over cost is the right approach.

### Decision Request

**👤 USER DECISION REQUIRED:**
Based on this analysis, do you want to proceed with Claude Sonnet 3.5 (recommended), or would you prefer to use Gemini 2.0 Flash via OpenRouter to minimize costs?

**Questions for you to consider:**
- Is the quality of survival plans more important than cost savings?
- Are you comfortable with the 1-2s additional latency?
- Do you want to standardize on Claude for all complex AI tasks?

**Next Steps:**
Once you approve the strategic direction, I'll provide implementation options (preview code changes or proceed directly).

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 16, React 19, TypeScript 5
- **AI Integration:**
  - Currently: Direct Google Gemini SDK (`@google/genai` package) with `Type` enum schemas
  - Target: Vercel AI SDK (`ai` package) with OpenRouter provider and Zod schemas
- **Database & ORM:** Supabase (PostgreSQL) via Drizzle ORM (not affected by this change)
- **OpenRouter:** Already configured in `src/lib/openrouter.ts` with Sonnet, Haiku, and Gemini models available

### Current State
**File:** `src/app/actions.ts` - Lines 86-266

**Current Implementation:**
- Uses `GoogleGenAI` SDK directly with `ai.models.generateContent()`
- Employs Gemini's `Type` enum for schema definition (e.g., `Type.OBJECT`, `Type.STRING`, `Type.ARRAY`)
- Generates complex structured JSON with:
  - Supplies array with 5 properties each (item_name, search_query, unit_type, quantity_needed, urgency)
  - Simulation log array
  - Skills array
  - YouTube queries array
  - Routes array with nested waypoints (lat/lng/name)
- Currently uses `gemini-2.5-flash` model
- Processes response using type checking and JSON parsing
- Includes product matching logic after AI generation

**Dependencies:**
- `@google/genai` package (can remain for embeddings)
- `GoogleGenAI, Type` imports (will be replaced)
- `ai` instance initialization (will be removed)

### Existing Context Providers Analysis
Not applicable - this is a server-side function with no context dependencies.

---

## 4. Context & Problem Definition

### Problem Statement
The `generateSurvivalPlan` function is the last major Gemini-dependent function in `src/app/actions.ts` (after removing `validateLocation` and migrating other functions). It currently:

1. **Uses outdated SDK pattern** - Direct Gemini SDK calls instead of unified Vercel AI SDK
2. **Requires separate API key management** - GEMINI_API_KEY needed separately from OPENROUTER_API_KEY
3. **Creates architectural inconsistency** - Mix of Gemini SDK and Vercel AI SDK patterns in the same file
4. **Complex schema definition** - Type enum schemas are less type-safe than Zod

This migration will complete the consolidation effort, allowing us to:
- Manage a single OPENROUTER_API_KEY for all text generation (embeddings remain separate)
- Use consistent patterns across all AI generation functions
- Benefit from better TypeScript integration with Zod schemas
- Simplify testing and monitoring by routing through one provider

### Success Criteria
- [ ] All 4 Gemini functions migrated to OpenRouter (generateSurvivalPlan, assessInventory, filterVideosWithLLM, filterTextResourcesWithLLM)
- [ ] `generateSurvivalPlan` uses Claude Sonnet 3.5 via OpenRouter
- [ ] Other 3 functions use Claude Haiku via OpenRouter (cost-effective for simple tasks)
- [ ] All existing functionality preserved in all 4 functions
- [ ] Response schemas validated using Zod instead of Gemini Type enum
- [ ] Product matching logic continues to work unchanged
- [ ] Video and resource filtering quality maintained or improved
- [ ] No regression in quality or generation reliability
- [ ] Response times remain acceptable
- [ ] GEMINI_API_KEY no longer required for text generation (only for embeddings)
- [ ] All Gemini SDK imports removed from `src/app/actions.ts` (except embeddings remain)

---

## 5. Development Mode Context

- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing plans can be regenerated with new implementation
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - complete rewrite of function internals acceptable

---

## 6. Technical Requirements

### Functional Requirements
- Function must accept same parameters: `familySize`, `location`, `duration`, `scenarios`, `mobility`, `specialNeeds`, `budgetAmount`, `prepTime`, `personnel`
- Must return identical `GeneratedKit` structure with all fields populated
- Product matching integration must continue working
- Validation rules must remain enforced (unit_type enum, urgency levels, danger levels)
- Route generation must include vehicle routes (2x) and foot routes (1-2x)

### Non-Functional Requirements
- **Performance:** Generation time < 10 seconds total (AI + product matching)
- **Reliability:** 95%+ success rate for valid inputs
- **Error Handling:** Graceful failures with descriptive error messages
- **Type Safety:** Full TypeScript typing with Zod schema validation
- **Compatibility:** Works with existing UI components that consume `GeneratedKit`

### Technical Constraints
- Must use existing OpenRouter configuration from `src/lib/openrouter.ts`
- Cannot modify `GeneratedKit` type definition (breaking change for existing plans)
- Must maintain compatibility with `matchProducts` function
- Cannot change function signature (called from existing components)

---

## 7. Data & Database Changes

### Database Schema Changes
**None** - This change only affects the AI generation logic, not data storage.

### Data Model Updates
**None** - `GeneratedKit` type remains unchanged.

### Data Migration Plan
**Not required** - Existing saved plans remain valid. Users can regenerate plans if desired.

---

## 8. API & Backend Changes

### Server Actions
**Modified:**
- [x] **`generateSurvivalPlan`** in `src/app/actions.ts` - Complete internal rewrite to use OpenRouter

### Database Queries
**None** - Product matching queries remain unchanged.

### API Routes
**Not applicable** - This is a server action, not an API route.

### External Integrations
**Change:**
- Remove direct Gemini API integration
- Route through OpenRouter for Claude Sonnet 3.5 access

---

## 9. Frontend Changes

### New Components
**None** - UI components unchanged.

### Page Updates
**None** - No UI changes required.

### State Management
**None** - This change is backend-only.

---

## 10. Code Changes Overview

### 📂 **Current Implementation (Before)**

**File:** `src/app/actions.ts` (Lines 1-10, 86-266)

```typescript
// Current imports
import { GoogleGenAI, Type } from "@google/genai";

// Current initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Current function implementation
export const generateSurvivalPlan = async (
    familySize: number,
    location: string,
    duration: number,
    scenarios: ScenarioType[],
    mobility: MobilityType,
    specialNeeds: string[],
    budgetAmount: number,
    prepTime: string,
    personnel?: Person[]
): Promise<GeneratedKit> => {
    const scenarioList = scenarios.join(', ');
    const model = "gemini-2.5-flash";  // Direct Gemini model

    const prompt = `[... existing prompt ...]`;

    // Uses Gemini Type enum for schema
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            supplies: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        item_name: { type: Type.STRING },
                        search_query: { type: Type.STRING },
                        unit_type: {
                            type: Type.STRING,
                            enum: ["count", "gallons", "calories", "liters", "pairs", "sets"]
                        },
                        quantity_needed: { type: Type.NUMBER },
                        urgency: {
                            type: Type.STRING,
                            enum: ["High", "Medium", "Low"]
                        }
                    },
                    required: ["item_name", "search_query", "unit_type", "quantity_needed", "urgency"]
                }
            },
            // ... more Type schema definitions
        },
        required: ["supplies", "simulation_log", "skills", "youtube_queries", "routes"]
    };

    // Uses Gemini SDK
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    // Manual JSON parsing
    if (response.text) {
        const r = response as any;
        const text = typeof r.text === 'function' ? r.text() : r.text;
        const parsedRaw = JSON.parse(text);
        // ... rest of processing
    }
};
```

### 📂 **After Refactor**

**File:** `src/app/actions.ts`

```typescript
// New imports - replace Gemini SDK with Vercel AI SDK
import { generateObject } from 'ai';
import { getModel } from '@/lib/openrouter';
import { z } from 'zod';

// Remove Gemini initialization - no longer needed
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Updated function implementation
export const generateSurvivalPlan = async (
    familySize: number,
    location: string,
    duration: number,
    scenarios: ScenarioType[],
    mobility: MobilityType,
    specialNeeds: string[],
    budgetAmount: number,
    prepTime: string,
    personnel?: Person[]
): Promise<GeneratedKit> => {
    const scenarioList = scenarios.join(', ');

    const prompt = `[... same prompt ...]`;

    // Use Zod schema instead of Gemini Type enum
    const survivalPlanSchema = z.object({
        supplies: z.array(z.object({
            item_name: z.string(),
            search_query: z.string(),
            unit_type: z.enum(["count", "gallons", "calories", "liters", "pairs", "sets"]),
            quantity_needed: z.number(),
            urgency: z.enum(["High", "Medium", "Low"])
        })),
        simulation_log: z.array(z.string()),
        skills: z.array(z.string()),
        youtube_queries: z.array(z.string()),
        routes: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            type: z.string(),
            dangerLevel: z.enum(["High", "Medium", "Low"]),
            riskAssessment: z.string(),
            waypoints: z.array(z.object({
                lat: z.number(),
                lng: z.number(),
                name: z.string()
            }))
        }))
    });

    console.log("Calling OpenRouter (Claude Sonnet) for survival plan...");
    const startTime = Date.now();

    // Use Vercel AI SDK with OpenRouter
    const { object: parsedRaw } = await generateObject({
        model: getModel('SONNET'),  // Claude Sonnet 3.5 via OpenRouter
        prompt,
        schema: survivalPlanSchema
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`OpenRouter API call completed in ${elapsed}s`);

    // parsedRaw is already typed and validated via Zod
    // ... rest of processing (product matching, etc.) remains unchanged
};
```

### 🎯 **Key Changes Summary**
- [x] **Replace Imports:** Remove `GoogleGenAI, Type` → Add `generateObject, getModel, z`
- [x] **Remove Initialization:** Delete `const ai = new GoogleGenAI(...)` instance
- [x] **Convert Schema:** Gemini `Type` enum → Zod schema with better TypeScript types
- [x] **Update API Call:** `ai.models.generateContent()` → `generateObject()` with Zod validation
- [x] **Model Selection:** `gemini-2.5-flash` → `getModel('SONNET')` for Claude Sonnet 3.5
- [x] **Response Handling:** Automatic Zod validation → No manual JSON parsing needed
- [x] **Files Modified:** Only `src/app/actions.ts` (1 function, ~180 lines total)
- [x] **Impact:** Backend-only change, no UI modifications, no database changes

**Additional cleanup:**
- [x] Remove unused `Type` import if no other functions use it
- [x] Update console.log messages to reflect OpenRouter usage
- [x] Consider removing `@google/genai` import if only embeddings remain (keep for now since embeddings still use it)

---

## 11. Implementation Plan

### Phase 1: Update Imports and Dependencies
**Goal:** Replace Gemini SDK imports with Vercel AI SDK imports

- [ ] **Task 1.1:** Update imports in `src/app/actions.ts`
  - Files: `src/app/actions.ts` (lines 3-4)
  - Details: Remove `GoogleGenAI, Type` from `@google/genai`, add `generateObject` from `ai`, `getModel` from `@/lib/openrouter`, `z` from `zod`
- [ ] **Task 1.2:** Remove Gemini AI instance initialization
  - Files: `src/app/actions.ts` (line 10)
  - Details: Delete `const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });` - no longer needed

### Phase 2: Convert Response Schema to Zod
**Goal:** Replace Gemini Type enum schema with Zod schema

- [ ] **Task 2.1:** Create Zod schema for survival plan response
  - Files: `src/app/actions.ts` (lines 142-200)
  - Details: Convert nested Type.OBJECT/ARRAY/STRING schema to equivalent Zod schema using z.object(), z.array(), z.string(), z.number(), z.enum()
- [ ] **Task 2.2:** Verify schema completeness
  - Files: `src/app/actions.ts`
  - Details: Ensure all required fields, enums, and nested objects are properly defined in Zod schema

### Phase 3: Update API Call to Use OpenRouter
**Goal:** Replace Gemini API call with Vercel AI SDK generateObject call

- [ ] **Task 3.1:** Replace AI generation call
  - Files: `src/app/actions.ts` (lines 202-212)
  - Details: Replace `ai.models.generateContent()` with `generateObject({ model: getModel('SONNET'), prompt, schema })`
- [ ] **Task 3.2:** Update response handling
  - Files: `src/app/actions.ts` (lines 214-220)
  - Details: Remove manual JSON parsing - use destructured `{ object: parsedRaw }` from generateObject result
- [ ] **Task 3.3:** Update logging messages
  - Files: `src/app/actions.ts` (lines 202, 215)
  - Details: Change "Gemini API" references to "OpenRouter (Claude Sonnet)"

### Phase 4: Migrate assessInventory Function
**Goal:** Migrate simple readiness scoring function to OpenRouter (Haiku)

- [ ] **Task 4.1:** Convert assessInventory to use OpenRouter
  - Files: `src/app/actions.ts` (lines ~269-301)
  - Details: Replace Gemini SDK call with `generateObject({ model: getModel('HAIKU'), ... })`
- [ ] **Task 4.2:** Create Zod schema for inventory assessment
  - Files: `src/app/actions.ts`
  - Details: Simple schema: `z.object({ score: z.number(), advice: z.string() })`
- [ ] **Task 4.3:** Update response handling
  - Files: `src/app/actions.ts`
  - Details: Use destructured object from generateObject result

### Phase 5: Migrate filterVideosWithLLM Function
**Goal:** Migrate YouTube video filtering function to OpenRouter (Haiku)

- [ ] **Task 5.1:** Convert filterVideosWithLLM to use OpenRouter
  - Files: `src/app/actions.ts` (lines ~627-694)
  - Details: Replace Gemini SDK call with `generateObject({ model: getModel('HAIKU'), ... })`
- [ ] **Task 5.2:** Create Zod schema for video filtering
  - Files: `src/app/actions.ts`
  - Details: Schema: `z.object({ selectedIds: z.array(z.string()), reasoning: z.string() })`
- [ ] **Task 5.3:** Update video selection logic
  - Files: `src/app/actions.ts`
  - Details: Use typed object result instead of manual JSON parsing

### Phase 6: Migrate filterTextResourcesWithLLM Function
**Goal:** Migrate article/PDF filtering function to OpenRouter (Haiku)

- [ ] **Task 6.1:** Convert filterTextResourcesWithLLM to use OpenRouter
  - Files: `src/app/actions.ts` (lines ~696-754)
  - Details: Replace Gemini SDK call with `generateObject({ model: getModel('HAIKU'), ... })`
- [ ] **Task 6.2:** Create Zod schema for resource filtering
  - Files: `src/app/actions.ts`
  - Details: Schema: `z.object({ selectedIndices: z.array(z.number()) })`
- [ ] **Task 6.3:** Update resource selection logic
  - Files: `src/app/actions.ts`
  - Details: Use typed object result instead of manual JSON parsing

### Phase 7: Code Quality Verification
**Goal:** Ensure code quality and type safety for all migrations

- [ ] **Task 7.1:** Run TypeScript type checking
  - Files: All modified files
  - Details: `npx tsc --noEmit` to verify no type errors introduced
- [ ] **Task 7.2:** Run linting
  - Files: `src/app/actions.ts`
  - Details: `npm run lint` to ensure code quality standards met
- [ ] **Task 7.3:** Final code review
  - Files: `src/app/actions.ts`
  - Details: Verify all 4 functions migrated correctly, all Zod schemas match original Type schemas, all enum values preserved

### Phase 8: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 8.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval
- [ ] **Task 8.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 9: User Testing (Only After Code Review)
**Goal:** Request user to test all migrated AI functions in browser

- [ ] **Task 9.1:** Present AI Testing Results
  - Files: Summary of static analysis and code review results
  - Details: Provide comprehensive results of all AI-verifiable testing
- [ ] **Task 9.2:** Request User UI Testing
  - Files: User testing checklist
  - Details:
    - [ ] 👤 **Test generateSurvivalPlan:** Navigate to `/planner`, generate plan with various scenarios
    - [ ] 👤 Verify plan generates successfully with supplies, routes, skills, simulation logs
    - [ ] 👤 Confirm product matching still works (matched products appear)
    - [ ] 👤 Test with different special needs (infants, elderly, medical)
    - [ ] 👤 Verify response time is acceptable (< 10 seconds)
    - [ ] 👤 **Test assessInventory:** If accessible, verify readiness score and advice generation
    - [ ] 👤 **Test filterVideosWithLLM:** Check skill resources if visible, verify YouTube videos appear
    - [ ] 👤 **Test filterTextResourcesWithLLM:** Check articles/PDFs if visible in skill resources
    - [ ] 👤 Test edge cases (single person, 30+ day duration, multiple scenarios)
- [ ] **Task 9.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete browser testing and confirm results

---

## 12. Task Completion Tracking

### Phase 1: Update Imports and Dependencies
**Goal:** Replace Gemini SDK imports with Vercel AI SDK imports

- [ ] **Task 1.1:** Update imports in `src/app/actions.ts`
  - Files: `src/app/actions.ts` ☐
  - Details: Remove Gemini imports, add Vercel AI SDK imports ☐
- [ ] **Task 1.2:** Remove Gemini AI instance initialization
  - Files: `src/app/actions.ts` ☐
  - Details: Delete `const ai = new GoogleGenAI(...)` ☐

### Phase 2: Convert Response Schema to Zod (generateSurvivalPlan)
**Goal:** Replace Gemini Type enum schema with Zod schema

- [ ] **Task 2.1:** Create Zod schema for survival plan response
  - Files: `src/app/actions.ts` ☐
  - Details: Convert all Type enums to Zod equivalents ☐
- [ ] **Task 2.2:** Verify schema completeness
  - Files: `src/app/actions.ts` ☐
  - Details: All required fields, enums, nested objects verified ☐

### Phase 3: Update generateSurvivalPlan API Call
**Goal:** Replace Gemini API call with Vercel AI SDK generateObject call

- [ ] **Task 3.1:** Replace AI generation call
  - Files: `src/app/actions.ts` ☐
  - Details: Update to use `generateObject()` with Sonnet ☐
- [ ] **Task 3.2:** Update response handling
  - Files: `src/app/actions.ts` ☐
  - Details: Remove manual parsing, use typed object ☐
- [ ] **Task 3.3:** Update logging messages
  - Files: `src/app/actions.ts` ☐
  - Details: Change references to OpenRouter ☐

### Phase 4: Migrate assessInventory Function
**Goal:** Migrate simple readiness scoring function

- [ ] **Task 4.1:** Convert assessInventory to use OpenRouter
  - Files: `src/app/actions.ts` ☐
  - Details: Migrated to Haiku model ☐
- [ ] **Task 4.2:** Create Zod schema for inventory assessment
  - Files: `src/app/actions.ts` ☐
  - Details: Simple score/advice schema created ☐
- [ ] **Task 4.3:** Update response handling
  - Files: `src/app/actions.ts` ☐
  - Details: Using typed object ☐

### Phase 5: Migrate filterVideosWithLLM Function
**Goal:** Migrate YouTube video filtering function

- [ ] **Task 5.1:** Convert filterVideosWithLLM to use OpenRouter
  - Files: `src/app/actions.ts` ☐
  - Details: Migrated to Haiku model ☐
- [ ] **Task 5.2:** Create Zod schema for video filtering
  - Files: `src/app/actions.ts` ☐
  - Details: Schema for selectedIds/reasoning created ☐
- [ ] **Task 5.3:** Update video selection logic
  - Files: `src/app/actions.ts` ☐
  - Details: Using typed object ☐

### Phase 6: Migrate filterTextResourcesWithLLM Function
**Goal:** Migrate article/PDF filtering function

- [ ] **Task 6.1:** Convert filterTextResourcesWithLLM to use OpenRouter
  - Files: `src/app/actions.ts` ☐
  - Details: Migrated to Haiku model ☐
- [ ] **Task 6.2:** Create Zod schema for resource filtering
  - Files: `src/app/actions.ts` ☐
  - Details: Schema for selectedIndices created ☐
- [ ] **Task 6.3:** Update resource selection logic
  - Files: `src/app/actions.ts` ☐
  - Details: Using typed object ☐

### Phase 7: Code Quality Verification
**Goal:** Ensure code quality and type safety

- [ ] **Task 7.1:** Run TypeScript type checking
  - Files: All modified files ☐
  - Details: `npx tsc --noEmit` passed ☐
- [ ] **Task 7.2:** Run linting
  - Files: `src/app/actions.ts` ☐
  - Details: `npm run lint` passed ☐
- [ ] **Task 7.3:** Final code review
  - Files: `src/app/actions.ts` ☐
  - Details: All 4 functions verified ☐

---

## 13. File Structure & Organization

### Files to Modify
- [x] **`src/app/actions.ts`** - Update `generateSurvivalPlan` function (~180 lines modified)
  - Lines 3-4: Update imports
  - Line 10: Remove AI instance
  - Lines 86-266: Rewrite function implementation

### Dependencies to Add
**None** - All required dependencies already installed:
- `ai` package (Vercel AI SDK)
- `zod` package (schema validation)
- `@openrouter/ai-sdk-provider` package (OpenRouter integration)

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** OpenRouter API fails or times out
  - **Code Review Focus:** Error handling in generateObject call - does it throw descriptive errors?
  - **Potential Fix:** Add try/catch with fallback error message: "Failed to generate survival plan. Please try again."
- [ ] **Error Scenario 2:** Zod schema validation fails (AI returns invalid structure)
  - **Code Review Focus:** Does generateObject gracefully handle schema violations?
  - **Potential Fix:** Vercel AI SDK handles this automatically - throws ZodError with details
- [ ] **Error Scenario 3:** Product matching fails after successful AI generation
  - **Code Review Focus:** Error handling in `matchProducts` function call
  - **Potential Fix:** Ensure try/catch wraps both AI generation and product matching separately

### Edge Cases to Consider
- [ ] **Edge Case 1:** Empty scenarios array or invalid mobility type
  - **Analysis Approach:** Check function parameter validation at start
  - **Recommendation:** Add early parameter validation before AI call
- [ ] **Edge Case 2:** AI returns empty supplies array
  - **Analysis Approach:** Verify Zod schema requires non-empty arrays
  - **Recommendation:** Add `.min(1)` to supplies array schema: `z.array(...).min(1)`
- [ ] **Edge Case 3:** Extremely large input (100+ people, 365+ days)
  - **Analysis Approach:** Check if prompt becomes too long for model context window
  - **Recommendation:** Add validation for reasonable parameter ranges

### Security & Access Control Review
- [x] **Admin Access Control:** Not applicable - function used by all authenticated users
- [x] **Authentication State:** Function called from protected routes - auth handled by middleware
- [x] **Form Input Validation:** Parameters validated by wizard form before calling function
- [x] **Permission Boundaries:** No user data access - generates based on user inputs only
- [x] **API Key Security:** OPENROUTER_API_KEY stored as environment variable (secure)

### AI Agent Analysis Approach
Focus on error handling completeness and Zod schema accuracy. The main risk is schema mismatch causing validation failures. Recommend adding explicit error handling around the `generateObject` call with user-friendly error messages.

**Priority Order:**
1. **Critical:** Verify Zod schema exactly matches expected AI output structure
2. **Important:** Ensure error handling provides clear user feedback
3. **Nice-to-have:** Add parameter validation for edge cases

---

## 15. Deployment & Configuration

### Environment Variables
**No changes required** - `OPENROUTER_API_KEY` already configured.

**Optional cleanup:**
- `GEMINI_API_KEY` can remain (still needed for embeddings in `src/lib/embeddings.ts`)
- After migrating remaining Gemini functions, `GEMINI_API_KEY` only needed for embeddings

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
✅ **Strategic analysis completed** - User approved Claude Sonnet 3.5 via OpenRouter approach

### Communication Preferences
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates after each phase
- [x] Flag any blockers or concerns immediately
- [x] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW

**Current Status:** Ready for implementation approval

**👤 IMPLEMENTATION OPTIONS:**

**A) Preview High-Level Code Changes**
Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

**B) Proceed with Implementation**
Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

**C) Provide More Feedback**
Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

### Code Quality Standards
- [x] Follow TypeScript best practices with explicit types
- [x] Add proper error handling around generateObject call
- [x] Use async/await instead of .then() chaining
- [x] Write professional comments explaining business logic (not change history)
- [x] Use early returns for parameter validation
- [x] Ensure Zod schema is type-safe and matches AI output exactly
- [x] Remove any unused imports after migration

### Architecture Compliance
- [x] ✅ Correct data access pattern: Server Action in `app/actions/` (mutations)
- [x] ✅ Using Vercel AI SDK with OpenRouter (not direct API calls)
- [x] ✅ Using Zod for schema validation (type-safe)
- [x] ❌ No API route needed - this is a server action
- [x] ❌ No new lib files needed - modifying existing action

---

## 17. Notes & Additional Context

### Research Links
- [Vercel AI SDK - generateObject documentation](https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-object)
- [Zod schema validation](https://zod.dev/)
- [OpenRouter API - Claude models](https://openrouter.ai/docs#models)

### Implementation Notes
- **Prompt remains identical** - Only the API call mechanism changes
- **Product matching unchanged** - `matchProducts` function continues to work with same data structure
- **Response time may increase slightly** - Claude Sonnet ~2-3s vs Gemini Flash ~1-2s, but quality improvement worth the trade-off
- **Cost impact minimal** - Survival plan generation is not a high-frequency operation

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** None - function signature unchanged
- [x] **Database Dependencies:** None - no database changes
- [x] **Component Dependencies:** None - returns same `GeneratedKit` structure
- [x] **Authentication/Authorization:** None - same auth requirements

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** None - downstream consumers receive identical data structure
- [x] **UI/UX Cascading Effects:** None - UI components work with same data
- [x] **State Management:** None - no state management changes
- [x] **Routing Dependencies:** None - same route access patterns

#### 3. **Performance Implications**
- [x] **Database Query Impact:** None - no database changes
- [x] **Bundle Size:** None - Vercel AI SDK already in bundle
- [x] **Server Load:** Minimal increase - Claude slightly slower than Gemini (~1-2s)
- [x] **Caching Strategy:** None - no caching changes

#### 4. **Security Considerations**
- [x] **Attack Surface:** Reduced - one less API key to manage
- [x] **Data Exposure:** None - same data handling
- [x] **Permission Escalation:** None - same access controls
- [x] **Input Validation:** Improved - Zod provides better validation

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:** None - same UI workflow
- [x] **Data Migration:** None - no data migration needed
- [x] **Feature Deprecation:** None - same features
- [x] **Learning Curve:** None - no user-facing changes

#### 6. **Maintenance Burden**
- [x] **Code Complexity:** Reduced - Zod schemas more maintainable than Type enums
- [x] **Dependencies:** Simplified - fewer AI providers to manage
- [x] **Testing Overhead:** None - same test coverage needs
- [x] **Documentation:** Minimal - update comments to reflect OpenRouter usage

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
**None identified** - This is a low-risk internal refactor.

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [x] **Slightly Higher Cost:** Claude Sonnet more expensive than Gemini Flash free tier
  - **Mitigation:** Monitor usage and costs, can switch to Gemini via OpenRouter if needed
- [x] **Response Time Increase:** Additional 1-2 seconds for plan generation
  - **Mitigation:** Acceptable trade-off for quality, can optimize later if needed

### Mitigation Strategies

#### API Changes
- [x] **No breaking changes** - Function signature and return type unchanged
- [x] **Backward compatible** - Existing code continues to work

#### Performance Impact
- [x] **Monitor response times** - Track actual latency post-migration
- [x] **User feedback** - Gather feedback on plan quality vs speed trade-off
- [x] **Optimization path** - Can switch to faster model if latency becomes issue

### AI Agent Checklist

- [x] **Complete Impact Analysis:** All sections reviewed - minimal impact identified
- [x] **Identify Critical Issues:** No red flags, two yellow flags with mitigation
- [x] **Propose Mitigation:** Cost and latency monitoring strategies defined
- [x] **Alert User:** Yellow flags communicated in strategic analysis
- [x] **Recommend Alternatives:** Gemini via OpenRouter alternative presented

### Example Analysis

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- None - Internal refactor only

**Performance Implications:**
- Response time may increase 1-2 seconds (acceptable for quality improvement)
- Minimal server load increase

**Cost Implications:**
- Modest cost increase per plan generation (Sonnet vs Gemini Flash)
- Low-frequency operation - total impact minimal

**User Experience Impacts:**
- No user-facing changes
- Potential quality improvement in generated plans

**Mitigation Recommendations:**
- Monitor OpenRouter usage and costs post-migration
- Track user feedback on plan quality
- Can switch to Gemini via OpenRouter if cost becomes concern

**✅ RISK ASSESSMENT: LOW**
This is a straightforward provider migration with no breaking changes. The primary trade-offs (cost vs quality, speed vs reliability) favor proceeding with Claude Sonnet.
```

---

*Task Created: 2025-01-18*
*Template Version: 1.3*
*Status: Awaiting User Approval*
