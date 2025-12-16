import fs from 'fs/promises';
import path from 'path';

// Prompt cache to avoid re-reading files
const promptCache = new Map<string, string>();

/**
 * Scenario types matching our 6 scenarios from /prompts/mission-generation/scenarios/
 */
export type ScenarioType =
  | 'natural-disaster'
  | 'emp-grid-down'
  | 'pandemic'
  | 'nuclear'
  | 'civil-unrest'
  | 'multi-year-sustainability';

/**
 * Load a single prompt file from /prompts directory
 * Results are cached to avoid repeated file system reads
 *
 * @param relativePath - Path relative to /prompts directory (e.g., 'mission-generation/system-prompt.md')
 * @returns Promise resolving to the prompt content as a string
 */
export async function loadPrompt(relativePath: string): Promise<string> {
  // Check cache first
  if (promptCache.has(relativePath)) {
    return promptCache.get(relativePath)!;
  }

  try {
    const promptsDir = path.join(process.cwd(), 'prompts');
    const fullPath = path.join(promptsDir, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');

    // Cache the result
    promptCache.set(relativePath, content);

    return content;
  } catch (error) {
    console.error(`Failed to load prompt: ${relativePath}`, error);
    throw new Error(`Prompt file not found: ${relativePath}`);
  }
}

/**
 * Load the main system prompt for mission generation
 * This contains the expert consultant persona, core principles, and calculation formulas
 *
 * @returns Promise resolving to the system prompt content
 */
export async function loadSystemPrompt(): Promise<string> {
  return loadPrompt('mission-generation/system-prompt.md');
}

/**
 * Load scenario-specific prompts for the selected scenarios
 * These prompts provide critical context about each scenario including:
 * - Shelter-in-place vs evacuation criteria
 * - Location-specific risks
 * - Supply priorities by timeline
 * - Scenario-specific considerations
 *
 * @param scenarios - Array of scenario types to load prompts for
 * @returns Promise resolving to combined scenario prompts with clear sections
 */
export async function loadScenarioPrompts(scenarios: ScenarioType[]): Promise<string> {
  if (!scenarios || scenarios.length === 0) {
    return '';
  }

  const promptPromises = scenarios.map(async (scenario) => {
    const content = await loadPrompt(`mission-generation/scenarios/${scenario}.md`);
    return `## Scenario Context: ${formatScenarioName(scenario)}\n\n${content}`;
  });

  const scenarioContents = await Promise.all(promptPromises);

  return scenarioContents.join('\n\n---\n\n');
}

/**
 * Load all prompts needed for mission generation in one batch
 * Optimized for parallel loading with Promise.all
 *
 * @param scenarios - Array of scenario types to include
 * @returns Promise resolving to object with systemPrompt and scenarioContext
 */
export async function loadMissionPrompts(scenarios: ScenarioType[]) {
  const [systemPrompt, scenarioContext] = await Promise.all([
    loadSystemPrompt(),
    loadScenarioPrompts(scenarios),
  ]);

  return {
    systemPrompt,
    scenarioContext,
  };
}

/**
 * Clear the prompt cache (useful for development/testing)
 */
export function clearPromptCache(): void {
  promptCache.clear();
}

/**
 * Format scenario type slug into human-readable name
 */
function formatScenarioName(scenario: ScenarioType): string {
  const names: Record<ScenarioType, string> = {
    'natural-disaster': 'Natural Disaster',
    'emp-grid-down': 'EMP / Grid Down',
    'pandemic': 'Pandemic',
    'nuclear': 'Nuclear Event',
    'civil-unrest': 'Civil Unrest',
    'multi-year-sustainability': 'Multi-Year Sustainability',
  };

  return names[scenario] || scenario;
}

/**
 * Validate that a scenario type is valid
 */
export function isValidScenario(scenario: string): scenario is ScenarioType {
  const validScenarios: ScenarioType[] = [
    'natural-disaster',
    'emp-grid-down',
    'pandemic',
    'nuclear',
    'civil-unrest',
    'multi-year-sustainability',
  ];

  return validScenarios.includes(scenario as ScenarioType);
}
