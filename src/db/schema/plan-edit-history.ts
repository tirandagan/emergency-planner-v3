import { pgTable, text, uuid, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { missionReports } from './mission-reports';
import { planVersions } from './plan-versions';

/**
 * Plan Edit History Table
 * Fine-grained audit trail for collaborative editing
 *
 * Features:
 * - Field-level change tracking (who changed what when)
 * - Old/new value storage for rollback
 * - Conflict detection for simultaneous edits
 * - Links to version snapshots
 * - IP and user agent tracking for security
 */
export const planEditHistory = pgTable(
  'plan_edit_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    missionReportId: uuid('mission_report_id')
      .notNull()
      .references(() => missionReports.id, { onDelete: 'cascade' }),
    versionId: uuid('version_id').references(() => planVersions.id),

    // Change tracking
    editedByUserId: uuid('edited_by_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    fieldPath: text('field_path').notNull(),
    fieldName: text('field_name').notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value').notNull(),
    changeType: text('change_type', {
      enum: ['create', 'update', 'delete', 'restore'],
    })
      .notNull()
      .default('update'),

    // Conflict resolution
    isConflict: boolean('is_conflict').notNull().default(false),
    conflictResolvedBy: uuid('conflict_resolved_by').references(() => profiles.id),
    conflictResolutionStrategy: text('conflict_resolution_strategy', {
      enum: ['accept_mine', 'accept_theirs', 'manual_merge', 'auto_merge'],
    }),

    // Metadata
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
    editSource: text('edit_source', {
      enum: ['web_ui', 'mobile_app', 'api', 'admin_panel'],
    })
      .notNull()
      .default('web_ui'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    missionReportIdx: index('idx_plan_edit_history_mission_report').on(table.missionReportId),
    editedByIdx: index('idx_plan_edit_history_edited_by').on(table.editedByUserId),
    fieldPathIdx: index('idx_plan_edit_history_field_path').on(
      table.missionReportId,
      table.fieldPath
    ),
    createdAtIdx: index('idx_plan_edit_history_created_at').on(table.createdAt),
    conflictIdx: index('idx_plan_edit_history_conflicts').on(
      table.isConflict,
      table.missionReportId
    ),
  })
);

export type PlanEditHistory = typeof planEditHistory.$inferSelect;
export type NewPlanEditHistory = typeof planEditHistory.$inferInsert;
