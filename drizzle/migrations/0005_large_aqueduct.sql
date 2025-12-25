ALTER TABLE "mission_reports" ADD COLUMN "job_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_mission_reports_job_id" ON "mission_reports" USING btree ("job_id");