-- Down Migration for 0028_add_consulting_services.sql
-- This migration safely rolls back the consulting services feature
--
-- ⚠️  WARNING: This migration will drop tables and columns
-- ⚠️  Data in consulting_services and consulting_bookings tables will be permanently lost
-- ⚠️  Order items with consulting bookings will have consulting_booking_id set to NULL

-- Remove check constraint from order_items
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_type_check";

-- Drop indexes for order_items (consulting-related)
DROP INDEX IF EXISTS "idx_order_items_item_type";
DROP INDEX IF EXISTS "idx_order_items_consulting_booking_id";

-- Drop indexes for orders
DROP INDEX IF EXISTS "idx_orders_order_type";

-- Drop indexes for consulting_bookings
DROP INDEX IF EXISTS "idx_consulting_bookings_order_id";
DROP INDEX IF EXISTS "idx_consulting_bookings_status";
DROP INDEX IF EXISTS "idx_consulting_bookings_service_id";
DROP INDEX IF EXISTS "idx_consulting_bookings_user_id";

-- Drop indexes for consulting_services
DROP INDEX IF EXISTS "idx_consulting_services_target_scenarios";
DROP INDEX IF EXISTS "idx_consulting_services_is_active";
DROP INDEX IF EXISTS "idx_consulting_services_is_generic";
DROP INDEX IF EXISTS "idx_consulting_services_bundle_id";

-- Drop foreign key constraints
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_consulting_booking_id_consulting_bookings_id_fk";
ALTER TABLE "consulting_bookings" DROP CONSTRAINT IF EXISTS "consulting_bookings_order_id_orders_id_fk";
ALTER TABLE "consulting_bookings" DROP CONSTRAINT IF EXISTS "consulting_bookings_consulting_service_id_consulting_services_id_fk";
ALTER TABLE "consulting_bookings" DROP CONSTRAINT IF EXISTS "consulting_bookings_user_id_profiles_id_fk";
ALTER TABLE "consulting_services" DROP CONSTRAINT IF EXISTS "consulting_services_bundle_id_bundles_id_fk";

-- Remove columns from order_items table
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "item_type";
ALTER TABLE "order_items" DROP COLUMN IF EXISTS "consulting_booking_id";

-- Restore NOT NULL constraint on specific_product_id (only if no NULL values exist)
-- Note: This will fail if there are NULL values - manual cleanup required first
ALTER TABLE "order_items" ALTER COLUMN "specific_product_id" SET NOT NULL;

-- Remove column from orders table
ALTER TABLE "orders" DROP COLUMN IF EXISTS "order_type";

-- Drop consulting_bookings table
DROP TABLE IF EXISTS "consulting_bookings";

-- Drop consulting_services table
DROP TABLE IF EXISTS "consulting_services";
