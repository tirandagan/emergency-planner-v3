import { pgTable, text, uuid, timestamp, integer, decimal, boolean, index } from 'drizzle-orm/pg-core';
import { specificProducts } from './products';

export const bundles = pgTable(
  'bundles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    slug: text('slug').notNull().unique(),
    imageUrl: text('image_url'),
    totalEstimatedPrice: decimal('total_estimated_price', { precision: 10, scale: 2 }),
    scenarios: text('scenarios').array().notNull(),
    minPeople: integer('min_people').default(1),
    maxPeople: integer('max_people'),
    gender: text('gender'),
    ageGroups: text('age_groups').array(),
    climates: text('climates').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index('idx_bundles_slug').on(table.slug),
    scenariosIdx: index('idx_bundles_scenarios').using('gin', table.scenarios),
  })
);

export const bundleItems = pgTable(
  'bundle_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bundleId: uuid('bundle_id')
      .notNull()
      .references(() => bundles.id, { onDelete: 'cascade' }),
    specificProductId: uuid('specific_product_id')
      .notNull()
      .references(() => specificProducts.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    isOptional: boolean('is_optional').notNull().default(false),
  },
  (table) => ({
    bundleIdIdx: index('idx_bundle_items_bundle_id').on(table.bundleId),
    specificProductIdIdx: index('idx_bundle_items_specific_product_id').on(table.specificProductId),
  })
);

export const bundleRecommendations = pgTable(
  'bundle_recommendations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bundleId: uuid('bundle_id')
      .notNull()
      .references(() => bundles.id, { onDelete: 'cascade' }),
    specificProductId: uuid('specific_product_id')
      .notNull()
      .references(() => specificProducts.id, { onDelete: 'cascade' }),
    reason: text('reason'),
  },
  (table) => ({
    bundleIdIdx: index('idx_bundle_recommendations_bundle_id').on(table.bundleId),
  })
);

