# Google Places 7-Day Cache Flow

## Overview

This diagram illustrates the two-level caching system for Google Places API requests in the LLM_service. The cache uses **exact parameter matching** (not semantic) via SHA-256 hash keys, with a 7-day default TTL for both memory and database persistence.

## Diagram

```mermaid
flowchart TD
    Start["API Request<br/>(operation + params)"] --> GenKey["Generate Cache Key<br/>SHA-256 hash of:<br/>service | operation | sorted params"]

    GenKey --> MemCheck{"Check Memory Cache<br/>(LRU, 500 entries)"}

    MemCheck -->|"Hit ✅"| MemReturn["Return Cached Response<br/>cached=true"]
    MemCheck -->|"Miss ❌"| DBCheck{"Check Database Cache<br/>(PostgreSQL)"}

    DBCheck -->|"Hit ✅<br/>NOT expired"| DBHit["Update hit_count + 1<br/>Update last_accessed_at<br/>Populate memory cache"]
    DBHit --> DBReturn["Return Cached Response<br/>cached=true"]

    DBCheck -->|"Miss ❌<br/>or expired"| RateLimit{"Rate Limit Check<br/>Per-user: 10/hour<br/>Global: 100/hour"}

    RateLimit -->|"Exceeded ⚠️"| RateLimitError["Return Error<br/>retry_after metadata"]
    RateLimit -->|"OK ✅"| APICall["Make Google Places<br/>API Request"]

    APICall --> APIResponse{"Response Status"}

    APIResponse -->|"OK ✅"| RecordRate["Record Request<br/>for rate limiter"]
    RecordRate --> StoreCache["Store in Both Caches<br/>Memory + Database<br/>TTL: 7 days (604800s)"]
    StoreCache --> Return["Return Fresh Response<br/>cached=false"]

    APIResponse -->|"ERROR ❌<br/>(401/403/429/500+)"| ErrorHandle["Map to Error Type<br/>Auth/Quota/Server"]
    ErrorHandle --> ErrorReturn["Return Error Response"]

    %% High contrast styling for readability
    classDef cacheHit fill:#4CAF50,stroke:#388E3C,stroke-width:2px,color:#fff
    classDef cacheMiss fill:#FF9800,stroke:#F57C00,stroke-width:2px,color:#fff
    classDef apiCall fill:#2196F3,stroke:#1976D2,stroke-width:2px,color:#fff
    classDef error fill:#E91E63,stroke:#C2185B,stroke-width:2px,color:#fff
    classDef decision fill:#9C27B0,stroke:#7B1FA2,stroke-width:2px,color:#fff
    classDef process fill:#607D8B,stroke:#455A64,stroke-width:2px,color:#fff

    class MemReturn,DBReturn cacheHit
    class MemCheck,DBCheck,RateLimit,APIResponse decision
    class APICall apiCall
    class RateLimitError,ErrorHandle,ErrorReturn error
    class GenKey,DBHit,RecordRate,StoreCache process
    class Return cacheMiss
```

## Key Components

### Cache Key Generation
- **Algorithm**: `SHA-256(service_name | operation | JSON.stringify(params, sort_keys=true))`
- **Example**: `google_places|nearby_search|{"location":"40.7,-74.0","radius":5000}` → `a1b2c3d4e5f6...` (64 chars)
- **Critical**: Parameters are sorted alphabetically before hashing to ensure consistent keys

### Two-Level Cache Architecture
1. **Level 1 - Memory Cache (LRU)**
   - 500-entry OrderedDict with thread-safe locking
   - Evicts least recently used entries when full
   - Sub-millisecond access time
   - Volatile (cleared on service restart)

2. **Level 2 - Database Cache (PostgreSQL)**
   - Persistent storage via `external_api_cache` table
   - 7-day default TTL (configurable per request)
   - Tracks hit_count and last_accessed_at for analytics
   - Automatic expiration via `expires_at` timestamp

### Google Places Operations Supported
- `nearby_search`: Find places within radius of lat/lng
- `text_search`: Search places by text query
- `place_details`: Get detailed info for specific place_id

## Related Files

- **Cache Manager**: `LLM_service/app/workflows/cache_manager.py:1-330`
- **Google Places Service**: `LLM_service/app/workflows/services/google_places.py:1-388`
- **External Services Base**: `LLM_service/app/workflows/external_services.py:1-305`
- **Database Model**: `LLM_service/app/models/external_api_cache.py:1-50`
- **Migration**: `LLM_service/migrations/002_create_external_api_cache.sql:1-38`
- **Tests**: `LLM_service/tests/test_cache_manager.py:1-276`

## Cache Behavior Examples

### ✅ **WILL Use Cache** (Exact Match)
```python
# First request (cache miss)
params1 = {"location": "40.7128,-74.0060", "radius": 5000, "type": "hospital"}
# Cache key: abc123... (stored for 7 days)

# Second request within 7 days (cache hit)
params2 = {"radius": 5000, "location": "40.7128,-74.0060", "type": "hospital"}
# Cache key: abc123... (same key due to sorted params)
# Returns cached response immediately
```

### ❌ **Will NOT Use Cache** (Different Parameters)
```python
# Request 1
params1 = {"location": "40.7128,-74.0060", "radius": 5000}
# Cache key: abc123...

# Request 2 - Different radius
params2 = {"location": "40.7128,-74.0060", "radius": 10000}
# Cache key: def456... (different key!)
# Makes new API call

# Request 3 - Different location
params3 = {"location": "40.7129,-74.0060", "radius": 5000}
# Cache key: ghi789... (different key!)
# Makes new API call
```

### ⚠️ **Geographic Proximity Does NOT Matter**
```python
# New York City Hall
params1 = {"location": "40.7128,-74.0060", "radius": 5000}
# Cache key: aaa111...

# 100 meters away (still different cache entry)
params2 = {"location": "40.7138,-74.0060", "radius": 5000}
# Cache key: bbb222... (completely different!)
# Makes new API call even though locations are very close
```

### 🔍 **Text Queries Are NOT Semantically Matched**
```python
# Query 1
params1 = {"query": "hospitals in New York"}
# Cache key: xxx111...

# Query 2 - Semantically similar but different text
params2 = {"query": "hospitals in New York City"}
# Cache key: yyy222... (different!)
# Makes new API call

# Query 3 - Typo or variation
params3 = {"query": "hospital in New York"}
# Cache key: zzz333... (different!)
# Makes new API call
```

## Cache Invalidation

- **Time-Based**: Entries expire after 7 days (604800 seconds)
- **Manual Cleanup**: Background job calls `cache_manager.clear_expired()`
- **No Semantic Invalidation**: Nearby locations or similar queries don't invalidate each other
- **Parameter Changes**: Any parameter change generates new cache key (instant invalidation)
