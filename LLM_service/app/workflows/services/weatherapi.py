"""
WeatherAPI.com Service

Implements current weather data retrieval.
API Documentation: https://www.weatherapi.com/docs/

Current implementation:
- current: Get current weather conditions

Future extensions:
- forecast: Multi-day weather forecast
- history: Historical weather data
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


class WeatherAPIService(ExternalService):
    """
    WeatherAPI.com service implementation.

    Operations:
    - current: Get current weather conditions for a location

    Rate Limits:
    - Per-user: 10 requests/hour
    - Global: 100 requests/hour

    Cache TTL: 7 days (but consider shorter for current weather)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.weatherapi.com/v1",
        timeout: int = 30,
        enable_cache: bool = True,
        enable_rate_limiting: bool = True
    ):
        """
        Initialize WeatherAPI service.

        Args:
            api_key: WeatherAPI.com API key (from settings if None)
            base_url: Base URL for WeatherAPI
            timeout: Request timeout in seconds
            enable_cache: Enable response caching
            enable_rate_limiting: Enable rate limiting
        """
        # Use settings if api_key not provided
        if api_key is None:
            api_key = getattr(settings, 'WEATHERAPI_API_KEY', None)

        super().__init__(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
            enable_cache=enable_cache,
            enable_rate_limiting=enable_rate_limiting
        )

    @property
    def service_name(self) -> str:
        return "weatherapi"

    @property
    def supported_operations(self) -> List[str]:
        return ["current"]  # Can extend with "forecast", "history"

    def call(
        self,
        operation: str,
        params: Dict[str, Any],
        user_id: Optional[str] = None,
        cache_ttl: Optional[int] = None
    ) -> ExternalServiceResponse:
        """
        Execute WeatherAPI request synchronously.

        Note:
            Caching and rate limiting are handled by the executor layer.
            This method focuses solely on making the HTTP request.

        Args:
            operation: Currently only "current" supported
            params: Operation-specific parameters
            user_id: Not used (passed through for executor)
            cache_ttl: Not used (passed through for executor)

        Returns:
            ExternalServiceResponse with weather data

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
            if operation == "current":
                result = self._current_weather(params)
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

    def _current_weather(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get current weather conditions synchronously.

        Required params:
        - q: Location query (lat,lng or city name)

        Optional params:
        - aqi: Include air quality data (yes/no, default: no)
        - lang: Language code for condition text

        Returns:
            Dict with 'location' and 'current' weather data
        """
        # Validate required parameters
        if 'q' not in params:
            # Try to build from lat/lng if provided
            if 'lat' in params and 'lng' in params:
                params['q'] = f"{params['lat']},{params['lng']}"
            else:
                raise ExternalServiceError(
                    "Missing required parameter: q (or lat/lng)"
                )

        # Build request URL
        url = f"{self.base_url}/current.json"

        # Build query parameters
        query_params = {
            'key': self.api_key,
            'q': params['q']
        }

        # Add optional parameters
        if 'aqi' in params:
            query_params['aqi'] = 'yes' if params['aqi'] else 'no'

        if 'lang' in params:
            query_params['lang'] = params['lang']

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
            # WeatherAPI returns specific error codes
            if response.status_code == 401:
                raise ExternalServiceAuthError(
                    "Invalid API key or API key not provided"
                )
            elif response.status_code == 403:
                raise ExternalServiceAuthError(
                    "API key has been disabled or exceeded quota"
                )
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', {}).get('message', response.text)
                    raise ExternalServiceError(f"Bad request: {error_msg}")
                except:
                    raise ExternalServiceError(f"Bad request: {response.text}")
            else:
                raise self._handle_http_error(response.status_code, response.text)

        data = response.json()

        # WeatherAPI returns error field for issues
        if 'error' in data:
            error_code = data['error'].get('code', 'unknown')
            error_message = data['error'].get('message', 'Unknown error')
            raise ExternalServiceError(
                f"WeatherAPI error ({error_code}): {error_message}"
            )

        return data


# Register service with global registry
service_registry.register(WeatherAPIService)
