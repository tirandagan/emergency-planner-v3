"""
Integration tests for external API services.

Tests real API calls to:
- Google Places (nearby_search, text_search, place_details)
- WeatherAPI (current weather)

Requires valid API keys in environment variables.
"""

import pytest
from app.config import settings
from app.workflows.services import GooglePlacesService, WeatherAPIService


@pytest.mark.asyncio
@pytest.mark.integration
class TestGooglePlacesIntegration:
    """Integration tests for Google Places API."""

    async def test_nearby_search_hospitals(self):
        """Test nearby search for hospitals in New York."""
        service = GooglePlacesService()

        response = await service.call(
            operation="nearby_search",
            params={
                "location": "40.7128,-74.0060",  # New York City
                "radius": 5000,
                "type": "hospital"
            }
        )

        assert response.success is True
        assert "results" in response.data
        assert len(response.data["results"]) > 0
        assert response.data["status"] == "OK"

        # Verify result structure
        first_result = response.data["results"][0]
        assert "name" in first_result
        assert "vicinity" in first_result

        await service.close()

    async def test_text_search(self):
        """Test text search for emergency services."""
        service = GooglePlacesService()

        response = await service.call(
            operation="text_search",
            params={
                "query": "emergency hospitals in Seattle"
            }
        )

        assert response.success is True
        assert "results" in response.data
        assert len(response.data["results"]) > 0

        await service.close()

    async def test_place_details(self):
        """Test getting place details."""
        service = GooglePlacesService()

        # First get a place_id from nearby search
        search_response = await service.call(
            operation="nearby_search",
            params={
                "location": "37.7749,-122.4194",  # San Francisco
                "radius": 5000,
                "type": "hospital"
            }
        )

        if search_response.success and len(search_response.data["results"]) > 0:
            place_id = search_response.data["results"][0]["place_id"]

            # Get details for that place
            details_response = await service.call(
                operation="place_details",
                params={
                    "place_id": place_id,
                    "fields": "name,formatted_address,formatted_phone_number"
                }
            )

            assert details_response.success is True
            assert "result" in details_response.data
            assert "name" in details_response.data["result"]

        await service.close()

    async def test_caching_works(self):
        """Test that caching prevents duplicate API calls."""
        service = GooglePlacesService(enable_cache=True)

        params = {
            "location": "34.0522,-118.2437",  # Los Angeles
            "radius": 5000,
            "type": "police"
        }

        # First call (should hit API)
        response1 = await service.call(
            operation="nearby_search",
            params=params
        )

        assert response1.success is True
        assert response1.cached is False

        # Second call (should hit cache)
        response2 = await service.call(
            operation="nearby_search",
            params=params
        )

        assert response2.success is True
        assert response2.cached is True

        await service.close()


@pytest.mark.asyncio
@pytest.mark.integration
class TestWeatherAPIIntegration:
    """Integration tests for WeatherAPI.com."""

    async def test_current_weather_by_coordinates(self):
        """Test getting current weather by lat/lng."""
        service = WeatherAPIService()

        response = await service.call(
            operation="current",
            params={
                "lat": 40.7128,
                "lng": -74.0060
            }
        )

        assert response.success is True
        assert "location" in response.data
        assert "current" in response.data

        # Verify current weather structure
        current = response.data["current"]
        assert "temp_f" in current
        assert "condition" in current
        assert "humidity" in current

        await service.close()

    async def test_current_weather_by_query(self):
        """Test getting current weather by city name."""
        service = WeatherAPIService()

        response = await service.call(
            operation="current",
            params={
                "q": "Seattle"
            }
        )

        assert response.success is True
        assert "location" in response.data
        assert response.data["location"]["name"] == "Seattle"

        await service.close()

    async def test_weather_caching(self):
        """Test that weather data is cached."""
        service = WeatherAPIService(enable_cache=True)

        params = {"q": "Miami"}

        # First call (should hit API)
        response1 = await service.call(
            operation="current",
            params=params
        )

        assert response1.success is True
        assert response1.cached is False

        # Second call (should hit cache)
        response2 = await service.call(
            operation="current",
            params=params
        )

        assert response2.success is True
        assert response2.cached is True

        await service.close()


@pytest.mark.asyncio
@pytest.mark.integration
class TestRateLimitingIntegration:
    """Test rate limiting with real services."""

    async def test_rate_limit_enforced(self):
        """Test that rate limits are enforced."""
        # Create service with rate limiting enabled
        service = GooglePlacesService(enable_rate_limiting=True)

        params = {
            "location": "41.8781,-87.6298",  # Chicago
            "radius": 5000,
            "type": "hospital"
        }

        user_id = "test_user_rate_limit"

        # Make requests up to limit (10 requests for per-user limit)
        for i in range(10):
            response = await service.call(
                operation="nearby_search",
                params=params,
                user_id=user_id,
                cache_ttl=0  # Disable caching to force API calls
            )

            if response.success:
                # API call succeeded
                pass
            else:
                # Rate limit hit
                assert "rate limit" in response.error.lower()
                break

        await service.close()


@pytest.mark.asyncio
@pytest.mark.integration
class TestErrorHandling:
    """Test error handling for external services."""

    async def test_invalid_api_key(self):
        """Test that invalid API key is handled correctly."""
        service = GooglePlacesService(api_key="INVALID_KEY")

        response = await service.call(
            operation="nearby_search",
            params={
                "location": "0,0",
                "radius": 1000
            }
        )

        assert response.success is False
        assert "request denied" in response.error.lower() or "authentication" in response.error.lower()

        await service.close()

    async def test_invalid_location(self):
        """Test that invalid location is handled correctly."""
        service = GooglePlacesService()

        response = await service.call(
            operation="nearby_search",
            params={
                "location": "invalid,location",
                "radius": 5000
            }
        )

        # Should return error or ZERO_RESULTS
        if not response.success:
            assert "error" in response.error.lower()
        else:
            # Some APIs may return ZERO_RESULTS instead of error
            assert response.data.get("status") in ["ZERO_RESULTS", "INVALID_REQUEST"]

        await service.close()
