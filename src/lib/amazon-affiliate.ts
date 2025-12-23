/**
 * Amazon Affiliate Link Builder
 *
 * Utilities for constructing Amazon affiliate URLs using system settings.
 *
 * @example
 * ```typescript
 * const affiliateUrl = await buildAmazonAffiliateUrl('B08N5WRWNW');
 * // Returns: https://www.amazon.com/dp/B08N5WRWNW?&linkCode=ll1&tag=yourTag-20&ref_=as_li_ss_tl
 * ```
 */

import { getSystemSetting } from '@/db/queries/system-settings';

/**
 * Build an Amazon affiliate URL using the configured template and associate ID
 *
 * @param asin - Amazon Standard Identification Number (ASIN) for the product
 * @returns Promise<string> - The constructed affiliate URL
 *
 * @throws Error if amazon_associate_id is not configured
 *
 * @example
 * ```typescript
 * // Build a single affiliate URL
 * const url = await buildAmazonAffiliateUrl('B08N5WRWNW');
 *
 * // Build multiple URLs in parallel
 * const urls = await Promise.all(
 *   asins.map(asin => buildAmazonAffiliateUrl(asin))
 * );
 * ```
 */
export async function buildAmazonAffiliateUrl(asin: string): Promise<string> {
  // Get settings from database
  const [associateId, urlTemplate] = await Promise.all([
    getSystemSetting<string>('amazon_associate_id'),
    getSystemSetting<string>('amazon_affiliate_url_template'),
  ]);

  // Validate required settings
  if (!associateId) {
    throw new Error(
      'Amazon Associate ID is not configured in system settings. ' +
      'Please set amazon_associate_id in the admin dashboard.'
    );
  }

  // Use default template if not configured
  const template =
    urlTemplate ||
    'https://www.amazon.com/dp/{ASIN}?&linkCode=ll1&tag={amazon_associate_id}&ref_=as_li_ss_tl';

  // Replace placeholders with actual values
  const affiliateUrl = template
    .replace('{ASIN}', asin)
    .replace('{amazon_associate_id}', associateId);

  return affiliateUrl;
}

/**
 * Build multiple Amazon affiliate URLs in parallel
 *
 * @param asins - Array of ASINs to build URLs for
 * @returns Promise<string[]> - Array of constructed affiliate URLs
 *
 * @example
 * ```typescript
 * const asins = ['B08N5WRWNW', 'B07XJ8C8F5', 'B09NBLG7YZ'];
 * const urls = await buildBulkAmazonAffiliateUrls(asins);
 * ```
 */
export async function buildBulkAmazonAffiliateUrls(asins: string[]): Promise<string[]> {
  // Fetch settings once for all URLs
  const [associateId, urlTemplate] = await Promise.all([
    getSystemSetting<string>('amazon_associate_id'),
    getSystemSetting<string>('amazon_affiliate_url_template'),
  ]);

  if (!associateId) {
    throw new Error(
      'Amazon Associate ID is not configured in system settings. ' +
      'Please set amazon_associate_id in the admin dashboard.'
    );
  }

  const template =
    urlTemplate ||
    'https://www.amazon.com/dp/{ASIN}?&linkCode=ll1&tag={amazon_associate_id}&ref_=as_li_ss_tl';

  // Build all URLs using the same template and associate ID
  return asins.map(asin =>
    template
      .replace('{ASIN}', asin)
      .replace('{amazon_associate_id}', associateId)
  );
}

/**
 * Extract ASIN from an Amazon product URL
 *
 * @param url - Amazon product URL
 * @returns string | null - Extracted ASIN or null if not found
 *
 * @example
 * ```typescript
 * const asin = extractAsinFromUrl('https://www.amazon.com/dp/B08N5WRWNW');
 * // Returns: 'B08N5WRWNW'
 *
 * const asin2 = extractAsinFromUrl('https://www.amazon.com/Product-Name/dp/B07XJ8C8F5/ref=sr_1_1');
 * // Returns: 'B07XJ8C8F5'
 * ```
 */
export function extractAsinFromUrl(url: string): string | null {
  // Match ASIN pattern in various Amazon URL formats
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,           // /dp/ASIN
    /\/gp\/product\/([A-Z0-9]{10})/i,  // /gp/product/ASIN
    /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})/i, // old format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate an ASIN format
 *
 * @param asin - String to validate as ASIN
 * @returns boolean - True if valid ASIN format
 *
 * @example
 * ```typescript
 * isValidAsin('B08N5WRWNW'); // true
 * isValidAsin('invalid');     // false
 * ```
 */
export function isValidAsin(asin: string): boolean {
  // ASIN format: 10 alphanumeric characters, starting with B or a number
  return /^[B0-9][A-Z0-9]{9}$/i.test(asin);
}
