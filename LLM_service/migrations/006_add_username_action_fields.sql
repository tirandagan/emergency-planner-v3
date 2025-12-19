-- Migration 006: Add username and action fields to llm_workflow_jobs
-- Purpose: Track who triggered workflows and what activity required them
-- Phase: Task 057 - LLM Service Enhancement
-- Created: 2025-12-19

-- Add username column (informational - who triggered the workflow)
ALTER TABLE llm_workflow_jobs
  ADD COLUMN username VARCHAR(255) NULL;

-- Add action column (informational - what user activity required the workflow)
ALTER TABLE llm_workflow_jobs
  ADD COLUMN action VARCHAR(255) NULL;

-- Add comments for documentation
COMMENT ON COLUMN llm_workflow_jobs.username IS 'Username of person who triggered the workflow (informational, no referential integrity)';
COMMENT ON COLUMN llm_workflow_jobs.action IS 'User activity that required the workflow (e.g., "generate mission report", "add driving directions")';

-- Verification query (run after migration)
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns
-- WHERE table_name = 'llm_workflow_jobs' AND column_name IN ('username', 'action');

-- Expected result:
--   column_name | data_type       | is_nullable
--  -------------+-----------------+-------------
--   username    | character varying| YES
--   action      | character varying| YES
