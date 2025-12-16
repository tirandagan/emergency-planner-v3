-- Down migration for 0002_wandering_mandrill
-- This script rolls back profiles table enhancements
-- ⚠️  WARNING: This will DROP email preference columns and location/phone/timezone data!

-- Drop indexes from profiles
DROP INDEX IF EXISTS "idx_profiles_subscription_tier";
DROP INDEX IF EXISTS "idx_profiles_stripe_customer_id";

-- Drop email preference columns from profiles
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "call_reminders_opt_in";
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "drip_campaigns_opt_in";
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "system_emails_opt_in";
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "marketing_emails_opt_in";
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "newsletter_opt_in";

-- Drop contact and location columns from profiles
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "timezone";
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "location";
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "subscription_period_end";

-- Re-add categories foreign key constraint (if it was dropped)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'categories_parent_id_categories_id_fk'
  ) THEN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" 
    FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE CASCADE;
  END IF;
END $$;




























