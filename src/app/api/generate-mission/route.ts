import { NextRequest, NextResponse } from 'next/server';
import { streamText, createTextStreamResponse } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { openrouter, MODELS } from '@/lib/openrouter';
import { buildStreamingMegaPrompt, buildStreamingUserMessage } from '@/lib/prompts';
import { getBundlesForScenarios, getAllBundles } from '@/lib/bundles';
import { buildBundleContext } from '@/lib/ai/bundle-context';
import type { WizardFormData } from '@/types/wizard';

// Model for mission generation
const MISSION_MODEL = MODELS.SONNET;

export interface StreamingMissionRequest {
  formData: WizardFormData;
  mobility: 'BUG_IN' | 'BUG_OUT';
}

/**
 * POST /api/generate-mission
 * Streaming mission generation endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as StreamingMissionRequest;
    const { formData, mobility } = body;

    if (!formData || !formData.scenarios || formData.scenarios.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: formData with scenarios required' },
        { status: 400 }
      );
    }

    // Step 1: Pre-filter bundles for this scenario
    let bundles = await getBundlesForScenarios({
      scenarios: formData.scenarios,
      familySize: formData.familyMembers.length,
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

    // Step 5: Get AI model
    const model = openrouter(MISSION_MODEL);

    // Step 6: Stream generation
    const result = await streamText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      temperature: 0.7,
    });

    // Return streaming response
    return createTextStreamResponse({
      textStream: result.textStream,
      headers: {
        'X-User-Id': user.id,
        'X-Model': MISSION_MODEL,
      },
    });
  } catch (error) {
    console.error('Streaming mission generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
