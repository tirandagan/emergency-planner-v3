-- Rollback migration: Remove user_id foreign key constraint
-- Date: Phase 10 implementation
--
-- This rollback returns the database to standalone mode where the
-- microservice can operate without access to the profiles table.

BEGIN;

-- Drop the foreign key constraint
ALTER TABLE llm_workflow_jobs
    DROP CONSTRAINT IF EXISTS llm_workflow_jobs_user_id_fkey;

-- Make user_id nullable (if it was set to NOT NULL in forward migration)
ALTER TABLE llm_workflow_jobs
    ALTER COLUMN user_id DROP NOT NULL;

COMMIT;

-- Note: This returns the database to the state after Migration 004
-- (standalone testing mode with nullable user_id and no foreign key constraint)
