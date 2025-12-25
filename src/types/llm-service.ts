/**
 * LLM Service API Type Definitions
 * Types for interacting with the LLM service workflow system
 */

/**
 * Workflow job status values
 */
export type LLMJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * Job status response from LLM service
 */
export interface LLMJobStatusResponse {
  job_id: string;
  workflow_name: string;
  status: LLMJobStatus;
  current_step_id?: string;
  current_step_name?: string;
  progress_percentage?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  error_details?: Record<string, unknown>;
  output?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Job submission request
 */
export interface LLMJobSubmitRequest {
  workflow_name: string;
  input_data: Record<string, unknown>;
  user_id?: string;
  webhook_url?: string;
  priority?: number;
}

/**
 * Job submission response
 */
export interface LLMJobSubmitResponse {
  job_id: string;
  status: LLMJobStatus;
  created_at: string;
}

/**
 * Job cancellation response
 */
export interface LLMJobCancelResponse {
  deleted_count: number;
  job_ids: string[];
}

/**
 * Job progress for UI display
 */
export interface LLMJobProgress {
  currentStep: string;
  percentage: number;
}

/**
 * Workflow result data structure
 */
export interface LLMJobResult {
  mission_plan: string;
  parsed_sections: {
    executive_summary?: string;
    risk_assessment?: string;
    recommended_bundles?: string;
    survival_skills?: string;
    day_by_day?: string;
    next_steps?: string;
  };
  llm_usage: {
    model: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd: number;
    duration_ms: number;
  };
  cost_data: {
    provider: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd: number;
  };
}

/**
 * Error response from LLM service
 */
export interface LLMServiceError {
  error: string;
  details?: Record<string, unknown>;
  code?: string;
}
