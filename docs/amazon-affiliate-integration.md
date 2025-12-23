# Amazon Affiliate Integration Guide

This guide explains how to configure and use Amazon affiliate links in the application.

## Configuration

### 1. Admin Dashboard Setup

Navigate to **Admin Dashboard** → **Debug Tab** → **System Settings** to configure:

1. **`amazon_associate_id`** (Required)
   - Your Amazon Associates affiliate tag (e.g., `yourstore-20`)
   - Location: Integrations category
   - Empty by default - must be configured before generating affiliate links

2. **`amazon_affiliate_url_template`** (Optional)
   - URL template for constructing affiliate links
   - Default: `https://www.amazon.com/dp/{ASIN}?&linkCode=ll1&tag={amazon_associate_id}&ref_=as_li_ss_tl`
   - Placeholders:
     - `{ASIN}` - Replaced with product's Amazon Standard Identification Number
     - `{amazon_associate_id}` - Replaced with your affiliate tag

## Usage in Code

### Import the Utility

```typescript
import {
  buildAmazonAffiliateUrl,
  buildBulkAmazonAffiliateUrls,
  extractAsinFromUrl,
  isValidAsin,
} from '@/lib/amazon-affiliate';
```

### Build a Single Affiliate URL

```typescript
// Server-side or server action
async function getProductLink(asin: string) {
  try {
    const affiliateUrl = await buildAmazonAffiliateUrl(asin);
    return affiliateUrl;
    // Example output: https://www.amazon.com/dp/B08N5WRWNW?&linkCode=ll1&tag=yourstore-20&ref_=as_li_ss_tl
  } catch (error) {
    console.error('Failed to build affiliate URL:', error);
    // Handle error - e.g., affiliate ID not configured
  }
}
```

### Build Multiple URLs Efficiently

```typescript
// For bulk operations (e.g., product recommendations)
async function getProductLinks(asins: string[]) {
  try {
    const affiliateUrls = await buildBulkAmazonAffiliateUrls(asins);
    return affiliateUrls;
  } catch (error) {
    console.error('Failed to build affiliate URLs:', error);
  }
}
```

### Extract ASIN from Existing URLs

```typescript
const productUrl = 'https://www.amazon.com/Product-Name/dp/B08N5WRWNW/ref=sr_1_1';
const asin = extractAsinFromUrl(productUrl);
// Returns: 'B08N5WRWNW'
```

### Validate ASIN Format

```typescript
if (isValidAsin('B08N5WRWNW')) {
  // Valid ASIN - proceed with URL generation
}
```

## Example: Product Recommendation Component

```typescript
// Server Action
'use server';

import { buildBulkAmazonAffiliateUrls } from '@/lib/amazon-affiliate';

export async function getRecommendedProducts() {
  // Your product recommendation logic
  const recommendedAsins = [
    'B08N5WRWNW', // Emergency Radio
    'B07XJ8C8F5', // First Aid Kit
    'B09NBLG7YZ', // Water Filter
  ];

  // Build affiliate URLs
  const affiliateUrls = await buildBulkAmazonAffiliateUrls(recommendedAsins);

  return recommendedAsins.map((asin, index) => ({
    asin,
    affiliateUrl: affiliateUrls[index],
  }));
}
```

```tsx
// React Component
import { getRecommendedProducts } from './actions';

export async function ProductRecommendations() {
  const products = await getRecommendedProducts();

  return (
    <div>
      {products.map((product) => (
        <a
          key={product.asin}
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Amazon
        </a>
      ))}
    </div>
  );
}
```

## Error Handling

The utility throws an error if `amazon_associate_id` is not configured:

```typescript
try {
  const url = await buildAmazonAffiliateUrl('B08N5WRWNW');
} catch (error) {
  if (error.message.includes('not configured')) {
    // Prompt admin to configure affiliate ID
    console.error('Please configure Amazon Associate ID in system settings');
  }
}
```

## URL Template Customization

You can customize the affiliate link format by editing the `amazon_affiliate_url_template` setting.

### Default Template
```
https://www.amazon.com/dp/{ASIN}?&linkCode=ll1&tag={amazon_associate_id}&ref_=as_li_ss_tl
```

### Alternative Template (with campaign tracking)
```
https://www.amazon.com/dp/{ASIN}?&linkCode=ll1&tag={amazon_associate_id}&ref_=as_li_ss_tl&campaign=holiday2025
```

### Template Requirements
- Must include `{ASIN}` placeholder
- Must include `{amazon_associate_id}` placeholder
- Should use a valid Amazon URL structure

## Best Practices

1. **Server-Side Only**: Always generate affiliate URLs server-side to keep settings secure
2. **Bulk Operations**: Use `buildBulkAmazonAffiliateUrls` when generating multiple URLs to minimize database queries
3. **Error Handling**: Always handle the case where affiliate ID is not configured
4. **URL Validation**: Use `isValidAsin()` to validate ASINs before building URLs
5. **Cache Results**: Consider caching affiliate URLs if they're frequently accessed

## Troubleshooting

### "Amazon Associate ID is not configured"
- Go to Admin Dashboard → Debug → System Settings
- Find `amazon_associate_id` in the Integrations category
- Enter your Amazon Associates affiliate tag

### Links Not Working
- Verify your affiliate tag is correct (format: `yourstore-20`)
- Check that the ASIN is valid (10 alphanumeric characters)
- Ensure the URL template includes both required placeholders

### Performance Issues
- Use `buildBulkAmazonAffiliateUrls` for multiple URLs
- Consider caching affiliate URLs at the application level
- System settings are already optimized with database indexes

---

## Admin UI: Affiliate Link Tester

### Overview

The Product Catalog admin interface (`/admin/products`) includes an interactive affiliate link testing tool. This allows admins to quickly generate, copy, and test Amazon affiliate links for products directly from the product table.

### How to Use

1. Navigate to `/admin/products`
2. Find a product with **Amazon** as the supplier
3. Look for a small circular button with an external link icon next to "Amazon"
4. Click the button to open the Affiliate Link Modal
5. The modal displays:
   - Product name and ASIN
   - Generated affiliate URL
   - Copy button (click URL field to copy)
   - "Open Link" button to test in new browser tab
6. Test your affiliate link by:
   - Copying the URL and pasting into Amazon's [Link Checker](https://affiliate-program.amazon.com/home/tools/linkchecker)
   - Or clicking "Open Link" to verify the product page loads correctly

### Features

✅ **One-Click Access** - Button appears inline with supplier name
✅ **Copy to Clipboard** - Click the URL field to copy with visual feedback
✅ **Direct Testing** - Open link in new tab to verify it works
✅ **Error Handling** - Clear error messages for common issues
✅ **Smart Detection** - Only shows for products with Amazon supplier

### Error Messages

The interface provides specific error messages for common issues:

**Missing ASIN**
- Error: "Missing Product ASIN"
- Solution: Edit the product and add a valid ASIN (10-character alphanumeric code)

**Missing Associate ID**
- Error: "Amazon Associate ID Not Configured"
- Solution: Click "Go to System Settings" and configure `amazon_associate_id`
- [Sign up for Amazon Associates](https://affiliate-program.amazon.com/)

**Invalid Template**
- Error: "Invalid Affiliate URL Template"
- Solution: Check `amazon_affiliate_url_template` includes `{ASIN}` and `{amazon_associate_id}` placeholders

### Implementation Details

The affiliate link tester is composed of three React components:

1. **AffiliateLinkButton** - Small button that triggers the modal
2. **AffiliateLinkModal** - Main modal UI with copy/open functionality
3. **AffiliateErrorModal** - Reusable error display with actionable next steps

The URL generation uses a Server Action (`generateAffiliateUrl`) that calls the `buildAmazonAffiliateUrl()` utility server-side, ensuring database credentials remain secure.

### Files Involved

- **UI Components**: `src/app/(protected)/admin/products/components/`
  - `AffiliateLinkButton.tsx`
  - `AffiliateLinkModal.tsx`
  - `AffiliateErrorModal.tsx`
- **Server Action**: `src/app/(protected)/admin/products/actions/affiliate-link-actions.ts`
- **Core Utility**: `src/lib/amazon-affiliate.ts`

### Testing Your Links

After generating an affiliate link, verify it works correctly:

1. **Amazon Link Checker** (Recommended)
   - Visit: https://affiliate-program.amazon.com/home/tools/linkchecker
   - Paste your affiliate URL
   - Verify it shows your Associate ID and product details

2. **Manual Testing**
   - Click "Open Link" in the modal
   - Verify the product page loads
   - Check the URL includes your affiliate tag in the address bar

3. **Track Conversions**
   - Monitor clicks and earnings in Amazon Associates Central
   - Use unique campaign tags in your template to track different sources
