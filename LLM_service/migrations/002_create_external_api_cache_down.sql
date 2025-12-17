-- Down migration: Drop external_api_cache table
-- Rollback script for 002_create_external_api_cache.sql

DROP TABLE IF EXISTS external_api_cache CASCADE;
