import type { ChangeHistory, ChangeHistoryEntry, FieldChange } from '@/types/change-history';
import type { User } from '@supabase/supabase-js';

/**
 * Change Tracking Utility Functions
 *
 * Provides utilities for tracking and recording changes to database entities
 */

/**
 * Fields to ignore when tracking changes (system fields)
 */
const IGNORED_FIELDS = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'changeHistory',
  'embedding',
]);

/**
 * Compare two values and determine if they're different
 */
function valuesAreDifferent(oldValue: any, newValue: any): boolean {
  // Handle null/undefined
  if (oldValue === null || oldValue === undefined) {
    return newValue !== null && newValue !== undefined;
  }
  if (newValue === null || newValue === undefined) {
    return oldValue !== null && oldValue !== undefined;
  }

  // Handle arrays
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) return true;
    return oldValue.some((val, idx) => val !== newValue[idx]);
  }

  // Handle objects (but not arrays)
  if (typeof oldValue === 'object' && typeof newValue === 'object') {
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }

  // Simple comparison
  return oldValue !== newValue;
}

/**
 * Create a field change record
 */
function createFieldChange(field: string, oldValue: any, newValue: any): FieldChange {
  return {
    field,
    oldValue,
    newValue,
  };
}

/**
 * Build a change history entry from old and new values
 *
 * @param oldData - Previous state of the entity
 * @param newData - New state of the entity
 * @param user - User making the change
 * @returns ChangeHistoryEntry or null if no changes detected
 */
export function buildChangeEntry<T extends Record<string, any>>(
  oldData: T | null,
  newData: Partial<T>,
  user: User
): ChangeHistoryEntry | null {
  const changes: FieldChange[] = [];

  // Get all unique fields from both objects
  const allFields = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData),
  ]);

  // Compare each field
  for (const field of allFields) {
    // Skip ignored fields
    if (IGNORED_FIELDS.has(field)) continue;

    const oldValue = oldData?.[field];
    const newValue = newData[field];

    // Only record if values are different
    if (valuesAreDifferent(oldValue, newValue)) {
      changes.push(createFieldChange(field, oldValue, newValue));
    }
  }

  // No changes detected
  if (changes.length === 0) {
    return null;
  }

  // Build the entry
  const entry: ChangeHistoryEntry = {
    timestamp: new Date().toISOString(),
    userEmail: user.email || 'unknown@example.com',
    userName: user.user_metadata?.full_name || user.user_metadata?.name,
    changes,
  };

  return entry;
}

/**
 * Add a change entry to existing change history
 *
 * @param currentHistory - Existing change history array (from database)
 * @param newEntry - New change entry to add
 * @param maxEntries - Maximum number of entries to keep (default: 100)
 * @returns Updated change history array
 */
export function addChangeEntry(
  currentHistory: ChangeHistory | null,
  newEntry: ChangeHistoryEntry,
  maxEntries: number = 100
): ChangeHistory {
  const history = Array.isArray(currentHistory) ? currentHistory : [];

  // Add new entry at the beginning (most recent first)
  const updatedHistory = [newEntry, ...history];

  // Trim to max entries
  return updatedHistory.slice(0, maxEntries);
}

/**
 * Get a summary string of changes for logging
 *
 * @param entry - Change history entry
 * @returns Human-readable summary string
 */
export function getChangeSummary(entry: ChangeHistoryEntry): string {
  const fieldNames = entry.changes.map((c) => c.field).join(', ');
  return `Updated ${entry.changes.length} field(s): ${fieldNames}`;
}

/**
 * Create change entry for initial creation
 *
 * @param data - Initial data
 * @param user - User creating the entity
 * @returns ChangeHistoryEntry for creation
 */
export function buildCreationEntry<T extends Record<string, any>>(
  data: T,
  user: User
): ChangeHistoryEntry {
  const changes: FieldChange[] = [];

  for (const [field, value] of Object.entries(data)) {
    // Skip ignored fields
    if (IGNORED_FIELDS.has(field)) continue;

    // Skip null/undefined values
    if (value === null || value === undefined) continue;

    changes.push(createFieldChange(field, null, value));
  }

  return {
    timestamp: new Date().toISOString(),
    userEmail: user.email || 'unknown@example.com',
    userName: user.user_metadata?.full_name || user.user_metadata?.name,
    changes,
  };
}
