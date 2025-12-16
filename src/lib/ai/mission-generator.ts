import { streamText } from 'ai';
import { getMissionGenerationModel, MODELS } from '@/lib/openrouter';
import { buildMegaPrompt, buildUserMessage } from '@/lib/prompts';
import { logAIUsage } from './usage-logger';
import type { WizardFormData } from '@/types/wizard';

/**
 * AI Mission Generator
 * Generates disaster preparedness plans using OpenRouter + Vercel AI SDK
 * Server-side only
 */

// Current model used for mission generation
const MISSION_MODEL = MODELS.SONNET;

export interface MissionPlanResult {
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
}

/**
 * Generate a mission plan using AI
 * Server-side only - uses file system to load prompts
 * @param formData - Wizard form data with scenarios, family, location, etc.
 * @param userId - Optional user ID for logging AI usage and costs
 */
export async function generateMissionPlan(
  formData: WizardFormData,
  userId?: string
): Promise<MissionPlanResult> {
  const startTime = Date.now();

  try {
    // Build the mega prompt from all relevant prompt files
    const systemPrompt = await buildMegaPrompt(formData);
    const userMessage = buildUserMessage(formData);

    // Get the AI model
    const model = getMissionGenerationModel();

    // Generate with streaming
    const result = await streamText({
      model,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature: 0.7,
    });

    // Process the stream
    let fullContent = '';
    for await (const chunk of result.textStream) {
      fullContent += chunk;
    }

    // Get token usage from result
    const usage = await result.usage;
    const durationMs = Date.now() - startTime;

    // Log AI usage if userId is provided
    if (userId) {
      await logAIUsage(
        userId,
        'mission_generation',
        MISSION_MODEL,
        usage?.inputTokens ?? 0,
        usage?.outputTokens ?? 0,
        durationMs,
        { success: true }
      );
    }

    return {
      content: fullContent,
      formData,
      metadata: {
        model: MISSION_MODEL,
        generatedAt: new Date().toISOString(),
        tokensUsed: usage?.totalTokens,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        durationMs,
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log failed AI usage if userId is provided
    if (userId) {
      await logAIUsage(
        userId,
        'mission_generation',
        MISSION_MODEL,
        0,
        0,
        durationMs,
        {
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        }
      );
    }

    console.error('Mission generation error:', error);
    throw error;
  }
}

