import { pgTable, text, uuid, timestamp, integer, jsonb, decimal, varchar, index } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

/**
 * User enrichments for mission reports
 * Post-generation data added by users (family locations, notes, annotations)
 */
export type UserEnrichments = {
  familyMembers: Array<{
    id: string;
    name: string;
    relationship: string;
    location: {
      address: string;
      coordinates: { lat: number; lng: number };
    };
    phone?: string;
  }>;
  notes: Array<{
    id: string;
    sectionType: 'contact' | 'bundle' | 'skill' | 'general';
    targetId?: string;
    content: string;
    createdAt: string;
  }>;
};

/**
 * Personnel data from wizard form
 * Stores family member information entered during plan creation
 */
export type PersonnelData = Array<{
  name?: string;
  age: number;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  medicalConditions?: string;
  specialNeeds?: string;
}>;

export const missionReports = pgTable(
  'mission_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    jobId: uuid('job_id'), // LLM service workflow job ID for tracking generation
    status: varchar('status', { length: 50 }), // Job status: 'generating' | 'completed' | 'failed' | 'cancelled'
    title: text('title').notNull(),
    location: text('location'),
    scenarios: text('scenarios').array().notNull(),
    familySize: integer('family_size').notNull().default(1),
    durationDays: integer('duration_days').notNull().default(3),
    mobilityType: text('mobility_type').default('on_foot'),
    budgetAmount: decimal('budget_amount', { precision: 10, scale: 2 }),
    reportData: jsonb('report_data').notNull(),
    evacuationRoutes: jsonb('evacuation_routes'), // Separate field for evacuation routes
    personnelData: jsonb('personnel_data').$type<PersonnelData>(), // Personnel from wizard step 2
    userEnrichments: jsonb('user_enrichments').$type<UserEnrichments>().default({
      familyMembers: [],
      notes: [],
    }),
    readinessScore: integer('readiness_score'),
    scenarioScores: jsonb('scenario_scores'),
    componentScores: jsonb('component_scores'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('idx_mission_reports_user_id').on(table.userId),
    jobIdIdx: index('idx_mission_reports_job_id').on(table.jobId),
    statusIdx: index('idx_mission_reports_status').on(table.status),
    scenariosIdx: index('idx_mission_reports_scenarios').using('gin', table.scenarios),
    deletedAtIdx: index('idx_mission_reports_deleted_at').on(table.deletedAt),
    userEnrichmentsIdx: index('idx_mission_reports_user_enrichments').using('gin', table.userEnrichments),
  })
);

