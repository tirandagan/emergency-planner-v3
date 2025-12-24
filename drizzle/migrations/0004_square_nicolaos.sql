ALTER TABLE "specific_products" ADD COLUMN "package_size" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "specific_products" ADD COLUMN "required_quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_specific_products_quantities" ON "specific_products" USING btree ("package_size","required_quantity");