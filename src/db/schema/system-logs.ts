import { pgTable, text, uuid, timestamp, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

/**
 * System Log Severity Levels
 */
export const systemLogSeverityEnum = pgEnum('system_log_severity', [
  'debug',
  'info',
  'warning',
  'error',
  'critical',
]);

/**
 * System Log Categories
 */
export const systemLogCategoryEnum = pgEnum('system_log_category', [
  'api_error',
  'auth_error',
  'database_error',
  'external_service',
  'payment_error',
  'ai_error',
  'validation_error',
  'permission_error',
  'system_error',
  'user_action',
]);

/**
 * System Logs Table
 * Stores system errors, warnings, and important events for admin review
 */
export const systemLogs = pgTable(
  'system_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Log classification
    severity: systemLogSeverityEnum('severity').notNull().default('error'),
    category: systemLogCategoryEnum('category').notNull().default('system_error'),

    // Error identification
    errorCode: text('error_code'), // e.g., 'GOOGLE_API_REFERER_NOT_ALLOWED'
    errorName: text('error_name'), // e.g., 'RefererNotAllowedMapError'
    message: text('message').notNull(),

    // Context
    userId: uuid('user_id').references(() => profiles.id, { onDelete: 'set null' }),
    userAction: text('user_action'), // What the user was doing, e.g., 'Creating mission plan'
    component: text('component'), // e.g., 'LocationAutocomplete', 'MissionGenerator'
    route: text('route'), // e.g., '/plans/new', '/api/mission-plan/generate'

    // Technical details
    stackTrace: text('stack_trace'),
    requestData: jsonb('request_data'), // Request payload, sanitized
    responseData: jsonb('response_data'), // Response from external service
    metadata: jsonb('metadata'), // Additional context

    // Browser/Client info
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),

    // Resolution tracking
    resolved: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: uuid('resolved_by').references(() => profiles.id, { onDelete: 'set null' }),
    resolution: text('resolution'), // How it was resolved

    // Admin notification
    adminNotified: timestamp('admin_notified_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    severityIdx: index('idx_system_logs_severity').on(table.severity),
    categoryIdx: index('idx_system_logs_category').on(table.category),
    userIdIdx: index('idx_system_logs_user_id').on(table.userId),
    createdAtIdx: index('idx_system_logs_created_at').on(table.createdAt),
    unresolvedIdx: index('idx_system_logs_unresolved').on(table.severity, table.resolved),
    errorCodeIdx: index('idx_system_logs_error_code').on(table.errorCode),
    componentIdx: index('idx_system_logs_component').on(table.component),
  })
);

// Type exports for use in application code
export type SystemLog = typeof systemLogs.$inferSelect;
export type NewSystemLog = typeof systemLogs.$inferInsert;
export type SystemLogSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type SystemLogCategory =
  | 'api_error'
  | 'auth_error'
  | 'database_error'
  | 'external_service'
  | 'payment_error'
  | 'ai_error'
  | 'validation_error'
  | 'permission_error'
  | 'system_error'
  | 'user_action';
