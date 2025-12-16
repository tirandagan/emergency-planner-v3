ALTER TABLE "profiles" ADD COLUMN "is_high_value" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "last_active_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_profiles_is_high_value" ON "profiles" USING btree ("is_high_value");--> statement-breakpoint
CREATE INDEX "idx_profiles_last_active_at" ON "profiles" USING btree ("last_active_at");