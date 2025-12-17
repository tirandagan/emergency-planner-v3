"""
Google Places API Service

Implements three core operations:
1. nearby_search - Find places near a location
2. text_search - Search places by text query
3. place_details - Get detailed information about a specific place

API Documentation: https://developers.google.com/maps/documentation/places/web-service
"""

from typing import Any, Dict, List, Optional
import requests

from app.config import settings
from app.workflows.external_services import (
    ExternalService,
    ExternalServiceResponse,
    ExternalServiceError,
    ExternalServiceAuthError,
    ExternalServiceQuotaError,
    service_registry
)


class GooglePlacesService(ExternalService):
    """
    Google Places API service implementation.

    Operations:
    - nearby_search: Find places within radius of location
    - text_search: Search places by text query
    - place_details: Get detailed place information

    Rate Limits:
    - Per-user: 10 requests/hour
    - Global: 100 requests/hour

    Cache TTL: 7 days (configurable)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://maps.googleapis.com/maps/api/place",
        timeout: int = 30,
        enable_cache: bool = True,
        enable_rate_limiting: bool = True
    ):
        """
        Initialize Google Places service.

        Args:
            api_key: Google API key (from settings if None)
            base_url: Base URL for Google Places API
            timeout: Request timeout in seconds
            enable_cache: Enable response caching
            enable_rate_limiting: Enable rate limiting
        """
        # Use settings if api_key not provided
        if api_key is None:
            api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', None)

        super().__init__(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
            enable_cache=enable_cache,
            enable_rate_limiting=enable_rate_limiting
        )

    @property
    def service_name(self) -> str:
        return "google_places"

    @property
    def supported_operations(self) -> List[str]:
        return ["nearby_search", "text_search", "place_details"]

    def call(
        self,
        operation: str,
        params: Dict[str, Any],
        user_id: Optional[str] = None,
        cache_ttl: Optional[int] = None
    ) -> ExternalServiceResponse:
        """
        Execute Google Places API request synchronously.

        Note:
            Caching and rate limiting are handled by the executor layer.
            This method focuses solely on making the HTTP request.

        Args:
            operation: One of: nearby_search, text_search, place_details
            params: Operation-specific parameters
            user_id: Not used (passed through for executor)
            cache_ttl: Not used (passed through for executor)

        Returns:
            ExternalServiceResponse with places data

        Raises:
            ExternalServiceError: On API errors
        """
        # Validate operation
        if operation not in self.supported_operations:
            return ExternalServiceResponse(
                success=False,
                error=f"Unsupported operation: {operation}. "
                      f"Supported: {self.supported_operations}"
            )

        # Execute API request (synchronous)
        try:
            if operation == "nearby_search":
                result = self._nearby_search(params)
            elif operation == "text_search":
                result = self._text_search(params)
            elif operation == "place_details":
                result = self._place_details(params)
            else:
                return ExternalServiceResponse(
                    success=False,
                    error=f"Operation {operation} not implemented"
                )

            return ExternalServiceResponse(
                success=True,
                data=result,
                cached=False
            )

        except requests.Timeout:
            return ExternalServiceResponse(
                success=False,
                error=f"Request timeout after {self.timeout}s"
            )
        except ExternalServiceError as e:
            return ExternalServiceResponse(
                success=False,
                error=str(e)
            )
        except Exception as e:
            return ExternalServiceResponse(
                success=False,
                error=f"Unexpected error: {str(e)}"
            )

    def _nearby_search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Find places near a location synchronously.

        Required params:
        - location: "lat,lng" string (e.g., "40.7128,-74.0060")
        - radius: Search radius in meters (max: 50000)

        Optional params:
        - type: Place type (e.g., "hospital", "restaurant")
        - keyword: Text to match against place names
        - name: Place name to search for
        - language: Language code for results

        Returns:
            Dict with 'results' list and 'status'
        """
        # Validate required parameters
        if 'location' not in params:
            raise ExternalServiceError("Missing required parameter: location")
        if 'radius' not in params:
            raise ExternalServiceError("Missing required parameter: radius")

        # Build request URL
        url = f"{self.base_url}/nearbysearch/json"

        # Build query parameters
        query_params = {
            'location': params['location'],
            'radius': params['radius'],
            'key': self.api_key
        }

        # Add optional parameters
        for optional_param in ['type', 'keyword', 'name', 'language']:
            if optional_param in params:
                query_params[optional_param] = params[optional_param]

        # Make API request (synchronous with requests.Session)
        # HTTP client is created by context manager (__enter__)
        headers = self._build_headers()

        response = self._http_client.get(
            url,
            params=query_params,
            headers=headers,
            timeout=self.timeout
        )

        if response.status_code != 200:
            raise self._handle_http_error(response.status_code, response.text)

        data = response.json()

        # Check API status
        if data.get('status') != 'OK' and data.get('status') != 'ZERO_RESULTS':
            if data.get('status') == 'REQUEST_DENIED':
                raise ExternalServiceAuthError(
                    f"API request denied: {data.get('error_message', 'Unknown error')}"
                )
            elif data.get('status') == 'OVER_QUERY_LIMIT':
                raise ExternalServiceQuotaError(
                    f"API quota exceeded: {data.get('error_message', 'Unknown error')}"
                )
            else:
                raise ExternalServiceError(
                    f"API error ({data.get('status')}): {data.get('error_message', 'Unknown error')}"
                )

        return data

    def _text_search(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Search places by text query synchronously.

        Required params:
        - query: Text query (e.g., "hospitals in New York")

        Optional params:
        - location: "lat,lng" to bias results
        - radius: Search radius in meters (requires location)
        - type: Place type filter
        - language: Language code for results

        Returns:
            Dict with 'results' list and 'status'
        """
        # Validate required parameters
        if 'query' not in params:
            raise ExternalServiceError("Missing required parameter: query")

        # Build request URL
        url = f"{self.base_url}/textsearch/json"

        # Build query parameters
        query_params = {
            'query': params['query'],
            'key': self.api_key
        }

        # Add optional parameters
        for optional_param in ['location', 'radius', 'type', 'language']:
            if optional_param in params:
                query_params[optional_param] = params[optional_param]

        # Make API request (synchronous with requests.Session)
        # HTTP client is created by context manager (__enter__)
        headers = self._build_headers()

        response = self._http_client.get(
            url,
            params=query_params,
            headers=headers,
            timeout=self.timeout
        )

        if response.status_code != 200:
            raise self._handle_http_error(response.status_code, response.text)

        data = response.json()

        # Check API status (same as nearby_search)
        if data.get('status') != 'OK' and data.get('status') != 'ZERO_RESULTS':
            if data.get('status') == 'REQUEST_DENIED':
                raise ExternalServiceAuthError(
                    f"API request denied: {data.get('error_message', 'Unknown error')}"
                )
            elif data.get('status') == 'OVER_QUERY_LIMIT':
                raise ExternalServiceQuotaError(
                    f"API quota exceeded: {data.get('error_message', 'Unknown error')}"
                )
            else:
                raise ExternalServiceError(
                    f"API error ({data.get('status')}): {data.get('error_message', 'Unknown error')}"
                )

        return data

    def _place_details(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get detailed information about a specific place synchronously.

        Required params:
        - place_id: Google Place ID

        Optional params:
        - fields: Comma-separated list of fields to return
        - language: Language code for results

        Returns:
            Dict with 'result' (single place) and 'status'
        """
        # Validate required parameters
        if 'place_id' not in params:
            raise ExternalServiceError("Missing required parameter: place_id")

        # Build request URL
        url = f"{self.base_url}/details/json"

        # Build query parameters
        query_params = {
            'place_id': params['place_id'],
            'key': self.api_key
        }

        # Add optional parameters
        for optional_param in ['fields', 'language']:
            if optional_param in params:
                query_params[optional_param] = params[optional_param]

        # Make API request (synchronous with requests.Session)
        # HTTP client is created by context manager (__enter__)
        headers = self._build_headers()

        response = self._http_client.get(
            url,
            params=query_params,
            headers=headers,
            timeout=self.timeout
        )

        if response.status_code != 200:
            raise self._handle_http_error(response.status_code, response.text)

        data = response.json()

        # Check API status
        if data.get('status') != 'OK':
            if data.get('status') == 'REQUEST_DENIED':
                raise ExternalServiceAuthError(
                    f"API request denied: {data.get('error_message', 'Unknown error')}"
                )
            elif data.get('status') == 'OVER_QUERY_LIMIT':
                raise ExternalServiceQuotaError(
                    f"API quota exceeded: {data.get('error_message', 'Unknown error')}"
                )
            elif data.get('status') == 'NOT_FOUND':
                raise ExternalServiceError(f"Place not found: {params['place_id']}")
            else:
                raise ExternalServiceError(
                    f"API error ({data.get('status')}): {data.get('error_message', 'Unknown error')}"
                )

        return data


# Register service with global registry
service_registry.register(GooglePlacesService)
