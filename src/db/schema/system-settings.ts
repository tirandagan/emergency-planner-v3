import { pgTable, text, uuid, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

/**
 * System Settings Table
 * Global admin-configurable settings for system behaviors
 *
 * Features:
 * - Key-value configuration store
 * - Type-safe value storage via JSONB
 * - Change tracking (who changed what when)
 * - Environment-specific overrides (dev/staging/prod)
 */
export const systemSettings = pgTable(
  'system_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: text('key').notNull().unique(),
    value: text('value').notNull(),
    valueType: text('value_type', {
      enum: ['number', 'string', 'boolean', 'object', 'array'],
    })
      .notNull()
      .default('string'),
    description: text('description'),
    category: text('category').notNull().default('general'),
    isEditable: boolean('is_editable').notNull().default(true),
    environment: text('environment').default('all'),
    lastModifiedBy: uuid('last_modified_by').references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    keyIdx: index('idx_system_settings_key').on(table.key),
    categoryIdx: index('idx_system_settings_category').on(table.category),
    environmentIdx: index('idx_system_settings_environment').on(table.environment),
  })
);

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;

/**
 * Default system settings to seed
 */
export const DEFAULT_SYSTEM_SETTINGS = [
  {
    key: 'share_link_expiration_days',
    value: '30',
    valueType: 'number' as const,
    description: 'Default number of days before share links expire',
    category: 'sharing',
  },
  {
    key: 'deleted_plans_retention_days',
    value: '30',
    valueType: 'number' as const,
    description: 'Number of days to keep soft-deleted plans before permanent deletion',
    category: 'cleanup',
  },
  {
    key: 'send_share_notification_emails',
    value: 'true',
    valueType: 'boolean' as const,
    description: 'Whether to send email notifications when plans are shared',
    category: 'notifications',
  },
  {
    key: 'max_plan_versions_per_report',
    value: '10',
    valueType: 'number' as const,
    description: 'Maximum number of versions to retain per plan',
    category: 'versioning',
  },
  {
    key: 'llm_service_url',
    value: 'https://llm-service-api.onrender.com',
    valueType: 'string' as const,
    description: 'Base URL for LLM Workflow Microservice API endpoints',
    category: 'integrations',
  },
  {
    key: 'admin_email',
    value: 'admin@beprepared.ai',
    valueType: 'string' as const,
    description: 'Email address for system error notifications and admin alerts',
    category: 'notifications',
    isEditable: true,
  },
];
