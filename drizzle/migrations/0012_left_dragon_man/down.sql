-- Down migration for 0012_left_dragon_man
-- Rollback: Update plan_shares table changes

-- ⚠️ WARNING: This down migration will:
-- - Rename shared_by_user_id back to user_id
-- - Remove accessed_at column
-- - Remove CHECK constraint on permissions
-- - Remove default from expires_at
-- - Remove unique constraint from share_token
-- - Restore old index names and constraints

-- Rename indexes back to original names
DROP INDEX IF EXISTS "idx_plan_shares_token";
CREATE INDEX IF NOT EXISTS "idx_plan_shares_share_token" ON "plan_shares" ("share_token");

DROP INDEX IF EXISTS "idx_plan_shares_mission_report";
CREATE INDEX IF NOT EXISTS "idx_plan_shares_mission_report_id" ON "plan_shares" ("mission_report_id");

DROP INDEX IF EXISTS "idx_plan_shares_shared_by";
CREATE INDEX IF NOT EXISTS "idx_plan_shares_user_id" ON "plan_shares" ("shared_by_user_id");

-- Rename column back
ALTER TABLE "plan_shares" RENAME COLUMN "shared_by_user_id" TO "user_id";

-- Update foreign key constraint to use old column name
ALTER TABLE "plan_shares" DROP CONSTRAINT IF EXISTS "plan_shares_shared_by_user_id_profiles_id_fk";
ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_user_id_profiles_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Remove unique constraint from share_token
ALTER TABLE "plan_shares" DROP CONSTRAINT IF EXISTS "plan_shares_share_token_unique";

-- Remove default from expires_at and make it nullable
ALTER TABLE "plan_shares" ALTER COLUMN "expires_at" DROP DEFAULT;
ALTER TABLE "plan_shares" ALTER COLUMN "expires_at" DROP NOT NULL;

-- Remove CHECK constraint on permissions
ALTER TABLE "plan_shares" DROP CONSTRAINT IF EXISTS "plan_shares_permissions_check";

-- Remove accessed_at column
ALTER TABLE "plan_shares" DROP COLUMN IF EXISTS "accessed_at";

-- Restore unique constraint on mission_report_id + shared_with_email
DO $$ BEGIN
  ALTER TABLE "plan_shares" ADD CONSTRAINT "idx_plan_shares_unique"
    UNIQUE ("mission_report_id", "shared_with_email");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
