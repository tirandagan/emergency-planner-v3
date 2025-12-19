-- Add admin_email system setting
-- Custom SQL migration file, put your code below! --

-- Insert admin_email system setting if it doesn't exist
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
  'admin_email',
  'admin@beprepared.ai',
  'string',
  'Email address for system error notifications and admin alerts',
  'notifications',
  true,
  'all'
)
ON CONFLICT ("key") DO NOTHING;
