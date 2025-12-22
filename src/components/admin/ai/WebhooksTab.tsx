'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Table } from '@tanstack/react-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { SmartTable, TableControls } from '@/components/admin/smart-table';
import type { SmartColumnDef } from '@/components/admin/smart-table';
import { fetchLLMWebhooks } from '@/app/(protected)/admin/ai/actions';
import { WebhookDetailModal } from './WebhookDetailModal';
import type {
  LLMWebhook,
  WebhooksResponse,
  WebhookStatusFilter,
} from '@/app/(protected)/admin/ai/actions';

const formatDate = (date: string | null, width?: number) => {
  if (!date) return 'N/A';

  const dateObj = new Date(date);

  // If width is less than 120px, use abbreviated format
  if (width && width < 120) {
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${month}/${day} ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }

  return dateObj.toLocaleString();
};

const getSignatureIcon = (valid: boolean) => {
  const iconClass = "w-3.5 h-3.5 flex-shrink-0";

  if (valid) {
    return <span title="Valid Signature"><CheckCircle2 className={`${iconClass} text-green-500`} /></span>;
  }

  return <span title="Invalid Signature"><XCircle className={`${iconClass} text-red-500`} /></span>;
};

export function WebhooksTab(): React.JSX.Element {
  const [webhooks, setWebhooks] = useState<LLMWebhook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WebhookStatusFilter>('all');
  const [limitResults, setLimitResults] = useState<string>('25');
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);

  const tableRef = useRef<Table<LLMWebhook> | null>(null);

  // Fetch webhooks
  const fetchWebhooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const data: WebhooksResponse = await fetchLLMWebhooks(statusFilter, limitResults);
      setWebhooks(data.webhooks);
      setError(null);
    } catch (err) {
      setWebhooks([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch webhooks');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, limitResults]);

  // Fetch data when filter changes or on mount
  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  // Define columns for SmartTable
  const columns: SmartColumnDef<LLMWebhook>[] = useMemo(() => [
    {
      id: 'callbackId',
      accessorKey: 'callbackId',
      header: 'Callback ID',
      cell: (webhook) => (
        <button
          onClick={() => setSelectedWebhookId(webhook.id)}
          className="flex items-center gap-2 font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline w-full text-left"
          title={webhook.callbackId}
        >
          {getSignatureIcon(webhook.signatureValid)}
          <span className="truncate">{webhook.callbackId}</span>
        </button>
      ),
      sortable: true,
      filterable: true,
      filterType: 'text',
      defaultWidth: 200,
      minWidth: 150,
    },
    {
      id: 'workflowName',
      accessorKey: 'workflowName',
      header: 'Workflow',
      cell: (webhook) => (
        <span className="text-sm">{webhook.workflowName || 'N/A'}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'text',
      defaultWidth: 180,
    },
    {
      id: 'eventType',
      accessorKey: 'eventType',
      header: 'Event Type',
      cell: (webhook) => (
        <span className="text-sm">{webhook.eventType || 'N/A'}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'text',
      defaultWidth: 180,
    },
    {
      id: 'signatureValid',
      accessorKey: 'signatureValid',
      header: 'Signature',
      cell: (webhook) => (
        <Badge
          className={
            webhook.signatureValid
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }
        >
          {webhook.signatureValid ? 'Valid' : 'Invalid'}
        </Badge>
      ),
      sortable: true,
      filterable: false,
      defaultWidth: 100,
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: 'Created',
      cell: (webhook, width) => (
        <span className="text-muted-foreground">{formatDate(webhook.createdAt, width)}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'date',
      defaultWidth: 180,
    },
    // Hidden by default columns
    {
      id: 'id',
      accessorKey: 'id',
      header: 'ID',
      cell: (webhook) => (
        <span className="font-mono text-xs text-muted-foreground">
          {webhook.id.slice(0, 8)}...
        </span>
      ),
      sortable: false,
      filterable: true,
      filterType: 'text',
      defaultVisible: false,
      defaultWidth: 100,
    },
    {
      id: 'signatureHeader',
      accessorKey: 'signatureHeader',
      header: 'Signature Header',
      cell: (webhook) => (
        <span className="font-mono text-xs text-muted-foreground truncate">
          {webhook.signatureHeader ? `${webhook.signatureHeader.slice(0, 20)}...` : 'N/A'}
        </span>
      ),
      sortable: false,
      filterable: true,
      filterType: 'text',
      defaultVisible: false,
      defaultWidth: 150,
    },
    {
      id: 'verifiedAt',
      accessorKey: 'verifiedAt',
      header: 'Verified At',
      cell: (webhook, width) => (
        <span className="text-muted-foreground">{formatDate(webhook.verifiedAt, width)}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'date',
      defaultVisible: false,
      defaultWidth: 180,
    },
    {
      id: 'payloadPreview',
      accessorKey: 'payloadPreview',
      header: 'Payload Preview',
      cell: (webhook) => (
        <span className="text-xs text-muted-foreground truncate">
          {webhook.payloadPreview || 'N/A'}
        </span>
      ),
      sortable: false,
      filterable: true,
      filterType: 'text',
      defaultVisible: false,
      defaultWidth: 200,
    },
    {
      id: 'externalJobId',
      accessorKey: 'externalJobId',
      header: 'External Job ID',
      cell: (webhook) => (
        <span className="font-mono text-xs text-muted-foreground">
          {webhook.externalJobId || 'N/A'}
        </span>
      ),
      sortable: false,
      filterable: true,
      filterType: 'text',
      defaultVisible: false,
      defaultWidth: 150,
    },
    {
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: (webhook, width) => (
        <span className="text-muted-foreground">{formatDate(webhook.updatedAt, width)}</span>
      ),
      sortable: true,
      filterable: true,
      filterType: 'date',
      defaultVisible: false,
      defaultWidth: 180,
    },
  ], []);

  return (
    <>
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">Webhook Callbacks</CardTitle>
              <Badge variant="outline" className="font-mono">
                {webhooks.length} total
              </Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as WebhookStatusFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
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
                    // Reset handled by SmartTable
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
                    Failed to load webhook callbacks. Please try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Signature Legend */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1.5 bg-muted/30 rounded-md mb-2">
            <span className="font-medium">Signature:</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span>Valid</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-500" />
              <span>Invalid</span>
            </div>
          </div>

          {/* SmartTable */}
          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SmartTable
                data={webhooks}
                columns={columns}
                localStorageKey="llm-webhooks-table-prefs"
                tableInstanceRef={tableRef}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Webhook Detail Modal */}
      <WebhookDetailModal
        webhookId={selectedWebhookId}
        onClose={() => setSelectedWebhookId(null)}
      />
    </>
  );
}
