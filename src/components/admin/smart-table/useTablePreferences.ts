/**
 * Custom hook for persisting table preferences to local storage
 * Handles column widths, visibility, sorting, and filtering state
 */

import { useState, useEffect, useCallback } from 'react';
import type { TablePreferences } from './types';
import { DEFAULT_PREFERENCES } from './types';

export function useTablePreferences(storageKey: string) {
  const [preferences, setPreferences] = useState<TablePreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as TablePreferences;

        // Validate version for future migrations
        if (parsed.version === '1.0.0') {
          setPreferences(parsed);
        } else {
          console.warn('Table preferences version mismatch, using defaults');
        }
      }
    } catch (error) {
      console.warn('Failed to load table preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Save preferences to local storage
  const savePreferences = useCallback(
    (prefs: TablePreferences) => {
      setPreferences(prefs);
      try {
        localStorage.setItem(storageKey, JSON.stringify(prefs));
      } catch (error) {
        console.error('Failed to save table preferences:', error);
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.error('Local storage quota exceeded. Preferences will not persist.');
        }
      }
    },
    [storageKey]
  );

  // Update specific preference sections
  const updateColumnWidths = useCallback(
    (widths: Record<string, number>) => {
      const updated = { ...preferences, columnWidths: widths };
      savePreferences(updated);
    },
    [preferences, savePreferences]
  );

  const updateColumnVisibility = useCallback(
    (visibility: Record<string, boolean>) => {
      const updated = { ...preferences, columnVisibility: visibility };
      savePreferences(updated);
    },
    [preferences, savePreferences]
  );

  const updateColumnOrder = useCallback(
    (order: string[]) => {
      const updated = { ...preferences, columnOrder: order };
      savePreferences(updated);
    },
    [preferences, savePreferences]
  );

  const updateSorting = useCallback(
    (sorting: TablePreferences['sorting']) => {
      const updated = { ...preferences, sorting };
      savePreferences(updated);
    },
    [preferences, savePreferences]
  );

  const updateFilters = useCallback(
    (filters: TablePreferences['filters']) => {
      const updated = { ...preferences, filters };
      savePreferences(updated);
    },
    [preferences, savePreferences]
  );

  // Reset to default preferences
  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to reset table preferences:', error);
    }
  }, [storageKey]);

  return {
    preferences,
    isLoaded,
    savePreferences,
    updateColumnWidths,
    updateColumnVisibility,
    updateColumnOrder,
    updateSorting,
    updateFilters,
    resetPreferences,
  };
}
