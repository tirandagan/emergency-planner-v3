'use server';

/**
 * Server Action for Mission Generation
 * This provides a non-streaming fallback and utility functions
 * For streaming, use the API route at /api/generate-mission
 */

import { streamText } from 'ai';
import { openrouter, MODELS } from '@/lib/openrouter';
import { buildStreamingMegaPrompt, buildStreamingUserMessage, getBudgetAmount } from '@/lib/prompts';
import { getBundlesForScenarios, getAllBundles } from '@/lib/bundles';
import { buildBundleContext, getEnrichedBundleData } from '@/lib/ai/bundle-context';
import { parseReportContent } from '@/lib/mission-generation/markdown-parser';
import { logAIUsage } from '@/lib/ai/usage-logger';
import { saveMissionReportV2 } from '@/lib/ai/save-mission-report-v2';
import type { WizardFormData } from '@/types/wizard';
import type { ReportDataV2 } from '@/types/mission-report';
import { logAiError } from '@/lib/system-logger';

// Model for mission generation
const MISSION_MODEL = MODELS.SONNET;

export interface MissionGenerationInput {
  formData: WizardFormData;
  mobility: 'BUG_IN' | 'BUG_OUT';
  userId: string;
  userTier?: string;
}

export interface MissionGenerationResult {
  success: boolean;
  reportId?: string;
  content?: string;
  error?: string;
}

/**
 * Generate a mission plan (non-streaming version)
 * Use this as a fallback or for batch processing
 */
export async function generateMissionPlanNonStreaming(
  input: MissionGenerationInput
): Promise<MissionGenerationResult> {
  const { formData, mobility, userId, userTier = 'FREE' } = input;
  const startTime = Date.now();

  try {
    // Step 1: Pre-filter bundles for this scenario
    const budgetAmount = getBudgetAmount(formData.budgetTier);
    let bundles = await getBundlesForScenarios({
      scenarios: formData.scenarios,
      familySize: formData.familyMembers.length,
      maxPrice: budgetAmount * 2,
      limit: 10,
    });

    // Fallback: get any bundles if no matches
    if (bundles.length === 0) {
      bundles = await getAllBundles(10);
    }

    // Step 2: Build bundle context for LLM
    const bundleContext = await buildBundleContext(bundles);

    // Step 3: Build system prompt with includes
    const systemPrompt = await buildStreamingMegaPrompt(formData, bundleContext);

    // Step 4: Build user message
    const userMessage = buildStreamingUserMessage(formData, mobility);

    // Step 5: Get AI model and generate
    const model = openrouter(MISSION_MODEL);

    let fullContent = '';
    const { textStream, usage } = await streamText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.7,
    });

    // Collect full content
    for await (const delta of textStream) {
      fullContent += delta;
    }

    // Step 6: Parse the completed content
    const sections = parseReportContent(fullContent);

    // Step 7: Enrich bundle data from database
    const bundleIds = sections.bundles.map(b => b.bundleId);
    const enrichedBundles = await getEnrichedBundleData(bundleIds);

    // Merge enriched data back into sections
    for (const bundle of sections.bundles) {
      const enriched = enrichedBundles.find(e => e.id === bundle.bundleId);
      if (enriched) {
        bundle.bundleSlug = enriched.slug;
        bundle.bundleImageUrl = enriched.imageUrl || undefined;
        bundle.itemCount = enriched.itemCount;
        bundle.scenarios = enriched.scenarios;
      }
    }

    // Step 8: Build complete report data
    const usageData = await usage;
    const durationMs = Date.now() - startTime;

    const reportData: ReportDataV2 = {
      version: '2.0',
      generatedWith: 'streaming_bundles',
      content: fullContent,
      sections,
      formData,
      metadata: {
        model: MISSION_MODEL,
        streamDurationMs: durationMs,
        generatedAt: new Date().toISOString(),
        tokensUsed: usageData?.totalTokens,
        inputTokens: usageData?.inputTokens,
        outputTokens: usageData?.outputTokens,
      },
    };

    // Step 9: Save to database
    const { reportId } = await saveMissionReportV2({
      userId,
      reportData,
      userTier,
    });

    // Step 10: Log AI usage
    await logAIUsage(
      userId,
      'mission_generation_streaming',
      MISSION_MODEL,
      usageData?.inputTokens ?? 0,
      usageData?.outputTokens ?? 0,
      durationMs,
      { success: true }
    );

    return {
      success: true,
      reportId,
      content: fullContent,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Log failed usage
    await logAIUsage(
      userId,
      'mission_generation_streaming',
      MISSION_MODEL,
      0,
      0,
      durationMs,
      {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    );

    await logAiError(error, {
      model: MISSION_MODEL,
      userId,
      userAction: 'Generating streaming mission plan',
      component: 'MissionGenerationStreaming',
      route: '/app/actions/generate-mission-streaming',
      requestData: {
        scenarios: formData.scenarios,
        location: formData.location,
        familySize: formData.familyMembers.length,
        mobility,
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

/**
 * Extract report ID from completed stream content
 */
export function extractReportIdFromContent(content: string): string | null {
  const match = content.match(/<!-- REPORT_ID:([a-f0-9-]+) -->/);
  return match ? match[1] : null;
}
