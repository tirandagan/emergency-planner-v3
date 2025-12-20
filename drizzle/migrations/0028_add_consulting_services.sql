-- Create consulting_services table
CREATE TABLE IF NOT EXISTS "consulting_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"generic_description" text NOT NULL,
	"qualifying_questions" jsonb NOT NULL,
	"is_generic" boolean DEFAULT true NOT NULL,
	"target_scenarios" text[],
	"bundle_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Create consulting_bookings table
CREATE TABLE IF NOT EXISTS "consulting_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consulting_service_id" uuid NOT NULL,
	"intake_responses" jsonb NOT NULL,
	"generated_agenda" text,
	"agenda_generated_at" timestamp with time zone,
	"estimated_duration_minutes" integer,
	"hourly_rate_at_booking" numeric(10, 2) NOT NULL,
	"total_estimated_cost" numeric(10, 2),
	"status" text DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"calendly_event_id" text,
	"order_id" uuid,
	"admin_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Add new columns to orders table
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_type" text DEFAULT 'product' NOT NULL;

-- Modify order_items table to support consulting bookings
ALTER TABLE "order_items" ALTER COLUMN "specific_product_id" DROP NOT NULL;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "consulting_booking_id" uuid;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "item_type" text DEFAULT 'product' NOT NULL;

-- Add foreign key constraints
DO $$ BEGIN
 ALTER TABLE "consulting_services" ADD CONSTRAINT "consulting_services_bundle_id_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "bundles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "consulting_bookings" ADD CONSTRAINT "consulting_bookings_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "consulting_bookings" ADD CONSTRAINT "consulting_bookings_consulting_service_id_consulting_services_id_fk" FOREIGN KEY ("consulting_service_id") REFERENCES "consulting_services"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "consulting_bookings" ADD CONSTRAINT "consulting_bookings_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "order_items" ADD CONSTRAINT "order_items_consulting_booking_id_consulting_bookings_id_fk" FOREIGN KEY ("consulting_booking_id") REFERENCES "consulting_bookings"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create indexes for consulting_services
CREATE INDEX IF NOT EXISTS "idx_consulting_services_bundle_id" ON "consulting_services" ("bundle_id");
CREATE INDEX IF NOT EXISTS "idx_consulting_services_is_generic" ON "consulting_services" ("is_generic");
CREATE INDEX IF NOT EXISTS "idx_consulting_services_is_active" ON "consulting_services" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_consulting_services_target_scenarios" ON "consulting_services" USING gin ("target_scenarios");

-- Create indexes for consulting_bookings
CREATE INDEX IF NOT EXISTS "idx_consulting_bookings_user_id" ON "consulting_bookings" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_consulting_bookings_service_id" ON "consulting_bookings" ("consulting_service_id");
CREATE INDEX IF NOT EXISTS "idx_consulting_bookings_status" ON "consulting_bookings" ("status");
CREATE INDEX IF NOT EXISTS "idx_consulting_bookings_order_id" ON "consulting_bookings" ("order_id");

-- Create indexes for orders
CREATE INDEX IF NOT EXISTS "idx_orders_order_type" ON "orders" ("order_type");

-- Create indexes for order_items
CREATE INDEX IF NOT EXISTS "idx_order_items_consulting_booking_id" ON "order_items" ("consulting_booking_id");
CREATE INDEX IF NOT EXISTS "idx_order_items_item_type" ON "order_items" ("item_type");

-- Add check constraint to ensure order_items has either product OR consulting (not both, not neither)
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_type_check";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_type_check" CHECK (
  (item_type = 'product' AND specific_product_id IS NOT NULL AND consulting_booking_id IS NULL) OR
  (item_type = 'consulting' AND consulting_booking_id IS NOT NULL AND specific_product_id IS NULL)
);
