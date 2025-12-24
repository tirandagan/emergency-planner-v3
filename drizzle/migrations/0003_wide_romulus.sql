CREATE TABLE "llm_callback_views" (
	"callback_id" uuid NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "llm_callback_views_callback_id_admin_user_id_pk" PRIMARY KEY("callback_id","admin_user_id")
);
--> statement-breakpoint
ALTER TABLE "specific_products" DROP CONSTRAINT "specific_products_asin_unique";--> statement-breakpoint
DROP INDEX "idx_llm_callbacks_status";--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "affiliate_id" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "affiliate_url_template" text;--> statement-breakpoint
ALTER TABLE "specific_products" ADD COLUMN "sort_order" integer;--> statement-breakpoint
ALTER TABLE "llm_callbacks" ADD COLUMN "signature_valid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "llm_callbacks" ADD COLUMN "signature_header" text;--> statement-breakpoint
ALTER TABLE "llm_callbacks" ADD COLUMN "verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "llm_callbacks" ADD COLUMN "payload_preview" text;--> statement-breakpoint
ALTER TABLE "llm_callbacks" ADD COLUMN "external_job_id" text;--> statement-breakpoint
ALTER TABLE "llm_callbacks" ADD COLUMN "workflow_name" text;--> statement-breakpoint
ALTER TABLE "llm_callbacks" ADD COLUMN "event_type" text;--> statement-breakpoint
ALTER TABLE "llm_callback_views" ADD CONSTRAINT "llm_callback_views_callback_id_llm_callbacks_id_fk" FOREIGN KEY ("callback_id") REFERENCES "public"."llm_callbacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_llm_callback_views_admin_viewed" ON "llm_callback_views" USING btree ("admin_user_id","viewed_at");--> statement-breakpoint
CREATE INDEX "idx_suppliers_affiliate_id" ON "suppliers" USING btree ("affiliate_id");--> statement-breakpoint
CREATE INDEX "idx_specific_products_sort_order" ON "specific_products" USING btree ("master_item_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_llm_callbacks_external_job_id" ON "llm_callbacks" USING btree ("external_job_id");--> statement-breakpoint
CREATE INDEX "idx_llm_callbacks_workflow_name" ON "llm_callbacks" USING btree ("workflow_name");--> statement-breakpoint
ALTER TABLE "llm_callbacks" DROP COLUMN "webhook_signature";--> statement-breakpoint
ALTER TABLE "llm_callbacks" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "llm_callbacks" DROP COLUMN "error_message";--> statement-breakpoint
ALTER TABLE "llm_callbacks" DROP COLUMN "viewed_by";