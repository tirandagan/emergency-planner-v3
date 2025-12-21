-- Down Migration: Rollback LLM Callbacks tables
-- Generated: 2025-12-20
-- Purpose: Safely reverse the creation of llm_callbacks and llm_callback_views tables

-- WARNING: This migration will DELETE ALL DATA in both tables
-- Ensure you have backups before proceeding

-- Drop trigger first
DROP TRIGGER IF EXISTS update_llm_callbacks_updated_at ON "llm_callbacks";

-- Drop indexes for llm_callback_views
DROP INDEX IF EXISTS "idx_llm_callback_views_admin_viewed";

-- Drop llm_callback_views table (child table must be dropped first due to FK)
DROP TABLE IF EXISTS "llm_callback_views";

-- Drop indexes for llm_callbacks
DROP INDEX IF EXISTS "idx_llm_callbacks_workflow_name";
DROP INDEX IF EXISTS "idx_llm_callbacks_external_job_id";
DROP INDEX IF EXISTS "idx_llm_callbacks_callback_id";
DROP INDEX IF EXISTS "idx_llm_callbacks_status";
DROP INDEX IF EXISTS "idx_llm_callbacks_created_at";

-- Drop llm_callbacks table
DROP TABLE IF EXISTS "llm_callbacks";

-- Note: update_updated_at_column() function is left in place
-- as it may be used by other tables. If you need to remove it:
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- Migration complete
-- All llm_callbacks and llm_callback_views data has been removed
