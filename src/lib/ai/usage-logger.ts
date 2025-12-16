/**
 * AI Usage Logger
 * Logs AI model usage to user_activity_log for cost tracking and monitoring
 */

import { db } from '@/db';
import { userActivityLog } from '@/db/schema/analytics';

// Model costs per 1M tokens (from OpenRouter pricing as of Dec 2024)
// https://openrouter.ai/docs#models
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // Google Gemini models
  'google/gemini-2.5-flash-preview-05-20': { input: 0.15, output: 0.60 },
  'google/gemini-2.0-flash-exp': { input: 0.10, output: 0.40 },
  'google/gemini-2.0-flash-lite-001': { input: 0.075, output: 0.30 },

  // Anthropic Claude models
  'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'anthropic/claude-opus-4': { input: 15.00, output: 75.00 },

  // OpenAI models
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  'openai/gpt-4-turbo': { input: 10.00, output: 30.00 },
  'openai/gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};

export type AIFeature =
  | 'mission_generation'
  | 'mission_generation_streaming'
  | 'bundle_recommendation'
  | 'readiness_suggestion'
  | 'email_personalization'
  | 'product_analysis'
  | 'emergency_contacts';

export interface AIUsageMetadata {
  feature: AIFeature;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  durationMs: number;
  success: boolean;
  errorMessage?: string;
  fallbackUsed?: boolean;
  originalModel?: string;
}

/**
 * Calculate the estimated cost for AI usage based on model and token counts
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model];
  if (!costs) {
    console.warn(`Unknown model for cost calculation: ${model}`);
    return 0;
  }

  // Cost is per 1M tokens, so divide by 1,000,000
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}

/**
 * Log AI usage to user_activity_log table
 */
export async function logAIUsage(
  userId: string,
  feature: AIFeature,
  model: string,
  inputTokens: number,
  outputTokens: number,
  durationMs: number,
  options?: {
    success?: boolean;
    errorMessage?: string;
    fallbackUsed?: boolean;
    originalModel?: string;
  }
): Promise<void> {
  const metadata: AIUsageMetadata = {
    feature,
    model,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCostUsd: calculateCost(model, inputTokens, outputTokens),
    durationMs,
    success: options?.success ?? true,
    errorMessage: options?.errorMessage,
    fallbackUsed: options?.fallbackUsed,
    originalModel: options?.originalModel,
  };

  try {
    await db.insert(userActivityLog).values({
      userId,
      activityType: 'ai_usage',
      metadata,
    });
  } catch (error) {
    // Log error but don't throw - usage logging should not break the main flow
    console.error('Failed to log AI usage:', error);
  }
}

/**
 * Get the cost info for a model (for display purposes)
 */
export function getModelCostInfo(model: string): { input: number; output: number } | null {
  return MODEL_COSTS[model] ?? null;
}
