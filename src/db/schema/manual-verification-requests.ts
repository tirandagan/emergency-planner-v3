import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const manualVerificationRequests = pgTable('manual_verification_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(), // 'LOST_ACCESS' | 'EMAIL_NOT_ARRIVING' | 'OTHER'
  details: text('details'),
  alternateContact: text('alternate_contact'),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'APPROVED' | 'REJECTED'
  adminNotes: text('admin_notes'),
  reviewedBy: uuid('reviewed_by').references(() => profiles.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

