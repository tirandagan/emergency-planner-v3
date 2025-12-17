-- Migration: Make user_id nullable for standalone microservice testing
-- Date: 2024-12-16

BEGIN;

-- Step 1: Drop the foreign key constraint
-- This allows the microservice to operate standalone without access to profiles table
ALTER TABLE llm_workflow_jobs
    DROP CONSTRAINT IF EXISTS llm_workflow_jobs_user_id_fkey;

-- Step 2: Make user_id nullable (remove NOT NULL constraint if it exists)
ALTER TABLE llm_workflow_jobs
    ALTER COLUMN user_id DROP NOT NULL;

-- Note: User ID is now optional (nullable) and has no foreign key constraint
-- This allows standalone microservice testing without requiring profiles table access
-- When integrated with main app, the application layer should validate user_id

COMMIT;
