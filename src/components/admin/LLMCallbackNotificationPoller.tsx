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
  const [selectedCallbackId, setSelectedCallbackId] = useState<string | null>(null);
  const isPollingRef = useRef(false);
  const lastCursorRef = useRef<string | null>(null);

  /**
   * Initialize cursor from localStorage or use current timestamp
   */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      lastCursorRef.current = stored;
    } else {
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, now);
      lastCursorRef.current = now;
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
    if (isPollingRef.current || !lastCursorRef.current) return;

    isPollingRef.current = true;

    try {
      const url = `/api/admin/llm-callbacks/check?after=${encodeURIComponent(lastCursorRef.current)}&limit=10`;
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
        // Show notifications for all new callbacks
        for (const callback of data.items) {
          showCallbackNotification(callback);
        }

        // Update cursor to NOW (not the last item's timestamp)
        // This prevents showing the same notifications again
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, now);
        lastCursorRef.current = now;
      }
    } catch (error) {
      console.error('[LLM Poller] Polling error:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [showCallbackNotification]);

  /**
   * Start polling on mount - only set up interval once
   */
  useEffect(() => {
    // Set up interval for polling
    const intervalId = setInterval(() => {
      void pollForCallbacks();
    }, POLL_INTERVAL);

    // Do initial poll
    void pollForCallbacks();

    return () => {
      clearInterval(intervalId);
    };
  }, [pollForCallbacks]);

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
