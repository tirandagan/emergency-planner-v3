/**
 * Custom hook for managing category tree navigation state
 *
 * Handles expand/collapse state for categories and subcategories,
 * plus active selection tracking.
 */

"use client";

import { useState, useCallback } from "react";
import type { Category } from "@/lib/products-types";

export interface UseCategoryNavigationReturn {
  expandedCategories: Set<string>;
  expandedSubCategories: Set<string>;
  activeCategoryId: string | null;
  activeMasterItemId: string | null;
  toggleCategory: (catId: string) => void;
  toggleSubCategory: (subCatId: string) => void;
  expandAll: (categoryIds: string[], subCategoryIds: string[]) => void;
  collapseAll: () => void;
  handleCategorySelect: (catId: string) => void;
  handleMasterItemSelect: (masterItemId: string) => void;
}

/**
 * Manages category tree navigation state
 *
 * @param categories - Array of all categories
 * @returns Object containing navigation state and handlers
 */
export function useCategoryNavigation(
  categories: Category[]
): UseCategoryNavigationReturn {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeMasterItemId, setActiveMasterItemId] = useState<string | null>(null);

  const toggleCategory = useCallback((catId: string): void => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  }, []);

  const toggleSubCategory = useCallback((subCatId: string): void => {
    setExpandedSubCategories(prev => {
      const next = new Set(prev);
      if (next.has(subCatId)) {
        next.delete(subCatId);
      } else {
        next.add(subCatId);
      }
      return next;
    });
  }, []);

  const handleCategorySelect = useCallback((catId: string): void => {
    setActiveCategoryId(prev => prev === catId ? null : catId);
    setActiveMasterItemId(null); // Clear master item selection when category changes
  }, []);

  const handleMasterItemSelect = useCallback((masterItemId: string): void => {
    setActiveMasterItemId(prev => prev === masterItemId ? null : masterItemId);
  }, []);

  const expandAll = useCallback((categoryIds: string[], subCategoryIds: string[]): void => {
    setExpandedCategories(new Set(categoryIds));
    setExpandedSubCategories(new Set(subCategoryIds));
  }, []);

  const collapseAll = useCallback((): void => {
    setExpandedCategories(new Set());
    setExpandedSubCategories(new Set());
  }, []);

  return {
    expandedCategories,
    expandedSubCategories,
    activeCategoryId,
    activeMasterItemId,
    toggleCategory,
    toggleSubCategory,
    expandAll,
    collapseAll,
    handleCategorySelect,
    handleMasterItemSelect,
  };
}
