/**
 * Prompt System Integration Examples
 * 
 * This file demonstrates how to use the prompt loading system
 * with Vercel AI SDK for various features.
 */

import { generateText, streamText } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import {
  loadPrompt,
  loadPromptWithVariables,
  loadScenarioPrompts,
  loadMultiplePrompts,
} from './loader';

/**
 * Example 1: Simple Mission Report Generation
 * 
 * Generate a basic mission report using system prompt + user input
 */
export async function generateBasicMissionReport(input: {
  scenarios: string[];
  familySize: number;
  location: string;
  duration: number;
}) {
  // Load system prompt
  const systemPrompt = await loadPrompt(
    'mission-generation/system-prompt.md'
  );

  // Generate with Vercel AI SDK
  const { text } = await generateText({
    model: openrouter('google/gemini-2.0-flash-exp:free'),
    system: systemPrompt,
    prompt: `
      Generate a disaster preparedness plan for:
      - Scenarios: ${input.scenarios.join(', ')}
      - Family Size: ${input.familySize} people
      - Location: ${input.location}
      - Duration: ${input.duration} days

      Provide a comprehensive plan with specific quantities and actionable steps.
    `,
    temperature: 0.7,
  });

  return text;
}

/**
 * Example 2: Advanced Mission Report with Scenario Prompts
 * 
 * Load multiple scenario-specific prompts and combine them
 */
export async function generateAdvancedMissionReport(input: {
  scenarios: string[];
  familySize: number;
  location: string;
  duration: number;
  budgetTier: string;
  medicalConditions?: string[];
}) {
  // Load system prompt and scenario prompts in parallel
  const [systemPrompt, scenarioPrompts] = await Promise.all([
    loadPrompt('mission-generation/system-prompt.md'),
    loadScenarioPrompts(input.scenarios),
  ]);

  // Combine scenario prompts
  const scenarioGuidance = scenarioPrompts.join('\n\n---\n\n');

  // Generate with full context
  const { text } = await generateText({
    model: openrouter('google/gemini-2.0-flash-exp:free'),
    system: systemPrompt,
    prompt: `
      ${scenarioGuidance}
      
      Generate a comprehensive disaster preparedness plan:
      
      **User Context:**
      - Scenarios: ${input.scenarios.join(', ')}
      - Family Size: ${input.familySize} people
      - Location: ${input.location}
      - Duration: ${input.duration} days
      - Budget: ${input.budgetTier}
      - Medical Needs: ${input.medicalConditions?.join(', ') || 'None'}
      
      Follow the scenario-specific guidance above to create a detailed,
      actionable plan with exact quantities and phased priorities.
    `,
    temperature: 0.7,
  });

  return text;
}

/**
 * Example 3: Prompt with Variable Substitution
 * 
 * Load a prompt with placeholders and replace them with actual values
 */
export async function generateSupplyCalculations(input: {
  familySize: number;
  location: string;
  duration: number;
  scenario: string;
}) {
  // Load prompt with variable substitution
  const supplyPrompt = await loadPromptWithVariables(
    'mission-generation/supply-calculation.md',
    {
      family_size: input.familySize,
      location: input.location,
      duration: input.duration,
      scenario: input.scenario,
    }
  );

  const { text } = await generateText({
    model: openrouter('google/gemini-2.0-flash-exp:free'),
    prompt: supplyPrompt,
    temperature: 0.5, // Lower temperature for calculations
  });

  return text;
}

/**
 * Example 4: Bundle Recommendations with AI
 * 
 * Use bundle recommendation prompts to match users with appropriate bundles
 */
export async function generateBundleRecommendations(input: {
  scenarios: string[];
  familySize: number;
  budgetTier: string;
  location: string;
  existingGaps: string[];
}) {
  const [systemPrompt, matchingPrompt] = await loadMultiplePrompts([
    'bundle-recommendations/system-prompt.md',
    'bundle-recommendations/scenario-matching.md',
  ]);

  const { text } = await generateText({
    model: openrouter('google/gemini-2.0-flash-exp:free'),
    system: systemPrompt,
    prompt: `
      ${matchingPrompt}
      
      Recommend bundles for this user:
      - Scenarios: ${input.scenarios.join(', ')}
      - Family: ${input.familySize} people
      - Budget: ${input.budgetTier}
      - Location: ${input.location}
      - Current Gaps: ${input.existingGaps.join(', ')}
      
      Provide 3-5 bundle recommendations with clear explanations.
      Format as JSON array with: bundleId, reason, priority, estimatedCost
    `,
    temperature: 0.6,
  });

  return text;
}

/**
 * Example 5: Personalized Email Generation
 * 
 * Generate personalized email content using user data
 */
export async function generatePersonalizedEmail(input: {
  emailType: 'newsletter' | 'bundle-recommendation' | 'upgrade-prompt';
  userName: string;
  userTier: string;
  readinessScore: number;
  location: string;
  scenarios: string[];
  lastActive: Date;
}) {
  // Map email type to prompt file
  const promptMap = {
    newsletter: 'email-personalization/newsletter-generation.md',
    'bundle-recommendation': 'email-personalization/bundle-recommendations.md',
    'upgrade-prompt': 'email-personalization/upgrade-prompts.md',
  };

  const [systemPrompt, emailPrompt] = await loadMultiplePrompts([
    'email-personalization/system-prompt.md',
    promptMap[input.emailType],
  ]);

  const { text } = await generateText({
    model: openrouter('google/gemini-2.0-flash-exp:free'),
    system: systemPrompt,
    prompt: `
      ${emailPrompt}
      
      Generate personalized email content:
      - User: ${input.userName}
      - Tier: ${input.userTier}
      - Readiness: ${input.readinessScore}%
      - Location: ${input.location}
      - Scenarios: ${input.scenarios.join(', ')}
      - Last Active: ${input.lastActive.toLocaleDateString()}
      
      Create engaging, helpful email content that provides value first.
      Return only the email body (no subject line).
    `,
    temperature: 0.8, // Higher for creative writing
  });

  return text;
}

/**
 * Example 6: Streaming Response for Real-Time UI
 * 
 * Stream AI responses for better UX during long generation
 */
export async function streamMissionReportGeneration(input: {
  scenarios: string[];
  familySize: number;
  location: string;
}) {
  const systemPrompt = await loadPrompt(
    'mission-generation/system-prompt.md'
  );

  // Return stream for client to consume
  const { textStream } = await streamText({
    model: openrouter('google/gemini-2.0-flash-exp:free'),
    system: systemPrompt,
    prompt: `
      Generate a disaster preparedness plan for:
      - Scenarios: ${input.scenarios.join(', ')}
      - Family Size: ${input.familySize} people
      - Location: ${input.location}
    `,
    temperature: 0.7,
  });

  return textStream;
}

/**
 * Example 7: Readiness Assessment with Gap Analysis
 * 
 * Analyze user's current preparedness and identify gaps
 */
export async function assessReadiness(input: {
  ownedItems: string[];
  neededItems: string[];
  scenarios: string[];
  familySize: number;
}) {
  const [systemPrompt, gapAnalysisPrompt, recommendationsPrompt] =
    await loadMultiplePrompts([
      'readiness-assessment/system-prompt.md',
      'readiness-assessment/gap-analysis.md',
      'readiness-assessment/improvement-recommendations.md',
    ]);

  const { text } = await generateText({
    model: openrouter('google/gemini-2.0-flash-exp:free'),
    system: systemPrompt,
    prompt: `
      ${gapAnalysisPrompt}
      
      ${recommendationsPrompt}
      
      Assess readiness for this user:
      - Owned Items: ${input.ownedItems.length}
      - Needed Items: ${input.neededItems.length}
      - Scenarios: ${input.scenarios.join(', ')}
      - Family Size: ${input.familySize}
      
      Owned: ${input.ownedItems.join(', ')}
      Still Need: ${input.neededItems.join(', ')}
      
      Provide:
      1. Overall readiness score (0-100)
      2. Top 3 critical gaps
      3. 5 actionable next steps prioritized by impact
      
      Format as JSON.
    `,
    temperature: 0.5,
  });

  return JSON.parse(text);
}

/**
 * Example 8: Skills Resource Curation
 * 
 * Use AI to curate and assess skills training resources
 */
export async function curateSkillsResources(input: {
  skillName: string;
  scenario: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  rawResources: Array<{ title: string; url: string; description: string }>;
}) {
  const [systemPrompt, curationPrompt] = await loadMultiplePrompts([
    'skills-resources/system-prompt.md',
    'skills-resources/resource-curation.md',
  ]);

  const { text } = await generateText({
    model: openrouter('google/gemini-2.0-flash-exp:free'),
    system: systemPrompt,
    prompt: `
      ${curationPrompt}
      
      Curate and assess these ${input.skillName} training resources:
      
      ${input.rawResources
        .map(
          (r, i) => `
        ${i + 1}. ${r.title}
           URL: ${r.url}
           Description: ${r.description}
      `
        )
        .join('\n')}
      
      Scenario: ${input.scenario}
      Target Level: ${input.difficultyLevel}
      
      For each resource, provide:
      - Quality rating (1-5)
      - Relevance to scenario (1-5)
      - Actual difficulty level
      - Key techniques covered
      - Recommended prerequisites
      
      Format as JSON array.
    `,
    temperature: 0.4,
  });

  return JSON.parse(text);
}

/**
 * Example 9: Multi-Model Comparison
 * 
 * Test different models with same prompt for quality comparison
 */
export async function compareModels(prompt: string, systemPrompt: string) {
  const models = [
    openrouter('google/gemini-2.0-flash-exp:free'),
    openrouter('google/gemini-pro-1.5'),
    // Add other models as needed
  ];

  const results = await Promise.all(
    models.map(async (model) => {
      const { text, usage } = await generateText({
        model,
        system: systemPrompt,
        prompt,
        temperature: 0.7,
      });

      return {
        model: model.modelId,
        text,
        usage,
      };
    })
  );

  return results;
}

/**
 * Example 10: Error Handling and Fallbacks
 * 
 * Proper error handling when prompts or AI calls fail
 */
export async function generateWithFallback(input: { prompt: string }) {
  try {
    // Try to load system prompt
    const systemPrompt = await loadPrompt(
      'mission-generation/system-prompt.md'
    );

    // Try primary model (Gemini Flash)
    const { text } = await generateText({
      model: openrouter('google/gemini-2.0-flash-exp:free'),
      system: systemPrompt,
      prompt: input.prompt,
      temperature: 0.7,
    });

    return { text, source: 'gemini-flash' };
  } catch (error) {
    console.error('[AI Generation] Primary method failed:', error);

    try {
      // Fallback to simpler prompt without system context
      const { text } = await generateText({
        model: openrouter('google/gemini-flash-1.5'),
        prompt: input.prompt,
        temperature: 0.7,
      });

      return { text, source: 'gemini-flash-fallback' };
    } catch (fallbackError) {
      console.error('[AI Generation] Fallback also failed:', fallbackError);
      throw new Error(
        'AI generation failed. Please try again later or contact support.'
      );
    }
  }
}

