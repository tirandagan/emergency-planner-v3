import Firecrawl from '@mendable/firecrawl-js';

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

export async function extractProductFromUrl(url: string): Promise<FirecrawlResponse> {
  try {
    const result = await firecrawl.extract({
      urls: [url],
      prompt:
        'Extract product information from this product page, including name, price, description, images, and all available product attributes.',
      schema: productSchema,
    });

    if (!result.success) {
      return {
        success: false,
        data: null,
        errors: ['Firecrawl extraction failed'],
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
    return {
      success: false,
      data: null,
      errors: [errorMessage],
      message: 'Extraction failed',
    };
  }
}
