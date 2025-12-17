"use server";

import * as cheerio from 'cheerio';
import { getAmazonItem, searchAmazonItems } from './amazon-paapi';

// --- Scraper Utils based on best practices ---
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0",
];

const XPID_LIST = [
    "pBw82H-MswgZ_",
    "xyz789ABC123",
    "qwe456RTY789",
    "aXy12Z-QweR4T",
    "kLm78N-JklP9M_",
    "zXc56V-BnmU3W",
    "rTy90P-HgfD2S_",
    "qWe34R-TyuI8K",
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomXpid() {
    return XPID_LIST[Math.floor(Math.random() * XPID_LIST.length)];
}

function getAmazonHeaders() {
    return {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        // Referer can sometimes help or hinder. Let's omit for now or set to amazon.com
        'Referer': 'https://www.amazon.com/'
    };
}

export interface ScrapedProduct {
  title: string;
  image?: string;
  asin?: string;
  price?: number;
  currency?: string;
  url: string;
  source: string;
  description?: string;
  sku?: string;
  gtin?: string;
  rating?: string;
  reviewCount?: number;
  // Placeholder for future scraping expansion
  // availability?: string; 
  // brand?: string;
  // features?: string[];
  // dimensions?: string;
  // weight?: string;
}

export const scrapeProductUrl = async (url: string): Promise<ScrapedProduct | null> => {
  try {
    const isAmazon = url.includes('amazon.com') || url.includes('amzn.to') || url.includes('a.co');

    // PAAPI Check
    if (isAmazon && process.env.AMAZON_SCRAPING_MODE === 'paapi') {
        const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
        // Also try to find ASIN in other common patterns if the regex fails, but the regex is standard.
        const asin = asinMatch ? asinMatch[1] : null;
        
        if (asin) {
            console.log(`Using PAAPI for ASIN: ${asin}`);
            const { item, error } = await getAmazonItem(asin);
            if (item) {
                return {
                    title: item.title,
                    image: item.image,
                    asin: item.asin,
                    price: item.price,
                    currency: item.currency,
                    url: item.url || url,
                    source: 'Amazon PAAPI',
                    description: item.description,
                    // PAAPI doesn't easily provide these without extra ops/params, using defaults
                    rating: undefined, 
                    reviewCount: undefined
                };
            }
            console.warn(`PAAPI failed for ${asin}: ${error}. Falling back to scraping.`);
        }
    }

    const headers = isAmazon ? getAmazonHeaders() : {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    };

    const response = await fetch(url, { headers });

    if (!response.ok) return null;
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let asin: string | undefined;
    let title: string | undefined;
    let image: string | undefined;
    let price: number | undefined;
    let currency: string | undefined = 'USD';
    let description: string | undefined;
    let sku: string | undefined;
    let gtin: string | undefined;
    let rating: string | undefined;
    let reviewCount: number | undefined;

    // 2. JSON-LD Extraction (Cheerio makes this cleaner)
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const jsonContent = $(el).html();
            if (!jsonContent) return;
            
            const data = JSON.parse(jsonContent);
            const product = Array.isArray(data) ? data.find(i => i['@type'] === 'Product') : (data['@type'] === 'Product' ? data : null);
            
            if (product) {
                // Prefer JSON-LD data if found
                if (!title) title = product.name;
                if (!image) image = Array.isArray(product.image) ? product.image[0] : product.image;
                if (!description) description = product.description;
                if (!sku) sku = product.sku;
                if (!gtin) gtin = product.gtin || product.gtin12 || product.gtin13 || product.gtin14;
                
                if (product.offers) {
                    const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
                    if (offer) {
                        if (!price) price = parseFloat(offer.price);
                        if (!currency) currency = offer.priceCurrency;
                    }
                }
                
                if (product.aggregateRating) {
                    rating = product.aggregateRating.ratingValue;
                    reviewCount = parseInt(product.aggregateRating.reviewCount || '0');
                }
            }
        } catch (e) { /* ignore */ }
    });

    // 3. Amazon Specifics
    if (isAmazon) {
        // ASIN from URL
        const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
        if (asinMatch) asin = asinMatch[1];
        if (!asin) asin = $('#ASIN').val() as string;

        if (!title) title = $('#productTitle').text().trim();
        
        // Amazon Price
        if (!price) {
            const whole = $('.a-price-whole').first().text().replace(/[.,]$/, '');
            const fraction = $('.a-price-fraction').first().text();
            if (whole) price = parseFloat(`${whole}.${fraction || '00'}`);
        }
        
        // Rating & Reviews (if not found in JSON-LD)
        if (!rating) {
            const ratingText = $('#acrPopover').attr('title') || $('.reviewCountTextLinkedHistogram').attr('title') || $('.a-icon-alt').first().text();
            // e.g. "4.5 out of 5 stars"
            if (ratingText) rating = ratingText.split(' ')[0];
        }
        
        if (!reviewCount) {
             const reviewText = $('#acrCustomerReviewText').first().text();
             if (reviewText) reviewCount = parseInt(reviewText.replace(/[^0-9]/g, ''));
        }
        
        // Description
        if (!description) {
             description = $('#productDescription').text().trim() || $('#feature-bullets ul').text().trim();
        }
    }

    // 4. General Fallbacks (Meta Tags & Common Selectors)
    if (!title) title = $('meta[property="og:title"]').attr('content');
    if (!title) title = $('h1').first().text().trim();
    if (!title) title = $('title').text().trim();

    if (!image) image = $('meta[property="og:image"]').attr('content');
    if (!image) image = $('meta[name="twitter:image"]').attr('content');
    // Common e-commerce image classes
    if (!image) image = $('.product-image img').attr('src');

    if (!description) description = $('meta[property="og:description"]').attr('content');
    if (!description) description = $('meta[name="description"]').attr('content');

    // Price Fallbacks (Meta tags often used by Shopify/WooCommerce)
    if (!price) {
        const ogPrice = $('meta[property="og:price:amount"]').attr('content') || 
                        $('meta[property="product:price:amount"]').attr('content');
        if (ogPrice) price = parseFloat(ogPrice);
    }

    // Price Regex Fallback on Body Text (Risky but useful for simple pages)
    // Look for $XX.XX pattern near the top of the body or in price classes
    if (!price) {
        const priceText = $('.price, .product-price, .money').first().text();
        if (priceText) {
            const match = priceText.match(/[\$£€](\d+[.,]\d{2})/);
            if (match) price = parseFloat(match[1].replace(',', '.'));
        }
    }

    return {
      title: title || 'Unknown Product',
      image,
      asin,
      price,
      currency,
      url,
      source: isAmazon ? 'Amazon' : 'Other',
      description,
      sku,
      gtin,
      rating,
      reviewCount
    };

  } catch (e) {
    console.error('Scraping error:', e);
    return null;
  }
};

// --- Native Amazon Search (Alternative to SerpApi) ---
export const searchAmazon = async (query: string) => {
    // PAAPI Search Check
    if (process.env.AMAZON_SCRAPING_MODE === 'paapi') {
        console.log(`Using PAAPI Search for: ${query}`);
        const { items, error } = await searchAmazonItems(query);
        if (items && items.length > 0) {
            const results = items.map(item => ({
                name: item.title,
                image_url: item.image,
                rating: undefined, // Not available in basic search items
                reviews: undefined,
                asin: item.asin,
                price: item.price,
                url: item.url,
                capacity_value: 1,
                capacity_unit: 'count'
            }));
            return { success: true, data: results };
        }
        console.warn(`PAAPI Search returned no results or error: ${error}. Falling back to scraping.`);
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000);
        const xpid = getRandomXpid();
        const url = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&qid=${timestamp}&xpid=${xpid}&ref=sr_pg_1`;
        
        const headers = getAmazonHeaders();
        
        // Emulate homepage visit delay (can't easily do full session w/ fetch, but headers help)
        // const homepage = await fetch("https://www.amazon.com", { headers }); // optional

        const response = await fetch(url, { headers });
        if (!response.ok) return { success: false, message: `Amazon Search Failed: ${response.status}` };
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const results: any[] = [];
        
        // Selectors from external repo research
        $("div.s-main-slot div[data-component-type='s-search-result']").each((_, el) => {
            const product = $(el);
            const title = product.find(".s-title-instructions-style > a > h2 span").text().trim();
            const image = product.find(".s-image").attr('src');
            const ratingText = product.find(".a-icon-alt").text().trim(); // "4.5 out of 5 stars"
            const rating = ratingText.split(' ')[0];
            const reviewCountText = product.find("div.a-row.a-size-small > span.rush-component > div > a span").last().text().trim();
            const reviewCount = reviewCountText ? parseInt(reviewCountText.replace(/[^0-9]/g, '')) : 0;
            const asin = product.attr('data-asin');
            
            // Price extraction (improved over external repo)
            let price = 0;
            const whole = product.find('.a-price-whole').first().text().replace(/[.,]$/, '');
            const fraction = product.find('.a-price-fraction').first().text();
            if (whole) price = parseFloat(`${whole}.${fraction || '00'}`);
            
            const link = product.find(".s-title-instructions-style > a").attr('href');
            const url = link ? `https://www.amazon.com${link}` : '';

            if (title && image) {
                results.push({
                    name: title,
                    image_url: image,
                    rating,
                    reviews: reviewCount,
                    asin,
                    price,
                    url,
                    // Placeholder fields we might scrape if we visited detail page
                    capacity_value: 1, 
                    capacity_unit: 'count' 
                });
            }
        });
        
        return { success: true, data: results };

    } catch (e: any) {
        console.error("Amazon Native Search Error:", e);
        return { success: false, message: e.message };
    }
};

export const fetchFromSerpApi = async (query: string) => {
  try {
    const apiKey = process.env.SERPAPI_API_KEY;
    if (!apiKey) {
      console.warn("Missing SERPAPI_API_KEY");
      return { success: false, error: "Missing SERPAPI_API_KEY configuration" };
    }

    console.log(`[SerpApi] Fetching for query: "${query}"`);
    const url = `https://serpapi.com/search.json?engine=amazon&k=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        const text = await response.text();
        console.error(`SerpAPI Error (${response.status}):`, text);
        return { success: false, error: `SerpAPI Error: ${response.status} ${response.statusText}` };
    }

    const data = await response.json();
    if (data.error) {
        return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (e: any) {
    console.error('SerpAPI error:', e);
    return { success: false, error: e.message };
  }
};
