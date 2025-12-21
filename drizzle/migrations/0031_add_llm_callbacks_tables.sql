-- Migration: Add LLM Callbacks and Callback Views tables
-- Generated: 2025-12-20
-- Purpose: Store webhook callbacks from LLM service with signature verification and view tracking

-- Create updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create llm_callbacks table
CREATE TABLE IF NOT EXISTS "llm_callbacks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  -- Idempotency: job_id from LLM service (stable across retries)
  "callback_id" text UNIQUE NOT NULL,

  -- Signature verification results
  "signature_valid" boolean NOT NULL DEFAULT false,
  "signature_header" text,
  "verified_at" timestamp with time zone,

  -- Payload data (1MB limit enforced in webhook handler)
  "payload" jsonb NOT NULL,
  "payload_preview" text,

  -- Job correlation
  "external_job_id" text,
  "workflow_name" text,
  "event_type" text,

  -- Status tracking
  "status" text NOT NULL,
  "error_message" text,

  -- Timestamps
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create indexes for llm_callbacks
CREATE INDEX IF NOT EXISTS "idx_llm_callbacks_created_at" ON "llm_callbacks" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_llm_callbacks_status" ON "llm_callbacks" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_llm_callbacks_callback_id" ON "llm_callbacks" USING btree ("callback_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_llm_callbacks_external_job_id" ON "llm_callbacks" USING btree ("external_job_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_llm_callbacks_workflow_name" ON "llm_callbacks" USING btree ("workflow_name");
--> statement-breakpoint

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_llm_callbacks_updated_at
  BEFORE UPDATE ON "llm_callbacks"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
--> statement-breakpoint

-- Create llm_callback_views table (join table)
CREATE TABLE IF NOT EXISTS "llm_callback_views" (
  "callback_id" uuid NOT NULL REFERENCES "llm_callbacks"("id") ON DELETE CASCADE,
  "admin_user_id" uuid NOT NULL,
  "viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("callback_id", "admin_user_id")
);
--> statement-breakpoint

-- Create index for unviewed callbacks query
CREATE INDEX IF NOT EXISTS "idx_llm_callback_views_admin_viewed"
  ON "llm_callback_views" USING btree ("admin_user_id", "viewed_at");
