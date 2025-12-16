# Task: Enhance Evacuation Routes with Specific Endpoints and Turn-by-Turn Navigation

**Created:** 2025-12-12
**Status:** Planning
**Priority:** High (Route Quality Improvement)

---

## 1. Task Overview

### Goal
Improve evacuation route generation to provide:
1. **Scenario-specific destination points** with clear endpoints based on emergency type
2. **Detailed turn-by-turn navigation** for vehicle routes with all road changes, turns, and exits
3. **Distance-appropriate evacuation** based on threat type (storm vs nuclear vs civil unrest)

### Current Problems

**Problem 1: Vague Endpoints**
- Current routes use generic descriptions: "Safer, lower-density area reachable by road"
- No specific destination address or landmark
- Users don't know exactly where to evacuate to
- No clear "you've arrived" indicator

**Problem 2: Missing Turn-by-Turn Details**
- Vehicle routes don't call out road changes
- Missing highway exits, turns, road name changes
- Waypoints are too sparse (only major landmarks)
- Not useful for navigation without GPS

**Problem 3: Generic Distance Recommendations**
- All scenarios use same evacuation distance logic
- Nuclear fallout requires 50-100+ miles, but routes might be shorter
- Storm/tornado requires 20-50 miles depending on severity
- Civil unrest might only need 10-20 miles to safer area

### Success Criteria

- [x] Routes have **specific, geocodable endpoint addresses/landmarks**
- [x] Endpoint selection is **scenario-appropriate** (distance and direction)
- [x] Vehicle routes include **all major turns, exits, and road changes**
- [x] Waypoint density is sufficient for navigation without GPS
- [x] Route descriptions clearly state the **final destination**
- [x] Nuclear routes evacuate 50-100+ miles to safe zones
- [x] Storm routes evacuate 20-50 miles perpendicular to storm path
- [x] Civil unrest routes evacuate 10-30 miles to low-density areas

---

## 2. Scenario-Specific Evacuation Logic

### Nuclear Fallout / Radiological
**Distance:** 50-100+ miles minimum
**Direction:** Upwind if possible, perpendicular to prevailing winds
**Endpoint Examples:**
- Rural state parks with camping facilities
- Small towns with basic services (population <5,000)
- Remote campgrounds with water sources
- Agricultural areas away from military/industrial targets

**Endpoint Criteria:**
- 50+ miles from major cities
- 100+ miles from nuclear plants/military bases
- Low population density (<50 people/sq mi)
- Access to natural water sources
- Basic infrastructure (gas station, small store)

### Storm/Hurricane/Tornado
**Distance:** 20-50 miles
**Direction:** Perpendicular to storm track, inland if coastal
**Endpoint Examples:**
- Hotels/motels in inland cities
- Shelters in areas outside storm path
- Friends/family homes outside evacuation zones
- Higher elevation areas (floods)

**Endpoint Criteria:**
- Outside predicted storm path
- Higher elevation (for floods/storm surge)
- Sturdy structures available
- Emergency services operational
- 20-50 miles from current location

### Civil Unrest
**Distance:** 10-30 miles
**Direction:** Away from urban centers, major highways
**Endpoint Examples:**
- Suburban areas with lower population density
- Rural communities with local law enforcement
- Locations with family/friends outside affected area
- Small towns with basic services

**Endpoint Criteria:**
- Low population density
- 10-30 miles from urban center
- Access to food, water, fuel
- Lower likelihood of protests/riots
- Functional emergency services

### EMP/Grid Down
**Distance:** 30-100 miles
**Direction:** Rural areas with water sources, agriculture
**Endpoint Examples:**
- Rural properties with wells/springs
- Small farming communities
- Areas with hydroelectric power
- Locations near fresh water sources

**Endpoint Criteria:**
- Self-sufficient communities
- Natural resources (water, food)
- Low technology dependence
- 30-100 miles from major cities
- Agricultural areas

---

## 3. Turn-by-Turn Navigation Requirements

### Vehicle Route Waypoint Detail

**Current (Too Sparse):**
```json
{
  "waypoints": [
    {"name": "123 Main St, City, ST"},
    {"name": "I-95 North"},
    {"name": "Destination Area"}
  ]
}
```

**Required (Detailed):**
```json
{
  "waypoints": [
    {"order": 1, "name": "123 Main St, Westfield, NJ", "type": "start"},
    {"order": 2, "name": "Turn left onto Mountain Ave", "type": "turn"},
    {"order": 3, "name": "Merge onto I-78 West via Exit 41", "type": "highway_entrance"},
    {"order": 4, "name": "Take Exit 12 - Route 31 South", "type": "highway_exit"},
    {"order": 5, "name": "Turn right onto Route 31 South", "type": "turn"},
    {"order": 6, "name": "Continue on Route 31 South for 15 miles", "type": "continue"},
    {"order": 7, "name": "Turn left onto County Road 513", "type": "turn"},
    {"order": 8, "name": "Destination: Clinton Wildlife Management Area, 123 Parking Lot Rd, Clinton, NJ", "type": "end"}
  ]
}
```

### Required Waypoint Types

**Highway Navigation:**
- `highway_entrance`: "Merge onto I-78 West via Exit 41"
- `highway_exit`: "Take Exit 12 - Route 31 South"
- `highway_continue`: "Continue on I-78 West for 25 miles"
- `rest_stop`: "Rest Area / Service Plaza at Mile Marker 45"

**Road Changes:**
- `turn`: "Turn left onto Main Street" or "Turn right onto Route 31"
- `road_name_change`: "Main Street becomes Route 202"
- `continue`: "Continue straight on Route 31 for 5 miles"

**Decision Points:**
- `intersection`: "At the intersection of Route 31 and Route 202"
- `traffic_circle`: "Take 2nd exit at roundabout onto County Road"
- `fork`: "Bear right to stay on Route 31 South"

**Landmarks:**
- `fuel_stop`: "Gas station at Route 31 and County Road 513"
- `landmark`: "Pass the water tower on your right"
- `checkpoint`: "Municipal building - check in if emergency services active"

### Distance Guidance
- Include distance estimates between waypoints
- Cumulative distance from start
- Estimated time between waypoints (no traffic)

---

## 4. Implementation Strategy

### Phase 1: Update Prompt Template ⏳ PENDING

**Goal:** Enhance prompt with scenario-specific endpoint logic and turn-by-turn requirements

**File:** `prompts/evacuation-routes/emp-comprehensive-prompt.md`

**Changes Needed:**

1. **Add Scenario-Specific Endpoint Guidelines**
```markdown
## EVACUATION ENDPOINT SELECTION

Based on the scenario types ({{scenarios}}), determine appropriate evacuation endpoints:

### If Nuclear/Radiological Scenario:
- **Minimum Distance:** 50-100 miles from {{full_address}}
- **Direction:** Upwind or perpendicular to prevailing winds
- **Endpoint Type:** Rural area with camping/lodging, small town (<5,000 pop), state park
- **Criteria:** Low population density, natural water sources, 100+ miles from nuclear facilities
- **Example:** "Worthington State Forest Campground, 145 Old Mine Rd, Columbia, NJ" (65 miles from Westfield)

### If Storm/Hurricane/Tornado Scenario:
- **Minimum Distance:** 20-50 miles from {{full_address}}
- **Direction:** Perpendicular to storm path, inland if coastal, higher elevation if flooding
- **Endpoint Type:** Hotel/motel, designated shelter, higher ground
- **Criteria:** Outside predicted storm path, sturdy structures, operational emergency services
- **Example:** "Holiday Inn, 123 Safe St, Allentown, PA" (45 miles west of coastal storm)

### If Civil Unrest Scenario:
- **Minimum Distance:** 10-30 miles from {{full_address}}
- **Direction:** Away from urban centers, major highways, protest areas
- **Endpoint Type:** Suburban area, small town with services, rural community
- **Criteria:** Low population density, functional services, lower unrest likelihood
- **Example:** "Lebanon Township Community Center, 530 West Hill Rd, Glen Gardner, NJ" (25 miles from Westfield)

### If EMP/Grid Down Scenario:
- **Minimum Distance:** 30-100 miles from {{full_address}}
- **Direction:** Rural areas with agriculture, natural resources
- **Endpoint Type:** Self-sufficient community, farm area, water source area
- **Criteria:** Natural resources, low tech dependence, agricultural areas
- **Example:** "Delaware Water Gap National Recreation Area, River Rd, Columbia, NJ" (60 miles)
```

2. **Add Turn-by-Turn Navigation Requirements**
```markdown
## VEHICLE ROUTE WAYPOINT REQUIREMENTS

For **vehicle** mode routes, you MUST include detailed turn-by-turn navigation:

### Required Waypoint Detail:
1. **Starting Point:** Exact address ({{full_address}})
2. **Every Turn:** "Turn left/right onto [street name]"
3. **Highway Entrance:** "Merge onto [highway] [direction] via Exit [number]"
4. **Highway Exits:** "Take Exit [number] - [road name]"
5. **Road Changes:** "Continue on [road] for [distance]" or "[road] becomes [new road name]"
6. **Major Intersections:** "At intersection of [road A] and [road B]"
7. **Landmarks:** Notable waypoints for confirmation (gas stations, water towers, etc.)
8. **Endpoint:** Specific address/landmark at destination

### Waypoint Density:
- **Urban areas:** Waypoint every 0.5-2 miles (every turn, every major intersection)
- **Highway:** Waypoint every 10-20 miles OR at every exit used
- **Rural roads:** Waypoint every 2-5 miles OR at road changes
- **Minimum:** 8-15 waypoints for 50-mile route

### Example Waypoint Sequence:
```json
{
  "order": 1,
  "name": "123 Main St, Westfield, NJ",
  "type": "start",
  "lat": 40.6499,
  "lng": -74.3502,
  "description": "Family home - load vehicle, confirm go-bags",
  "distance_from_start_miles": 0,
  "cumulative_distance_miles": 0
},
{
  "order": 2,
  "name": "Turn right onto Mountain Ave (heading west)",
  "type": "turn",
  "description": "Exit neighborhood onto main road",
  "distance_from_previous_miles": 0.3,
  "cumulative_distance_miles": 0.3
},
{
  "order": 3,
  "name": "Merge onto I-78 West via ramp at Exit 41",
  "type": "highway_entrance",
  "description": "Enter highway - check fuel gauge, expect heavy traffic",
  "distance_from_previous_miles": 1.2,
  "cumulative_distance_miles": 1.5
}
```
```

3. **Update Route Schema**
```markdown
## REQUIRED ROUTE STRUCTURE

Each route MUST include:

{
  "route_id": "[unique_id]",
  "name": "[Route Name]",
  "priority": "primary | secondary | tertiary",
  "mode": "vehicle | foot_or_bicycle",
  "origin_description": "{{full_address}}",
  "destination_description": "[SPECIFIC ADDRESS/LANDMARK]", // ← MUST BE SPECIFIC
  "destination_address": "[Full address or landmark name for geocoding]", // ← NEW FIELD
  "destination_scenario_rationale": "Why this endpoint is appropriate for [scenario]", // ← NEW FIELD
  "estimated_total_distance_km": [number],
  "estimated_total_distance_miles": [number], // ← NEW FIELD
  "estimated_travel_time_hours_no_traffic": [number],
  "waypoints": [ /* Detailed waypoints as shown above */ ],
  "rationale": { /* ... */ },
  "risks": [ /* ... */ ],
  "directions": {
    "summary": "Take I-78 West to Route 31 South to destination",
    "turn_count": [number],
    "highway_changes": ["I-78 West", "Route 31 South"],
    "estimated_fuel_needed_gallons": [number] // ← NEW FIELD
  }
}
```

### Phase 2: Update Route Generation Code ⏳ PENDING

**Goal:** Parse and handle new route fields

**File:** `src/lib/mission-generation/evacuation-routes.ts`

**Changes Needed:**

1. **Parse destination_address field**
2. **Geocode endpoint** (call geocoding API for final waypoint)
3. **Validate waypoint density** (warn if too few waypoints for distance)
4. **Add new optional fields to sanitization**

### Phase 3: Update TypeScript Types ⏳ PENDING

**Goal:** Add new fields to EvacuationRoute interface

**File:** `src/types/mission-report.ts`

**Changes Needed:**

```typescript
export interface EvacuationRoute {
  // Existing required fields
  name: string;
  description: string;
  distance: string;
  estimatedTime: string;
  waypoints: RouteWaypoint[];
  hazards: string[];

  // Existing optional fields
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

  // NEW optional fields
  destination_address?: string; // Specific endpoint for geocoding
  destination_scenario_rationale?: string; // Why this endpoint for this scenario
  estimated_total_distance_miles?: number; // Distance in miles
  estimated_fuel_needed_gallons?: number; // Fuel estimate
}

export interface RouteWaypoint {
  lat: number;
  lng: number;
  name: string;
  description?: string;

  // NEW optional fields for detailed navigation
  order?: number; // Waypoint sequence number
  type?: 'start' | 'turn' | 'highway_entrance' | 'highway_exit' | 'highway_continue' |
         'road_name_change' | 'continue' | 'intersection' | 'traffic_circle' | 'fork' |
         'fuel_stop' | 'landmark' | 'checkpoint' | 'rest_stop' | 'end';
  distance_from_previous_miles?: number; // Distance since last waypoint
  cumulative_distance_miles?: number; // Total distance from start
  notes?: string; // Additional navigation notes
}

export interface RouteDirections {
  summary: string; // Brief summary of route
  turn_count?: number; // Number of turns
  highway_changes?: string[]; // List of highways/roads used
  estimated_fuel_needed_gallons?: number; // Fuel estimate
}
```

### Phase 4: Testing ⏳ PENDING

**Goal:** Verify routes have proper endpoints and turn-by-turn detail

**Test Cases:**

1. **Nuclear Scenario:**
   - Verify endpoint is 50-100+ miles away
   - Check endpoint is rural/low-density area
   - Confirm final waypoint has specific address

2. **Storm Scenario:**
   - Verify endpoint is 20-50 miles away
   - Check direction is perpendicular to typical storm path
   - Confirm endpoint has shelter/lodging

3. **Civil Unrest Scenario:**
   - Verify endpoint is 10-30 miles away
   - Check endpoint is suburban/rural
   - Confirm low-density area

4. **Vehicle Route Detail:**
   - Count waypoints (should be 8-15 for 50-mile route)
   - Verify all highway exits are called out
   - Check all turns are specified
   - Confirm road changes are noted

---

## 5. Example Before/After

### BEFORE (Current)

```json
{
  "name": "Primary Vehicle Route",
  "origin_description": "123 Main St, Westfield, NJ",
  "destination_description": "Safer, lower-density area reachable by road",
  "waypoints": [
    {
      "name": "123 Main St, Westfield, NJ",
      "description": "Starting point",
      "lat": 40.6499,
      "lng": -74.3502
    },
    {
      "name": "I-78 West",
      "description": "Take highway west",
      "lat": 40.6400,
      "lng": -74.4000
    },
    {
      "name": "Rural area west of city",
      "description": "Destination",
      "lat": 40.7000,
      "lng": -75.0000
    }
  ]
}
```

### AFTER (Improved - Nuclear Scenario)

```json
{
  "name": "Primary Nuclear Evacuation Route - Northwest to Poconos",
  "origin_description": "123 Main St, Westfield, NJ 07090",
  "destination_description": "Delaware Water Gap National Recreation Area - Safe Zone 65 miles NW",
  "destination_address": "Delaware Water Gap Visitor Center, 1 Brotzman Dr, Delaware Water Gap, PA 18327",
  "destination_scenario_rationale": "Nuclear fallout evacuation: 65 miles upwind (NW), low population density, natural water sources, camping facilities, outside 50-mile danger zone from major urban centers and nuclear plants.",
  "estimated_total_distance_miles": 65.3,
  "estimated_fuel_needed_gallons": 4.5,
  "waypoints": [
    {
      "order": 1,
      "type": "start",
      "name": "123 Main St, Westfield, NJ 07090",
      "description": "Family home - confirm all members, secure go-bags, check fuel (need ~5 gallons), load radiation detection if available",
      "distance_from_previous_miles": 0,
      "cumulative_distance_miles": 0
    },
    {
      "order": 2,
      "type": "turn",
      "name": "Turn right onto Mountain Ave heading west",
      "description": "Exit neighborhood - expect traffic, stay calm",
      "distance_from_previous_miles": 0.3,
      "cumulative_distance_miles": 0.3
    },
    {
      "order": 3,
      "type": "highway_entrance",
      "name": "Merge onto I-78 West via Exit 41",
      "description": "Enter highway - heavy traffic expected, maintain 1/2 tank minimum, avoid urban areas",
      "distance_from_previous_miles": 1.2,
      "cumulative_distance_miles": 1.5
    },
    {
      "order": 4,
      "type": "highway_continue",
      "name": "Continue on I-78 West for 25 miles",
      "description": "Stay in right 2 lanes, watch for emergency vehicles, monitor radio for updates",
      "distance_from_previous_miles": 25.0,
      "cumulative_distance_miles": 26.5
    },
    {
      "order": 5,
      "type": "highway_exit",
      "name": "Take Exit 12 - Route 31 South toward Clinton",
      "description": "Exit highway - traffic may thin out here",
      "distance_from_previous_miles": 1.0,
      "cumulative_distance_miles": 27.5
    },
    {
      "order": 6,
      "type": "turn",
      "name": "Turn right onto Route 31 South",
      "description": "Two-lane road - easier navigation, less traffic",
      "distance_from_previous_miles": 0.2,
      "cumulative_distance_miles": 27.7
    },
    {
      "order": 7,
      "type": "fuel_stop",
      "name": "Gas station at Route 31 and County Road 513 (Clinton, NJ)",
      "description": "FUEL CHECK - fill tank if below 1/2, use cash if possible, stock water",
      "distance_from_previous_miles": 5.5,
      "cumulative_distance_miles": 33.2
    },
    {
      "order": 8,
      "type": "continue",
      "name": "Continue on Route 31 South for 15 miles",
      "description": "Rural area - population decreasing, radiation risk dropping",
      "distance_from_previous_miles": 15.0,
      "cumulative_distance_miles": 48.2
    },
    {
      "order": 9,
      "type": "turn",
      "name": "Turn right onto Route 46 West",
      "description": "Heading toward Poconos - mountainous terrain provides some shielding",
      "distance_from_previous_miles": 1.5,
      "cumulative_distance_miles": 49.7
    },
    {
      "order": 10,
      "type": "highway_entrance",
      "name": "Merge onto I-80 West",
      "description": "Final highway segment to Poconos",
      "distance_from_previous_miles": 2.0,
      "cumulative_distance_miles": 51.7
    },
    {
      "order": 11,
      "type": "highway_exit",
      "name": "Take Exit 310 - Delaware Water Gap",
      "description": "Exit to recreation area - safe zone reached",
      "distance_from_previous_miles": 10.5,
      "cumulative_distance_miles": 62.2
    },
    {
      "order": 12,
      "type": "turn",
      "name": "Turn left onto River Road",
      "description": "Follow signs to Visitor Center",
      "distance_from_previous_miles": 1.8,
      "cumulative_distance_miles": 64.0
    },
    {
      "order": 13,
      "type": "end",
      "name": "Delaware Water Gap Visitor Center, 1 Brotzman Dr, Delaware Water Gap, PA 18327",
      "description": "DESTINATION REACHED - 65 miles from fallout zone. Check in with park rangers if present, set up camp near natural water source, monitor radiation levels if equipment available. Safe zone for 14+ day stay.",
      "distance_from_previous_miles": 1.3,
      "cumulative_distance_miles": 65.3
    }
  ],
  "directions": {
    "summary": "I-78 West → Route 31 South → Route 46 West → I-80 West to Delaware Water Gap",
    "turn_count": 5,
    "highway_changes": ["I-78 West", "Route 31 South", "Route 46 West", "I-80 West"],
    "estimated_fuel_needed_gallons": 4.5
  }
}
```

---

## 6. Files to Modify

1. **`prompts/evacuation-routes/emp-comprehensive-prompt.md`**
   - Add scenario-specific endpoint guidelines
   - Add turn-by-turn navigation requirements
   - Update route schema

2. **`src/lib/mission-generation/evacuation-routes.ts`**
   - Parse destination_address field
   - Geocode endpoints
   - Add validation for waypoint density

3. **`src/types/mission-report.ts`**
   - Add destination_address, destination_scenario_rationale fields to EvacuationRoute
   - Add waypoint navigation fields (order, type, distances, notes)
   - Add estimated_total_distance_miles, estimated_fuel_needed_gallons

4. **`src/lib/geocoding.ts`**
   - Already supports geocoding endpoints (no changes needed)

---

## 7. Implementation Checklist

### Phase 1: Prompt Template Enhancement
- [ ] Add scenario-specific endpoint selection guidelines
- [ ] Add turn-by-turn navigation requirements
- [ ] Update route JSON schema with new fields
- [ ] Add waypoint type definitions
- [ ] Add distance/fuel calculation requirements

### Phase 2: Code Updates
- [ ] Update EvacuationRoute TypeScript interface
- [ ] Update RouteWaypoint TypeScript interface
- [ ] Update evacuation-routes.ts to parse new fields
- [ ] Add endpoint geocoding call
- [ ] Add waypoint density validation (warning if too sparse)

### Phase 3: Testing
- [ ] Generate nuclear scenario - verify 50-100 mile endpoint
- [ ] Generate storm scenario - verify 20-50 mile endpoint
- [ ] Generate civil unrest scenario - verify 10-30 mile endpoint
- [ ] Verify vehicle routes have 8-15 waypoints for 50-mile route
- [ ] Verify all highway exits are specified
- [ ] Verify all turns are called out

### Phase 4: Documentation
- [ ] Update task 034 with endpoint requirements
- [ ] Document new route fields in types
- [ ] Add examples to prompt template

---

## 8. Priority & Timeline

**Priority:** High - Critical for route usability without GPS
**Complexity:** Moderate - Primarily prompt engineering with minor code changes
**Estimated Effort:** 2-3 hours

**Dependencies:**
- Task 034 (Geocoding) - ✅ Complete
- Geocoding API enabled - ⏳ Pending user action

**Next Steps:**
1. Get user approval to proceed
2. Implement Phase 1 (prompt updates)
3. Implement Phase 2 (code updates)
4. Test with new route generation

---

**Status:** Ready for implementation pending user approval
