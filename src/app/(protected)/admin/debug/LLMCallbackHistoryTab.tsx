'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { RefreshCw, Loader2, Eye, Shield, ShieldAlert, XCircle } from 'lucide-react';
import { LLMCallbackDetailModal } from '@/components/admin/LLMCallbackDetailModal';

interface CallbackListItem {
  id: string;
  callbackId: string;
  signatureValid: boolean;
  eventType: string | null;
  workflowName: string | null;
  payloadPreview: string | null;
  createdAt: string;
}

export function LLMCallbackHistoryTab(): React.JSX.Element {
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get('highlight');

  const [callbacks, setCallbacks] = useState<CallbackListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitResults, setLimitResults] = useState<string>('25');
  const [selectedCallbackId, setSelectedCallbackId] = useState<string | null>(null);

  // Auto-open modal if highlight parameter is present
  useEffect(() => {
    if (highlightId && callbacks.length > 0) {
      const callback = callbacks.find(cb => cb.id === highlightId || cb.callbackId === highlightId);
      if (callback) {
        setSelectedCallbackId(callback.id);
      }
    }
  }, [highlightId, callbacks]);

  // Fetch callbacks
  const fetchCallbacks = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/llm-callbacks/history?limit=${limitResults}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Admin access required');
        }
        if (response.status === 403) {
          throw new Error('Forbidden - Admin role required');
        }
        throw new Error(`Failed to fetch callbacks: ${response.statusText}`);
      }

      const data = await response.json();
      setCallbacks(data.callbacks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch callbacks');
      setCallbacks([]);
    } finally {
      setIsLoading(false);
    }
  }, [limitResults]);

  // Fetch data on mount and when limit changes
  useEffect(() => {
    fetchCallbacks();
  }, [fetchCallbacks]);

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleString();
  };

  const truncatePreview = (preview: string | null, maxLength: number = 50): string => {
    if (!preview) return 'N/A';
    if (preview.length <= maxLength) return preview;
    return preview.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">LLM Webhook Callbacks</CardTitle>
              <CardDescription>Webhook callbacks received from external LLM service</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={limitResults} onValueChange={setLimitResults}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={fetchCallbacks}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-red-800 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          {isLoading && callbacks.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : callbacks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-1">No callbacks received yet</p>
              <p className="text-sm">Webhook callbacks will appear here when received from the LLM service</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Callback ID</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {callbacks.map((callback) => (
                    <TableRow
                      key={callback.id}
                      className={highlightId === callback.id || highlightId === callback.callbackId ? 'bg-blue-50 dark:bg-blue-950/20' : undefined}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {callback.signatureValid ? (
                            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                          ) : (
                            <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" strokeWidth={2.5} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted/50 px-2 py-1 rounded">
                          {callback.callbackId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {callback.eventType || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {callback.workflowName || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground max-w-xs truncate block" title={callback.payloadPreview || undefined}>
                          {truncatePreview(callback.payloadPreview)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(callback.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => setSelectedCallbackId(callback.id)}
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {callbacks.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
              Showing {callbacks.length} callback{callbacks.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Callback Detail Modal */}
      <LLMCallbackDetailModal
        callbackId={selectedCallbackId}
        onClose={() => setSelectedCallbackId(null)}
      />
    </>
  );
}
