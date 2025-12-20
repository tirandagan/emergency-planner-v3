import { pgTable, text, uuid, timestamp, integer, decimal, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';
import { bundles } from './bundles';
import { orders } from './commerce';

/**
 * Consulting Services Table
 * Admin-configurable consulting offerings (generic and bundle-specific)
 *
 * Features:
 * - Generic services available to all users
 * - Bundle-specific services for targeted upsells
 * - Scenario-based targeting for relevant recommendations
 * - Admin control over active/inactive status and display order
 * - JSONB qualifying questions for flexible intake workflows
 */
export const consultingServices = pgTable(
  'consulting_services',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    genericDescription: text('generic_description').notNull(),
    qualifyingQuestions: jsonb('qualifying_questions').notNull(),
    isGeneric: boolean('is_generic').notNull().default(true),
    targetScenarios: text('target_scenarios').array(),
    bundleId: uuid('bundle_id').references(() => bundles.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    bundleIdIdx: index('idx_consulting_services_bundle_id').on(table.bundleId),
    isGenericIdx: index('idx_consulting_services_is_generic').on(table.isGeneric),
    isActiveIdx: index('idx_consulting_services_is_active').on(table.isActive),
    targetScenariosIdx: index('idx_consulting_services_target_scenarios').using('gin', table.targetScenarios),
  })
);

/**
 * Consulting Bookings Table
 * Tracks user consulting bookings with intake responses and AI-generated agendas
 *
 * Features:
 * - Stores user intake questionnaire responses as JSONB
 * - AI-generated session agendas with markdown formatting
 * - Snapshot of hourly rate at time of booking (price consistency)
 * - Links to orders table for payment processing integration
 * - Status workflow: pending → scheduled → completed/cancelled
 * - Admin notes for session preparation
 */
export const consultingBookings = pgTable(
  'consulting_bookings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    consultingServiceId: uuid('consulting_service_id')
      .notNull()
      .references(() => consultingServices.id, { onDelete: 'restrict' }),
    intakeResponses: jsonb('intake_responses').notNull(),
    generatedAgenda: text('generated_agenda'),
    agendaGeneratedAt: timestamp('agenda_generated_at', { withTimezone: true }),
    estimatedDurationMinutes: integer('estimated_duration_minutes'),
    hourlyRateAtBooking: decimal('hourly_rate_at_booking', { precision: 10, scale: 2 }).notNull(),
    totalEstimatedCost: decimal('total_estimated_cost', { precision: 10, scale: 2 }),
    status: text('status').notNull().default('pending'),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    calendlyEventId: text('calendly_event_id'),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_consulting_bookings_user_id').on(table.userId),
    serviceIdIdx: index('idx_consulting_bookings_service_id').on(table.consultingServiceId),
    statusIdx: index('idx_consulting_bookings_status').on(table.status),
    orderIdIdx: index('idx_consulting_bookings_order_id').on(table.orderId),
  })
);

export type ConsultingService = typeof consultingServices.$inferSelect;
export type NewConsultingService = typeof consultingServices.$inferInsert;
export type ConsultingBooking = typeof consultingBookings.$inferSelect;
export type NewConsultingBooking = typeof consultingBookings.$inferInsert;
