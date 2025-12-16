'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { detectCurrentSection, getCompletedSections, estimateProgress } from '@/lib/mission-generation/markdown-parser';
import { REPORT_SECTIONS, type SectionStatus } from '@/types/mission-report';
import { cn } from '@/lib/utils';

// Display mode from environment variable
// 'full' = Rich markdown rendering (default)
// 'compact' = Small scrolling text window, focus on progress
// 'none' = Progress indicators only, no text display
const DISPLAY_MODE = process.env.NEXT_PUBLIC_STREAMING_DISPLAY_MODE || 'full';

interface StreamingReportViewProps {
  /** Fetch streaming from API */
  streamUrl?: string;
  requestBody?: Record<string, unknown>;
  /** Or pass content directly for non-streaming display */
  content?: string;
  onComplete?: (content: string) => void;
  onError?: (error: string) => void;
}

export function StreamingReportView({
  streamUrl,
  requestBody,
  content: initialContent,
  onComplete,
  onError,
}: StreamingReportViewProps) {
  const [content, setContent] = useState(initialContent || '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sections, setSections] = useState<SectionStatus[]>(REPORT_SECTIONS.map(s => ({ ...s })));
  const [progress, setProgress] = useState(initialContent ? 100 : 0);
  const contentRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateProgress = useCallback((text: string) => {
    const currentSection = detectCurrentSection(text);
    const completedSections = getCompletedSections(text);
    const newProgress = estimateProgress(text);

    setSections(prev =>
      prev.map(s => ({
        ...s,
        status: completedSections.includes(s.name)
          ? 'complete'
          : s.name === currentSection
          ? 'streaming'
          : 'pending',
      }))
    );

    setProgress(newProgress);
  }, []);

  useEffect(() => {
    if (!streamUrl || !requestBody) return;

    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setContent('');
    setSections(REPORT_SECTIONS.map(s => ({ ...s, status: 'pending' })));
    setProgress(0);

    const fetchStream = async () => {
      try {
        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setContent(accumulated);
          updateProgress(accumulated);

          // Auto-scroll to bottom during streaming
          if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
          }
        }

        setIsStreaming(false);
        setProgress(100);
        setSections(prev => prev.map(s => ({ ...s, status: 'complete' })));
        onComplete?.(accumulated);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return; // Normal abort, don't report error
        }
        console.error('Stream error:', error);
        setIsStreaming(false);
        onError?.(error instanceof Error ? error.message : 'Stream failed');
      }
    };

    fetchStream();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [streamUrl, requestBody, onComplete, onError, updateProgress]);

  // Handle initial content display
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
      setProgress(100);
      setSections(prev => prev.map(s => ({ ...s, status: 'complete' })));
    }
  }, [initialContent]);

  // Mode detection
  const isCompactMode = DISPLAY_MODE === 'compact';
  const isNoneMode = DISPLAY_MODE === 'none';

  // Progress sidebar (shared between modes)
  const progressSidebar = (
    <div className={cn(
      "shrink-0",
      isCompactMode ? "w-full lg:w-72" : "lg:w-64"
    )}>
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sticky top-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Generation Progress
        </h3>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-1">
            <span>{isStreaming ? 'Generating...' : 'Complete'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Section List */}
        <ul className="space-y-2">
          {sections.map((section) => (
            <li
              key={section.name}
              className="flex items-center gap-2 text-sm"
            >
              {section.status === 'complete' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : section.status === 'streaming' ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
              )}
              <span
                className={cn(
                  'transition-colors',
                  section.status === 'complete'
                    ? 'text-slate-900 dark:text-slate-100'
                    : section.status === 'streaming'
                    ? 'text-primary font-medium'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {section.displayName}
              </span>
            </li>
          ))}
        </ul>

        {/* Character Count */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {content.length.toLocaleString()} characters generated
          </p>
        </div>
      </div>
    </div>
  );

  // None mode: Progress indicators only, no text
  if (isNoneMode) {
    return (
      <div className="flex justify-center items-start">
        {/* Only Progress Sidebar - Centered for focus */}
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 text-center">
              Generation Progress
            </h3>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                <span>{isStreaming ? 'Generating...' : 'Complete'}</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Section List - Larger for better visibility */}
            <ul className="space-y-3">
              {sections.map((section) => (
                <li
                  key={section.name}
                  className="flex items-center gap-3 text-base"
                >
                  {section.status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : section.status === 'streaming' ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                  )}
                  <span
                    className={cn(
                      'transition-colors',
                      section.status === 'complete'
                        ? 'text-slate-900 dark:text-slate-100'
                        : section.status === 'streaming'
                        ? 'text-primary font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {section.displayName}
                  </span>
                </li>
              ))}
            </ul>

            {/* Character Count */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {content.length.toLocaleString()} characters generated
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Your full report will be available when generation completes
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact mode: Small scrolling text window
  if (isCompactMode) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Progress Sidebar - Primary focus in compact mode */}
        {progressSidebar}

        {/* Compact Content Window - Matches sidebar height */}
        <div className="flex-1 lg:max-w-md">
          <div
            ref={contentRef}
            className="bg-slate-950 dark:bg-slate-950 rounded-lg border border-slate-700 p-4 h-[320px] overflow-y-auto font-mono"
          >
            {content ? (
              <pre className="text-xs text-slate-500 dark:text-slate-500 whitespace-pre-wrap break-words leading-relaxed">
                {content}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-3 bg-slate-600 animate-pulse ml-0.5" />
                )}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-600">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Initializing...</p>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            Your full report will be available when generation completes
          </p>
        </div>
      </div>
    );
  }

  // Full mode: Rich markdown rendering (default)
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Progress Sidebar */}
      {progressSidebar}

      {/* Main Content - Full markdown rendering */}
      <div
        ref={contentRef}
        className="flex-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 lg:p-8 max-h-[80vh] overflow-y-auto"
      >
        {content ? (
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-6 border-b border-slate-200 dark:border-slate-700 pb-2 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2 mt-4">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-700 dark:text-slate-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="ml-4">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-slate-900 dark:text-slate-100">
                    {children}
                  </strong>
                ),
                hr: () => (
                  <hr className="my-6 border-slate-200 dark:border-slate-700" />
                ),
              }}
            >
              {content}
            </ReactMarkdown>

            {/* Typing cursor during streaming */}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Preparing your mission report...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
