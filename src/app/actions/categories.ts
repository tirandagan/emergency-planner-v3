'use server';

import { db } from '@/db';
import { categories } from '@/db/schema/categories';
import { masterItems, specificProducts } from '@/db/schema/products';
import { eq, sql, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { checkAdmin } from '@/lib/adminAuth';
import { buildChangeEntry, addChangeEntry } from '@/lib/change-tracking';

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
  description: string | null,
  icon: string = '🗂️'
): Promise<{ success: boolean; data?: Category; message?: string }> {
  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const [newCategory] = await db.insert(categories).values({
      name,
      parentId,
      slug,
      description: description || null, // Convert empty string to null
      icon,
    }).returning();

    revalidatePath('/admin/products', 'page');

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
    const user = await checkAdmin();

    // Fetch existing category data for change tracking
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

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

    // Build change history entry
    const changeEntry = buildChangeEntry(existingCategory, updateData, user);

    // Add change entry to history if changes were detected
    let updatedChangeHistory = existingCategory?.changeHistory as any;
    if (changeEntry) {
      updatedChangeHistory = addChangeEntry(existingCategory?.changeHistory as any, changeEntry);
    }

    const [updatedCategory] = await db
      .update(categories)
      .set({
        ...updateData,
        changeHistory: updatedChangeHistory,
      })
      .where(eq(categories.id, id))
      .returning();

    return { success: true, data: updatedCategory as Category };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
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

    const affectedCategoryIds = [id, ...getDescendants(id)];

    // Get all master items in affected categories
    const affectedMasterItems = await db
      .select({ id: masterItems.id })
      .from(masterItems)
      .where(inArray(masterItems.categoryId, affectedCategoryIds));

    const masterItemIds = affectedMasterItems.map(mi => mi.id);

    // CASCADE DELETE:
    // 1. Delete all specific products under these master items
    if (masterItemIds.length > 0) {
      await db
        .delete(specificProducts)
        .where(inArray(specificProducts.masterItemId, masterItemIds));
    }

    // 2. Delete all master items in affected categories
    if (affectedCategoryIds.length > 0) {
      await db
        .delete(masterItems)
        .where(inArray(masterItems.categoryId, affectedCategoryIds));
    }

    // 3. Delete all subcategories
    const subcategoryIds = affectedCategoryIds.filter(catId => catId !== id);
    if (subcategoryIds.length > 0) {
      await db
        .delete(categories)
        .where(inArray(categories.id, subcategoryIds));
    }

    // 4. Finally delete the target category
    await db.delete(categories).where(eq(categories.id, id));

    revalidatePath('/admin/products');
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
    categoryTree: Array<{
      id: string;
      name: string;
      icon: string | null;
      subcategories: Array<{
        id: string;
        name: string;
        icon: string | null;
        masterItems: Array<{
          id: string;
          name: string;
          productCount: number;
        }>;
      }>;
      masterItems: Array<{
        id: string;
        name: string;
        productCount: number;
      }>;
    }>;
    totalMasterItems: number;
    totalProducts: number;
  };
  message?: string;
}> {
  try {
    // Get the target category and all its descendants
    const allCategories = await db.select().from(categories);
    const targetCategory = allCategories.find(c => c.id === categoryId);

    if (!targetCategory) {
      throw new Error('Category not found');
    }

    const getDescendants = (parentId: string): string[] => {
      const children = allCategories.filter(c => c.parentId === parentId);
      let descendants = children.map(c => c.id);

      for (const child of children) {
        descendants = descendants.concat(getDescendants(child.id));
      }

      return descendants;
    };

    const affectedCategoryIds = [categoryId, ...getDescendants(categoryId)];

    // Get all master items with product counts for affected categories
    const allMasterItems = await db
      .select({
        id: masterItems.id,
        name: masterItems.name,
        categoryId: masterItems.categoryId,
        productCount: sql<number>`count(${specificProducts.id})::int`,
      })
      .from(masterItems)
      .leftJoin(specificProducts, eq(specificProducts.masterItemId, masterItems.id))
      .where(inArray(masterItems.categoryId, affectedCategoryIds))
      .groupBy(masterItems.id, masterItems.name, masterItems.categoryId)
      .orderBy(masterItems.name);

    // Build tree structure
    const categoryTree: Array<{
      id: string;
      name: string;
      icon: string | null;
      subcategories: Array<{
        id: string;
        name: string;
        icon: string | null;
        masterItems: Array<{ id: string; name: string; productCount: number }>;
      }>;
      masterItems: Array<{ id: string; name: string; productCount: number }>;
    }> = [];

    // If deleting a root category, show it with all subcategories
    if (!targetCategory.parentId) {
      const subcats = allCategories.filter(c => c.parentId === categoryId);
      categoryTree.push({
        id: targetCategory.id,
        name: targetCategory.name,
        icon: targetCategory.icon,
        subcategories: subcats.map(subcat => ({
          id: subcat.id,
          name: subcat.name,
          icon: subcat.icon,
          masterItems: allMasterItems
            .filter(mi => mi.categoryId === subcat.id)
            .map(mi => ({ id: mi.id, name: mi.name, productCount: mi.productCount })),
        })),
        masterItems: allMasterItems
          .filter(mi => mi.categoryId === categoryId)
          .map(mi => ({ id: mi.id, name: mi.name, productCount: mi.productCount })),
      });
    } else {
      // Deleting a subcategory - show parent with this subcategory highlighted
      const parent = allCategories.find(c => c.id === targetCategory.parentId);
      if (parent) {
        categoryTree.push({
          id: parent.id,
          name: parent.name,
          icon: parent.icon,
          subcategories: [{
            id: targetCategory.id,
            name: targetCategory.name,
            icon: targetCategory.icon,
            masterItems: allMasterItems
              .filter(mi => mi.categoryId === categoryId)
              .map(mi => ({ id: mi.id, name: mi.name, productCount: mi.productCount })),
          }],
          masterItems: [],
        });
      }
    }

    const totalMasterItems = allMasterItems.length;
    const totalProducts = allMasterItems.reduce((sum, item) => sum + item.productCount, 0);

    return {
      success: true,
      data: {
        categoryTree,
        totalMasterItems,
        totalProducts,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
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

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
