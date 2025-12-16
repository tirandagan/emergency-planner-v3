"use server";

import { scrapeProductUrl, ScrapedProduct, fetchFromSerpApi } from '@/lib/scraper';
import { checkAdmin } from '@/lib/adminAuth';
import { db } from '@/db';
import { masterItems, specificProducts, scrapedQueue } from '@/db/schema/products';
import { eq, desc, and } from 'drizzle-orm';

export const getPendingMasterItems = async () => {
  await checkAdmin();
  try {
    const data = await db
      .select()
      .from(masterItems)
      .where(eq(masterItems.status, 'pending_review'))
      .orderBy(desc(masterItems.createdAt));

    return data || [];
  } catch (error) {
    console.error('Server action error:', error);
    return [];
  }
};

export const approveMasterItem = async (id: string) => {
  await checkAdmin();
  try {
    await db
      .update(masterItems)
      .set({ status: 'active' })
      .where(eq(masterItems.id, id));
    
    return true;
  } catch (error) {
    console.error('Approve error:', error);
    return false;
  }
};

export const rejectMasterItem = async (id: string) => {
  await checkAdmin();
  try {
    await db
      .delete(masterItems)
      .where(eq(masterItems.id, id));
    
    return true;
  } catch (error) {
    console.error('Reject error:', error);
    return false;
  }
};

export const getScrapedQueue = async () => {
  await checkAdmin();
  try {
    const data = await db
      .select({
        id: scrapedQueue.id,
        asin: scrapedQueue.asin,
        status: scrapedQueue.status,
        priority: scrapedQueue.priority,
        metadata: scrapedQueue.metadata,
        createdAt: scrapedQueue.createdAt,
        masterItemName: masterItems.name,
        masterItemDescription: masterItems.description,
      })
      .from(scrapedQueue)
      .leftJoin(masterItems, eq(scrapedQueue.metadata, masterItems.id))
      .where(eq(scrapedQueue.status, 'pending'))
      .orderBy(desc(scrapedQueue.createdAt));

    return data || [];
  } catch (error) {
    console.error('Server action error:', error);
    return [];
  }
};

export const processScrapedItem = async (queueId: string, action: 'approve' | 'reject', data?: any) => {
  await checkAdmin();
  try {
    if (action === 'reject') {
      // DELETE the record completely from the queue
      await db.delete(scrapedQueue).where(eq(scrapedQueue.id, queueId));
      return true;
    }

    if (action === 'approve' && data) {
      // 1. Create Specific Product
      const [product] = await db
        .insert(specificProducts)
        .values({
          masterItemId: data.master_item_id,
          supplierId: data.supplier_id || null,
          name: data.title,
          description: data.description,
          imageUrl: data.image,
          asin: data.asin,
          status: 'verified',
          price: data.price?.toString() || '0',
          type: 'product',
        })
        .returning();

      // Note: product_offers table doesn't exist in schema yet
      // If needed, add it to the schema and uncomment the following:
      // 2. Create Offer (skipped - table doesn't exist in schema)
      // const [offer] = await db
      //   .insert(productOffers)
      //   .values({
      //     productId: product.id,
      //     sellerName: data.source,
      //     price: data.price,
      //     url: data.url,
      //     type: 'AFFILIATE'
      //   })
      //   .returning();

      // 3. Mark Queue as Processed
      await db
        .update(scrapedQueue)
        .set({ status: 'processed' })
        .where(eq(scrapedQueue.id, queueId));
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Process scraped item error:', error);
    return false;
  }
};

export const triggerBatchScraping = async () => {
  await checkAdmin();
  try {
    // 1. Find active master items with no specific products
    const masters = await db
      .select({
        id: masterItems.id,
        name: masterItems.name,
        description: masterItems.description,
      })
      .from(masterItems)
      .where(eq(masterItems.status, 'active'));

    if (!masters) {
        console.error("Failed to fetch masters for scraping");
        return { success: false, message: "Failed to fetch master items" };
    }

    let scrapedCount = 0;

    for (const item of masters) {
        // Check if it already has specific products
        const products = await db
            .select()
            .from(specificProducts)
            .where(eq(specificProducts.masterItemId, item.id))
            .limit(1);
        
        if (products.length > 0) continue; // Skip if already populated

        // Check if already in queue pending
        const queueItems = await db
            .select()
            .from(scrapedQueue)
            .where(
              and(
                eq(scrapedQueue.asin, item.id),
                eq(scrapedQueue.status, 'pending')
              )
            )
            .limit(1);
        
        if (queueItems.length > 0) continue; // Skip if already queued

        // 2. Search for product (Using SerpAPI for Amazon)
        const query = `${item.name} ${item.description?.substring(0, 50) || ''}`;
        const searchResponse = await fetchFromSerpApi(query);

        if (!searchResponse.success || !searchResponse.data?.organic_results || searchResponse.data.organic_results.length === 0) continue;

        const firstResult = searchResponse.data.organic_results[0];

        if (firstResult && firstResult.asin) {
            // 4. Add to Queue directly from SerpAPI data
            await db.insert(scrapedQueue).values({
                asin: firstResult.asin,
                metadata: {
                  master_item_id: item.id,
                  url: firstResult.link,
                  scraped_title: firstResult.title,
                  scraped_image: firstResult.thumbnail,
                },
                status: 'pending',
                priority: 0,
            });
            scrapedCount++;
        }
    }

    return { success: true, message: `Queued ${scrapedCount} items for review.` };

  } catch (e) {
    console.error("Batch scraping error:", e);
    return { success: false, message: "Internal error" };
  }
};

export const clearScrapedQueue = async () => {
    await checkAdmin();
    try {
        // Delete ALL pending items in the queue
        await db
            .delete(scrapedQueue)
            .where(eq(scrapedQueue.status, 'pending'));
        
        return true;
    } catch (error) {
        console.error('Clear queue error:', error);
        return false;
    }
};

export const getProductDetailsFromSerpApi = async (query: string) => {
    await checkAdmin();
    try {
        const searchResponse = await fetchFromSerpApi(query);
        if (!searchResponse.success || !searchResponse.data?.organic_results || searchResponse.data.organic_results.length === 0) {
            return { success: false, message: searchResponse.error || "No results found" };
        }

        const firstResult = searchResponse.data.organic_results[0];
        
        // Extract price correctly
        let price = 0;
        if (firstResult.extracted_price) {
            price = firstResult.extracted_price;
        } else if (firstResult.price) {
             // Handle "$79.40" string
             const match = firstResult.price.match(/[\d.]+/);
             if (match) price = parseFloat(match[0]);
        }

        return {
            success: true,
            data: {
                name: firstResult.title,
                asin: firstResult.asin,
                image_url: firstResult.thumbnail,
                price: price,
                url: firstResult.link_clean || firstResult.link,
                rating: firstResult.rating,
                reviews: firstResult.reviews,
                description: firstResult.snippet // Often contains useful info if main description missing
            }
        };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
};
