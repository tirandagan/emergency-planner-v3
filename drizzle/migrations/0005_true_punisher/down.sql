-- Down Migration for 0005_true_punisher
-- Rollback: Add icon field to categories table

-- WARNING: This will permanently delete all category icon data

DROP INDEX IF EXISTS "idx_categories_icon";
ALTER TABLE "categories" DROP COLUMN IF EXISTS "icon";
