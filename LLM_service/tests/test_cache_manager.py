"""
Unit tests for two-level cache manager.

Tests:
- Cache key generation
- Memory cache (LRU eviction)
- Database cache persistence
- Cache hit/miss scenarios
- Cache expiration
- Cache statistics
"""

import pytest
import asyncio
from datetime import datetime, timedelta

from app.workflows.cache_manager import CacheManager


class TestCacheKeyGeneration:
    """Test cache key generation algorithm."""

    def test_deterministic_key_generation(self):
        """Same inputs should generate same cache key."""
        manager = CacheManager()

        key1 = manager.generate_cache_key(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0", "radius": 5000}
        )

        key2 = manager.generate_cache_key(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0", "radius": 5000}
        )

        assert key1 == key2

    def test_different_params_different_keys(self):
        """Different params should generate different keys."""
        manager = CacheManager()

        key1 = manager.generate_cache_key(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0", "radius": 5000}
        )

        key2 = manager.generate_cache_key(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0", "radius": 10000}
        )

        assert key1 != key2

    def test_param_order_independence(self):
        """Param order should not affect cache key."""
        manager = CacheManager()

        key1 = manager.generate_cache_key(
            "google_places",
            "nearby_search",
            {"radius": 5000, "location": "40.7,-74.0"}
        )

        key2 = manager.generate_cache_key(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0", "radius": 5000}
        )

        assert key1 == key2

    def test_key_length_and_format(self):
        """Cache key should be 64-character hex string."""
        manager = CacheManager()

        key = manager.generate_cache_key(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0"}
        )

        assert len(key) == 64
        assert all(c in '0123456789abcdef' for c in key)


class TestMemoryCache:
    """Test in-memory LRU cache functionality."""

    def test_memory_cache_hit(self):
        """Memory cache should return stored value."""
        manager = CacheManager(memory_cache_size=5)

        # Store in memory cache
        manager._set_in_memory("test_key", {"data": "test_value"})

        # Retrieve from memory cache
        result = manager._get_from_memory("test_key")

        assert result is not None
        assert result["data"] == "test_value"

    def test_memory_cache_miss(self):
        """Memory cache should return None for missing key."""
        manager = CacheManager()

        result = manager._get_from_memory("nonexistent_key")

        assert result is None

    def test_memory_cache_lru_eviction(self):
        """LRU cache should evict least recently used entries."""
        manager = CacheManager(memory_cache_size=3)

        # Fill cache
        manager._set_in_memory("key1", {"data": "value1"})
        manager._set_in_memory("key2", {"data": "value2"})
        manager._set_in_memory("key3", {"data": "value3"})

        # Add 4th item (should evict key1 as least recently used)
        manager._set_in_memory("key4", {"data": "value4"})

        # key1 should be evicted
        assert manager._get_from_memory("key1") is None

        # Other keys should still exist
        assert manager._get_from_memory("key2") is not None
        assert manager._get_from_memory("key3") is not None
        assert manager._get_from_memory("key4") is not None

    def test_memory_cache_access_updates_lru(self):
        """Accessing an item should move it to most recently used."""
        manager = CacheManager(memory_cache_size=3)

        # Fill cache
        manager._set_in_memory("key1", {"data": "value1"})
        manager._set_in_memory("key2", {"data": "value2"})
        manager._set_in_memory("key3", {"data": "value3"})

        # Access key1 (moves to most recently used)
        manager._get_from_memory("key1")

        # Add 4th item (should evict key2 now, not key1)
        manager._set_in_memory("key4", {"data": "value4"})

        # key2 should be evicted
        assert manager._get_from_memory("key2") is None

        # key1 should still exist
        assert manager._get_from_memory("key1") is not None


@pytest.mark.asyncio
class TestDatabaseCache:
    """Test database cache persistence."""

    async def test_database_cache_set_and_get(self):
        """Database cache should persist and retrieve values."""
        manager = CacheManager()

        # Store in database cache
        await manager.set(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0"},
            {"results": [{"name": "Hospital"}]},
            ttl_seconds=3600
        )

        # Retrieve from database cache
        result = await manager.get(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0"}
        )

        assert result is not None
        assert "results" in result
        assert result["results"][0]["name"] == "Hospital"

    async def test_cache_expiration(self):
        """Expired cache entries should not be returned."""
        manager = CacheManager()

        # Store with 1-second TTL
        await manager.set(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0"},
            {"results": []},
            ttl_seconds=1
        )

        # Wait for expiration
        await asyncio.sleep(2)

        # Should return None (expired)
        result = await manager.get(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0"}
        )

        assert result is None

    async def test_cache_hit_count(self):
        """Cache hits should increment hit count."""
        manager = CacheManager()

        # Store value
        await manager.set(
            "weatherapi",
            "current",
            {"q": "Seattle"},
            {"temp": 15},
            ttl_seconds=3600
        )

        # Access multiple times
        await manager.get("weatherapi", "current", {"q": "Seattle"})
        await manager.get("weatherapi", "current", {"q": "Seattle"})

        # Verify hit count increased (test by checking cache stats)
        stats = await manager.get_cache_stats("weatherapi")
        assert stats["total_hits"] >= 2


@pytest.mark.asyncio
class TestCacheStatistics:
    """Test cache statistics and monitoring."""

    async def test_get_cache_stats(self):
        """Cache stats should return accurate metrics."""
        manager = CacheManager()

        # Add test data
        await manager.set(
            "google_places",
            "nearby_search",
            {"location": "40.7,-74.0"},
            {"results": []},
            ttl_seconds=3600
        )

        # Get stats
        stats = await manager.get_cache_stats()

        assert "total_entries" in stats
        assert "services" in stats
        assert stats["total_entries"] >= 1

    async def test_clear_expired_entries(self):
        """Clear expired should remove old entries."""
        manager = CacheManager()

        # Add expired entry
        await manager.set(
            "google_places",
            "test",
            {"test": "data"},
            {"results": []},
            ttl_seconds=1
        )

        # Wait for expiration
        await asyncio.sleep(2)

        # Clear expired
        deleted_count = await manager.clear_expired()

        assert deleted_count >= 1
