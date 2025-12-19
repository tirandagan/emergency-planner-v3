-- Add change_history column to categories, master_items, and specific_products
-- Custom SQL migration file, put your code below! --

-- Add change_history column to categories
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "change_history" jsonb DEFAULT '[]'::jsonb;

-- Add change_history column to master_items
ALTER TABLE "master_items" ADD COLUMN IF NOT EXISTS "change_history" jsonb DEFAULT '[]'::jsonb;

-- Add change_history column to specific_products
ALTER TABLE "specific_products" ADD COLUMN IF NOT EXISTS "change_history" jsonb DEFAULT '[]'::jsonb;