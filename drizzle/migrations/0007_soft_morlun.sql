CREATE TYPE "public"."import_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'partial');--> statement-breakpoint
CREATE TABLE "import_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"target_table" text NOT NULL,
	"status" "import_status" DEFAULT 'pending' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"errors" jsonb,
	"mapping" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_history" ADD CONSTRAINT "import_history_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_import_history_user_id" ON "import_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_import_history_status" ON "import_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_import_history_created_at" ON "import_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_import_history_target_table" ON "import_history" USING btree ("target_table");