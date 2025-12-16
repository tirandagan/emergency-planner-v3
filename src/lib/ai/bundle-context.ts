import { generateText } from 'ai';
import { openrouter, MODELS } from '@/lib/openrouter';
import type { BundleCandidate, BundleWithItems } from '@/lib/bundles';
import { getBundleWithItems } from '@/lib/bundles';

/**
 * Bundle Context Builder
 * Formats bundle data for LLM consumption in mission generation
 */

export interface BundleContextItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  itemCount: number;
  scenarios: string[];
  peopleRange: string;
}

/**
 * Format bundles for inclusion in LLM prompt
 * Ensures all bundles have descriptions and are properly formatted
 */
export async function buildBundleContext(
  bundles: BundleCandidate[]
): Promise<string> {
  if (bundles.length === 0) {
    return 'No bundles available for recommendation. Acknowledge this gap and suggest the user browse the catalog manually.';
  }

  const formattedBundles = await Promise.all(
    bundles.map(async (bundle, index) => {
      // Generate description if missing
      let description = bundle.description;
      if (!description || description.trim().length < 20) {
        description = await generateBundleDescription(bundle.id);
      }

      const price = bundle.totalEstimatedPrice
        ? parseFloat(bundle.totalEstimatedPrice)
        : 0;

      const peopleRange = formatPeopleRange(bundle.minPeople, bundle.maxPeople);
      const scenarioList = bundle.scenarios
        .map(s => s.replace(/_/g, ' ').toLowerCase())
        .join(', ');

      return `### Bundle ${index + 1}: ${bundle.name}
**Bundle ID:** ${bundle.id}
**Slug:** ${bundle.slug}
**Price:** $${price.toFixed(2)}
**Items Included:** ${bundle.itemCount}
**People Range:** ${peopleRange}
**Scenarios:** ${scenarioList}

**Description:**
${description || 'Comprehensive emergency preparedness bundle.'}
`;
    })
  );

  return `The following bundles are available for recommendation. ONLY use bundle IDs from this list.

${formattedBundles.join('\n---\n\n')}

IMPORTANT:
- Use the exact Bundle ID when recommending bundles
- Do not invent or modify bundle IDs
- If fewer than 3 suitable bundles exist, recommend fewer bundles`;
}

/**
 * Format people range as a readable string
 */
function formatPeopleRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Any size';
  if (min === null) return `Up to ${max} people`;
  if (max === null) return `${min}+ people`;
  if (min === max) return `${min} people`;
  return `${min}-${max} people`;
}

/**
 * Generate a description for a bundle based on its items
 * Uses AI to create a meaningful description
 */
export async function generateBundleDescription(
  bundleId: string
): Promise<string> {
  try {
    const bundle = await getBundleWithItems(bundleId);
    if (!bundle) {
      return 'Emergency preparedness bundle with essential supplies.';
    }

    // If bundle already has a good description, return it
    if (bundle.description && bundle.description.trim().length >= 20) {
      return bundle.description;
    }

    // Build item list for prompt
    const itemNames = bundle.items
      .slice(0, 10) // Limit to first 10 for brevity
      .map(item => item.productName)
      .join(', ');

    const remainingCount = Math.max(0, bundle.items.length - 10);
    const itemSuffix = remainingCount > 0 ? ` and ${remainingCount} more items` : '';

    const prompt = `Generate a concise 2-sentence description for this emergency preparedness bundle:

Bundle Name: ${bundle.name}
Scenarios: ${bundle.scenarios.join(', ')}
Items: ${itemNames}${itemSuffix}

The description should:
1. Highlight the bundle's main purpose and value
2. Mention key scenarios it addresses
3. Be actionable and confidence-inspiring
4. Be 2 sentences maximum`;

    const result = await generateText({
      model: openrouter(MODELS.HAIKU),
      prompt,
      temperature: 0.7,
    });

    const description = result.text.trim();

    // Optionally save the generated description back to the database
    // await saveBundleDescription(bundleId, description);

    return description || 'Comprehensive emergency preparedness bundle for disaster scenarios.';
  } catch (error) {
    console.error('Failed to generate bundle description:', error);
    return 'Emergency preparedness bundle with essential survival supplies.';
  }
}

/**
 * Extract bundle IDs from AI-generated content
 * Validates that IDs exist in the provided bundle list
 */
export function extractBundleIdsFromContent(
  content: string,
  validBundleIds: string[]
): string[] {
  const extractedIds: string[] = [];

  // Look for UUID patterns that match our bundle IDs
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const matches = content.match(uuidPattern) || [];

  for (const match of matches) {
    const lowerId = match.toLowerCase();
    if (validBundleIds.includes(lowerId) && !extractedIds.includes(lowerId)) {
      extractedIds.push(lowerId);
    }
  }

  return extractedIds;
}

/**
 * Validate bundle recommendations from AI output
 * Ensures all recommended bundle IDs are valid
 */
export function validateBundleRecommendations(
  recommendedIds: string[],
  availableBundles: BundleCandidate[]
): {
  valid: string[];
  invalid: string[];
} {
  const availableIds = availableBundles.map(b => b.id.toLowerCase());

  const valid: string[] = [];
  const invalid: string[] = [];

  for (const id of recommendedIds) {
    if (availableIds.includes(id.toLowerCase())) {
      valid.push(id);
    } else {
      invalid.push(id);
    }
  }

  return { valid, invalid };
}

/**
 * Get enriched bundle data for display after AI recommendation
 */
export async function getEnrichedBundleData(
  bundleIds: string[]
): Promise<BundleWithItems[]> {
  const bundles = await Promise.all(
    bundleIds.map(id => getBundleWithItems(id))
  );
  return bundles.filter((b): b is BundleWithItems => b !== null);
}
