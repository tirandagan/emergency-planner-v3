ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "subscription_period_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "newsletter_opt_in" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "marketing_emails_opt_in" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "system_emails_opt_in" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "drip_campaigns_opt_in" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "call_reminders_opt_in" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_profiles_subscription_tier" ON "profiles" USING btree ("subscription_tier");--> statement-breakpoint
CREATE INDEX "idx_profiles_stripe_customer_id" ON "profiles" USING btree ("stripe_customer_id");