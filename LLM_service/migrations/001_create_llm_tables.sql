-- LLM Microservice Database Tables
-- Migration: 001_create_llm_tables
-- Date: 2024-12-16

BEGIN;

-- Primary job tracking table
CREATE TABLE IF NOT EXISTS llm_workflow_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    celery_task_id VARCHAR(255) UNIQUE NOT NULL,
    workflow_name VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 0,
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    input_data JSONB NOT NULL,
    result_data JSONB,
    error_message TEXT,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    is_stale BOOLEAN DEFAULT FALSE,
    stale_reason VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workflow_jobs_celery_task ON llm_workflow_jobs(celery_task_id);
CREATE INDEX idx_workflow_jobs_status ON llm_workflow_jobs(status);
CREATE INDEX idx_workflow_jobs_user_id ON llm_workflow_jobs(user_id);
CREATE INDEX idx_workflow_jobs_workflow_name ON llm_workflow_jobs(workflow_name);
CREATE INDEX idx_workflow_jobs_created_at ON llm_workflow_jobs(created_at);
CREATE INDEX idx_workflow_jobs_stale ON llm_workflow_jobs(is_stale) WHERE is_stale = TRUE;

-- Webhook delivery attempts (Dead Letter Queue tracking)
CREATE TABLE IF NOT EXISTS llm_webhook_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES llm_workflow_jobs(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    webhook_url TEXT NOT NULL,
    payload JSONB NOT NULL,
    http_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_attempts_job_id ON llm_webhook_attempts(job_id);
CREATE INDEX idx_webhook_attempts_status ON llm_webhook_attempts(http_status);
CREATE INDEX idx_webhook_attempts_next_retry ON llm_webhook_attempts(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- LLM provider usage tracking (microservice internal)
CREATE TABLE IF NOT EXISTS llm_provider_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES llm_workflow_jobs(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    duration_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_usage_job_id ON llm_provider_usage(job_id);
CREATE INDEX idx_provider_usage_provider ON llm_provider_usage(provider);
CREATE INDEX idx_provider_usage_model ON llm_provider_usage(model);
CREATE INDEX idx_provider_usage_created_at ON llm_provider_usage(created_at);

COMMIT;
