/**
 * Custom hook for managing keyboard navigation
 *
 * Handles arrow key navigation through categories and subcategories.
 * Extracts ~130 lines of keyboard handler logic from main component.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

export interface NavigationItem {
  id: string;
  type: 'category' | 'subcategory';
  parentId?: string;
}

export interface UseKeyboardNavigationOptions {
  onNavigate?: (item: NavigationItem) => void;
  onExpand?: (itemId: string, type: 'category' | 'subcategory') => void;
  onCollapse?: (itemId: string, type: 'category' | 'subcategory') => void;
  isModalOpen: boolean;
  expandedCategories: Set<string>;
  expandedSubCategories: Set<string>;
}

export interface UseKeyboardNavigationReturn {
  focusedItemId: string | null;
  setFocusedItemId: (id: string | null) => void;
  focusedItemType: 'category' | 'subcategory' | null;
  setFocusedItemType: (type: 'category' | 'subcategory' | null) => void;
}

/**
 * Manages keyboard navigation state and handlers
 *
 * @param navigationItems - Array of items that can be navigated
 * @param options - Configuration options
 * @returns Object containing focus state
 */
export function useKeyboardNavigation(
  navigationItems: NavigationItem[],
  options: UseKeyboardNavigationOptions
): UseKeyboardNavigationReturn {
  const {
    onNavigate,
    onExpand,
    onCollapse,
    isModalOpen,
    expandedCategories,
    expandedSubCategories
  } = options;

  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [focusedItemType, setFocusedItemType] = useState<'category' | 'subcategory' | null>(null);

  const scrollIntoView = useCallback((itemId: string): void => {
    const element = document.querySelector(`[data-nav-id="${itemId}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't handle if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't handle if a modal is open
      if (isModalOpen) {
        return;
      }

      const currentIndex = focusedItemId
        ? navigationItems.findIndex(item => item.id === focusedItemId)
        : -1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex === -1 && navigationItems.length > 0) {
            // Start navigation from first item
            setFocusedItemId(navigationItems[0].id);
            setFocusedItemType(navigationItems[0].type);
            if (onNavigate) onNavigate(navigationItems[0]);
          } else if (currentIndex < navigationItems.length - 1) {
            const nextItem = navigationItems[currentIndex + 1];
            setFocusedItemId(nextItem.id);
            setFocusedItemType(nextItem.type);
            if (onNavigate) onNavigate(nextItem);
            scrollIntoView(nextItem.id);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const prevItem = navigationItems[currentIndex - 1];
            setFocusedItemId(prevItem.id);
            setFocusedItemType(prevItem.type);
            if (onNavigate) onNavigate(prevItem);
            scrollIntoView(prevItem.id);
          } else if (currentIndex === -1 && navigationItems.length > 0) {
            // Start from last item
            const lastItem = navigationItems[navigationItems.length - 1];
            setFocusedItemId(lastItem.id);
            setFocusedItemType(lastItem.type);
            if (onNavigate) onNavigate(lastItem);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (focusedItemId) {
            const currentItem = navigationItems.find(item => item.id === focusedItemId);
            if (currentItem) {
              if (currentItem.type === 'category') {
                if (!expandedCategories.has(currentItem.id)) {
                  if (onExpand) onExpand(currentItem.id, 'category');
                }
              } else if (currentItem.type === 'subcategory') {
                if (!expandedSubCategories.has(currentItem.id)) {
                  if (onExpand) onExpand(currentItem.id, 'subcategory');
                }
              }
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (focusedItemId) {
            const currentItem = navigationItems.find(item => item.id === focusedItemId);
            if (currentItem) {
              if (currentItem.type === 'category') {
                if (expandedCategories.has(currentItem.id)) {
                  if (onCollapse) onCollapse(currentItem.id, 'category');
                }
              } else if (currentItem.type === 'subcategory') {
                if (expandedSubCategories.has(currentItem.id)) {
                  if (onCollapse) onCollapse(currentItem.id, 'subcategory');
                }
              }
            }
          }
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    navigationItems,
    focusedItemId,
    isModalOpen,
    expandedCategories,
    expandedSubCategories,
    onNavigate,
    onExpand,
    onCollapse,
    scrollIntoView
  ]);

  return {
    focusedItemId,
    setFocusedItemId,
    focusedItemType,
    setFocusedItemType,
  };
}
