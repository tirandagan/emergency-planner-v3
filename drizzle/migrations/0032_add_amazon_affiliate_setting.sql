-- Migration: Add Amazon affiliate setting to system_settings
-- Generated: 2025-12-22
-- Purpose: Add amazon_associate_id system setting for affiliate link generation

-- Insert Amazon affiliate setting if it doesn't exist
INSERT INTO "system_settings" (
  "key",
  "value",
  "value_type",
  "description",
  "category",
  "is_editable",
  "environment"
)
VALUES (
  'amazon_associate_id',
  '',
  'string',
  'Amazon Associates affiliate tag used to generate affiliate product links',
  'integrations',
  true,
  'all'
)
ON CONFLICT ("key") DO NOTHING;
