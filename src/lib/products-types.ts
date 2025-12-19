/**
 * Type definitions for the Admin Products page
 *
 * This file contains all TypeScript interfaces and types used across
 * the product catalog management system.
 */

// --- Core Domain Types ---

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  icon: string | null;
  createdAt?: Date;
}

export interface MasterItem {
  id: string;
  name: string;
  categoryId: string;
  description: string | null;
  timeframes: string[] | null;
  demographics: string[] | null;
  locations: string[] | null;
  scenarios: string[] | null;
}

export interface Supplier {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  asin?: string | null;
  price?: string | number | null;
  type?: string | null;
  productUrl?: string | null;
  imageUrl?: string | null;
  masterItemId: string;
  supplierId: string | null;
  supplier?: { name: string } | null;
  masterItem?: { name: string } | null;
  metadata?: unknown;
  timeframes?: string[] | null;
  demographics?: string[] | null;
  locations?: string[] | null;
  scenarios?: string[] | null;
  variations?: unknown;
}

// --- Component Props Types ---

export interface ProductsClientProps {
  products: Product[];
  masterItems: MasterItem[];
  suppliers: Supplier[];
  categories: Category[];
}

// --- State Shape Types ---

export interface FilterState {
  searchTerm: string;
  selectedTags: string[];
  selectedSuppliers: string[];
  priceRange: string;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// --- Icon Types ---

export type IconType =
  | 'user'
  | 'users'
  | 'zap'
  | 'radiation'
  | 'alertTriangle'
  | 'cloud'
  | 'baby'
  | 'userCheck'
  | 'venus'
  | 'mars';

export type FormattedTagValue = string | { icon: IconType };
