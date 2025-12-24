-- Down Migration: 0004_square_nicolaos
-- Rollback product quantity refactor (package_size and required_quantity columns)
-- Created: 2025-12-23
--
-- ⚠️ WARNING: This migration will drop the package_size and required_quantity columns.
-- Any data in these columns will be PERMANENTLY LOST.
-- Ensure you have a backup before proceeding.
--
-- SAFE ROLLBACK STEPS:
-- 1. Drop the index on quantity columns (if it exists)
-- 2. Drop the required_quantity column (if it exists)
-- 3. Drop the package_size column (if it exists)

-- Step 1: Drop index (safe - will not fail if index doesn't exist)
DROP INDEX IF EXISTS "idx_specific_products_quantities";

-- Step 2: Drop required_quantity column (safe - will not fail if column doesn't exist)
ALTER TABLE "specific_products" DROP COLUMN IF EXISTS "required_quantity";

-- Step 3: Drop package_size column (safe - will not fail if column doesn't exist)
ALTER TABLE "specific_products" DROP COLUMN IF EXISTS "package_size";

-- ROLLBACK COMPLETE
-- The specific_products table has been restored to its previous schema.
--
-- NOTE: If you need to restore quantity data, you should:
-- 1. Have a database backup from before the migration
-- 2. Manually copy quantity values back to metadata->>'quantity' field if needed
