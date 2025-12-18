import { createOpenRouter } from '@openrouter/ai-sdk-provider';

/**
 * OpenRouter Client Configuration
 * Uses Vercel AI SDK with OpenRouter as the provider
 */

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Model selection for mission generation
// Using a capable model for complex, structured outputs
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

/**
 * Create OpenRouter client instance
 * Uses official OpenRouter AI SDK provider
 */
export const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
});

/**
 * Get the model instance for mission generation
 */
export function getMissionGenerationModel() {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  return openrouter(DEFAULT_MODEL);
}

/**
 * Available models for different use cases
 */
export const MODELS = {
  // High-quality models for comprehensive plans
  SONNET: 'anthropic/claude-3.5-sonnet',
  OPUS: 'anthropic/claude-opus-4',

  // Cost-effective alternatives
  HAIKU: 'anthropic/claude-3-haiku',
  GPT4: 'openai/gpt-4-turbo',
  GPT35: 'openai/gpt-3.5-turbo',

  // Google models via OpenRouter
  GEMINI_FLASH: 'google/gemini-flash-1.5',
  GEMINI_PRO: 'google/gemini-pro-1.5',
} as const;

/**
 * Get a specific model by name
 */
export function getModel(modelName: keyof typeof MODELS) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  return openrouter(MODELS[modelName]);
}
