-- =====================================================
-- DOWN MIGRATION: 0007_fantastic_cardiac
-- Purpose: Rollback household members profile persistence feature
-- Created: 2025-12-25
-- =====================================================

-- WARNING: This migration will DROP columns from the profiles table.
-- WARNING: All saved household member configurations will be PERMANENTLY LOST.
-- WARNING: User preferences for saving household members will be PERMANENTLY LOST.
-- This rollback is safe for development but should be carefully reviewed before production use.

-- Step 1: Drop the GIN index on household_members JSONB column
DROP INDEX IF EXISTS "idx_profiles_household_members";

-- Step 2: Drop the save_household_preference column
-- This will permanently delete all user preferences for the save household feature
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "save_household_preference";

-- Step 3: Drop the household_members JSONB column
-- This will permanently delete all saved household member configurations
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "household_members";

-- =====================================================
-- Rollback verification:
-- After running this migration, verify that:
-- 1. idx_profiles_household_members index no longer exists
-- 2. profiles.save_household_preference column no longer exists
-- 3. profiles.household_members column no longer exists
-- =====================================================
