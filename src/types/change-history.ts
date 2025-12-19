/**
 * Change History Type Definitions
 *
 * Tracks changes made to categories, master items, and products
 * Each change entry includes timestamp, user, and field-level changes
 */

/**
 * Individual field change within a change entry
 */
export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
}

/**
 * Single change history entry
 */
export interface ChangeHistoryEntry {
  timestamp: string; // ISO 8601 datetime
  userEmail: string; // Email of user who made the change
  userName?: string; // Optional display name
  changes: FieldChange[]; // Array of field-level changes
}

/**
 * Complete change history array stored in database
 */
export type ChangeHistory = ChangeHistoryEntry[];

/**
 * Props for change history modal component
 */
export interface ChangeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'category' | 'masterItem' | 'product';
  entityName: string;
  changeHistory: ChangeHistory;
}

/**
 * Human-readable field name mappings
 */
export const FIELD_LABELS: Record<string, string> = {
  // Categories
  name: 'Name',
  description: 'Description',
  icon: 'Icon',
  parentId: 'Parent Category',

  // Master Items
  categoryId: 'Category',
  status: 'Status',
  timeframes: 'Timeframes',
  demographics: 'Demographics',
  locations: 'Locations',
  scenarios: 'Scenarios',

  // Products
  masterItemId: 'Master Item',
  supplierId: 'Supplier',
  price: 'Price',
  sku: 'SKU',
  asin: 'ASIN',
  imageUrl: 'Image URL',
  productUrl: 'Product URL',
  type: 'Type',
  metadata: 'Metadata',
  variations: 'Variations',
};

/**
 * Format field value for display
 */
export function formatFieldValue(field: string, value: any): string {
  if (value === null || value === undefined) {
    return '(empty)';
  }

  if (Array.isArray(value)) {
    return value.length === 0 ? '(none)' : value.join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}
