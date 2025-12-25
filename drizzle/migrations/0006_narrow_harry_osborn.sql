ALTER TABLE "mission_reports" ADD COLUMN "status" varchar(50);--> statement-breakpoint
CREATE INDEX "idx_mission_reports_status" ON "mission_reports" USING btree ("status");