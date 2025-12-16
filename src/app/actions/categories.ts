'use server';

import { db } from '@/db';
import { categories } from '@/db/schema/categories';
import { masterItems, specificProducts } from '@/db/schema/products';
import { eq, sql, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Type definitions
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  icon: string | null;
  createdAt: Date;
  children?: Category[];
  master_items_count?: number;
}

export interface MasterItemData {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  status: string;
  timeframes: string[] | null;
  demographics: string[] | null;
  locations: string[] | null;
  scenarios: string[] | null;
  specific_products?: unknown[];
}

export async function createCategory(
  name: string,
  parentId: string | null,
  description: string,
  icon: string = '🗂️'
): Promise<{ success: boolean; data?: Category; message?: string }> {
  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const [newCategory] = await db.insert(categories).values({
      name,
      parentId,
      slug,
      description,
      icon,
    }).returning();

    revalidatePath('/admin/categories');
    return { success: true, data: newCategory as Category };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateCategory(
  id: string,
  updates: {
    name?: string;
    description?: string;
    icon?: string;
    parent_id?: string;
  }
): Promise<{ success: boolean; data?: Category; message?: string }> {
  try {
    const updateData: {
      name?: string;
      slug?: string;
      description?: string;
      icon?: string;
      parentId?: string;
    } = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
      updateData.slug = updates.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    if (updates.icon !== undefined) {
      updateData.icon = updates.icon;
    }
    if (updates.parent_id !== undefined) {
      updateData.parentId = updates.parent_id;
    }

    const [updatedCategory] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    revalidatePath('/admin/categories');
    return { success: true, data: updatedCategory as Category };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Check for child categories that would become orphaned
    const [childCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(categories)
      .where(eq(categories.parentId, id));

    if (childCount.count > 0) {
      return {
        success: false,
        message: `Cannot delete: ${childCount.count} subcategories must be moved or deleted first`
      };
    }

    // Check for master items that would lose their category
    const [itemCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(masterItems)
      .where(eq(masterItems.categoryId, id));

    if (itemCount.count > 0) {
      return {
        success: false,
        message: `Cannot delete: ${itemCount.count} master items must be moved or deleted first`
      };
    }

    // Safe to delete - no dependencies exist
    await db.delete(categories).where(eq(categories.id, id));

    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getCategoryTree(): Promise<Category[]> {
  try {
    // Fetch all categories with master item counts
    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId,
        description: categories.description,
        icon: categories.icon,
        createdAt: categories.createdAt,
        master_items_count: sql<number>`count(${masterItems.id})::int`,
      })
      .from(categories)
      .leftJoin(masterItems, eq(masterItems.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(categories.name);

    // Build tree structure
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    // Initialize nodes
    allCategories.forEach(cat => {
      map.set(cat.id, {
        ...cat,
        children: [],
        master_items_count: cat.master_items_count || 0,
      });
    });

    // Link children to parents
    allCategories.forEach(cat => {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  } catch (error) {
    console.error('getCategoryTree error:', error);
    return [];
  }
}

export async function getCategoryImpact(categoryId: string): Promise<{
  success: boolean;
  data?: {
    subcategoryCount: number;
    masterItemCount: number;
    affectedItems: Array<{ id: string; name: string }>;
  };
  message?: string;
}> {
  try {
    // Get all descendant categories recursively
    const allCategories = await db.select().from(categories);
    
    const getDescendants = (parentId: string): string[] => {
      const children = allCategories.filter(c => c.parentId === parentId);
      let descendants = children.map(c => c.id);
      
      for (const child of children) {
        descendants = descendants.concat(getDescendants(child.id));
      }
      
      return descendants;
    };

    const affectedCategoryIds = [categoryId, ...getDescendants(categoryId)];
    
    // Get affected master items
    const affectedItems = await db
      .select({
        id: masterItems.id,
        name: masterItems.name,
      })
      .from(masterItems)
      .where(inArray(masterItems.categoryId, affectedCategoryIds))
      .limit(5);

    const [itemCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(masterItems)
      .where(inArray(masterItems.categoryId, affectedCategoryIds));

    return {
      success: true,
      data: {
        subcategoryCount: affectedCategoryIds.length - 1,
        masterItemCount: itemCountResult?.count || 0,
        affectedItems: affectedItems || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      data: {
        subcategoryCount: 0,
        masterItemCount: 0,
        affectedItems: [],
      },
    };
  }
}

export async function getProductsByCategory(categoryIds: string[]): Promise<{
  success: boolean;
  data?: MasterItemData[];
  message?: string;
}> {
  try {
    const items = await db
      .select()
      .from(masterItems)
      .where(inArray(masterItems.categoryId, categoryIds))
      .orderBy(masterItems.name);

    // Fetch specific products for each master item
    const itemIds = items.map(item => item.id);
    const products = await db
      .select()
      .from(specificProducts)
      .where(inArray(specificProducts.masterItemId, itemIds));

    // Group products by master item
    const productsMap = new Map<string, unknown[]>();
    products.forEach(product => {
      const existing = productsMap.get(product.masterItemId) || [];
      existing.push(product);
      productsMap.set(product.masterItemId, existing);
    });

    const result = items.map(item => ({
      ...item,
      specific_products: productsMap.get(item.id) || [],
    }));

    return { success: true, data: result as MasterItemData[] };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function upsertMasterItem(item: {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  category_id?: string;
  categoryId?: string;
  timeframes?: string[] | null;
  demographics?: string[] | null;
  locations?: string[] | null;
  scenarios?: string[] | null;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: {
      id?: string;
      name?: string;
      description?: string | null;
      status?: string;
      categoryId?: string;
      timeframes?: string[] | null;
      demographics?: string[] | null;
      locations?: string[] | null;
      scenarios?: string[] | null;
    } = {};

    if (item.id) payload.id = item.id;
    if (item.name) payload.name = item.name;
    if (item.description !== undefined) payload.description = item.description || null;
    if (item.status) payload.status = item.status;
    if (item.category_id) payload.categoryId = item.category_id;
    if (item.timeframes !== undefined) payload.timeframes = item.timeframes || null;
    if (item.demographics !== undefined) payload.demographics = item.demographics || null;
    if (item.locations !== undefined) payload.locations = item.locations || null;
    if (item.scenarios !== undefined) payload.scenarios = item.scenarios || null;

    if (item.id) {
      // Update existing
      await db
        .update(masterItems)
        .set(payload)
        .where(eq(masterItems.id, item.id));
    } else {
      // Insert new
      if (!payload.name || !payload.categoryId) {
        return { success: false, error: 'Name and category are required' };
      }
      await db.insert(masterItems).values({
        name: payload.name,
        categoryId: payload.categoryId,
        description: payload.description,
        status: payload.status || 'active',
        timeframes: payload.timeframes,
        demographics: payload.demographics,
        locations: payload.locations,
        scenarios: payload.scenarios,
      });
    }

    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function moveMasterItem(
  masterItemId: string,
  targetCategoryId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await db
      .update(masterItems)
      .set({ categoryId: targetCategoryId })
      .where(eq(masterItems.id, masterItemId));

    revalidatePath('/admin/categories');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
