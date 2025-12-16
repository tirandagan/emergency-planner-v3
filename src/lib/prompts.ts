import fs from 'fs/promises';
import path from 'path';
import type { WizardFormData, LocationData } from '@/types/wizard';

/**
 * Prompt Loader Utility
 * Loads and combines markdown prompts from /prompts directory
 * Supports {{include:filename.md}} syntax for modular prompts
 * Replaces template variables with actual form data
 */

const PROMPTS_BASE_DIR = path.join(process.cwd(), 'prompts');
const MISSION_PROMPTS_DIR = path.join(PROMPTS_BASE_DIR, 'mission-generation');
const ROUTE_PROMPTS_DIR = path.join(PROMPTS_BASE_DIR, 'evacuation-routes');

// Track included files to prevent circular dependencies
const MAX_INCLUDE_DEPTH = 10;

/**
 * Load a prompt file from the prompts directory
 * @param relativePath - Path relative to prompts/mission-generation/
 */
export async function loadPrompt(relativePath: string): Promise<string> {
  const fullPath = path.join(MISSION_PROMPTS_DIR, relativePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  return content;
}

/**
 * Load a prompt file from any prompts subdirectory
 * @param relativePath - Path relative to prompts/
 */
export async function loadPromptFromBase(relativePath: string): Promise<string> {
  const fullPath = path.join(PROMPTS_BASE_DIR, relativePath);
  const content = await fs.readFile(fullPath, 'utf-8');
  return content;
}

/**
 * Resolve {{include:filename.md}} directives recursively
 * Handles relative paths like ../shared/tone.md
 */
export async function resolveIncludes(
  content: string,
  currentDir: string,
  depth: number = 0
): Promise<string> {
  if (depth > MAX_INCLUDE_DEPTH) {
    throw new Error(`Maximum include depth (${MAX_INCLUDE_DEPTH}) exceeded. Check for circular includes.`);
  }

  // Match {{include:path/to/file.md}} pattern
  const includeRegex = /\{\{include:([^}]+)\}\}/g;
  let result = content;
  let match;

  // Find all includes first to avoid regex state issues
  const includes: { fullMatch: string; filePath: string }[] = [];
  while ((match = includeRegex.exec(content)) !== null) {
    includes.push({ fullMatch: match[0], filePath: match[1].trim() });
  }

  // Process each include
  for (const { fullMatch, filePath } of includes) {
    try {
      // Resolve the path relative to current directory
      const resolvedPath = path.resolve(currentDir, filePath);
      const includeDir = path.dirname(resolvedPath);

      // Read the included file
      const includeContent = await fs.readFile(resolvedPath, 'utf-8');

      // Recursively resolve includes in the included content
      const processedContent = await resolveIncludes(includeContent, includeDir, depth + 1);

      // Replace the include directive with the content
      result = result.replace(fullMatch, processedContent);
    } catch (error) {
      console.warn(`Failed to include file: ${filePath}`, error);
      // Replace with empty string or a warning comment
      result = result.replace(fullMatch, `<!-- Include not found: ${filePath} -->`);
    }
  }

  return result;
}

/**
 * Replace template variables in a prompt with actual values
 * Template variables use {{variable_name}} syntax (but not {{include:...}})
 */
export function replaceVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    // Don't replace 'include:' patterns - those are for file inclusion
    if (key.startsWith('include:')) continue;

    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value));
  }

  return result;
}

/**
 * Calculate supply quantities based on family size and duration
 */
function calculateSupplies(formData: WizardFormData) {
  const familySize = formData.familyMembers.length;
  const days = formData.durationDays;

  // Water: 1 gallon per person per day
  const water_72hr = familySize * 3;
  const water_total = familySize * days;

  // Food: 2000 calories per adult per day
  const food_calories_day = familySize * 2000;
  const food_calories_total = food_calories_day * days;

  return {
    water_72hr,
    water_total,
    food_calories_day,
    food_calories_total,
  };
}

/**
 * Get budget tier label from string value
 */
function getBudgetTierLabel(tier: string): string {
  const tiers = {
    LOW: 'Tight Budget (<$500)',
    MEDIUM: 'Moderate Budget ($500-1,500)',
    HIGH: 'Premium Budget ($1,500+)',
  };
  return tiers[tier as keyof typeof tiers] || 'Moderate Budget ($500-1,500)';
}

/**
 * Get budget amount from tier
 */
export function getBudgetAmount(tier: string): number {
  const budgetMap = {
    LOW: 350,
    MEDIUM: 1000,
    HIGH: 2000,
  };
  return budgetMap[tier as keyof typeof budgetMap] || 1000;
}

/**
 * Extract variables from form data for template replacement
 */
export function extractTemplateVariables(formData: WizardFormData): Record<string, string | number> {
  const supplies = calculateSupplies(formData);

  // Location string
  const location = formData.location.city && formData.location.state
    ? `${formData.location.city}, ${formData.location.state}`
    : formData.location.fullAddress;

  // Family composition details
  const adults = formData.familyMembers.filter(m => m.age >= 18 && m.age < 65).length;
  const children = formData.familyMembers.filter(m => m.age < 18).length;
  const seniors = formData.familyMembers.filter(m => m.age >= 65).length;

  // Medical needs summary
  const medicalNeeds = formData.familyMembers
    .map(m => m.medicalConditions)
    .filter(Boolean);

  // Special needs summary
  const specialNeeds = formData.familyMembers
    .map(m => m.specialNeeds)
    .filter(Boolean);

  return {
    // Location
    location,
    climate_zone: formData.location.climateZone || 'temperate',

    // Family
    family_size: formData.familyMembers.length,
    adults,
    children,
    seniors,

    // Medical
    medical_needs: medicalNeeds.length > 0 ? medicalNeeds.join(', ') : 'None',

    // Special needs (dietary, mobility, etc.)
    special_needs: specialNeeds.length > 0 ? specialNeeds.join(', ') : 'None',

    // Duration & Budget
    duration_days: formData.durationDays,
    budget_tier: getBudgetTierLabel(formData.budgetTier),
    budget_amount: getBudgetAmount(formData.budgetTier),

    // Calculated supplies
    ...supplies,

    // Preparedness level
    preparedness_level: formData.existingPreparedness,
  };
}

/**
 * Build the mega prompt by combining all relevant prompts
 * LEGACY: Original implementation without include support
 *
 * Structure:
 * 1. System prompt (core instructions)
 * 2. Scenario-specific prompts
 * 3. Shared elements (tone, disclaimers)
 */
export async function buildMegaPrompt(formData: WizardFormData): Promise<string> {
  try {
    // Load core prompts
    const systemPrompt = await loadPrompt('system-prompt.md');

    // Load scenario-specific prompts
    const scenarioPrompts = await Promise.all(
      formData.scenarios.map(async (scenario) => {
        const scenarioFile = `scenarios/${scenario}.md`;
        try {
          return await loadPrompt(scenarioFile);
        } catch (error) {
          console.warn(`Scenario prompt not found: ${scenarioFile}`);
          return '';
        }
      })
    );

    // Combine all prompts
    const combinedPrompt = [
      '# MISSION GENERATION INSTRUCTIONS',
      '',
      systemPrompt,
      '',
      ...scenarioPrompts.filter(Boolean),
    ].join('\n');

    // Extract and replace template variables
    const variables = extractTemplateVariables(formData);
    const finalPrompt = replaceVariables(combinedPrompt, variables);

    return finalPrompt;
  } catch (error) {
    console.error('Failed to build mega prompt:', error);
    throw error;
  }
}

/**
 * Build the streaming mega prompt with {{include:...}} support
 * NEW: V2 implementation with modular includes and bundle context
 */
export async function buildStreamingMegaPrompt(
  formData: WizardFormData,
  bundleContext?: string
): Promise<string> {
  try {
    // Load the mega-prompt template
    const megaPromptPath = path.join(MISSION_PROMPTS_DIR, 'mega-prompt.md');
    let megaPrompt = await fs.readFile(megaPromptPath, 'utf-8');

    // Resolve all {{include:...}} directives
    megaPrompt = await resolveIncludes(megaPrompt, MISSION_PROMPTS_DIR);

    // Load scenario-specific prompts and combine them
    const scenarioPrompts = await Promise.all(
      formData.scenarios.map(async (scenario) => {
        const scenarioFile = path.join(MISSION_PROMPTS_DIR, 'scenarios', `${scenario}.md`);
        try {
          const content = await fs.readFile(scenarioFile, 'utf-8');
          return `### ${scenario.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Scenario\n\n${content}`;
        } catch (error) {
          console.warn(`Scenario prompt not found: ${scenario}.md`);
          return '';
        }
      })
    );

    // Replace {{scenario_prompts}} with actual scenario content
    const scenarioSection = scenarioPrompts.filter(Boolean).join('\n\n---\n\n');
    megaPrompt = megaPrompt.replace('{{scenario_prompts}}', scenarioSection);

    // Extract and replace template variables
    const variables = extractTemplateVariables(formData);
    megaPrompt = replaceVariables(megaPrompt, variables);

    // Add bundle context if provided
    if (bundleContext) {
      megaPrompt += `\n\n---\n\n## Available Bundles for Recommendation\n\n${bundleContext}`;
    }

    return megaPrompt;
  } catch (error) {
    console.error('Failed to build streaming mega prompt:', error);
    throw error;
  }
}

/**
 * Build user message with form data summary for streaming generation
 */
export function buildStreamingUserMessage(
  formData: WizardFormData,
  mobility: 'BUG_IN' | 'BUG_OUT' = 'BUG_IN'
): string {
  const location = formData.location.city && formData.location.state
    ? `${formData.location.city}, ${formData.location.state}`
    : formData.location.fullAddress;

  const scenarioList = formData.scenarios
    .map(s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .join(', ');

  const familyDetails = formData.familyMembers.map((member, idx) => {
    const ageGroup = member.age < 18 ? 'child' : member.age >= 65 ? 'senior' : 'adult';
    const details = [`Person ${idx + 1}: ${ageGroup} (age ${member.age})`];
    if (member.medicalConditions) {
      details.push(`medical: ${member.medicalConditions}`);
    }
    if (member.specialNeeds) {
      details.push(`special needs: ${member.specialNeeds}`);
    }
    return details.join('; ');
  }).join('\n- ');

  const homeTypeLabels: Record<string, string> = {
    apartment: 'Apartment/Condo (limited storage, shared building)',
    house: 'Single-family house (moderate storage, yard access)',
    condo: 'Condominium (limited storage, HOA considerations)',
    rural: 'Rural property (large storage, well/septic possible)',
    mobile: 'Mobile home (limited storage, evacuation priority)',
    other: 'Other dwelling type',
  };

  return `Generate a comprehensive, streaming disaster preparedness mission report.

**SCENARIOS**: ${scenarioList}

**LOCATION**: ${location}
**Climate Zone**: ${formData.location.climateZone || 'temperate'}

**FAMILY COMPOSITION** (${formData.familyMembers.length} people):
- ${familyDetails}

**HOME TYPE**: ${homeTypeLabels[formData.homeType] || formData.homeType}

**MOBILITY PLAN**: ${mobility === 'BUG_OUT' ? 'Bug Out (evacuation planned)' : 'Bug In (shelter in place)'}

**PLANNING DURATION**: ${formData.durationDays} days

**BUDGET**: ${getBudgetTierLabel(formData.budgetTier)} (approximately $${getBudgetAmount(formData.budgetTier)})

**CURRENT PREPAREDNESS**: ${formData.existingPreparedness}

Generate the complete mission report following the exact output format specified. Include:
1. Executive Summary (2-3 paragraphs)
2. Risk Assessment (with all four subsections)
3. Recommended Bundles (3-4 bundles with full analysis - ONLY use bundle IDs from the AVAILABLE BUNDLES list)
4. Survival Skills Needed (3-7 skills)
5. Day-by-Day Simulation (structured for ${formData.durationDays} days)
6. Next Steps (3-5 actionable items)

IMPORTANT: Stream the response progressively. The user will see content as it generates.`;
}

/**
 * Build evacuation route generation prompt
 * Uses template system for maintainability
 */
export async function buildRoutePrompt(
  location: LocationData,
  scenarios: string[],
  formData: WizardFormData
): Promise<string> {
  try {
    // Load the unified scenario-aware route prompt
    const mainPromptPath = path.join(ROUTE_PROMPTS_DIR, 'unified-scenario-aware-prompt.md');
    let prompt = await fs.readFile(mainPromptPath, 'utf-8');

    // Resolve any {{include:...}} directives
    prompt = await resolveIncludes(prompt, ROUTE_PROMPTS_DIR);

    // Prepare scenario context
    const scenarioContext = scenarios
      .map(s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
      .join(', ');

    // Calculate family composition from familyMembers array
    const familyMembers = formData.familyMembers || [];
    const adults = familyMembers.filter(m => m.age >= 18 && m.age < 65).length || 2;
    const children = familyMembers.filter(m => m.age < 18).length || 0;
    const seniors = familyMembers.filter(m => m.age >= 65).length || 0;
    const family_size = familyMembers.length || 2;

    // Extract medical summary from family members
    const medical_summary = familyMembers
      .filter(m => m.medicalConditions && m.medicalConditions.trim())
      .map((m, idx) => `Family member ${idx + 1}: ${m.medicalConditions}`)
      .join('; ') || 'None reported';

    // Calculate preparedness data
    const duration_days = formData.durationDays || 14;
    const budget_amount = getBudgetAmount(formData.budgetTier) || 500;
    const water_72hr = `${family_size * 3} gallons`;
    const food_calories_total = family_size * 2000 * duration_days;

    // Format location string
    const locationStr = `${location.city}, ${location.state}`;

    // Replace ALL template variables
    const variables = {
      // Existing variables
      city: location.city,
      state: location.state,
      country: location.country,
      lat: location.coordinates.lat,
      lng: location.coordinates.lng,
      climate_zone: location.climateZone,
      scenarios: scenarioContext,
      full_address: location.fullAddress, // User's exact street address

      // NEW family composition variables
      family_size,
      adults,
      children,
      seniors,
      medical_summary,

      // NEW preparedness variables
      location: locationStr,
      duration_days,
      budget_amount,
      water_72hr,
      food_calories_total,
    };

    prompt = replaceVariables(prompt, variables);

    return prompt;
  } catch (error) {
    console.error('Failed to build route prompt:', error);
    throw error;
  }
}

/**
 * Build user message with form data summary
 * LEGACY: Original implementation
 */
export function buildUserMessage(formData: WizardFormData): string {
  const location = formData.location.city && formData.location.state
    ? `${formData.location.city}, ${formData.location.state}`
    : formData.location.fullAddress;

  const scenarioList = formData.scenarios
    .map(s => s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
    .join(', ');

  const familyDetails = formData.familyMembers.map((member, idx) => {
    const ageGroup = member.age < 18 ? 'child' : member.age >= 65 ? 'senior' : 'adult';
    const details = [`Person ${idx + 1}: ${ageGroup} (age ${member.age})`];
    if (member.medicalConditions) {
      details.push(`medical: ${member.medicalConditions}`);
    }
    if (member.specialNeeds) {
      details.push(`special needs: ${member.specialNeeds}`);
    }
    return details.join('; ');
  }).join('\n- ');

  return `Generate a comprehensive disaster preparedness plan with the following requirements:

**Scenarios**: ${scenarioList}

**Location**: ${location}
**Climate Zone**: ${formData.location.climateZone || 'Not specified'}

**Family Composition** (${formData.familyMembers.length} people):
- ${familyDetails}

**Home Type**: ${formData.homeType}

**Planning Duration**: ${formData.durationDays} days

**Budget Tier**: ${getBudgetTierLabel(formData.budgetTier)}

**Current Preparedness Level**: ${formData.existingPreparedness}

Please provide a detailed, actionable plan that addresses all scenarios and is personalized for this family's specific needs, location, and constraints.`;
}
