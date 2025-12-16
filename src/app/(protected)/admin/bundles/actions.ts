"use server";

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { bundles, bundleItems } from '@/db/schema/bundles';
import { specificProducts, masterItems } from '@/db/schema/products';
import { categories } from '@/db/schema/categories';
import { suppliers } from '@/db/schema/suppliers';
import { eq, desc, or, ilike, inArray, and } from 'drizzle-orm';
import { checkAdmin } from '@/lib/adminAuth';

export async function getBundles() {
  const bundlesData = await db
    .select()
    .from(bundles)
    .orderBy(desc(bundles.createdAt));
  
  // Fetch bundle items for all bundles
  const bundleIds = bundlesData.map(b => b.id);
  const items = bundleIds.length > 0 
    ? await db
        .select({
          id: bundleItems.id,
          bundleId: bundleItems.bundleId,
          quantity: bundleItems.quantity,
          productId: specificProducts.id,
          productName: specificProducts.name,
          productPrice: specificProducts.price,
          productType: specificProducts.type,
          productAsin: specificProducts.asin,
          productImageUrl: specificProducts.imageUrl,
          productMetadata: specificProducts.metadata,
          productMasterItemId: specificProducts.masterItemId,
        })
        .from(bundleItems)
        .innerJoin(specificProducts, eq(bundleItems.specificProductId, specificProducts.id))
        .where(inArray(bundleItems.bundleId, bundleIds))
    : [];
  
  // Group items by bundle
  const bundlesWithItems = bundlesData.map(bundle => ({
    ...bundle,
    items: items
      .filter(item => item.bundleId === bundle.id)
      .map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.productId,
          name: item.productName,
          price: item.productPrice,
          type: item.productType,
          asin: item.productAsin,
          image_url: item.productImageUrl,
          metadata: item.productMetadata,
          masterItemId: item.productMasterItemId,
        }
      }))
  }));
  
  return bundlesWithItems;
}

export async function searchProducts(query: string) {
    const data = await db
        .select({
          id: specificProducts.id,
          name: specificProducts.name,
          price: specificProducts.price,
          type: specificProducts.type,
          asin: specificProducts.asin,
          sku: specificProducts.sku,
          description: specificProducts.description,
          supplier: {
            name: suppliers.name,
          },
        })
        .from(specificProducts)
        .leftJoin(suppliers, eq(specificProducts.supplierId, suppliers.id))
        .where(
          or(
            ilike(specificProducts.name, `%${query}%`),
            ilike(specificProducts.description, `%${query}%`),
            ilike(specificProducts.asin, `%${query}%`),
            ilike(specificProducts.sku, `%${query}%`)
          )
        )
        .limit(10);
    
    return data;
}

export async function createBundle(formData: FormData) {
  try {
      await checkAdmin();
      
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const slug = formData.get('slug') as string;
      const totalEstimatedPrice = parseFloat(formData.get('total_estimated_price') as string);
      
      const scenariosJson = formData.get('scenarios') as string;
      const scenarios = scenariosJson ? JSON.parse(scenariosJson) : null;

      const minPeople = formData.get('min_people') ? parseInt(formData.get('min_people') as string) : null;
      const maxPeople = formData.get('max_people') ? parseInt(formData.get('max_people') as string) : null;

      const genderJson = formData.get('gender') as string;
      const gender = genderJson ? JSON.parse(genderJson) : null;

      const ageGroupsJson = formData.get('age_groups') as string;
      const ageGroups = ageGroupsJson ? JSON.parse(ageGroupsJson) : null;

      const climatesJson = formData.get('climates') as string;
      const climates = climatesJson ? JSON.parse(climatesJson) : null;
      
      const itemsJson = formData.get('items') as string;
      const items = JSON.parse(itemsJson);

      // 1. Create Bundle
      const [bundle] = await db
        .insert(bundles)
        .values({ 
            name, 
            description, 
            slug, 
            totalEstimatedPrice: totalEstimatedPrice.toString(),
            scenarios,
            minPeople,
            maxPeople,
            gender,
            ageGroups,
            climates
        })
        .returning();

      // 2. Create Bundle Items
      if (items.length > 0) {
          const bundleItemsData = items.map((item: any) => ({
              bundleId: bundle.id,
              specificProductId: item.product?.id || item.id,
              quantity: item.quantity,
              isOptional: false
          }));
          
          await db.insert(bundleItems).values(bundleItemsData);
      }
      
      revalidatePath('/admin/bundles');
  } catch (e: any) {
      console.error('Create Bundle Failed:', e);
      throw e; 
  }
}

export async function updateBundle(formData: FormData) {
    try {
        await checkAdmin();
        
        const id = formData.get('id') as string;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const slug = formData.get('slug') as string;
        const totalEstimatedPrice = parseFloat(formData.get('total_estimated_price') as string);
        
        const scenariosJson = formData.get('scenarios') as string;
        const scenarios = scenariosJson ? JSON.parse(scenariosJson) : null;

        const minPeople = formData.get('min_people') ? parseInt(formData.get('min_people') as string) : null;
        const maxPeople = formData.get('max_people') ? parseInt(formData.get('max_people') as string) : null;

        const genderJson = formData.get('gender') as string;
        const gender = genderJson ? JSON.parse(genderJson) : null;

        const ageGroupsJson = formData.get('age_groups') as string;
        const ageGroups = ageGroupsJson ? JSON.parse(ageGroupsJson) : null;

        const climatesJson = formData.get('climates') as string;
        const climates = climatesJson ? JSON.parse(climatesJson) : null;

        const itemsJson = formData.get('items') as string;
        const items = JSON.parse(itemsJson);
  
        // 1. Update Bundle Details
        await db
          .update(bundles)
          .set({ 
              name, 
              description, 
              slug, 
              totalEstimatedPrice: totalEstimatedPrice.toString(),
              scenarios,
              minPeople,
              maxPeople,
              gender,
              ageGroups,
              climates
          })
          .where(eq(bundles.id, id));
  
        // 2. Update Items (Strategy: Delete all and Re-insert for simplicity)
        // Delete existing
        await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
        
        // Insert new
        if (items.length > 0) {
            const bundleItemsData = items.map((item: any) => ({
                bundleId: id,
                specificProductId: item.product?.id || item.id, 
                quantity: item.quantity,
                isOptional: false
            }));
            
            await db.insert(bundleItems).values(bundleItemsData);
        }
        
        revalidatePath('/admin/bundles');
    } catch (e: any) {
        console.error('Update Bundle Failed:', e);
        throw e; 
    }
  }

export async function deleteBundle(id: string) {
    await checkAdmin();
    
    // Delete bundle items first (cascade should handle this, but being explicit)
    await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
    await db.delete(bundles).where(eq(bundles.id, id));
    
    revalidatePath('/admin/bundles');
}

// --- Catalog Helpers for Bundle Editor ---

export async function getProducts() {
    const data = await db
      .select({
        id: specificProducts.id,
        name: specificProducts.name,
        masterItemId: specificProducts.masterItemId,
        supplierId: specificProducts.supplierId,
        description: specificProducts.description,
        price: specificProducts.price,
        sku: specificProducts.sku,
        asin: specificProducts.asin,
        imageUrl: specificProducts.imageUrl,
        productUrl: specificProducts.productUrl,
        type: specificProducts.type,
        status: specificProducts.status,
        metadata: specificProducts.metadata,
        variations: specificProducts.variations,
        timeframes: specificProducts.timeframes,
        demographics: specificProducts.demographics,
        locations: specificProducts.locations,
        scenarios: specificProducts.scenarios,
        createdAt: specificProducts.createdAt,
        updatedAt: specificProducts.updatedAt,
        masterItem: {
          name: masterItems.name,
          categoryId: masterItems.categoryId,
        },
        supplier: {
          name: suppliers.name,
        },
      })
      .from(specificProducts)
      .leftJoin(masterItems, eq(specificProducts.masterItemId, masterItems.id))
      .leftJoin(suppliers, eq(specificProducts.supplierId, suppliers.id))
      .orderBy(specificProducts.name);
    
    return data;
  }
  
export async function getMasterItems() {
      const data = await db
        .select({
          id: masterItems.id,
          name: masterItems.name,
          categoryId: masterItems.categoryId,
          timeframes: masterItems.timeframes,
          demographics: masterItems.demographics,
          locations: masterItems.locations,
          scenarios: masterItems.scenarios,
        })
        .from(masterItems)
        .orderBy(masterItems.name);
      
      return data;
}
  
export async function getCategories() {
      const data = await db
          .select({
            id: categories.id,
            name: categories.name,
            parentId: categories.parentId,
            icon: categories.icon,
          })
          .from(categories)
          .orderBy(categories.name);

      return data;
}

export async function addProductToBundle(bundleId: string, productId: string, quantity: number = 1) {
    await checkAdmin();
    
    // Check if item already exists
    const [existing] = await db
        .select({ quantity: bundleItems.quantity })
        .from(bundleItems)
        .where(
          and(
            eq(bundleItems.bundleId, bundleId),
            eq(bundleItems.specificProductId, productId)
          )
        )
        .limit(1);

    if (existing) {
        throw new Error("Product already in bundle");
    }

    await db
        .insert(bundleItems)
        .values({
            bundleId,
            specificProductId: productId,
            quantity,
            isOptional: false
        });
    
    revalidatePath('/admin/bundles');
}
