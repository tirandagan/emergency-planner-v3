ALTER TABLE "profiles" ADD COLUMN "household_members" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "save_household_preference" boolean DEFAULT true;--> statement-breakpoint
CREATE INDEX "idx_profiles_household_members" ON "profiles" USING gin ("household_members");