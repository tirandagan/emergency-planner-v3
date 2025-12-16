# Map & Route Generation Flow

## Overview

This diagram shows the complete end-to-end flow of evacuation route generation in the Emergency Planner app, including background processing, prompt assembly, LLM interaction, geocoding, database persistence, and frontend polling/display.

## Diagram

```mermaid
graph TB
    %% Entry Points
    Start["User Completes Wizard<br/>(WizardFormData)"]

    %% Mission Report Creation
    CreateReport["Create Mission Report<br/>(save-mission-report-v2.ts)"]

    %% Background Task Decision
    BgTasks["executeBackgroundTasks()<br/>(background-tasks.ts)"]
    CheckScenarios{"shouldGenerateRoutes()?<br/>Nuclear, Civil Unrest,<br/>Natural Disaster, EMP?"}

    %% Route Generation Process
    GenRoutes["generateEvacuationRoutes()<br/>(evacuation-routes.ts)"]
    BuildPrompt["buildRoutePrompt()<br/>(prompts.ts)"]

    %% Prompt Assembly
    LoadTemplate["Load Template File<br/>emp-comprehensive-prompt.md"]
    ResolveIncludes["resolveIncludes()<br/>Process {{include:...}}"]
    ReplaceVars["replaceVariables()<br/>{{city}}, {{family_size}}, etc."]

    %% LLM Interaction
    SendLLM["Send to Claude 3.5 Sonnet<br/>via OpenRouter<br/>generateText()"]
    ParseJSON["Parse JSON Response<br/>Extract routes array"]

    %% Geocoding Process
    GeocodeWaypoints["geocodeWaypoints()<br/>(geocoding.ts)"]
    GoogleAPI["Google Maps Geocoding API<br/>Convert names → lat/lng"]
    MergeCoords["Merge Coordinates<br/>with Route Data"]

    %% Database Persistence
    SaveDB["updateReportRoutes()<br/>Save to missionReports.evacuationRoutes"]
    DBUpdate["PostgreSQL Update<br/>Set evacuationRoutes field"]

    %% Frontend Polling
    Frontend["MapTab Component<br/>Loads after report creation"]
    PollingHook["useRoutePolling()<br/>Poll every 2s, max 20s"]
    APIEndpoint["GET /api/mission-reports/[id]/routes<br/>(route.ts)"]
    CheckStatus["checkRoutesStatus()<br/>Query DB for routes"]

    %% Map Display
    RoutesReady{"Routes Ready?<br/>evacuationRoutes !== null"}
    DisplayMap["MapComponent.tsx<br/>Render Google Maps"]
    RenderRoutes["RouteRenderer<br/>Draw polylines & markers"]

    %% Error Handling
    DefaultRoutes["getDefaultRoutes()<br/>Fallback on error"]
    ErrorDisplay["Show Loading Error<br/>Suggest refresh"]

    %% Flow Connections
    Start --> CreateReport
    CreateReport --> BgTasks
    BgTasks --> CheckScenarios

    CheckScenarios -->|Yes| GenRoutes
    CheckScenarios -->|No| SaveDB

    GenRoutes --> BuildPrompt
    BuildPrompt --> LoadTemplate
    LoadTemplate --> ResolveIncludes
    ResolveIncludes --> ReplaceVars
    ReplaceVars --> SendLLM

    SendLLM --> ParseJSON
    ParseJSON -->|Success| GeocodeWaypoints
    ParseJSON -->|Fail| DefaultRoutes

    GeocodeWaypoints --> GoogleAPI
    GoogleAPI --> MergeCoords
    MergeCoords --> SaveDB
    DefaultRoutes --> SaveDB

    SaveDB --> DBUpdate

    %% Frontend Flow
    Frontend --> PollingHook
    PollingHook --> APIEndpoint
    APIEndpoint --> CheckStatus
    CheckStatus --> RoutesReady

    RoutesReady -->|Yes| DisplayMap
    RoutesReady -->|No, retry| PollingHook
    RoutesReady -->|No, timeout| ErrorDisplay

    DisplayMap --> RenderRoutes

    %% Styling
    classDef entry fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
    classDef process fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff
    classDef prompt fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    classDef llm fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
    classDef db fill:#E91E63,stroke:#C2185B,stroke-width:2px,color:#fff
    classDef frontend fill:#8BC34A,stroke:#689F38,stroke-width:2px,color:#fff
    classDef decision fill:#FFC107,stroke:#FFA000,stroke-width:2px,color:#000
    classDef error fill:#F44336,stroke:#D32F2F,stroke-width:2px,color:#fff

    class Start,CreateReport entry
    class BgTasks,GenRoutes,GeocodeWaypoints,GoogleAPI,MergeCoords process
    class BuildPrompt,LoadTemplate,ResolveIncludes,ReplaceVars prompt
    class SendLLM,ParseJSON llm
    class SaveDB,DBUpdate db
    class Frontend,PollingHook,APIEndpoint,CheckStatus,DisplayMap,RenderRoutes frontend
    class CheckScenarios,RoutesReady decision
    class DefaultRoutes,ErrorDisplay error
```

## Key Components

### 1. Background Task Orchestration
- **File**: [src/lib/mission-generation/background-tasks.ts](../../src/lib/mission-generation/background-tasks.ts)
- **Function**: `executeBackgroundTasks()`
- Triggered after mission report creation
- Determines if scenarios require evacuation routes
- Manages 20-second timeout for generation

### 2. Prompt Assembly System
- **File**: [src/lib/prompts.ts](../../src/lib/prompts.ts)
- **Function**: `buildRoutePrompt()`
- **Template**: [prompts/evacuation-routes/emp-comprehensive-prompt.md](../../prompts/evacuation-routes/emp-comprehensive-prompt.md)
- Loads template, resolves `{{include:...}}` directives
- Replaces variables: `{{city}}`, `{{state}}`, `{{family_size}}`, `{{scenarios}}`, etc.

### 3. LLM Route Generation
- **File**: [src/lib/mission-generation/evacuation-routes.ts](../../src/lib/mission-generation/evacuation-routes.ts)
- **Function**: `generateEvacuationRoutes()`
- Uses OpenRouter to call Claude 3.5 Sonnet
- Temperature: 0.7
- Expects JSON response with routes array

### 4. Geocoding Service
- **File**: [src/lib/geocoding.ts](../../src/lib/geocoding.ts)
- **Function**: `geocodeWaypoints()`
- Converts waypoint names to lat/lng coordinates
- Uses Google Maps Geocoding API
- Filters out failed geocodes, preserves successful ones

### 5. Frontend Polling System
- **File**: [src/hooks/useRoutePolling.ts](../../src/hooks/useRoutePolling.ts)
- Polls every 2 seconds for up to 20 seconds (10 attempts)
- Checks `/api/mission-reports/[id]/routes` endpoint
- Returns loading state, routes, and errors

### 6. Map Display
- **File**: [src/components/plans/map/MapComponent.tsx](../../src/components/plans/map/MapComponent.tsx)
- Renders Google Maps with dark tactical theme
- Displays routes as polylines with distinct colors
- Shows waypoint markers with navigation details

## Related Files

- [src/lib/mission-generation/background-tasks.ts](../../src/lib/mission-generation/background-tasks.ts) - Background task orchestration
- [src/lib/mission-generation/evacuation-routes.ts](../../src/lib/mission-generation/evacuation-routes.ts) - Route generation logic
- [src/lib/prompts.ts](../../src/lib/prompts.ts) - Prompt assembly utilities
- [src/lib/geocoding.ts](../../src/lib/geocoding.ts) - Google Maps geocoding integration
- [src/hooks/useRoutePolling.ts](../../src/hooks/useRoutePolling.ts) - Frontend polling hook
- [src/app/api/mission-reports/[id]/routes/route.ts](../../src/app/api/mission-reports/[id]/routes/route.ts) - API endpoint
- [src/components/plans/map/MapComponent.tsx](../../src/components/plans/map/MapComponent.tsx) - Map rendering
- [prompts/evacuation-routes/emp-comprehensive-prompt.md](../../prompts/evacuation-routes/emp-comprehensive-prompt.md) - Route prompt template
- [src/db/schema/mission-reports.ts](../../src/db/schema/mission-reports.ts) - Database schema
