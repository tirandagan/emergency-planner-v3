-- Migration 003: Add webhook and debug fields to llm_workflow_jobs
-- Description: Adds webhook_permanently_failed and debug_mode fields for Phase 7 webhook system
-- Created: 2024-12-16

-- Add webhook_permanently_failed field
-- Tracks if webhook delivery has permanently failed after all retries
ALTER TABLE llm_workflow_jobs
ADD COLUMN webhook_permanently_failed BOOLEAN DEFAULT FALSE;

-- Add debug_mode field
-- When true, webhook payloads include full LLM prompts and debug information
ALTER TABLE llm_workflow_jobs
ADD COLUMN debug_mode BOOLEAN DEFAULT FALSE;

-- Create index for quick lookup of permanently failed webhooks
CREATE INDEX idx_workflow_jobs_webhook_failed
ON llm_workflow_jobs(webhook_permanently_failed)
WHERE webhook_permanently_failed = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN llm_workflow_jobs.webhook_permanently_failed IS
'Set to true when webhook delivery fails after all retry attempts (3 retries)';

COMMENT ON COLUMN llm_workflow_jobs.debug_mode IS
'When true, webhook payloads include full LLM prompts and debug information';
