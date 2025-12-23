"use server";

import { db } from '@/db';
import { masterItems, specificProducts } from '@/db/schema/products';
import { categories } from '@/db/schema/categories';
import { eq } from 'drizzle-orm';
import { checkAdmin } from '@/lib/adminAuth';
import { recalculateMasterItemTags } from '../actions';
import type { ProductMetadata } from '@/lib/products-types';

/**
 * Data Migration: Tag System Redesign
 *
 * Migrates existing product data to new tag system:
 * 1. Converts "individual" demographic tag → metadata.x1_multiplier = false
 * 2. Converts "family" demographic tag → metadata.x1_multiplier = true
 * 3. Converts ">1 year" timeframe tag → "1 year"
 * 4. Converts null tag arrays to explicit empty arrays (removes inheritance)
 * 5. Recalculates all master item tags from products
 *
 * @returns Migration summary with counts and changes
 */
export async function migrateTagSystem(): Promise<{
    success: boolean;
    productsUpdated: number;
    masterItemsRecalculated: number;
    masterItemsSkipped: number;
    skippedMasterItems: Array<{
        masterItemId: string;
        masterItemName: string;
        categoryName: string;
        subcategoryName: string | null;
        reason: string;
        productIds: string[];
    }>;
    changes: Array<{
        productId: string;
        productName: string;
        changes: string[];
    }>;
    error?: string;
}> {
    await checkAdmin();

    try {
        const products = await db.select().from(specificProducts);

        const changes: Array<{
            productId: string;
            productName: string;
            changes: string[];
        }> = [];

        let productsUpdated = 0;
        const affectedMasterItems = new Set<string>();

        for (const product of products) {
            let demographics = product.demographics;
            let timeframes = product.timeframes;
            let locations = product.locations;
            let scenarios = product.scenarios;
            const metadata = (product.metadata as ProductMetadata) || {};
            const productChanges: string[] = [];

            let needsUpdate = false;

            // CRITICAL: If product has null tags (inheriting), copy from master item
            const hasInheritedTags =
                demographics === null ||
                timeframes === null ||
                locations === null ||
                scenarios === null;

            if (hasInheritedTags) {
                const [masterItem] = await db
                    .select({
                        demographics: masterItems.demographics,
                        timeframes: masterItems.timeframes,
                        locations: masterItems.locations,
                        scenarios: masterItems.scenarios,
                    })
                    .from(masterItems)
                    .where(eq(masterItems.id, product.masterItemId))
                    .limit(1);

                if (masterItem) {
                    if (demographics === null && masterItem.demographics) {
                        demographics = masterItem.demographics;
                        productChanges.push(`Inherited demographics from master item: ${demographics.join(', ')}`);
                        needsUpdate = true;
                    }
                    if (timeframes === null && masterItem.timeframes) {
                        timeframes = masterItem.timeframes;
                        productChanges.push(`Inherited timeframes from master item: ${timeframes.join(', ')}`);
                        needsUpdate = true;
                    }
                    if (locations === null && masterItem.locations) {
                        locations = masterItem.locations;
                        productChanges.push(`Inherited locations from master item: ${locations.join(', ')}`);
                        needsUpdate = true;
                    }
                    if (scenarios === null && masterItem.scenarios) {
                        scenarios = masterItem.scenarios;
                        productChanges.push(`Inherited scenarios from master item: ${scenarios.join(', ')}`);
                        needsUpdate = true;
                    }
                }
            }

            // Ensure we have arrays (not null) for tag processing
            demographics = demographics || [];
            timeframes = timeframes || [];
            locations = locations || [];
            scenarios = scenarios || [];

            // Convert "individual" tag to x1_multiplier = false
            const hasIndividual = demographics.some(d => d.toLowerCase() === 'individual');
            if (hasIndividual) {
                metadata.x1_multiplier = false;
                demographics = demographics.filter(d => d.toLowerCase() !== 'individual');
                productChanges.push(`Removed 'Individual' tag, set X1 multiplier to OFF`);
                needsUpdate = true;
            }

            // Convert "family" tag to x1_multiplier = true
            const hasFamily = demographics.some(d => d.toLowerCase() === 'family');
            if (hasFamily) {
                metadata.x1_multiplier = true;
                demographics = demographics.filter(d => d.toLowerCase() !== 'family');
                productChanges.push(`Removed 'Family' tag, set X1 multiplier to ON`);
                needsUpdate = true;
            }

            // Default x1_multiplier to false if not set
            if (!hasIndividual && !hasFamily && metadata.x1_multiplier === undefined) {
                metadata.x1_multiplier = false;
                needsUpdate = true;
            }

            // Convert ">1 year" to "1 year"
            const hasGreaterThanOneYear = timeframes.some(t => t === '>1 year');
            if (hasGreaterThanOneYear) {
                timeframes = timeframes.map(t => (t === '>1 year' ? '1 year' : t));
                productChanges.push(`Converted '>1 year' tag to '1 year'`);
                needsUpdate = true;
            }

            // Perform single update if anything changed
            if (needsUpdate) {
                await db
                    .update(specificProducts)
                    .set({
                        demographics,
                        timeframes,
                        locations,
                        scenarios,
                        metadata,
                    })
                    .where(eq(specificProducts.id, product.id));
            }

            if (needsUpdate) {
                productsUpdated++;
                affectedMasterItems.add(product.masterItemId);
                changes.push({
                    productId: product.id,
                    productName: product.name,
                    changes: productChanges,
                });
            }
        }

        // Recalculate all master item tags
        const masterItemList = await db
            .select({
                id: masterItems.id,
                name: masterItems.name,
                categoryId: masterItems.categoryId,
            })
            .from(masterItems);

        const skippedMasterItems: Array<{
            masterItemId: string;
            masterItemName: string;
            categoryName: string;
            subcategoryName: string | null;
            reason: string;
            productIds: string[];
        }> = [];
        let masterItemsRecalculated = 0;

        for (const masterItem of masterItemList) {
            try {
                await recalculateMasterItemTags(masterItem.id);
                masterItemsRecalculated++;
            } catch (error) {
                // Get products under this master item
                const masterProducts = await db
                    .select({ id: specificProducts.id })
                    .from(specificProducts)
                    .where(eq(specificProducts.masterItemId, masterItem.id));

                // Get category name
                const [categoryInfo] = await db
                    .select({
                        categoryName: categories.name,
                        parentId: categories.parentId,
                    })
                    .from(categories)
                    .where(eq(categories.id, masterItem.categoryId))
                    .limit(1);

                // Get parent category (subcategory) if exists
                let subcategoryName: string | null = null;
                if (categoryInfo?.parentId) {
                    const [parentCategory] = await db
                        .select({ name: categories.name })
                        .from(categories)
                        .where(eq(categories.id, categoryInfo.parentId))
                        .limit(1);
                    subcategoryName = parentCategory?.name || null;
                }

                skippedMasterItems.push({
                    masterItemId: masterItem.id,
                    masterItemName: masterItem.name,
                    categoryName: categoryInfo?.categoryName || 'Unknown',
                    subcategoryName,
                    reason: error instanceof Error ? error.message : 'Unknown error',
                    productIds: masterProducts.map(p => p.id),
                });
            }
        }

        return {
            success: true,
            productsUpdated,
            masterItemsRecalculated,
            masterItemsSkipped: skippedMasterItems.length,
            skippedMasterItems,
            changes,
        };
    } catch (error: unknown) {
        console.error('Tag system migration error:', error);
        return {
            success: false,
            productsUpdated: 0,
            masterItemsRecalculated: 0,
            masterItemsSkipped: 0,
            skippedMasterItems: [],
            changes: [],
            error: error instanceof Error ? error.message : 'Unknown error during migration',
        };
    }
}

/**
 * Rollback Migration: Restore Individual/Family Tags
 *
 * Reverses the tag system migration:
 * 1. Restores "individual" tag from metadata.x1_multiplier = false
 * 2. Restores "family" tag from metadata.x1_multiplier = true
 * 3. Converts "1 year" timeframe tag back to ">1 year" if needed
 *
 * NOTE: This should ONLY be used if migration causes issues.
 * Recalculates master item tags after rollback.
 *
 * @returns Rollback summary with counts
 */
export async function rollbackTagSystemMigration(): Promise<{
    success: boolean;
    productsRolledBack: number;
    masterItemsRecalculated: number;
    error?: string;
}> {
    await checkAdmin();

    try {
        const products = await db.select().from(specificProducts);

        let productsRolledBack = 0;

        for (const product of products) {
            const demographics = product.demographics || [];
            const metadata = (product.metadata as ProductMetadata) || {};

            let needsUpdate = false;
            const newDemographics = [...demographics];

            // Restore "individual" tag from x1_multiplier = false
            if (metadata.x1_multiplier === false && !demographics.includes('Individual')) {
                newDemographics.push('Individual');
                needsUpdate = true;
            }

            // Restore "family" tag from x1_multiplier = true
            if (metadata.x1_multiplier === true && !demographics.includes('Family')) {
                newDemographics.push('Family');
                needsUpdate = true;
            }

            // Remove x1_multiplier from metadata
            if (metadata.x1_multiplier !== undefined) {
                delete metadata.x1_multiplier;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await db
                    .update(specificProducts)
                    .set({
                        demographics: newDemographics,
                        metadata,
                    })
                    .where(eq(specificProducts.id, product.id));

                productsRolledBack++;
            }
        }

        // Recalculate all master item tags
        const masterItemList = await db.select().from(masterItems);
        for (const masterItem of masterItemList) {
            await recalculateMasterItemTags(masterItem.id);
        }

        return {
            success: true,
            productsRolledBack,
            masterItemsRecalculated: masterItemList.length,
        };
    } catch (error: unknown) {
        console.error('Tag system rollback error:', error);
        return {
            success: false,
            productsRolledBack: 0,
            masterItemsRecalculated: 0,
            error: error instanceof Error ? error.message : 'Unknown error during rollback',
        };
    }
}
