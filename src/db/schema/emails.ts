import { pgTable, text, uuid, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';

export const emailCampaigns = pgTable(
  'email_campaigns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    subject: text('subject').notNull(),
    previewText: text('preview_text'),
    bodyTemplate: text('body_template').notNull(),
    aiPrompt: text('ai_prompt'),
    targetSegment: text('target_segment'),
    segmentFilter: jsonb('segment_filter'),
    scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
    status: text('status').notNull().default('draft'),
    recipientsCount: integer('recipients_count').default(0),
    deliveredCount: integer('delivered_count').default(0),
    openedCount: integer('opened_count').default(0),
    clickedCount: integer('clicked_count').default(0),
    bouncedCount: integer('bounced_count').default(0),
    unsubscribedCount: integer('unsubscribed_count').default(0),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (table) => ({
    statusIdx: index('idx_email_campaigns_status').on(table.status),
    scheduledDateIdx: index('idx_email_campaigns_scheduled_date').on(table.scheduledDate),
    createdAtIdx: index('idx_email_campaigns_created_at').on(table.createdAt),
  })
);

