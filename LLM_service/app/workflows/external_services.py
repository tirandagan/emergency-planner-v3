"""
External Service Registry and Base Classes

Plugin-style architecture for external API services:
- Google Places (nearby_search, text_search, place_details)
- WeatherAPI (current weather)
- Future services (weather forecast, mapping, alerts, etc.)

Each service implements the ExternalService interface and registers
itself with the ExternalServiceRegistry for discovery and instantiation.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type
import httpx

from app.config import settings
from app.workflows.cache_manager import cache_manager
from app.workflows.rate_limiter import rate_limiter, RateLimitExceeded


class ExternalServiceError(Exception):
    """Base exception for external service errors."""
    pass


class ExternalServiceTimeoutError(ExternalServiceError):
    """Raised when external service request times out."""
    pass


class ExternalServiceAuthError(ExternalServiceError):
    """Raised when external service authentication fails."""
    pass


class ExternalServiceQuotaError(ExternalServiceError):
    """Raised when external service quota is exceeded."""
    pass


class ExternalServiceResponse:
    """
    Standardized response from external service.

    Attributes:
        success: Whether request succeeded
        data: Response data (service-specific structure)
        error: Error message if request failed
        cached: Whether response came from cache
        metadata: Additional metadata (API version, rate limits, etc.)
    """

    def __init__(
        self,
        success: bool,
        data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        cached: bool = False,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.success = success
        self.data = data or {}
        self.error = error
        self.cached = cached
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert response to dictionary."""
        return {
            'success': self.success,
            'data': self.data,
            'error': self.error,
            'cached': self.cached,
            'metadata': self.metadata
        }


class ExternalService(ABC):
    """
    Abstract base class for all external services.

    Subclasses must implement:
    - service_name: Unique service identifier
    - supported_operations: List of operation names
    - call(): Execute API request with caching and rate limiting
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: int = 30,
        enable_cache: bool = True,
        enable_rate_limiting: bool = True
    ):
        """
        Initialize external service.

        Args:
            api_key: API authentication key
            base_url: Base URL for API endpoints
            timeout: Request timeout in seconds
            enable_cache: Enable response caching
            enable_rate_limiting: Enable rate limiting

        Note:
            This class uses async context manager pattern for HTTP client lifecycle.
            Use `async with service_instance:` to ensure proper resource cleanup.
        """
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.enable_cache = enable_cache
        self.enable_rate_limiting = enable_rate_limiting
        # HTTP client is created in __aenter__ and cleaned up in __aexit__

    @property
    @abstractmethod
    def service_name(self) -> str:
        """Unique service identifier (e.g., 'google_places')."""
        pass

    @property
    @abstractmethod
    def supported_operations(self) -> List[str]:
        """List of supported operation names."""
        pass

    @abstractmethod
    def call(
        self,
        operation: str,
        params: Dict[str, Any],
        user_id: Optional[str] = None,
        cache_ttl: Optional[int] = None
    ) -> ExternalServiceResponse:
        """
        Execute API request synchronously.

        Note:
            Caching and rate limiting are now handled by the executor layer.
            This method focuses solely on making the HTTP request.

        Args:
            operation: Operation name (must be in supported_operations)
            params: Operation-specific parameters
            user_id: Optional user ID (passed through, not used directly)
            cache_ttl: Optional cache TTL (passed through, not used directly)

        Returns:
            ExternalServiceResponse with data or error

        Raises:
            ExternalServiceError: On API errors
        """
        pass

    def __enter__(self):
        """
        Context manager entry - creates HTTP client session for this context.

        Returns:
            Self for use in with statement

        Example:
            with WeatherAPIService() as service:
                response = service.call(...)

        Note:
            Connection pooling is disabled to avoid eventlet socket conflicts.
            Each request creates a fresh connection instead of reusing pooled ones.
        """
        import requests
        from requests.adapters import HTTPAdapter

        self._http_client = requests.Session()

        # Disable connection pooling to avoid eventlet socket conflicts
        # This prevents "Second simultaneous read on fileno" errors when
        # multiple green threads try to access the same pooled connection
        adapter = HTTPAdapter(
            pool_connections=1,  # Only 1 connection pool
            pool_maxsize=1,       # Only 1 connection in the pool
            max_retries=0,        # No automatic retries (handle in service layer)
            pool_block=False      # Don't block when pool is full
        )
        self._http_client.mount('http://', adapter)
        self._http_client.mount('https://', adapter)

        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Context manager exit - cleans up HTTP client session.

        Ensures HTTP session is properly closed even if exceptions occur.

        Returns:
            False to propagate any exception that occurred
        """
        if hasattr(self, '_http_client') and self._http_client:
            self._http_client.close()  # Synchronous close
            delattr(self, '_http_client')
        return False

    def _build_headers(self, additional_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Build HTTP headers with authentication.

        Args:
            additional_headers: Additional headers to include

        Returns:
            Complete headers dictionary
        """
        headers = {
            'User-Agent': 'LLM-Microservice/1.0',
            'Accept': 'application/json'
        }

        if additional_headers:
            headers.update(additional_headers)

        return headers

    def _handle_http_error(self, status_code: int, response_text: str) -> ExternalServiceError:
        """
        Convert HTTP error to appropriate exception.

        Args:
            status_code: HTTP status code
            response_text: Response body text

        Returns:
            Appropriate ExternalServiceError subclass
        """
        if status_code == 401 or status_code == 403:
            return ExternalServiceAuthError(f"Authentication failed: {response_text}")
        elif status_code == 429:
            return ExternalServiceQuotaError(f"API quota exceeded: {response_text}")
        elif status_code >= 500:
            return ExternalServiceError(f"Server error ({status_code}): {response_text}")
        else:
            return ExternalServiceError(f"HTTP {status_code}: {response_text}")


class ExternalServiceRegistry:
    """
    Registry for external service plugins.

    Services register themselves and can be instantiated by name.
    Supports service discovery and configuration.
    """

    def __init__(self):
        self._services: Dict[str, Type[ExternalService]] = {}

    def register(self, service_class: Type[ExternalService]) -> None:
        """
        Register an external service class.

        Args:
            service_class: Service class (must extend ExternalService)

        Raises:
            ValueError: If service name already registered
        """
        # Instantiate temporarily to get service_name
        temp_instance = service_class()
        service_name = temp_instance.service_name

        if service_name in self._services:
            raise ValueError(f"Service '{service_name}' already registered")

        self._services[service_name] = service_class

    def get_service(
        self,
        service_name: str,
        **kwargs
    ) -> ExternalService:
        """
        Get service instance by name.

        Args:
            service_name: Service identifier
            **kwargs: Arguments to pass to service constructor

        Returns:
            Instantiated service

        Raises:
            ValueError: If service not found
        """
        if service_name not in self._services:
            raise ValueError(
                f"Service '{service_name}' not found. "
                f"Available services: {list(self._services.keys())}"
            )

        service_class = self._services[service_name]
        return service_class(**kwargs)

    def list_services(self) -> List[str]:
        """Get list of registered service names."""
        return list(self._services.keys())

    def get_service_info(self, service_name: str) -> Dict[str, Any]:
        """
        Get service information.

        Args:
            service_name: Service identifier

        Returns:
            Dictionary with service metadata

        Raises:
            ValueError: If service not found
        """
        if service_name not in self._services:
            raise ValueError(f"Service '{service_name}' not found")

        service_class = self._services[service_name]
        temp_instance = service_class()

        return {
            'name': temp_instance.service_name,
            'operations': temp_instance.supported_operations,
            'class': service_class.__name__
        }


# Global service registry
service_registry = ExternalServiceRegistry()
