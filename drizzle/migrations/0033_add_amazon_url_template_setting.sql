-- Migration: Add Amazon affiliate URL template setting to system_settings
-- Generated: 2025-12-22
-- Purpose: Add amazon_affiliate_url_template system setting for affiliate link URL construction

-- Insert Amazon affiliate URL template setting if it doesn't exist
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
  'amazon_affiliate_url_template',
  'https://www.amazon.com/dp/{ASIN}?&linkCode=ll1&tag={amazon_associate_id}&ref_=as_li_ss_tl',
  'string',
  'URL template for Amazon affiliate links. Use {ASIN} and {amazon_associate_id} as placeholders for automatic substitution',
  'integrations',
  true,
  'all'
)
ON CONFLICT ("key") DO NOTHING;
