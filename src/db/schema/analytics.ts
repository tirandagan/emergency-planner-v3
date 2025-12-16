import { pgTable, text, uuid, timestamp, jsonb, index, boolean } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { specificProducts } from './products';
import { bundles } from './bundles';

export const externalTransactions = pgTable(
  'external_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    specificProductId: uuid('specific_product_id')
      .notNull()
      .references(() => specificProducts.id, { onDelete: 'cascade' }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }).defaultNow().notNull(),
    source: text('source').notNull(),
    bundleId: uuid('bundle_id').references(() => bundles.id, { onDelete: 'set null' }),
    isOriginalProduct: boolean('is_original_product').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_external_transactions_user_id').on(table.userId),
    bundleIdIdx: index('idx_external_transactions_bundle_id').on(table.bundleId),
    clickedAtIdx: index('idx_external_transactions_clicked_at').on(table.clickedAt),
    userClickedAtIdx: index('idx_external_transactions_user_clicked_at').on(
      table.userId,
      table.clickedAt
    ),
  })
);

export const userActivityLog = pgTable(
  'user_activity_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    activityType: text('activity_type').notNull(),
    metadata: jsonb('metadata'),
    sessionId: text('session_id'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_user_activity_log_user_id').on(table.userId),
    activityTypeIdx: index('idx_user_activity_log_activity_type').on(table.activityType),
    createdAtIdx: index('idx_user_activity_log_created_at').on(table.createdAt),
    metadataIdx: index('idx_user_activity_log_metadata').using('gin', table.metadata),
  })
);

