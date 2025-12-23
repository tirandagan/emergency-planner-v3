/**
 * Vendor-Agnostic Affiliate URL Builder
 *
 * Dynamic template-based affiliate URL generation that works with any affiliate program.
 * Supports product variations and intelligent field resolution.
 *
 * @example
 * ```typescript
 * // Build Amazon affiliate URL
 * const url = await buildAffiliateUrl(supplier, product);
 *
 * // Build URL for specific product variation
 * const variantUrl = await buildAffiliateUrl(supplier, product, '["Blue"]');
 * ```
 */

import type { Product, ProductVariations } from '@/lib/products-types';

/**
 * Supplier type with affiliate configuration
 */
export interface SupplierWithAffiliate {
  id: string;
  name: string;
  affiliateId: string | null;
  affiliateUrlTemplate: string | null;
}

/**
 * Field whitelist - only these fields can be referenced in templates
 */
const ALLOWED_PRODUCT_FIELDS = new Set([
  'sku',
  'name',
  'price',
  'product_url',
  'asin',
]);

const ALLOWED_SUPPLIER_FIELDS = new Set(['affiliate_id']);

/**
 * Blocked fields - internal IDs and system fields that should never be exposed
 */
const BLOCKED_FIELDS = new Set([
  'id',
  'masterItemId',
  'supplierId',
  'categoryId',
  'createdAt',
  'updatedAt',
  'status',
  'type',
  'embedding',
]);

/**
 * Parse template fields from a template string
 *
 * Extracts all {field_name} placeholders from the template.
 * Field names are normalized to lowercase for case-insensitive matching.
 *
 * @param template - Template string with {field_name} placeholders
 * @returns Array of field names referenced in the template (lowercase)
 *
 * @example
 * ```typescript
 * parseTemplateFields('https://example.com/{SKU}?tag={affiliate_id}');
 * // Returns: ['sku', 'affiliate_id']
 * ```
 */
export function parseTemplateFields(template: string): string[] {
  const fieldPattern = /\{([^}]+)\}/g;
  const fields: string[] = [];
  let match;

  while ((match = fieldPattern.exec(template)) !== null) {
    // Normalize to lowercase for case-insensitive matching
    fields.push(match[1].toLowerCase());
  }

  return fields;
}

/**
 * Validate template syntax and field references
 *
 * Ensures template uses valid field placeholders and doesn't reference
 * internal IDs or blocked fields.
 *
 * @param template - Template string to validate
 * @returns Validation result with errors if any
 *
 * @example
 * ```typescript
 * validateTemplateFields('https://example.com/{sku}?tag={affiliate_id}');
 * // Returns: { valid: true }
 *
 * validateTemplateFields('https://example.com/{id}');
 * // Returns: { valid: false, errors: ['Field "id" is not allowed in templates'] }
 * ```
 */
export function validateTemplateFields(template: string): {
  valid: boolean;
  errors?: string[];
} {
  const fields = parseTemplateFields(template);
  const errors: string[] = [];

  for (const field of fields) {
    // Check if field is explicitly blocked
    if (BLOCKED_FIELDS.has(field)) {
      errors.push(
        `Field "${field}" is not allowed in templates (internal system field)`
      );
      continue;
    }

    // Check if field is in whitelist
    const isAllowed =
      ALLOWED_PRODUCT_FIELDS.has(field) || ALLOWED_SUPPLIER_FIELDS.has(field);

    if (!isAllowed) {
      errors.push(
        `Field "${field}" is not recognized. Allowed fields: ${Array.from(ALLOWED_PRODUCT_FIELDS).concat(Array.from(ALLOWED_SUPPLIER_FIELDS)).join(', ')}`
      );
    }
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

/**
 * Get variation fields that exist in a product's variation data
 *
 * Analyzes the product's variation configuration to determine which fields
 * are actively used in variation records.
 *
 * @param product - Product with potential variation data
 * @returns Array of field names that exist in variations
 *
 * @example
 * ```typescript
 * getVariationFields(product);
 * // Returns: ['sku', 'price'] (if product has variation SKUs and prices)
 * ```
 */
export function getVariationFields(product: Product): string[] {
  if (!product.variations) return [];

  const variations = product.variations as ProductVariations;
  const fields: string[] = [];

  // Check toggles to see which fields are active
  if (variations.config?.toggles) {
    if (variations.config.toggles.sku) fields.push('sku');
    if (variations.config.toggles.price) fields.push('price');
    if (variations.config.toggles.quantity) fields.push('quantity');
    if (variations.config.toggles.processing) fields.push('processing');
  }

  return fields;
}

/**
 * Resolve field value with priority: variation > product > supplier
 *
 * Implements intelligent field resolution:
 * 1. If variation combination is provided, check variation data first
 * 2. Fall back to main product field
 * 3. Fall back to supplier field (for affiliate_id only)
 *
 * @param fieldName - Field name to resolve (normalized lowercase)
 * @param product - Product data
 * @param supplier - Supplier data with affiliate configuration
 * @param variationCombination - Optional variation combination key (e.g., '["Blue"]')
 * @returns Resolved field value or null if not found
 *
 * @example
 * ```typescript
 * // Get SKU from variation if available, otherwise from product
 * resolveFieldValue('sku', product, supplier, '["Blue"]');
 *
 * // Get affiliate_id from supplier
 * resolveFieldValue('affiliate_id', product, supplier);
 * ```
 */
export function resolveFieldValue(
  fieldName: string,
  product: Product,
  supplier: SupplierWithAffiliate,
  variationCombination?: string
): string | null {
  // Normalize field name to lowercase
  const normalizedField = fieldName.toLowerCase();

  // Priority 1: Variation fields (if variation combination provided)
  if (variationCombination && product.variations) {
    const variations = product.variations as ProductVariations;
    const variationData = variations.values?.[variationCombination];

    if (variationData && normalizedField in variationData) {
      const value = variationData[normalizedField];
      return value !== undefined && value !== null ? String(value) : null;
    }
  }

  // Priority 2: Main product fields
  // Map normalized field names to actual product property names
  const productFieldMap: Record<string, keyof Product> = {
    sku: 'sku',
    name: 'name',
    price: 'price',
    product_url: 'productUrl',
    asin: 'asin',
  };

  const productKey = productFieldMap[normalizedField];
  if (productKey && productKey in product) {
    const value = product[productKey];
    return value !== undefined && value !== null ? String(value) : null;
  }

  // Priority 3: Supplier fields (affiliate_id only)
  if (normalizedField === 'affiliate_id') {
    return supplier.affiliateId;
  }

  return null;
}

/**
 * Replace template placeholders with actual field values
 *
 * Performs case-insensitive placeholder replacement and URL-encodes field values.
 *
 * @param template - Template string with {field_name} placeholders
 * @param fieldValues - Map of field names to their values
 * @returns Template with placeholders replaced by values
 *
 * @example
 * ```typescript
 * replaceTemplatePlaceholders(
 *   'https://example.com/{sku}?tag={affiliate_id}',
 *   { sku: 'ABC123', affiliate_id: 'my-tag-20' }
 * );
 * // Returns: 'https://example.com/ABC123?tag=my-tag-20'
 * ```
 */
export function replaceTemplatePlaceholders(
  template: string,
  fieldValues: Record<string, string>
): string {
  let result = template;

  // Replace each field placeholder (case-insensitive)
  for (const [fieldName, value] of Object.entries(fieldValues)) {
    const pattern = new RegExp(`\\{${fieldName}\\}`, 'gi');
    const encodedValue = encodeURIComponent(value);
    result = result.replace(pattern, encodedValue);
  }

  return result;
}

/**
 * Error class for missing template fields
 */
export class MissingFieldError extends Error {
  constructor(
    public fieldName: string,
    public variationCombination?: string
  ) {
    super(
      variationCombination
        ? `The {${fieldName}} is missing for variation '${variationCombination}' for this product`
        : `The {${fieldName}} field is not available for this product`
    );
    this.name = 'MissingFieldError';
  }
}

/**
 * Build affiliate URL using supplier template and product data
 *
 * Main entry point for generating vendor-agnostic affiliate URLs.
 * Supports any affiliate program through template-based URL construction.
 *
 * @param supplier - Supplier with affiliate configuration
 * @param product - Product to generate URL for
 * @param variationCombination - Optional variation combination key
 * @returns Promise resolving to affiliate URL
 *
 * @throws MissingFieldError if required template field is not available
 * @throws Error if supplier has no affiliate configuration
 *
 * @example
 * ```typescript
 * // Build Amazon affiliate URL
 * const url = await buildAffiliateUrl(amazonSupplier, product);
 *
 * // Build URL for specific variant
 * const variantUrl = await buildAffiliateUrl(supplier, product, '["Blue"]');
 * ```
 */
export async function buildAffiliateUrl(
  supplier: SupplierWithAffiliate,
  product: Product,
  variationCombination?: string
): Promise<string> {
  // Validate supplier has affiliate configuration
  if (!supplier.affiliateId || !supplier.affiliateUrlTemplate) {
    throw new Error('Supplier has no affiliate configuration');
  }

  // Parse template to find required fields
  const templateFields = parseTemplateFields(supplier.affiliateUrlTemplate);
  const fieldValues: Record<string, string> = {};

  // Resolve each field value
  for (const fieldName of templateFields) {
    const value = resolveFieldValue(
      fieldName,
      product,
      supplier,
      variationCombination
    );

    if (value === null) {
      throw new MissingFieldError(fieldName, variationCombination);
    }

    fieldValues[fieldName] = value;
  }

  // Replace placeholders with actual values
  return replaceTemplatePlaceholders(supplier.affiliateUrlTemplate, fieldValues);
}
