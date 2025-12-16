-- Create plan_versions table
CREATE TABLE IF NOT EXISTS "plan_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mission_report_id" uuid NOT NULL,
	"parent_version_id" uuid,
	"version_number" integer NOT NULL,
	"title" text NOT NULL,
	"location" text,
	"scenarios" text[] NOT NULL,
	"family_size" integer NOT NULL,
	"duration_days" integer NOT NULL,
	"mobility_type" text,
	"budget_amount" numeric(10, 2),
	"report_data" jsonb NOT NULL,
	"evacuation_routes" jsonb,
	"readiness_score" integer,
	"scenario_scores" jsonb,
	"component_scores" jsonb,
	"changes_summary" text,
	"changed_fields" text[],
	"edited_by_user_id" uuid NOT NULL,
	"edit_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_plan_versions_mission_report" ON "plan_versions" ("mission_report_id");
CREATE INDEX IF NOT EXISTS "idx_plan_versions_version_number" ON "plan_versions" ("mission_report_id", "version_number");
CREATE INDEX IF NOT EXISTS "idx_plan_versions_edited_by" ON "plan_versions" ("edited_by_user_id");
CREATE INDEX IF NOT EXISTS "idx_plan_versions_created_at" ON "plan_versions" ("created_at");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_plan_versions_unique" ON "plan_versions" ("mission_report_id", "version_number");

-- Add foreign keys
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_mission_report_id_mission_reports_id_fk"
  FOREIGN KEY ("mission_report_id") REFERENCES "mission_reports"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_parent_version_id_plan_versions_id_fk"
  FOREIGN KEY ("parent_version_id") REFERENCES "plan_versions"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_edited_by_user_id_profiles_id_fk"
  FOREIGN KEY ("edited_by_user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
