import { pgTable, text, uuid, timestamp, integer, decimal, jsonb, index, vector } from 'drizzle-orm/pg-core';
import { categories } from './categories';
import { suppliers } from './suppliers';

export const masterItems = pgTable(
  'master_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description'),
    embedding: vector('embedding', { dimensions: 768 }),
    status: text('status').notNull().default('active'),
    timeframes: text('timeframes').array(),
    demographics: text('demographics').array(),
    locations: text('locations').array(),
    scenarios: text('scenarios').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    categoryIdIdx: index('idx_master_items_category_id').on(table.categoryId),
    statusIdx: index('idx_master_items_status').on(table.status),
    embeddingIdx: index('idx_master_items_embedding').using(
      'ivfflat',
      table.embedding.op('vector_cosine_ops')
    ),
    scenariosIdx: index('idx_master_items_scenarios').using('gin', table.scenarios),
  })
);

export const specificProducts = pgTable(
  'specific_products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    masterItemId: uuid('master_item_id')
      .notNull()
      .references(() => masterItems.id, { onDelete: 'cascade' }),
    supplierId: uuid('supplier_id')
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }),
    sku: text('sku'),
    asin: text('asin').unique(),
    imageUrl: text('image_url'),
    productUrl: text('product_url'),
    type: text('type').notNull().default('product'),
    status: text('status').notNull().default('active'),
    metadata: jsonb('metadata'),
    variations: jsonb('variations'),
    timeframes: text('timeframes').array(),
    demographics: text('demographics').array(),
    locations: text('locations').array(),
    scenarios: text('scenarios').array(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    masterItemIdIdx: index('idx_specific_products_master_item_id').on(table.masterItemId),
    supplierIdIdx: index('idx_specific_products_supplier_id').on(table.supplierId),
    asinIdx: index('idx_specific_products_asin').on(table.asin),
    statusIdx: index('idx_specific_products_status').on(table.status),
    metadataIdx: index('idx_specific_products_metadata').using('gin', table.metadata),
    scenariosIdx: index('idx_specific_products_scenarios').using('gin', table.scenarios),
  })
);

export const scrapedQueue = pgTable(
  'scraped_queue',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    asin: text('asin').notNull().unique(),
    status: text('status').notNull().default('pending'),
    priority: integer('priority').notNull().default(0),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('idx_scraped_queue_status').on(table.status),
    priorityIdx: index('idx_scraped_queue_priority').on(table.priority),
  })
);

