-- Migration 006 Rollback: Remove username and action fields
-- Purpose: Revert to previous schema without user context tracking
-- Created: 2025-12-19

-- Drop action column (IF EXISTS for safe rollback)
ALTER TABLE llm_workflow_jobs
  DROP COLUMN IF EXISTS action;

-- Drop username column (IF EXISTS for safe rollback)
ALTER TABLE llm_workflow_jobs
  DROP COLUMN IF EXISTS username;

-- ℹ️ NOTE: No data loss concerns
-- These columns are informational only. Users can re-submit workflows
-- if needed after rollback. Existing historical data with NULL values
-- is acceptable.

-- Verification query (run after rollback)
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'llm_workflow_jobs' AND column_name IN ('username', 'action');

-- Expected result: Empty (0 rows)
