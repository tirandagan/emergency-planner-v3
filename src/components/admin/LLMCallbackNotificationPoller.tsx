'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { LLMCallbackDetailModal } from './LLMCallbackDetailModal';

const POLL_INTERVAL = 10000; // 10 seconds
const STORAGE_KEY = 'llm_callback_last_checked';

interface CallbackNotification {
  id: string;
  callbackId: string;
  eventType: string | null;
  workflowName: string | null;
  signatureValid: boolean;
  payloadPreview: string | null;
  createdAt: string;
}

interface PollingResponse {
  items: CallbackNotification[];
  nextCursor: string | null;
}

/**
 * Client component that polls for new LLM callbacks and shows toast notifications
 * Runs on all admin pages to provide real-time callback alerts
 */
export default function LLMCallbackNotificationPoller(): React.JSX.Element | null {
  const [lastCursor, setLastCursor] = useState<string | null>(null);
  const [selectedCallbackId, setSelectedCallbackId] = useState<string | null>(null);
  const isPollingRef = useRef(false);

  /**
   * Initialize cursor from localStorage or use current timestamp
   */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLastCursor(stored);
    } else {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, now);
      setLastCursor(now);
    }
  }, []);

  /**
   * Show toast notification for a new callback
   */
  const showCallbackNotification = useCallback((callback: CallbackNotification): void => {
    const workflowLabel = callback.workflowName || 'Unknown Workflow';
    const eventLabel = callback.eventType || 'Event';
    const isValid = callback.signatureValid;

    const message = `${workflowLabel} - ${eventLabel}`;
    const description = isValid
      ? callback.payloadPreview?.substring(0, 80) || 'No preview available'
      : '⚠️ Invalid signature - Security alert';

    toast.success('New LLM Callback Received', {
      description: (
        <div className="mt-2 space-y-1">
          <p className="font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      ),
      action: {
        label: 'View Details',
        onClick: () => {
          setSelectedCallbackId(callback.id);
        },
      },
      duration: 10000, // 10 seconds
    });
  }, []);

  /**
   * Poll for new callbacks
   */
  const pollForCallbacks = useCallback(async (): Promise<void> => {
    if (isPollingRef.current || !lastCursor) return;

    isPollingRef.current = true;

    try {
      const url = `/api/admin/llm-callbacks/check?after=${encodeURIComponent(lastCursor)}&limit=10`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('[LLM Poller] Not authenticated or not admin - stopping polling');
          return;
        }
        throw new Error(`Polling failed: ${response.status}`);
      }

      const data: PollingResponse = await response.json();

      if (data.items && data.items.length > 0) {
        for (const callback of data.items) {
          showCallbackNotification(callback);
        }

        if (data.nextCursor) {
          localStorage.setItem(STORAGE_KEY, data.nextCursor);
          setLastCursor(data.nextCursor);
        }
      }
    } catch (error) {
      console.error('[LLM Poller] Polling error:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [lastCursor, showCallbackNotification]);

  /**
   * Start polling on mount - only set up interval once
   */
  useEffect(() => {
    if (!lastCursor) return;

    // Set up interval for polling
    const intervalId = setInterval(() => {
      void pollForCallbacks();
    }, POLL_INTERVAL);

    // Do initial poll
    void pollForCallbacks();

    return () => {
      clearInterval(intervalId);
    };
    // Only re-run if pollForCallbacks changes (when lastCursor or showCallbackNotification changes)
  }, [pollForCallbacks, lastCursor]);

  return (
    <>
      {selectedCallbackId && (
        <LLMCallbackDetailModal
          callbackId={selectedCallbackId}
          onClose={() => setSelectedCallbackId(null)}
        />
      )}
    </>
  );
}
