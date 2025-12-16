import { supabase } from './supabaseClient';
import { Product, User } from '@/types';

export const db = {
  // --- Auth & User ---
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Profiles table might not exist yet during initial setup
      // Only log if it's not a "relation does not exist" error
      if (error.code !== 'PGRST116' && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        console.error('Error fetching profile:', error);
      }
      return null;
    }

    return {
      id: data.id,
      email: data.email, // Note: Profile might not store email if using auth table, but we can merge it in AuthContext
      name: data.full_name,
      firstName: data.first_name,
      lastName: data.last_name,
      birthYear: data.birth_year,
      role: data.role as 'ADMIN' | 'USER'
    };
  },

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
