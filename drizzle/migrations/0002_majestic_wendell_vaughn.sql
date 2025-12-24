-- Add affiliate fields to suppliers table
-- Migration: Add vendor-agnostic affiliate program configuration

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'affiliate_id') THEN
    ALTER TABLE "suppliers" ADD COLUMN "affiliate_id" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'affiliate_url_template') THEN
    ALTER TABLE "suppliers" ADD COLUMN "affiliate_url_template" TEXT;
  END IF;
END $$;

-- Add index for suppliers with affiliate configuration
CREATE INDEX IF NOT EXISTS "idx_suppliers_affiliate_id" ON "suppliers" ("affiliate_id") WHERE "affiliate_id" IS NOT NULL;
