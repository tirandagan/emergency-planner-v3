import Firecrawl from '@mendable/firecrawl-js';
import { sendAdminErrorNotification, type ErrorNotificationData } from './admin-notifications';

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});

const productSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Product name or title' },
    price: { type: 'number', description: 'Product price in USD' },
    description: { type: 'string', description: 'Product description' },
    image_url: { type: 'string', description: 'Main product image URL' },
    brand: { type: 'string', description: 'Brand or manufacturer name' },
    sku: { type: 'string', description: 'SKU or product code' },
    color: { type: 'string', description: 'Product color' },
    size: { type: 'string', description: 'Product size' },
    dimensions: { type: 'string', description: 'Product dimensions (e.g., 10 x 5 x 3 inches)' },
    weight: { type: 'string', description: 'Product weight with unit (e.g., 150 lb, 2.5 kg)' },
    quantity: { type: 'number', description: 'Quantity in package (default 1 if not specified)' },
    model_number: { type: 'string', description: 'Model number or part number' },
    upc: { type: 'string', description: 'UPC barcode number' },
  },
};

export interface FirecrawlProductData {
  name?: string;
  price?: number;
  description?: string;
  image_url?: string;
  brand?: string;
  sku?: string;
  color?: string;
  size?: string;
  dimensions?: string;
  weight?: string;
  quantity?: string;
  model_number?: string;
  upc?: string;
}

export interface FirecrawlResponse {
  success: boolean;
  data: FirecrawlProductData | null;
  errors: string[];
  message: string;
}

export async function extractProductFromUrl(url: string, userId?: string): Promise<FirecrawlResponse> {
  try {
    const result = await firecrawl.extract({
      urls: [url],
      prompt:
        'Extract product information from this product page, including name, price, description, images, and all available product attributes.',
      schema: productSchema,
    });

    if (!result.success) {
      const errorDetails = JSON.stringify(result, null, 2);
      console.error('[Firecrawl] Extraction failed:', errorDetails);

      return {
        success: false,
        data: null,
        errors: [`Firecrawl extraction failed. Response: ${errorDetails}`],
        message: 'Could not extract product data',
      };
    }

    const data = (result.data || {}) as FirecrawlProductData;
    const errors: string[] = [];

    if (!data.name) errors.push('Product name not found');
    if (!data.price) errors.push('Product price not found');

    return {
      success: true,
      data,
      errors,
      message:
        errors.length > 0 ? 'Partial data extracted' : 'Product data extracted successfully',
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check if this is a configuration/service issue that requires admin attention
    const isConfigIssue = errorMessage.toLowerCase().includes('insufficient credits') ||
                         errorMessage.toLowerCase().includes('api key') ||
                         errorMessage.toLowerCase().includes('unauthorized') ||
                         errorMessage.toLowerCase().includes('authentication') ||
                         errorMessage.toLowerCase().includes('quota exceeded');

    if (isConfigIssue) {
      console.error('[Firecrawl] Configuration error - admin notified. UserId:', userId || 'not provided');

      // Send admin notification for configuration issues
      const notificationData: ErrorNotificationData = {
        logId: `firecrawl-${Date.now().toString(36)}`,
        severity: 'error',
        category: 'external_service',
        errorCode: 'FIRECRAWL_CONFIG_ERROR',
        errorName: 'Firecrawl Service Configuration Error',
        message: errorMessage,
        userId: userId, // Include the user who triggered the error
        component: 'Firecrawl Product Scraper',
        route: '/api/firecrawl/extract',
        userAction: 'Attempted to scrape product from URL',
        stackTrace: errorStack,
        suggestion: errorMessage.toLowerCase().includes('insufficient credits')
          ? 'The Firecrawl API has insufficient credits. Please visit https://firecrawl.dev/pricing to upgrade your plan or add credits.'
          : 'Check Firecrawl API configuration and credentials in environment variables.',
        metadata: {
          url,
          apiKeyConfigured: !!process.env.FIRECRAWL_API_KEY,
        },
        timestamp: new Date().toISOString(),
      };

      // Send notification asynchronously (don't wait for it)
      sendAdminErrorNotification(notificationData).catch((err) => {
        console.error('[Firecrawl] Failed to send admin notification:', err);
      });

      // Return user-friendly error message (no technical details)
      return {
        success: false,
        data: null,
        errors: [], // Empty errors array - admin gets details via email
        message: 'Service temporarily unavailable. Administrator has been notified.',
      };
    }

    console.error('[Firecrawl] Extraction error:', errorMessage);

    return {
      success: false,
      data: null,
      errors: [errorMessage, errorStack ? `Stack: ${errorStack}` : ''].filter(Boolean),
      message: 'Extraction failed',
    };
  }
}
