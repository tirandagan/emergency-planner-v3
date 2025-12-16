# Prompt System Implementation Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install ai @ai-sdk/google
```

### 2. Set Environment Variables

```bash
# .env.local
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

### 3. Import and Use

```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { loadPrompt } from '@/lib/prompts/loader';

const systemPrompt = await loadPrompt('mission-generation/system-prompt.md');

const { text } = await generateText({
  model: google('gemini-2.0-flash-exp'),
  system: systemPrompt,
  prompt: 'Your user prompt here',
});
```

---

## Complete Integration Examples

### Mission Report Generation (Server Action)

```typescript
// app/actions/generate-mission-report.ts
'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { loadPrompt, loadScenarioPrompts } from '@/lib/prompts/loader';
import { db } from '@/db';
import { missionReports } from '@/db/schema';

export async function generateMissionReport(input: {
  userId: string;
  scenarios: string[];
  familySize: number;
  location: string;
  duration: number;
  budgetTier: string;
}) {
  try {
    // Load prompts in parallel
    const [systemPrompt, scenarioPrompts] = await Promise.all([
      loadPrompt('mission-generation/system-prompt.md'),
      loadScenarioPrompts(input.scenarios),
    ]);

    // Combine scenario guidance
    const scenarioContext = scenarioPrompts.join('\n\n---\n\n');

    // Generate with Gemini
    const { text } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      prompt: `
        ${scenarioContext}
        
        Generate a comprehensive disaster preparedness plan:
        
        Scenarios: ${input.scenarios.join(', ')}
        Family Size: ${input.familySize} people
        Location: ${input.location}
        Duration: ${input.duration} days
        Budget: ${input.budgetTier}
        
        Provide specific quantities, phased priorities, and actionable steps.
      `,
      temperature: 0.7,
      maxTokens: 6000,
    });

    // Save to database
    const [report] = await db
      .insert(missionReports)
      .values({
        userId: input.userId,
        title: `${input.scenarios.join(' + ')} Plan`,
        scenarios: input.scenarios,
        familySize: input.familySize,
        location: input.location,
        durationDays: input.duration,
        reportData: { generatedPlan: text },
      })
      .returning();

    return { success: true, reportId: report.id };
  } catch (error) {
    console.error('[Mission Generation] Error:', error);
    return { success: false, error: 'Failed to generate mission report' };
  }
}
```

### Bundle Recommendations (Server Action)

```typescript
// app/actions/recommend-bundles.ts
'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { loadPrompt } from '@/lib/prompts/loader';
import { db } from '@/db';
import { bundles } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export async function recommendBundles(input: {
  scenarios: string[];
  familySize: number;
  budgetTier: string;
  location: string;
}) {
  try {
    // Get bundles matching scenarios
    const matchingBundles = await db
      .select()
      .from(bundles)
      .where(inArray(bundles.scenarios, input.scenarios));

    // Load prompts
    const [systemPrompt, matchingPrompt] = await Promise.all([
      loadPrompt('bundle-recommendations/system-prompt.md'),
      loadPrompt('bundle-recommendations/scenario-matching.md'),
    ]);

    // Ask AI to rank and recommend
    const { text } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      prompt: `
        ${matchingPrompt}
        
        Available bundles (JSON):
        ${JSON.stringify(matchingBundles, null, 2)}
        
        User context:
        - Scenarios: ${input.scenarios.join(', ')}
        - Family: ${input.familySize} people
        - Budget: ${input.budgetTier}
        - Location: ${input.location}
        
        Recommend top 3-5 bundles with explanations.
        Return JSON array: [{ bundleId, reason, priority, benefits }]
      `,
      temperature: 0.6,
      maxTokens: 2000,
    });

    const recommendations = JSON.parse(text);
    return { success: true, recommendations };
  } catch (error) {
    console.error('[Bundle Recommendations] Error:', error);
    return { success: false, error: 'Failed to generate recommendations' };
  }
}
```

### Personalized Email Generation (Background Job)

```typescript
// lib/email/generate-personalized.ts
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { loadPrompt, loadPromptWithVariables } from '@/lib/prompts/loader';
import { resend } from './resend-client';
import { render } from '@react-email/render';
import NewsletterEmail from '@/emails/templates/newsletter';

export async function sendPersonalizedNewsletter(user: {
  id: string;
  name: string;
  email: string;
  tier: string;
  readinessScore: number;
  location: string;
  scenarios: string[];
}) {
  try {
    // Load email prompts
    const [systemPrompt, newsletterPrompt] = await Promise.all([
      loadPrompt('email-personalization/system-prompt.md'),
      loadPromptWithVariables('email-personalization/newsletter-generation.md', {
        user_name: user.name,
        user_tier: user.tier,
        readiness_score: user.readinessScore.toString(),
        location: user.location,
      }),
    ]);

    // Generate personalized content
    const { text: personalizedContent } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      prompt: newsletterPrompt,
      temperature: 0.8,
      maxTokens: 1500,
    });

    // Render React Email template
    const emailHtml = render(
      NewsletterEmail({
        userName: user.name,
        personalizedContent,
        tier: user.tier,
      })
    );

    // Send via Resend
    await resend.emails.send({
      from: 'Emergency Planner <newsletter@emergencyplanner.com>',
      to: user.email,
      subject: `${user.name}, Your Weekly Preparedness Update`,
      html: emailHtml,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email Generation] Error:', error);
    return { success: false, error: String(error) };
  }
}
```

### Readiness Assessment (Server Action)

```typescript
// app/actions/assess-readiness.ts
'use server';

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { loadPrompt } from '@/lib/prompts/loader';
import { db } from '@/db';
import { inventoryItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function assessReadiness(userId: string) {
  try {
    // Get user's inventory
    const inventory = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.userId, userId));

    const owned = inventory.filter((i) => i.status === 'OWNED');
    const needed = inventory.filter((i) => i.status === 'NEEDED');

    // Load assessment prompts
    const [systemPrompt, gapPrompt, recommendPrompt] = await Promise.all([
      loadPrompt('readiness-assessment/system-prompt.md'),
      loadPrompt('readiness-assessment/gap-analysis.md'),
      loadPrompt('readiness-assessment/improvement-recommendations.md'),
    ]);

    // Generate assessment
    const { text } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      prompt: `
        ${gapPrompt}
        ${recommendPrompt}
        
        User Inventory:
        - Owned: ${owned.length} items
        - Needed: ${needed.length} items
        
        Owned Items: ${owned.map((i) => i.masterItemId).join(', ')}
        Needed Items: ${needed.map((i) => i.masterItemId).join(', ')}
        
        Calculate readiness score (0-100) and provide:
        1. Overall score
        2. Category breakdown
        3. Top 3 critical gaps
        4. 5 prioritized recommendations
        
        Return as JSON.
      `,
      temperature: 0.5,
      maxTokens: 2000,
    });

    const assessment = JSON.parse(text);
    return { success: true, assessment };
  } catch (error) {
    console.error('[Readiness Assessment] Error:', error);
    return { success: false, error: 'Failed to assess readiness' };
  }
}
```

---

## Streaming for Real-Time UI

### Server Action with Streaming

```typescript
// app/actions/stream-mission-report.ts
'use server';

import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { loadPrompt } from '@/lib/prompts/loader';
import { createStreamableValue } from 'ai/rsc';

export async function streamMissionReport(input: {
  scenarios: string[];
  familySize: number;
  location: string;
}) {
  const systemPrompt = await loadPrompt('mission-generation/system-prompt.md');

  const { textStream } = await streamText({
    model: google('gemini-2.0-flash-exp'),
    system: systemPrompt,
    prompt: `
      Generate disaster preparedness plan for:
      - Scenarios: ${input.scenarios.join(', ')}
      - Family: ${input.familySize} people
      - Location: ${input.location}
    `,
    temperature: 0.7,
  });

  // Create streamable value for client
  const stream = createStreamableValue('');

  (async () => {
    for await (const chunk of textStream) {
      stream.update(chunk);
    }
    stream.done();
  })();

  return { stream: stream.value };
}
```

### Client Component

```typescript
// app/plans/new/generate-button.tsx
'use client';

import { streamMissionReport } from '@/app/actions/stream-mission-report';
import { readStreamableValue } from 'ai/rsc';
import { useState } from 'react';

export function GenerateButton({ scenarios, familySize, location }) {
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setGeneratedText('');

    const { stream } = await streamMissionReport({
      scenarios,
      familySize,
      location,
    });

    // Read stream and update UI in real-time
    for await (const chunk of readStreamableValue(stream)) {
      setGeneratedText((prev) => prev + chunk);
    }

    setIsGenerating(false);
  }

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Plan'}
      </button>
      {generatedText && (
        <div className="prose">
          <pre>{generatedText}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## Error Handling Best Practices

### Graceful Fallbacks

```typescript
// lib/ai/generate-with-fallback.ts
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { loadPrompt } from '@/lib/prompts/loader';

export async function generateWithFallback(
  systemPromptPath: string,
  userPrompt: string
) {
  try {
    // Try primary model
    const systemPrompt = await loadPrompt(systemPromptPath);

    const { text } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    return { text, model: 'gemini-flash' };
  } catch (error) {
    console.error('[AI] Primary generation failed:', error);

    try {
      // Fallback to simpler prompt
      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        prompt: userPrompt,
        temperature: 0.7,
      });

      return { text, model: 'gemini-flash-fallback' };
    } catch (fallbackError) {
      console.error('[AI] Fallback also failed:', fallbackError);
      throw new Error('AI generation unavailable. Please try again later.');
    }
  }
}
```

### User-Friendly Error Messages

```typescript
// app/actions/generate-mission-report.ts
export async function generateMissionReport(input: MissionInput) {
  try {
    // ... generation logic
  } catch (error) {
    if (error instanceof Error && error.message.includes('API key')) {
      return {
        success: false,
        error: 'Configuration error. Please contact support.',
      };
    }

    if (error instanceof Error && error.message.includes('quota')) {
      return {
        success: false,
        error:
          'Service temporarily unavailable due to high demand. Please try again in a few minutes.',
      };
    }

    return {
      success: false,
      error: 'Failed to generate plan. Please try again.',
    };
  }
}
```

---

## Performance Optimization

### Prompt Caching

```typescript
// lib/prompts/loader.ts already implements caching
// In production, prompts are cached in memory after first load
// In development, cache is disabled for hot-reloading

// Pre-load common prompts at app startup
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { preloadCommonPrompts } = await import('@/lib/prompts/loader');
    await preloadCommonPrompts();
  }
}
```

### Parallel Prompt Loading

```typescript
// Load multiple prompts simultaneously
const [systemPrompt, scenario1, scenario2, sharedGuidance] = await Promise.all([
  loadPrompt('mission-generation/system-prompt.md'),
  loadPrompt('mission-generation/scenarios/natural-disaster.md'),
  loadPrompt('mission-generation/scenarios/emp-grid-down.md'),
  loadPrompt('shared/tone-and-voice.md'),
]);
```

### AI Response Caching

```typescript
// Cache AI responses for identical inputs
import { cache } from 'react';

export const getCachedBundleRecommendations = cache(
  async (scenarios: string[], familySize: number) => {
    // ... AI generation logic
    return recommendations;
  }
);
```

---

## Testing

### Unit Tests for Prompt Loading

```typescript
// __tests__/lib/prompts/loader.test.ts
import { describe, it, expect } from 'vitest';
import { loadPrompt, loadPromptWithVariables } from '@/lib/prompts/loader';

describe('Prompt Loader', () => {
  it('should load a prompt file', async () => {
    const prompt = await loadPrompt('mission-generation/system-prompt.md');
    expect(prompt).toBeTruthy();
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('should replace variables', async () => {
    const prompt = await loadPromptWithVariables(
      'mission-generation/supply-calculation.md',
      {
        family_size: '4',
        location: 'Seattle',
      }
    );

    expect(prompt).not.toContain('{{family_size}}');
    expect(prompt).not.toContain('{{location}}');
    expect(prompt).toContain('4');
    expect(prompt).toContain('Seattle');
  });

  it('should throw error for missing file', async () => {
    await expect(loadPrompt('nonexistent.md')).rejects.toThrow();
  });
});
```

### Integration Tests for AI Generation

```typescript
// __tests__/app/actions/generate-mission-report.test.ts
import { describe, it, expect, vi } from 'vitest';
import { generateMissionReport } from '@/app/actions/generate-mission-report';

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'Mock generated plan',
  }),
}));

describe('Mission Report Generation', () => {
  it('should generate a mission report', async () => {
    const result = await generateMissionReport({
      userId: 'test-user',
      scenarios: ['natural-disaster'],
      familySize: 4,
      location: 'Seattle, WA',
      duration: 7,
      budgetTier: 'moderate',
    });

    expect(result.success).toBe(true);
    expect(result.reportId).toBeTruthy();
  });
});
```

---

## Monitoring & Debugging

### Add Logging

```typescript
// lib/ai/generate-text-with-logging.ts
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export async function generateTextWithLogging(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  feature: string
) {
  const startTime = Date.now();

  try {
    const { text, usage } = await generateText({
      model: google(model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    const duration = Date.now() - startTime;

    // Log to analytics
    console.log('[AI Generation]', {
      feature,
      model,
      duration,
      inputTokens: usage?.promptTokens,
      outputTokens: usage?.completionTokens,
      success: true,
    });

    // Optional: Save to database for analytics
    // await logAIUsage({ feature, model, duration, usage });

    return { text, usage };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('[AI Generation] Error:', {
      feature,
      model,
      duration,
      error: String(error),
    });

    throw error;
  }
}
```

---

## Common Patterns

### Pattern 1: Multi-Step Generation

```typescript
// Generate plan in phases
async function generateComprehensivePlan(input: PlanInput) {
  // Step 1: Generate overview
  const overview = await generateText({
    model: google('gemini-2.0-flash-exp'),
    system: await loadPrompt('mission-generation/system-prompt.md'),
    prompt: `Generate overview for ${input.scenarios.join(', ')}`,
  });

  // Step 2: Generate supply list based on overview
  const supplies = await generateText({
    model: google('gemini-2.0-flash-exp'),
    prompt: `Based on this overview: ${overview.text}\n\nGenerate detailed supply list`,
  });

  // Step 3: Generate timeline
  const timeline = await generateText({
    model: google('gemini-2.0-flash-exp'),
    prompt: `Create implementation timeline for: ${supplies.text}`,
  });

  return { overview: overview.text, supplies: supplies.text, timeline: timeline.text };
}
```

### Pattern 2: Prompt Composition

```typescript
// Combine multiple prompts for complex tasks
async function generateWithMultiplePrompts(input: Input) {
  const [systemPrompt, toneGuidance, safetyDisclaimers] = await Promise.all([
    loadPrompt('mission-generation/system-prompt.md'),
    loadPrompt('shared/tone-and-voice.md'),
    loadPrompt('shared/safety-disclaimers.md'),
  ]);

  const combinedSystem = `
${systemPrompt}

${toneGuidance}

${safetyDisclaimers}
  `.trim();

  return await generateText({
    model: google('gemini-2.0-flash-exp'),
    system: combinedSystem,
    prompt: input.userPrompt,
  });
}
```

---

## Next Steps

1. **Start Small:** Begin with one feature (mission generation)
2. **Test Thoroughly:** Verify outputs match expectations
3. **Iterate Prompts:** Refine based on actual results
4. **Monitor Usage:** Track token usage and costs
5. **Expand Gradually:** Add more features as confidence grows

## Getting Help

- **Prompt Issues:** Check prompt file syntax and variables
- **AI Errors:** Verify API key and quota limits
- **Performance:** Review caching and parallel loading
- **Quality:** Iterate prompts based on output quality

---

**Ready to implement!** Start with the examples above and adapt to your specific needs.

