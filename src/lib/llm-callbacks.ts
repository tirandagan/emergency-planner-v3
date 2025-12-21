import { db } from '@/db';
import { llmCallbacks, llmCallbackViews, type LLMCallbackDetail, type NewLLMCallback } from '@/db/schema/llm-callbacks';
import { eq, desc, gt, and, sql } from 'drizzle-orm';

/**
 * Cursor-based callback polling
 * Returns all callbacks created after the cursor timestamp
 * Client is responsible for filtering viewed/unviewed based on local state
 *
 * @param afterCursor - ISO timestamp to fetch callbacks after (exclusive)
 * @param limit - Maximum number of callbacks to return
 * @returns Callbacks and next cursor for pagination
 */
export async function getRecentCallbacks(
  afterCursor?: string,
  limit: number = 20
): Promise<{ items: typeof llmCallbacks.$inferSelect[]; nextCursor: string | null }> {
  const conditions = [];

  if (afterCursor) {
    conditions.push(gt(llmCallbacks.createdAt, new Date(afterCursor)));
  }

  const items = await db
    .select()
    .from(llmCallbacks)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(llmCallbacks.createdAt))
    .limit(limit);

  const nextCursor = items.length === limit && items.length > 0
    ? items[items.length - 1].createdAt.toISOString()
    : null;

  return { items, nextCursor };
}

/**
 * Get full callback details with viewed status for specific user
 *
 * @param callbackId - UUID of the callback
 * @param userId - Admin user ID to check viewed status
 * @returns Full callback details or null if not found
 */
export async function getCallbackById(
  callbackId: string,
  userId: string
): Promise<LLMCallbackDetail | null> {
  const [callback] = await db
    .select()
    .from(llmCallbacks)
    .where(eq(llmCallbacks.id, callbackId))
    .limit(1);

  if (!callback) return null;

  const [viewRecord] = await db
    .select()
    .from(llmCallbackViews)
    .where(
      and(
        eq(llmCallbackViews.callbackId, callbackId),
        eq(llmCallbackViews.adminUserId, userId)
      )
    )
    .limit(1);

  return {
    id: callback.id,
    callbackId: callback.callbackId,
    signatureValid: callback.signatureValid,
    signatureHeader: callback.signatureHeader,
    verifiedAt: callback.verifiedAt?.toISOString() ?? null,
    payload: callback.payload as Record<string, unknown>,
    payloadPreview: callback.payloadPreview,
    externalJobId: callback.externalJobId,
    workflowName: callback.workflowName,
    eventType: callback.eventType,
    viewedByCurrentUser: !!viewRecord,
    createdAt: callback.createdAt.toISOString(),
    updatedAt: callback.updatedAt.toISOString(),
  };
}

/**
 * Create or update LLM callback (idempotent upsert)
 * Uses callback_id from payload.job_id for idempotency
 * Handles retries from LLM service gracefully
 *
 * @param data - Callback data from webhook
 * @returns Created or updated callback record
 */
export async function createLLMCallback(
  data: NewLLMCallback
): Promise<typeof llmCallbacks.$inferSelect> {
  const [callback] = await db
    .insert(llmCallbacks)
    .values(data)
    .onConflictDoUpdate({
      target: llmCallbacks.callbackId,
      set: {
        signatureValid: data.signatureValid,
        signatureHeader: data.signatureHeader,
        verifiedAt: data.verifiedAt,
        payload: data.payload,
        payloadPreview: data.payloadPreview,
        externalJobId: data.externalJobId,
        workflowName: data.workflowName,
        eventType: data.eventType,
        updatedAt: new Date(),
      },
    })
    .returning();

  return callback;
}

/**
 * Mark callback as viewed by admin user
 * Inserts into join table (idempotent - primary key prevents duplicates)
 *
 * @param callbackId - UUID of the callback
 * @param adminUserId - Admin user ID
 */
export async function markCallbackAsViewed(
  callbackId: string,
  adminUserId: string
): Promise<void> {
  await db
    .insert(llmCallbackViews)
    .values({
      callbackId,
      adminUserId,
    })
    .onConflictDoNothing();
}

/**
 * Get callback history with optional filters and pagination
 * For admin history tab display
 *
 * @param filters - Optional filters for event type, workflow name, signature validity
 * @param limit - Maximum number of results
 * @param offset - Offset for pagination
 * @returns Callbacks matching filters
 */
export async function getCallbackHistory(
  filters?: {
    eventType?: string;
    workflowName?: string;
    signatureValid?: boolean;
    onlyInvalid?: boolean;
  },
  limit: number = 50,
  offset: number = 0
): Promise<typeof llmCallbacks.$inferSelect[]> {
  const conditions = [];

  if (filters?.eventType) {
    conditions.push(eq(llmCallbacks.eventType, filters.eventType));
  }

  if (filters?.workflowName) {
    conditions.push(eq(llmCallbacks.workflowName, filters.workflowName));
  }

  if (filters?.signatureValid !== undefined) {
    conditions.push(eq(llmCallbacks.signatureValid, filters.signatureValid));
  }

  if (filters?.onlyInvalid) {
    conditions.push(eq(llmCallbacks.signatureValid, false));
  }

  return await db
    .select()
    .from(llmCallbacks)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(llmCallbacks.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Delete a callback and associated view records
 * Admin cleanup function
 *
 * @param callbackId - UUID of the callback to delete
 * @returns True if deleted, false if not found
 */
export async function deleteCallback(callbackId: string): Promise<boolean> {
  const result = await db
    .delete(llmCallbacks)
    .where(eq(llmCallbacks.id, callbackId))
    .returning();

  return result.length > 0;
}

/**
 * Get count of callbacks with invalid signatures
 * For admin monitoring dashboard
 *
 * @returns Count of callbacks with signature_valid = false
 */
export async function getInvalidSignatureCount(): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(llmCallbacks)
    .where(eq(llmCallbacks.signatureValid, false));

  return Number(result?.count ?? 0);
}

/**
 * Get count of unviewed callbacks for a specific admin user
 * For notification badge display
 *
 * @param adminUserId - Admin user ID
 * @returns Count of callbacks not viewed by this user
 */
export async function getUnviewedCallbackCount(adminUserId: string): Promise<number> {
  const subquery = db
    .select({ callbackId: llmCallbackViews.callbackId })
    .from(llmCallbackViews)
    .where(eq(llmCallbackViews.adminUserId, adminUserId));

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(llmCallbacks)
    .where(
      sql`${llmCallbacks.id} NOT IN ${subquery}`
    );

  return Number(result?.count ?? 0);
}
