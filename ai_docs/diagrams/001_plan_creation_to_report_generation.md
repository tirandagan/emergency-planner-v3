# Plan Creation to Report Generation Flow

## Overview

This diagram documents the complete user flow from clicking "+ Create New Plan" on the dashboard through the 4-step wizard to the streaming LLM report generation and final save. It captures the data flow, LLM integration, prompt construction, and state management.

## Diagram

```mermaid
flowchart TD
    subgraph Dashboard["Dashboard Entry"]
        D1["PlanGrid Component"]
        D2{"Has Plans?"}
        D3["EmptyPlansState"]
        D4["Plan Cards + Create Button"]
        D5{"At Plan Limit?"}
        D6["UpgradeModal"]
        D7["Navigate to /plans/new"]
    end

    subgraph Wizard["PlanWizard (4 Steps)"]
        W0["Step 0: ScenarioStep"]
        W1["Step 1: PersonnelStep"]
        W2["Step 2: LocationStep"]
        W3["Step 3: StreamingGenerationStep"]

        W0_DATA["scenarios[]"]
        W1_DATA["familyMembers[]"]
        W2_DATA["location, budgetTier, durationDays, homeType"]
    end

    subgraph Generation["Streaming Generation"]
        SRV["StreamingReportView"]
        FETCH["POST /api/generate-mission"]
        STREAM["ReadableStream Processing"]
        PROGRESS["Progress Tracking"]
        DETECT["detectCurrentSection()"]
        RENDER["Real-time Markdown Render"]
    end

    subgraph APIRoute["API Route Processing"]
        AUTH["Supabase Auth Check"]
        VALIDATE["Request Validation"]
        BUNDLES["getBundlesForScenarios()"]
        BUNDLE_CTX["buildBundleContext()"]
        MEGA["buildStreamingMegaPrompt()"]
        USER_MSG["buildStreamingUserMessage()"]
        LLM["OpenRouter API Call"]
        CLAUDE["Claude 3.5 Sonnet"]
    end

    subgraph PromptSystem["Prompt Architecture"]
        MEGA_TPL["mega-prompt.md"]
        SYS_TPL["system-prompt.md"]
        OUT_TPL["output-format.md"]
        RISK_TPL["risk-assessment.md"]
        SIM_TPL["simulation-generation.md"]
        SCENARIO_TPL["scenarios/*.md"]
        SAFETY_TPL["safety-disclaimers.md"]
        VARS["extractTemplateVariables()"]
    end

    subgraph Save["Report Saving"]
        SAVE_ACTION["saveMissionReportFromStream()"]
        PARSE["parseReportContent()"]
        ENRICH["getEnrichedBundleData()"]
        DB_SAVE["saveMissionReportV2()"]
        REDIRECT["Navigate to /plans/reportId"]
    end

    %% Dashboard Flow
    D1 --> D2
    D2 -->|No| D3
    D2 -->|Yes| D4
    D3 --> D5
    D4 --> D5
    D5 -->|Yes| D6
    D5 -->|No| D7

    %% Wizard Flow
    D7 --> W0
    W0 --> W0_DATA
    W0_DATA --> W1
    W1 --> W1_DATA
    W1_DATA --> W2
    W2 --> W2_DATA
    W2_DATA --> W3

    %% Generation Trigger
    W3 --> SRV
    SRV --> FETCH
    FETCH --> AUTH

    %% API Processing
    AUTH --> VALIDATE
    VALIDATE --> BUNDLES
    BUNDLES --> BUNDLE_CTX
    BUNDLE_CTX --> MEGA
    MEGA --> USER_MSG
    USER_MSG --> LLM
    LLM --> CLAUDE

    %% Prompt Construction
    MEGA --> MEGA_TPL
    MEGA_TPL --> SYS_TPL
    MEGA_TPL --> OUT_TPL
    MEGA_TPL --> RISK_TPL
    MEGA_TPL --> SIM_TPL
    MEGA_TPL --> SCENARIO_TPL
    MEGA_TPL --> SAFETY_TPL
    MEGA --> VARS
    VARS --> USER_MSG

    %% Streaming Response
    CLAUDE -->|"Streaming"| STREAM
    STREAM --> PROGRESS
    PROGRESS --> DETECT
    DETECT --> RENDER

    %% Save Flow
    RENDER -->|"Complete"| SAVE_ACTION
    SAVE_ACTION --> PARSE
    PARSE --> ENRICH
    ENRICH --> DB_SAVE
    DB_SAVE --> REDIRECT

    %% High contrast styling for readability
    classDef dashboard fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
    classDef wizard fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff
    classDef generation fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    classDef api fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
    classDef prompt fill:#E91E63,stroke:#C2185B,stroke-width:2px,color:#fff
    classDef save fill:#00BCD4,stroke:#0097A7,stroke-width:2px,color:#fff
    classDef data fill:#607D8B,stroke:#455A64,stroke-width:2px,color:#fff

    class D1,D2,D3,D4,D5,D6,D7 dashboard
    class W0,W1,W2,W3 wizard
    class W0_DATA,W1_DATA,W2_DATA data
    class SRV,FETCH,STREAM,PROGRESS,DETECT,RENDER generation
    class AUTH,VALIDATE,BUNDLES,BUNDLE_CTX,MEGA,USER_MSG,LLM,CLAUDE api
    class MEGA_TPL,SYS_TPL,OUT_TPL,RISK_TPL,SIM_TPL,SCENARIO_TPL,SAFETY_TPL,VARS prompt
    class SAVE_ACTION,PARSE,ENRICH,DB_SAVE,REDIRECT save
```

## Key Components

### 1. Dashboard Entry
- **PlanGrid**: Displays existing plans or empty state
- **EmptyPlansState**: Shows "Create Your First Plan" CTA
- **Plan Limit Check**: Validates subscription tier before allowing creation

### 2. Wizard Steps (PlanWizard.tsx)
| Step | Component | Data Collected |
|------|-----------|----------------|
| 0 | ScenarioStep | `scenarios[]` - Array of disaster types |
| 1 | PersonnelStep | `familyMembers[]` - Age, gender, medical needs |
| 2 | LocationStep | Location, climate zone, budget, duration, home type |
| 3 | StreamingGenerationStep | Triggers generation with all collected data |

### 3. LLM Integration
- **Model**: Claude 3.5 Sonnet via OpenRouter
- **Temperature**: 0.7
- **Streaming**: Real-time response with progress tracking

### 4. Prompt System
- **Modular Templates**: `{{include:}}` pattern for composition
- **Variable Injection**: `{{variable}}` patterns replaced at runtime
- **Scenario-Specific**: Dynamic scenario prompts based on selection

### 5. Report Sections (Output)
1. Executive Summary
2. Risk Assessment
3. Recommended Bundles
4. Survival Skills Needed
5. Day-by-Day Simulation
6. Next Steps

## Related Files

| Category | Files |
|----------|-------|
| Dashboard | `src/components/Dashboard.tsx`, `src/components/dashboard/PlanGrid.tsx` |
| Wizard | `src/components/plans/wizard/PlanWizard.tsx`, `src/components/plans/wizard/steps/*.tsx` |
| Generation | `src/components/planner/StreamingReportView.tsx`, `src/app/api/generate-mission/route.ts` |
| Prompts | `prompts/mission-generation/*.md`, `prompts/mission-generation/scenarios/*.md` |
| Save | `src/app/actions/save-mission-report.ts`, `src/lib/mission-generation/markdown-parser.ts` |
