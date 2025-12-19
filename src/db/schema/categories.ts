import { pgTable, text, uuid, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    parentId: uuid('parent_id'),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    icon: text('icon').default('🗂️'),
    changeHistory: jsonb('change_history').default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    parentIdIdx: index('idx_categories_parent_id').on(table.parentId),
    slugIdx: index('idx_categories_slug').on(table.slug),
    iconIdx: index('idx_categories_icon').on(table.icon),
  })
);

// Self-referencing foreign key for parent category
export const categoriesRelations = {
  parent: {
    fields: [categories.parentId],
    references: [categories.id],
  },
};

