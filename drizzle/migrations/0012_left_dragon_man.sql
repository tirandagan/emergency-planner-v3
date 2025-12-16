-- Custom migration: Update plan_shares table for Phase 4.5 Plan Details
-- Changes:
-- 1. Rename user_id to shared_by_user_id for clarity
-- 2. Add accessed_at column for tracking when shared links are accessed
-- 3. Add CHECK constraint for permissions enum
-- 4. Add default value for expires_at (30 days from now)
-- 5. Add unique constraint to share_token
-- 6. Update indexes to match new schema

-- Rename user_id column to shared_by_user_id
ALTER TABLE "plan_shares" RENAME COLUMN "user_id" TO "shared_by_user_id";

-- Add accessed_at column
ALTER TABLE "plan_shares" ADD COLUMN IF NOT EXISTS "accessed_at" timestamp with time zone;

-- Add CHECK constraint for permissions enum
DO $$ BEGIN
  ALTER TABLE "plan_shares" DROP CONSTRAINT IF EXISTS "plan_shares_permissions_check";
  ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_permissions_check"
    CHECK ("permissions" IN ('view', 'edit'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add default for expires_at if not already present
ALTER TABLE "plan_shares" ALTER COLUMN "expires_at" SET DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE "plan_shares" ALTER COLUMN "expires_at" SET NOT NULL;

-- Add unique constraint to share_token if not already present
DO $$ BEGIN
  ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_share_token_unique" UNIQUE ("share_token");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Drop old index and create new one with updated name
DROP INDEX IF EXISTS "idx_plan_shares_user_id";
CREATE INDEX IF NOT EXISTS "idx_plan_shares_shared_by" ON "plan_shares" ("shared_by_user_id");

-- Recreate foreign key constraint with new column name
ALTER TABLE "plan_shares" DROP CONSTRAINT IF EXISTS "plan_shares_user_id_profiles_id_fk";
ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_shared_by_user_id_profiles_id_fk"
  FOREIGN KEY ("shared_by_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Rename other indexes to match new naming convention
DROP INDEX IF EXISTS "idx_plan_shares_mission_report_id";
CREATE INDEX IF NOT EXISTS "idx_plan_shares_mission_report" ON "plan_shares" ("mission_report_id");

DROP INDEX IF EXISTS "idx_plan_shares_share_token";
CREATE INDEX IF NOT EXISTS "idx_plan_shares_token" ON "plan_shares" ("share_token");

-- Remove the unique constraint on mission_report_id + shared_with_email (users can share with same email multiple times)
ALTER TABLE "plan_shares" DROP CONSTRAINT IF EXISTS "idx_plan_shares_unique";
