'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Loader2, AlertCircle, Trash2, CheckCircle2, XCircle, HelpCircle, Clock, Play, CheckCheck, X, MinusCircle } from 'lucide-react';
import { SmartTable, TableControls } from '@/components/admin/smart-table';
import type { SmartColumnDef } from '@/components/admin/smart-table';
import { getLLMServiceURL, fetchLLMHealth, fetchLLMJobs, bulkDeleteLLMJobs } from './actions';
import { LLMJobDetailModal } from './LLMJobDetailModal';
import { LLMHealthDetailModal } from './LLMHealthDetailModal';
import type {
  LLMJob,
  LLMJobsResponse,
  LLMHealthResponse,
  JobStatusFilter,
} from './llm-types';

const formatDate = (date: string | null, width?: number) => {
  if (!date) return 'N/A';

  const dateObj = new Date(date);

  // If width is less than 120px, use abbreviated format: m/d h:m PM
  if (width && width < 120) {
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${month}/${day} ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  // Otherwise use full format
  return dateObj.toLocaleString();
};

const formatDuration = (ms: number | null) => {
  if (ms === null) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const getStatusIcon = (status: string) => {
  const iconClass = "w-3.5 h-3.5 flex-shrink-0";

  switch (status) {
    case 'pending':
      return <Clock className={`${iconClass} text-gray-500`} title="Pending" />;
    case 'queued':
      return <Clock className={`${iconClass} text-blue-500`} title="Queued" />;
    case 'processing':
      return <Play className={`${iconClass} text-yellow-500 animate-pulse`} title="Processing" />;
    case 'completed':
      return <CheckCheck className={`${iconClass} text-green-500`} title="Completed" />;
    case 'failed':
      return <X className={`${iconClass} text-red-500`} title="Failed" />;
    case 'cancelled':
      return <MinusCircle className={`${iconClass} text-gray-500`} title="Cancelled" />;
    default:
      return <HelpCircle className={`${iconClass} text-gray-400`} title="Unknown" />;
  }
};

export function LLMQueueTab() {
  const [llmServiceURL, setLLMServiceURL] = useState<string>('');
  const [health, setHealth] = useState<LLMHealthResponse | null>(null);
  const [jobs, setJobs] = useState<LLMJob[]>([]);
  const [isLoadingURL, setIsLoadingURL] = useState(true);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');
  const [limitResults, setLimitResults] = useState<string>('25');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; deleted_count: number; tasks_revoked?: number; redis_removed?: number; message: string } | null>(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  const tableRef = useRef<any>(null);

  // Fetch LLM service URL on mount
  useEffect(() => {
    const fetchURL = async () => {
      try {
        const url = await getLLMServiceURL();
        setLLMServiceURL(url);
      } catch {
        setError('Failed to fetch LLM service URL from settings');
        setLLMServiceURL('https://llm-service-api.onrender.com');
      } finally {
        setIsLoadingURL(false);
      }
    };

    fetchURL();
  }, []);

  // Fetch health status
  const fetchHealth = useCallback(async () => {
    setIsLoadingHealth(true);
    try {
      const data: LLMHealthResponse = await fetchLLMHealth();
      setHealth(data);
      setError(null);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const data: LLMJobsResponse = await fetchLLMJobs(statusFilter, limitResults);
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setJobs([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setIsLoadingJobs(false);
    }
  }, [statusFilter, limitResults]);

  // Fetch data when filter changes or on mount
  useEffect(() => {
    if (!isLoadingURL) {
      fetchHealth();
      fetchJobs();
    }
  }, [isLoadingURL, statusFilter, fetchHealth, fetchJobs]);

  // Auto-refresh when there are processing jobs
  useEffect(() => {
    const hasProcessingJobs = jobs.some(job => job.status === 'processing');

    if (!hasProcessingJobs) return;

    const pollInterval = setInterval(() => {
      fetchLLMJobs(statusFilter, limitResults)
        .then((data: LLMJobsResponse) => {
          setJobs(data.jobs);
          setError(null);
        })
        .catch((err) => {
          console.error('Background poll failed:', err);
        });
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [jobs, statusFilter, limitResults]);

  // Refresh both health and jobs
  const handleRefresh = () => {
    fetchHealth();
    fetchJobs();
  };

  // Toggle individual job selection
  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  // Toggle all jobs selection
  const toggleAllJobs = () => {
    if (selectedJobIds.size === jobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(jobs.map(job => job.job_id)));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedJobIds.size === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedJobIds.size} job${selectedJobIds.size !== 1 ? 's' : ''}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    setDeleteResult(null);

    try {
      const result = await bulkDeleteLLMJobs(Array.from(selectedJobIds));
      setDeleteResult(result);

      if (result.success) {
        setSelectedJobIds(new Set());
        await fetchJobs();
      }
    } catch (error) {
      setDeleteResult({
        success: false,
        deleted_count: 0,
        message: error instanceof Error ? error.message : 'Failed to delete jobs'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Define columns for SmartTable
  const columns: SmartColumnDef<LLMJob>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }: { table: any }) => (
        <Checkbox
          checked={jobs.length > 0 && selectedJobIds.size === jobs.length}
          onChange={toggleAllJobs}
          aria-label="Select all jobs"
        />
      ),
      cell: (job) => (
        <Checkbox
          checked={selectedJobIds.has(job.job_id)}
          onChange={() => toggleJobSelection(job.job_id)}
          aria-label={`Select job ${job.job_id}`}
        />
      ),
      sortable: false,
      filterable: false,
      defaultWidth: 48,
      minWidth: 48,
      maxWidth: 48,
    },
    {
      id: 'job_id',
      accessorKey: 'job_id',
      header: 'Job ID',
      cell: (job) => (
        <button
          onClick={() => setSelectedJobId(job.job_id)}
          className="flex items-center gap-2 font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline w-full text-left"
          title={job.job_id}
        >
          {getStatusIcon(job.status)}
          <span className="truncate">{job.job_id}</span>
        </button>
      ),
      sortable: true,
      filterable: true,
      filterType: 'text',
      defaultWidth: 120,
      minWidth: 100,
    },
    {
      id: 'workflow_name',
      accessorKey: 'workflow_name',
      header: 'Workflow',
      sortable: true,
      filterable: true,
      filterType: 'text',
      defaultWidth: 180,
    },
    {
      id: 'user_email',
      accessorKey: 'user_email',
      header: 'User',
      cell: (job) => (
        <span className="text-muted-foreground">{job.user_email || 'N/A'}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'text',
      defaultWidth: 200,
    },
    {
      id: 'created_at',
      accessorKey: 'created_at',
      header: 'Created',
      cell: (job, width) => (
        <span className="text-muted-foreground">{formatDate(job.created_at, width)}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'date',
      defaultWidth: 180,
    },
    {
      id: 'started_at',
      accessorKey: 'started_at',
      header: 'Started',
      cell: (job, width) => (
        <span className="text-muted-foreground">{formatDate(job.started_at, width)}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'date',
      defaultWidth: 180,
    },
    {
      id: 'completed_at',
      accessorKey: 'completed_at',
      header: 'Completed',
      cell: (job, width) => (
        <span className="text-muted-foreground">{formatDate(job.completed_at, width)}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'date',
      defaultWidth: 180,
    },
    {
      id: 'duration_ms',
      accessorKey: 'duration_ms',
      header: 'Duration',
      cell: (job) => (
        <span className="text-muted-foreground">{formatDuration(job.duration_ms)}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'number',
      defaultWidth: 100,
    },
    // NEW COLUMNS (hidden by default)
    {
      id: 'priority',
      accessorKey: 'priority',
      header: 'Priority',
      sortable: true,
      filterable: true,
      filterType: 'number',
      defaultVisible: false,
      defaultWidth: 90,
    },
    {
      id: 'username',
      accessorKey: 'username',
      header: 'Username',
      sortable: true,
      filterable: true,
      filterType: 'text',
      defaultVisible: false,
      defaultWidth: 150,
    },
    {
      id: 'action',
      accessorKey: 'action',
      header: 'Action',
      sortable: false,
      filterable: true,
      filterType: 'text',
      defaultVisible: false,
      defaultWidth: 200,
    },
    {
      id: 'retry_count',
      accessorKey: 'retry_count',
      header: 'Retries',
      cell: (job) => `${job.retry_count || 0}/${job.max_retries || 3}`,
      sortable: true,
      filterable: true,
      filterType: 'number',
      defaultVisible: false,
      defaultWidth: 100,
    },
    {
      id: 'is_stale',
      accessorKey: 'is_stale',
      header: 'Is Stale',
      cell: (job) => job.is_stale ? <Badge variant="destructive">Stale</Badge> : null,
      sortable: true,
      filterable: false,
      defaultVisible: false,
      defaultWidth: 100,
    },
    {
      id: 'stale_reason',
      accessorKey: 'stale_reason',
      header: 'Stale Reason',
      sortable: false,
      filterable: true,
      filterType: 'text',
      defaultVisible: false,
      defaultWidth: 200,
    },
    {
      id: 'current_step',
      accessorKey: 'current_step',
      header: 'Current Step',
      sortable: false,
      filterable: true,
      filterType: 'text',
      defaultVisible: false,
      defaultWidth: 150,
    },
    {
      id: 'steps_progress',
      header: 'Steps',
      cell: (job) => {
        if (job.steps_completed !== null && job.total_steps !== null) {
          return `${job.steps_completed}/${job.total_steps}`;
        }
        return 'N/A';
      },
      sortable: false,
      filterable: false,
      defaultVisible: false,
      defaultWidth: 100,
    },
    {
      id: 'queued_at',
      accessorKey: 'queued_at',
      header: 'Queued At',
      cell: (job, width) => (
        <span className="text-muted-foreground">{formatDate(job.queued_at || null, width)}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'date',
      defaultVisible: false,
      defaultWidth: 180,
    },
    {
      id: 'updated_at',
      accessorKey: 'updated_at',
      header: 'Updated At',
      cell: (job, width) => (
        <span className="text-muted-foreground">{formatDate(job.updated_at || null, width)}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'date',
      defaultVisible: false,
      defaultWidth: 180,
    },
    {
      id: 'celery_task_id',
      accessorKey: 'celery_task_id',
      header: 'Celery Task ID',
      cell: (job) => (
        <span className="font-mono text-xs text-muted-foreground">
          {job.celery_task_id ? `${job.celery_task_id.slice(0, 8)}...` : 'N/A'}
        </span>
      ),
      sortable: false,
      filterable: true,
      filterType: 'text',
      defaultVisible: false,
      defaultWidth: 130,
    },
  ], [jobs.length, selectedJobIds]);

  if (isLoadingURL) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">LLM Job Queue</CardTitle>
              {health && (
                <div className="flex items-center gap-1.5">
                  <Badge className={
                    health.status === 'healthy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }>
                    {health.status === 'healthy' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span className="ml-1 capitalize">{health.status || 'unknown'}</span>
                  </Badge>
                  <button
                    onClick={() => setIsHealthModalOpen(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="View service health details"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {jobs.some(job => job.status === 'processing') && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 text-sm border border-yellow-200 dark:border-yellow-900/30">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="font-medium">Auto-refreshing</span>
                </div>
              )}
              {selectedJobIds.size > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete Selected ({selectedJobIds.size})
                </Button>
              )}
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as JobStatusFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={limitResults} onValueChange={setLimitResults}>
                <SelectTrigger className="w-[70px]">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                  <SelectItem value="Today">24h</SelectItem>
                  <SelectItem value="7 Days">7d</SelectItem>
                  <SelectItem value="30 Days">30d</SelectItem>
                </SelectContent>
              </Select>
              {tableRef.current && (
                <TableControls
                  table={tableRef.current}
                  onReset={() => {
                    // Reset will be handled by SmartTable
                  }}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">{error}</p>
                  <p className="text-sm mt-1">
                    Check that the LLM service URL is correct in system settings and the webhook secret is configured.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delete Result Message */}
          {deleteResult && (
            <div className={`p-4 rounded-lg ${
              deleteResult.success
                ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {deleteResult.success ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <div>
                  <p className="font-medium">{deleteResult.message}</p>
                  {deleteResult.success && deleteResult.deleted_count > 0 && (
                    <p className="text-sm mt-1">
                      {deleteResult.deleted_count} job{deleteResult.deleted_count !== 1 ? 's' : ''} deleted successfully.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Legend */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1.5 bg-muted/30 rounded-md mb-2">
            <span className="font-medium">Status:</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span>Queued</span>
            </div>
            <div className="flex items-center gap-1">
              <Play className="w-3 h-3 text-yellow-500" />
              <span>Processing</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCheck className="w-3 h-3 text-green-500" />
              <span>Done</span>
            </div>
            <div className="flex items-center gap-1">
              <X className="w-3 h-3 text-red-500" />
              <span>Failed</span>
            </div>
          </div>

          {/* SmartTable */}
          <div className="border rounded-lg overflow-hidden">
            {isLoadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SmartTable
                data={jobs}
                columns={columns}
                localStorageKey="llm-queue-table-prefs"
                tableInstanceRef={tableRef}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Detail Modal */}
      <LLMJobDetailModal
        jobId={selectedJobId}
        onClose={() => setSelectedJobId(null)}
      />

      {/* Health Detail Modal */}
      <LLMHealthDetailModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        health={health}
        serviceUrl={llmServiceURL}
      />
    </>
  );
}
