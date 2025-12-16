-- Emergency Contacts Feature: Google Places Cache Table and User Enrichments
-- Migration 0026
-- Created: 2025-12-15

-- Create google_places_cache table for caching Google Places API results
CREATE TABLE IF NOT EXISTS "google_places_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"place_results" jsonb NOT NULL,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone DEFAULT (NOW() + INTERVAL '7 days') NOT NULL,
	"hit_count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "google_places_cache_cache_key_unique" UNIQUE("cache_key")
);

-- Create indexes for google_places_cache
CREATE INDEX IF NOT EXISTS "idx_places_cache_key" ON "google_places_cache" ("cache_key");
CREATE INDEX IF NOT EXISTS "idx_places_cache_expires" ON "google_places_cache" ("expires_at");

-- Add user_enrichments column to mission_reports
ALTER TABLE "mission_reports" ADD COLUMN IF NOT EXISTS "user_enrichments" jsonb DEFAULT '{"familyMembers": [], "notes": []}'::jsonb;

-- Create GIN index for user_enrichments JSONB queries
CREATE INDEX IF NOT EXISTS "idx_mission_reports_user_enrichments" ON "mission_reports" USING gin ("user_enrichments");

-- Automatic cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_places_cache()
RETURNS trigger AS $$
BEGIN
  DELETE FROM google_places_cache WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run cleanup after each insert
DROP TRIGGER IF EXISTS trigger_cleanup_expired_places ON google_places_cache;
CREATE TRIGGER trigger_cleanup_expired_places
AFTER INSERT ON google_places_cache
EXECUTE FUNCTION cleanup_expired_places_cache();

-- Size limiting function (keep only 10,000 most recent entries)
CREATE OR REPLACE FUNCTION limit_places_cache_size()
RETURNS trigger AS $$
BEGIN
  DELETE FROM google_places_cache
  WHERE id NOT IN (
    SELECT id FROM google_places_cache
    ORDER BY cached_at DESC
    LIMIT 10000
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce size limit after each insert
DROP TRIGGER IF EXISTS trigger_limit_places_cache ON google_places_cache;
CREATE TRIGGER trigger_limit_places_cache
AFTER INSERT ON google_places_cache
EXECUTE FUNCTION limit_places_cache_size();
