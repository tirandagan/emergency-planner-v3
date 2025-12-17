"""
Test suite for error handling system.

Tests custom exception classes, error context generation,
error classification, and error utility functions.
"""

import pytest
import json
from datetime import datetime, timezone
from app.workflows.errors import (
    WorkflowErrorContext,
    WorkflowErrorBase,
    ExternalAPIError,
    ConfigurationError,
    UserInputError,
    SystemError,
    ErrorCategory,
    classify_error,
    is_retryable_error,
    get_retry_after,
    get_error_suggestions,
    sanitize_inputs,
    sanitize_config,
)


class TestWorkflowErrorContext:
    """Test WorkflowErrorContext data structure."""

    def test_basic_error_context_creation(self):
        """Test creating a basic error context."""
        context = WorkflowErrorContext(
            error_type="TestError",
            category=ErrorCategory.SYSTEM_ERROR,
            message="Test error message",
            step_id="test_step",
            service="test_service",
            operation="test_operation",
        )

        assert context.error_type == "TestError"
        assert context.category == ErrorCategory.SYSTEM_ERROR
        assert context.message == "Test error message"
        assert context.step_id == "test_step"
        assert context.service == "test_service"
        assert context.operation == "test_operation"
        assert context.retryable is False
        assert context.retry_after is None
        assert context.suggestions == []
        assert isinstance(context.timestamp, str)

    def test_error_context_with_inputs_and_config(self):
        """Test error context with input parameters and configuration."""
        context = WorkflowErrorContext(
            error_type="TestError",
            category=ErrorCategory.USER_ERROR,
            message="Invalid input",
            inputs={"lat": 40.7128, "lng": -74.0060},
            config={"timeout": 30, "retries": 3},
        )

        assert context.inputs == {"lat": 40.7128, "lng": -74.0060}
        assert context.config == {"timeout": 30, "retries": 3}

    def test_error_context_to_dict_non_sensitive(self):
        """Test converting error context to dictionary (non-sensitive)."""
        context = WorkflowErrorContext(
            error_type="TestError",
            category=ErrorCategory.CONFIG_ERROR,
            message="Missing API key",
            step_id="api_call",
            service="weatherapi",
            operation="current",
            inputs={"location": "New York"},
            config={"api_key": "secret123", "timeout": 30},
            stack_trace="Traceback (most recent call last):\n  File test.py, line 10",
            retryable=False,
            suggestions=["Check API key configuration"],
        )

        result = context.to_dict(include_sensitive=False)

        assert result["type"] == "TestError"
        assert result["category"] == "CONFIG_ERROR"
        assert result["message"] == "Missing API key"
        assert result["step_id"] == "api_call"
        assert result["details"]["service"] == "weatherapi"
        assert result["details"]["operation"] == "current"
        assert result["details"]["inputs"] == {"location": "New York"}
        # api_key should be sanitized to [REDACTED]
        assert result["details"]["config"] == {"api_key": "[REDACTED]", "timeout": 30}
        assert "stack_trace" not in result  # Should be excluded in non-sensitive mode
        assert result["retryable"] is False
        assert result["details"]["suggestions"] == ["Check API key configuration"]
        assert "timestamp" in result

    def test_error_context_to_dict_sensitive(self):
        """Test converting error context to dictionary (sensitive mode)."""
        context = WorkflowErrorContext(
            error_type="TestError",
            category=ErrorCategory.SYSTEM_ERROR,
            message="Event loop closed",
            service="test_service",  # Need at least one field to create details section
            stack_trace="Traceback (most recent call last):\n  File test.py, line 10",
        )

        result = context.to_dict(include_sensitive=True)

        assert "details" in result
        assert "stack_trace" in result["details"]
        assert result["details"]["stack_trace"] == "Traceback (most recent call last):\n  File test.py, line 10"

    def test_error_context_json_serializable(self):
        """Test that error context can be serialized to JSON."""
        context = WorkflowErrorContext(
            error_type="TestError",
            category=ErrorCategory.EXTERNAL_ERROR,
            message="API timeout",
            retryable=True,
            retry_after=60,
        )

        result = context.to_dict(include_sensitive=False)
        json_str = json.dumps(result)

        assert isinstance(json_str, str)
        parsed = json.loads(json_str)
        assert parsed["type"] == "TestError"  # Implementation uses "type" not "error_type"
        assert parsed["retryable"] is True


class TestCustomExceptions:
    """Test custom exception classes."""

    def test_external_api_error(self):
        """Test ExternalAPIError exception."""
        context = WorkflowErrorContext(
            error_type="TimeoutError",
            category=ErrorCategory.EXTERNAL_ERROR,
            message="API request timed out",
            service="weatherapi",
            operation="current",
            retryable=True,
            retry_after=30,
        )

        error = ExternalAPIError("External API call failed", context=context)

        assert str(error) == "External API call failed"
        assert error.context is context
        assert error.context.category == ErrorCategory.EXTERNAL_ERROR
        assert error.context.retryable is True

    def test_configuration_error(self):
        """Test ConfigurationError exception."""
        context = WorkflowErrorContext(
            error_type="MissingAPIKey",
            category=ErrorCategory.CONFIG_ERROR,
            message="WEATHERAPI_KEY not set",
            suggestions=["Set WEATHERAPI_KEY environment variable"],
        )

        error = ConfigurationError("Configuration issue detected", context=context)

        assert str(error) == "Configuration issue detected"
        assert error.context.category == ErrorCategory.CONFIG_ERROR
        assert len(error.context.suggestions) == 1

    def test_user_input_error(self):
        """Test UserInputError exception."""
        context = WorkflowErrorContext(
            error_type="ValidationError",
            category=ErrorCategory.USER_ERROR,
            message="Invalid latitude value",
            inputs={"lat": "not_a_number", "lng": -74.0060},
        )

        error = UserInputError("Invalid user input", context=context)

        assert error.context.category == ErrorCategory.USER_ERROR
        assert error.context.inputs["lat"] == "not_a_number"

    def test_system_error(self):
        """Test SystemError exception."""
        context = WorkflowErrorContext(
            error_type="RuntimeError",
            category=ErrorCategory.SYSTEM_ERROR,
            message="Event loop is closed",
            suggestions=["Check Celery worker pool configuration"],
        )

        error = SystemError("System-level error occurred", context=context)

        assert error.context.category == ErrorCategory.SYSTEM_ERROR

    def test_error_without_context(self):
        """Test creating error without explicit context (uses default)."""
        error = ExternalAPIError("API call failed")

        assert error.context is not None
        assert error.context.error_type == "ExternalAPIError"
        assert error.context.message == "API call failed"


class TestErrorClassification:
    """Test error classification utilities."""

    def test_classify_timeout_error(self):
        """Test classification of timeout errors."""
        import asyncio

        error = asyncio.TimeoutError("Request timed out")
        category = classify_error(error)

        assert category == ErrorCategory.EXTERNAL_ERROR

    def test_classify_key_error(self):
        """Test classification of KeyError (configuration error)."""
        error = KeyError("missing api key: WEATHERAPI_KEY")
        category = classify_error(error)

        assert category == ErrorCategory.CONFIG_ERROR

    def test_classify_value_error(self):
        """Test classification of ValueError (user input error)."""
        error = ValueError("invalid coordinate format")
        category = classify_error(error)

        assert category == ErrorCategory.USER_ERROR

    def test_classify_runtime_error(self):
        """Test classification of RuntimeError (system error)."""
        error = RuntimeError("Event loop is closed")
        category = classify_error(error)

        assert category == ErrorCategory.SYSTEM_ERROR

    def test_classify_generic_exception(self):
        """Test classification of generic Exception."""
        error = Exception("Unknown error")
        category = classify_error(error)

        assert category == ErrorCategory.SYSTEM_ERROR  # Default fallback


class TestRetryableErrors:
    """Test retryable error detection."""

    def test_timeout_is_retryable(self):
        """Test that timeout errors are retryable."""
        import asyncio

        error = asyncio.TimeoutError("Request timed out")
        assert is_retryable_error(error) is True

    def test_connection_error_is_retryable(self):
        """Test that connection errors are retryable."""
        # Test with error message containing "connection"
        error = ConnectionError("connection failed")
        assert is_retryable_error(error) is True

    def test_value_error_not_retryable(self):
        """Test that ValueError is not retryable."""
        error = ValueError("Invalid input")
        assert is_retryable_error(error) is False

    def test_key_error_not_retryable(self):
        """Test that KeyError (config) is not retryable."""
        error = KeyError("MISSING_KEY")
        assert is_retryable_error(error) is False


class TestRetryAfter:
    """Test retry-after timing extraction."""

    def test_get_retry_after_timeout(self):
        """Test default retry-after for timeout errors."""
        import asyncio

        error = asyncio.TimeoutError("Request timed out")
        retry_after = get_retry_after(error)

        assert retry_after == 30  # Default timeout retry

    def test_get_retry_after_connection_error(self):
        """Test default retry-after for connection errors."""
        # Connection errors don't have retry_after by default
        error = ConnectionError("connection failed")
        retry_after = get_retry_after(error)

        assert retry_after is None  # Connection errors don't have default retry_after

    def test_get_retry_after_non_retryable(self):
        """Test retry-after for non-retryable errors."""
        error = ValueError("Invalid input")
        retry_after = get_retry_after(error)

        assert retry_after is None


class TestErrorSuggestions:
    """Test error suggestion generation."""

    def test_suggestions_for_weatherapi_timeout(self):
        """Test suggestions for WeatherAPI timeout."""
        import asyncio

        error = asyncio.TimeoutError("Request timed out")
        suggestions = get_error_suggestions(error, "weatherapi", "current")

        assert isinstance(suggestions, list)
        assert len(suggestions) > 0
        assert any("retry" in s.lower() for s in suggestions)

    def test_suggestions_for_google_places_auth_error(self):
        """Test suggestions for Google Places authentication error."""
        error = KeyError("missing api key: GOOGLE_PLACES_API_KEY")
        suggestions = get_error_suggestions(error, "google_places", "nearby_search")

        assert any("api key" in s.lower() for s in suggestions)

    def test_suggestions_for_validation_error(self):
        """Test suggestions for validation errors."""
        error = ValueError("Invalid coordinate")
        suggestions = get_error_suggestions(error, "any_service", "any_operation")

        assert any("valid" in s.lower() or "check" in s.lower() for s in suggestions)

    def test_suggestions_for_unknown_error(self):
        """Test suggestions for unknown errors."""
        error = Exception("Unknown error")
        suggestions = get_error_suggestions(error, "unknown_service", "unknown_op")

        assert isinstance(suggestions, list)
        # Should provide generic fallback suggestions


class TestInputSanitization:
    """Test input parameter sanitization."""

    def test_sanitize_api_key(self):
        """Test that API keys are sanitized."""
        inputs = {
            "api_key": "secret123",
            "location": "New York",
            "lat": 40.7128,
        }

        sanitized = sanitize_inputs(inputs)

        assert sanitized["api_key"] == "[REDACTED]"
        assert sanitized["location"] == "New York"
        assert sanitized["lat"] == 40.7128

    def test_sanitize_token(self):
        """Test that tokens are sanitized."""
        inputs = {
            "access_token": "bearer_xyz123",
            "query": "hospitals",
        }

        sanitized = sanitize_inputs(inputs)

        assert sanitized["access_token"] == "[REDACTED]"
        assert sanitized["query"] == "hospitals"

    def test_sanitize_password(self):
        """Test that passwords are sanitized."""
        inputs = {
            "password": "mypassword",
            "username": "testuser",
        }

        sanitized = sanitize_inputs(inputs)

        assert sanitized["password"] == "[REDACTED]"
        assert sanitized["username"] == "testuser"

    def test_sanitize_secret(self):
        """Test that secrets are sanitized."""
        inputs = {
            "client_secret": "secret_value",
            "client_id": "client123",
        }

        sanitized = sanitize_inputs(inputs)

        assert sanitized["client_secret"] == "[REDACTED]"
        assert sanitized["client_id"] == "client123"

    def test_sanitize_nested_dict(self):
        """Test sanitization of nested dictionaries.

        Note: Fields named 'auth' are completely redacted for security.
        To test recursive sanitization, use non-sensitive field names.
        """
        inputs = {
            "auth": {
                "api_key": "secret123",
                "user": "testuser",
            },
            "metadata": {  # Non-sensitive field name for recursive test
                "api_key": "secret456",
                "location": "New York",
            },
        }

        sanitized = sanitize_inputs(inputs)

        # Fields named "auth" are completely redacted (more secure)
        assert sanitized["auth"] == "[REDACTED]"

        # Other nested dicts are recursively sanitized
        assert sanitized["metadata"]["api_key"] == "[REDACTED]"
        assert sanitized["metadata"]["location"] == "New York"

    def test_sanitize_none_inputs(self):
        """Test sanitization with None inputs."""
        sanitized = sanitize_inputs(None)
        assert sanitized == {}


class TestConfigSanitization:
    """Test configuration sanitization."""

    def test_sanitize_config_api_key(self):
        """Test that API keys in config are sanitized."""
        config = {
            "api_key": "secret123",
            "timeout": 30,
            "retries": 3,
        }

        sanitized = sanitize_config(config)

        assert sanitized["api_key"] == "[REDACTED]"
        assert sanitized["timeout"] == 30
        assert sanitized["retries"] == 3

    def test_sanitize_config_none(self):
        """Test sanitization with None config."""
        sanitized = sanitize_config(None)
        assert sanitized == {}


class TestErrorUtilities:
    """Test error utility functions."""

    def test_create_full_error_context_from_exception(self):
        """Test creating complete error context from an exception."""
        try:
            raise ValueError("Invalid coordinate format")
        except ValueError as e:
            import traceback

            context = WorkflowErrorContext(
                error_type=type(e).__name__,
                category=classify_error(e),
                message=str(e),
                step_id="geocode",
                service="google_places",
                operation="geocode",
                inputs={"address": "123 Main St"},
                stack_trace=traceback.format_exc(),
                retryable=is_retryable_error(e),
                retry_after=get_retry_after(e),
                suggestions=get_error_suggestions(e, "google_places", "geocode"),
            )

            assert context.error_type == "ValueError"
            assert context.category == ErrorCategory.USER_ERROR
            assert context.message == "Invalid coordinate format"
            assert context.step_id == "geocode"
            assert context.retryable is False
            assert "Traceback" in context.stack_trace
            assert len(context.suggestions) > 0


# Test utilities for other test files
class ErrorTestHelpers:
    """Helper utilities for error testing."""

    @staticmethod
    def create_timeout_error():
        """Create a timeout error for testing."""
        import asyncio

        return asyncio.TimeoutError("Request timed out")

    @staticmethod
    def create_connection_error():
        """Create a connection error for testing."""
        import aiohttp

        return aiohttp.ClientConnectionError()

    @staticmethod
    def create_validation_error():
        """Create a validation error for testing."""
        return ValueError("Invalid input parameters")

    @staticmethod
    def create_config_error():
        """Create a configuration error for testing."""
        return KeyError("MISSING_API_KEY")

    @staticmethod
    def create_error_context_with_all_fields():
        """Create a complete error context with all fields populated."""
        return WorkflowErrorContext(
            error_type="TimeoutError",
            category=ErrorCategory.EXTERNAL_ERROR,
            message="API request timed out",
            step_id="fetch_weather",
            service="weatherapi",
            operation="current",
            inputs={"lat": 40.7128, "lng": -74.0060},
            config={"timeout": 30, "cache_ttl": 3600},
            stack_trace="Traceback (most recent call last):\n  File test.py, line 10",
            retryable=True,
            retry_after=30,
            suggestions=[
                "Retry the request after 30 seconds",
                "Check WeatherAPI service status",
                "Verify network connectivity",
            ],
        )
