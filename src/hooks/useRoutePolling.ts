import { useState, useEffect } from 'react';
import type { EvacuationRoute } from '@/types/mission-report';

interface RoutePollingResult {
  routes: EvacuationRoute[];
  isLoading: boolean;
  error: string | null;
}

interface UseRoutePollingOptions {
  enabled?: boolean;
}

/**
 * Hook to poll for evacuation route generation status
 * Polls every 2 seconds for up to 20 seconds
 * @param reportId - The mission report ID
 * @param options - Options including enabled flag to control polling
 */
export function useRoutePolling(
  reportId: string,
  options: UseRoutePollingOptions = {}
): RoutePollingResult {
  const { enabled = true } = options;
  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't start polling if disabled
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // Set loading to true when polling starts
    setIsLoading(true);

    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 10; // 10 polls × 2s = 20s max

    const checkRouteStatus = async () => {
      try {
        const response = await fetch(`/api/mission-reports/${reportId}/routes`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!isMounted) return;

        // If ready=true, generation is complete (even if routes array is empty)
        if (data.ready) {
          setRoutes(data.routes ?? []);
          setIsLoading(false);
          return true; // Stop polling
        }

        pollCount++;
        if (pollCount >= maxPolls) {
          setError('Route generation is taking longer than expected. Please refresh the page.');
          setIsLoading(false);
          return true; // Stop polling
        }

        return false; // Continue polling
      } catch (err) {
        if (!isMounted) return true;

        console.error('Error polling route status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check route status');
        setIsLoading(false);
        return true; // Stop polling on error
      }
    };

    // Start polling immediately
    checkRouteStatus().then(shouldStop => {
      if (shouldStop || !isMounted) return;

      // Continue polling every 2 seconds
      const interval = setInterval(async () => {
        const shouldStop = await checkRouteStatus();
        if (shouldStop) {
          clearInterval(interval);
        }
      }, 2000);

      return () => {
        clearInterval(interval);
      };
    });

    return () => {
      isMounted = false;
    };
  }, [reportId, enabled]);

  return { routes, isLoading, error };
}
