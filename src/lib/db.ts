import { supabase } from './supabaseClient';
import { Product } from '@/types';

/**
 * Legacy database utilities using Supabase REST API
 *
 * NOTE: For user profile queries, use @/db/queries/users instead (Drizzle ORM)
 * TODO: Migrate product queries to Drizzle ORM for consistency
 */
export const db = {
  // --- Products ---
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    // Map snake_case DB columns to camelCase TypeScript interface
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      rating: item.rating,
      image: item.image,
      type: item.type,
      description: item.description,
      affiliateLink: item.affiliate_link,
      category: item.category
    })) as Product[];
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
    // Map camelCase to snake_case for DB insertion
    const dbPayload = {
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      image: product.image,
      type: product.type,
      affiliate_link: product.affiliateLink,
      rating: product.rating
    };

    const { data, error } = await supabase
      .from('products')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      throw error;
    }

    // Map back to camelCase for the return
    return {
      id: data.id,
      name: data.name,
      price: data.price,
      rating: data.rating,
      image: data.image,
      type: data.type,
      description: data.description,
      affiliateLink: data.affiliate_link,
      category: data.category
    };
  },

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return false;
    }
    return true;
  },

  async searchAmazon(query: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/search?engine=amazon&query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        console.error('Search API error:', response.statusText);
        return [];
      }
      const data = await response.json();
      return data.organic_results || [];
    } catch (error) {
      console.error('Error searching Amazon:', error);
      return [];
    }
  }
};
