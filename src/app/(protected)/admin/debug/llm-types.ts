/**
 * TypeScript types for LLM Workflow Microservice API
 * Based on API documentation from LLM_service/API_GUIDE.md
 */

// Job List Response Types
export interface LLMJob {
  job_id: string;
  workflow_name: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  user_id: string | null;
  user_email?: string; // Fetched separately from profiles table
  username?: string; // Username who triggered the workflow
  action?: string; // User activity requiring the workflow
  created_at: string; // ISO 8601
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
}

export interface LLMJobsResponse {
  jobs: LLMJob[];
  total: number;
  limit: number;
  offset: number;
}

// Job Status Detail Response Types
export interface LLMJobDetail {
  job_id: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  workflow_name: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  result: unknown | null; // Complex nested object, type varies by workflow
  error_message: string | null;
  current_step: string | null;
  steps_completed: number | null;
  total_steps: number | null;
}

// Filter and Sort Types
export type JobStatusFilter = 'all' | 'running' | 'completed' | 'failed';
export type SortField = 'job_id' | 'created_at' | 'workflow_name' | 'status' | 'duration_ms';
export type SortDirection = 'asc' | 'desc';

// LLM Service Health Types
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'no_workers';

export interface ServiceHealth {
  status: HealthStatus;
  type?: string;
  workers?: number;
  error?: string;
}

export interface LLMHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    celery: ServiceHealth;
  };
}
