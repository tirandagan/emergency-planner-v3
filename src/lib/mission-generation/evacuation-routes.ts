'use server';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import type { EvacuationRoute } from '@/types/mission-report';
import type { LocationData, ScenarioType, WizardFormData } from '@/types/wizard';
import { buildRoutePrompt } from '@/lib/prompts';
import { geocodeWaypoints } from '@/lib/geocoding';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

/**
 * Scenarios that typically require evacuation routes
 * Note: EMP scenarios need special consideration - routes include both vehicle and walking/hiking options
 */
const EVACUATION_SCENARIOS: ScenarioType[] = [
  'nuclear',
  'civil-unrest',
  'natural-disaster', // floods, fires, etc.
  'emp-grid-down', // Vehicle may not work, need walking/hiking alternatives
  'pandemic', // Evacuate to isolated locations, avoid crowded areas and roadblocks
  'multi-year-sustainability', // May need routes to relocate to sustainable location
];

/**
 * Check if the given scenarios suggest evacuation is needed
 */
export async function shouldGenerateRoutes(scenarios: ScenarioType[]): Promise<boolean> {
  return scenarios.some(s => EVACUATION_SCENARIOS.includes(s));
}

/**
 * Type guard for RouteRationale
 */
function isValidRationale(rationale: unknown): rationale is EvacuationRoute['rationale'] {
  if (!rationale || typeof rationale !== 'object') return false;
  const r = rationale as Record<string, unknown>;
  return (
    typeof r.summary === 'string' &&
    Array.isArray(r.emp_specific_considerations) &&
    r.emp_specific_considerations.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(r.family_specific_considerations) &&
    r.family_specific_considerations.every((item: unknown) => typeof item === 'string')
  );
}

/**
 * Type guard for RouteRisk[]
 */
function isValidRisksArray(risks: unknown): risks is EvacuationRoute['risks'] {
  if (!Array.isArray(risks)) return false;
  return risks.every((risk: unknown) => {
    if (!risk || typeof risk !== 'object') return false;
    const r = risk as Record<string, unknown>;
    return (
      typeof r.description === 'string' &&
      ['low', 'medium', 'high'].includes(r.likelihood as string) &&
      ['low', 'medium', 'high'].includes(r.impact as string) &&
      typeof r.mitigation === 'string'
    );
  });
}

/**
 * Type guard for RouteDirections
 */
function isValidDirections(directions: unknown): directions is EvacuationRoute['directions'] {
  if (!directions || typeof directions !== 'object') return false;
  const d = directions as Record<string, unknown>;
  return (
    Array.isArray(d.step_by_step) &&
    d.step_by_step.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(d.special_instructions) &&
    d.special_instructions.every((item: unknown) => typeof item === 'string')
  );
}

/**
 * Generate evacuation routes for a given location and scenarios
 * Enhanced with family and household context for EMP/grid-down planning
 */
export async function generateEvacuationRoutes(
  location: LocationData,
  scenarios: ScenarioType[],
  formData: WizardFormData
): Promise<EvacuationRoute[]> {
  // Build prompt from template with family context
  const prompt = await buildRoutePrompt(location, scenarios, formData);

  console.log('\n========== EVACUATION ROUTES: PROMPT SENT TO LLM ==========');
  console.log(prompt);
  console.log('========== END PROMPT ==========\n');

  try {
    const startTime = Date.now();

    const { text } = await generateText({
      model: openrouter('anthropic/claude-3.5-sonnet'),
      prompt,
      temperature: 0.7,
      // Claude Sonnet has 8K output tokens, sufficient for 3 detailed routes
    });

    const durationMs = Date.now() - startTime;

    console.log('\n========== EVACUATION ROUTES: LLM RESPONSE RECEIVED ==========');
    console.log(`Duration: ${durationMs}ms | Length: ${text.length} chars`);
    console.log(text);
    console.log('========== END RESPONSE ==========\n');

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ Failed to parse JSON from LLM response');
      return getDefaultRoutes(location);
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.routes || !Array.isArray(parsed.routes)) {
      console.error('❌ Invalid routes structure in response');
      return getDefaultRoutes(location);
    }

    console.log(`✅ Successfully parsed ${parsed.routes.length} routes from LLM`);

    // Geocode all waypoints before sanitizing routes
    const locationContext = `${location.city}, ${location.state}`;

    console.log('\n========== GEOCODING WAYPOINTS ==========');
    const geocodedRoutes = await Promise.all(
      parsed.routes.map(async (route: Record<string, unknown>) => {
        if (Array.isArray(route.waypoints) && route.waypoints.length > 0) {
          console.log(`Geocoding ${route.waypoints.length} waypoints for route: ${route.name}`);

          const geocoded = await geocodeWaypoints(
            route.waypoints.map((wp: Record<string, unknown>) => ({
              name: (wp.name as string) || 'Waypoint',
              description: (wp.description as string) || (wp.notes as string) || undefined,
            })),
            locationContext
          );

          if (geocoded.length < route.waypoints.length) {
            console.warn(`⚠️ Some waypoints failed geocoding for route: ${route.name} (${geocoded.length}/${route.waypoints.length} succeeded)`);
          }

          // Merge geocoded coordinates with original waypoint fields (order, type, notes, distances)
          const originalWaypoints = route.waypoints as Array<Record<string, unknown>>;
          const enhancedWaypoints = geocoded.map((geocodedWp, index) => {
            const originalWp = originalWaypoints[index];
            return {
              ...geocodedWp,
              // Preserve enhanced navigation fields from LLM response
              ...(typeof originalWp.order === 'number' ? { order: originalWp.order } : {}),
              ...(typeof originalWp.type === 'string' ? { type: originalWp.type } : {}),
              ...(typeof originalWp.notes === 'string' ? { notes: originalWp.notes } : {}),
              ...(typeof originalWp.distance_from_previous_miles === 'number' ? { distance_from_previous_miles: originalWp.distance_from_previous_miles } : {}),
              ...(typeof originalWp.cumulative_distance_miles === 'number' ? { cumulative_distance_miles: originalWp.cumulative_distance_miles } : {}),
            };
          });

          return { ...route, waypoints: enhancedWaypoints };
        }
        return route;
      })
    );
    console.log('========== GEOCODING COMPLETE ==========\n');

    // Validate and sanitize routes with backward-compatible mapping
    const sanitizedRoutes = geocodedRoutes.map((route: Record<string, unknown>) => ({
      // EXISTING required fields (backward compatibility)
      name: (typeof route.name === 'string' && route.name) || 'Evacuation Route',
      description: (typeof route.description === 'string' && route.description) || 'Emergency evacuation route',
      distance: (typeof route.distance === 'string' && route.distance) || (route.estimated_total_distance_km
        ? `${route.estimated_total_distance_km} km`
        : 'Unknown'),
      estimatedTime: (typeof route.estimatedTime === 'string' && route.estimatedTime) || (route.estimated_travel_time_hours_no_traffic
        ? `${route.estimated_travel_time_hours_no_traffic} hours`
        : route.estimated_travel_days
        ? `${route.estimated_travel_days} days`
        : 'Unknown'),
      // Waypoints already geocoded with correct coordinates
      waypoints: Array.isArray(route.waypoints) ? route.waypoints : [],
      hazards: Array.isArray(route.hazards)
        ? route.hazards
        : route.risks
        ? (route.risks as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => r.description)
        : [],

      // NEW optional fields (only if present in response)
      ...(typeof route.route_id === 'string' ? { route_id: route.route_id } : {}),
      ...(route.priority && ['primary', 'secondary', 'tertiary'].includes(route.priority as string)
        ? { priority: route.priority as 'primary' | 'secondary' | 'tertiary' } : {}),
      ...(route.mode && ['vehicle', 'foot_or_bicycle'].includes(route.mode as string)
        ? { mode: route.mode as 'vehicle' | 'foot_or_bicycle' } : {}),
      ...(typeof route.origin_description === 'string' ? { origin_description: route.origin_description } : {}),
      ...(typeof route.destination_description === 'string' ? { destination_description: route.destination_description } : {}),

      // NEW: Scenario-specific endpoint fields
      ...(typeof route.destination_address === 'string' ? { destination_address: route.destination_address } : {}),
      ...(typeof route.destination_scenario_rationale === 'string' ? { destination_scenario_rationale: route.destination_scenario_rationale } : {}),

      // Distance and time estimates
      ...(typeof route.estimated_total_distance_km === 'number' ? { estimated_total_distance_km: route.estimated_total_distance_km } : {}),
      ...(typeof route.estimated_total_distance_miles === 'number' ? { estimated_total_distance_miles: route.estimated_total_distance_miles } : {}),
      ...(typeof route.estimated_travel_time_hours_no_traffic === 'number' ? { estimated_travel_time_hours_no_traffic: route.estimated_travel_time_hours_no_traffic } : {}),
      ...(typeof route.estimated_travel_days === 'number' ? { estimated_travel_days: route.estimated_travel_days } : {}),
      ...(typeof route.estimated_fuel_needed_gallons === 'number' ? { estimated_fuel_needed_gallons: route.estimated_fuel_needed_gallons } : {}),

      // Validate complex types before including
      ...(isValidRationale(route.rationale) ? { rationale: route.rationale } : {}),
      ...(isValidRisksArray(route.risks) ? { risks: route.risks } : {}),
      ...(isValidDirections(route.directions) ? { directions: route.directions } : {}),
    }));

    return sanitizedRoutes;
  } catch (error) {
    console.error('❌ Error generating evacuation routes:', error instanceof Error ? error.message : error);
    return getDefaultRoutes(location);
  }
}

/**
 * Provide default routes when generation fails
 */
function getDefaultRoutes(location: LocationData): EvacuationRoute[] {
  return [
    {
      name: 'Primary Evacuation Route',
      description: 'Head away from the urban center using the nearest major highway',
      distance: 'Variable',
      estimatedTime: 'Depends on traffic',
      waypoints: [
        {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng,
          name: 'Starting Point',
          description: 'Your current location',
        },
      ],
      hazards: ['Check local emergency broadcasts for road closures'],
    },
  ];
}
