-- Down migration: Remove affiliate fields from suppliers table
-- WARNING: This will permanently delete all affiliate configuration data

-- Remove index
DROP INDEX IF EXISTS "idx_suppliers_affiliate_id";

-- Remove columns (IF EXISTS for safety)
ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "affiliate_url_template";
ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "affiliate_id";
