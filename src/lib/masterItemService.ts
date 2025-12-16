"use server";

import { generateEmbedding } from '@/lib/embeddings';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface MasterItemResolution {
  master_item_id: string;
  is_new: boolean;
  confidence_score: number;
}

/**
 * Resolves a generic item name/description to a Master Item ID.
 * 1. Checks vector similarity (threshold > 0.85)
 * 2. If match, returns ID.
 * 3. If no match, creates new Master Item (pending_review).
 */
export const resolveMasterItem = async (
  name: string, 
  description: string,
  autoCreate: boolean = true
): Promise<MasterItemResolution | null> => {
  try {
    const embedding = await generateEmbedding(`${name}: ${description}`);

    // 1. Vector Search
    const { data: matches, error } = await supabaseAdmin.rpc('match_master_items', {
      query_embedding: embedding,
      match_threshold: 0.85,
      match_count: 1
    });

    if (error) {
      console.error('Error resolving master item:', error);
      return null; // Fail safe
    }

    // 2. Match Found
    if (matches && matches.length > 0) {
      return {
        master_item_id: matches[0].id,
        is_new: false,
        confidence_score: matches[0].similarity
      };
    }

    // 3. No Match -> Create New (if allowed)
    // TEMPORARY: AI Creation disabled as per requirements. Only Admins create master items now.
    if (false && autoCreate) {
      const { data: newItem, error: insertError } = await supabaseAdmin
        .from('master_items')
        .insert({
          name,
          description,
          embedding,
          status: 'active' // Changed from pending_review, though currently disabled
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating new master item:', insertError);
        return null;
      }

      return {
        master_item_id: newItem.id,
        is_new: true,
        confidence_score: 1.0
      };
    }

    return null;

  } catch (e) {
    console.error('Exception resolving master item:', e);
    return null;
  }
};

