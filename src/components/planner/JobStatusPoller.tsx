/**
 * JobStatusPoller Component
 * Client component that polls LLM service job status with visibility-aware behavior
 * Only polls when user is on the page and tab is visible
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { LLMJobStatusResponse, LLMJobProgress } from '@/types/llm-service';

interface JobStatusPollerProps {
  reportId: string;
  jobId: string;
  onComplete?: (reportId: string) => void;
  onError?: (error: string) => void;
}

export function JobStatusPoller({
  reportId,
  jobId,
  onComplete,
  onError,
}: JobStatusPollerProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<LLMJobProgress>({
    currentStep: 'Initializing...',
    percentage: 0,
  });
  const [isPolling, setIsPolling] = useState(true);

  // Visibility-aware polling with cleanup
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let isVisible = !document.hidden;
    let isMounted = true;

    const poll = async (): Promise<void> => {
      if (!isVisible || !isMounted) return; // Don't poll when tab is hidden or unmounted

      try {
        const response = await fetch(`/api/llm-service/jobs/${jobId}`);
        const status: LLMJobStatusResponse = await response.json();

        if (!isMounted) return; // Component unmounted during fetch

        if (status.status === 'completed') {
          setIsPolling(false);
          setProgress({ currentStep: 'Complete!', percentage: 100 });

          // Wait a moment before redirecting
          setTimeout(() => {
            if (isMounted) {
              onComplete?.(reportId);
              router.push(`/plans/${reportId}`);
            }
          }, 1000);
          return;
        }

        if (status.status === 'failed') {
          setIsPolling(false);
          const errorMessage = status.error_message || 'Job failed with unknown error';
          setProgress({ currentStep: 'Failed', percentage: 0 });
          onError?.(errorMessage);
          return;
        }

        if (status.status === 'cancelled') {
          setIsPolling(false);
          setProgress({ currentStep: 'Cancelled', percentage: 0 });
          onError?.('Job was cancelled');
          return;
        }

        // Update progress
        const newProgress = estimateProgress(status);
        setProgress(newProgress);
      } catch (error) {
        console.error('[JobPoller] Error fetching status:', error);
        // Don't stop polling on network errors, retry next interval
      }
    };

    // Handle visibility changes
    const handleVisibilityChange = (): void => {
      const wasVisible = isVisible;
      isVisible = !document.hidden;

      if (isVisible && !wasVisible && isPolling) {
        // Tab became visible - refresh state immediately and resume polling
        poll();

        if (pollInterval) clearInterval(pollInterval);
        pollInterval = setInterval(poll, 2000);
      } else if (!isVisible && wasVisible) {
        // Tab hidden - stop polling to save resources
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start initial polling if visible
    if (isVisible) {
      poll();
      pollInterval = setInterval(poll, 2000);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [jobId, reportId, isPolling, onComplete, onError, router]);

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />

      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Generating Your Mission Plan
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-400">{progress.currentStep}</p>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-in-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
          {progress.percentage}% complete
        </p>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
        This usually takes 30-60 seconds. Feel free to navigate away - we'll notify you when it's
        ready!
      </p>
    </div>
  );
}

/**
 * Estimate progress based on current workflow step
 * Maps step IDs to human-readable display names and percentages
 */
function estimateProgress(status: LLMJobStatusResponse): LLMJobProgress {
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
