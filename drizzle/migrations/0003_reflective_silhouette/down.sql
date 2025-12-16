-- Down migration for 0003_reflective_silhouette
-- WARNING: This will remove token tracking fields and manual_verification_requests table
-- Run this migration to rollback changes if needed

-- Drop indexes first
DROP INDEX IF EXISTS idx_profiles_total_tokens;
DROP INDEX IF EXISTS idx_profiles_last_login;

-- Drop columns from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS last_login_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_token_update;
ALTER TABLE profiles DROP COLUMN IF EXISTS total_tokens_used;

-- Drop manual_verification_requests table (if rolling back entire migration)
DROP TABLE IF EXISTS manual_verification_requests;
