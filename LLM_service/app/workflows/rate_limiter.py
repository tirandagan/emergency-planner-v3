"""
Redis-based Rate Limiter for External API Calls

Implements sliding window rate limiting with two tiers:
- Per-user limits (default: 10 requests/hour)
- Global limits (default: 100 requests/hour)

Uses Redis for distributed rate limiting across multiple workers.
"""

import ssl
import time
from typing import Optional, Tuple
import redis.asyncio as redis

from app.config import settings


class RateLimitExceeded(Exception):
    """Raised when rate limit is exceeded."""

    def __init__(self, limit_type: str, retry_after: int):
        """
        Initialize rate limit exception.

        Args:
            limit_type: Type of limit exceeded ('user' or 'global')
            retry_after: Seconds until rate limit resets
        """
        self.limit_type = limit_type
        self.retry_after = retry_after
        super().__init__(
            f"Rate limit exceeded ({limit_type}). "
            f"Retry after {retry_after} seconds."
        )


class RateLimiter:
    """
    Redis-based sliding window rate limiter.

    Features:
    - Sliding window algorithm for accurate rate limiting
    - Per-user and global rate limits
    - Distributed coordination via Redis
    - Configurable limits via settings.ini
    - Returns retry-after time when limit exceeded
    """

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        per_user_limit: int = 10,
        global_limit: int = 100,
        window_seconds: int = 3600  # 1 hour
    ):
        """
        Initialize rate limiter.

        Args:
            redis_client: Redis client instance (created if None)
            per_user_limit: Max requests per user per window
            global_limit: Max total requests per window
            window_seconds: Time window in seconds (default: 3600 = 1 hour)
        """
        self.redis_client = redis_client
        self.per_user_limit = per_user_limit
        self.global_limit = global_limit
        self.window_seconds = window_seconds

    async def _get_redis(self) -> redis.Redis:
        """Get or create Redis client with SSL support."""
        if self.redis_client is None:
            # Configure SSL if using rediss:// URL
            redis_kwargs = {"decode_responses": False}

            if settings.REDIS_URL.startswith("rediss://"):
                # Create SSL context for secure Redis connections (Render, etc.)
                ssl_context = ssl.create_default_context()
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                redis_kwargs["ssl"] = ssl_context

            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                **redis_kwargs
            )
        return self.redis_client

    async def check_rate_limit(
        self,
        service_name: str,
        user_id: Optional[str] = None
    ) -> Tuple[bool, int]:
        """
        Check if request is within rate limits.

        Uses sliding window algorithm:
        1. Remove requests older than window
        2. Count requests in current window
        3. Allow if count < limit, deny otherwise

        Args:
            service_name: External service identifier
            user_id: Optional user identifier for per-user limiting

        Returns:
            Tuple of (allowed, retry_after_seconds)
            - allowed: True if request is within limits
            - retry_after: Seconds to wait if limit exceeded (0 if allowed)

        Raises:
            RateLimitExceeded: If rate limit is exceeded
        """
        r = await self._get_redis()
        current_time = int(time.time())
        window_start = current_time - self.window_seconds

        # Check global limit
        global_key = f"rate_limit:global:{service_name}"
        global_allowed, global_retry = await self._check_limit(
            r, global_key, self.global_limit, current_time, window_start
        )

        if not global_allowed:
            raise RateLimitExceeded('global', global_retry)

        # Check per-user limit if user_id provided
        if user_id:
            user_key = f"rate_limit:user:{service_name}:{user_id}"
            user_allowed, user_retry = await self._check_limit(
                r, user_key, self.per_user_limit, current_time, window_start
            )

            if not user_allowed:
                raise RateLimitExceeded('user', user_retry)

        return True, 0

    async def _check_limit(
        self,
        r: redis.Redis,
        key: str,
        limit: int,
        current_time: int,
        window_start: int
    ) -> Tuple[bool, int]:
        """
        Check rate limit for a specific key.

        Args:
            r: Redis client
            key: Rate limit key
            limit: Max requests allowed
            current_time: Current Unix timestamp
            window_start: Window start timestamp

        Returns:
            Tuple of (allowed, retry_after_seconds)
        """
        # Use Redis pipeline for atomic operations
        pipe = r.pipeline()

        # Remove requests older than window
        pipe.zremrangebyscore(key, 0, window_start)

        # Count requests in current window
        pipe.zcard(key)

        # Execute pipeline
        results = await pipe.execute()
        request_count = results[1]

        if request_count >= limit:
            # Get oldest request in window
            oldest = await r.zrange(key, 0, 0, withscores=True)
            if oldest:
                oldest_time = int(oldest[0][1])
                retry_after = oldest_time + self.window_seconds - current_time
                return False, max(1, retry_after)  # At least 1 second

            return False, self.window_seconds

        return True, 0

    async def record_request(
        self,
        service_name: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Record a successful API request for rate limiting.

        Should be called AFTER successful API call to prevent
        counting failed requests against limits.

        Args:
            service_name: External service identifier
            user_id: Optional user identifier
        """
        r = await self._get_redis()
        current_time = time.time()

        # Record global request
        global_key = f"rate_limit:global:{service_name}"
        await r.zadd(global_key, {str(current_time): current_time})
        await r.expire(global_key, self.window_seconds + 60)  # Extra 60s buffer

        # Record per-user request if user_id provided
        if user_id:
            user_key = f"rate_limit:user:{service_name}:{user_id}"
            await r.zadd(user_key, {str(current_time): current_time})
            await r.expire(user_key, self.window_seconds + 60)

    async def get_remaining_requests(
        self,
        service_name: str,
        user_id: Optional[str] = None
    ) -> Tuple[int, int]:
        """
        Get remaining requests for user and global limits.

        Args:
            service_name: External service identifier
            user_id: Optional user identifier

        Returns:
            Tuple of (user_remaining, global_remaining)
            - user_remaining: -1 if no user_id provided
            - global_remaining: Number of global requests remaining
        """
        r = await self._get_redis()
        current_time = int(time.time())
        window_start = current_time - self.window_seconds

        # Get global count
        global_key = f"rate_limit:global:{service_name}"
        await r.zremrangebyscore(global_key, 0, window_start)
        global_count = await r.zcard(global_key)
        global_remaining = max(0, self.global_limit - global_count)

        # Get per-user count if user_id provided
        user_remaining = -1
        if user_id:
            user_key = f"rate_limit:user:{service_name}:{user_id}"
            await r.zremrangebyscore(user_key, 0, window_start)
            user_count = await r.zcard(user_key)
            user_remaining = max(0, self.per_user_limit - user_count)

        return user_remaining, global_remaining

    async def reset_limits(
        self,
        service_name: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Reset rate limits for service/user (admin operation).

        Args:
            service_name: External service identifier
            user_id: Optional user identifier (resets only user if provided)
        """
        r = await self._get_redis()

        if user_id:
            # Reset only user limit
            user_key = f"rate_limit:user:{service_name}:{user_id}"
            await r.delete(user_key)
        else:
            # Reset global limit
            global_key = f"rate_limit:global:{service_name}"
            await r.delete(global_key)

    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.aclose()


# Global rate limiter instance
rate_limiter = RateLimiter(
    per_user_limit=getattr(settings, 'RATE_LIMIT_PER_USER', 10),
    global_limit=getattr(settings, 'RATE_LIMIT_GLOBAL', 100),
    window_seconds=3600  # 1 hour
)
