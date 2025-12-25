# Mission Generation Workflow - Final Validation Summary

**Date:** 2025-12-24
**Status:** ✅ VALIDATED & READY FOR IMPLEMENTATION
**Workflow File:** `LLM_service/workflows/definitions/mission_generation.json`

---

## ✅ **Validation Complete - Workflow is Ready**

The `mission_generation.json` workflow has been successfully validated and updated to match the current wizard implementation.

### **Changes Made:**
1. ✅ **Removed budget fields** - `budgetTierLabel` and `budgetAmount` removed from workflow
2. ✅ **Removed preparedness field** - `existingPreparedness` removed from workflow
3. ✅ **Added display names** - All workflow steps now have friendly `display_name` fields for UI progress indicators

---

## 📋 **Required Input Data Structure**

The workflow expects the following input structure (Server Action must provide this):

```typescript
const inputData = {
  // Original wizard form data with calculated familySize
  formData: {
    scenarios: string[],           // e.g., ['earthquake', 'pandemic']
    familyMembers: FamilyMember[], // Original array (not transformed)
    location: LocationData,         // City, state, coordinates, etc.
    homeType: string,              // 'apartment', 'house', etc.
    durationDays: number,          // 3, 7, 14, 30, etc.
    familySize: number,            // CALCULATED: familyMembers.length
  },

  // Pre-formatted strings for template injection
  familyDetails: string,  // Multi-line formatted string (see format below)
  mobility: string,       // 'Bug In (shelter in place)' or 'Bug Out (evacuation planned)'

  // Product bundles for recommendation
  bundles: ProductBundle[], // Array of available bundles from database
};
```

---

## 👥 **Family Details Formatting - CRITICAL**

### **Current Format (Names NOT Included)**
```typescript
// src/lib/prompts.ts:295-305
const familyDetails = formData.familyMembers.map((member, idx) => {
  const ageGroup = member.age < 18 ? 'child' : member.age >= 65 ? 'senior' : 'adult';
  const details = [`Person ${idx + 1}: ${ageGroup} (age ${member.age})`];
  if (member.medicalConditions) details.push(`medical: ${member.medicalConditions}`);
  if (member.specialNeeds) details.push(`special needs: ${member.specialNeeds}`);
  return details.join('; ');
}).join('\n- ');

// Output example:
// "Person 1: adult (age 35); medical: asthma
// - Person 2: child (age 8)"
```

### **⚠️ ISSUE: Names Are Not Included**

The `FamilyMember` type has an optional `name` field ([wizard.ts:19](src/types/wizard.ts:19)), but the current formatting function does NOT include it in the output.

### **✅ RECOMMENDED FIX: Include Names When Provided**

```typescript
function formatFamilyDetails(members: FamilyMember[]): string {
  return members.map((member, idx) => {
    const ageGroup = member.age < 18 ? 'child' : member.age >= 65 ? 'senior' : 'adult';

    // Include name if provided, otherwise use "Person N"
    const identifier = member.name || `Person ${idx + 1}`;
    const details = [`${identifier}: ${ageGroup} (age ${member.age})`];

    if (member.medicalConditions) details.push(`medical: ${member.medicalConditions}`);
    if (member.specialNeeds) details.push(`special needs: ${member.specialNeeds}`);

    return details.join('; ');
  }).join('\n');
}

// Output example WITH names:
// "Mom: adult (age 35); medical: asthma
// Sarah: child (age 8)
// Grandpa Joe: senior (age 72); medical: diabetes"

// Output example WITHOUT names:
// "Person 1: adult (age 35); medical: asthma
// Person 2: child (age 8)
// Person 3: senior (age 72); medical: diabetes"
```

### **Why This Matters**
When the AI generates plans, it can:
- Refer to family members by name ("Sarah needs a child-sized mask")
- Create more personalized and engaging narratives
- Make the plan feel more human and less generic

---

## 🎯 **Age-Specific Guidance in Prompts**

### **Current Prompt Behavior**
The prompts DO reference age-specific considerations:

1. **System Prompt** ([system-prompt.md](prompts/mission-generation/system-prompt.md)):
   - References "families" and "personalized" planning
   - Includes age groups implicitly (children, adults, seniors)

2. **Scenario Prompts** (e.g., [pandemic.md](prompts/mission-generation/scenarios/pandemic.md)):
   - Medical needs for different age groups
   - Age-appropriate protective equipment
   - Psychological needs for children vs adults

3. **Bundle Recommendations** ([selection-criteria.md](prompts/bundle-recommendations/selection-criteria.md)):
   - Consider family composition
   - Age-appropriate supplies

### **✅ Verdict: Prompts Already Support Age-Based Planning**

The prompts are structured to consider age when:
- The `familyDetails` string includes ages: `"child (age 8)"`, `"senior (age 72)"`
- The AI reads family composition and adapts recommendations
- Skills, supplies, and strategies are personalized based on age groups

**No prompt changes needed** - the existing prompts will use age data when present in `familyDetails`.

---

## 🔧 **Implementation Requirements**

### **Server Action Must Provide:**

```typescript
// src/app/actions/mission-generation.ts
export async function submitMissionGenerationJob(formData: WizardFormData) {
  const inputData = {
    formData: {
      ...formData,
      familySize: formData.familyMembers.length, // ADD THIS
    },
    familyDetails: formatFamilyDetails(formData.familyMembers), // FORMAT THIS
    mobility: formatMobility(formData.mobilityPlan || 'BUG_IN'), // FORMAT THIS
    bundles: await getBundlesForRecommendation(), // FETCH THIS
  };

  const { jobId } = await submitWorkflow('mission_generation', inputData);
  // ...
}

// Helper Functions Required:

function formatFamilyDetails(members: FamilyMember[]): string {
  return members.map((member, idx) => {
    const ageGroup = member.age < 18 ? 'child' : member.age >= 65 ? 'senior' : 'adult';
    const identifier = member.name || `Person ${idx + 1}`;
    const details = [`${identifier}: ${ageGroup} (age ${member.age})`];

    if (member.medicalConditions) details.push(`medical: ${member.medicalConditions}`);
    if (member.specialNeeds) details.push(`special needs: ${member.specialNeeds}`);

    return details.join('; ');
  }).join('\n');
}

function formatMobility(plan: 'BUG_IN' | 'BUG_OUT'): string {
  return plan === 'BUG_OUT'
    ? 'Bug Out (evacuation planned)'
    : 'Bug In (shelter in place)';
}
```

---

## 📊 **Workflow Steps with Display Names**

All steps now have friendly display names for progress UI:

| Step ID | Display Name | Duration Estimate |
|---------|--------------|-------------------|
| `format_bundles` | "Formatting Bundles" | ~1 second |
| `join_bundles` | "Joining Bundles" | ~1 second |
| `build_scenario_list` | "Building Scenario List" | ~1 second |
| `build_user_message` | "Building User Message" | ~1 second |
| `generate_mission_plan` | "Generating Mission Plan" | ~50-60 seconds (95% of time) |
| `parse_sections` | "Parsing Sections" | ~1 second |

**Total Estimated Time:** 60-75 seconds

---

## ✅ **Final Checklist**

- [x] Workflow JSON updated - budget/preparedness fields removed
- [x] Display names added to all steps
- [x] Input data structure documented
- [x] Family details formatting documented
- [x] Name inclusion enhancement documented
- [x] Age-based guidance verified in prompts
- [x] Helper functions specified
- [x] No prompt file changes needed

---

## 🚀 **Ready for Implementation**

**Status:** ✅ **APPROVED - Proceed with Implementation**

The workflow is validated and ready. Next steps:

1. Implement the Server Action with data transformation
2. Create the `formatFamilyDetails()` helper (with name support)
3. Build the polling UI components
4. Integrate the webhook handler
5. Test end-to-end with real wizard data

---

## 📝 **Key Takeaways**

1. **Workflow is fundamentally sound** - It will produce equivalent or better output
2. **Simple transformation layer needed** - Just format the data correctly before submission
3. **Names will improve personalization** - Include them in `familyDetails` formatting
4. **Ages are already supported** - Existing prompts will use age data appropriately
5. **No prompt changes required** - Current prompts handle age-based planning

**You're ready to proceed with implementation! 🎉**
