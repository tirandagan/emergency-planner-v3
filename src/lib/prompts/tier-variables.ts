/**
 * Tier-Based Prompt Variables
 * Extensible system for tier-specific AI instructions across all features
 *
 * This allows any feature to customize AI behavior based on user tier
 * Example usage in prompts: {{tier_instructions:emergency_contacts}}
 */

export type FeatureName =
  | 'emergency_contacts'
  | 'evacuation_routes'
  | 'bundle_recommendations'
  | 'simulation_depth'
  | 'skills_analysis'
  | 'risk_assessment';

export type UserTier = 'FREE' | 'BASIC' | 'PRO';

/**
 * Tier instructions for each feature
 * Define how AI behavior should change based on user subscription level
 */
const TIER_INSTRUCTIONS: Record<FeatureName, Record<UserTier, string>> = {
  emergency_contacts: {
    FREE: `From the provided contacts, select the 5 MOST CRITICAL emergency services.
Prioritize in this order:
1. 911 emergency services
2. Nearest hospital with emergency room
3. National Poison Control Hotline
4. Nearest fire station
5. State emergency management agency

Focus exclusively on life-saving resources. Do not include community resources, utilities, or information services.
For meeting locations, select only 1 PRIMARY location that is safe, public, and accessible.`,

    BASIC: `Analyze all provided contacts and recommend 10-15 emergency services.

Categories to include:
- Medical: Hospitals, urgent care, pharmacies (2-3 contacts)
- Emergency Response: Police, fire stations (2-3 contacts)
- Government: Emergency management, local government (1-2 contacts)
- Utilities: Power, water (if applicable to scenarios)
- Community: Shelters, aid organizations (1-2 contacts)

Provide detailed reasoning for each recommendation explaining why it's relevant to the user's specific scenarios and location.
For meeting locations, recommend 1-2 locations (primary + secondary) with specific addresses and practical details.`,

    PRO: `Provide comprehensive emergency contact analysis with 15-25 contacts covering ALL categories.

Include standard services PLUS specialized resources:
- **Advanced Medical**: Level 1 trauma centers, specialized hospitals, telemedicine services
- **Specialized Response**: Hazmat teams, search and rescue, emergency shelters
- **Extended Support**: HAM radio networks, community watch groups, cooperatives
- **Backup Resources**: Alternative hospitals, backup fire stations, mobile clinics
- **Scenario-Specific**: Radiation monitoring (nuclear), air quality (pandemic), supply networks

For each contact, provide:
- Detailed reasoning with scenario-specific applicability
- Backup alternatives where applicable
- Availability notes (24/7, seasonal, etc.)

For meeting locations, recommend 2-3 locations (primary + secondary + tertiary) with:
- Specific addresses and coordinates
- Detailed practical information (parking, accessibility, capacity)
- Scenario-specific suitability analysis
- Distance and estimated travel time from home`,
  },

  evacuation_routes: {
    FREE: `Generate 1 primary evacuation route with basic waypoints and distance estimates.`,

    BASIC: `Generate 3 evacuation routes with detailed waypoints, hazard analysis, and alternative routes.
Include estimated fuel needs and travel time calculations.`,

    PRO: `Generate 5 comprehensive evacuation routes with:
- Detailed waypoint-by-waypoint analysis
- Multiple alternatives per route
- EMP/grid-down specific considerations
- Resource availability along routes
- Seasonal variation analysis`,
  },

  bundle_recommendations: {
    FREE: `Recommend 3-5 essential survival bundles focusing on immediate life-safety needs.`,

    BASIC: `Recommend 5-8 bundles covering essential categories with detailed cost-benefit analysis.
Include pros, cons, and scenario-specific fit scores.`,

    PRO: `Recommend 8-12 comprehensive bundles including:
- Essential survival gear
- Specialized scenario-specific equipment
- Long-term sustainability items
- Backup/redundancy options
- Detailed prioritization and phased acquisition plans`,
  },

  simulation_depth: {
    FREE: `Provide 3-day hour-by-hour simulation focusing on immediate survival priorities.`,

    BASIC: `Provide 7-day detailed simulation with:
- Hour-by-hour breakdown for days 1-3
- Daily summaries for days 4-7
- Key decision points and contingency plans`,

    PRO: `Provide 30-day comprehensive simulation with:
- Hour-by-hour for critical first 72 hours
- Detailed daily plans for week 1-2
- Weekly summaries for weeks 3-4
- Long-term sustainability considerations
- Multiple scenario branches and decision trees`,
  },

  skills_analysis: {
    FREE: `Identify 5-7 critical survival skills needed for immediate safety.`,

    BASIC: `Identify 10-15 essential skills across multiple categories:
- Medical/First Aid
- Fire/Shelter
- Water/Food
- Communication
- Security
Include learning resources and practice recommendations.`,

    PRO: `Identify 15-25 comprehensive skills including:
- All basic categories
- Advanced specialized skills (HAM radio, water purification chemistry, etc.)
- Scenario-specific expertise
- Long-term sustainability skills
- Detailed learning pathways with progression milestones`,
  },

  risk_assessment: {
    FREE: `Provide basic risk level assessment (HIGH/MEDIUM/LOW) with key threats.`,

    BASIC: `Provide detailed risk assessment including:
- Multi-factor risk scoring
- Scenario-specific threat analysis
- Timeline-based risk evolution
- Prioritized mitigation strategies`,

    PRO: `Provide comprehensive risk assessment with:
- Quantified risk scores across 10+ factors
- Cascading failure analysis
- Probability-weighted scenario trees
- Geographic-specific vulnerability mapping
- Detailed mitigation strategies with cost-benefit analysis`,
  },
};

/**
 * Get tier-specific instructions for a feature
 *
 * @param feature - The feature name (e.g., 'emergency_contacts')
 * @param tier - User tier ('FREE', 'BASIC', or 'PRO')
 * @returns Tier-specific instruction string for use in AI prompts
 */
export function getTierInstructions(feature: FeatureName, tier: UserTier): string {
  const instructions = TIER_INSTRUCTIONS[feature];

  if (!instructions) {
    console.warn(`No tier instructions defined for feature: ${feature}`);
    return '';
  }

  return instructions[tier] || instructions.FREE; // Default to FREE if tier not found
}

/**
 * Get tier-specific instructions with fallback
 * Useful when tier might be undefined or invalid
 */
export function getTierInstructionsSafe(
  feature: FeatureName,
  tier?: string | null
): string {
  const normalizedTier = normalizeTier(tier);
  return getTierInstructions(feature, normalizedTier);
}

/**
 * Normalize tier string to UserTier type
 */
export function normalizeTier(tier?: string | null): UserTier {
  if (!tier) return 'FREE';

  const upperTier = tier.toUpperCase();
  if (upperTier === 'BASIC' || upperTier === 'PRO') {
    return upperTier as UserTier;
  }

  return 'FREE';
}

/**
 * Check if a tier has access to a feature
 * (For future feature gating at the AI level)
 */
export function hasTierAccess(
  feature: FeatureName,
  tier: UserTier,
  minimumTier: UserTier = 'FREE'
): boolean {
  const tierLevels: Record<UserTier, number> = {
    FREE: 0,
    BASIC: 1,
    PRO: 2,
  };

  return tierLevels[tier] >= tierLevels[minimumTier];
}

/**
 * Get all features that have tier-specific instructions
 */
export function getAvailableFeatures(): FeatureName[] {
  return Object.keys(TIER_INSTRUCTIONS) as FeatureName[];
}

/**
 * Preview tier instructions for all tiers (useful for testing/debugging)
 */
export function previewTierInstructions(feature: FeatureName): Record<UserTier, string> {
  return {
    FREE: getTierInstructions(feature, 'FREE'),
    BASIC: getTierInstructions(feature, 'BASIC'),
    PRO: getTierInstructions(feature, 'PRO'),
  };
}
