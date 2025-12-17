-- Migration: Restore user_id foreign key constraint for main app integration
-- Date: Phase 10 implementation
-- Prerequisites: Main app profiles table must be accessible via shared database
--
-- IMPORTANT: This migration restores data integrity when integrating the
-- LLM microservice with the main Next.js application.
--
-- Migration 004 dropped this constraint to allow standalone testing.
-- This migration must be applied BEFORE Phase 10 integration.

BEGIN;

-- Step 1: Clean up any test records with invalid or NULL user_id
-- Option A: Delete test records entirely
-- DELETE FROM llm_workflow_jobs WHERE user_id IS NULL;

-- Option B: Set NULL user_id to a default test user (recommended)
-- UPDATE llm_workflow_jobs
-- SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
-- WHERE user_id IS NULL;

-- Step 2: Clean up records where user_id doesn't exist in profiles table
UPDATE llm_workflow_jobs
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = llm_workflow_jobs.user_id
  );

-- Step 3: Restore foreign key constraint
-- This ensures all future workflow jobs are linked to valid users
ALTER TABLE llm_workflow_jobs
    ADD CONSTRAINT llm_workflow_jobs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 4: Make user_id required again (optional, depends on requirements)
-- Uncomment if you want to enforce user_id for all workflows
-- ALTER TABLE llm_workflow_jobs
--     ALTER COLUMN user_id SET NOT NULL;

COMMIT;

-- Post-migration verification:
-- SELECT COUNT(*) FROM llm_workflow_jobs WHERE user_id IS NULL;
-- SELECT constraint_name FROM information_schema.table_constraints
-- WHERE table_name = 'llm_workflow_jobs' AND constraint_type = 'FOREIGN KEY';
