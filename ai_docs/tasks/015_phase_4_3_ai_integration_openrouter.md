# AI Task Template

> **Instructions:** Phase 4.3 - AI Integration via Vercel AI SDK + OpenRouter - Complete implementation of mission generation AI infrastructure with model flexibility, streaming, fallbacks, and cost monitoring.

---

## 1. Task Overview

### Task Title
**Title:** AI Integration Enhancement - Gemini 2.5 Flash Primary + Streaming + Cost Monitoring

### Goal Statement
**Goal:** Enhance the existing AI mission generation infrastructure to use Gemini 2.5 Flash as the primary model (for cost optimization), implement real-time streaming to the client UI, add proper fallback chains, create missing prompt files, and implement comprehensive AI usage logging with cost monitoring.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
**SKIP STRATEGIC ANALYSIS** - User has already specified the approach:
- Primary model: Gemini 2.5 Flash via OpenRouter
- Streaming: Hybrid approach with Vercel AI SDK
- Complete all missing roadmap items

### Problem Context
The current AI infrastructure uses Claude 3.5 Sonnet as the primary model and collects the full response before returning to client. The roadmap requires cost optimization via Gemini, real-time streaming for better UX, and comprehensive cost monitoring.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Frameworks & Versions:** Next.js 15+, React 19
- **Language:** TypeScript with strict mode
- **Database & ORM:** Supabase (Postgres) via Drizzle ORM
- **AI Stack:** Vercel AI SDK (`ai@5.0.109`), OpenRouter (`@openrouter/ai-sdk-provider@1.5.3`), Google AI (`@ai-sdk/google@0.0.55`)
- **Authentication:** Supabase Auth managed by middleware

### Current State
**Existing Infrastructure:**
| Component | Status | Location |
|-----------|--------|----------|
| OpenRouter client | ✅ Exists | `src/lib/openrouter.ts` |
| Mission generator | ✅ Exists | `src/lib/ai/mission-generator.ts` |
| Prompt loader | ✅ Exists | `src/lib/prompts/loader.ts` |
| 6 scenario prompts | ✅ Exists | `prompts/mission-generation/scenarios/` |
| System prompt | ✅ Exists | `prompts/mission-generation/system-prompt.md` |
| GeneratedKit type | ✅ Exists | `src/types/wizard.ts` |
| API endpoint | ✅ Exists | `src/app/api/mission-plan/generate/route.ts` |
| user_activity_log | ✅ Exists | `src/db/schema/analytics.ts` |

**Current Model:** `anthropic/claude-3.5-sonnet` (hardcoded)
**Current Streaming:** Uses `streamText()` but collects full response before returning

### Existing Context Providers Analysis
- **UserContext (`useUser()`):** Available in protected routes
- **UsageContext (`useUsage()`):** Available for subscription tier checks
- No AI-specific context needed - generation is API-driven

---

## 4. Context & Problem Definition

### Problem Statement
1. **Cost**: Claude 3.5 Sonnet is more expensive than Gemini 2.5 Flash for mission generation
2. **UX**: No real-time progress feedback during AI generation (can take 30-60 seconds)
3. **Resilience**: No fallback chain if primary model fails
4. **Missing Prompts**: Supply calculation, evacuation routing, and simulation log prompts not created
5. **Monitoring**: AI usage/costs not logged to `user_activity_log`
6. **Model Flexibility**: Hardcoded model selection, no per-feature model configuration

### Success Criteria
- [ ] Primary model switched to `google/gemini-2.5-flash-preview-05-20` via OpenRouter
- [ ] Fallback chain: Gemini → Claude → GPT-4o
- [ ] Real-time streaming to client with progress phases
- [ ] All 3 missing prompt files created and integrated
- [ ] AI usage logged to `user_activity_log` with: model, input_tokens, output_tokens, estimated_cost
- [ ] Model selection configurable per feature type
- [ ] Admin view for AI cost monitoring (basic)

---

## 5. Development Mode Context

### Development Mode Context
- **IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - update existing patterns as needed

---

## 6. Technical Requirements

### Functional Requirements
- User can see real-time progress during mission generation (streaming tokens + status phases)
- System will use Gemini 2.5 Flash as primary model, with automatic fallback to Claude/GPT-4o on failure
- System will log all AI usage to `user_activity_log` with cost metadata
- Admin can view AI usage statistics and costs in admin dashboard
- Prompt system includes supply calculation, evacuation routing, and simulation generation templates

### Non-Functional Requirements
- **Performance:** Generation should start streaming within 2 seconds of request
- **Reliability:** Fallback chain ensures 99%+ generation success rate
- **Cost Efficiency:** ~60-70% cost reduction vs current Claude 3.5 Sonnet usage
- **Observability:** All AI calls logged with model, tokens, cost, duration

### Technical Constraints
- Must use existing OpenRouter provider setup
- Must maintain compatibility with existing `WizardFormData` and `GeneratedKit` types
- Must work within Vercel serverless function timeout limits

---

## 7. Data & Database Changes

### Database Schema Changes
No schema changes required - `user_activity_log.metadata` JSONB field can store AI usage data.

### Data Model Updates
```typescript
// AI Usage Metadata (stored in user_activity_log.metadata)
interface AIUsageMetadata {
  feature: 'mission_generation' | 'bundle_recommendation' | 'readiness_suggestion' | 'email_personalization';
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number; // USD
  durationMs: number;
  success: boolean;
  errorMessage?: string;
  fallbackUsed?: boolean;
  originalModel?: string; // If fallback was used
}
```

### Data Migration Plan
- N/A - No migration required

### Down Migration Safety Protocol
- N/A - No migration required

---

## 8. API & Backend Changes

### Data Access Pattern - Following Architecture Rules

#### MUTATIONS (Server Actions) → `app/actions/ai.ts`
- [ ] `logAIUsage(userId, metadata)` - Log AI usage to user_activity_log

#### QUERIES (Data Fetching) → `lib/ai/` functions
- [ ] Enhanced `generateMissionPlan()` with streaming support
- [ ] New `generateWithFallback()` wrapper for resilience
- [ ] Model cost calculator utilities

#### API Routes → Only for streaming response
- [ ] Update `/api/mission-plan/generate/route.ts` to support streaming response

### Server Actions
- [ ] **`logAIUsage`** - Insert AI usage record to user_activity_log

### External Integrations
- **OpenRouter**: Primary AI provider (already configured)
- **Model Pricing Reference**: Will use OpenRouter's pricing for cost estimation

**Model Selection:**
- Mission generation: `google/gemini-2.5-flash-preview-05-20` (primary)
- Fallback chain: `anthropic/claude-3.5-sonnet` → `openai/gpt-4o`

---

## 9. Frontend Changes

### New Components
- [ ] **`components/wizard/GenerationStream.tsx`** - Real-time streaming display component
  - Shows status phases (Analyzing → Calculating → Generating → Parsing → Saving)
  - Displays streaming AI content as it arrives
  - Progress bar with percentage
  - Handles error states with retry option

### Page Updates
- [ ] **`/plans/new` Step 4** - Wire up streaming component to API
  - Replace static loading with real-time stream display
  - Add phase indicators matching GenerationProgress type

### State Management
- Use existing `GenerationProgress` type from `src/types/wizard.ts`
- Local state for streaming content accumulation
- No new context providers needed

---

## 10. Code Changes Overview

### Format to Follow:

#### 📂 **Current Implementation (Before)**

**`src/lib/openrouter.ts`:**
```typescript
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

export const MODELS = {
  SONNET: 'anthropic/claude-3.5-sonnet',
  OPUS: 'anthropic/claude-opus-4',
  HAIKU: 'anthropic/claude-3-haiku',
  GPT4: 'openai/gpt-4-turbo',
  GPT35: 'openai/gpt-3.5-turbo',
} as const;
```

**`src/lib/ai/mission-generator.ts`:**
```typescript
// Collects full response before returning
let fullContent = '';
for await (const chunk of result.textStream) {
  fullContent += chunk;
}
return { content: fullContent, ... };
```

#### 📂 **After Refactor**

**`src/lib/openrouter.ts`:**
```typescript
// Primary model: Gemini 2.5 Flash (cost-effective)
const DEFAULT_MODEL = 'google/gemini-2.5-flash-preview-05-20';

export const MODELS = {
  // Primary - Cost effective
  GEMINI_FLASH: 'google/gemini-2.5-flash-preview-05-20',

  // High quality fallbacks
  CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
  GPT4O: 'openai/gpt-4o',

  // Budget options
  GEMINI_FLASH_8B: 'google/gemini-2.0-flash-lite-001',
  CLAUDE_HAIKU: 'anthropic/claude-3-haiku',
} as const;

export const MODEL_COSTS = {
  'google/gemini-2.5-flash-preview-05-20': { input: 0.00015, output: 0.0006 },
  'anthropic/claude-3.5-sonnet': { input: 0.003, output: 0.015 },
  'openai/gpt-4o': { input: 0.0025, output: 0.01 },
  // ... per 1K tokens
} as const;

export const FALLBACK_CHAINS = {
  mission_generation: ['google/gemini-2.5-flash-preview-05-20', 'anthropic/claude-3.5-sonnet', 'openai/gpt-4o'],
  bundle_recommendation: ['google/gemini-2.5-flash-preview-05-20'],
  // ...
} as const;
```

**`src/lib/ai/mission-generator.ts`:**
```typescript
// Returns streaming response for real-time client updates
export async function generateMissionPlanStream(formData: WizardFormData) {
  // Returns ReadableStream for client consumption
  return streamText({
    model,
    system: systemPrompt,
    messages: [...],
    onFinish: async (result) => {
      // Log usage after completion
      await logAIUsage(userId, {
        feature: 'mission_generation',
        model: modelUsed,
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        ...
      });
    }
  });
}
```

#### 🎯 **Key Changes Summary**
- [ ] **Model Switch:** Primary model → Gemini 2.5 Flash (60-70% cost savings)
- [ ] **Streaming:** Return stream directly to client for real-time UX
- [ ] **Fallback Chain:** Auto-retry with alternate models on failure
- [ ] **Cost Logging:** Track all AI usage with token counts and costs
- [ ] **New Prompts:** 3 additional prompt files for comprehensive generation
- [ ] **Files Modified:** `openrouter.ts`, `mission-generator.ts`, API route, wizard Step 4

---

## 11. Implementation Plan

### Phase 1: Model Configuration & Cost Infrastructure
**Goal:** Update model configuration and add cost tracking utilities

- [ ] **Task 1.1:** Update OpenRouter configuration
  - Files: `src/lib/openrouter.ts`
  - Details: Add Gemini models, update DEFAULT_MODEL, add MODEL_COSTS, add FALLBACK_CHAINS
- [ ] **Task 1.2:** Create AI usage logging utility
  - Files: `src/lib/ai/usage-logger.ts`
  - Details: Function to log AI usage to user_activity_log with cost calculation
- [ ] **Task 1.3:** Create fallback wrapper utility
  - Files: `src/lib/ai/fallback.ts`
  - Details: Generic wrapper that tries models in fallback chain order

### Phase 2: Missing Prompt Files
**Goal:** Create the 3 missing prompt templates

- [ ] **Task 2.1:** Create supply-calculation.md prompt
  - Files: `prompts/mission-generation/supply-calculation.md`
  - Details: Template for calculating supply quantities based on family size, duration, scenarios
- [ ] **Task 2.2:** Create evacuation-routing.md prompt
  - Files: `prompts/mission-generation/evacuation-routing.md`
  - Details: Template for generating evacuation routes with waypoints
- [ ] **Task 2.3:** Create simulation-log-generation.md prompt
  - Files: `prompts/mission-generation/simulation-log-generation.md`
  - Details: Template for day-by-day survival simulation narrative
- [ ] **Task 2.4:** Update prompt loader to include new prompts
  - Files: `src/lib/prompts/loader.ts`, `src/lib/prompts.ts`
  - Details: Integrate new prompts into mega prompt builder

### Phase 3: Streaming Infrastructure
**Goal:** Implement real-time streaming from API to client

- [ ] **Task 3.1:** Update mission generator for streaming
  - Files: `src/lib/ai/mission-generator.ts`
  - Details: Add `generateMissionPlanStream()` that returns stream directly
- [ ] **Task 3.2:** Update API route for streaming response
  - Files: `src/app/api/mission-plan/generate/route.ts`
  - Details: Return streaming response using Vercel AI SDK patterns
- [ ] **Task 3.3:** Create streaming display component
  - Files: `src/components/wizard/GenerationStream.tsx`
  - Details: Client component showing phases + streaming content
- [ ] **Task 3.4:** Wire wizard Step 4 to streaming
  - Files: `src/app/(protected)/plans/new/...` (wizard Step 4 component)
  - Details: Replace static loading with GenerationStream component

### Phase 4: Fallback & Error Handling
**Goal:** Implement robust fallback chain and error handling

- [ ] **Task 4.1:** Implement fallback logic in generator
  - Files: `src/lib/ai/mission-generator.ts`
  - Details: Try primary model, catch errors, retry with fallback models
- [ ] **Task 4.2:** Add retry UI in streaming component
  - Files: `src/components/wizard/GenerationStream.tsx`
  - Details: Error state with retry button, show which model failed

### Phase 5: Cost Monitoring (Admin)
**Goal:** Basic admin view for AI cost monitoring

- [ ] **Task 5.1:** Create AI usage query functions
  - Files: `src/lib/queries/ai-usage.ts`
  - Details: Queries for total usage, usage by model, usage by user, costs over time
- [ ] **Task 5.2:** Add AI usage section to admin dashboard
  - Files: `src/app/admin/...` (appropriate admin page)
  - Details: Cards showing total AI spend, usage by model, recent generations

### Phase 6: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only

- [ ] **Task 6.1:** Code Quality Verification
  - Files: All modified files
  - Details: Run `npm run lint` and `npm run type-check`
- [ ] **Task 6.2:** Static Logic Review
  - Files: Modified AI files
  - Details: Verify fallback logic, cost calculations, streaming patterns

### Phase 7: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 7.1:** Present "Implementation Complete!" Message (MANDATORY)
- [ ] **Task 7.2:** Execute Comprehensive Code Review (If Approved)

### Phase 8: User Browser Testing (Only After Code Review)
**Goal:** Request human testing for streaming UI and generation

- [ ] **Task 8.1:** Present AI Testing Results
- [ ] **Task 8.2:** Request User UI Testing
  - Testing checklist:
    - [ ] Create new plan and observe streaming in Step 4
    - [ ] Verify progress phases display correctly
    - [ ] Check generated plan quality with Gemini model
    - [ ] Test network disconnect/reconnect during generation
    - [ ] Verify admin AI usage shows new generation

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
- [ ] **GET TODAY'S DATE FIRST** - Use time tool before adding timestamps
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp
- [ ] **Add brief completion notes** (file paths, key changes)

---

## 13. File Structure & Organization

### New Files to Create
```
project-root/
├── prompts/mission-generation/
│   ├── supply-calculation.md          # NEW
│   ├── evacuation-routing.md          # NEW
│   └── simulation-log-generation.md   # NEW
├── src/lib/ai/
│   ├── usage-logger.ts                # NEW - AI usage logging
│   └── fallback.ts                    # NEW - Fallback chain wrapper
├── src/lib/queries/
│   └── ai-usage.ts                    # NEW - Admin usage queries
└── src/components/wizard/
    └── GenerationStream.tsx           # NEW - Streaming display
```

### Files to Modify
- [ ] **`src/lib/openrouter.ts`** - Update models, add costs, add fallback chains
- [ ] **`src/lib/ai/mission-generator.ts`** - Add streaming function, integrate usage logging
- [ ] **`src/lib/prompts/loader.ts`** - Include new prompt files
- [ ] **`src/lib/prompts.ts`** - Update mega prompt builder
- [ ] **`src/app/api/mission-plan/generate/route.ts`** - Support streaming response

### Dependencies to Add
```json
{
  "dependencies": {
    // No new dependencies - all already installed
  }
}
```

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Primary model (Gemini) rate limited or down
  - **Code Review Focus:** Fallback chain implementation in `fallback.ts`
  - **Potential Fix:** Auto-retry with next model in chain, log failure
- [ ] **Error Scenario 2:** Streaming connection drops mid-generation
  - **Code Review Focus:** `GenerationStream.tsx` error handling
  - **Potential Fix:** Show partial content + retry button, save progress

### Edge Cases to Consider
- [ ] **Edge Case 1:** Very long generation (>60 seconds) hits Vercel timeout
  - **Analysis Approach:** Check function timeout settings
  - **Recommendation:** Use edge runtime or implement chunked generation
- [ ] **Edge Case 2:** Token count exceeds model context limit
  - **Analysis Approach:** Check prompt size calculations
  - **Recommendation:** Add token estimation before generation, truncate if needed

### Security & Access Control Review
- [ ] **Authentication State:** Generation requires authenticated user ✅ (existing)
- [ ] **Cost Control:** Should we add rate limiting for FREE tier users?
- [ ] **API Key Security:** OpenRouter key server-side only ✅ (existing)

---

## 15. Deployment & Configuration

### Environment Variables
```bash
# Already configured - verify these exist
OPENROUTER_API_KEY=sk-or-v1-...
```

No new environment variables required.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
**SKIP** - User has already approved the strategic direction.

### Communication Preferences
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates
- [x] Flag any blockers or concerns immediately
- [x] Suggest improvements or alternatives when appropriate

### Implementation Approach - CRITICAL WORKFLOW
Follow standard phase-by-phase implementation with:
1. Phase recap after each phase
2. Wait for "proceed" before next phase
3. Comprehensive code review after all phases
4. User browser testing last

### Code Quality Standards
- [x] Follow TypeScript best practices
- [x] Add proper error handling
- [x] Use early returns for clean code
- [x] Use async/await instead of .then() chaining
- [x] NO FALLBACK BEHAVIOR for unexpected formats - throw descriptive errors

### Architecture Compliance
- [x] Mutations → Server Actions (`app/actions/ai.ts`)
- [x] Complex queries → lib functions (`lib/queries/ai-usage.ts`)
- [x] API routes → Only for streaming response (required for real-time)
- [x] No server/client boundary violations

---

## 17. Notes & Additional Context

### Research Links
- [Vercel AI SDK Streaming](https://sdk.vercel.ai/docs/ai-sdk-core/generating-text#streamtext)
- [OpenRouter Model Pricing](https://openrouter.ai/docs#models)
- [Gemini 2.5 Flash Documentation](https://ai.google.dev/gemini-api/docs/models/gemini-v2)

### Model Cost Reference (per 1M tokens)
| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| gemini-2.5-flash | $0.15 | $0.60 | Primary - Fast, cheap |
| claude-3.5-sonnet | $3.00 | $15.00 | Fallback 1 - High quality |
| gpt-4o | $2.50 | $10.00 | Fallback 2 - Reliable |

### Estimated Cost Savings
- Current (Claude 3.5 Sonnet): ~$0.05-0.10 per generation
- After (Gemini 2.5 Flash): ~$0.005-0.01 per generation
- **Savings: ~90% per generation**

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. Breaking Changes Analysis
- [ ] **Existing API Contracts:** API route response changes from JSON to streaming - client must handle
- [ ] **Database Dependencies:** None - using existing `user_activity_log` table
- [ ] **Component Dependencies:** Wizard Step 4 must be updated to consume stream

#### 2. Ripple Effects Assessment
- [ ] **Data Flow Impact:** Generation now streams instead of returning complete JSON
- [ ] **UI/UX Cascading Effects:** Better UX during generation - real-time feedback
- [ ] **State Management:** GenerationProgress type already supports streaming states

#### 3. Performance Implications
- [ ] **Response Time:** Faster first byte (streaming starts immediately)
- [ ] **Bundle Size:** New component ~5KB - minimal impact
- [ ] **Server Load:** Similar - OpenRouter handles model routing

#### 4. Security Considerations
- [ ] **No new attack surface** - all changes server-side
- [ ] **Cost abuse potential** - consider rate limiting for FREE tier (future task)

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- None identified

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Model Quality Difference:** Gemini 2.5 Flash may produce slightly different output quality than Claude - user should verify generated plans meet expectations
- [ ] **Rate Limiting:** OpenRouter may have rate limits on Gemini models - monitor during testing

### Mitigation Strategies
- **Model Quality:** Fallback chain ensures high-quality fallback if Gemini underperforms
- **Rate Limits:** Fallback models will be used if primary hits limits

---

*Template Version: 1.3*
*Task Created: 2025-12-11*
*Task Number: 015*
