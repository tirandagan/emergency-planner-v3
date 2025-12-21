'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import { JsonView, allExpanded, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  Minus,
  Maximize2,
  Minimize2,
  X as CloseIcon,
  Copy,
  Check,
} from 'lucide-react';
import type { LLMCallbackDetail } from '@/db/schema/llm-callbacks';

interface LLMCallbackDetailModalProps {
  callbackId: string | null;
  onClose: () => void;
}

const signatureColors = {
  valid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  invalid: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const signatureTitleBarColors = {
  valid: 'from-green-500 to-green-600',
  invalid: 'from-red-500 to-red-600',
};

export function LLMCallbackDetailModal({ callbackId, onClose }: LLMCallbackDetailModalProps) {
  const [callbackDetail, setCallbackDetail] = useState<LLMCallbackDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedSignature, setCopiedSignature] = useState(false);

  // Window state
  const [windowSize, setWindowSize] = useState({ width: 900, height: 750 });
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [preMaximizeState, setPreMaximizeState] = useState({ width: 900, height: 750, x: 0, y: 0 });

  useEffect(() => {
    if (!callbackId) return;

    // Center window on open
    const centerX = (window.innerWidth - 900) / 2;
    const centerY = (window.innerHeight - 750) / 2;
    setWindowPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });

    const fetchCallbackDetail = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/llm-callbacks/${callbackId}`);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Unauthorized - Admin access required');
          }
          if (response.status === 404) {
            throw new Error('Callback not found');
          }
          throw new Error(`Failed to fetch callback details: ${response.statusText}`);
        }

        const data: LLMCallbackDetail = await response.json();
        setCallbackDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch callback details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCallbackDetail();
  }, [callbackId]);

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const handleMaximize = (): void => {
    if (isMaximized) {
      // Restore to previous size
      setWindowSize(preMaximizeState);
      setWindowPosition({ x: preMaximizeState.x, y: preMaximizeState.y });
      setIsMaximized(false);
    } else {
      // Save current state
      setPreMaximizeState({ ...windowSize, ...windowPosition });
      // Maximize
      setWindowSize({ width: window.innerWidth - 40, height: window.innerHeight - 40 });
      setWindowPosition({ x: 20, y: 20 });
      setIsMaximized(true);
    }
  };

  const handleMinimize = (): void => {
    setIsMinimized(!isMinimized);
  };

  const copyToClipboard = async (text: string, setCopied: (val: boolean) => void): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!callbackId) return null;

  const signatureStatus = callbackDetail?.signatureValid ? 'valid' : 'invalid';

  return (
    <>
      <style jsx global>{`
        /* Enhance JSON viewer visibility in dark mode */
        .dark .json-viewer-container {
          filter: brightness(1.1);
        }
      `}</style>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <Rnd
        size={{ width: windowSize.width, height: windowSize.height }}
        position={{ x: windowPosition.x, y: windowPosition.y }}
        onDragStop={(e, d) => {
          setWindowPosition({ x: d.x, y: d.y });
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          setWindowSize({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          });
          setWindowPosition(position);
        }}
        minWidth={600}
        minHeight={400}
        maxWidth={window.innerWidth - 40}
        maxHeight={window.innerHeight - 40}
        bounds="parent"
        dragHandleClassName="window-drag-handle"
        className="rounded-lg overflow-hidden shadow-2xl"
        style={{
          display: isMinimized ? 'none' : 'block',
        }}
        enableResizing={{
          top: true,
          right: true,
          bottom: true,
          left: true,
          topRight: true,
          bottomRight: true,
          bottomLeft: true,
          topLeft: true,
        }}
      >
        <div className="h-full flex flex-col bg-background border border-border/50">
          {/* Windows-Style Title Bar */}
          <div
            className={`window-drag-handle px-3 py-2 flex items-center justify-between cursor-move select-none ${
              callbackDetail
                ? `bg-gradient-to-r ${signatureTitleBarColors[signatureStatus]}`
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
            onDoubleClick={handleMaximize}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-4 h-4 rounded-sm bg-white/20 flex items-center justify-center flex-shrink-0">
                  {callbackDetail?.signatureValid ? (
                    <Shield className="w-3 h-3 text-white" strokeWidth={2.5} />
                  ) : (
                    <ShieldAlert className="w-3 h-3 text-white" strokeWidth={2.5} />
                  )}
                </div>
                <span className="text-white font-semibold text-sm truncate" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  Webhook Callback
                </span>
                {callbackDetail && (
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                    {callbackDetail.signatureValid ? 'Valid' : 'Invalid Signature'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Window Controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleMinimize}
                className="w-9 h-7 flex items-center justify-center hover:bg-white/20 transition-colors rounded"
                title="Minimize"
              >
                <Minus className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />
              </button>
              <button
                onClick={handleMaximize}
                className="w-9 h-7 flex items-center justify-center hover:bg-white/20 transition-colors rounded"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <Minimize2 className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />
                ) : (
                  <Maximize2 className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />
                )}
              </button>
              <button
                onClick={onClose}
                className="w-9 h-7 flex items-center justify-center hover:bg-red-600 transition-colors rounded"
                title="Close"
              >
                <CloseIcon className="w-4 h-4 text-white drop-shadow" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Window Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-background">
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" strokeWidth={2.5} />
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-red-800 dark:text-red-300">{error}</span>
                </div>
              </div>
            )}

            {callbackDetail && !isLoading && (
              <div className="space-y-6">
                {/* Callback Metadata Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Callback ID</span>
                    <p className="text-sm text-foreground font-mono bg-muted/50 px-2 py-1 rounded">{callbackDetail.callbackId}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Signature Status</span>
                    <div className="flex items-center gap-2">
                      {callbackDetail.signatureValid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                          <Badge className={signatureColors.valid}>Valid</Badge>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                          <Badge className={signatureColors.invalid}>Invalid</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event Type</span>
                    <p className="text-sm text-foreground font-medium">{callbackDetail.eventType || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workflow</span>
                    <p className="text-sm text-foreground font-medium">{callbackDetail.workflowName || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">External Job ID</span>
                    <p className="text-sm text-foreground font-mono bg-muted/50 px-2 py-1 rounded">{callbackDetail.externalJobId || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Received At</span>
                    <p className="text-sm text-foreground">{formatDate(callbackDetail.createdAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Verified At</span>
                    <p className="text-sm text-foreground">{formatDate(callbackDetail.verifiedAt)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Updated At</span>
                    <p className="text-sm text-foreground">{formatDate(callbackDetail.updatedAt)}</p>
                  </div>
                </div>

                {/* Signature Header (if present) */}
                {((callbackDetail.signatureHeader && (
                  <>
                  <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
                        <span className="text-sm font-semibold text-foreground">Signature Header</span>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(callbackDetail.signatureHeader || '', setCopiedSignature)}
                        variant="ghost"
                        size="sm"
                        className="h-8"
                      >
                        {copiedSignature ? (
                          <>
                            <Check className="!w-4 !h-4 text-green-600" strokeWidth={2.5} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="!w-4 !h-4" strokeWidth={2.5} />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="p-4 overflow-auto bg-muted/30">
                      <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed break-all">
                        {callbackDetail.signatureHeader}
                      </pre>
                    </div>
                  </div>
                  </>
                )) || null) as ReactNode}

                {/* Payload (always present) */}
                <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                      <span className="text-sm font-semibold text-foreground">Webhook Payload</span>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(JSON.stringify(callbackDetail.payload, null, 2), setCopiedPayload)}
                      variant="ghost"
                      size="sm"
                      className="h-8"
                    >
                      {copiedPayload ? (
                        <>
                          <Check className="!w-4 !h-4 text-green-600" strokeWidth={2.5} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="!w-4 !h-4" strokeWidth={2.5} />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-4 overflow-auto max-h-96 bg-muted/30">
                    <div className="json-viewer-container text-sm font-mono">
                      <JsonView
                        data={callbackDetail.payload as Record<string, unknown>}
                        shouldExpandNode={allExpanded}
                        style={defaultStyles}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Ready</span>
            {callbackDetail && (
              <span className="font-mono">
                {windowSize.width} × {windowSize.height}
              </span>
            )}
          </div>
        </div>
      </Rnd>
      </div>
    </>
  );
}
