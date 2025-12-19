/**
 * Custom hook for managing product filtering and sorting state
 *
 * Handles all filter/sort state and provides filtered/sorted product lists.
 * Extracts ~150 lines of state management from main component.
 */

"use client";

import { useState, useMemo } from "react";
import type { Product, MasterItem } from "@/lib/products-types";

export interface UseProductFiltersReturn {
  // Filter state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  selectedSuppliers: string[];
  setSelectedSuppliers: (suppliers: string[]) => void;
  filterPriceRange: string;
  setFilterPriceRange: (range: string) => void;

  // Sort state
  sortField: string;
  setSortField: (field: string) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  handleSort: (field: string) => void;

  // Derived data
  processedProducts: Product[];
  hasActiveFilters: boolean;
}

/**
 * Manages product filtering and sorting state
 *
 * @param products - Array of all products to filter/sort
 * @param masterItems - Array of master items (for tag inheritance)
 * @returns Object containing filter state, setters, and derived filtered/sorted products
 */
export function useProductFilters(
  products: Product[],
  masterItems: MasterItem[]
): UseProductFiltersReturn {
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [filterPriceRange, setFilterPriceRange] = useState("");

  // Sort state
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("asc");

  // Sort toggle handler
  const handleSort = (field: string): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort products
  const processedProducts = useMemo(() => {
    let result = products.filter(p => {
      // Text Search (includes master item name and description)
      let matchesSearch = true;
      const term = searchTerm.toLowerCase();
      
      if (term) {
        // Find associated master item
        const master = masterItems.find(m => m.id === p.masterItemId);

        // Check product fields
        const productMatches = (
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.sku && p.sku.toLowerCase().includes(term)) ||
          (p.asin && p.asin.toLowerCase().includes(term)) ||
          (p.description && p.description.toLowerCase().includes(term)) ||
          (p.supplier?.name && p.supplier.name.toLowerCase().includes(term))
        );

        // Check master item fields (OR relationship)
        const masterItemMatches = master && (
          (master.name && master.name.toLowerCase().includes(term)) ||
          (master.description && master.description.toLowerCase().includes(term))
        );

        matchesSearch = productMatches || masterItemMatches;
      }

      // Tag Filter (with include/exclude support)
      let matchesTags = true;
      if (selectedTags.length > 0) {
        const master = masterItems.find(m => m.id === p.masterItemId);
        const allProductTags = new Set([
          ...(p.scenarios || master?.scenarios || []),
          ...(p.demographics || master?.demographics || []),
          ...(p.timeframes || master?.timeframes || []),
          ...(p.locations || master?.locations || []),
          ...(master?.scenarios || []),
          ...(master?.demographics || []),
          ...(master?.timeframes || []),
          ...(master?.locations || [])
        ]);

        const includeTags = selectedTags.filter(t => !t.startsWith('!')).map(t => t);
        const excludeTags = selectedTags.filter(t => t.startsWith('!')).map(t => t.slice(1));

        const hasAllInclude = includeTags.every(tag => allProductTags.has(tag));
        const hasNoExclude = excludeTags.every(tag => !allProductTags.has(tag));
        matchesTags = hasAllInclude && hasNoExclude;
      }

      // Supplier Filter (with include/exclude support)
      let matchesSupplier = true;
      if (selectedSuppliers.length > 0) {
        const includeSuppliers = selectedSuppliers.filter(s => !s.startsWith('!')).map(s => s);
        const excludeSuppliers = selectedSuppliers.filter(s => s.startsWith('!')).map(s => s.slice(1));

        const supplierId = p.supplierId || '';

        // If there are include suppliers, must match one of them
        const matchesInclude = includeSuppliers.length === 0 || includeSuppliers.includes(supplierId);
        // Must not match any exclude suppliers
        const matchesExclude = !excludeSuppliers.includes(supplierId);
        matchesSupplier = matchesInclude && matchesExclude;
      }

      // Price Filter
      let matchesPrice = true;
      if (filterPriceRange) {
        const price = Number(p.price) || 0;
        if (filterPriceRange === "0-50") matchesPrice = price < 50;
        else if (filterPriceRange === "50-100") matchesPrice = price >= 50 && price <= 100;
        else if (filterPriceRange === "100-500") matchesPrice = price > 100 && price <= 500;
        else if (filterPriceRange === "500+") matchesPrice = price > 500;
      }

      return matchesSearch && matchesTags && matchesSupplier && matchesPrice;
    });

    // Sorting
    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      // Handle each sort field explicitly (type-safe)
      if (sortField === 'name') {
        valA = a.name || '';
        valB = b.name || '';
      } else if (sortField === 'supplier') {
        valA = a.supplier?.name || '';
        valB = b.supplier?.name || '';
      } else if (sortField === 'master_item') {
        const masterA = masterItems.find(m => m.id === a.masterItemId);
        const masterB = masterItems.find(m => m.id === b.masterItemId);
        valA = masterA?.name || '';
        valB = masterB?.name || '';
      } else if (sortField === 'price') {
        valA = Number(a.price) || 0;
        valB = Number(b.price) || 0;
      } else if (sortField === 'sku') {
        valA = a.sku || '';
        valB = b.sku || '';
      } else if (sortField === 'asin') {
        valA = a.asin || '';
        valB = b.asin || '';
      }

      // Handle price sorting
      if (sortField === 'price') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchTerm, selectedTags, selectedSuppliers, filterPriceRange, sortField, sortDirection, masterItems]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" ||
           selectedTags.length > 0 ||
           selectedSuppliers.length > 0 ||
           filterPriceRange !== "";
  }, [searchTerm, selectedTags, selectedSuppliers, filterPriceRange]);

  return {
    // Filter state
    searchTerm,
    setSearchTerm,
    selectedTags,
    setSelectedTags,
    selectedSuppliers,
    setSelectedSuppliers,
    filterPriceRange,
    setFilterPriceRange,

    // Sort state
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    handleSort,

    // Derived data
    processedProducts,
    hasActiveFilters,
  };
}
