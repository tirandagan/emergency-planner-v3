"use server";

import { revalidatePath } from 'next/cache';
import { generateText } from 'ai';
import { getDecodoProductDetails, searchDecodoProducts } from '@/lib/decodo';
import { db } from '@/db';
import { masterItems, specificProducts } from '@/db/schema/products';
import { categories } from '@/db/schema/categories';
import { suppliers } from '@/db/schema/suppliers';
import { eq, desc, ilike, or, and, inArray, sql } from 'drizzle-orm';
import { checkAdmin } from '@/lib/adminAuth';
import { getModel } from '@/lib/openrouter';
import { buildChangeEntry, addChangeEntry } from '@/lib/change-tracking';

import type { Product } from '@/lib/products-types';

export async function getProducts(): Promise<Product[]> {
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
      changeHistory: specificProducts.changeHistory,
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
    .orderBy(desc(specificProducts.createdAt));

  return data as Product[];
}

export async function getMasterItems() {
    const data = await db
      .select({
        id: masterItems.id,
        name: masterItems.name,
        categoryId: masterItems.categoryId,
        description: masterItems.description,
        status: masterItems.status,
        timeframes: masterItems.timeframes,
        demographics: masterItems.demographics,
        locations: masterItems.locations,
        scenarios: masterItems.scenarios,
        createdAt: masterItems.createdAt,
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
          description: categories.description,
          icon: categories.icon,
        })
        .from(categories)
        .orderBy(categories.name);

    return data;
}

export async function getSuppliers() {
    const data = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
      })
      .from(suppliers)
      .orderBy(suppliers.name);
    
    return data;
}

export async function createProduct(formData: FormData) {
  await checkAdmin();

  const name = formData.get('name') as string;
  const masterItemIdRaw = formData.get('masterItemId') as string;
  const supplierIdRaw = formData.get('supplierId') as string;
  const supplierId = supplierIdRaw && supplierIdRaw.trim() !== '' ? supplierIdRaw : null;
  const price = parseFloat(formData.get('price') as string);
  const type = formData.get('type') as string;
  const productUrl = formData.get('productUrl') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const description = formData.get('description') as string;
  const asinRaw = formData.get('asin') as string;
  const asin = asinRaw && asinRaw.trim() !== '' ? asinRaw.trim() : null;

  // Validation (return early with error instead of throwing)
  if (!name || name.trim() === '') {
    return { success: false, message: 'Product name is required' };
  }

  if (!masterItemIdRaw || masterItemIdRaw.trim() === '') {
    return { success: false, message: 'Master Item (Type) is required. Please select a category, subcategory, and master item.' };
  }

  const masterItemId = masterItemIdRaw.trim();

  if (!productUrl || productUrl.trim() === '') {
    return { success: false, message: 'Product URL is required' };
  }

  if (isNaN(price) || price <= 0) {
    return { success: false, message: 'Valid price is required' };
  }
  
  // Check for duplicate ASIN
  if (asin) {
    const [existing] = await db
      .select({
        id: specificProducts.id,
        name: specificProducts.name,
        masterItemName: masterItems.name,
        supplierName: suppliers.name,
        asin: specificProducts.asin,
        price: specificProducts.price,
        imageUrl: specificProducts.imageUrl,
      })
      .from(specificProducts)
      .leftJoin(masterItems, eq(specificProducts.masterItemId, masterItems.id))
      .leftJoin(suppliers, eq(specificProducts.supplierId, suppliers.id))
      .where(eq(specificProducts.asin, asin))
      .limit(1);
    
    if (existing) {
      return { 
        success: false, 
        conflict: {
          id: existing.id,
          name: existing.name,
          master_item_name: existing.masterItemName,
          supplier_name: existing.supplierName,
          asin: existing.asin,
          price: existing.price,
          image_url: existing.imageUrl,
        },
        message: `ASIN ${asin} is already used by another product.` 
      };
    }
  }

  // Metadata handling
  const metadataKeys = ['weight', 'weight_unit', 'dimensions', 'brand', 'color', 'size', 'quantity', 'volume', 'volume_unit', 'rating', 'reviews'];
  const metadata: Record<string, any> = {};
  metadataKeys.forEach(key => {
    const val = formData.get(`meta_${key}`);
    if(val) metadata[key] = val;
  });

  // Tag handling (Inherit from Master Item if not provided)
  let timeframes = formData.get('inherit_timeframes') === 'true' ? null : formData.getAll('timeframes') as string[];
  let demographics = formData.get('inherit_demographics') === 'true' ? null : formData.getAll('demographics') as string[];
  let locations = formData.get('inherit_locations') === 'true' ? null : formData.getAll('locations') as string[];
  let scenarios = formData.get('inherit_scenarios') === 'true' ? null : formData.getAll('scenarios') as string[];
  
  // Variations handling
  const variationsRaw = formData.get('variations') as string;
  const variations = variationsRaw ? JSON.parse(variationsRaw) : null;

  // If no tags provided at all (and no inheritance flag), fetch from master (Legacy/Copy behavior)
  if (!timeframes && !demographics && !locations && !scenarios && !formData.has('inherit_timeframes')) {
    const [master] = await db
      .select({
        timeframes: masterItems.timeframes,
        demographics: masterItems.demographics,
        locations: masterItems.locations,
        scenarios: masterItems.scenarios,
      })
      .from(masterItems)
      .where(eq(masterItems.id, masterItemId))
      .limit(1);
    
    if (master) {
      timeframes = master.timeframes || [];
      demographics = master.demographics || [];
      locations = master.locations || [];
      scenarios = master.scenarios || [];
    }
  }

  try {
    await db.insert(specificProducts).values({
      name,
      masterItemId,
      supplierId,
      price: price.toString(),
      type,
      productUrl,
      imageUrl,
      description,
      asin,
      metadata,
      status: 'verified',
      timeframes: timeframes === null ? null : (timeframes as string[]),
      demographics: demographics === null ? null : (demographics as string[]),
      locations: locations === null ? null : (locations as string[]),
      scenarios: scenarios === null ? null : (scenarios as string[]),
      variations,
    });
  } catch (error: any) {
    console.error('Database error creating product:', error);

    // Provide user-friendly error messages
    if (error.message?.includes('foreign key')) {
      throw new Error('Invalid Master Item or Supplier selected. Please refresh the page and try again.');
    }
    if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
      throw new Error('A product with this ASIN already exists in the database.');
    }
    if (error.message?.includes('null value') || error.message?.includes('violates not-null')) {
      throw new Error('Missing required field. Please ensure all required fields are filled out.');
    }

    // Generic database error
    throw new Error(`Database error: ${error.message || 'Failed to create product'}`);
  }

  revalidatePath('/admin/products');
  revalidatePath('/admin/bundles');
  return { success: true };
}

export async function updateProduct(formData: FormData) {
    const user = await checkAdmin();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const masterItemIdRaw = formData.get('masterItemId') as string;
    const supplierIdRaw = formData.get('supplierId') as string;
    const supplierId = supplierIdRaw && supplierIdRaw.trim() !== '' ? supplierIdRaw : null;
    const price = parseFloat(formData.get('price') as string);
    const type = formData.get('type') as string;
    const productUrl = formData.get('productUrl') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const description = formData.get('description') as string;
    const asinRaw = formData.get('asin') as string;
    const asin = asinRaw && asinRaw.trim() !== '' ? asinRaw.trim() : null;

    // Fetch existing product data for change tracking
    const [existingProduct] = await db
      .select()
      .from(specificProducts)
      .where(eq(specificProducts.id, id))
      .limit(1);

    // Validation (return early with error instead of throwing)
    if (!name || name.trim() === '') {
      return { success: false, message: 'Product name is required' };
    }

    if (!masterItemIdRaw || masterItemIdRaw.trim() === '') {
      return { success: false, message: 'Master Item (Type) is required. Please select a category, subcategory, and master item.' };
    }

    const masterItemId = masterItemIdRaw.trim();

    if (!productUrl || productUrl.trim() === '') {
      return { success: false, message: 'Product URL is required' };
    }

    if (isNaN(price) || price <= 0) {
      return { success: false, message: 'Valid price is required' };
    }
    
    // Check for duplicate ASIN
    if (asin) {
      const [existing] = await db
        .select({
          id: specificProducts.id,
          name: specificProducts.name,
          masterItemName: masterItems.name,
          supplierName: suppliers.name,
          asin: specificProducts.asin,
          price: specificProducts.price,
          imageUrl: specificProducts.imageUrl,
        })
        .from(specificProducts)
        .leftJoin(masterItems, eq(specificProducts.masterItemId, masterItems.id))
        .leftJoin(suppliers, eq(specificProducts.supplierId, suppliers.id))
        .where(and(
          eq(specificProducts.asin, asin),
          sql`${specificProducts.id} != ${id}`
        ))
        .limit(1);
        
      if (existing) {
        return { 
          success: false, 
          conflict: {
            id: existing.id,
            name: existing.name,
            master_item_name: existing.masterItemName,
            supplier_name: existing.supplierName,
            asin: existing.asin,
            price: existing.price,
            image_url: existing.imageUrl,
          },
          message: `ASIN ${asin} is already used by another product.` 
        };
      }
    }
    
    // Metadata handling
    const metadataKeys = ['weight', 'weight_unit', 'dimensions', 'brand', 'color', 'size', 'quantity', 'volume', 'volume_unit', 'rating', 'reviews'];
    const metadata: Record<string, any> = {};
    metadataKeys.forEach(key => {
        const val = formData.get(`meta_${key}`);
        if(val) metadata[key] = val;
    });

    // Tag handling
    const timeframes = formData.get('inherit_timeframes') === 'true' ? null : formData.getAll('timeframes') as string[];
    const demographics = formData.get('inherit_demographics') === 'true' ? null : formData.getAll('demographics') as string[];
    const locations = formData.get('inherit_locations') === 'true' ? null : formData.getAll('locations') as string[];
    const scenarios = formData.get('inherit_scenarios') === 'true' ? null : formData.getAll('scenarios') as string[];
    
    // Variations handling
    const variationsRaw = formData.get('variations') as string;
    const variations = variationsRaw ? JSON.parse(variationsRaw) : null;

    // Prepare update data
    const updateData = {
      name,
      masterItemId,
      supplierId,
      price: price.toString(),
      type,
      productUrl,
      imageUrl,
      description,
      asin,
      metadata,
      status: 'verified' as const,
      timeframes: timeframes === null ? null : (timeframes as string[]),
      demographics: demographics === null ? null : (demographics as string[]),
      locations: locations === null ? null : (locations as string[]),
      scenarios: scenarios === null ? null : (scenarios as string[]),
      variations,
    };

    // Build change history entry
    const changeEntry = buildChangeEntry(existingProduct, updateData, user);

    // Add change entry to history if changes were detected
    let updatedChangeHistory = existingProduct?.changeHistory as any;
    if (changeEntry) {
      updatedChangeHistory = addChangeEntry(existingProduct?.changeHistory as any, changeEntry);
    }

    try {
      await db.update(specificProducts)
        .set({
          ...updateData,
          changeHistory: updatedChangeHistory,
        })
        .where(eq(specificProducts.id, id));
    } catch (error: any) {
      console.error('Database error updating product:', error);

      // Provide user-friendly error messages
      if (error.message?.includes('foreign key')) {
        throw new Error('Invalid Master Item or Supplier selected. Please refresh the page and try again.');
      }
      if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw new Error('A product with this ASIN already exists in the database.');
      }
      if (error.message?.includes('null value') || error.message?.includes('violates not-null')) {
        throw new Error('Missing required field. Please ensure all required fields are filled out.');
      }

      // Generic database error
      throw new Error(`Database error: ${error.message || 'Failed to update product'}`);
    }

    revalidatePath('/admin/products');
    return { success: true };
  }

export async function updateProductTags(
    id: string, 
    tags: { 
        scenarios: string[] | null; 
        demographics: string[] | null; 
        timeframes: string[] | null; 
        locations: string[] | null; 
    }
) {
    await checkAdmin();
    
    await db
        .update(specificProducts)
        .set(tags)
        .where(eq(specificProducts.id, id));
    
    revalidatePath('/admin/products');
    revalidatePath('/admin/bundles');
    return { success: true };
}

export async function deleteProduct(id: string) {
    await checkAdmin();
    
    await db.delete(specificProducts).where(eq(specificProducts.id, id));
    
    revalidatePath('/admin/products');
    revalidatePath('/admin/bundles');
}

export async function createMasterItem(formData: FormData) {
    await checkAdmin();

    const name = formData.get('name') as string;
    const categoryId = formData.get('category_id') as string;
    const description = formData.get('description') as string;

    const timeframes = formData.getAll('timeframes') as string[];
    const demographics = formData.getAll('demographics') as string[];
    const locations = formData.getAll('locations') as string[];
    const scenarios = formData.getAll('scenarios') as string[];

    if (!name || !categoryId) throw new Error('Name and Category are required');

    const [data] = await db
        .insert(masterItems)
        .values({
            name,
            categoryId,
            description,
            status: 'active',
            timeframes,
            demographics,
            locations,
            scenarios
        })
        .returning();

    revalidatePath('/admin/products');
    return data;
}

export async function updateMasterItem(formData: FormData) {
    const user = await checkAdmin();

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    const timeframes = formData.getAll('timeframes') as string[];
    const demographics = formData.getAll('demographics') as string[];
    const locations = formData.getAll('locations') as string[];
    const scenarios = formData.getAll('scenarios') as string[];

    if (!id || !name) throw new Error('ID and Name are required');

    // Fetch existing master item data for change tracking
    const [existingMasterItem] = await db
      .select()
      .from(masterItems)
      .where(eq(masterItems.id, id))
      .limit(1);

    // Prepare update data
    const updateData = {
      name,
      description,
      timeframes,
      demographics,
      locations,
      scenarios,
    };

    // Build change history entry
    const changeEntry = buildChangeEntry(existingMasterItem, updateData, user);

    // Add change entry to history if changes were detected
    let updatedChangeHistory = existingMasterItem?.changeHistory as any;
    if (changeEntry) {
      updatedChangeHistory = addChangeEntry(existingMasterItem?.changeHistory as any, changeEntry);
    }

    const [data] = await db
        .update(masterItems)
        .set({
            ...updateData,
            changeHistory: updatedChangeHistory,
        })
        .where(eq(masterItems.id, id))
        .returning();

    revalidatePath('/admin/products');
    revalidatePath('/admin/bundles');
    return data;
}

export async function bulkUpdateProducts(ids: string[], data: { supplierId?: string | null; masterItemId?: string }) {
    await checkAdmin();

    if (ids.length === 0) return;

    const updateData: any = {};
    if (data.supplierId !== undefined) {
      updateData.supplierId = data.supplierId;
    }
    if (data.masterItemId !== undefined) {
      updateData.masterItemId = data.masterItemId;
    }

    await db
        .update(specificProducts)
        .set(updateData)
        .where(inArray(specificProducts.id, ids));
    
    revalidatePath('/admin/products');
    revalidatePath('/admin/bundles');
}

export async function summarizeProductDescription(description: string): Promise<string> {
    await checkAdmin();

    if (!description || description.trim().length === 0) {
        throw new Error("Description is empty");
    }

    const { text } = await generateText({
        model: getModel('HAIKU'),
        prompt: `Please summarize the following product description. Keep only the factual information that describes the product features and specifications. Remove any marketing fluff, promotional language (e.g., "We are proud to...", "Best in class", "Revolutionary"), and subjective claims. The output should be concise and informative. Do not use markdown formatting.\n\nDescription:\n${description}`,
    });

    return text;
}

function extractCapacity(title: string): { value: number, unit: string } {
    if (!title) return { value: 1, unit: 'count' };
    
    const lowerTitle = title.toLowerCase();
    
    // Check for explicit pack counts
    // "pack of 3", "set of 3", "3-pack", "3 pack", "3 count", "3ct"
    const packRegex = /(\d+)\s?(-?pack|pk|count|ct|piece|pc)/i;
    const packOfRegex = /(pack|set) of (\d+)/i;
    
    let match = lowerTitle.match(packOfRegex);
    if (match && match[2]) {
        const num = parseInt(match[2]);
        if (!isNaN(num) && num > 1) return { value: num, unit: 'count' };
    }

    match = lowerTitle.match(packRegex);
    if (match && match[1]) {
        const num = parseInt(match[1]);
        if (!isNaN(num) && num > 1) return { value: num, unit: 'count' };
    }

    // Heuristic: check for liquid volume
    const flOzRegex = /(\d*\.?\d+)\s?(fl oz|fluid ounce)/i;
    match = lowerTitle.match(flOzRegex);
    if (match && match[1]) {
        return { value: parseFloat(match[1]), unit: 'fl oz' };
    }
    
    // Weight
    const lbRegex = /(\d*\.?\d+)\s?(lb|pound)/i;
    match = lowerTitle.match(lbRegex);
    if (match && match[1]) {
        return { value: parseFloat(match[1]), unit: 'lbs' };
    }

    return { value: 1, unit: 'count' };
}

export const getProductDetailsFromAmazon = async (query: string) => {
    await checkAdmin();
    try {
        const result = await getDecodoProductDetails(query);

        if (!result) {
             return { success: false, message: "No results found on Amazon via Decodo." };
        }

        const capacity = extractCapacity(result.title);

        return {
            success: true,
            data: {
                name: result.title,
                asin: result.asin,
                image_url: result.image_url,
                price: result.price,
                url: result.store_url,
                description: result.description || (Array.isArray(result.bullet_points) ? result.bullet_points.join('\n') : result.bullet_points),
                rating: result.rating,
                reviews: result.reviews,
                weight: result.weight,
                weight_unit: result.weight_unit,
                capacity_value: capacity.value,
                capacity_unit: capacity.unit,
                metadata_brand: result.brand,
                manufacturer: result.manufacturer,
                // We pass these through so UI can pick them up
                // Note: UI expects them in keys like 'upc' or 'part_number' directly if they are to be autofilled?
                // Or we should return them in data object.
                upc: result.upc,
                part_number: result.part_number,
                model_name: result.model_name,
                dimensions: result.dimensions,
                color: result.color,
                size: result.size
            }
        };

    } catch (e: any) {
        // Parse error message to provide better user feedback
        let userMessage = e.message;
        let fieldError: string | undefined;

        // Check if this is an ASIN validation error
        if (userMessage.includes('ASIN length is not valid')) {
            userMessage = 'Invalid ASIN: ASINs must be exactly 10 characters (letters and numbers). Please check the ASIN and try again.';
            fieldError = 'asin';
        } else if (userMessage.includes('Unable to extract a valid Amazon ASIN')) {
            // Error from URL ASIN extraction
            fieldError = 'productUrl';
        } else if (userMessage.includes('Invalid ASIN length')) {
            // Error from ASIN length validation
            fieldError = 'asin';
        } else if (userMessage.includes('Decodo API Error')) {
            // Extract just the meaningful part of the error
            const match = userMessage.match(/Decodo API Error: \d+ .+ - (.+)/);
            if (match) {
                userMessage = match[1];
            }
        }

        return {
            success: false,
            message: userMessage,
            fieldError
        };
    }
};

export const getProductDetailsFromWeb = async (url: string) => {
    await checkAdmin();
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/firecrawl/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const result = await response.json();

        return {
            success: result.success,
            data: result.data || null,
            errors: result.errors || [],
            message: result.message,
        };
    } catch (error: any) {
        console.error('Firecrawl Error:', error);
        return {
            success: false,
            data: null,
            errors: [error.message],
            message: 'Failed to scrape product data',
        };
    }
};

// Helper to check existing products
async function checkExistingAsins(asins: string[]) {
    if (asins.length === 0) return {};
    
    const data = await db
        .select({
            asin: specificProducts.asin,
            masterItemName: masterItems.name,
            categoryId: categories.id,
            categoryName: categories.name,
            parentId: categories.parentId,
        })
        .from(specificProducts)
        .leftJoin(masterItems, eq(specificProducts.masterItemId, masterItems.id))
        .leftJoin(categories, eq(masterItems.categoryId, categories.id))
        .where(inArray(specificProducts.asin, asins.filter(a => a !== null) as string[]));
    
    // Get parent categories if needed
    const parentIds = data.map(d => d.parentId).filter(Boolean) as string[];
    const parentCategories = parentIds.length > 0 
      ? await db
          .select({ id: categories.id, name: categories.name })
          .from(categories)
          .where(inArray(categories.id, parentIds))
      : [];
    
    const parentMap = new Map(parentCategories.map(p => [p.id, p.name]));
    
    const map: Record<string, any> = {};
    data.forEach((item) => {
        if (item.asin) {
            map[item.asin] = {
                asin: item.asin,
                master_item: {
                    name: item.masterItemName,
                    category: {
                        id: item.categoryId,
                        name: item.categoryName,
                        parent: item.parentId ? { name: parentMap.get(item.parentId) } : null,
                    },
                },
            };
        }
    });
    return map;
}

export const searchProductsFromAmazon = async (query: string) => {
    await checkAdmin();
    try {
        const results = await searchDecodoProducts(query);

        if (results.length === 0) {
            return { success: false, message: "No results found via Decodo." };
        }

        // Check for existing products
        const asins = results.map(r => r.asin).filter(a => !!a);
        const existingMap = await checkExistingAsins(asins);

        // Enrich results
        const enrichedResults = results.map(r => {
            const capacity = extractCapacity(r.title);
            
            const enriched = {
                name: r.title,
                asin: r.asin,
                image_url: r.image_url,
                price: r.price,
                url: r.store_url,
                rating: r.rating,
                reviews: r.reviews,
                description: r.description,
                capacity_value: capacity.value,
                capacity_unit: capacity.unit,
                is_existing: false,
                existing_path: undefined as string | undefined
            };

            if (r.asin && existingMap[r.asin]) {
                const existing = existingMap[r.asin];
                const masterName = existing.master_item?.name || 'Unknown Master Item';
                const catName = existing.master_item?.category?.name || 'Unknown Category';
                const parentCatName = existing.master_item?.category?.parent?.name;
                
                const path = parentCatName 
                    ? `${parentCatName} > ${catName} > ${masterName}`
                    : `${catName} > ${masterName}`;

                enriched.is_existing = true;
                enriched.existing_path = path;
            }
            return enriched;
        });

        return { success: true, data: enrichedResults };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
};
