-- Add disabled status fields to plan_shares
ALTER TABLE "plan_shares"
  ADD COLUMN IF NOT EXISTS "is_disabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "disabled_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "disabled_reason" text,
  ADD COLUMN IF NOT EXISTS "reactivated_at" timestamp with time zone;

-- Create index for disabled shares
CREATE INDEX IF NOT EXISTS "idx_plan_shares_disabled" ON "plan_shares" ("is_disabled", "mission_report_id");
