-- Create plan_edit_history table
CREATE TABLE IF NOT EXISTS "plan_edit_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mission_report_id" uuid NOT NULL,
	"version_id" uuid,
	"edited_by_user_id" uuid NOT NULL,
	"field_path" text NOT NULL,
	"field_name" text NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb NOT NULL,
	"change_type" text DEFAULT 'update' NOT NULL,
	"is_conflict" boolean DEFAULT false NOT NULL,
	"conflict_resolved_by" uuid,
	"conflict_resolution_strategy" text,
	"user_agent" text,
	"ip_address" text,
	"edit_source" text DEFAULT 'web_ui' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_plan_edit_history_mission_report" ON "plan_edit_history" ("mission_report_id");
CREATE INDEX IF NOT EXISTS "idx_plan_edit_history_edited_by" ON "plan_edit_history" ("edited_by_user_id");
CREATE INDEX IF NOT EXISTS "idx_plan_edit_history_field_path" ON "plan_edit_history" ("mission_report_id", "field_path");
CREATE INDEX IF NOT EXISTS "idx_plan_edit_history_created_at" ON "plan_edit_history" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_plan_edit_history_conflicts" ON "plan_edit_history" ("is_conflict", "mission_report_id");

-- Add foreign keys
ALTER TABLE "plan_edit_history" ADD CONSTRAINT "plan_edit_history_mission_report_id_mission_reports_id_fk"
  FOREIGN KEY ("mission_report_id") REFERENCES "mission_reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "plan_edit_history" ADD CONSTRAINT "plan_edit_history_version_id_plan_versions_id_fk"
  FOREIGN KEY ("version_id") REFERENCES "plan_versions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "plan_edit_history" ADD CONSTRAINT "plan_edit_history_edited_by_user_id_profiles_id_fk"
  FOREIGN KEY ("edited_by_user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "plan_edit_history" ADD CONSTRAINT "plan_edit_history_conflict_resolved_by_profiles_id_fk"
  FOREIGN KEY ("conflict_resolved_by") REFERENCES "profiles"("id") ON DELETE no action ON UPDATE no action;
