-- Migration: Remove status and error_message columns from llm_callbacks
-- Generated: 2025-12-20
-- Purpose: Simplify schema - every received webhook is valid (no need for status tracking)

-- Drop the status index first
DROP INDEX IF EXISTS "idx_llm_callbacks_status";

-- Drop the columns
ALTER TABLE "llm_callbacks" DROP COLUMN IF EXISTS "status";
ALTER TABLE "llm_callbacks" DROP COLUMN IF EXISTS "error_message";
