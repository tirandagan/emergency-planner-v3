-- Remove unique constraint from ASIN field in specific_products table
-- ASINs can be duplicated for products with different quantities/pack sizes

ALTER TABLE "specific_products" DROP CONSTRAINT IF EXISTS "specific_products_asin_unique";
