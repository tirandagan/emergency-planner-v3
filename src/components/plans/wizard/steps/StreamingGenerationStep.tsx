'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConsultingUpsellCard } from '@/components/consulting/ConsultingUpsellCard';
import { submitMissionGenerationJob } from '@/app/actions/mission-generation';
import type { WizardFormData } from '@/types/wizard';

interface StreamingGenerationStepProps {
  formData: WizardFormData;
  onComplete?: (reportId: string) => void;
  mode?: 'create' | 'edit';
  existingPlanId?: string;
}

type GenerationStatus = 'submitting' | 'error';

export function StreamingGenerationStep({
  formData,
  onComplete,
  mode,
  existingPlanId,
}: StreamingGenerationStepProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GenerationStatus>('submitting');
  const [error, setError] = useState<string | null>(null);

  // Auto-submit job when component mounts
  useEffect(() => {
    let isMounted = true;

    const submitJob = async (): Promise<void> => {
      try {
        // Sanitize formData to remove Google Maps objects before passing to server action
        const sanitizedFormData: WizardFormData = {
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

        // Submit job to LLM service
        const result = await submitMissionGenerationJob(sanitizedFormData);

        if (!isMounted) return;

        if (result.jobId && result.reportId) {
          // Call onComplete if provided
          onComplete?.(result.reportId);

          // Redirect to progress page where JobStatusPoller will track the job
          router.push(`/plans/${result.reportId}/progress?jobId=${result.jobId}`);
        } else {
          setStatus('error');
          setError('Failed to submit mission generation job');
        }
      } catch (err) {
        if (!isMounted) return;

        console.error('Failed to submit job:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to submit mission generation job');
      }
    };

    submitJob();

    return () => {
      isMounted = false;
    };
  }, [formData, onComplete, router]);

  // Render loading or error state
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <div className="bg-destructive/10 text-destructive rounded-lg p-6 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Generation Failed</h3>
              <p className="text-sm">{error || 'An unknown error occurred'}</p>
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-4 w-full"
          >
            Try Again
          </Button>
        </div>

        {/* Consulting upsell card */}
        <div className="mt-8 max-w-md">
          <ConsultingUpsellCard placement="post-plan" />
        </div>
      </div>
    );
  }

  // Submitting state - show loading indicator
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        Submitting Your Mission Plan
      </h3>
      <p className="text-base text-slate-600 dark:text-slate-400 text-center max-w-md">
        Creating your personalized disaster preparedness plan. You'll be redirected to the
        progress page in just a moment...
      </p>

      {/* Consulting upsell card */}
      <div className="mt-8 max-w-md">
        <ConsultingUpsellCard placement="post-plan" />
      </div>
    </div>
  );
}
