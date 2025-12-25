# Mission Generation Workflow Validation Report

**Date:** 2025-12-24
**Status:** ⚠️ CRITICAL DISCREPANCIES FOUND
**Workflow:** `LLM_service/workflows/definitions/mission_generation.json`
**Current Implementation:** `src/lib/ai/mission-generator.ts` + `src/lib/prompts.ts`

---

## 🔍 **Executive Summary**

The `mission_generation.json` workflow is **NOT equivalent** to the current implementation. There are several critical discrepancies that must be addressed before migration:

### **❌ Critical Issues Found:**
1. **Input data structure mismatch** - Workflow expects different field names
2. **Missing prompt template resolution** - Workflow uses simplified prompt loading
3. **Budget tier data** - Workflow expects `budgetTierLabel` and `budgetAmount` that don't exist in wizard
4. **Family details formatting** - Workflow receives pre-formatted string, current code formats inline

### **✅ What Matches:**
- Core prompt structure (system prompt + scenario prompts + shared elements)
- Output format expectations (## sections with regex parsing)
- Model and temperature settings (Claude 3.5 Sonnet, temp 0.7)
- Bundle context injection pattern

---

## 📊 **Detailed Comparison**

### **1. Prompt Building Logic**

#### **Current Implementation ([prompts.ts:192-228](src/lib/prompts.ts:192-228))**
```typescript
export async function buildMegaPrompt(formData: WizardFormData): Promise<string> {
  // 1. Load system prompt
  const systemPrompt = await loadPrompt('system-prompt.md');

  // 2. Load scenario-specific prompts
  const scenarioPrompts = await Promise.all(
    formData.scenarios.map(async (scenario) => {
      return await loadPrompt(`scenarios/${scenario}.md`);
    })
  );

  // 3. Combine prompts
  const combinedPrompt = [
    '# MISSION GENERATION INSTRUCTIONS',
    '',
    systemPrompt,
    '',
    ...scenarioPrompts.filter(Boolean),
  ].join('\n');

  // 4. Replace template variables
  const variables = extractTemplateVariables(formData);
  const finalPrompt = replaceVariables(combinedPrompt, variables);

  return finalPrompt;
}
```

#### **Workflow Implementation ([mission_generation.json:69-108](LLM_service/workflows/definitions/mission_generation.json:69-108))**
```json
{
  "id": "generate_mission_plan",
  "type": "llm",
  "prompt_template": "mission-generation/mega-prompt.md",
  "user_message": "${steps.build_user_message.user_message}",
  "variables": {
    "location": "${input.formData.location.city}, ${input.formData.location.state}",
    "climate_zone": "${input.formData.location.climateZone}",
    "family_size": "${input.formData.familySize}",
    "duration_days": "${input.formData.durationDays}",
    "budget_tier": "${input.budgetTierLabel}",
    "budget_amount": "${input.budgetAmount}",
    "bundle_context": "${steps.join_bundles.bundle_context}"
  }
}
```

**Mega-Prompt Template ([mega-prompt.md](LLM_service/workflows/prompts/mission-generation/mega-prompt.md))**
```markdown
# Mission Generation Mega-Prompt

{{include:system-prompt.md}}

---

## Output Format Requirements
{{include:output-format.md}}

---

## Risk Assessment Framework
{{include:risk-assessment.md}}

---

## Day-by-Day Simulation Guidelines
{{include:simulation-generation.md}}

---

## Bundle Recommendation Guidelines
{{include:../bundle-recommendations/selection-criteria.md}}

---

## Scenario-Specific Context
{{scenario_prompts}}

---

## Safety & Tone Guidelines
{{include:../shared/safety-disclaimers.md}}
{{include:../shared/tone-and-voice.md}}
```

### **⚠️ Discrepancy #1: Prompt Template Resolution**

**Issue:** The current Next.js implementation uses a **simpler prompt structure** (`buildMegaPrompt`), while the workflow uses a more **sophisticated mega-prompt** with multiple includes and structured sections.

**Impact:** The workflow will generate more structured and comprehensive prompts with additional guidance sections (risk assessment framework, simulation guidelines, bundle recommendation criteria) that the current system doesn't include.

**Verdict:** ✅ **This is actually an IMPROVEMENT** - The workflow's mega-prompt is better structured and more comprehensive.

---

### **2. User Message Construction**

#### **Current Implementation ([prompts.ts:425-461](src/lib/prompts.ts:425-461))**
```typescript
export function buildUserMessage(formData: WizardFormData): string {
  const location = `${formData.location.city}, ${formData.location.state}`;
  const scenarioList = formData.scenarios.join(', ');

  const familyDetails = formData.familyMembers.map((member, idx) => {
    const ageGroup = member.age < 18 ? 'child' : member.age >= 65 ? 'senior' : 'adult';
    const details = [`Person ${idx + 1}: ${ageGroup} (age ${member.age})`];
    if (member.medicalConditions) details.push(`medical: ${member.medicalConditions}`);
    if (member.specialNeeds) details.push(`special needs: ${member.specialNeeds}`);
    return details.join('; ');
  }).join('\n- ');

  return `Generate a comprehensive disaster preparedness plan...
**Scenarios**: ${scenarioList}
**Location**: ${location}
**Family Composition** (${formData.familyMembers.length} people):
- ${familyDetails}
**Home Type**: ${formData.homeType}
**Planning Duration**: ${formData.durationDays} days`;
}
```

#### **Workflow Implementation ([mission_generation.json:44-66](LLM_service/workflows/definitions/mission_generation.json:44-66))**
```json
{
  "id": "build_user_message",
  "type": "transform",
  "operation": "template",
  "config": {
    "template": "Generate a comprehensive, streaming disaster preparedness mission report.\n\n**SCENARIOS**: ${scenario_list}\n\n**LOCATION**: ${location_city}, ${location_state}\n**Climate Zone**: ${climate_zone}\n\n**FAMILY COMPOSITION** (${family_size} people):\n${family_details}\n\n**HOME TYPE**: ${home_type}\n\n**MOBILITY PLAN**: ${mobility}\n\n**PLANNING DURATION**: ${duration_days} days\n\n**BUDGET**: ${budget_tier} (approximately $${budget_amount})\n\n**CURRENT PREPAREDNESS**: ${preparedness_level}\n\nGenerate the complete mission report...",
    "variables": {
      "scenario_list": "${steps.build_scenario_list.scenario_list}",
      "location_city": "${input.formData.location.city}",
      "location_state": "${input.formData.location.state}",
      "climate_zone": "${input.formData.location.climateZone}",
      "family_size": "${input.formData.familySize}",
      "family_details": "${input.familyDetails}",
      "home_type": "${input.formData.homeType}",
      "mobility": "${input.mobility}",
      "duration_days": "${input.formData.durationDays}",
      "budget_tier": "${input.budgetTierLabel}",
      "budget_amount": "${input.budgetAmount}",
      "preparedness_level": "${input.formData.existingPreparedness}"
    }
  }
}
```

### **❌ Discrepancy #2: Missing Input Fields**

**Issue:** The workflow expects these fields in the input data:
- `input.familyDetails` (pre-formatted string)
- `input.mobility` (BUG_IN or BUG_OUT label)
- `input.budgetTierLabel` (e.g., "Premium", "Standard")
- `input.budgetAmount` (dollar amount as number)
- `input.formData.familySize` (count of family members)
- `input.formData.existingPreparedness` (preparedness level)

**Current State:** The wizard form data ([WizardFormData type](src/types/wizard.ts)) has:
- ✅ `formData.familyMembers` (array of family member objects)
- ✅ `formData.scenarios` (array of scenario strings)
- ✅ `formData.location` (LocationData object)
- ✅ `formData.homeType` (string)
- ✅ `formData.durationDays` (number)
- ✅ `formData.budgetTier` (enum: BASIC | PREMIUM)
- ❌ `formData.existingPreparedness` - **DOES NOT EXIST**
- ❌ `formData.familySize` - **NOT A FIELD** (derived from familyMembers.length)

**Impact:** Critical - The workflow will fail or produce incorrect output due to missing required fields.

**Required Fix:** The Server Action must transform wizard data before submitting to workflow:

```typescript
// Required transformation
const inputData = {
  formData: {
    ...wizardFormData,
    familySize: wizardFormData.familyMembers.length, // ADD
    existingPreparedness: wizardFormData.existingPreparedness || 'beginner', // ADD or default
  },
  familyDetails: formatFamilyDetails(wizardFormData.familyMembers), // Pre-format
  mobility: wizardFormData.mobilityPlan === 'BUG_OUT' ? 'Bug Out (evacuation planned)' : 'Bug In (shelter in place)', // Format
  budgetTierLabel: wizardFormData.budgetTier === 'PREMIUM' ? 'Premium' : 'Basic', // Label
  budgetAmount: wizardFormData.budgetTier === 'PREMIUM' ? 999 : 299, // Amount
  bundles: await getBundlesForRecommendation(), // Fetch bundles
};
```

---

### **3. Output Format & Parsing**

#### **Current Implementation ([mission-generator.ts:64-97](src/lib/ai/mission-generator.ts:64-97))**
```typescript
// Stream text directly
for await (const chunk of result.textStream) {
  fullContent += chunk;
}

return {
  content: fullContent, // Raw markdown
  formData,
  metadata: {
    model: MISSION_MODEL,
    generatedAt: new Date().toISOString(),
    tokensUsed: usage?.totalTokens,
    inputTokens: usage?.inputTokens,
    outputTokens: usage?.outputTokens,
    durationMs,
  },
};
```

#### **Workflow Output ([mission_generation.json:135-154](LLM_service/workflows/definitions/mission_generation.json:135-154))**
```json
{
  "outputs": {
    "mission_plan": "${steps.generate_mission_plan.mission_plan}",
    "parsed_sections": "${steps.parse_sections.parsed_sections}",
    "llm_usage": "${steps.generate_mission_plan.llm_usage}",
    "bundle_recommendations": "${steps.parse_sections.parsed_sections.recommended_bundles}",
    "form_data": "${input.formData}",
    "cost_data": {
      "provider": "openrouter",
      "model": "anthropic/claude-3.5-sonnet",
      "input_tokens": "${steps.generate_mission_plan.llm_usage.input_tokens}",
      "output_tokens": "${steps.generate_mission_plan.llm_usage.output_tokens}",
      "total_tokens": "${steps.generate_mission_plan.llm_usage.total_tokens}",
      "cost_usd": "${steps.generate_mission_plan.llm_usage.cost_usd}"
    }
  }
}
```

### **✅ Output Format Matches**

Both systems expect markdown output with `## Section Name` headers that can be parsed via regex. The workflow actually provides MORE structure:
- `mission_plan` - Full markdown text (same as `content`)
- `parsed_sections` - Pre-parsed sections (bonus!)
- `llm_usage` - Token/cost metadata (same as current)
- `bundle_recommendations` - Extracted bundle section (bonus!)

**Verdict:** ✅ **Workflow output is MORE comprehensive** - No issues, just additional useful data.

---

## 🚨 **Critical Issues Summary**

### **Issue #1: Missing `existingPreparedness` Field**

**Location:** `WizardFormData` type
**Severity:** 🔴 Critical
**Impact:** Workflow template references undefined field

**Solution:**
1. Add `existingPreparedness` field to wizard form (new dropdown: beginner, intermediate, advanced)
2. OR provide default value in Server Action transformation:
   ```typescript
   existingPreparedness: wizardFormData.existingPreparedness || 'beginner'
   ```

---

### **Issue #2: Input Data Transformation Required**

**Location:** Server Action `submitMissionGenerationJob()`
**Severity:** 🔴 Critical
**Impact:** Workflow expects pre-formatted fields that don't exist

**Solution:**
```typescript
// Server Action MUST transform wizard data before submission
export async function submitMissionGenerationJob(formData: WizardFormData) {
  const inputData = {
    formData: {
      ...formData,
      familySize: formData.familyMembers.length,
      existingPreparedness: formData.existingPreparedness || 'beginner',
    },
    familyDetails: formatFamilyDetails(formData.familyMembers),
    mobility: formatMobility(formData.mobilityPlan),
    budgetTierLabel: formatBudgetTier(formData.budgetTier),
    budgetAmount: calculateBudgetAmount(formData.budgetTier),
    bundles: await getBundlesForRecommendation(),
  };

  const { jobId } = await submitWorkflow('mission_generation', inputData);
  // ...
}

function formatFamilyDetails(members: FamilyMember[]): string {
  return members.map((m, idx) => {
    const ageGroup = m.age < 18 ? 'child' : m.age >= 65 ? 'senior' : 'adult';
    const details = [`Person ${idx + 1}: ${ageGroup} (age ${m.age})`];
    if (m.medicalConditions) details.push(`medical: ${m.medicalConditions}`);
    if (m.specialNeeds) details.push(`special needs: ${m.specialNeeds}`);
    return details.join('; ');
  }).join('\n');
}

function formatMobility(plan: 'BUG_IN' | 'BUG_OUT'): string {
  return plan === 'BUG_OUT'
    ? 'Bug Out (evacuation planned)'
    : 'Bug In (shelter in place)';
}

function formatBudgetTier(tier: 'BASIC' | 'PREMIUM'): string {
  return tier === 'PREMIUM' ? 'Premium' : 'Basic';
}

function calculateBudgetAmount(tier: 'BASIC' | 'PREMIUM'): number {
  return tier === 'PREMIUM' ? 999 : 299;
}
```

---

### **Issue #3: Workflow Uses Better Prompts**

**Location:** Workflow prompt template
**Severity:** 🟢 Low (actually a benefit)
**Impact:** Generated plans will be BETTER quality

**Details:** The workflow's mega-prompt includes additional structured guidance:
- Risk Assessment Framework
- Day-by-Day Simulation Guidelines
- Bundle Recommendation Criteria

**Verdict:** ✅ **No action needed** - This is an improvement.

---

## 📋 **Action Items Before Implementation**

### **Required Changes:**

1. **Add Wizard Form Field (or Default)**
   - [ ] Option A: Add `existingPreparedness` dropdown to wizard
   - [ ] Option B: Use default value 'beginner' in transformation

2. **Create Data Transformation Functions**
   - [ ] Implement `formatFamilyDetails()`
   - [ ] Implement `formatMobility()`
   - [ ] Implement `formatBudgetTier()`
   - [ ] Implement `calculateBudgetAmount()`

3. **Update Server Action**
   - [ ] Build proper `inputData` object with all required fields
   - [ ] Verify field names match workflow expectations exactly

4. **Test Workflow Output**
   - [ ] Submit test job to LLM service
   - [ ] Verify output structure matches ReportDataV2
   - [ ] Confirm parsed_sections can map to mission report sections

---

## ✅ **Validation Verdict**

**Status:** ⚠️ **Conditional Pass - Requires Transformation Layer**

The workflow is fundamentally sound and will produce equivalent (or better) output, BUT:
- **Input data MUST be transformed** before submission
- **Missing fields MUST be added or defaulted**
- **Helper functions MUST format data correctly**

**Recommendation:**
1. Implement the data transformation layer first
2. Test with real wizard data to confirm field mapping
3. Proceed with UI implementation once transformation is verified

---

## 📝 **Next Steps**

**Option A: Add Missing Wizard Field**
- Add `existingPreparedness` question to wizard
- Update WizardFormData type
- Least code changes, most accurate data

**Option B: Use Default Value**
- Default to 'beginner' in transformation
- Faster implementation, less wizard complexity
- **Recommended for MVP**

**Which do you prefer?**
