# Mission Planner → LLM Service Migration - Current Status

**Last Updated:** 2025-12-24
**Status:** ✅ **VALIDATION COMPLETE - READY FOR IMPLEMENTATION**
**Next Action:** Begin Phase-by-Phase Implementation

---

## 📊 **Progress Overview**

### ✅ **Completed:**
1. Strategic planning and decision-making
2. Workflow validation and comparison
3. Workflow file updates (removed budget/preparedness fields, added display names)
4. Input data structure documentation
5. Helper function specifications
6. Family names & ages verification

### 📋 **Ready to Implement:**
- Phase 1: Database schema changes (add `job_id` to mission_reports)
- Phase 2: LLM service client library
- Phase 3: API proxy routes
- Phase 4: Server Actions with data transformation
- Phase 5: Frontend polling components
- Phase 6: Webhook handler
- Phase 7: Dashboard integration
- Phase 8: Admin cleanup functions

---

## 🎯 **Key Decisions Made**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Implementation Approach** | Option 1: Polling with loading indicators | Pragmatic first step, validates workflow before adding streaming |
| **Polling Strategy** | Visibility-aware, component-scoped | Only polls when user is on progress page |
| **Multi-Job Support** | Yes - multiple simultaneous jobs | User flexibility |
| **Dashboard Display** | List view with mini progress cards | Clear, scannable |
| **Job Cancellation** | Both progress page + dashboard | Maximum control |
| **Cancel Behavior** | Delete mission_report record | Clean up, avoid clutter |
| **Completion Notification** | Sticky in-app toast (persists until dismissed) | Non-intrusive, always visible |
| **Toast Notification Type** | In-app only (not browser notifications) | Simpler implementation |
| **Job Archive** | Manual admin cleanup (>7 days) via UI + CLI | Admin control |
| **Webhook** | Use existing `/api/webhooks/llm-callback` | Leverage existing infrastructure |
| **Budget Fields** | Removed from wizard and workflow | User simplified intake |
| **Preparedness Field** | Removed from wizard and workflow | User simplified intake |

---

## 📁 **Updated Files**

### **LLM Service (Python)**
- ✅ `LLM_service/workflows/definitions/mission_generation.json`
  - Removed: `budgetTierLabel`, `budgetAmount`, `preparedness_level` fields
  - Added: `display_name` to all 6 workflow steps
  - Status: **VALIDATED & READY**

### **Documentation Created**
- ✅ `ai_docs/tasks/029_WORKFLOW_VALIDATION_FINAL.md` - Complete validation summary
- ✅ `ai_docs/tasks/029_VALIDATION_REPORT.md` - Detailed technical comparison
- ✅ `ai_docs/tasks/029_convert_mission_planner_to_llm_service_IMPLEMENTATION_READY.md` - Full implementation plan
- ✅ `ai_docs/tasks/029_CURRENT_STATUS.md` - This status document

---

## 🔧 **Critical Implementation Requirements**

### **1. Input Data Transformation (Server Action)**

The workflow expects this exact structure:

```typescript
const inputData = {
  formData: {
    scenarios: string[],
    familyMembers: FamilyMember[],
    location: LocationData,
    homeType: string,
    durationDays: number,
    familySize: number, // CALCULATED: familyMembers.length
  },
  familyDetails: string,  // PRE-FORMATTED multi-line string
  mobility: string,       // 'Bug In (shelter in place)' or 'Bug Out (evacuation planned)'
  bundles: ProductBundle[], // FETCHED from database
};
```

### **2. Helper Functions Required**

```typescript
// Includes names when provided!
function formatFamilyDetails(members: FamilyMember[]): string {
  return members.map((member, idx) => {
    const ageGroup = member.age < 18 ? 'child' : member.age >= 65 ? 'senior' : 'adult';
    const identifier = member.name || `Person ${idx + 1}`; // Use name if available
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

### **3. Database Schema Changes**

```sql
-- Add job_id column to mission_reports
ALTER TABLE mission_reports
ADD COLUMN job_id UUID,
ADD COLUMN status VARCHAR(50) DEFAULT 'generating';

CREATE INDEX idx_mission_reports_job_id ON mission_reports(job_id);
CREATE INDEX idx_mission_reports_status ON mission_reports(status);
```

---

## 📋 **Workflow Steps with Display Names**

| Step ID | Display Name | Purpose | Duration |
|---------|--------------|---------|----------|
| `format_bundles` | "Formatting Bundles" | Format product bundles for context | ~1s |
| `join_bundles` | "Joining Bundles" | Combine bundle data | ~1s |
| `build_scenario_list` | "Building Scenario List" | Format scenarios | ~1s |
| `build_user_message` | "Building User Message" | Build prompt message | ~1s |
| `generate_mission_plan` | "Generating Mission Plan" | LLM generation | ~50-60s (95% of time) |
| `parse_sections` | "Parsing Sections" | Extract sections | ~1s |

**Total Time:** 60-75 seconds

---

## 🎨 **User Experience Flow**

```
1. User completes wizard
   └─> Server Action submits job
       └─> Redirect to /plans/[reportId]/progress

2. Progress page (component-scoped polling)
   └─> Poll every 2s
   └─> Show friendly step names
   └─> Display progress bar

3. User navigates away
   └─> Polling STOPS
   └─> Job continues in background

4. Dashboard
   └─> Shows mini progress cards
   └─> "View Progress" button per job
   └─> "Cancel" button per job

5. Job completes
   └─> Webhook updates mission_reports.status
   └─> Sticky toast notification appears
   └─> User clicks "View Plan" or "Dismiss"

6. User clicks "View Plan"
   └─> Navigate to /plans/[reportId]
   └─> Show completed report
```

---

## 🚨 **Important Notes**

### **Family Names & Ages**
- ✅ `FamilyMember` type has optional `name` field
- ⚠️ **Current formatting function does NOT include names**
- ✅ **Enhanced function documented** - Includes names when provided
- ✅ Ages ARE included and prompts reference age-specific guidance

### **Wizard Changes**
- ✅ Budget questions removed from wizard
- ✅ Preparedness level question removed from wizard
- ✅ Workflow updated to match simplified wizard

### **Webhook Integration**
- ✅ Existing webhook endpoint: `/api/webhooks/llm-callback`
- ✅ Already handles `emergency_contacts` workflow
- 📝 Need to add handler for `mission_generation` workflow
- ✅ HMAC signature verification already implemented

---

## 📖 **Reference Documents**

1. **[029_WORKFLOW_VALIDATION_FINAL.md](029_WORKFLOW_VALIDATION_FINAL.md)**
   Complete validation summary with input requirements and helper functions

2. **[029_VALIDATION_REPORT.md](029_VALIDATION_REPORT.md)**
   Detailed technical comparison of current vs workflow implementation

3. **[029_convert_mission_planner_to_llm_service_IMPLEMENTATION_READY.md](029_convert_mission_planner_to_llm_service_IMPLEMENTATION_READY.md)**
   Full 8-phase implementation plan with code examples

4. **[029_convert_mission_planner_to_llm_service.md](029_convert_mission_planner_to_llm_service.md)**
   Original strategic analysis and decision-making document

---

## 🚀 **Next Session: Start Here**

### **Option A: Begin Implementation**
Say: **"Proceed with implementation"** or **"Start Phase 1"**

I'll begin with:
1. Database schema changes (add job_id column)
2. Create down migration file
3. Apply migration
4. Then proceed phase-by-phase with your approval

### **Option B: Review & Adjust**
Say: **"Review the plan"** or **"I have questions"**

I can:
- Walk through any phase in detail
- Adjust the implementation approach
- Explain helper functions
- Answer technical questions

### **Option C: Jump to Specific Phase**
Say: **"Skip to Phase X"** (where X = 1-8)

I can start from any phase if you've already completed earlier work.

---

## ✅ **Ready State Checklist**

- [x] Strategic decisions finalized
- [x] Workflow validated and updated
- [x] Input data structure documented
- [x] Helper functions specified
- [x] Database changes planned
- [x] UX flow designed
- [x] Webhook integration mapped
- [x] All documentation complete

**Status: READY FOR IMPLEMENTATION** 🎉

---

*Resume this task by reading this file first, then proceed with Phase 1 implementation.*
