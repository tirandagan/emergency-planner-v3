"""
Unit tests for Redis-based rate limiter.

Tests:
- Per-user rate limiting
- Global rate limiting
- Sliding window algorithm
- Rate limit exceeded exceptions
- Request recording
- Remaining requests calculation
"""

import pytest
import asyncio
from app.workflows.rate_limiter import RateLimiter, RateLimitExceeded


@pytest.mark.asyncio
class TestRateLimiterBasics:
    """Test basic rate limiter functionality."""

    async def test_rate_limit_allows_within_limit(self):
        """Requests within limit should be allowed."""
        limiter = RateLimiter(per_user_limit=10, global_limit=100)

        # Should allow first request
        allowed, retry_after = await limiter.check_rate_limit(
            "google_places",
            user_id="user123"
        )

        assert allowed is True
        assert retry_after == 0

        await limiter.close()

    async def test_rate_limit_blocks_over_limit(self):
        """Requests exceeding limit should be blocked."""
        limiter = RateLimiter(per_user_limit=2, global_limit=100)

        # Record 2 requests (at limit)
        await limiter.record_request("google_places", user_id="user123")
        await limiter.record_request("google_places", user_id="user123")

        # 3rd request should be blocked
        with pytest.raises(RateLimitExceeded) as exc_info:
            await limiter.check_rate_limit("google_places", user_id="user123")

        assert exc_info.value.limit_type == 'user'
        assert exc_info.value.retry_after > 0

        await limiter.close()

    async def test_global_rate_limit(self):
        """Global limit should apply across all users."""
        limiter = RateLimiter(per_user_limit=100, global_limit=2)

        # Record 2 global requests
        await limiter.record_request("google_places", user_id="user1")
        await limiter.record_request("google_places", user_id="user2")

        # 3rd request should hit global limit
        with pytest.raises(RateLimitExceeded) as exc_info:
            await limiter.check_rate_limit("google_places", user_id="user3")

        assert exc_info.value.limit_type == 'global'

        await limiter.close()

    async def test_per_user_limit_independent(self):
        """Per-user limits should be independent."""
        limiter = RateLimiter(per_user_limit=1, global_limit=100)

        # User1 hits limit
        await limiter.record_request("google_places", user_id="user1")

        # User2 should still be allowed
        allowed, _ = await limiter.check_rate_limit("google_places", user_id="user2")

        assert allowed is True

        await limiter.close()


@pytest.mark.asyncio
class TestRemainingRequests:
    """Test remaining requests calculation."""

    async def test_get_remaining_requests(self):
        """Should return correct remaining request counts."""
        limiter = RateLimiter(per_user_limit=10, global_limit=100)

        # Record 3 requests
        await limiter.record_request("google_places", user_id="user123")
        await limiter.record_request("google_places", user_id="user123")
        await limiter.record_request("google_places", user_id="user123")

        # Get remaining
        user_remaining, global_remaining = await limiter.get_remaining_requests(
            "google_places",
            user_id="user123"
        )

        assert user_remaining == 7  # 10 - 3
        assert global_remaining == 97  # 100 - 3

        await limiter.close()

    async def test_remaining_without_user_id(self):
        """Should return -1 for user remaining when no user_id provided."""
        limiter = RateLimiter(per_user_limit=10, global_limit=100)

        user_remaining, global_remaining = await limiter.get_remaining_requests(
            "google_places"
        )

        assert user_remaining == -1
        assert global_remaining >= 0

        await limiter.close()


@pytest.mark.asyncio
class TestRateLimitReset:
    """Test rate limit reset functionality."""

    async def test_reset_user_limit(self):
        """Resetting user limit should clear user requests."""
        limiter = RateLimiter(per_user_limit=1, global_limit=100)

        # Hit limit
        await limiter.record_request("google_places", user_id="user123")

        # Reset
        await limiter.reset_limits("google_places", user_id="user123")

        # Should be allowed again
        allowed, _ = await limiter.check_rate_limit("google_places", user_id="user123")

        assert allowed is True

        await limiter.close()

    async def test_reset_global_limit(self):
        """Resetting global limit should clear all requests."""
        limiter = RateLimiter(per_user_limit=100, global_limit=1)

        # Hit limit
        await limiter.record_request("google_places", user_id="user1")

        # Reset global
        await limiter.reset_limits("google_places")

        # Should be allowed again
        allowed, _ = await limiter.check_rate_limit("google_places", user_id="user2")

        assert allowed is True

        await limiter.close()


@pytest.mark.asyncio
class TestSlidingWindow:
    """Test sliding window algorithm."""

    async def test_sliding_window_expiration(self):
        """Old requests should expire after window period."""
        # Use very short window for testing (1 second)
        limiter = RateLimiter(per_user_limit=1, global_limit=100, window_seconds=1)

        # Record request
        await limiter.record_request("google_places", user_id="user123")

        # Wait for window to expire
        await asyncio.sleep(2)

        # Should be allowed again (window expired)
        allowed, _ = await limiter.check_rate_limit("google_places", user_id="user123")

        assert allowed is True

        await limiter.close()
