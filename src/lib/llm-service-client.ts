/**
 * LLM Service Client Library
 * Reusable TypeScript client for LLM service API interactions
 * Server-side only - uses environment variables for API configuration
 */

import type {
  LLMJobSubmitRequest,
  LLMJobSubmitResponse,
  LLMJobStatusResponse,
  LLMJobCancelResponse,
  LLMJobProgress,
  LLMServiceError,
} from '@/types/llm-service';

const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
const LLM_WEBHOOK_SECRET = process.env.LLM_WEBHOOK_SECRET;

if (!LLM_WEBHOOK_SECRET) {
  console.warn('[LLM Service] Webhook secret not configured - LLM service calls will fail');
}

/**
 * Submit a workflow job to the LLM service
 * @param workflowName - Name of the workflow to execute (e.g., 'mission_generation')
 * @param inputData - Input data for the workflow
 * @param options - Optional configuration (user_id, webhook_url, priority)
 * @returns Promise with job_id and status
 */
export async function submitWorkflow(
  workflowName: string,
  inputData: Record<string, unknown>,
  options?: {
    userId?: string;
    webhookUrl?: string;
    priority?: number;
  }
): Promise<LLMJobSubmitResponse> {
  const requestBody: LLMJobSubmitRequest = {
    workflow_name: workflowName,
    input_data: inputData,
    user_id: options?.userId,
    webhook_url: options?.webhookUrl,
    priority: options?.priority,
  };

  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/workflow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Secret': LLM_WEBHOOK_SECRET!,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error: LLMServiceError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(`Failed to submit workflow: ${error.error}`);
  }

  return response.json();
}

/**
 * Get the status of a workflow job
 * @param jobId - The job ID to check
 * @returns Promise with job status and details
 */
export async function getJobStatus(jobId: string): Promise<LLMJobStatusResponse> {
  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/jobs/${jobId}`, {
    headers: {
      'X-API-Secret': LLM_WEBHOOK_SECRET!,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const error: LLMServiceError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(`Failed to get job status: ${error.error}`);
  }

  return response.json();
}

/**
 * Cancel a workflow job
 * @param jobId - The job ID to cancel
 * @returns Promise with deletion confirmation
 */
export async function cancelJob(jobId: string): Promise<LLMJobCancelResponse> {
  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/jobs/bulk`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Secret': LLM_WEBHOOK_SECRET!,
    },
    body: JSON.stringify({ job_ids: [jobId] }),
  });

  if (!response.ok) {
    const error: LLMServiceError = await response.json().catch(() => ({
      error: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(`Failed to cancel job: ${error.error}`);
  }

  return response.json();
}

/**
 * Poll a job until it completes or fails
 * Useful for server-side operations that need to wait for results
 * NOT recommended for client-side use - use component-scoped polling instead
 *
 * @param jobId - The job ID to poll
 * @param options - Configuration options
 * @returns Promise with final job status
 */
export async function pollJobUntilComplete(
  jobId: string,
  options?: {
    intervalMs?: number;
    timeoutMs?: number;
    onProgress?: (progress: LLMJobProgress) => void;
  }
): Promise<LLMJobStatusResponse> {
  const intervalMs = options?.intervalMs || 2000;
  const timeoutMs = options?.timeoutMs || 300000; // 5 minutes default
  const startTime = Date.now();

  while (true) {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Job polling timed out after ${timeoutMs}ms`);
    }

    const status = await getJobStatus(jobId);

    if (status.status === 'completed') {
      return status;
    }

    if (status.status === 'failed') {
      throw new Error(status.error_message || 'Job failed with unknown error');
    }

    if (status.status === 'cancelled') {
      throw new Error('Job was cancelled');
    }

    // Call progress callback
    if (options?.onProgress) {
      const progress = estimateProgress(status);
      options.onProgress(progress);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * Estimate progress based on current step
 * Maps workflow step IDs to human-readable display names and percentages
 *
 * @param status - Current job status
 * @returns Progress information for UI display
 */
export function estimateProgress(status: LLMJobStatusResponse): LLMJobProgress {
  // Default progress based on status
  if (status.status === 'pending') {
    return { currentStep: 'Queued...', percentage: 0 };
  }

  if (status.status === 'completed') {
    return { currentStep: 'Complete', percentage: 100 };
  }

  if (status.status === 'failed') {
    return { currentStep: 'Failed', percentage: 0 };
  }

  // Use explicit progress percentage if provided
  if (status.progress_percentage !== undefined) {
    return {
      currentStep: status.current_step_name || status.current_step_id || 'Processing...',
      percentage: status.progress_percentage,
    };
  }

  // Fallback: Map step IDs to progress estimates
  const stepMap: Record<string, { display: string; percentage: number }> = {
    format_bundles: { display: 'Formatting Bundles', percentage: 5 },
    join_bundles: { display: 'Joining Bundles', percentage: 10 },
    build_scenario_list: { display: 'Building Scenario List', percentage: 15 },
    build_user_message: { display: 'Building User Message', percentage: 20 },
    generate_mission_plan: { display: 'Generating Mission Plan', percentage: 90 },
    parse_sections: { display: 'Parsing Sections', percentage: 95 },
  };

  const currentStepId = status.current_step_id || '';
  const stepInfo = stepMap[currentStepId] || {
    display: status.current_step_name || 'Processing...',
    percentage: 50,
  };

  return {
    currentStep: stepInfo.display,
    percentage: stepInfo.percentage,
  };
}
