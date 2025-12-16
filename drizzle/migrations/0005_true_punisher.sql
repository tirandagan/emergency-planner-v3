ALTER TABLE "categories" ADD COLUMN "icon" text DEFAULT '🗂️';--> statement-breakpoint
CREATE INDEX "idx_categories_icon" ON "categories" USING btree ("icon");