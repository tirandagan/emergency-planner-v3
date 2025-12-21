'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { RefreshCw, Loader2, AlertCircle, Trash2, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { getLLMServiceURL, fetchLLMHealth, fetchLLMJobs, bulkDeleteLLMJobs } from './actions';
import { LLMJobDetailModal } from './LLMJobDetailModal';
import { LLMHealthDetailModal } from './LLMHealthDetailModal';
import type {
  LLMJob,
  LLMJobsResponse,
  LLMHealthResponse,
  JobStatusFilter,
  SortField,
  SortDirection,
} from './llm-types';

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  queued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
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
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; deleted_count: number; message: string } | null>(null);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  // Fetch LLM service URL on mount
  useEffect(() => {
    const fetchURL = async () => {
      try {
        const url = await getLLMServiceURL();
        setLLMServiceURL(url);
      } catch {
        setError('Failed to fetch LLM service URL from settings');
        setLLMServiceURL('https://llm-service-api.onrender.com'); // Fallback
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

    // Poll in the background without showing loading state
    const pollInterval = setInterval(() => {
      // Silently fetch jobs without triggering loading state
      fetchLLMJobs(statusFilter, limitResults)
        .then((data: LLMJobsResponse) => {
          setJobs(data.jobs);
          setError(null);
        })
        .catch((err) => {
          console.error('Background poll failed:', err);
          // Don't update error state to avoid UI flicker
        });
    }, 2000); // Poll every 2 seconds

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
    if (selectedJobIds.size === sortedJobs.length) {
      setSelectedJobIds(new Set());
    } else {
      setSelectedJobIds(new Set(sortedJobs.map(job => job.job_id)));
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
        // Clear selection and refresh jobs list
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

  // Handle delete all jobs (all visible jobs matching current filter)
  const handleDeleteAll = async () => {
    if (sortedJobs.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ALL ${sortedJobs.length} job${sortedJobs.length !== 1 ? 's' : ''} matching the current filter? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    setDeleteResult(null);

    try {
      const allJobIds = sortedJobs.map(job => job.job_id);
      const result = await bulkDeleteLLMJobs(allJobIds);
      setDeleteResult(result);

      if (result.success) {
        // Clear selection and refresh jobs list
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

  // Sort jobs
  const sortedJobs = [...jobs].sort((a, b) => {
    const aValue: string | number | null = a[sortField];
    const bValue: string | number | null = b[sortField];

    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Limit results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 records</SelectItem>
                  <SelectItem value="50">50 records</SelectItem>
                  <SelectItem value="100">100 records</SelectItem>
                  <SelectItem value="200">200 records</SelectItem>
                  <SelectItem value="Today">Last 24 Hours</SelectItem>
                  <SelectItem value="7 Days">Last 7 Days</SelectItem>
                  <SelectItem value="30 Days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleRefresh}
                disabled={isLoadingHealth || isLoadingJobs || isDeleting}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isLoadingHealth || isLoadingJobs ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </Button>
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
              {sortedJobs.length > 0 && (
                <Button
                  onClick={handleDeleteAll}
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
                  Delete All ({sortedJobs.length})
                </Button>
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

          {/* Jobs Table */}
          <div className="border rounded-lg overflow-hidden">
            {isLoadingJobs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sortedJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No jobs found</p>
                <p className="text-sm mt-2">
                  {statusFilter !== 'all' && `Try changing the filter to see ${statusFilter === 'failed' ? 'other' : 'different'} jobs`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={sortedJobs.length > 0 && selectedJobIds.size === sortedJobs.length}
                          onChange={toggleAllJobs}
                          aria-label="Select all jobs"
                        />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('job_id')}
                      >
                        Job ID {sortField === 'job_id' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('workflow_name')}
                      >
                        Workflow {sortField === 'workflow_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('status')}
                      >
                        Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('created_at')}
                      >
                        Created {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => toggleSort('duration_ms')}
                      >
                        Duration {sortField === 'duration_ms' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedJobs.map((job) => (
                      <TableRow key={job.job_id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedJobIds.has(job.job_id)}
                            onChange={() => toggleJobSelection(job.job_id)}
                            aria-label={`Select job ${job.job_id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => setSelectedJobId(job.job_id)}
                            className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            title="Click to view details"
                          >
                            {job.job_id.slice(0, 8)}...
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">{job.workflow_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {job.user_email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[job.status]}>{job.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(job.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(job.started_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(job.completed_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(job.duration_ms)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
