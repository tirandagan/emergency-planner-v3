'use server';

/**
 * Server Actions for LLM System
 *
 * Provides data fetching for:
 * - AI usage dashboard (overview tab)
 * - Webhook callback history (webhooks tab)
 */

import { db } from '@/db';
import { llmCallbacks } from '@/db/schema/llm-callbacks';
import { desc, eq, and, gte, sql } from 'drizzle-orm';
import { getAIUsageDashboard } from '@/lib/queries/ai-usage';
import type { AIUsageDashboard } from '@/lib/queries/ai-usage';

export type WebhookStatusFilter = 'all' | 'valid' | 'invalid';

export interface LLMWebhook {
  id: string;
  callbackId: string;
  signatureValid: boolean;
  signatureHeader: string | null;
  verifiedAt: string | null;
  payload: Record<string, unknown>;
  payloadPreview: string | null;
  externalJobId: string | null;
  workflowName: string | null;
  eventType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhooksResponse {
  webhooks: LLMWebhook[];
  total: number;
}

/**
 * Fetch webhook callbacks with optional filtering
 */
export async function fetchLLMWebhooks(
  statusFilter: WebhookStatusFilter = 'all',
  limitStr: string = '25'
): Promise<WebhooksResponse> {
  const conditions = [];

  // Apply signature validation filter
  if (statusFilter === 'valid') {
    conditions.push(eq(llmCallbacks.signatureValid, true));
  } else if (statusFilter === 'invalid') {
    conditions.push(eq(llmCallbacks.signatureValid, false));
  }

  // Parse limit (special handling for time-based limits)
  let limit = 25;
  let timeBasedFilter = null;

  if (limitStr === 'Today' || limitStr === '24h') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    timeBasedFilter = gte(llmCallbacks.createdAt, yesterday);
    limit = 1000; // High limit for time-based queries
  } else if (limitStr === '7 Days' || limitStr === '7d') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    timeBasedFilter = gte(llmCallbacks.createdAt, weekAgo);
    limit = 1000;
  } else if (limitStr === '30 Days' || limitStr === '30d') {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    timeBasedFilter = gte(llmCallbacks.createdAt, monthAgo);
    limit = 1000;
  } else {
    limit = parseInt(limitStr, 10) || 25;
  }

  if (timeBasedFilter) {
    conditions.push(timeBasedFilter);
  }

  // Build query with conditions
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Fetch webhooks
  const webhooks = await db
    .select({
      id: llmCallbacks.id,
      callbackId: llmCallbacks.callbackId,
      signatureValid: llmCallbacks.signatureValid,
      signatureHeader: llmCallbacks.signatureHeader,
      verifiedAt: llmCallbacks.verifiedAt,
      payload: llmCallbacks.payload,
      payloadPreview: llmCallbacks.payloadPreview,
      externalJobId: llmCallbacks.externalJobId,
      workflowName: llmCallbacks.workflowName,
      eventType: llmCallbacks.eventType,
      createdAt: llmCallbacks.createdAt,
      updatedAt: llmCallbacks.updatedAt,
    })
    .from(llmCallbacks)
    .where(whereClause)
    .orderBy(desc(llmCallbacks.createdAt))
    .limit(limit);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(llmCallbacks)
    .where(whereClause);

  // Format response
  const formattedWebhooks: LLMWebhook[] = webhooks.map((webhook) => ({
    id: webhook.id,
    callbackId: webhook.callbackId,
    signatureValid: webhook.signatureValid,
    signatureHeader: webhook.signatureHeader,
    verifiedAt: webhook.verifiedAt ? webhook.verifiedAt.toISOString() : null,
    payload: webhook.payload as Record<string, unknown>,
    payloadPreview: webhook.payloadPreview,
    externalJobId: webhook.externalJobId,
    workflowName: webhook.workflowName,
    eventType: webhook.eventType,
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
  }));

  return {
    webhooks: formattedWebhooks,
    total: count,
  };
}

/**
 * Fetch single webhook callback detail by ID
 */
export async function getLLMWebhookDetail(
  webhookId: string
): Promise<LLMWebhook | null> {
  const [webhook] = await db
    .select({
      id: llmCallbacks.id,
      callbackId: llmCallbacks.callbackId,
      signatureValid: llmCallbacks.signatureValid,
      signatureHeader: llmCallbacks.signatureHeader,
      verifiedAt: llmCallbacks.verifiedAt,
      payload: llmCallbacks.payload,
      payloadPreview: llmCallbacks.payloadPreview,
      externalJobId: llmCallbacks.externalJobId,
      workflowName: llmCallbacks.workflowName,
      eventType: llmCallbacks.eventType,
      createdAt: llmCallbacks.createdAt,
      updatedAt: llmCallbacks.updatedAt,
    })
    .from(llmCallbacks)
    .where(eq(llmCallbacks.id, webhookId))
    .limit(1);

  if (!webhook) {
    return null;
  }

  return {
    id: webhook.id,
    callbackId: webhook.callbackId,
    signatureValid: webhook.signatureValid,
    signatureHeader: webhook.signatureHeader,
    verifiedAt: webhook.verifiedAt ? webhook.verifiedAt.toISOString() : null,
    payload: webhook.payload as Record<string, unknown>,
    payloadPreview: webhook.payloadPreview,
    externalJobId: webhook.externalJobId,
    workflowName: webhook.workflowName,
    eventType: webhook.eventType,
    createdAt: webhook.createdAt.toISOString(),
    updatedAt: webhook.updatedAt.toISOString(),
  };
}

/**
 * Fetch AI usage dashboard data (Overview tab)
 */
export async function fetchAIUsageDashboard(): Promise<AIUsageDashboard> {
  return await getAIUsageDashboard(30);
}
