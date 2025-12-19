-- Add llm_service_url setting to system_settings table
-- This allows the LLM service URL to be configured from the admin debug tools
INSERT INTO "system_settings" ("key", "value", "value_type", "description", "category", "is_editable")
VALUES (
  'llm_service_url',
  'https://llm-service-api.onrender.com',
  'string',
  'Base URL for LLM Workflow Microservice API endpoints',
  'integrations',
  true
)
ON CONFLICT (key) DO NOTHING;
