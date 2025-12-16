/**
 * Prompt Loading System
 * 
 * Loads AI prompts from markdown files in the /prompts directory.
 * Includes in-memory caching for performance and variable substitution.
 */

import fs from 'fs/promises';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'prompts');

/**
 * In-memory cache for loaded prompts
 * Key: file path, Value: prompt content
 */
const promptCache = new Map<string, string>();

/**
 * Enable/disable caching (disable in development for hot-reloading)
 */
const ENABLE_CACHE = process.env.NODE_ENV === 'production';

/**
 * Load a prompt from a markdown file
 * 
 * @param promptPath - Path relative to /prompts directory (e.g., 'mission-generation/system-prompt.md')
 * @returns Promise<string> - The prompt content
 * 
 * @example
 * ```typescript
 * const prompt = await loadPrompt('mission-generation/system-prompt.md');
 * ```
 */
export async function loadPrompt(promptPath: string): Promise<string> {
  // Check cache first
  if (ENABLE_CACHE && promptCache.has(promptPath)) {
    return promptCache.get(promptPath)!;
  }

  try {
    const fullPath = path.join(PROMPTS_DIR, promptPath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const trimmedContent = content.trim();

    // Cache for future use
    if (ENABLE_CACHE) {
      promptCache.set(promptPath, trimmedContent);
    }

    return trimmedContent;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `Prompt file not found: ${promptPath}. Make sure the file exists in /prompts directory.`
      );
    }
    throw new Error(`Failed to load prompt ${promptPath}: ${error}`);
  }
}

/**
 * Load a prompt and replace variables with provided values
 * 
 * Variables in prompts use double curly braces: {{variable_name}}
 * 
 * @param promptPath - Path relative to /prompts directory
 * @param variables - Object with variable names and values
 * @returns Promise<string> - The prompt with variables replaced
 * 
 * @example
 * ```typescript
 * const prompt = await loadPromptWithVariables(
 *   'mission-generation/supply-calculation.md',
 *   {
 *     family_size: '4',
 *     location: 'Seattle, WA',
 *     duration: '7'
 *   }
 * );
 * ```
 */
export async function loadPromptWithVariables(
  promptPath: string,
  variables: Record<string, string | number | boolean>
): Promise<string> {
  let content = await loadPrompt(promptPath);

  // Replace each variable in the format {{variable_name}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    content = content.replace(regex, String(value));
  }

  // Check for unreplaced variables and warn in development
  if (process.env.NODE_ENV === 'development') {
    const unreplacedVars = content.match(/\{\{[^}]+\}\}/g);
    if (unreplacedVars) {
      console.warn(
        `[Prompts] Unreplaced variables in ${promptPath}:`,
        unreplacedVars
      );
    }
  }

  return content;
}

/**
 * Load multiple prompts in parallel
 * 
 * @param promptPaths - Array of paths relative to /prompts directory
 * @returns Promise<string[]> - Array of prompt contents in same order
 * 
 * @example
 * ```typescript
 * const [systemPrompt, taskPrompt] = await loadMultiplePrompts([
 *   'mission-generation/system-prompt.md',
 *   'mission-generation/supply-calculation.md'
 * ]);
 * ```
 */
export async function loadMultiplePrompts(
  promptPaths: string[]
): Promise<string[]> {
  return Promise.all(promptPaths.map((path) => loadPrompt(path)));
}

/**
 * Load all scenario prompts for mission generation
 * 
 * @param scenarios - Array of scenario names
 * @returns Promise<string[]> - Array of scenario prompt contents
 * 
 * @example
 * ```typescript
 * const scenarioPrompts = await loadScenarioPrompts([
 *   'natural-disaster',
 *   'emp-grid-down'
 * ]);
 * ```
 */
export async function loadScenarioPrompts(
  scenarios: string[]
): Promise<string[]> {
  const scenarioPaths = scenarios.map(
    (scenario) => `mission-generation/scenarios/${scenario}.md`
  );
  return loadMultiplePrompts(scenarioPaths);
}

/**
 * Clear the prompt cache (useful for testing or forcing reload)
 */
export function clearPromptCache(): void {
  promptCache.clear();
}

/**
 * Get cache statistics (for monitoring/debugging)
 */
export function getPromptCacheStats() {
  return {
    size: promptCache.size,
    enabled: ENABLE_CACHE,
    keys: Array.from(promptCache.keys()),
  };
}

/**
 * Pre-load commonly used prompts into cache at startup
 * Call this in your application initialization
 * 
 * @example
 * ```typescript
 * // In your app startup (e.g., instrumentation.ts)
 * await preloadCommonPrompts();
 * ```
 */
export async function preloadCommonPrompts(): Promise<void> {
  if (!ENABLE_CACHE) {
    console.log('[Prompts] Cache disabled, skipping preload');
    return;
  }

  const commonPrompts = [
    // System prompts
    'mission-generation/system-prompt.md',
    'bundle-recommendations/system-prompt.md',
    'email-personalization/system-prompt.md',
    'readiness-assessment/system-prompt.md',
    
    // Shared guidance
    'shared/tone-and-voice.md',
    
    // Common scenarios
    'mission-generation/scenarios/natural-disaster.md',
    'mission-generation/scenarios/emp-grid-down.md',
  ];

  try {
    await Promise.all(commonPrompts.map((path) => loadPrompt(path)));
    console.log(`[Prompts] Preloaded ${commonPrompts.length} common prompts`);
  } catch (error) {
    console.error('[Prompts] Failed to preload prompts:', error);
    // Don't throw - app can still function, just slower first requests
  }
}

/**
 * Validate that all prompts in a directory exist
 * Useful for CI/CD checks
 * 
 * @param dirPath - Directory path relative to /prompts
 * @returns Promise<{valid: boolean, missing: string[]}>
 */
export async function validatePromptsDirectory(
  dirPath: string
): Promise<{ valid: boolean; missing: string[] }> {
  const fullPath = path.join(PROMPTS_DIR, dirPath);
  const missing: string[] = [];

  try {
    const files = await fs.readdir(fullPath, { recursive: true });
    const mdFiles = files.filter((f) => f.toString().endsWith('.md'));

    for (const file of mdFiles) {
      try {
        await loadPrompt(path.join(dirPath, file.toString()));
      } catch {
        missing.push(path.join(dirPath, file.toString()));
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  } catch (error) {
    return {
      valid: false,
      missing: [dirPath],
    };
  }
}

/**
 * Helper type for type-safe prompt paths
 * Add new prompt paths here as you create them
 */
export type PromptPath =
  // Mission Generation
  | 'mission-generation/system-prompt.md'
  | 'mission-generation/supply-calculation.md'
  | 'mission-generation/evacuation-routing.md'
  | 'mission-generation/simulation-log-generation.md'
  | 'mission-generation/scenarios/natural-disaster.md'
  | 'mission-generation/scenarios/emp-grid-down.md'
  | 'mission-generation/scenarios/pandemic.md'
  | 'mission-generation/scenarios/nuclear.md'
  | 'mission-generation/scenarios/civil-unrest.md'
  | 'mission-generation/scenarios/multi-year-sustainability.md'
  
  // Bundle Recommendations
  | 'bundle-recommendations/system-prompt.md'
  | 'bundle-recommendations/scenario-matching.md'
  | 'bundle-recommendations/family-size-optimization.md'
  | 'bundle-recommendations/budget-tier-filtering.md'
  | 'bundle-recommendations/customization-suggestions.md'
  
  // Readiness Assessment
  | 'readiness-assessment/system-prompt.md'
  | 'readiness-assessment/scoring-algorithm.md'
  | 'readiness-assessment/gap-analysis.md'
  | 'readiness-assessment/improvement-recommendations.md'
  
  // Skills Resources
  | 'skills-resources/system-prompt.md'
  | 'skills-resources/resource-curation.md'
  | 'skills-resources/difficulty-assessment.md'
  | 'skills-resources/prerequisite-identification.md'
  
  // Email Personalization
  | 'email-personalization/system-prompt.md'
  | 'email-personalization/newsletter-generation.md'
  | 'email-personalization/scenario-drip-campaigns.md'
  | 'email-personalization/bundle-recommendations.md'
  | 'email-personalization/upgrade-prompts.md'
  
  // Admin Analytics
  | 'admin-analytics/user-insights.md'
  | 'admin-analytics/bundle-performance-analysis.md'
  | 'admin-analytics/product-enrichment.md'
  | 'admin-analytics/content-recommendations.md'
  
  // Shared
  | 'shared/tone-and-voice.md'
  | 'shared/safety-disclaimers.md'
  | 'shared/technical-terminology.md';

/**
 * Type-safe prompt loader
 * Provides autocomplete for prompt paths
 */
export async function loadPromptTyped(promptPath: PromptPath): Promise<string> {
  return loadPrompt(promptPath);
}

