import { pgTable, text, uuid, timestamp, jsonb, index, integer, pgEnum } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const importStatusEnum = pgEnum('import_status', ['pending', 'processing', 'completed', 'failed', 'partial']);

export const importHistory = pgTable(
  'import_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    targetTable: text('target_table').notNull(),
    status: importStatusEnum('status').notNull().default('pending'),
    totalRows: integer('total_rows').notNull().default(0),
    successCount: integer('success_count').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    errors: jsonb('errors').$type<Array<{ row: number; field: string; message: string }>>(),
    mapping: jsonb('mapping').$type<Record<string, { targetField: string; enabled: boolean }>>(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_import_history_user_id').on(table.userId),
    statusIdx: index('idx_import_history_status').on(table.status),
    createdAtIdx: index('idx_import_history_created_at').on(table.createdAt),
    targetTableIdx: index('idx_import_history_target_table').on(table.targetTable),
  })
);

export type ImportHistory = typeof importHistory.$inferSelect;
export type NewImportHistory = typeof importHistory.$inferInsert;
