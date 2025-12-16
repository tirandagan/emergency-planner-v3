-- Create system_settings table
CREATE TABLE IF NOT EXISTS "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL UNIQUE,
	"value" text NOT NULL,
	"value_type" text DEFAULT 'string' NOT NULL,
	"description" text,
	"category" text DEFAULT 'general' NOT NULL,
	"is_editable" boolean DEFAULT true NOT NULL,
	"environment" text DEFAULT 'all',
	"last_modified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_system_settings_key" ON "system_settings" ("key");
CREATE INDEX IF NOT EXISTS "idx_system_settings_category" ON "system_settings" ("category");
CREATE INDEX IF NOT EXISTS "idx_system_settings_environment" ON "system_settings" ("environment");

-- Add foreign key
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_last_modified_by_profiles_id_fk"
  FOREIGN KEY ("last_modified_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;

-- Seed default settings
INSERT INTO "system_settings" ("key", "value", "value_type", "description", "category") VALUES
  ('share_link_expiration_days', '30', 'number', 'Default number of days before share links expire', 'sharing'),
  ('deleted_plans_retention_days', '30', 'number', 'Number of days to keep soft-deleted plans before permanent deletion', 'cleanup'),
  ('send_share_notification_emails', 'true', 'boolean', 'Whether to send email notifications when plans are shared', 'notifications'),
  ('max_plan_versions_per_report', '10', 'number', 'Maximum number of versions to retain per plan', 'versioning')
ON CONFLICT (key) DO NOTHING;
