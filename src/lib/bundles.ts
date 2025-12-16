import { db } from '@/db';
import { bundles, bundleItems } from '@/db/schema/bundles';
import { specificProducts } from '@/db/schema/products';
import { and, sql, gte, lte, desc, eq } from 'drizzle-orm';
import type { ScenarioType } from '@/types/wizard';

/**
 * Bundle Query Functions
 * Pre-filter bundles for AI recommendation engine
 */

export interface BundleCandidate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  totalEstimatedPrice: string | null;
  scenarios: string[];
  minPeople: number | null;
  maxPeople: number | null;
  itemCount: number;
}

export interface BundleWithItems extends BundleCandidate {
  items: {
    productId: string;
    productName: string;
    productPrice: string | null;
    quantity: number;
    isOptional: boolean;
  }[];
}

export interface BundleFilterParams {
  scenarios: ScenarioType[];
  familySize: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

/**
 * Get bundles matching scenario tags and family size
 * Pre-filters candidates for LLM ranking
 */
export async function getBundlesForScenarios(
  params: BundleFilterParams
): Promise<BundleCandidate[]> {
  const { scenarios, familySize, minPrice, maxPrice, limit = 10 } = params;

  // Convert scenarios to the format used in the database
  const scenarioTags = scenarios.map(s =>
    s.toUpperCase().replace(/-/g, '_')
  );

  try {
    // Build the query with array overlap for scenarios
    const conditions = [
      // Scenario overlap - bundle must match at least one user scenario
      sql`${bundles.scenarios} && ARRAY[${sql.join(
        scenarioTags.map(s => sql`${s}`),
        sql`, `
      )}]::text[]`,
    ];

    // Family size range check
    conditions.push(
      sql`(${bundles.minPeople} IS NULL OR ${bundles.minPeople} <= ${familySize})`
    );
    conditions.push(
      sql`(${bundles.maxPeople} IS NULL OR ${bundles.maxPeople} >= ${familySize})`
    );

    // Price filters (if provided)
    if (minPrice !== undefined) {
      conditions.push(
        sql`CAST(${bundles.totalEstimatedPrice} AS DECIMAL) >= ${minPrice}`
      );
    }
    if (maxPrice !== undefined) {
      conditions.push(
        sql`CAST(${bundles.totalEstimatedPrice} AS DECIMAL) <= ${maxPrice}`
      );
    }

    // Query bundles with item count
    const result = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        slug: bundles.slug,
        description: bundles.description,
        imageUrl: bundles.imageUrl,
        totalEstimatedPrice: bundles.totalEstimatedPrice,
        scenarios: bundles.scenarios,
        minPeople: bundles.minPeople,
        maxPeople: bundles.maxPeople,
        itemCount: sql<number>`(
          SELECT COUNT(*)::int FROM bundle_items
          WHERE bundle_items.bundle_id = ${bundles.id}
        )`,
      })
      .from(bundles)
      .where(and(...conditions))
      .orderBy(desc(bundles.totalEstimatedPrice))
      .limit(limit);

    return result;
  } catch (error) {
    console.error('Failed to query bundles for scenarios:', error);
    return [];
  }
}

/**
 * Get a single bundle with all its items
 */
export async function getBundleWithItems(
  bundleId: string
): Promise<BundleWithItems | null> {
  try {
    // Get the bundle
    const bundle = await db.query.bundles.findFirst({
      where: eq(bundles.id, bundleId),
    });

    if (!bundle) return null;

    // Get bundle items with product details
    const items = await db
      .select({
        productId: specificProducts.id,
        productName: specificProducts.name,
        productPrice: specificProducts.price,
        quantity: bundleItems.quantity,
        isOptional: bundleItems.isOptional,
      })
      .from(bundleItems)
      .innerJoin(
        specificProducts,
        eq(bundleItems.specificProductId, specificProducts.id)
      )
      .where(eq(bundleItems.bundleId, bundleId));

    return {
      id: bundle.id,
      name: bundle.name,
      slug: bundle.slug,
      description: bundle.description,
      imageUrl: bundle.imageUrl,
      totalEstimatedPrice: bundle.totalEstimatedPrice,
      scenarios: bundle.scenarios,
      minPeople: bundle.minPeople,
      maxPeople: bundle.maxPeople,
      itemCount: items.length,
      items,
    };
  } catch (error) {
    console.error('Failed to get bundle with items:', error);
    return null;
  }
}

/**
 * Get multiple bundles by their IDs with items
 */
export async function getBundlesByIds(
  bundleIds: string[]
): Promise<BundleWithItems[]> {
  const results = await Promise.all(
    bundleIds.map(id => getBundleWithItems(id))
  );
  return results.filter((b): b is BundleWithItems => b !== null);
}

/**
 * Calculate scenario match score for a bundle
 * Returns a score from 0-100 based on how well the bundle matches user scenarios
 */
export function calculateScenarioMatchScore(
  bundleScenarios: string[],
  userScenarios: ScenarioType[]
): number {
  const normalizedBundleScenarios = bundleScenarios.map(s =>
    s.toLowerCase().replace(/_/g, '-')
  );
  const normalizedUserScenarios = userScenarios.map(s => s.toLowerCase());

  // Count matches
  const matches = normalizedUserScenarios.filter(us =>
    normalizedBundleScenarios.includes(us)
  ).length;

  // Calculate percentage of user scenarios covered
  const coverageScore = (matches / normalizedUserScenarios.length) * 100;

  return Math.round(coverageScore);
}

/**
 * Get all bundles (for fallback when no scenario matches)
 */
export async function getAllBundles(limit: number = 20): Promise<BundleCandidate[]> {
  try {
    const result = await db
      .select({
        id: bundles.id,
        name: bundles.name,
        slug: bundles.slug,
        description: bundles.description,
        imageUrl: bundles.imageUrl,
        totalEstimatedPrice: bundles.totalEstimatedPrice,
        scenarios: bundles.scenarios,
        minPeople: bundles.minPeople,
        maxPeople: bundles.maxPeople,
        itemCount: sql<number>`(
          SELECT COUNT(*)::int FROM bundle_items
          WHERE bundle_items.bundle_id = ${bundles.id}
        )`,
      })
      .from(bundles)
      .orderBy(desc(bundles.totalEstimatedPrice))
      .limit(limit);

    return result;
  } catch (error) {
    console.error('Failed to get all bundles:', error);
    return [];
  }
}
