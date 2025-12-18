const DECODO_BASE_URL = 'https://scraper-api.decodo.com/v2';
const DECODO_USER = process.env.DECODO_USER;
const DECODO_PASS = process.env.DECODO_PASS;

interface DecodoTaskResponse {
    id: string;
    status: string;
    // ... other fields
}

interface DecodoResultResponse {
    id: string;
    status: string;
    result?: any;
    results?: any[];
}

async function createDecodoTask(payload: any) {
    if (!DECODO_USER || !DECODO_PASS) {
        throw new Error('Decodo credentials missing. Please set DECODO_USER and DECODO_PASS in .env.local');
    }

    const auth = Buffer.from(`${DECODO_USER}:${DECODO_PASS}`).toString('base64');

    try {
        const response = await fetch(`${DECODO_BASE_URL}/task`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Decodo API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return (await response.json()) as DecodoTaskResponse;
    } catch (error: any) {
        console.error('Decodo Task Creation Error:', error.message);
        throw error;
    }
}

async function pollDecodoTask(taskId: string, maxAttempts = 30, intervalMs = 2000): Promise<any> {
    if (!DECODO_USER || !DECODO_PASS) {
        throw new Error('Decodo credentials missing');
    }

    const auth = Buffer.from(`${DECODO_USER}:${DECODO_PASS}`).toString('base64');

    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await fetch(`${DECODO_BASE_URL}/task/${taskId}/results`, {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });

            if (!response.ok) {
                 // If 404, it might be processing or just not ready? Decodo usually returns the task status even if processing.
                 // But if strictly 404 on results endpoint, it might mean invalid ID.
                 // Let's assume generic error handling.
                 if (response.status === 404) {
                    // Maybe wait and retry?
                    await new Promise(resolve => setTimeout(resolve, intervalMs));
                    continue;
                 }
                 const errorText = await response.text();
                 throw new Error(`Decodo Polling Error: ${response.status} - ${errorText}`);
            }

            const text = await response.text();
            // console.log(`[Decodo] Poll Response (${response.status}):`, text.substring(0, 200) + '...'); // Log only start

            if (!text) {
                throw new Error(`Decodo returned empty response body. Status: ${response.status}`);
            }

            const data = JSON.parse(text) as DecodoResultResponse;

            // Check if it has results array (success)
            if (data.results) {
                return data.results; // Return the array of results
            }

            if (data.status === 'done') {
                return data.result;
            }

            if (data.status === 'failed' || data.status === 'error') {
                 throw new Error(`Decodo task failed with status: ${data.status}`);
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, intervalMs));

        } catch (error: any) {
             console.error('Polling Error:', error.message);
             if (i === maxAttempts - 1) throw error;
             await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
    }

    throw new Error('Decodo task timed out');
}

export interface SimplifiedProduct {
    asin: string;
    brand: string;
    price: number;
    title: string;
    rating: number;
    store_url: string;
    description: string;
    manufacturer: string;
    bullet_points: string[];
    image_url: string;
    reviews: number;
    weight?: number;
    weight_unit?: string;
    capacity_value?: number;
    capacity_unit?: string;
    dimensions?: string;
    color?: string;
    size?: string;
    model_name?: string;
    upc?: string;
    part_number?: string;
}

// Helper to map Decodo Amazon Product result to our simplified structure
function mapProductDetails(data: any): SimplifiedProduct {
    // Data structure depends on Decodo's Amazon Product template return
    
    const priceRaw = data.price?.current_price || data.price || 0;
    const price = typeof priceRaw === 'string' ? parseFloat(priceRaw.replace(/[^0-9.]/g, '')) : priceRaw;
    
    // Extract weight
    let weight = 0;
    let weight_unit = 'g';
    
    if (data.weight) {
        const match = data.weight.match(/(\d*\.?\d+)\s?(g|kg|oz|lb|pounds|ounces|grams)/i);
        if (match) {
            weight = parseFloat(match[1]);
            const unit = match[2].toLowerCase();
            if (unit.startsWith('lb') || unit.startsWith('pound')) weight_unit = 'lb';
            else if (unit.startsWith('oz') || unit.startsWith('ounce')) weight_unit = 'oz';
            else if (unit.startsWith('kg')) weight_unit = 'kg';
            else weight_unit = 'g';
        }
    } else if (data.product_details?.item_weight) {
         const match = data.product_details.item_weight.match(/(\d*\.?\d+)\s?(g|kg|oz|lb|pounds|ounces|grams)/i);
         if (match) {
            weight = parseFloat(match[1]);
            const unit = match[2].toLowerCase();
            if (unit.startsWith('lb') || unit.startsWith('pound')) weight_unit = 'lb';
            else if (unit.startsWith('oz') || unit.startsWith('ounce')) weight_unit = 'oz';
            else if (unit.startsWith('kg')) weight_unit = 'kg';
            else weight_unit = 'g';
        }
    }

    // Extract other details
    const pd = data.product_details || {};
    const dimensions = pd.product_dimensions || pd.item_dimensions_lxwxh || '';
    const color = pd.color || '';
    const size = pd.size || ''; // specific size field if available
    const model_name = pd.model_name || '';
    
    // Extract UPC/GTIN and Part Number
    // GTIN often contains UPC/EAN. Sometimes it is comma separated.
    const upc = pd.global_trade_identification_number || '';
    const part_number = pd.part_number || '';

    let description = data.description || data.short_description || '';
    const bulletPoints = data.feature_bullets || data.bullet_points || [];
    
    // Format bullet points
    const pointsStr = Array.isArray(bulletPoints) ? bulletPoints.join('\n') : String(bulletPoints);
    
    // Always prepend bullet points to description
    if (pointsStr) {
        if (description) {
            description = pointsStr + '\n\n' + description;
        } else {
            description = pointsStr;
        }
    }

    return {
        asin: data.asin || '',
        brand: data.brand || pd.brand || '',
        price: price || 0,
        title: data.title || '',
        rating: parseFloat(data.rating || '0'),
        store_url: data.url || `https://www.amazon.com/dp/${data.asin}`,
        description,
        manufacturer: data.manufacturer || pd.manufacturer || data.brand || '',
        bullet_points: bulletPoints,
        image_url: data.url_image || data.main_image || data.image || (data.images && data.images.length > 0 ? data.images[0] : ''),
        reviews: parseInt(data.reviews_count || data.reviews || '0'),
        weight,
        weight_unit,
        dimensions,
        color,
        size,
        model_name,
        upc,
        part_number,
        // We can also try to extract capacity if not present
        capacity_value: 1,
        capacity_unit: 'count'
    };
}

/**
 * Expands a shortened URL by following redirects to get the final destination URL
 */
async function expandShortenedUrl(shortUrl: string): Promise<string> {
    try {
        // Make a HEAD request to follow redirects without downloading the body
        const response = await fetch(shortUrl, {
            method: 'HEAD',
            redirect: 'follow' // Follow redirects automatically
        });

        // The response.url contains the final URL after all redirects
        return response.url;
    } catch (error) {
        console.error('[Decodo] Failed to expand shortened URL:', error);
        // If expansion fails, return the original URL
        return shortUrl;
    }
}

export async function getDecodoProductDetails(urlOrAsin: string, country = 'US'): Promise<SimplifiedProduct | null> {
    let processedUrl = urlOrAsin.trim();

    // Check if this is a shortened Amazon URL that needs expansion
    const isShortenedUrl = processedUrl.includes('a.co/') || processedUrl.includes('amzn.to/');

    if (isShortenedUrl) {
        console.log('[Decodo] Detected shortened URL, expanding:', processedUrl);
        processedUrl = await expandShortenedUrl(processedUrl);
        console.log('[Decodo] Expanded URL:', processedUrl);
    }

    // Try to extract ASIN from the (possibly expanded) URL
    // Supports: /dp/, /gp/product/, /product/, /gp/aw/d/ (mobile)
    const asinMatch = processedUrl.match(/(?:\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/|\/product\/)([A-Z0-9]{10})(?:\/|$|\?)/);
    const isAsin = /^[A-Z0-9]{10}$/.test(processedUrl);

    let query: string;

    if (isAsin) {
        // User provided a direct ASIN
        query = processedUrl;
        console.log('[Decodo] Using direct ASIN:', query);
    } else if (asinMatch && asinMatch[1]) {
        // Successfully extracted ASIN from URL
        query = asinMatch[1];
        console.log('[Decodo] Extracted ASIN from URL:', query);
    } else {
        // Could not extract a valid ASIN from the URL
        throw new Error(
            'Unable to extract a valid Amazon ASIN from the provided URL. ' +
            'Please ensure the URL contains a valid product identifier (e.g., /dp/B001234567). ' +
            'Alternatively, you can enter the 10-character ASIN directly in the SKU/ASIN field.'
        );
    }

    // Validate the extracted/provided ASIN is exactly 10 characters
    if (query.length !== 10) {
        throw new Error(
            `Invalid ASIN length: "${query}" is ${query.length} characters, but ASINs must be exactly 10 characters. ` +
            'Please check the product URL or enter a valid ASIN directly.'
        );
    }

    // Based on error: "amazon_product target is not available with url parameter, use query parameter instead."
    const task = await createDecodoTask({
        query: query,
        target: 'amazon_product',
        country,
        domain: 'com',
        device_type: 'desktop_chrome',
        parse: true
    });

    if (!task.id) throw new Error('No task ID returned from Decodo');

    const result = await pollDecodoTask(task.id);

    if (!result || (Array.isArray(result) && result.length === 0)) return null;

    // The result from Decodo with 'parse: true' returns an array of results.
    // Each result has a 'content' property which contains the product details.
    // Based on logs: {"results":[{"content":{...}}]}
    // So result is the array `results`.

    // Check if first item has 'content'
    const firstItem = Array.isArray(result) ? result[0] : result;

    if (firstItem && firstItem.content) {
        return mapProductDetails(firstItem.content);
    }

    // Fallback if structure is different
    return mapProductDetails(firstItem);
}

export async function searchDecodoProducts(query: string, country = 'US'): Promise<SimplifiedProduct[]> {
    // For search, we should also use 'query' parameter instead of constructing URL manually,
    // unless we are sure 'amazon_search' requires 'url'.
    // Usually, 'amazon_search' target takes a 'query' parameter for the keywords.
    
    const task = await createDecodoTask({
        query: query,
        target: 'amazon_search', 
        country,
        domain: 'com',
        device_type: 'desktop_chrome',
        parse: true
    });

    if (!task.id) throw new Error('No task ID returned from Decodo');

    const result = await pollDecodoTask(task.id);

    if (!result) return [];

    // Depending on target, structure varies.
    // amazon_search returns array: [{ content: { results: { organic: [...] } } }]
    // amazon_product returns array with items that have 'content' property

    let items: any[] = [];

    // Check if it's an array response (most common)
    if (Array.isArray(result) && result.length > 0) {
        const firstItem = result[0];

        // Search results structure: [{ content: { results: { organic: [...] } } }]
        if (firstItem.content?.results?.organic) {
            items = firstItem.content.results.organic;
        }
        // Product details structure: [{ content: { ... } }]
        else if (firstItem.content) {
            items = result.map((item: any) => item.content);
        }
        // Direct array of products
        else {
            items = result;
        }
    }
    // Fallback for other structures
    else if (result.content?.organic) {
        items = result.content.organic;
    } else if (result.products || result.results) {
        items = result.products || result.results || [];
    }

    return items.map((item: any) => mapProductDetails(item));
}
