'use server';

import { db } from '@/db';
import { suppliers } from '@/db/schema';
import { specificProducts } from '@/db/schema/products';
import { eq } from 'drizzle-orm';
import {
  buildAffiliateUrl,
  MissingFieldError,
  validateTemplateFields,
} from '@/lib/affiliate-urls';

/**
 * Server Action: Generate Affiliate URL
 *
 * Generates a vendor-agnostic affiliate URL using supplier template and product data.
 * Supports any affiliate program through dynamic template substitution.
 *
 * @param productId - Product database ID
 * @param supplierId - Supplier database ID
 * @param variationCombination - Optional variation combination key (e.g., '["Blue"]')
 * @returns Object with success status and either the URL or error information
 */
export async function generateAffiliateUrl(
  productId: string,
  supplierId: string,
  variationCombination?: string
): Promise<
  | { success: true; url: string }
  | {
      success: false;
      errorType: 'no_affiliate_config' | 'missing_field' | 'invalid_template';
      missingField?: string;
      variationCombination?: string;
    }
> {
  try {
    // Fetch supplier with affiliate configuration
    const [supplier] = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        affiliateId: suppliers.affiliateId,
        affiliateUrlTemplate: suppliers.affiliateUrlTemplate,
      })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    if (!supplier) {
      return { success: false, errorType: 'no_affiliate_config' };
    }

    // Check if supplier has affiliate configuration
    if (!supplier.affiliateId || !supplier.affiliateUrlTemplate) {
      return { success: false, errorType: 'no_affiliate_config' };
    }

    // Fetch product data
    const [product] = await db
      .select()
      .from(specificProducts)
      .where(eq(specificProducts.id, productId))
      .limit(1);

    if (!product) {
      return { success: false, errorType: 'invalid_template' };
    }

    // Build affiliate URL using template engine
    const url = await buildAffiliateUrl(supplier, product as any, variationCombination);

    return { success: true, url };
  } catch (error) {
    // Handle missing field errors
    if (error instanceof MissingFieldError) {
      return {
        success: false,
        errorType: 'missing_field',
        missingField: error.fieldName,
        variationCombination: error.variationCombination,
      };
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('no affiliate configuration')) {
      return { success: false, errorType: 'no_affiliate_config' };
    }

    // Default to invalid template for unknown errors
    return { success: false, errorType: 'invalid_template' };
  }
}

/**
 * Server Action: Validate Affiliate Template
 *
 * Validates template syntax and field references for supplier configuration.
 * Used in supplier forms to provide real-time validation feedback.
 *
 * @param template - Template string to validate
 * @returns Validation result with errors if any
 */
export async function validateAffiliateTemplate(template: string): Promise<{
  valid: boolean;
  errors?: string[];
}> {
  return validateTemplateFields(template);
}
