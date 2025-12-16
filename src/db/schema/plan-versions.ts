import { pgTable, text, uuid, timestamp, integer, jsonb, decimal, index, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { missionReports } from './mission-reports';

/**
 * Plan Versions Table
 * Complete version history of mission reports for rollback and audit
 *
 * Features:
 * - Full snapshot of plan data at each version
 * - Linear version history with parent tracking
 * - Change summary and edit tracking
 * - Automatic version numbering
 * - Cascade deletion when parent plan is permanently deleted
 */
export const planVersions = pgTable(
  'plan_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    missionReportId: uuid('mission_report_id')
      .notNull()
      .references(() => missionReports.id, { onDelete: 'cascade' }),
    parentVersionId: uuid('parent_version_id').references((): AnyPgColumn => planVersions.id),
    versionNumber: integer('version_number').notNull(),

    // Full snapshot of data at this version
    title: text('title').notNull(),
    location: text('location'),
    scenarios: text('scenarios').array().notNull(),
    familySize: integer('family_size').notNull(),
    durationDays: integer('duration_days').notNull(),
    mobilityType: text('mobility_type'),
    budgetAmount: decimal('budget_amount', { precision: 10, scale: 2 }),
    reportData: jsonb('report_data').notNull(),
    evacuationRoutes: jsonb('evacuation_routes'),
    readinessScore: integer('readiness_score'),
    scenarioScores: jsonb('scenario_scores'),
    componentScores: jsonb('component_scores'),

    // Version metadata
    changesSummary: text('changes_summary'),
    changedFields: text('changed_fields').array(),
    editedByUserId: uuid('edited_by_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    editReason: text('edit_reason'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    missionReportIdx: index('idx_plan_versions_mission_report').on(table.missionReportId),
    versionNumberIdx: index('idx_plan_versions_version_number').on(
      table.missionReportId,
      table.versionNumber
    ),
    editedByIdx: index('idx_plan_versions_edited_by').on(table.editedByUserId),
    createdAtIdx: index('idx_plan_versions_created_at').on(table.createdAt),
  })
);

export type PlanVersion = typeof planVersions.$inferSelect;
export type NewPlanVersion = typeof planVersions.$inferInsert;
