-- Rollback migration: Make user_id required again and restore foreign key
-- Date: 2024-12-16

BEGIN;

-- Step 1: First, update NULL values to a default UUID (if any exist)
-- This prevents the NOT NULL constraint from failing
UPDATE llm_workflow_jobs
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid
WHERE user_id IS NULL;

-- Step 2: Make user_id required again
ALTER TABLE llm_workflow_jobs
    ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Restore the foreign key constraint
-- WARNING: This will fail if any user_id values don't exist in profiles table
ALTER TABLE llm_workflow_jobs
    ADD CONSTRAINT llm_workflow_jobs_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

COMMIT;
