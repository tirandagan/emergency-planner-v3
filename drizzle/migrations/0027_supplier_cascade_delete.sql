-- Modify supplier foreign key constraint to cascade deletes
-- This allows automatic deletion of specific_products when a supplier is deleted

-- Drop the existing foreign key constraint
ALTER TABLE "specific_products" DROP CONSTRAINT IF EXISTS "specific_products_supplier_id_suppliers_id_fk";

-- Add the new foreign key constraint with cascade delete
ALTER TABLE "specific_products"
ADD CONSTRAINT "specific_products_supplier_id_suppliers_id_fk"
FOREIGN KEY ("supplier_id")
REFERENCES "suppliers"("id")
ON DELETE CASCADE;
