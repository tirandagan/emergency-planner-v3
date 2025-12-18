"use server";

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateEmbedding } from '@/lib/embeddings';
import { generateObject } from 'ai';
import { getModel } from '@/lib/openrouter';
import { z } from 'zod';

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  icon: string;
  children?: Category[];
  master_items_count?: number;
}

export const getCategoryTree = async (): Promise<Category[]> => {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, parent_id, description, icon, master_items(count)')
      .order('name');

    if (error || !categories) {
        console.error("Error fetching categories", error);
        return [];
    }

    // Build tree
    const map = new Map<string, Category>();
    const roots: Category[] = [];

    // 1. Initialize nodes
    categories.forEach(c => {
      map.set(c.id, {
        ...c,
        children: [],
        master_items_count: c.master_items?.[0]?.count || 0
      });
    });

    // 2. Link children
    categories.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  } catch (e) {
    console.error("getCategoryTree exception:", e);
    return [];
  }
};

export const getCategoryImpact = async (categoryId: string) => {
    try {
        // Recursive query to get all descendant category IDs
        const { data: descendants, error: descError } = await supabaseAdmin.rpc('get_category_descendants', {
            category_id: categoryId
        });

        if (descError) {
            console.warn('get_category_descendants RPC not available, using simple count');
            // Fallback: just count direct children and items
            const { data: children } = await supabaseAdmin
                .from('categories')
                .select('id')
                .eq('parent_id', categoryId);

            const affectedCategoryIds = [categoryId, ...(children?.map(c => c.id) || [])];

            const { data: items } = await supabaseAdmin
                .from('master_items')
                .select('id, name')
                .in('category_id', affectedCategoryIds)
                .limit(5);

            const { count: itemCount } = await supabaseAdmin
                .from('master_items')
                .select('*', { count: 'exact', head: true })
                .in('category_id', affectedCategoryIds);

            return {
                success: true,
                data: {
                    subcategoryCount: children?.length || 0,
                    masterItemCount: itemCount || 0,
                    affectedItems: items || []
                }
            };
        }

        // Use RPC result if available
        const affectedCategoryIds = descendants?.map((d: { id: string }) => d.id) || [categoryId];

        const { data: items } = await supabaseAdmin
            .from('master_items')
            .select('id, name')
            .in('category_id', affectedCategoryIds)
            .limit(5);

        const { count: itemCount } = await supabaseAdmin
            .from('master_items')
            .select('*', { count: 'exact', head: true })
            .in('category_id', affectedCategoryIds);

        const subcategoryCount = affectedCategoryIds.length - 1; // Exclude the category itself

        return {
            success: true,
            data: {
                subcategoryCount,
                masterItemCount: itemCount || 0,
                affectedItems: items || []
            }
        };
    } catch (e) {
        return {
            success: false,
            message: e instanceof Error ? e.message : 'Unknown error',
            data: {
                subcategoryCount: 0,
                masterItemCount: 0,
                affectedItems: []
            }
        };
    }
};

export const createCategory = async (name: string, parentId: string | null, description?: string) => {
    try {
        const { data, error } = await supabaseAdmin.from('categories').insert({
            name,
            parent_id: parentId,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            description: description || null
        }).select().single();

        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
};

export const updateCategory = async (id: string, updates: { name?: string, parent_id?: string | null }) => {
    try {
        const payload: {
            name?: string;
            slug?: string;
            parent_id?: string | null;
        } = { ...updates };
        if (updates.name) {
            payload.slug = updates.name.toLowerCase().replace(/\s+/g, '-');
        }

        const { error } = await supabaseAdmin
            .from('categories')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
};

export const deleteCategory = async (id: string) => {
    try {
        const { error } = await supabaseAdmin
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
};

export const mergeCategories = async (sourceId: string, targetId: string) => {
    try {
        const { error } = await supabaseAdmin.rpc('merge_categories', {
            source_cat_id: sourceId,
            target_cat_id: targetId
        });
        if (error) throw error;
        return { success: true };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
};

export const updateCategoryDescription = async (id: string, description: string) => {
    try {
        const { error } = await supabaseAdmin
            .from('categories')
            .update({ description })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
};


export const autoCategorizeBatch = async () => {
    try {
        const { data: items, error } = await supabaseAdmin
            .from('master_items')
            .select('id, name, description')
            .is('category_id', null)
            .limit(50);

        if (error) throw error;
        if (!items || items.length === 0) return { success: true, message: "No uncategorized items found." };

        const { data: cats } = await supabaseAdmin.from('categories').select('id, name, parent_id');
        const existingCatsStr = cats?.map(c => `${c.name} (ID: ${c.id})`).join(', ') || "None";

        const prompt = `
        You are an inventory manager. Categorize these survival items.

        Existing Categories: ${existingCatsStr}

        Items to Categorize:
        ${items.map(i => `- ${i.name}: ${i.description?.substring(0, 50)} (ID: ${i.id})`).join('\n')}

        Task:
        Assign a category to each item.
        - If an existing category fits well, use its Name.
        - If NO existing category fits, propose a NEW category name (Format: "Parent:Child" or just "Name").
        `;

        const { object: result } = await generateObject({
            model: getModel('GEMINI_FLASH'),
            prompt,
            schema: z.object({
                mappings: z.array(z.object({
                    item_id: z.string(),
                    category_name: z.string(),
                    is_new: z.boolean(),
                    parent_name: z.string().optional()
                }))
            })
        });
        
        if (!result.mappings) return { success: false, message: "Invalid LLM response" };

        let updated = 0;
        let created = 0;

        for (const m of result.mappings) {
            let catId: string | undefined;
            const match = cats?.find(c => c.name.toLowerCase() === m.category_name.toLowerCase());
            if (match) {
                catId = match.id;
            } else {
                const { data: newCat } = await supabaseAdmin.from('categories').insert({
                    name: m.category_name,
                    slug: m.category_name.toLowerCase().replace(/\s+/g, '-')
                }).select().single();
                if (newCat) {
                    catId = newCat.id;
                    created++;
                }
            }

            if (catId) {
                await supabaseAdmin.from('master_items').update({ category_id: catId }).eq('id', m.item_id);
                updated++;
            }
        }

        return { success: true, message: `Categorized ${updated} items. Created ${created} new categories.` };

    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
};

export const getProductsByCategory = async (categoryIds: string[]) => {
    try {
        const { data: masterItems, error } = await supabaseAdmin
            .from('master_items')
            .select(`
                *,
                specific_products (*)
            `)
            .in('category_id', categoryIds)
            .order('name');

        if (error) throw error;
        return { success: true, data: masterItems };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
};

export const upsertMasterItem = async (item: {
    id?: string;
    name?: string;
    description?: string;
    status?: string;
    category_id?: string;
    timeframes?: unknown;
    demographics?: unknown;
    locations?: unknown;
    scenarios?: unknown;
}) => {
    try {
        // Prepare payload, removing UI-specific fields if any, though 'item' likely matches DB schema
        const payload: {
            id?: string;
            name?: string;
            description?: string;
            status?: string;
            category_id?: string;
            timeframes?: unknown;
            demographics?: unknown;
            locations?: unknown;
            scenarios?: unknown;
            embedding?: number[];
        } = {
            id: item.id,
            name: item.name,
            description: item.description,
            status: item.status,
            category_id: item.category_id,
            timeframes: item.timeframes,
            demographics: item.demographics,
            locations: item.locations,
            scenarios: item.scenarios
        };

        // Generate new embedding if name or description changed
        if (item.name || item.description) {
             const text = `${item.name || ''}: ${item.description || ''}`;
             try {
                 const embedding = await generateEmbedding(text);
                 payload.embedding = embedding;
             } catch (embError) {
                 console.warn("Failed to generate embedding during upsert:", embError);
             }
        }

        const { error } = await supabaseAdmin
            .from('master_items')
            .upsert(payload)
            .select()
            .single();

        if (error) throw error;
        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
};

export const moveMasterItem = async (masterItemId: string, targetCategoryId: string) => {
    try {
        const { error } = await supabaseAdmin
            .from('master_items')
            .update({ category_id: targetCategoryId })
            .eq('id', masterItemId);

        if (error) throw error;
        return { success: true };
    } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Unknown error' };
    }
};
