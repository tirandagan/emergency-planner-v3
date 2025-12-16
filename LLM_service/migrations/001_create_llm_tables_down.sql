-- Rollback Migration: 001_create_llm_tables
-- Date: 2024-12-16

BEGIN;

DROP TABLE IF EXISTS llm_provider_usage CASCADE;
DROP TABLE IF EXISTS llm_webhook_attempts CASCADE;
DROP TABLE IF EXISTS llm_workflow_jobs CASCADE;

COMMIT;
