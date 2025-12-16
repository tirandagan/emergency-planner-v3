'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreamingReportView } from '@/components/planner/StreamingReportView';
import { saveMissionReportFromStream } from '@/app/actions/save-mission-report';
import type { WizardFormData } from '@/types/wizard';

interface StreamingGenerationStepProps {
  formData: WizardFormData;
  onComplete?: (reportId: string) => void;
  mode?: 'create' | 'edit';
  existingPlanId?: string;
}

type GenerationStatus = 'streaming' | 'saving' | 'success' | 'error';

export function StreamingGenerationStep({
  formData,
  onComplete,
  mode,
  existingPlanId,
}: StreamingGenerationStepProps) {
  const router = useRouter();
  // Start with streaming status - component mounts when user is ready to generate
  const [status, setStatus] = useState<GenerationStatus>('streaming');
  const [error, setError] = useState<string | null>(null);

  // Memoize request body to prevent unnecessary re-renders
  const requestBody = useMemo(() => ({
    formData,
    mobility: 'BUG_IN' as const,
  }), [formData]);

  // Track stream start time for duration calculation
  const streamStartTime = useRef<number>(0);

  // Set start time when streaming begins
  useEffect(() => {
    if (status === 'streaming') {
      streamStartTime.current = Date.now();
    }
  }, [status]);

  // Handle stream completion - save the report
  const handleStreamComplete = useCallback(async (content: string) => {
    setStatus('saving');

    const streamDurationMs = Date.now() - streamStartTime.current;

    try {
      // Sanitize formData to remove Google Maps objects before passing to server action
      const sanitizedFormData = {
        ...formData,
        location: {
          city: formData.location.city,
          state: formData.location.state,
          country: formData.location.country,
          coordinates: {
            lat: formData.location.coordinates.lat,
            lng: formData.location.coordinates.lng,
          },
          climateZone: formData.location.climateZone,
          fullAddress: formData.location.fullAddress,
          placeId: formData.location.placeId,
          // Exclude rawPlaceData - it contains Google Maps objects that can't be serialized
        },
      };

      // Save the streamed content to database
      const result = await saveMissionReportFromStream({
        formData: sanitizedFormData,
        content,
        streamDurationMs,
      });

      if (result.success && result.reportId) {
        setStatus('success');
        onComplete?.(result.reportId);

        // Navigate after a brief delay
        setTimeout(() => {
          router.push(`/plans/${result.reportId}`);
        }, 2000);
      } else {
        setStatus('error');
        setError(result.error || 'Failed to save the generated report');
      }
    } catch (err) {
      console.error('Failed to save report:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save the generated report');
    }
  }, [formData, onComplete, router]);

  const handleStreamError = useCallback((errorMessage: string) => {
    setStatus('error');
    setError(errorMessage);
  }, []);

  const retry = () => {
    setError(null);
    setStatus('streaming');
  };

  // Show error state
  if (status === 'error') {
    return (
      <div className="space-y-8 max-w-2xl mx-auto text-center">
        <div>
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Generation Failed
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Something went wrong during plan generation
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive">
            <p className="text-sm text-destructive font-medium">Error Details:</p>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Button onClick={retry} className="min-w-[200px]">
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="min-w-[200px]"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show success state
  if (status === 'success') {
    return (
      <div className="space-y-8 max-w-2xl mx-auto text-center">
        <div>
          <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Plan Generated Successfully!
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Your personalized disaster preparedness plan is ready
          </p>
        </div>

        <div className="flex justify-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
            Redirecting to your plan...
          </p>
        </div>
      </div>
    );
  }

  // Show saving state
  if (status === 'saving') {
    return (
      <div className="space-y-8 max-w-2xl mx-auto text-center">
        <div>
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Saving Your Plan
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Processing and saving your personalized plan...
          </p>
        </div>
      </div>
    );
  }

  // Show streaming state (default)
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Generating Your Plan
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Watch your personalized disaster preparedness plan come to life
        </p>
      </div>

      <StreamingReportView
        streamUrl="/api/generate-mission"
        requestBody={requestBody}
        onComplete={handleStreamComplete}
        onError={handleStreamError}
      />
    </div>
  );
}
