# Google Places 7-Day Cache Flow - Detailed Analysis

## Flow Summary

The Google Places caching system implements a **two-level cache** (memory + database) with **exact parameter matching** using SHA-256 hashed cache keys. This is **NOT a semantic cache** - it uses cryptographic hashing to ensure identical requests get identical cache keys, but provides no intelligence for similar (but not identical) requests.

**Key Insight**: The cache is optimized for **exact duplicate elimination**, not semantic similarity. Two requests for hospitals in nearly identical locations will each hit the Google API separately unless the parameters are byte-for-byte identical.

## Step-by-Step Walkthrough

### 1. Request Initiation
**Trigger**: Application calls `GooglePlacesService.call(operation, params)`

**Example Request**:
```python
await google_places.call(
    operation="nearby_search",
    params={
        "location": "40.7128,-74.0060",  # NYC City Hall
        "radius": 5000,                   # 5km radius
        "type": "hospital"
    }
)
```

### 2. Cache Key Generation
**Algorithm**: `cache_manager.generate_cache_key(service_name, operation, params)`

**Process** (`cache_manager.py:48-80`):
1. Normalize parameters: `json.dumps(params, sort_keys=True, separators=(',', ':'))`
   - **Critical**: Keys are sorted alphabetically to ensure consistency
   - Example: `{"radius":5000,"location":"40.7,-74.0","type":"hospital"}`

2. Create composite string: `service_name|operation|normalized_params`
   - Example: `google_places|nearby_search|{"location":"40.7,-74.0","radius":5000,"type":"hospital"}`

3. Generate SHA-256 hash: `hashlib.sha256(composite.encode('utf-8')).hexdigest()`
   - Returns first 64 characters (full SHA-256 digest)
   - Example: `a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456`

**Why This Matters**:
- ✅ `{"radius": 5000, "location": "40.7,-74.0"}` = `{"location": "40.7,-74.0", "radius": 5000}` (same key)
- ❌ `{"location": "40.7,-74.0"}` ≠ `{"location": "40.7128,-74.0060"}` (different keys)
- ❌ `"New York"` ≠ `"New York City"` (different keys)
- ❌ Nearby coordinates (40.7128 vs 40.7129) = completely different cache entries

### 3. Memory Cache Lookup (Level 1)
**Location**: `cache_manager.py:200-219`

**Process**:
```python
def _get_from_memory(self, cache_key: str) -> Optional[Dict[str, Any]]:
    with self._cache_lock:  # Thread-safe access
        if cache_key in self._memory_cache:
            # Move to end (most recently used)
            self._memory_cache.move_to_end(cache_key)
            return self._memory_cache[cache_key]
    return None
```

**Cache Hit**: Returns cached data immediately (~0.1ms latency)

**Cache Miss**: Proceeds to Level 2 (Database)

**LRU Eviction**:
- Cache capacity: 500 entries
- When full, evicts **least recently used** entry
- Accessing an entry moves it to "most recently used" position

### 4. Database Cache Lookup (Level 2)
**Location**: `cache_manager.py:111-146`

**SQL Query**:
```sql
SELECT * FROM external_api_cache
WHERE service_name = 'google_places'
  AND operation = 'nearby_search'
  AND cache_key = 'a1b2c3d4...'
  AND expires_at > NOW()  -- Critical: Only non-expired entries
```

**Index Used**: `idx_cache_lookup(service_name, operation, cache_key, expires_at)`

**Cache Hit Behavior**:
1. Increments `hit_count` by 1
2. Updates `last_accessed_at` to current timestamp
3. Populates memory cache for future fast access
4. Returns cached `response_data` JSON

**Cache Miss**: Proceeds to Rate Limit Check

**Typical Latency**:
- Cache hit: ~5-15ms (PostgreSQL query + network)
- Cache miss: ~100-500ms (Google API call)

### 5. Rate Limit Enforcement
**Location**: `google_places.py:128-139`

**Limits**:
- **Per-User**: 10 requests/hour (if `user_id` provided)
- **Global**: 100 requests/hour (service-wide)

**Implementation**: Token bucket algorithm via `rate_limiter.check_rate_limit()`

**Rate Limit Exceeded**:
```python
return ExternalServiceResponse(
    success=False,
    error="Rate limit exceeded",
    metadata={'retry_after': 3600}  # Seconds until reset
)
```

**Rate Limit OK**: Proceeds to Google API call

### 6. Google Places API Request
**Location**: `google_places.py:142-193`

**Request Flow**:
1. Route to operation handler (`_nearby_search`, `_text_search`, `_place_details`)
2. Build HTTP request with API key
3. Execute via `httpx.AsyncClient`
4. Parse JSON response

**Example HTTP Request**:
```http
GET https://maps.googleapis.com/maps/api/place/nearbysearch/json?
    location=40.7128,-74.0060&
    radius=5000&
    type=hospital&
    key=YOUR_API_KEY
```

**Error Handling**:
- `401/403` → `ExternalServiceAuthError` (API key invalid)
- `429` → `ExternalServiceQuotaError` (Google quota exceeded)
- `500+` → `ExternalServiceError` (Server error)
- `REQUEST_DENIED` → `ExternalServiceAuthError`
- `OVER_QUERY_LIMIT` → `ExternalServiceQuotaError`

### 7. Cache Storage (On Success)
**Location**: `cache_manager.py:148-198`

**Process**:
1. **Memory Cache**: Store in LRU cache (evict oldest if full)
2. **Database Cache**: Upsert into PostgreSQL

**Database Upsert** (`ON CONFLICT` strategy):
```sql
INSERT INTO external_api_cache (
    service_name, operation, cache_key,
    request_params, response_data,
    expires_at, created_at, hit_count
) VALUES (...)
ON CONFLICT (service_name, operation, cache_key)
DO UPDATE SET
    request_params = EXCLUDED.request_params,
    response_data = EXCLUDED.response_data,
    expires_at = EXCLUDED.expires_at,
    created_at = NOW()
```

**TTL Calculation**:
```python
ttl_seconds = cache_ttl or 604800  # Default: 7 days
expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
```

### 8. Response Return
**Success Response**:
```python
return ExternalServiceResponse(
    success=True,
    data=result,            # Google Places API response
    cached=False,           # Fresh from API
    metadata={}
)
```

**Cached Response**:
```python
return ExternalServiceResponse(
    success=True,
    data=cached_response,
    cached=True,            # From cache (memory or database)
    metadata={}
)
```

## Decision Logic

### When Cache is Used
1. **Memory cache hit** → Return immediately (fastest path)
2. **Database cache hit** (not expired) → Return from DB, populate memory cache
3. **Cache miss** → Make API call, store in both caches

### When Cache is Bypassed
1. `enable_cache=False` in service initialization
2. Expired entries (older than 7 days)
3. Different parameters (even minor variations)

### Rate Limit Decision Points
1. **Before API call**: Check if request would exceed limits
2. **After successful API call**: Record request for rate limiting
3. **Cache hits**: Do NOT count toward rate limits (key benefit!)

## Error Handling

### Cache Errors
- **Memory cache failure**: Degrades to database-only cache
- **Database failure**: Degrades to API-only mode (no caching)
- **Thread contention**: Lock-protected, blocks until available

### API Errors
- **Timeout** (30s default): Returns timeout error response
- **Auth errors**: Returns auth error (no retry)
- **Quota errors**: Returns quota error with retry_after metadata
- **Server errors**: Returns server error (can retry later)

### Expiration Handling
- **Automatic**: Expired entries excluded from queries (`WHERE expires_at > NOW()`)
- **Manual cleanup**: Background job calls `clear_expired()` periodically
- **No grace period**: Expired = never returned, even if API fails

## Recommendations & Ideas

### 1. **Semantic Cache Layer** (Enhancement)
**Problem**: Nearby locations generate separate cache entries

**Solution**: Add fuzzy matching layer before exact cache lookup
```python
# Pseudocode
async def get_with_semantic_matching(params):
    # 1. Exact match (current behavior)
    exact_match = await cache_manager.get(...)
    if exact_match:
        return exact_match

    # 2. Fuzzy location matching (new)
    if 'location' in params:
        nearby_matches = await find_nearby_cached_locations(
            params['location'],
            max_distance_meters=100  # Configurable threshold
        )
        if nearby_matches:
            return nearby_matches[0]  # Return closest match

    # 3. Cache miss - make API call
    return await make_api_call(...)
```

**Benefits**:
- Reduce API calls for "nearby" duplicate requests
- Still maintain exact cache for precise requests

**Trade-offs**:
- Added complexity in cache lookup
- Need geospatial indexing (PostGIS extension)
- May return stale data for moving events

### 2. **Query Normalization** (Enhancement)
**Problem**: Semantically identical queries generate different keys

**Solution**: Normalize queries before hashing
```python
def normalize_query(query: str) -> str:
    # Convert to lowercase
    query = query.lower()

    # Expand common abbreviations
    replacements = {
        'nyc': 'new york city',
        'ny': 'new york',
        'hosp': 'hospital',
        # ... more mappings
    }

    for abbrev, full in replacements.items():
        query = query.replace(abbrev, full)

    return query
```

**Benefits**:
- Increase cache hit rate for equivalent queries
- Reduce API costs

**Trade-offs**:
- May incorrectly normalize legitimate variations
- Need to maintain normalization dictionary

### 3. **Preemptive Cache Warming** (Operational)
**Problem**: First request always hits API (cold cache)

**Solution**: Pre-populate cache for common locations
```python
async def warm_cache_for_common_locations():
    common_locations = [
        {"location": "40.7128,-74.0060", "radius": 5000, "type": "hospital"},  # NYC
        {"location": "34.0522,-118.2437", "radius": 5000, "type": "hospital"}, # LA
        # ... more common queries
    ]

    for params in common_locations:
        await google_places.call("nearby_search", params)
```

**Benefits**:
- Improved response time for common requests
- Reduced API costs for popular locations

**Trade-offs**:
- Upfront API cost during warming
- Need to identify "common" queries

### 4. **Cache Analytics Dashboard** (Monitoring)
**Problem**: No visibility into cache effectiveness

**Solution**: Use `hit_count` and `last_accessed_at` for insights
```sql
-- Top cached queries (highest value)
SELECT
    service_name,
    operation,
    hit_count,
    last_accessed_at,
    (NOW() - created_at) AS cache_age
FROM external_api_cache
WHERE hit_count > 10
ORDER BY hit_count DESC
LIMIT 100;

-- Cache hit rate (requires request logging)
SELECT
    COUNT(CASE WHEN cached = true THEN 1 END)::FLOAT /
    COUNT(*) AS cache_hit_rate
FROM api_request_logs
WHERE service = 'google_places';
```

**Benefits**:
- Identify optimization opportunities
- Track ROI of caching system

### 5. **Adaptive TTL** (Optimization)
**Problem**: 7-day TTL may be too long (stale data) or too short (API waste)

**Solution**: Adjust TTL based on data volatility
```python
def calculate_adaptive_ttl(operation: str, params: Dict) -> int:
    # Place details change rarely (long TTL)
    if operation == "place_details":
        return 30 * 86400  # 30 days

    # Nearby searches change moderately (medium TTL)
    if operation == "nearby_search":
        return 7 * 86400   # 7 days (current default)

    # Text searches may change frequently (short TTL)
    if operation == "text_search":
        return 1 * 86400   # 1 day

    return 7 * 86400  # Default
```

**Benefits**:
- Optimize between freshness and API costs
- Tailor TTL to data characteristics

### 6. **Cache Versioning** (Future-Proofing)
**Problem**: API response format changes invalidate all cached entries

**Solution**: Add version field to cache entries
```sql
ALTER TABLE external_api_cache
ADD COLUMN response_version VARCHAR(20) DEFAULT '1.0';
```

**Benefits**:
- Graceful migration when API changes
- Can maintain backward compatibility

### 7. **Geographic Clustering** (Advanced)
**Problem**: No spatial awareness for cache lookups

**Solution**: Use PostGIS for location-based cache clustering
```sql
-- Add PostGIS extension
CREATE EXTENSION postgis;

-- Add geography column for location params
ALTER TABLE external_api_cache
ADD COLUMN location_point GEOGRAPHY(POINT);

-- Create spatial index
CREATE INDEX idx_cache_location ON external_api_cache
USING GIST (location_point);

-- Find nearby cached requests
SELECT * FROM external_api_cache
WHERE ST_DWithin(
    location_point,
    ST_MakePoint(-74.0060, 40.7128)::geography,
    100  -- meters
)
AND expires_at > NOW();
```

**Benefits**:
- Return cached results for "nearby" locations
- Significantly reduce API calls in dense areas

**Trade-offs**:
- Requires PostGIS extension
- More complex cache lookup logic
- Need to define "nearby" threshold

## Performance Metrics

### Cache Hit Rates (Expected)
- **Memory cache**: 40-60% (for hot data within session)
- **Database cache**: 70-85% (for queries within 7 days)
- **Overall cache**: 85-95% (combined both levels)

### Latency Comparison
- **Memory cache hit**: 0.1-1ms
- **Database cache hit**: 5-15ms
- **Google API call**: 100-500ms (200-400ms typical)

**Savings**: 20-50x faster response with cache

### Cost Savings
- **Google Places API cost**: $17 per 1000 requests (Places Nearby Search)
- **85% cache hit rate** → 850 requests/1000 avoided
- **Cost savings**: ~$14.45 per 1000 requests
- **Annual savings** (1M requests): ~$14,450

## Conclusion

The Google Places caching system is a **high-performance, exact-match cache** optimized for eliminating duplicate API calls. It sacrifices semantic intelligence for simplicity and reliability. The two-level architecture (memory + database) provides excellent performance for exact duplicates while maintaining 7-day persistence.

**Key Limitations**:
- No semantic matching or fuzzy lookup
- No geographic proximity awareness
- No query normalization
- Fixed 7-day TTL for all operations

**Recommended Enhancements** (in priority order):
1. Cache analytics dashboard for monitoring
2. Adaptive TTL based on operation type
3. Query normalization for text searches
4. Geographic clustering with PostGIS (advanced)
