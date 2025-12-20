// Wizard Type Definitions for Phase 4.2 New Plan Wizard
// These types match the database schema and AI response structure

/**
 * Scenario types matching our 6 disaster preparedness scenarios
 */
export type ScenarioType =
  | 'natural-disaster'
  | 'emp-grid-down'
  | 'pandemic'
  | 'nuclear'
  | 'civil-unrest'
  | 'multi-year-sustainability';

/**
 * Family member configuration for personnel planning
 */
export interface FamilyMember {
  name?: string; // Optional name for identification (e.g., "Mom", "Sarah")
  age: number; // 0-120
  gender?: 'male' | 'female' | 'prefer_not_to_say'; // Optional gender
  medicalConditions?: string; // Optional medical conditions
  specialNeeds?: string; // Optional special needs (dietary, mobility, etc.)
}

/**
 * Location data from Google Places API
 */
export interface LocationData {
  city: string; // e.g., "Austin"
  state: string; // e.g., "Texas"
  country: string; // e.g., "United States"
  coordinates: {
    lat: number;
    lng: number;
  };
  climateZone: string; // Auto-detected from latitude
  fullAddress: string; // Full formatted address
  placeId: string; // Google Place ID
  rawPlaceData?: google.maps.places.PlaceResult; // Full Google Places response
}

/**
 * Complete wizard form data collected across all steps
 */
export interface WizardFormData {
  // Step 1: Scenario Selection
  scenarios: ScenarioType[];

  // Step 2: Personnel Configuration
  familyMembers: FamilyMember[];

  // Step 3: Location & Context
  location: LocationData;
  homeType: 'apartment' | 'house' | 'condo' | 'rural' | 'mobile' | 'other';
  durationDays: number; // 3, 7, 30, 90, 365
}

/**
 * AI-generated mission plan kit
 * This is returned by the AI and stored in the database
 */
export interface GeneratedKit {
  scenarios: ScenarioType[]; // Which scenarios this plan addresses
  summary: string; // Executive summary of the plan
  readinessScore: number; // 0-100 assessment score
  simulationLog: string; // Day-by-day narrative simulation
  rationPlan: string; // Food/water rationing strategy
  supplies: SupplyItem[]; // AI-calculated supply needs
  items: KitItem[]; // Matched to specific products
  requiredSkills: string[]; // Skills needed for scenarios
  evacuationRoutes: Route[]; // Generated evacuation routes
  skillResources: SkillResource[]; // Filtered from skills_resources table
  emergencyContacts?: EmergencyContact[]; // User-added contacts
}

/**
 * Individual supply item calculated by AI
 */
export interface SupplyItem {
  category: string; // "Water", "Food", "Shelter", "Medical", etc.
  item: string; // "Bottled Water", "Canned Beans", etc.
  quantity: number; // Calculated amount
  unit: string; // "gallons", "servings", "units", etc.
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string; // Why this amount is needed
}

/**
 * Kit item matched to specific products
 */
export interface KitItem {
  supplyItemId?: string; // Reference to SupplyItem
  productId?: string; // Reference to specific_products table
  name: string;
  quantity: number;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedCost?: number;
  purchaseUrl?: string;
}

/**
 * Evacuation route with waypoints
 */
export interface Route {
  id: string;
  name: string; // "Primary Evacuation Route", "Alternate Route North", etc.
  waypoints: Waypoint[];
  estimatedDuration: string; // "2 hours 30 minutes"
  distance: string; // "45 miles"
  notes: string; // Special considerations
}

/**
 * Waypoint along an evacuation route
 * Coordinates are optional and populated via Google Geocoding API
 */
export interface Waypoint {
  name: string; // "I-26 East and New Leicester Hwy", "Hickory Regional Airport"
  description?: string;
  lat?: number; // Populated by geocoding
  lng?: number; // Populated by geocoding
  geocoded?: boolean; // Flag indicating successful geocoding
}

/**
 * Skill resource reference
 */
export interface SkillResource {
  skillId: string; // Reference to skills_resources table
  skillName: string;
  category: string;
  resourceUrl?: string;
  description?: string;
}

/**
 * Emergency contact
 */
export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  notes?: string;
}

/**
 * Wizard step validation state
 */
export interface StepValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Wizard navigation state
 */
export interface WizardState {
  currentStep: number; // 0-3 (4 steps total)
  completedSteps: number[]; // Array of completed step indices
  canProceed: boolean; // Can advance to next step
  canGoBack: boolean; // Can return to previous step
}

/**
 * AI generation progress state
 */
export interface GenerationProgress {
  status: 'idle' | 'loading' | 'generating' | 'parsing' | 'saving' | 'success' | 'error';
  progress: number; // 0-100
  message: string; // Status message for user
  error?: string; // Error message if failed
}
