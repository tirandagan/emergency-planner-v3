-- Down migration for 0006_narrow_harry_osborn.sql
-- Removes status column and index from mission_reports table
--
-- ⚠️ WARNING: This will permanently delete the status column and all its data
-- ⚠️ Run this only if you need to rollback the LLM service integration

-- Drop the index first
DROP INDEX IF EXISTS "idx_mission_reports_status";

-- Drop the column
ALTER TABLE "mission_reports" DROP COLUMN IF EXISTS "status";
