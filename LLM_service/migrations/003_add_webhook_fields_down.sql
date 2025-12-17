-- Migration 003 Rollback: Remove webhook and debug fields from llm_workflow_jobs
-- Description: Removes webhook_permanently_failed and debug_mode fields
-- Created: 2024-12-16

-- Drop index
DROP INDEX IF EXISTS idx_workflow_jobs_webhook_failed;

-- Remove webhook_permanently_failed field
ALTER TABLE llm_workflow_jobs
DROP COLUMN IF EXISTS webhook_permanently_failed;

-- Remove debug_mode field
ALTER TABLE llm_workflow_jobs
DROP COLUMN IF EXISTS debug_mode;
