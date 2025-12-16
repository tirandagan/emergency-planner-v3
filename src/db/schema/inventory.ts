import { pgTable, text, uuid, timestamp, integer, decimal, date, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { masterItems, specificProducts } from './products';
import { bundles } from './bundles';
import { missionReports } from './mission-reports';

export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    masterItemId: uuid('master_item_id').references(() => masterItems.id, { onDelete: 'set null' }),
    specificProductId: uuid('specific_product_id').references(() => specificProducts.id, {
      onDelete: 'set null',
    }),
    quantityOwned: integer('quantity_owned').notNull().default(0),
    quantityNeeded: integer('quantity_needed').notNull().default(0),
    status: text('status').notNull().default('needed'),
    purchaseDate: date('purchase_date'),
    purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }),
    purchaseUrl: text('purchase_url'),
    expirationDate: date('expiration_date'),
    missionReportId: uuid('mission_report_id').references(() => missionReports.id, {
      onDelete: 'set null',
    }),
    bundleId: uuid('bundle_id').references(() => bundles.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_inventory_items_user_id').on(table.userId),
    userStatusIdx: index('idx_inventory_items_user_status').on(table.userId, table.status),
    userExpirationIdx: index('idx_inventory_items_user_expiration').on(
      table.userId,
      table.expirationDate
    ),
    missionReportIdIdx: index('idx_inventory_items_mission_report_id').on(table.missionReportId),
  })
);

