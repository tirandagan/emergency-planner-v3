/**
 * Mission Report V2 Types
 * Enhanced report structure for streaming generation with bundle recommendations
 */

import type { WizardFormData } from './wizard';
import type { EmergencyContactsSection } from './emergency-contacts';

/**
 * Risk level indicators
 */
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type EvacuationUrgency = 'IMMEDIATE' | 'RECOMMENDED' | 'SHELTER_IN_PLACE';
export type BundlePriority = 'essential' | 'recommended' | 'optional';
export type SkillPriority = 'critical' | 'important' | 'helpful';

/**
 * Risk indicators from AI assessment
 */
export interface RiskIndicators {
  riskToLife: RiskLevel;
  riskToLifeReason: string;
  evacuationUrgency: EvacuationUrgency;
  evacuationReason: string;
  keyThreats: string[];
  locationFactors: string[];
}

/**
 * AI-recommended bundle with analysis
 */
export interface BundleRecommendation {
  bundleId: string;
  bundleName: string;
  bundleSlug: string;
  bundleImageUrl?: string;
  price: number;
  itemCount: number;
  scenarios: string[];

  // AI-generated analysis
  reasoning: string;
  pros: string[];
  cons: string[];
  fitScore: number; // 0-100
  priority: BundlePriority;
}

/**
 * Survival skill with reasoning
 */
export interface SkillItem {
  skill: string;
  reason: string;
  priority: SkillPriority;
}

/**
 * Day or period in the simulation
 */
export interface SimulationDay {
  day: string; // "1" or "2-3" for grouped days, or "Week 2"
  title: string;
  narrative: string;
  keyActions: string[];
}

/**
 * Route rationale with EMP and family-specific considerations
 */
export interface RouteRationale {
  summary: string;
  emp_specific_considerations: string[];
  family_specific_considerations: string[];
}

/**
 * Route risk assessment
 */
export interface RouteRisk {
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

/**
 * Route directions for GPS-free navigation
 */
export interface RouteDirections {
  step_by_step: string[];
  special_instructions: string[];
}

/**
 * Route metadata with scenario and family context
 */
export interface RouteMetadata {
  scenario: string;
  location: string;
  climate_zone: string;
  family_profile: {
    family_size: number;
    adults: number;
    children: number;
    seniors: number;
    medical_summary: string;
  };
  preparedness_assumptions: {
    duration_days_self_sufficient: number;
    budget_amount: string;
    water_72hr: string;
    food_calories_total: string;
  };
  general_assumptions_text: string;
}

/**
 * Waypoint type for enhanced turn-by-turn navigation
 */
export type WaypointType =
  | 'start'
  | 'end'
  | 'highway_entrance'
  | 'highway_exit'
  | 'turn'
  | 'continue'
  | 'intersection'
  | 'decision_point'
  | 'checkpoint'
  | 'fuel_stop'
  | 'rest_stop'
  | 'landmark'
  | 'water_source'
  | 'shelter';

/**
 * Enhanced waypoint with turn-by-turn navigation details
 */
export interface EnhancedWaypoint {
  lat: number;
  lng: number;
  name: string;
  description?: string;

  // New fields for detailed navigation
  order?: number;
  type?: WaypointType;
  notes?: string;
  distance_from_previous_miles?: number;
  cumulative_distance_miles?: number;
}

/**
 * Evacuation route with waypoints
 * Enhanced with optional EMP/grid-down specific fields
 */
export interface EvacuationRoute {
  // Existing required fields (backward compatibility)
  name: string;
  description: string;
  distance: string;
  estimatedTime: string;
  waypoints: EnhancedWaypoint[];
  hazards?: string[];

  // NEW optional fields for enhanced EMP planning
  route_id?: string;
  priority?: 'primary' | 'secondary' | 'tertiary';
  mode?: 'vehicle' | 'foot_or_bicycle';
  origin_description?: string;
  destination_description?: string;

  // NEW: Scenario-specific endpoint fields
  destination_address?: string;
  destination_scenario_rationale?: string;

  // Distance and time estimates
  estimated_total_distance_km?: number;
  estimated_total_distance_miles?: number;
  estimated_travel_time_hours_no_traffic?: number;
  estimated_travel_days?: number;
  estimated_fuel_needed_gallons?: number;

  // Route analysis
  rationale?: RouteRationale;
  risks?: RouteRisk[];
  directions?: RouteDirections;
}

/**
 * Parsed sections from streaming content
 */
export interface ReportSections {
  executiveSummary: string;
  riskAssessment: RiskIndicators;
  bundles: BundleRecommendation[];
  skills: SkillItem[];
  simulation: SimulationDay[];
  nextSteps: string[];
  emergencyContacts?: EmergencyContactsSection; // NEW - optional for backward compatibility
}

/**
 * Generation metadata
 */
export interface ReportMetadata {
  model: string;
  streamDurationMs: number;
  routesDurationMs?: number;
  generatedAt: string;
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
}

/**
 * Emergency contact for FEMA-recommended emergency planning
 */
export interface EmergencyContact {
  id: string; // UUID for client-side management
  name: string;
  phone: string;
  relationship: string;
  isOutOfStateCoordinator: boolean;
}

/**
 * Meeting location for emergency reunification
 */
export interface MeetingLocation {
  id: string; // UUID for client-side management
  type: 'primary' | 'secondary';
  name: string;
  address: string;
  notes?: string;
}

/**
 * Emergency contact data following FEMA protocol
 */
export interface EmergencyContactData {
  contacts: EmergencyContact[];
  meetingLocations: MeetingLocation[];
  communicationNotes?: string;
}

/**
 * Complete V2 report data structure
 * Stored in mission_reports.report_data JSONB column
 *
 * Note: evacuationRoutes are now stored in a separate database field
 * (mission_reports.evacuation_routes) for better performance
 */
export interface ReportDataV2 {
  version: '2.0';
  generatedWith: 'streaming_bundles';

  // Full streamed markdown content
  content: string;

  // Parsed sections for structured UI rendering
  sections: ReportSections;

  // Original wizard inputs
  formData: WizardFormData;

  // Generation metadata
  metadata: ReportMetadata;

  // NEW: Emergency contacts (optional for backward compatibility)
  emergencyContacts?: EmergencyContactData;

  // NEW: Item ownership tracking for Quick Stats (optional)
  ownedItems?: { [bundleId: string]: { [itemId: string]: boolean } };
}

/**
 * Legacy V1 report data structure (for backward compatibility)
 */
export interface ReportDataV1 {
  content: string;
  formData: WizardFormData;
  metadata: {
    model: string;
    generatedAt: string;
    tokensUsed?: number;
    inputTokens?: number;
    outputTokens?: number;
    durationMs?: number;
  };
  generatedWith: 'ai';
  version: '1.0';
}

/**
 * Union type for all report versions
 */
export type ReportData = ReportDataV1 | ReportDataV2;

/**
 * Type guard for V2 reports
 */
export function isReportV2(data: ReportData): data is ReportDataV2 {
  return data.version === '2.0' && 'sections' in data;
}

/**
 * Type guard for V1 reports
 */
export function isReportV1(data: ReportData): data is ReportDataV1 {
  return data.version === '1.0' || !('sections' in data);
}

/**
 * Streaming generation progress
 */
export interface StreamingProgress {
  status: 'idle' | 'connecting' | 'streaming' | 'parsing' | 'saving' | 'complete' | 'error';
  currentSection?: string;
  completedSections: string[];
  characterCount: number;
  estimatedProgress: number; // 0-100
  error?: string;
}

/**
 * Section completion status for UI
 */
export interface SectionStatus {
  name: string;
  displayName: string;
  status: 'pending' | 'streaming' | 'complete';
}

/**
 * All expected sections in order
 */
export const REPORT_SECTIONS: SectionStatus[] = [
  { name: 'executive-summary', displayName: 'Executive Summary', status: 'pending' },
  { name: 'risk-assessment', displayName: 'Risk Assessment', status: 'pending' },
  { name: 'recommended-bundles', displayName: 'Recommended Bundles', status: 'pending' },
  { name: 'survival-skills', displayName: 'Survival Skills', status: 'pending' },
  { name: 'simulation', displayName: 'Day-by-Day Simulation', status: 'pending' },
  { name: 'next-steps', displayName: 'Next Steps', status: 'pending' },
];

/**
 * Get section name from heading text
 */
export function getSectionNameFromHeading(heading: string): string | null {
  const normalized = heading.toLowerCase().trim();

  if (normalized.includes('executive summary')) return 'executive-summary';
  if (normalized.includes('risk assessment')) return 'risk-assessment';
  if (normalized.includes('recommended bundles')) return 'recommended-bundles';
  if (normalized.includes('survival skills')) return 'survival-skills';
  if (normalized.includes('day-by-day') || normalized.includes('simulation')) return 'simulation';
  if (normalized.includes('next steps')) return 'next-steps';

  return null;
}
