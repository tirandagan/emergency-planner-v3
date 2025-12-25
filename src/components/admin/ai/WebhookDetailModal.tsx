'use client';

/**
 * Webhook Detail Modal - Professional redesign with collapsible sections
 *
 * Features:
 * - Wider, shorter layout for better UX
 * - Collapsible sections for progressive disclosure
 * - Context-appropriate icons for visual hierarchy
 * - Reduced scrolling with smart default states
 * - Professional interaction patterns
 * - Maintained accessibility and dark mode support
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Shield,
  Link2,
  Clock,
  FileJson,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getLLMWebhookDetail } from '@/app/(protected)/admin/ai/actions';
import type { LLMWebhook } from '@/app/(protected)/admin/ai/actions';

interface WebhookDetailModalProps {
  webhookId: string | null;
  onClose: () => void;
}

export function WebhookDetailModal({
  webhookId,
  onClose,
}: WebhookDetailModalProps): React.JSX.Element {
  const [webhook, setWebhook] = useState<LLMWebhook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Collapsible section states - Signature Validation expanded by default as most critical
  const [signatureOpen, setSignatureOpen] = useState(true);
  const [correlationOpen, setCorrelationOpen] = useState(false);
  const [timestampsOpen, setTimestampsOpen] = useState(false);
  const [payloadOpen, setPayloadOpen] = useState(false);

  useEffect(() => {
    if (!webhookId) {
      setWebhook(null);
      setError(null);
      return;
    }

    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getLLMWebhookDetail(webhookId);
        if (!data) {
          throw new Error('Webhook not found');
        }
        setWebhook(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load webhook details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [webhookId]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const InfoRow = ({
    label,
    value,
    copyable = false,
    copyKey,
    mono = true,
  }: {
    label: string;
    value: string | React.ReactNode;
    copyable?: boolean;
    copyKey?: string;
    mono?: boolean;
  }) => (
    <div className="flex items-start py-2.5 gap-3">
      <div className="text-xs text-muted-foreground font-medium w-[140px] flex-shrink-0 pt-0.5">
        {label}
      </div>
      <div className="flex-1 flex items-start gap-2 min-w-0">
        <div className={`text-sm ${mono ? 'font-mono' : ''} break-words flex-1 min-w-0`}>
          {value}
        </div>
        {copyable && copyKey && typeof value === 'string' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 flex-shrink-0"
            onClick={() => copyToClipboard(value, copyKey)}
          >
            {copiedField === copyKey ? (
              <Check className="!w-3.5 !h-3.5 text-green-600" strokeWidth={2.5} />
            ) : (
              <Copy className="!w-3.5 !h-3.5" strokeWidth={2.5} />
            )}
          </Button>
        )}
      </div>
    </div>
  );

  const SectionHeader = ({
    icon: Icon,
    title,
    isOpen,
    badge,
  }: {
    icon: React.ElementType;
    title: string;
    isOpen: boolean;
    badge?: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors rounded-lg">
      <div className="flex items-center gap-2.5">
        <Icon className="!w-4 !h-4 text-muted-foreground" strokeWidth={2.5} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {badge}
      </div>
      {isOpen ? (
        <ChevronUp className="!w-4 !h-4 text-muted-foreground" strokeWidth={2.5} />
      ) : (
        <ChevronDown className="!w-4 !h-4 text-muted-foreground" strokeWidth={2.5} />
      )}
    </div>
  );

  return (
    <Dialog open={!!webhookId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <DialogTitle>Webhook Callback Details</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-6 pb-6 pt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="!w-8 !h-8 animate-spin text-muted-foreground" strokeWidth={2.5} />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400">
              <div className="flex items-center gap-2">
                <XCircle className="!w-5 !h-5" strokeWidth={2.5} />
                <p>{error}</p>
              </div>
            </div>
          )}

          {webhook && !isLoading && (
            <div className="space-y-3 pb-2">
            {/* Signature Validation - Expanded by default (most critical) */}
            <Collapsible open={signatureOpen} onOpenChange={setSignatureOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full">
                  <SectionHeader
                    icon={Shield}
                    title="Signature Validation"
                    isOpen={signatureOpen}
                    badge={
                      <Badge
                        className={
                          webhook.signatureValid
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }
                      >
                        {webhook.signatureValid ? (
                          <CheckCircle2 className="!w-3 !h-3 mr-1" strokeWidth={2.5} />
                        ) : (
                          <XCircle className="!w-3 !h-3 mr-1" strokeWidth={2.5} />
                        )}
                        {webhook.signatureValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    }
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-0 divide-y divide-border border rounded-lg">
                  {webhook.verifiedAt && (
                    <div className="px-4">
                      <InfoRow label="Verified At" value={formatDate(webhook.verifiedAt)} />
                    </div>
                  )}
                  {webhook.signatureHeader && (
                    <div className="px-4">
                      <InfoRow
                        label="Signature Header"
                        value={webhook.signatureHeader}
                        copyable
                        copyKey="signature"
                      />
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Job Correlation */}
            <Collapsible open={correlationOpen} onOpenChange={setCorrelationOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full">
                  <SectionHeader icon={Link2} title="Job Correlation" isOpen={correlationOpen} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-0 divide-y divide-border border rounded-lg">
                  <div className="px-4">
                    <InfoRow
                      label="Callback ID"
                      value={webhook.callbackId}
                      copyable
                      copyKey="callbackId"
                    />
                  </div>
                  <div className="px-4">
                    <InfoRow label="External Job ID" value={webhook.externalJobId || 'N/A'} />
                  </div>
                  <div className="px-4">
                    <InfoRow
                      label="Workflow Name"
                      value={webhook.workflowName || 'N/A'}
                      mono={false}
                    />
                  </div>
                  <div className="px-4">
                    <InfoRow label="Event Type" value={webhook.eventType || 'N/A'} mono={false} />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Timestamps */}
            <Collapsible open={timestampsOpen} onOpenChange={setTimestampsOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full">
                  <SectionHeader icon={Clock} title="Timestamps" isOpen={timestampsOpen} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 space-y-0 divide-y divide-border border rounded-lg">
                  <div className="px-4">
                    <InfoRow label="Created At" value={formatDate(webhook.createdAt)} />
                  </div>
                  <div className="px-4">
                    <InfoRow label="Updated At" value={formatDate(webhook.updatedAt)} />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Payload */}
            <Collapsible open={payloadOpen} onOpenChange={setPayloadOpen}>
              <CollapsibleTrigger asChild>
                <button className="w-full">
                  <SectionHeader icon={FileJson} title="Payload (JSON)" isOpen={payloadOpen} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2">
                  <div className="flex items-center justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(webhook.payload, null, 2), 'payload')
                      }
                    >
                      {copiedField === 'payload' ? (
                        <>
                          <Check className="!w-3.5 !h-3.5 text-green-600" strokeWidth={2.5} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="!w-3.5 !h-3.5" strokeWidth={2.5} />
                          Copy JSON
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 bg-slate-950 dark:bg-slate-900">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-100">
                      {JSON.stringify(webhook.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
