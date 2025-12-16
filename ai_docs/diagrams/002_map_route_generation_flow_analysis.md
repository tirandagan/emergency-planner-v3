# Map & Route Generation Flow - Analysis

## Flow Summary

The evacuation route generation system operates as a **background process** that runs asynchronously after mission report creation. The flow consists of six major phases:

1. **Initiation**: User completes wizard → mission report created → background task triggered
2. **Prompt Assembly**: Template loaded, includes resolved, variables replaced with user data
3. **LLM Generation**: Prompt sent to Claude 3.5 Sonnet, JSON response parsed
4. **Geocoding**: Waypoint names converted to coordinates via Google Maps API
5. **Persistence**: Routes saved to PostgreSQL database
6. **Polling & Display**: Frontend polls for completion, renders routes on Google Maps

This architecture allows the core mission report to be displayed immediately while routes generate in the background, improving perceived performance.

## Step-by-Step Walkthrough

### Phase 1: Background Task Initiation

**Entry Point**: `executeBackgroundTasks()` in [background-tasks.ts:41-154](../../src/lib/mission-generation/background-tasks.ts#L41-L154)

1. Mission report is created via streaming generation
2. `executeBackgroundTasks()` is called with report ID, location, scenarios, and form data
3. System checks if routes already exist in database to avoid duplicate generation
4. `shouldGenerateRoutes()` evaluates scenarios array for evacuation-requiring scenarios:
   - `nuclear` → Yes
   - `civil-unrest` → Yes
   - `natural-disaster` → Yes
   - `emp-grid-down` → Yes
   - Other scenarios → No

**Decision Point**: If any matching scenario exists, proceed to route generation. Otherwise, save empty array to mark as complete.

### Phase 2: Prompt Assembly

**Entry Point**: `buildRoutePrompt()` in [prompts.ts:380-454](../../src/lib/prompts.ts#L380-L454)

1. **Load Template**: Reads `prompts/evacuation-routes/emp-comprehensive-prompt.md`
2. **Resolve Includes**: Processes `{{include:...}}` directives recursively (currently none in emp-comprehensive-prompt.md)
3. **Prepare Variables**: Extracts template variables from form data:
   - Location: `{{city}}`, `{{state}}`, `{{full_address}}`, `{{climate_zone}}`
   - Family: `{{family_size}}`, `{{adults}}`, `{{children}}`, `{{seniors}}`, `{{medical_summary}}`
   - Preparedness: `{{duration_days}}`, `{{budget_amount}}`, `{{water_72hr}}`, `{{food_calories_total}}`
   - Scenarios: `{{scenarios}}` (formatted as "Nuclear Fallout, Civil Unrest")
4. **Replace Variables**: `replaceVariables()` performs regex replacement on all `{{...}}` tokens
5. **Return Assembled Prompt**: Complete prompt ready for LLM

**Key Insight**: The prompt template includes scenario-specific endpoint selection guidance for Nuclear, Storm, Civil Unrest, and EMP scenarios, plus detailed turn-by-turn navigation requirements.

### Phase 3: LLM Generation

**Entry Point**: `generateEvacuationRoutes()` in [evacuation-routes.ts:82-222](../../src/lib/mission-generation/evacuation-routes.ts#L82-L222)

1. **Send to LLM**: Uses OpenRouter SDK to call `anthropic/claude-3.5-sonnet`
   - Temperature: 0.7 (balanced creativity/consistency)
   - Output: 8K tokens (sufficient for 3 detailed routes)
2. **Parse Response**:
   - Extract JSON using regex: `/\{[\s\S]*\}/`
   - Validate structure: must contain `routes` array
   - Log timing and character count for monitoring
3. **Handle Failures**: On parse error or invalid structure, fall back to `getDefaultRoutes()`

**Expected JSON Structure**:
```json
{
  "metadata": { ... },
  "routes": [
    {
      "route_id": "home_primary_vehicle",
      "name": "Primary Vehicle Route",
      "priority": "primary",
      "mode": "vehicle",
      "waypoints": [
        {
          "order": 1,
          "type": "start",
          "name": "123 Main St, City, State",
          "description": "Starting point",
          "notes": "Check fuel, supplies",
          "distance_from_previous_miles": 0,
          "cumulative_distance_miles": 0
        },
        // ... 10-25 waypoints with turn-by-turn navigation
      ],
      "rationale": { ... },
      "risks": [ ... ],
      "directions": { ... }
    }
    // ... secondary and on-foot routes
  ]
}
```

### Phase 4: Geocoding Waypoints

**Entry Point**: `geocodeWaypoints()` in [geocoding.ts:107-141](../../src/lib/geocoding.ts#L107-L141)

1. **Batch Processing**: Iterate through all waypoints in all routes
2. **Per-Waypoint Geocoding**: For each waypoint:
   - Combine waypoint name with location context: `"Main St and Oak Ave, Seattle, WA"`
   - Call Google Maps Geocoding API
   - Handle errors (REQUEST_DENIED, OVER_QUERY_LIMIT, ZERO_RESULTS)
   - Return `{lat, lng}` or mark as failed (0, 0)
3. **Filter Failures**: Remove waypoints that failed geocoding (lat=0, lng=0)
4. **Merge Data**: Combine geocoded coordinates with original waypoint fields:
   - `order`, `type`, `notes`, `distance_from_previous_miles`, `cumulative_distance_miles`
5. **Logging**: Console output shows success rate (e.g., "15/17 successful, 2 failed")

**Error Handling**: If geocoding fails for some waypoints, route is still saved with reduced waypoint count. This prevents total failure due to a single invalid location.

### Phase 5: Database Persistence

**Entry Point**: `updateReportRoutes()` in [background-tasks.ts:178-206](../../src/lib/mission-generation/background-tasks.ts#L178-L206)

1. **Sanitize Routes**: Map LLM response to `EvacuationRoute` type:
   - **Backward compatibility**: Map `estimated_total_distance_km` → `distance` field
   - **Optional fields**: Only include if present in LLM response
   - **Type validation**: Validate `rationale`, `risks`, `directions` structures
2. **Database Update**:
   ```sql
   UPDATE mission_reports
   SET evacuation_routes = $routes, updated_at = NOW()
   WHERE id = $reportId
   ```
3. **Logging**: Track success/failure with report ID

**Key Insight**: The `evacuationRoutes` field uses `null` as the "not generated yet" state, empty array `[]` as "generation complete but no routes needed", and populated array as "routes generated".

### Phase 6: Frontend Polling & Display

**Polling Hook**: `useRoutePolling()` in [useRoutePolling.ts:20-103](../../src/hooks/useRoutePolling.ts#L20-L103)

1. **Initialization**: Component mounts, polling starts if `enabled=true`
2. **Poll Loop**:
   - Call API endpoint immediately on mount
   - If `ready=false`, schedule next poll in 2 seconds
   - Max 10 polls (20 seconds total)
   - Clear interval when `ready=true` or timeout reached
3. **State Management**:
   - `isLoading`: True until routes ready or timeout
   - `routes`: Empty array until data received
   - `error`: Set if HTTP error or timeout

**API Endpoint**: `/api/mission-reports/[id]/routes` in [route.ts:11-78](../../src/app/api/mission-reports/[id]/routes/route.ts#L11-L78)

1. **Authentication**: Verify user is logged in via Supabase
2. **Authorization**: Check user owns the report via `userOwnsMissionReport()`
3. **Check Status**: Call `checkRoutesStatus(reportId)`
4. **Legacy Support**: If routes don't exist and report has formData, trigger background generation (fire-and-forget)
5. **Response**: Return `{ready, routeCount, routes}`

**Map Display**: `MapComponent.tsx` in [MapComponent.tsx:97-100](../../src/components/plans/map/MapComponent.tsx#L97-L100)

1. **Google Maps Setup**: Load Google Maps JavaScript API with Places library
2. **Apply Dark Theme**: Tactical map styling from v1 (dark blue/gray palette)
3. **Render Routes**: For each route:
   - Draw polyline connecting waypoints (color: amber/green/blue/red/purple)
   - Place markers at each waypoint
   - Show route name, description, distance in InfoWindow
4. **User Interaction**: Click route to highlight, view details in RouteCard

## Decision Logic

### Should Generate Routes?

**File**: [evacuation-routes.ts:28-30](../../src/lib/mission-generation/evacuation-routes.ts#L28-L30)

```typescript
const EVACUATION_SCENARIOS = ['nuclear', 'civil-unrest', 'natural-disaster', 'emp-grid-down'];

export async function shouldGenerateRoutes(scenarios: ScenarioType[]): Promise<boolean> {
  return scenarios.some(s => EVACUATION_SCENARIOS.includes(s));
}
```

**Logic**: If ANY selected scenario matches evacuation scenarios, generate routes. This handles multi-scenario combinations (e.g., "nuclear + emp-grid-down" → generate routes).

### When to Stop Polling?

**File**: [useRoutePolling.ts:43-78](../../src/hooks/useRoutePolling.ts#L43-L78)

**Stop Conditions**:
1. **Success**: `data.ready === true` → routes are ready (even if empty array)
2. **Timeout**: `pollCount >= 10` (20 seconds elapsed) → show error message
3. **HTTP Error**: API request fails → show error, stop polling
4. **Component Unmount**: User navigates away → cleanup interval

### Geocoding Failure Handling

**File**: [geocoding.ts:14-101](../../src/lib/geocoding.ts#L14-L101)

**Failure Types**:
- **REQUEST_DENIED**: Geocoding API not enabled or billing issue → log detailed fix instructions
- **OVER_QUERY_LIMIT**: Exceeded API quota → log billing warning
- **INVALID_REQUEST**: Bad address format → log address, return null
- **ZERO_RESULTS**: No match found → log warning, return null

**Mitigation**: Failed waypoints are filtered out (lines 129-138). Route is saved with remaining successfully geocoded waypoints. This prevents total route loss due to one bad waypoint name.

## Error Handling

### LLM Generation Errors

**Location**: [evacuation-routes.ts:218-221](../../src/lib/mission-generation/evacuation-routes.ts#L218-L221)

**Scenarios**:
1. **Network Error**: OpenRouter request fails
2. **Timeout**: LLM doesn't respond within timeout
3. **Parse Error**: Response isn't valid JSON
4. **Structure Error**: JSON doesn't contain `routes` array

**Recovery**: Return `getDefaultRoutes()` with single generic route using user's starting coordinates. This ensures map always has at least one route to display.

### Database Errors

**Location**: [background-tasks.ts:202-205](../../src/lib/mission-generation/background-tasks.ts#L202-L205)

**Handling**:
- Log error with stack trace
- Throw error (causes background task to return `success: false`)
- Frontend shows loading state indefinitely (no routes appear)
- User can refresh page to retry

**Improvement Opportunity**: Could implement retry logic or fallback to in-memory routes.

### Geocoding API Errors

**Location**: [geocoding.ts:48-80](../../src/lib/geocoding.ts#L48-L80)

**Detailed Error Messages**:
- REQUEST_DENIED → Shows exact steps to enable Geocoding API in Google Cloud Console
- Logs API key validation (must start with "AIza")
- Logs full error response for debugging

**Recovery**: Continue with partial geocoding. Routes saved with fewer waypoints but still functional.

## Recommendations & Ideas

### Performance Optimizations

1. **Parallel Geocoding with Rate Limiting**: Current implementation geocodes sequentially. Could batch requests with rate limiting to speed up while respecting API quotas.

2. **Geocoding Cache**: Store geocoded results in database keyed by `{waypointName, locationContext}`. Reuse for similar routes or regenerations.

3. **Progressive Route Display**: Instead of polling, use WebSocket or Server-Sent Events to push routes as soon as ready. Eliminates 2-second polling delay.

4. **Background Task Queue**: Use job queue (Bull, BullMQ) instead of fire-and-forget. Enables retry logic, better error tracking, and distributed processing.

### Prompt System Improvements

5. **Dynamic Template Selection**: Currently uses `emp-comprehensive-prompt.md` for all scenarios. Should:
   - Rename to `comprehensive-routes-prompt.md` (more accurate)
   - Make scenario description dynamic based on `{{scenarios}}` variable
   - Or implement scenario-specific templates with shared includes

6. **Prompt Versioning**: Track which prompt version generated each route. Enables A/B testing and rollback if new prompts produce worse results.

7. **Multi-Language Support**: Extend template system to support localized prompts for international users.

### User Experience Enhancements

8. **Route Generation Progress**: Show progress indicator:
   - "Analyzing scenarios..." (0-20%)
   - "Planning routes..." (20-60%)
   - "Geocoding waypoints..." (60-90%)
   - "Finalizing routes..." (90-100%)

9. **Partial Route Display**: Show routes as they're geocoded (before all 3 routes complete). Improves perceived speed.

10. **Route Regeneration**: Allow users to regenerate routes with different parameters (e.g., "avoid highways", "prefer scenic routes").

11. **Route Export**: Export routes as:
    - Printable PDF with turn-by-turn directions
    - GPX file for offline GPS devices
    - Google Maps share link

### Error Recovery

12. **Automatic Retry**: If background task fails, retry with exponential backoff (1s, 2s, 4s delays).

13. **Partial Success Handling**: If some routes fail geocoding but others succeed, show successful routes with warning banner.

14. **Fallback Providers**: If Google Maps Geocoding fails, try alternative providers (Mapbox, OpenStreetMap Nominatim).

### Monitoring & Analytics

15. **Generation Metrics**: Track:
    - Average generation time per scenario type
    - Geocoding success rate by region
    - LLM token usage and costs
    - Failure rates and reasons

16. **User Feedback Loop**: Allow users to rate route quality, report issues. Feed data back into prompt engineering.

### Data Quality

17. **Waypoint Validation**: Before geocoding, validate waypoint names:
    - Check for common patterns (intersections, landmarks, addresses)
    - Warn if waypoint looks invalid
    - Suggest corrections

18. **Route Sanity Checks**: After generation:
    - Verify route doesn't loop back unnecessarily
    - Check total distance is reasonable for scenario
    - Validate waypoint density (not too sparse or dense)

### Scalability

19. **Caching Layer**: Cache generated routes for common location + scenario combinations. Many users in same city with same scenarios could reuse routes.

20. **Edge Function Geocoding**: Move geocoding to edge functions (Vercel Edge, Cloudflare Workers) for lower latency and better geographic distribution.

---

**Next Steps for Development:**

1. Implement prompt template fix (rename file, make scenario dynamic)
2. Add WebSocket-based route streaming for instant display
3. Build route caching system to reduce LLM API costs
4. Add detailed error recovery with retry logic
5. Create route quality analytics dashboard
