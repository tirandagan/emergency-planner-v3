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
  AlertCircle,
  Minus,
  Maximize2,
  Minimize2,
  X as CloseIcon,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { LLMJobDetail } from './llm-types';
import { fetchLLMJobDetails } from './actions';

interface LLMJobDetailModalProps {
  jobId: string | null;
  onClose: () => void;
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  queued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const statusTitleBarColors = {
  pending: 'from-gray-500 to-gray-600',
  queued: 'from-blue-500 to-blue-600',
  processing: 'from-yellow-500 to-yellow-600',
  completed: 'from-green-500 to-green-600',
  failed: 'from-red-500 to-red-600',
  cancelled: 'from-gray-500 to-gray-600',
};

export function LLMJobDetailModal({ jobId, onClose }: LLMJobDetailModalProps) {
  const [jobDetail, setJobDetail] = useState<LLMJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedError, setCopiedError] = useState(false);
  const [copiedRawJson, setCopiedRawJson] = useState(false);
  const [isRawJsonExpanded, setIsRawJsonExpanded] = useState(false);

  // Window state
  const [windowSize, setWindowSize] = useState({ width: 900, height: 750 });
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [preMaximizeState, setPreMaximizeState] = useState({ width: 900, height: 750, x: 0, y: 0 });

  useEffect(() => {
    if (!jobId) return;

    // Center window on open
    const centerX = (window.innerWidth - 900) / 2;
    const centerY = (window.innerHeight - 750) / 2;
    setWindowPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });

    const fetchJobDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data: LLMJobDetail = await fetchLLMJobDetails(jobId);
        setJobDetail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetail();
  }, [jobId]);

  // Poll for updates when job is processing
  useEffect(() => {
    if (!jobId || !jobDetail || jobDetail.status !== 'processing') return;

    const pollInterval = setInterval(async () => {
      try {
        const data: LLMJobDetail = await fetchLLMJobDetails(jobId);
        setJobDetail(data);
      } catch (err) {
        console.error('Failed to poll job details:', err);
        // Don't update error state during polling to avoid UI flicker
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [jobId, jobDetail?.status]);

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
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

  if (!jobId) return null;

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
              jobDetail
                ? `bg-gradient-to-r ${statusTitleBarColors[jobDetail.status]}`
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}
            onDoubleClick={handleMaximize}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-4 h-4 rounded-sm bg-white/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-sm bg-white/60" />
                </div>
                <span className="text-white font-semibold text-sm truncate" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  Job Details
                </span>
                {jobDetail && (
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                    {jobDetail.status}
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

            {jobDetail && !isLoading && (
              <div className="space-y-6">
                {/* Job Metadata Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Job ID</span>
                    <p className="text-sm text-foreground font-mono bg-muted/50 px-2 py-1 rounded">{jobDetail.job_id}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Workflow</span>
                    <p className="text-sm text-foreground font-medium">{jobDetail.workflow_name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</span>
                    <p className="text-sm text-foreground">{formatDate(jobDetail.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Started</span>
                    <p className="text-sm text-foreground">{formatDate(jobDetail.started_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Completed</span>
                    <p className="text-sm text-foreground">{formatDate(jobDetail.completed_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Duration</span>
                    <p className="text-sm text-foreground font-mono">{formatDuration(jobDetail.duration_ms)}</p>
                  </div>
                </div>

                {((jobDetail.status === 'processing' && jobDetail.total_steps && (
                  <>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-foreground">Progress</span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {jobDetail.steps_completed}/{jobDetail.total_steps} steps
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
                          style={{
                            width: `${((jobDetail.steps_completed || 0) / jobDetail.total_steps) * 100}%`,
                          }}
                        />
                      </div>
                      {jobDetail.current_step && (
                        <p className="text-sm text-muted-foreground mt-3">
                          Current step: <span className="font-mono text-foreground">{jobDetail.current_step}</span>
                        </p>
                      )}
                    </div>
                  </>
                )) || null) as ReactNode}

                {((jobDetail.status === 'completed' && jobDetail.result && (
                  <>
                  <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                        <span className="text-sm font-semibold text-foreground">Result</span>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(JSON.stringify(jobDetail.result, null, 2), setCopiedResult)}
                        variant="ghost"
                        size="sm"
                        className="h-8"
                      >
                        {copiedResult ? (
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
                          data={jobDetail.result as Record<string, unknown>}
                          shouldExpandNode={allExpanded}
                          style={defaultStyles}
                        />
                      </div>
                    </div>
                  </div>
                  </>
                )) || null) as ReactNode}

                {((jobDetail.status === 'failed' && jobDetail.error_message && (
                  <>
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-red-100 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/30">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                        <span className="text-sm font-semibold text-red-900 dark:text-red-300">Error</span>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(jobDetail.error_message || '', setCopiedError)}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-red-700 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {copiedError ? (
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
                    <div className="p-4 overflow-auto max-h-64 bg-white dark:bg-red-950/10">
                      <pre className="text-sm font-mono whitespace-pre-wrap text-red-900 dark:text-red-300 leading-relaxed">
                        {jobDetail.error_message}
                      </pre>
                    </div>
                  </div>
                  </>
                )) || null) as ReactNode}

                {/* Raw JSON Section - Always visible for debugging */}
                <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                  <div className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                    <button
                      onClick={() => setIsRawJsonExpanded(!isRawJsonExpanded)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {isRawJsonExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
                      )}
                      <span className="text-sm font-semibold text-foreground">Raw JSON</span>
                      <Badge variant="outline" className="text-xs">
                        Debug
                      </Badge>
                    </button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(JSON.stringify(jobDetail, null, 2), setCopiedRawJson);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8"
                    >
                      {copiedRawJson ? (
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
                  {isRawJsonExpanded && (
                    <div className="p-4 overflow-auto max-h-96 bg-muted/30">
                      <div className="json-viewer-container text-sm font-mono">
                        <JsonView
                          data={jobDetail as unknown as Record<string, unknown>}
                          shouldExpandNode={allExpanded}
                          style={defaultStyles}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Ready</span>
            {jobDetail && (
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
