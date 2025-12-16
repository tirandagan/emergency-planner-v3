import { pgTable, text, uuid, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { missionReports } from './mission-reports';
import { sql } from 'drizzle-orm';

/**
 * Plan Shares Table
 * Tracks shared mission reports with email invitations and shareable links
 *
 * Features:
 * - Share via email with expiration tracking
 * - Unique share tokens for public access
 * - View/Edit permissions
 * - 30-day default expiration
 * - Cascade deletion when plan is deleted
 * - Disabled status tracking for tier downgrades
 */
export const planShares = pgTable(
  'plan_shares',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    missionReportId: uuid('mission_report_id')
      .notNull()
      .references(() => missionReports.id, { onDelete: 'cascade' }),
    sharedByUserId: uuid('shared_by_user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    sharedWithEmail: text('shared_with_email').notNull(),
    shareToken: uuid('share_token').defaultRandom().notNull().unique(),
    permissions: text('permissions', { enum: ['view', 'edit'] }).notNull().default('view'),
    expiresAt: timestamp('expires_at', { withTimezone: true })
      .notNull()
      .default(sql`NOW() + INTERVAL '30 days'`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    accessedAt: timestamp('accessed_at', { withTimezone: true }),

    // Disabled status for tier downgrades
    isDisabled: boolean('is_disabled').notNull().default(false),
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
    disabledReason: text('disabled_reason', {
      enum: ['tier_downgrade', 'manual', 'expired', 'owner_request', 'admin_action'],
    }),
    reactivatedAt: timestamp('reactivated_at', { withTimezone: true }),
  },
  (table) => ({
    // Performance indexes
    shareTokenIdx: index('idx_plan_shares_token').on(table.shareToken),
    missionReportIdx: index('idx_plan_shares_mission_report').on(table.missionReportId),
    sharedByIdx: index('idx_plan_shares_shared_by').on(table.sharedByUserId),
    isDisabledIdx: index('idx_plan_shares_disabled').on(table.isDisabled, table.missionReportId),
  })
);

export type PlanShare = typeof planShares.$inferSelect;
export type NewPlanShare = typeof planShares.$inferInsert;

