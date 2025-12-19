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
  expandedMasterItems: Set<string>;
  activeCategoryId: string | null;
  activeMasterItemId: string | null;
  toggleCategory: (catId: string) => void;
  toggleSubCategory: (subCatId: string) => void;
  toggleMasterItem: (masterItemId: string) => void;
  expandCategory: (catId: string) => void;
  expandSubCategory: (subCatId: string) => void;
  expandMasterItem: (masterItemId: string) => void;
  expandAll: (categoryIds: string[], subCategoryIds: string[], masterItemIds: string[]) => void;
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
  const [expandedMasterItems, setExpandedMasterItems] = useState<Set<string>>(new Set());
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

  const expandCategory = useCallback((catId: string): void => {
    setExpandedCategories(prev => {
      if (prev.has(catId)) return prev; // Already expanded
      const next = new Set(prev);
      next.add(catId);
      return next;
    });
  }, []);

  const expandSubCategory = useCallback((subCatId: string): void => {
    setExpandedSubCategories(prev => {
      if (prev.has(subCatId)) return prev; // Already expanded
      const next = new Set(prev);
      next.add(subCatId);
      return next;
    });
  }, []);

  const toggleMasterItem = useCallback((masterItemId: string): void => {
    setExpandedMasterItems(prev => {
      const next = new Set(prev);
      if (next.has(masterItemId)) {
        next.delete(masterItemId);
      } else {
        next.add(masterItemId);
      }
      return next;
    });
  }, []);

  const expandMasterItem = useCallback((masterItemId: string): void => {
    setExpandedMasterItems(prev => {
      if (prev.has(masterItemId)) return prev; // Already expanded
      const next = new Set(prev);
      next.add(masterItemId);
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

  const expandAll = useCallback((categoryIds: string[], subCategoryIds: string[], masterItemIds: string[]): void => {
    setExpandedCategories(new Set(categoryIds));
    setExpandedSubCategories(new Set(subCategoryIds));
    setExpandedMasterItems(new Set(masterItemIds));
  }, []);

  const collapseAll = useCallback((): void => {
    setExpandedCategories(new Set());
    setExpandedSubCategories(new Set());
    setExpandedMasterItems(new Set());
  }, []);

  return {
    expandedCategories,
    expandedSubCategories,
    expandedMasterItems,
    activeCategoryId,
    activeMasterItemId,
    toggleCategory,
    toggleSubCategory,
    toggleMasterItem,
    expandCategory,
    expandSubCategory,
    expandMasterItem,
    expandAll,
    collapseAll,
    handleCategorySelect,
    handleMasterItemSelect,
  };
}
