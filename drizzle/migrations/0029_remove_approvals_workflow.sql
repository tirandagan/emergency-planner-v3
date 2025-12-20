-- Migration: Remove legacy approvals workflow
-- Removes: scraped_queue table, master_items.status field and index

-- Drop scraped_queue table
DROP TABLE IF EXISTS "scraped_queue" CASCADE;

-- Drop master_items status index
DROP INDEX IF EXISTS "idx_master_items_status";

-- Drop master_items status column
ALTER TABLE "master_items" DROP COLUMN IF EXISTS "status";
