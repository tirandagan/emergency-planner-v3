/**
 * Custom hook for managing context menu state
 *
 * Reusable generic hook that can be used for product, category,
 * or master item context menus. Handles click-outside detection.
 */

"use client";

import { useState, useCallback, useEffect } from "react";

export interface ContextMenuState<T> {
  x: number;
  y: number;
  item: T | null;
}

export interface UseContextMenuReturn<T> {
  menu: ContextMenuState<T> | null;
  openMenu: (e: React.MouseEvent, item: T) => void;
  closeMenu: () => void;
}

/**
 * Manages context menu state with click-outside detection
 *
 * @returns Object containing menu state and handlers
 */
export function useContextMenu<T>(): UseContextMenuReturn<T> {
  const [menu, setMenu] = useState<ContextMenuState<T> | null>(null);

  const openMenu = useCallback((e: React.MouseEvent, item: T): void => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  }, []);

  const closeMenu = useCallback((): void => {
    setMenu(null);
  }, []);

  // Click-outside detection
  useEffect(() => {
    if (!menu) return;

    const handleClickOutside = (): void => {
      closeMenu();
    };

    // Add listener on next tick to avoid closing immediately
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menu, closeMenu]);

  return {
    menu,
    openMenu,
    closeMenu,
  };
}
