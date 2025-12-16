/**
 * AI Model Configuration Per Feature
 * Centralizes model selection strategy for different AI features
 */

import { MODELS } from '@/lib/openrouter';
import type { AIFeature } from './usage-logger';

export interface ModelConfig {
  primary: string;
  fallbacks: string[];
  temperature: number;
  maxTokens?: number;
}

/**
 * Model selection per feature with fallback chains
 * Optimized for cost vs quality balance per use case
 */
export const FEATURE_MODEL_CONFIG: Record<AIFeature, ModelConfig> = {
  // Mission generation: High complexity, needs quality output
  // Using Claude Sonnet for best results on complex multi-scenario plans
  mission_generation: {
    primary: MODELS.SONNET,
    fallbacks: [MODELS.GPT4, MODELS.HAIKU],
    temperature: 0.7,
    maxTokens: 8000,
  },

  // Bundle recommendations: Medium complexity
  // Can use faster/cheaper model since output is more structured
  bundle_recommendation: {
    primary: MODELS.HAIKU,
    fallbacks: [MODELS.SONNET],
    temperature: 0.5,
    maxTokens: 2000,
  },

  // Readiness suggestions: Medium complexity
  // Structured output, can use cost-effective model
  readiness_suggestion: {
    primary: MODELS.HAIKU,
    fallbacks: [MODELS.SONNET],
    temperature: 0.6,
    maxTokens: 2000,
  },

  // Email personalization: Low complexity, high volume
  // Prioritize speed and cost
  email_personalization: {
    primary: MODELS.HAIKU,
    fallbacks: [],
    temperature: 0.8,
    maxTokens: 1000,
  },

  // Product analysis: Medium complexity (admin feature)
  // Used for categorizing and analyzing products
  product_analysis: {
    primary: MODELS.HAIKU,
    fallbacks: [MODELS.SONNET],
    temperature: 0.3,
    maxTokens: 1500,
  },

  // Mission generation streaming: Same as mission_generation
  // Uses streaming for progressive rendering
  mission_generation_streaming: {
    primary: MODELS.SONNET,
    fallbacks: [MODELS.GPT4, MODELS.HAIKU],
    temperature: 0.7,
    maxTokens: 8000,
  },

  // Emergency contacts: Medium complexity with structured output
  // Analyzes static + Google Places data to recommend contacts
  emergency_contacts: {
    primary: MODELS.HAIKU,
    fallbacks: [MODELS.SONNET],
    temperature: 0.5,
    maxTokens: 2500,
  },
};

/**
 * Get model configuration for a specific feature
 */
export function getModelConfig(feature: AIFeature): ModelConfig {
  return FEATURE_MODEL_CONFIG[feature];
}

/**
 * Get the primary model for a feature
 */
export function getPrimaryModel(feature: AIFeature): string {
  return FEATURE_MODEL_CONFIG[feature].primary;
}

/**
 * Get the fallback chain for a feature
 */
export function getFallbackChain(feature: AIFeature): string[] {
  const config = FEATURE_MODEL_CONFIG[feature];
  return [config.primary, ...config.fallbacks];
}
