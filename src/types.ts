
export interface UserProfile {
  name: string;
  location: string;
  familySize: number;
  preparednessLevel: number; // 0-100
}

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  birthYear?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  role: 'ADMIN' | 'USER';
  householdMembers?: import('@/types/wizard').FamilyMember[];
  saveHouseholdPreference?: boolean;
}

export enum ScenarioType {
  GENERAL = 'General Emergency',
  NATURAL_DISASTER = 'Natural Disaster (Hurricane/Quake)',
  PANDEMIC = 'Pandemic / Bio-Threat',
  CIVIL_UNREST = 'Civil Unrest',
  EMP = 'EMP/Grid Down',
  NUCLEAR = 'Nuclear Fallout'
}

export enum ItemType {
  AFFILIATE = 'AFFILIATE',
  DIRECT_SALE = 'DIRECT_SALE',
  OWNED = 'OWNED'
}

export enum MobilityType {
  BUG_IN = 'Shelter in Place',
  BUG_OUT_FOOT = 'Bug Out (Foot)',
  BUG_OUT_VEHICLE = 'Bug Out (Vehicle)'
}

export enum BudgetTier {
  MINIMALIST = 'Minimalist (Essential Only)',
  STANDARD = 'Standard (Balanced)',
  PREMIUM = 'Premium (High Performance)'
}

export interface DBProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'DIRECT_SALE' | 'AFFILIATE';
  affiliate_link?: string;
  image_url?: string;
  capacity_value: number;
  capacity_unit: string;
}

export interface SupplyItem {
  item_name: string;
  search_query: string;
  unit_type: 'count' | 'gallons' | 'calories' | 'liters' | 'pairs' | 'sets';
  quantity_needed: number;
  urgency: 'High' | 'Medium' | 'Low';
  // Enriched fields after matching
  matched_product?: DBProduct;
  matched_products?: DBProduct[];
  match_score?: number;
  calculated_quantity?: number;
  estimated_cost?: number;
  
  // New category link from master_item (for UI grouping)
  category_id?: string;
  category_name?: string;
}

export interface KitItem {
  id: string;
  name: string;
  category: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedCost: number;
  type: ItemType;
  link?: string; // URL for affiliate or cart
  owned: boolean;
  applicableScenarios: string[]; // Which scenarios this item applies to
  supplyIndex?: number; // Index in the supplies array for rich data lookup
}

export interface Route {
  id: string;
  name: string;
  description: string;
  waypoints: { lat: number; lng: number; name: string }[];
  type: 'vehicle' | 'foot';
  dangerLevel: 'High' | 'Medium' | 'Low';
  riskAssessment?: string; // Detailed risk commentary separate from level
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface Article {
  title: string;
  source: string;
  url: string;
}

export interface PDFDocument {
  title: string;
  source: string;
  url: string;
}

export interface Person {
  id: string;
  gender: 'Male' | 'Female';
  age: 'Infant/Toddler' | 'Child' | 'Adult' | 'Elderly/Mobility';
  medical: boolean;
}

export interface SkillResource {
  skill: string;
  videos: YouTubeVideo[];
  videoReasoning?: string;
  articles: Article[];
  pdfs: PDFDocument[];
}

export interface GeneratedKit {
  scenarios: string[]; // Multiple selected scenarios
  summary?: string; // Deprecated in new prompt? Or we keep it for backward compatibility or infer it.
  // The new prompt generates "supplies" instead of "items". We need to map or support both.
  items: KitItem[]; // Keep this for UI compatibility, we will map supplies to items.
  supplies?: SupplyItem[]; // New raw structured data
  readinessScore: number;
  simulationLog: string[]; // Changed to array of strings (Day 1, 2, 3) or keep as string and join
  requiredSkills: string[]; // List of skills
  rationPlan?: string; // Might need to be calculated or extracted from supplies
  youtubeQueries: string[];
  evacuationRoutes: Route[];
  skillResources?: SkillResource[]; // Optional resources for each skill
  personnel?: Person[]; // Detailed personnel list
  preparationTime?: string; // How much time to prepare (e.g. "Immediate", "6 Months")
}

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  type: 'AFFILIATE' | 'HOUSE_KIT';
  description: string;
  affiliateLink?: string;
  category: string;
}
