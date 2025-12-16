import { pgTable, text, uuid, timestamp, integer, index, unique } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const expertCalls = pgTable(
  'expert_calls',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    callType: text('call_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(60),
    timezone: text('timezone').notNull().default('America/New_York'),
    tierRequired: text('tier_required').notNull().default('FREE'),
    maxAttendees: integer('max_attendees'),
    expertName: text('expert_name'),
    expertBio: text('expert_bio'),
    expertPhotoUrl: text('expert_photo_url'),
    expertSpecialty: text('expert_specialty'),
    zoomLink: text('zoom_link'),
    zoomMeetingId: text('zoom_meeting_id'),
    zoomPassword: text('zoom_password'),
    recordingUrl: text('recording_url'),
    recordingAvailableDate: timestamp('recording_available_date', { withTimezone: true }),
    status: text('status').notNull().default('scheduled'),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    scheduledDateIdx: index('idx_expert_calls_scheduled_date').on(table.scheduledDate),
    callTypeIdx: index('idx_expert_calls_call_type').on(table.callType),
    statusIdx: index('idx_expert_calls_status').on(table.status),
  })
);

export const callAttendance = pgTable(
  'call_attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    callId: uuid('call_id')
      .notNull()
      .references(() => expertCalls.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
    attended: text('attended'),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    leftAt: timestamp('left_at', { withTimezone: true }),
    durationMinutes: integer('duration_minutes'),
    rating: integer('rating'),
    feedbackText: text('feedback_text'),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    callIdIdx: index('idx_call_attendance_call_id').on(table.callId),
    userIdIdx: index('idx_call_attendance_user_id').on(table.userId),
    attendedIdx: index('idx_call_attendance_attended').on(table.attended),
    uniqueCallUserIdx: unique('idx_call_attendance_unique').on(table.callId, table.userId),
  })
);

