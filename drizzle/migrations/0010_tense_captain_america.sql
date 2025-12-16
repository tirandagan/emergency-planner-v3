CREATE TYPE "public"."system_log_category" AS ENUM('api_error', 'auth_error', 'database_error', 'external_service', 'payment_error', 'ai_error', 'validation_error', 'permission_error', 'system_error', 'user_action');--> statement-breakpoint
CREATE TYPE "public"."system_log_severity" AS ENUM('debug', 'info', 'warning', 'error', 'critical');--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"severity" "system_log_severity" DEFAULT 'error' NOT NULL,
	"category" "system_log_category" DEFAULT 'system_error' NOT NULL,
	"error_code" text,
	"error_name" text,
	"message" text NOT NULL,
	"user_id" uuid,
	"user_action" text,
	"component" text,
	"route" text,
	"stack_trace" text,
	"request_data" jsonb,
	"response_data" jsonb,
	"metadata" jsonb,
	"user_agent" text,
	"ip_address" text,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolution" text,
	"admin_notified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_resolved_by_profiles_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_system_logs_severity" ON "system_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_system_logs_category" ON "system_logs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_system_logs_user_id" ON "system_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_system_logs_created_at" ON "system_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_system_logs_unresolved" ON "system_logs" USING btree ("severity","resolved_at");--> statement-breakpoint
CREATE INDEX "idx_system_logs_error_code" ON "system_logs" USING btree ("error_code");--> statement-breakpoint
CREATE INDEX "idx_system_logs_component" ON "system_logs" USING btree ("component");