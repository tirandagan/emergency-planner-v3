-- Down migration for 0005_large_aqueduct.sql
-- Removes job_id column and index from mission_reports table
--
-- ⚠️ WARNING: This will permanently delete the job_id column and all its data
-- ⚠️ Run this only if you need to rollback the LLM service integration

-- Drop the index first
DROP INDEX IF EXISTS "idx_mission_reports_job_id";

-- Drop the column
ALTER TABLE "mission_reports" DROP COLUMN IF EXISTS "job_id";
