CREATE TABLE "external_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"specific_product_id" uuid NOT NULL,
	"clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"bundle_id" uuid,
	"is_original_product" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"activity_type" text NOT NULL,
	"metadata" jsonb,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_type" text NOT NULL,
	"stripe_invoice_id" text,
	"stripe_payment_intent_id" text,
	"stripe_subscription_id" text,
	"stripe_charge_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"description" text,
	"invoice_pdf_url" text,
	"metadata" jsonb,
	"transaction_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundle_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" uuid NOT NULL,
	"specific_product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_optional" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundle_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" uuid NOT NULL,
	"specific_product_id" uuid NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"image_url" text,
	"total_estimated_price" numeric(10, 2),
	"scenarios" text[] NOT NULL,
	"min_people" integer DEFAULT 1,
	"max_people" integer,
	"gender" text,
	"age_groups" text[],
	"climates" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bundles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "call_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"call_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attended" text,
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"duration_minutes" integer,
	"rating" integer,
	"feedback_text" text,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idx_call_attendance_unique" UNIQUE("call_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "expert_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"call_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_date" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"tier_required" text DEFAULT 'FREE' NOT NULL,
	"max_attendees" integer,
	"expert_name" text,
	"expert_bio" text,
	"expert_photo_url" text,
	"expert_specialty" text,
	"zoom_link" text,
	"zoom_meeting_id" text,
	"zoom_password" text,
	"recording_url" text,
	"recording_available_date" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"specific_product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"supplier_status" text DEFAULT 'pending',
	"bundle_id" uuid,
	"is_original_product" boolean DEFAULT true,
	"original_specific_product_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"subtotal_amount" numeric(10, 2) NOT NULL,
	"shipping_cost" numeric(10, 2) DEFAULT '0',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"shipping_address" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipment_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"carrier" text,
	"tracking_number" text,
	"tracking_url" text,
	"shipped_at" timestamp with time zone,
	"estimated_delivery" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"preview_text" text,
	"body_template" text NOT NULL,
	"ai_prompt" text,
	"target_segment" text,
	"segment_filter" jsonb,
	"scheduled_date" timestamp with time zone,
	"status" text DEFAULT 'draft' NOT NULL,
	"recipients_count" integer DEFAULT 0,
	"delivered_count" integer DEFAULT 0,
	"opened_count" integer DEFAULT 0,
	"clicked_count" integer DEFAULT 0,
	"bounced_count" integer DEFAULT 0,
	"unsubscribed_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_info" jsonb,
	"fulfillment_type" text DEFAULT 'dropship' NOT NULL,
	"website_url" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"embedding" vector(768),
	"status" text DEFAULT 'active' NOT NULL,
	"timeframes" text[],
	"demographics" text[],
	"locations" text[],
	"scenarios" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scraped_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asin" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scraped_queue_asin_unique" UNIQUE("asin")
);
--> statement-breakpoint
CREATE TABLE "specific_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"master_item_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2),
	"sku" text,
	"asin" text,
	"image_url" text,
	"product_url" text,
	"type" text DEFAULT 'product' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"variations" jsonb,
	"timeframes" text[],
	"demographics" text[],
	"locations" text[],
	"scenarios" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "specific_products_asin_unique" UNIQUE("asin")
);
--> statement-breakpoint
CREATE TABLE "mission_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"location" text,
	"scenarios" text[] NOT NULL,
	"family_size" integer DEFAULT 1 NOT NULL,
	"duration_days" integer DEFAULT 3 NOT NULL,
	"mobility_type" text DEFAULT 'on_foot',
	"budget_amount" numeric(10, 2),
	"report_data" jsonb NOT NULL,
	"readiness_score" integer,
	"scenario_scores" jsonb,
	"component_scores" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"master_item_id" uuid,
	"specific_product_id" uuid,
	"quantity_owned" integer DEFAULT 0 NOT NULL,
	"quantity_needed" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'needed' NOT NULL,
	"purchase_date" date,
	"purchase_price" numeric(10, 2),
	"purchase_url" text,
	"expiration_date" date,
	"mission_report_id" uuid,
	"bundle_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_name" text NOT NULL,
	"category" text NOT NULL,
	"resource_type" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"author" text,
	"source" text,
	"duration_minutes" integer,
	"difficulty" text,
	"summary" text,
	"key_techniques" jsonb,
	"prerequisites" text[],
	"related_skills" text[],
	"scenarios" text[],
	"rating" integer,
	"view_count" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skill_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_resource_id" uuid NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"progress_percentage" integer DEFAULT 0,
	"notes" text,
	"last_accessed" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idx_user_skill_progress_unique" UNIQUE("user_id","skill_resource_id")
);
--> statement-breakpoint
CREATE TABLE "plan_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mission_report_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"shared_with_email" text NOT NULL,
	"permissions" text DEFAULT 'view' NOT NULL,
	"share_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idx_plan_shares_unique" UNIQUE("mission_report_id","shared_with_email")
);
--> statement-breakpoint
ALTER TABLE "external_transactions" ADD CONSTRAINT "external_transactions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_transactions" ADD CONSTRAINT "external_transactions_specific_product_id_specific_products_id_fk" FOREIGN KEY ("specific_product_id") REFERENCES "public"."specific_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_transactions" ADD CONSTRAINT "external_transactions_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_specific_product_id_specific_products_id_fk" FOREIGN KEY ("specific_product_id") REFERENCES "public"."specific_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_recommendations" ADD CONSTRAINT "bundle_recommendations_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundle_recommendations" ADD CONSTRAINT "bundle_recommendations_specific_product_id_specific_products_id_fk" FOREIGN KEY ("specific_product_id") REFERENCES "public"."specific_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_attendance" ADD CONSTRAINT "call_attendance_call_id_expert_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."expert_calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_attendance" ADD CONSTRAINT "call_attendance_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_specific_product_id_specific_products_id_fk" FOREIGN KEY ("specific_product_id") REFERENCES "public"."specific_products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_original_specific_product_id_specific_products_id_fk" FOREIGN KEY ("original_specific_product_id") REFERENCES "public"."specific_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipment_items" ADD CONSTRAINT "shipment_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_items" ADD CONSTRAINT "master_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specific_products" ADD CONSTRAINT "specific_products_master_item_id_master_items_id_fk" FOREIGN KEY ("master_item_id") REFERENCES "public"."master_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specific_products" ADD CONSTRAINT "specific_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_reports" ADD CONSTRAINT "mission_reports_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_master_item_id_master_items_id_fk" FOREIGN KEY ("master_item_id") REFERENCES "public"."master_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_specific_product_id_specific_products_id_fk" FOREIGN KEY ("specific_product_id") REFERENCES "public"."specific_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_mission_report_id_mission_reports_id_fk" FOREIGN KEY ("mission_report_id") REFERENCES "public"."mission_reports"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."bundles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_progress" ADD CONSTRAINT "user_skill_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_progress" ADD CONSTRAINT "user_skill_progress_skill_resource_id_skills_resources_id_fk" FOREIGN KEY ("skill_resource_id") REFERENCES "public"."skills_resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_mission_report_id_mission_reports_id_fk" FOREIGN KEY ("mission_report_id") REFERENCES "public"."mission_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_shares" ADD CONSTRAINT "plan_shares_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_external_transactions_user_id" ON "external_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_bundle_id" ON "external_transactions" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_clicked_at" ON "external_transactions" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "idx_external_transactions_user_clicked_at" ON "external_transactions" USING btree ("user_id","clicked_at");--> statement-breakpoint
CREATE INDEX "idx_user_activity_log_user_id" ON "user_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_activity_log_activity_type" ON "user_activity_log" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_user_activity_log_created_at" ON "user_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_user_activity_log_metadata" ON "user_activity_log" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "idx_billing_transactions_user_id" ON "billing_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_billing_transactions_transaction_type" ON "billing_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "idx_billing_transactions_transaction_date" ON "billing_transactions" USING btree ("transaction_date");--> statement-breakpoint
CREATE INDEX "idx_billing_transactions_stripe_invoice_id" ON "billing_transactions" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "idx_bundle_items_bundle_id" ON "bundle_items" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "idx_bundle_items_specific_product_id" ON "bundle_items" USING btree ("specific_product_id");--> statement-breakpoint
CREATE INDEX "idx_bundle_recommendations_bundle_id" ON "bundle_recommendations" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "idx_bundles_slug" ON "bundles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_bundles_scenarios" ON "bundles" USING gin ("scenarios");--> statement-breakpoint
CREATE INDEX "idx_call_attendance_call_id" ON "call_attendance" USING btree ("call_id");--> statement-breakpoint
CREATE INDEX "idx_call_attendance_user_id" ON "call_attendance" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_call_attendance_attended" ON "call_attendance" USING btree ("attended");--> statement-breakpoint
CREATE INDEX "idx_expert_calls_scheduled_date" ON "expert_calls" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_expert_calls_call_type" ON "expert_calls" USING btree ("call_type");--> statement-breakpoint
CREATE INDEX "idx_expert_calls_status" ON "expert_calls" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_categories_parent_id" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_categories_slug" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_bundle_id" ON "order_items" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_is_original_product" ON "order_items" USING btree ("is_original_product");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_shipments_order_id" ON "shipments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_email_campaigns_status" ON "email_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_email_campaigns_scheduled_date" ON "email_campaigns" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_email_campaigns_created_at" ON "email_campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_master_items_category_id" ON "master_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_master_items_status" ON "master_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_master_items_embedding" ON "master_items" USING ivfflat ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_master_items_scenarios" ON "master_items" USING gin ("scenarios");--> statement-breakpoint
CREATE INDEX "idx_scraped_queue_status" ON "scraped_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_scraped_queue_priority" ON "scraped_queue" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_specific_products_master_item_id" ON "specific_products" USING btree ("master_item_id");--> statement-breakpoint
CREATE INDEX "idx_specific_products_supplier_id" ON "specific_products" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_specific_products_asin" ON "specific_products" USING btree ("asin");--> statement-breakpoint
CREATE INDEX "idx_specific_products_status" ON "specific_products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_specific_products_metadata" ON "specific_products" USING gin ("metadata");--> statement-breakpoint
CREATE INDEX "idx_specific_products_scenarios" ON "specific_products" USING gin ("scenarios");--> statement-breakpoint
CREATE INDEX "idx_mission_reports_user_id" ON "mission_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_mission_reports_scenarios" ON "mission_reports" USING gin ("scenarios");--> statement-breakpoint
CREATE INDEX "idx_mission_reports_deleted_at" ON "mission_reports" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_user_id" ON "inventory_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_user_status" ON "inventory_items" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_user_expiration" ON "inventory_items" USING btree ("user_id","expiration_date");--> statement-breakpoint
CREATE INDEX "idx_inventory_items_mission_report_id" ON "inventory_items" USING btree ("mission_report_id");--> statement-breakpoint
CREATE INDEX "idx_skills_resources_skill_name" ON "skills_resources" USING btree ("skill_name");--> statement-breakpoint
CREATE INDEX "idx_skills_resources_category" ON "skills_resources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_skills_resources_scenarios" ON "skills_resources" USING gin ("scenarios");--> statement-breakpoint
CREATE INDEX "idx_skills_resources_is_verified" ON "skills_resources" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "idx_user_skill_progress_user_id" ON "user_skill_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_plan_shares_mission_report_id" ON "plan_shares" USING btree ("mission_report_id");--> statement-breakpoint
CREATE INDEX "idx_plan_shares_user_id" ON "plan_shares" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_plan_shares_share_token" ON "plan_shares" USING btree ("share_token");