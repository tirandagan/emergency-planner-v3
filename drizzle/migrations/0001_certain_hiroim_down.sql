-- Down migration for 0001_certain_hiroim
-- This script safely rolls back the complete schema creation
-- ⚠️  WARNING: This will DROP all tables created by this migration!
-- ⚠️  WARNING: All data in these tables will be PERMANENTLY DELETED!

-- Drop all tables in reverse dependency order

-- Drop plan shares (depends on mission_reports, profiles)
DROP TABLE IF EXISTS "plan_shares" CASCADE;

-- Drop user skill progress (depends on skills_resources, profiles)
DROP TABLE IF EXISTS "user_skill_progress" CASCADE;

-- Drop skills resources
DROP TABLE IF EXISTS "skills_resources" CASCADE;

-- Drop inventory items (depends on profiles, master_items, specific_products, mission_reports, bundles)
DROP TABLE IF EXISTS "inventory_items" CASCADE;

-- Drop mission reports (depends on profiles)
DROP TABLE IF EXISTS "mission_reports" CASCADE;

-- Drop specific products (depends on master_items, suppliers)
DROP TABLE IF EXISTS "specific_products" CASCADE;

-- Drop scraped queue
DROP TABLE IF EXISTS "scraped_queue" CASCADE;

-- Drop master items (depends on categories)
DROP TABLE IF EXISTS "master_items" CASCADE;

-- Drop suppliers
DROP TABLE IF EXISTS "suppliers" CASCADE;

-- Drop email campaigns
DROP TABLE IF EXISTS "email_campaigns" CASCADE;

-- Drop shipment items (depends on shipments, order_items)
DROP TABLE IF EXISTS "shipment_items" CASCADE;

-- Drop shipments (depends on orders)
DROP TABLE IF EXISTS "shipments" CASCADE;

-- Drop order items (depends on orders, specific_products, bundles)
DROP TABLE IF EXISTS "order_items" CASCADE;

-- Drop orders (depends on profiles)
DROP TABLE IF EXISTS "orders" CASCADE;

-- Drop categories (self-referencing)
DROP TABLE IF EXISTS "categories" CASCADE;

-- Drop call attendance (depends on expert_calls, profiles)
DROP TABLE IF EXISTS "call_attendance" CASCADE;

-- Drop expert calls
DROP TABLE IF EXISTS "expert_calls" CASCADE;

-- Drop bundle recommendations (depends on bundles, specific_products)
DROP TABLE IF EXISTS "bundle_recommendations" CASCADE;

-- Drop bundle items (depends on bundles, specific_products)
DROP TABLE IF EXISTS "bundle_items" CASCADE;

-- Drop bundles
DROP TABLE IF EXISTS "bundles" CASCADE;

-- Drop billing transactions (depends on profiles)
DROP TABLE IF EXISTS "billing_transactions" CASCADE;

-- Drop user activity log (depends on profiles)
DROP TABLE IF EXISTS "user_activity_log" CASCADE;

-- Drop external transactions (depends on profiles, specific_products, bundles)
DROP TABLE IF EXISTS "external_transactions" CASCADE;

-- Drop the vector extension if it was created by this migration
-- Note: Only drop if you're certain no other tables use the vector extension
-- DROP EXTENSION IF EXISTS vector CASCADE;

-- Note: The profiles table is NOT dropped as it existed before this migration

-- Verification query to check if all tables were dropped
-- Run this after executing the down migration to verify:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN (
--   'plan_shares', 'user_skill_progress', 'skills_resources', 'inventory_items',
--   'mission_reports', 'specific_products', 'scraped_queue', 'master_items',
--   'suppliers', 'email_campaigns', 'shipment_items', 'shipments', 'order_items',
--   'orders', 'categories', 'call_attendance', 'expert_calls', 'bundle_recommendations',
--   'bundle_items', 'bundles', 'billing_transactions', 'user_activity_log', 
--   'external_transactions'
-- );

