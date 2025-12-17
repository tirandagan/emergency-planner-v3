"""
Test suite for external API error handling scenarios.

Tests timeout errors, authentication errors, rate limit errors,
network errors, and error context propagation in external_api_executor.
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, Mock, patch
from app.workflows.external_api_executor import ExternalAPIExecutor
from app.workflows.external_services import (
    ExternalServiceError,
    RateLimitExceeded,
)
from app.workflows.errors import (
    ExternalAPIError,
    ConfigurationError,
    UserInputError,
    SystemError,
)
from app.workflows.engine import WorkflowEngine
from app.config import settings


@pytest.fixture
def mock_workflow_engine():
    """Create a mock workflow engine for testing."""
    engine = Mock(spec=WorkflowEngine)
    engine.context = {
        "user_data": {"location": "New York"},
        "workflow_variables": {},
    }
    return engine


@pytest.fixture
def external_api_executor():
    """Create an external API executor for testing."""
    return ExternalAPIExecutor()


@pytest.mark.asyncio
class TestTimeoutErrors:
    """Test timeout error handling in external API calls."""

    async def test_timeout_error_with_context(self, external_api_executor, mock_workflow_engine):
        """Test that timeout errors include full error context."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "error_mode": "fail",
            },
        )

        # Mock the service to raise a timeout error
        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = asyncio.TimeoutError("Request timed out")
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context is not None
            assert error.context.error_type == "TimeoutError"
            assert error.context.category == "EXTERNAL_ERROR"
            assert error.context.service == "weatherapi"
            assert error.context.operation == "current"
            assert error.context.step_id == "fetch_weather"
            assert error.context.retryable is True
            assert error.context.retry_after is not None
            assert len(error.context.suggestions) > 0
            assert "retry" in " ".join(error.context.suggestions).lower()

    async def test_timeout_error_continue_mode(self, external_api_executor, mock_workflow_engine):
        """Test timeout error handling with error_mode='continue'."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "error_mode": "continue",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = asyncio.TimeoutError("Request timed out")
            mock_get_service.return_value = mock_service

            result = await external_api_executor.execute(step, mock_workflow_engine)

            assert result["success"] is False
            assert "error" in result
            assert "error_context" in result
            assert result["error_context"]["category"] == "EXTERNAL_ERROR"
            assert result["error_context"]["retryable"] is True


@pytest.mark.asyncio
class TestAuthenticationErrors:
    """Test authentication and authorization error handling."""

    async def test_missing_api_key_error(self, external_api_executor, mock_workflow_engine):
        """Test error handling when API key is missing."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "error_mode": "fail",
            },
        )

        # Mock the service to raise a KeyError for missing API key
        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = KeyError("WEATHERAPI_KEY")
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.category == "CONFIG_ERROR"
            assert error.context.retryable is False
            assert "api key" in " ".join(error.context.suggestions).lower()

    async def test_invalid_api_key_error(self, external_api_executor, mock_workflow_engine):
        """Test error handling when API key is invalid."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="search_places",
            type="external_api",
            config={
                "service": "google_places",
                "operation": "nearby_search",
                "params": {"location": "40.7128,-74.0060", "radius": "5000"},
                "error_mode": "fail",
            },
        )

        # Mock the service to raise an authentication error
        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            auth_error = ExternalServiceError("Invalid API key", status_code=401)
            mock_service.call.side_effect = auth_error
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.category in ["CONFIG_ERROR", "EXTERNAL_ERROR"]
            assert "api key" in error.context.message.lower() or "authentication" in error.context.message.lower()


@pytest.mark.asyncio
class TestRateLimitErrors:
    """Test rate limit error handling."""

    async def test_rate_limit_exceeded_with_retry_after(self, external_api_executor, mock_workflow_engine):
        """Test rate limit error includes retry-after timing."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="search_places",
            type="external_api",
            config={
                "service": "google_places",
                "operation": "nearby_search",
                "params": {"location": "40.7128,-74.0060", "radius": "5000"},
                "error_mode": "fail",
            },
        )

        # Mock the service to raise a rate limit error
        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            rate_limit_error = RateLimitExceeded("Rate limit exceeded", retry_after=60)
            mock_service.call.side_effect = rate_limit_error
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.category == "EXTERNAL_ERROR"
            assert error.context.retryable is True
            assert error.context.retry_after == 60
            assert any("60" in s for s in error.context.suggestions)

    async def test_rate_limit_without_retry_after(self, external_api_executor, mock_workflow_engine):
        """Test rate limit error without explicit retry-after."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "error_mode": "fail",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            rate_limit_error = RateLimitExceeded("Too many requests")
            mock_service.call.side_effect = rate_limit_error
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.retryable is True
            # Should have default retry-after value
            assert error.context.retry_after is not None


@pytest.mark.asyncio
class TestNetworkErrors:
    """Test network-related error handling."""

    async def test_connection_error(self, external_api_executor, mock_workflow_engine):
        """Test connection error handling."""
        from app.workflows.schema import WorkflowStep
        import aiohttp

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "error_mode": "fail",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = aiohttp.ClientConnectionError()
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.category == "EXTERNAL_ERROR"
            assert error.context.retryable is True
            assert "network" in " ".join(error.context.suggestions).lower() or "connection" in " ".join(
                error.context.suggestions
            ).lower()

    async def test_dns_resolution_error(self, external_api_executor, mock_workflow_engine):
        """Test DNS resolution error handling."""
        from app.workflows.schema import WorkflowStep
        import aiohttp

        step = WorkflowStep(
            id="search_places",
            type="external_api",
            config={
                "service": "google_places",
                "operation": "nearby_search",
                "params": {"location": "40.7128,-74.0060"},
                "error_mode": "fail",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = aiohttp.ClientConnectorError(
                connection_key=None, os_error=OSError("Name or service not known")
            )
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.category == "EXTERNAL_ERROR"
            assert error.context.retryable is True


@pytest.mark.asyncio
class TestValidationErrors:
    """Test user input validation error handling."""

    async def test_invalid_input_parameters(self, external_api_executor, mock_workflow_engine):
        """Test handling of invalid input parameters."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="search_places",
            type="external_api",
            config={
                "service": "google_places",
                "operation": "nearby_search",
                "params": {"location": "invalid_format", "radius": "not_a_number"},
                "error_mode": "fail",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = ValueError("Invalid location format")
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.category == "USER_ERROR"
            assert error.context.retryable is False
            assert "valid" in " ".join(error.context.suggestions).lower()

    async def test_missing_required_parameter(self, external_api_executor, mock_workflow_engine):
        """Test handling of missing required parameters."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {},  # Missing required lat/lng
                "error_mode": "fail",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = KeyError("lat")
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            # Could be CONFIG_ERROR or USER_ERROR depending on classification
            assert error.context.category in ["CONFIG_ERROR", "USER_ERROR"]


@pytest.mark.asyncio
class TestSystemErrors:
    """Test system-level error handling."""

    async def test_event_loop_closed_error(self, external_api_executor, mock_workflow_engine):
        """Test handling of event loop closure."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "error_mode": "fail",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = RuntimeError("Event loop is closed")
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.category == "SYSTEM_ERROR"
            assert error.context.retryable is False
            assert any("celery" in s.lower() or "worker" in s.lower() for s in error.context.suggestions)

    async def test_memory_error(self, external_api_executor, mock_workflow_engine):
        """Test handling of memory errors."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="process_large_data",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "forecast",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "error_mode": "fail",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = MemoryError("Out of memory")
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.category == "SYSTEM_ERROR"


@pytest.mark.asyncio
class TestErrorContextPropagation:
    """Test that error context is properly propagated through all layers."""

    async def test_error_context_includes_inputs(self, external_api_executor, mock_workflow_engine):
        """Test that error context includes sanitized input parameters."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {
                    "lat": "40.7128",
                    "lng": "-74.0060",
                    "api_key": "secret123",  # Should be sanitized
                },
                "error_mode": "fail",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = asyncio.TimeoutError()
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.inputs is not None
            assert error.context.inputs["lat"] == "40.7128"
            assert error.context.inputs["lng"] == "-74.0060"
            assert error.context.inputs["api_key"] == "***REDACTED***"

    async def test_error_context_includes_config(self, external_api_executor, mock_workflow_engine):
        """Test that error context includes sanitized configuration."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "timeout": 30,
                "cache_ttl": 3600,
                "error_mode": "fail",
            },
        )

        with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_service.call.side_effect = asyncio.TimeoutError()
            mock_get_service.return_value = mock_service

            with pytest.raises(ExternalAPIError) as exc_info:
                await external_api_executor.execute(step, mock_workflow_engine)

            error = exc_info.value
            assert error.context.config is not None
            # Config should include step configuration details

    async def test_error_context_includes_stack_trace_in_debug_mode(
        self, external_api_executor, mock_workflow_engine
    ):
        """Test that stack trace is included when DEBUG_MODE is enabled."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "error_mode": "fail",
            },
        )

        # Enable debug mode for this test
        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = True

        try:
            with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
                mock_service = AsyncMock()
                mock_service.call.side_effect = RuntimeError("Test error")
                mock_get_service.return_value = mock_service

                with pytest.raises(ExternalAPIError) as exc_info:
                    await external_api_executor.execute(step, mock_workflow_engine)

                error = exc_info.value
                assert error.context.stack_trace is not None
                assert "Traceback" in error.context.stack_trace
        finally:
            settings.DEBUG_MODE = original_debug_mode

    async def test_error_context_excludes_stack_trace_in_production(
        self, external_api_executor, mock_workflow_engine
    ):
        """Test that stack trace is excluded when DEBUG_MODE is disabled."""
        from app.workflows.schema import WorkflowStep

        step = WorkflowStep(
            id="fetch_weather",
            type="external_api",
            config={
                "service": "weatherapi",
                "operation": "current",
                "params": {"lat": "40.7128", "lng": "-74.0060"},
                "error_mode": "fail",
            },
        )

        # Disable debug mode for this test
        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = False

        try:
            with patch("app.workflows.external_api_executor.get_external_service") as mock_get_service:
                mock_service = AsyncMock()
                mock_service.call.side_effect = RuntimeError("Test error")
                mock_get_service.return_value = mock_service

                with pytest.raises(ExternalAPIError) as exc_info:
                    await external_api_executor.execute(step, mock_workflow_engine)

                error = exc_info.value
                assert error.context.stack_trace is None
        finally:
            settings.DEBUG_MODE = original_debug_mode
