import { pgTable, text, uuid, timestamp, integer, jsonb, boolean, index, unique } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const skillsResources = pgTable(
  'skills_resources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    skillName: text('skill_name').notNull(),
    category: text('category').notNull(),
    resourceType: text('resource_type').notNull(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    author: text('author'),
    source: text('source'),
    durationMinutes: integer('duration_minutes'),
    difficulty: text('difficulty'),
    summary: text('summary'),
    keyTechniques: jsonb('key_techniques'),
    prerequisites: text('prerequisites').array(),
    relatedSkills: text('related_skills').array(),
    scenarios: text('scenarios').array(),
    rating: integer('rating'),
    viewCount: integer('view_count').default(0),
    isVerified: boolean('is_verified').default(false),
    isFeatured: boolean('is_featured').default(false),
    adminNotes: text('admin_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    skillNameIdx: index('idx_skills_resources_skill_name').on(table.skillName),
    categoryIdx: index('idx_skills_resources_category').on(table.category),
    scenariosIdx: index('idx_skills_resources_scenarios').using('gin', table.scenarios),
    isVerifiedIdx: index('idx_skills_resources_is_verified').on(table.isVerified),
  })
);

export const userSkillProgress = pgTable(
  'user_skill_progress',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    skillResourceId: uuid('skill_resource_id')
      .notNull()
      .references(() => skillsResources.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('not_started'),
    progressPercentage: integer('progress_percentage').default(0),
    notes: text('notes'),
    lastAccessed: timestamp('last_accessed', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('idx_user_skill_progress_user_id').on(table.userId),
    uniqueUserSkillIdx: unique('idx_user_skill_progress_unique').on(
      table.userId,
      table.skillResourceId
    ),
  })
);

