-- Migration: Create external_api_cache table for API response caching
-- Purpose: Enable two-level caching (memory + database) for external API calls
-- Services: Google Places, WeatherAPI, future external services

CREATE TABLE external_api_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(50) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    cache_key VARCHAR(255) NOT NULL,
    request_params JSONB NOT NULL,
    response_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hit_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    CONSTRAINT unique_cache_entry UNIQUE(service_name, operation, cache_key)
);

-- Index for cache lookup (primary access pattern)
CREATE INDEX idx_cache_lookup ON external_api_cache(service_name, operation, cache_key, expires_at);

-- Index for cache expiration cleanup (background job)
CREATE INDEX idx_cache_expiration ON external_api_cache(expires_at);

-- Index for cache hit tracking and analytics
CREATE INDEX idx_cache_analytics ON external_api_cache(service_name, created_at);

-- Comments for documentation
COMMENT ON TABLE external_api_cache IS 'Long-term storage for external API responses with automatic expiration';
COMMENT ON COLUMN external_api_cache.service_name IS 'External service identifier (google_places, weatherapi)';
COMMENT ON COLUMN external_api_cache.operation IS 'API operation name (nearby_search, current, etc.)';
COMMENT ON COLUMN external_api_cache.cache_key IS 'SHA-256 hash of normalized request parameters';
COMMENT ON COLUMN external_api_cache.request_params IS 'Original request parameters for debugging';
COMMENT ON COLUMN external_api_cache.response_data IS 'Full API response JSON';
COMMENT ON COLUMN external_api_cache.expires_at IS 'Cache expiration timestamp (7-day default TTL)';
COMMENT ON COLUMN external_api_cache.hit_count IS 'Number of times this cache entry was accessed';
COMMENT ON COLUMN external_api_cache.last_accessed_at IS 'Most recent cache hit timestamp';
