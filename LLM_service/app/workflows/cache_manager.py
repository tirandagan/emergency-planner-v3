"""
Two-Level Cache Manager for External API Responses

Implements memory (LRU) + database caching strategy:
- Level 1: 500-entry LRU cache for hot data (fast access)
- Level 2: PostgreSQL database for persistent storage (7-day TTL)

Cache key generation uses SHA-256 hash of normalized request parameters.
"""

import hashlib
import json
from collections import OrderedDict
from datetime import datetime, timedelta, timezone
from threading import Lock
from typing import Any, Dict, Optional

from sqlalchemy import select, update, and_, delete
from sqlalchemy.dialects.postgresql import insert

from app.database import get_db
from app.models.external_api_cache import ExternalAPICache


class CacheManager:
    """
    Two-level cache manager for external API responses.

    Features:
    - Memory cache: LRU cache with 500 entries for hot data
    - Database cache: PostgreSQL for long-term storage (7-day default TTL)
    - Automatic expiration: Expired entries not returned
    - Cache hit tracking: Metrics for monitoring and optimization
    - Cache key generation: SHA-256 hash of normalized request params
    """

    def __init__(self, memory_cache_size: int = 500):
        """
        Initialize cache manager.

        Args:
            memory_cache_size: Maximum number of entries in memory cache
        """
        self.memory_cache_size = memory_cache_size
        self._memory_cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self._cache_lock = Lock()  # Thread safety for memory cache

    @staticmethod
    def generate_cache_key(service_name: str, operation: str, params: Dict[str, Any]) -> str:
        """
        Generate cache key from service, operation, and parameters.

        Uses SHA-256 hash of normalized JSON representation:
        - Sorts dictionary keys for consistency
        - Converts to compact JSON (no whitespace)
        - Returns first 64 characters of hex digest

        Args:
            service_name: External service identifier (e.g., 'google_places')
            operation: API operation name (e.g., 'nearby_search')
            params: Request parameters dictionary

        Returns:
            Cache key string (64-character hex digest)

        Examples:
            >>> generate_cache_key('google_places', 'nearby_search', {'location': '40.7,-74.0', 'radius': 5000})
            'a1b2c3d4e5f6...'
        """
        # Normalize parameters: sort keys, compact JSON
        normalized = json.dumps(params, sort_keys=True, separators=(',', ':'))

        # Create composite string: service|operation|params
        composite = f"{service_name}|{operation}|{normalized}"

        # Generate SHA-256 hash
        hash_obj = hashlib.sha256(composite.encode('utf-8'))

        # Return first 64 characters (full SHA-256 hex digest is 64 chars)
        return hash_obj.hexdigest()[:64]

    async def get(
        self,
        service_name: str,
        operation: str,
        params: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached response if available and not expired.

        Lookup order:
        1. Check memory cache (fast)
        2. Check database cache (slower but persistent)
        3. If found in DB, populate memory cache

        Args:
            service_name: External service identifier
            operation: API operation name
            params: Request parameters

        Returns:
            Cached response data if found and not expired, None otherwise
        """
        cache_key = self.generate_cache_key(service_name, operation, params)

        # Level 1: Try memory cache (decorated method with lru_cache)
        memory_result = self._get_from_memory(cache_key)
        if memory_result is not None:
            return memory_result

        # Level 2: Try database cache
        db_gen = get_db()
        db = next(db_gen)
        try:
            stmt = select(ExternalAPICache).where(
                and_(
                    ExternalAPICache.service_name == service_name,
                    ExternalAPICache.operation == operation,
                    ExternalAPICache.cache_key == cache_key,
                    ExternalAPICache.expires_at > datetime.now(timezone.utc)
                )
            )

            result = db.execute(stmt)
            cache_entry = result.scalar_one_or_none()

            if cache_entry:
                # Update hit count and last accessed timestamp
                db.execute(
                    update(ExternalAPICache)
                    .where(ExternalAPICache.id == cache_entry.id)
                    .values(
                        hit_count=ExternalAPICache.hit_count + 1,
                        last_accessed_at=datetime.now(timezone.utc)
                    )
                )
                db.commit()

                # Populate memory cache for future fast access
                self._set_in_memory(cache_key, cache_entry.response_data)

                return cache_entry.response_data

            return None
        finally:
            db.close()

    async def set(
        self,
        service_name: str,
        operation: str,
        params: Dict[str, Any],
        response_data: Dict[str, Any],
        ttl_seconds: int = 604800  # 7 days default
    ) -> None:
        """
        Store response in both memory and database caches.

        Args:
            service_name: External service identifier
            operation: API operation name
            params: Request parameters
            response_data: API response to cache
            ttl_seconds: Cache TTL in seconds (default: 604800 = 7 days)
        """
        cache_key = self.generate_cache_key(service_name, operation, params)
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

        # Level 1: Store in memory cache
        self._set_in_memory(cache_key, response_data)

        # Level 2: Store in database cache (upsert)
        db_gen = get_db()
        db = next(db_gen)
        try:
            stmt = insert(ExternalAPICache).values(
                service_name=service_name,
                operation=operation,
                cache_key=cache_key,
                request_params=params,
                response_data=response_data,
                expires_at=expires_at,
                hit_count=0,
                last_accessed_at=None
            ).on_conflict_do_update(
                constraint='unique_cache_entry',
                set_={
                    'request_params': params,
                    'response_data': response_data,
                    'expires_at': expires_at,
                    'created_at': datetime.now(timezone.utc)
                }
            )

            db.execute(stmt)
            db.commit()
        finally:
            db.close()

    def _get_from_memory(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Memory cache lookup (LRU).

        Thread-safe OrderedDict-based LRU cache.
        Moves accessed items to end (most recently used).

        Args:
            cache_key: Cache key to lookup

        Returns:
            Cached data if found, None otherwise
        """
        with self._cache_lock:
            if cache_key in self._memory_cache:
                # Move to end (most recently used)
                self._memory_cache.move_to_end(cache_key)
                return self._memory_cache[cache_key]

        return None

    def _set_in_memory(self, cache_key: str, data: Dict[str, Any]) -> None:
        """
        Store data in memory cache with LRU eviction.

        Thread-safe OrderedDict-based LRU cache.
        Evicts least recently used entry when cache is full.

        Args:
            cache_key: Cache key
            data: Data to cache
        """
        with self._cache_lock:
            # Remove if already exists (will re-add at end)
            if cache_key in self._memory_cache:
                del self._memory_cache[cache_key]

            # Add to end (most recently used)
            self._memory_cache[cache_key] = data

            # Evict least recently used if cache is full
            if len(self._memory_cache) > self.memory_cache_size:
                # Remove first item (least recently used)
                self._memory_cache.popitem(last=False)

    async def clear_expired(self) -> int:
        """
        Remove expired entries from database cache.

        Should be called periodically by background task.

        Returns:
            Number of entries deleted
        """
        db_gen = get_db()
        db = next(db_gen)
        try:
            stmt = delete(ExternalAPICache).where(
                ExternalAPICache.expires_at <= datetime.now(timezone.utc)
            )

            result = db.execute(stmt)
            db.commit()

            return result.rowcount
        finally:
            db.close()

    async def get_cache_stats(self, service_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Get cache statistics for monitoring.

        Args:
            service_name: Optional service filter

        Returns:
            Dictionary with cache statistics:
            - total_entries: Total number of cached entries
            - expired_entries: Number of expired entries
            - total_hits: Sum of all hit counts
            - services: Per-service breakdown
        """
        db_gen = get_db()
        db = next(db_gen)
        try:
            # Total entries
            if service_name:
                total_stmt = select(ExternalAPICache).where(
                    ExternalAPICache.service_name == service_name
                )
            else:
                total_stmt = select(ExternalAPICache)

            total_result = db.execute(total_stmt)
            all_entries = total_result.scalars().all()

            total_entries = len(all_entries)
            expired_entries = sum(1 for e in all_entries if e.expires_at <= datetime.now(timezone.utc))
            total_hits = sum(e.hit_count for e in all_entries)

            # Per-service breakdown
            services = {}
            for entry in all_entries:
                if entry.service_name not in services:
                    services[entry.service_name] = {
                        'total_entries': 0,
                        'total_hits': 0,
                        'operations': {}
                    }

                services[entry.service_name]['total_entries'] += 1
                services[entry.service_name]['total_hits'] += entry.hit_count

                if entry.operation not in services[entry.service_name]['operations']:
                    services[entry.service_name]['operations'][entry.operation] = 0

                services[entry.service_name]['operations'][entry.operation] += 1

            return {
                'total_entries': total_entries,
                'expired_entries': expired_entries,
                'total_hits': total_hits,
                'services': services
            }
        finally:
            db.close()


# Global cache manager instance
cache_manager = CacheManager(memory_cache_size=500)
