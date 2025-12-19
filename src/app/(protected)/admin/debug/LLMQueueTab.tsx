'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { getLLMServiceURL, fetchLLMHealth, fetchLLMJobs } from './actions';
import { LLMHealthStatus } from './LLMHealthStatus';
import { LLMJobDetailModal } from './LLMJobDetailModal';
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

  // Refresh both health and jobs
  const handleRefresh = () => {
    fetchHealth();
    fetchJobs();
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
            <div>
              <CardTitle className="text-lg">LLM Job Queue</CardTitle>
              <CardDescription>
                Monitor and manage LLM workflow jobs
                {llmServiceURL && (
                  <span className="block text-xs mt-1">
                    Service: <span className="font-mono">{llmServiceURL}</span>
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
                  <SelectItem value="Today">Today</SelectItem>
                  <SelectItem value="7 Days">Last 7 Days</SelectItem>
                  <SelectItem value="30 Days">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleRefresh}
                disabled={isLoadingHealth || isLoadingJobs}
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Health Status Section */}
          <LLMHealthStatus health={health} isLoading={isLoadingHealth} />

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
    </>
  );
}
