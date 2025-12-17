"""
Enhanced error handling system for workflow execution.

Provides:
- Structured error context with debugging information
- Error classification system (USER, CONFIG, SYSTEM, EXTERNAL)
- Sensitive data sanitization
- Debug mode support for development vs production
- Retry recommendations and actionable suggestions
"""

import traceback
import re
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from enum import Enum

from app.config import settings


class ErrorCategory(str, Enum):
    """Error classification categories for intelligent error handling."""
    USER_ERROR = "USER_ERROR"           # Invalid user input
    CONFIG_ERROR = "CONFIG_ERROR"       # Missing/invalid configuration
    SYSTEM_ERROR = "SYSTEM_ERROR"       # Internal system errors
    EXTERNAL_ERROR = "EXTERNAL_ERROR"   # External service failures


class WorkflowErrorContext:
    """
    Structured error context for comprehensive debugging.

    Captures all relevant information needed to debug workflow failures:
    - Error classification and type
    - Step and service context
    - Input parameters and configuration
    - Stack traces (in debug mode)
    - Retry recommendations
    - Actionable debugging suggestions

    Example:
        context = WorkflowErrorContext(
            error_type="TimeoutError",
            category=ErrorCategory.EXTERNAL_ERROR,
            message="Request timeout after 30s",
            service="weatherapi",
            operation="current",
            inputs={"lat": 40.7, "lng": -74.0},
            retryable=True,
            retry_after=60,
            suggestions=["Increase timeout", "Check network"]
        )

        error_dict = context.to_dict(include_sensitive=True)
    """

    def __init__(
        self,
        error_type: str,
        category: ErrorCategory,
        message: str,
        step_id: Optional[str] = None,
        service: Optional[str] = None,
        operation: Optional[str] = None,
        inputs: Optional[Dict[str, Any]] = None,
        config: Optional[Dict[str, Any]] = None,
        stack_trace: Optional[str] = None,
        retryable: bool = False,
        retry_after: Optional[int] = None,
        suggestions: Optional[List[str]] = None,
    ):
        self.error_type = error_type
        self.category = category
        self.message = message
        self.step_id = step_id
        self.service = service
        self.operation = operation
        self.inputs = sanitize_inputs(inputs) if inputs else None
        self.config = sanitize_config(config) if config else None
        self.stack_trace = stack_trace
        self.retryable = retryable
        self.retry_after = retry_after
        self.suggestions = suggestions or []
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """
        Convert error context to dictionary.

        Args:
            include_sensitive: If True, include stack traces and full context
                              (for debug mode). If False, sanitize for production.

        Returns:
            Dictionary with error context suitable for JSON serialization
        """
        error_dict = {
            "type": self.error_type,
            "category": self.category.value,
            "message": self.message,
            "timestamp": self.timestamp,
            "retryable": self.retryable,
        }

        if self.step_id:
            error_dict["step_id"] = self.step_id

        if self.service or self.operation or self.inputs or self.config:
            error_dict["details"] = {}

            if self.service:
                error_dict["details"]["service"] = self.service
            if self.operation:
                error_dict["details"]["operation"] = self.operation
            if self.inputs:
                error_dict["details"]["inputs"] = self.inputs
            if self.config:
                error_dict["details"]["config"] = self.config

            # Only include stack trace in debug mode
            if include_sensitive and self.stack_trace:
                # Truncate to last 50 lines to prevent huge payloads
                lines = self.stack_trace.split('\n')
                if len(lines) > 50:
                    error_dict["details"]["stack_trace"] = '\n'.join(lines[-50:])
                else:
                    error_dict["details"]["stack_trace"] = self.stack_trace

            if self.retry_after is not None:
                error_dict["details"]["retry_after"] = self.retry_after

            if self.suggestions:
                error_dict["details"]["suggestions"] = self.suggestions

        return error_dict


class WorkflowErrorBase(Exception):
    """
    Base exception class with error context support.

    All workflow exceptions should inherit from this class to ensure
    comprehensive error context is captured and propagated.
    """

    def __init__(self, message: str, context: Optional[WorkflowErrorContext] = None):
        super().__init__(message)
        self.context = context or self._build_default_context(message)

    def _build_default_context(self, message: str) -> WorkflowErrorContext:
        """Build default error context if none provided."""
        return WorkflowErrorContext(
            error_type=self.__class__.__name__,
            category=ErrorCategory.SYSTEM_ERROR,
            message=message,
            stack_trace=traceback.format_exc() if settings.DEBUG_MODE else None
        )


class ExternalAPIError(WorkflowErrorBase):
    """External API call failed."""
    pass


class ConfigurationError(WorkflowErrorBase):
    """Configuration issue (missing API key, invalid config)."""
    pass


class UserInputError(WorkflowErrorBase):
    """Invalid user input."""
    pass


class SystemError(WorkflowErrorBase):
    """System-level error (event loop, memory, etc.)."""
    pass


# Error Classification and Analysis Utilities

def classify_error(exception: Exception) -> ErrorCategory:
    """
    Classify exception into error category.

    Analyzes exception type and message to determine the most appropriate
    category for intelligent error handling and user messaging.

    Args:
        exception: Exception to classify

    Returns:
        ErrorCategory enum value
    """
    error_msg = str(exception).lower()
    error_type = type(exception).__name__

    # Configuration errors - missing or invalid configuration
    if any(keyword in error_msg for keyword in ['api key', 'missing key', 'invalid key', 'not configured', 'no api key']):
        return ErrorCategory.CONFIG_ERROR

    # User input errors - validation failures
    if any(keyword in error_msg for keyword in ['invalid input', 'validation failed', 'required field', 'bad request', 'invalid parameter']):
        return ErrorCategory.USER_ERROR

    # ValueError is typically user input validation
    if error_type == 'ValueError':
        return ErrorCategory.USER_ERROR

    # External service errors - network, timeout, HTTP errors
    if any(keyword in error_type for keyword in ['Timeout', 'Connection', 'HTTP', 'Request']):
        return ErrorCategory.EXTERNAL_ERROR

    if any(keyword in error_msg for keyword in ['timeout', 'timed out', 'connection refused', 'connection failed', 'network', 'unreachable']):
        return ErrorCategory.EXTERNAL_ERROR

    # System errors (default)
    return ErrorCategory.SYSTEM_ERROR


def is_retryable_error(exception: Exception) -> bool:
    """
    Determine if error is retryable.

    Analyzes exception to determine if the operation should be retried.
    Transient errors (timeouts, rate limits, server errors) are retryable,
    while permanent errors (auth failures, bad requests) are not.

    Args:
        exception: Exception to analyze

    Returns:
        True if error is likely transient and retryable
    """
    error_msg = str(exception).lower()
    error_type = type(exception).__name__

    # Retryable conditions
    retryable_keywords = [
        'timeout', 'timed out', 'connection', 'temporary', 'unavailable',
        'rate limit', 'too many requests', 'server error', '503', '502', '504'
    ]

    # Non-retryable conditions (higher priority)
    non_retryable_keywords = [
        'invalid key', 'authentication', 'forbidden', 'not found',
        'bad request', 'validation', '400', '401', '403', '404'
    ]

    # Check non-retryable first
    if any(keyword in error_msg for keyword in non_retryable_keywords):
        return False

    # Check error type for retryable errors (TimeoutError, ConnectionError)
    if any(keyword in error_type for keyword in ['Timeout', 'Connection']):
        return True

    # Check retryable keywords in message
    if any(keyword in error_msg for keyword in retryable_keywords):
        return True

    # HTTP 5xx errors are retryable, 4xx are not
    if 'HTTPStatusError' in error_type or 'HTTP' in error_type:
        status_match = re.search(r'\b([45]\d{2})\b', error_msg)
        if status_match:
            status_code = int(status_match.group(1))
            return status_code >= 500

    # Default: not retryable unless explicitly identified
    return False


def get_retry_after(exception: Exception) -> Optional[int]:
    """
    Extract retry-after timing from exception.

    Attempts to extract retry timing from error messages or headers.
    Useful for rate limit errors and service unavailability.

    Args:
        exception: Exception to analyze

    Returns:
        Retry-after seconds, or None if not available
    """
    error_msg = str(exception)
    error_type = type(exception).__name__

    # Check for Retry-After header value in message
    retry_match = re.search(r'retry[- ]?after[:\s]+(\d+)', error_msg, re.IGNORECASE)
    if retry_match:
        return int(retry_match.group(1))

    # Rate limit defaults
    if 'rate limit' in error_msg.lower() or '429' in error_msg:
        return 60  # Default 60 seconds for rate limits

    # Timeout defaults - check error type or message
    if 'Timeout' in error_type or 'timeout' in error_msg.lower() or 'timed out' in error_msg.lower():
        return 30  # Default 30 seconds for timeouts

    return None


def get_error_suggestions(
    exception: Exception,
    service: Optional[str] = None,
    operation: Optional[str] = None
) -> List[str]:
    """
    Generate actionable debugging suggestions based on error.

    Provides specific, actionable suggestions to help developers debug
    and resolve the error quickly.

    Args:
        exception: Exception that occurred
        service: Service name (if external API error)
        operation: Operation name (if external API error)

    Returns:
        List of debugging suggestions
    """
    suggestions = []
    error_msg = str(exception).lower()
    error_type = type(exception).__name__

    # Event loop errors - common in async/Celery environments
    if 'event loop' in error_msg or 'loop is closed' in error_msg:
        suggestions.extend([
            "Check Celery worker pool configuration (should use eventlet or gevent for async operations)",
            "Verify async HTTP client is properly initialized and closed",
            "Review worker restart policies in Celery configuration",
            "Ensure async operations are properly awaited before event loop closes"
        ])

    # Authentication errors
    if any(keyword in error_msg for keyword in ['api key', 'authentication', 'unauthorized', '401', '403']):
        suggestions.extend([
            f"Verify {service.upper() if service else 'API'} key is set in environment variables",
            "Check API key permissions and quota limits",
            "Ensure API key format is correct (no extra spaces or quotes)",
            "Verify API key is not expired or revoked"
        ])

    # Rate limit errors
    if 'rate limit' in error_msg or '429' in error_msg:
        suggestions.extend([
            "Wait for rate limit reset period before retrying",
            "Consider implementing request throttling",
            "Check if API tier supports current request volume",
            "Review rate limit headers for reset timing"
        ])

    # Timeout errors - check error type or message
    if 'Timeout' in error_type or 'timeout' in error_msg or 'timed out' in error_msg:
        suggestions.extend([
            "Retry the request after a short delay",
            "Increase request timeout configuration",
            "Check network connectivity to external service",
            "Verify external service status and response times",
            "Consider implementing retry logic with exponential backoff"
        ])

    # Connection errors
    if 'connection' in error_msg:
        suggestions.extend([
            "Verify network connectivity to service endpoint",
            "Check firewall and security group settings",
            "Ensure service endpoint URL is correct",
            "Verify DNS resolution for service hostname"
        ])

    # Validation errors
    if 'validation' in error_msg or 'invalid' in error_msg:
        suggestions.extend([
            "Review input parameters for correct format and required fields",
            "Check API documentation for parameter requirements",
            "Verify data types match expected formats"
        ])

    # Server errors
    if any(keyword in error_msg for keyword in ['500', '502', '503', '504', 'server error']):
        suggestions.extend([
            "Retry request after short delay",
            "Check external service status page",
            "Contact service provider if issue persists"
        ])

    # Service-specific suggestions
    if service == 'google_places':
        suggestions.append("Verify Google Places API is enabled in Google Cloud Console")
        suggestions.append("Check Google Cloud project quota and billing status")
    elif service == 'weatherapi':
        suggestions.append("Check WeatherAPI subscription status and quota")
        suggestions.append("Verify location parameters are valid coordinates")

    return suggestions


# Data Sanitization Utilities

def sanitize_inputs(inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize input parameters by removing sensitive data.

    Removes API keys, tokens, credentials, and truncates very long values
    to prevent logging sensitive information or creating huge error payloads.

    Args:
        inputs: Input parameters dictionary

    Returns:
        Sanitized inputs dictionary
    """
    if not inputs:
        return {}

    # Fields to completely redact
    sensitive_fields = {
        'key', 'api_key', 'apikey', 'api', 'token', 'secret', 'password',
        'credential', 'credentials', 'auth', 'authorization', 'bearer',
        'access_token', 'refresh_token', 'private_key', 'client_secret'
    }

    sanitized = {}
    for key, value in inputs.items():
        key_lower = key.lower()

        # Remove sensitive fields entirely
        if any(sensitive in key_lower for sensitive in sensitive_fields):
            sanitized[key] = "[REDACTED]"
        # Truncate very long values
        elif isinstance(value, str) and len(value) > 200:
            sanitized[key] = value[:200] + "...[truncated]"
        # Recursively sanitize nested dictionaries
        elif isinstance(value, dict):
            sanitized[key] = sanitize_inputs(value)
        else:
            sanitized[key] = value

    return sanitized


def sanitize_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize configuration by removing sensitive data.

    Args:
        config: Configuration dictionary

    Returns:
        Sanitized configuration dictionary
    """
    return sanitize_inputs(config)  # Same sanitization logic
