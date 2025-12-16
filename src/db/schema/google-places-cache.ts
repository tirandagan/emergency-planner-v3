import { pgTable, text, uuid, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Google Places API cache table
 * Stores NearbySearch results with 7-day expiration and automatic cleanup
 */
export const googlePlacesCache = pgTable(
  'google_places_cache',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cacheKey: text('cache_key').notNull().unique(),
    placeResults: jsonb('place_results').notNull(),
    cachedAt: timestamp('cached_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true })
      .notNull()
      .default(sql`NOW() + INTERVAL '7 days'`),
    hitCount: integer('hit_count').notNull().default(1),
  },
  (table) => ({
    cacheKeyIdx: index('idx_places_cache_key').on(table.cacheKey),
    expiresAtIdx: index('idx_places_cache_expires').on(table.expiresAt),
  })
);

/**
 * TypeScript type for place results stored in cache
 */
export type GooglePlaceResult = {
  placeId: string;
  name: string;
  types: string[];
  address: string;
  phone?: string;
  location: { lat: number; lng: number };
  openNow?: boolean;
  rating?: number;
};
