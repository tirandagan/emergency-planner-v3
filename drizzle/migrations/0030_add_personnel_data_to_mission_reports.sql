-- Add personnel_data column to mission_reports table
-- This stores the family member information entered during wizard Step 2
ALTER TABLE "mission_reports" ADD COLUMN "personnel_data" jsonb;
