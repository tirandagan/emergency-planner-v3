import { pgTable, uuid, text, jsonb, timestamp, boolean, index, primaryKey } from 'drizzle-orm/pg-core';

/**
 * LLM Callbacks Table
 * Stores webhook callbacks from external LLM service for admin monitoring
 *
 * Key improvements:
 * - Idempotent: Uses job_id from LLM service (stable across retries)
 * - Signature verification results stored (not just raw signature)
 * - Job correlation fields for filtering and linking
 * - Payload preview for fast history table rendering
 * - <200ms webhook response time target
 */
export const llmCallbacks = pgTable(
  'llm_callbacks',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Idempotency: Use job_id from LLM service payload (stable across retries)
    callbackId: text('callback_id').notNull().unique(),

    // Signature verification results (not raw signature string)
    signatureValid: boolean('signature_valid').notNull().default(false),
    signatureHeader: text('signature_header'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    // Payload data (size limit: 1MB enforced in webhook handler)
    payload: jsonb('payload').notNull(),
    payloadPreview: text('payload_preview'), // First 200 chars for history display

    // Job correlation fields
    externalJobId: text('external_job_id'), // From payload.job_id
    workflowName: text('workflow_name'),    // From payload.workflow_name
    eventType: text('event_type'),          // workflow.completed, workflow.failed, llm.step.completed

    // Timestamps (updated_at auto-updated via trigger)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_llm_callbacks_created_at').on(table.createdAt),
    index('idx_llm_callbacks_callback_id').on(table.callbackId),
    index('idx_llm_callbacks_external_job_id').on(table.externalJobId),
    index('idx_llm_callbacks_workflow_name').on(table.workflowName),
  ]
);

/**
 * LLM Callback Views Table
 * Tracks which admin users have viewed which callbacks
 *
 * Replaces viewed_by TEXT[] array to:
 * - Avoid race conditions on concurrent updates
 * - Enable efficient "unviewed by user X" queries
 * - Provide audit trail with timestamps
 */
export const llmCallbackViews = pgTable(
  'llm_callback_views',
  {
    callbackId: uuid('callback_id')
      .notNull()
      .references(() => llmCallbacks.id, { onDelete: 'cascade' }),
    adminUserId: uuid('admin_user_id').notNull(),
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.callbackId, table.adminUserId] }),
    index('idx_llm_callback_views_admin_viewed').on(table.adminUserId, table.viewedAt),
  ]
);

// Type exports
export type LLMCallback = typeof llmCallbacks.$inferSelect;
export type NewLLMCallback = typeof llmCallbacks.$inferInsert;
export type LLMCallbackView = typeof llmCallbackViews.$inferSelect;
export type NewLLMCallbackView = typeof llmCallbackViews.$inferInsert;

/**
 * Detailed callback data structure for modal display
 */
export interface LLMCallbackDetail {
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
  viewedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
}
