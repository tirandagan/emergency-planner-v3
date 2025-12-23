-- Add affiliate fields to suppliers table
-- Migration: Add vendor-agnostic affiliate program configuration

ALTER TABLE "suppliers"
ADD COLUMN "affiliate_id" TEXT,
ADD COLUMN "affiliate_url_template" TEXT;

-- Add index for suppliers with affiliate configuration
CREATE INDEX "idx_suppliers_affiliate_id" ON "suppliers" ("affiliate_id") WHERE "affiliate_id" IS NOT NULL;
