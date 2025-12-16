-- Down Migration: 0007_soft_morlun
-- Reverts: import_history table and import_status enum
-- WARNING: This will permanently delete all import history data

-- Drop indexes first
DROP INDEX IF EXISTS "idx_import_history_user_id";
DROP INDEX IF EXISTS "idx_import_history_status";
DROP INDEX IF EXISTS "idx_import_history_created_at";
DROP INDEX IF EXISTS "idx_import_history_target_table";

-- Drop foreign key constraint
ALTER TABLE IF EXISTS "import_history" DROP CONSTRAINT IF EXISTS "import_history_user_id_profiles_id_fk";

-- Drop table
DROP TABLE IF EXISTS "import_history";

-- Drop enum type
DROP TYPE IF EXISTS "public"."import_status";
