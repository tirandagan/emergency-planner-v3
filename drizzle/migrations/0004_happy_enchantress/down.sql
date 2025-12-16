-- Down migration for admin user analytics fields
-- Migration: 0004_happy_enchantress
-- WARNING: This will permanently delete high-value user flags and last active timestamps

-- Drop indexes first (safe operations)
DROP INDEX IF EXISTS "idx_profiles_is_high_value";
DROP INDEX IF EXISTS "idx_profiles_last_active_at";

-- Drop columns (DATA LOSS WARNING)
-- This will remove all high-value user flags set by admins
-- This will remove all last active timestamps
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "is_high_value";
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "last_active_at";

-- Migration can be re-applied with: npm run db:migrate
-- Note: High-value flags will need to be re-flagged manually after rollback
