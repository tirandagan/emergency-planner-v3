-- Down Migration: Restore legacy approvals workflow
-- WARNING: This rollback recreates removed tables and fields
-- Data in scraped_queue will be lost (table was dropped)

-- Restore master_items status column
ALTER TABLE "master_items"
  ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active';

-- Restore master_items status index
CREATE INDEX IF NOT EXISTS "idx_master_items_status" ON "master_items"("status");

-- Restore scraped_queue table
CREATE TABLE IF NOT EXISTS "scraped_queue" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "asin" text NOT NULL UNIQUE,
  "status" text NOT NULL DEFAULT 'pending',
  "priority" integer NOT NULL DEFAULT 0,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Restore scraped_queue indexes
CREATE INDEX IF NOT EXISTS "idx_scraped_queue_status" ON "scraped_queue"("status");
CREATE INDEX IF NOT EXISTS "idx_scraped_queue_priority" ON "scraped_queue"("priority");

-- WARNING: All data in scraped_queue was lost during the forward migration
