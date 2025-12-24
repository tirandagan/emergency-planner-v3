-- Add personnel_data column to mission_reports table
-- This stores the family member information entered during wizard Step 2
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mission_reports' AND column_name = 'personnel_data') THEN
    ALTER TABLE "mission_reports" ADD COLUMN "personnel_data" jsonb;
  END IF;
END $$;
