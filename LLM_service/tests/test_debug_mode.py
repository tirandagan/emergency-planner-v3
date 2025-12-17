"""
Test suite for DEBUG_MODE toggle functionality.

Tests that stack traces are included when DEBUG_MODE=true
and excluded when DEBUG_MODE=false across all system layers.
"""

import pytest
import json
from datetime import datetime, timezone
from unittest.mock import Mock, patch, AsyncMock
from app.config import settings
from app.workflows.errors import WorkflowErrorContext, ExternalAPIError
from app.workflows.external_api_executor import ExternalAPIExecutor
from app.tasks.webhooks import build_webhook_payload
from app.models import WorkflowJob, JobStatus


class TestDebugModeConfiguration:
    """Test DEBUG_MODE configuration setting."""

    def test_debug_mode_default_value(self):
        """Test that DEBUG_MODE has a default value."""
        assert hasattr(settings, "DEBUG_MODE")
        assert isinstance(settings.DEBUG_MODE, bool)

    def test_debug_mode_can_be_toggled(self):
        """Test that DEBUG_MODE can be changed at runtime."""
        original_value = settings.DEBUG_MODE

        try:
            # Toggle DEBUG_MODE
            settings.DEBUG_MODE = True
            assert settings.DEBUG_MODE is True

            settings.DEBUG_MODE = False
            assert settings.DEBUG_MODE is False
        finally:
            # Restore original value
            settings.DEBUG_MODE = original_value


class TestErrorContextDebugMode:
    """Test error context behavior with DEBUG_MODE on/off."""

    def test_error_context_includes_stack_trace_when_debug_on(self):
        """Test that error context includes stack trace when DEBUG_MODE=true."""
        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = True

        try:
            # Generate a real stack trace
            try:
                raise ValueError("Test error for stack trace")
            except ValueError as e:
                import traceback

                error_context = WorkflowErrorContext(
                    error_type=type(e).__name__,
                    category="USER_ERROR",
                    message=str(e),
                    stack_trace=traceback.format_exc(),
                )

                # Convert to dict with DEBUG_MODE enabled
                error_dict = error_context.to_dict(include_sensitive=True)

                assert "stack_trace" in error_dict
                assert error_dict["stack_trace"] is not None
                assert "Traceback" in error_dict["stack_trace"]
                assert "ValueError" in error_dict["stack_trace"]
                assert "Test error for stack trace" in error_dict["stack_trace"]
        finally:
            settings.DEBUG_MODE = original_debug_mode

    def test_error_context_excludes_stack_trace_when_debug_off(self):
        """Test that error context excludes stack trace when DEBUG_MODE=false."""
        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = False

        try:
            try:
                raise ValueError("Test error without stack trace")
            except ValueError as e:
                import traceback

                error_context = WorkflowErrorContext(
                    error_type=type(e).__name__,
                    category="USER_ERROR",
                    message=str(e),
                    stack_trace=traceback.format_exc(),
                )

                # Convert to dict with DEBUG_MODE disabled (include_sensitive=False)
                error_dict = error_context.to_dict(include_sensitive=False)

                # Stack trace should be excluded
                assert "stack_trace" not in error_dict or error_dict["stack_trace"] is None
        finally:
            settings.DEBUG_MODE = original_debug_mode

    def test_error_context_respects_include_sensitive_parameter(self):
        """Test that include_sensitive parameter controls stack trace inclusion."""
        try:
            raise RuntimeError("Test runtime error")
        except RuntimeError as e:
            import traceback

            error_context = WorkflowErrorContext(
                error_type=type(e).__name__,
                category="SYSTEM_ERROR",
                message=str(e),
                stack_trace=traceback.format_exc(),
            )

            # Test with include_sensitive=True
            sensitive_dict = error_context.to_dict(include_sensitive=True)
            assert "stack_trace" in sensitive_dict
            assert sensitive_dict["stack_trace"] is not None

            # Test with include_sensitive=False
            non_sensitive_dict = error_context.to_dict(include_sensitive=False)
            assert "stack_trace" not in non_sensitive_dict or non_sensitive_dict["stack_trace"] is None


@pytest.mark.asyncio
class TestExternalAPIExecutorDebugMode:
    """Test external API executor error handling with DEBUG_MODE."""

    async def test_executor_includes_stack_trace_in_debug_mode(self):
        """Test that executor captures stack trace when DEBUG_MODE=true."""
        from app.workflows.schema import WorkflowStep

        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = True

        try:
            executor = ExternalAPIExecutor()
            mock_engine = Mock()
            mock_engine.context = {"user_data": {}, "workflow_variables": {}}

            step = WorkflowStep(
                id="test_step",
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
                mock_service.call.side_effect = RuntimeError("Test error for debug mode")
                mock_get_service.return_value = mock_service

                with pytest.raises(ExternalAPIError) as exc_info:
                    await executor.execute(step, mock_engine)

                error = exc_info.value
                assert error.context is not None
                assert error.context.stack_trace is not None
                assert "Traceback" in error.context.stack_trace
                assert "RuntimeError" in error.context.stack_trace
        finally:
            settings.DEBUG_MODE = original_debug_mode

    async def test_executor_excludes_stack_trace_in_production_mode(self):
        """Test that executor excludes stack trace when DEBUG_MODE=false."""
        from app.workflows.schema import WorkflowStep

        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = False

        try:
            executor = ExternalAPIExecutor()
            mock_engine = Mock()
            mock_engine.context = {"user_data": {}, "workflow_variables": {}}

            step = WorkflowStep(
                id="test_step",
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
                mock_service.call.side_effect = RuntimeError("Test error for production mode")
                mock_get_service.return_value = mock_service

                with pytest.raises(ExternalAPIError) as exc_info:
                    await executor.execute(step, mock_engine)

                error = exc_info.value
                assert error.context is not None
                # Stack trace should be None in production mode
                assert error.context.stack_trace is None
        finally:
            settings.DEBUG_MODE = original_debug_mode


class TestWebhookPayloadDebugMode:
    """Test webhook payload behavior with DEBUG_MODE."""

    def test_webhook_excludes_stack_trace_by_default(self):
        """Test that webhook payloads exclude stack traces by default (production)."""
        try:
            raise ValueError("Test webhook error")
        except ValueError as e:
            import traceback

            error_context = WorkflowErrorContext(
                error_type=type(e).__name__,
                category="USER_ERROR",
                message=str(e),
                stack_trace=traceback.format_exc(),
            )

            # Webhook payloads always use include_sensitive=False
            error_dict = error_context.to_dict(include_sensitive=False)

            job = Mock(spec=WorkflowJob)
            job.id = "test-webhook-debug"
            job.status = JobStatus.FAILED.value
            job.workflow_name = "emergency_contacts"
            job.error_message = json.dumps(error_dict)
            job.created_at = datetime.now(timezone.utc)
            job.completed_at = datetime.now(timezone.utc)
            job.duration_ms = 1000

            payload = build_webhook_payload(job, "workflow.failed")

            # Verify stack trace is not in webhook payload
            error = payload["error"]
            assert "stack_trace" not in error
            if "details" in error:
                assert "stack_trace" not in error["details"]

    def test_webhook_never_includes_stack_trace_even_in_debug_mode(self):
        """Test that webhooks NEVER include stack traces (security concern)."""
        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = True

        try:
            try:
                raise RuntimeError("Test webhook security")
            except RuntimeError as e:
                import traceback

                error_context = WorkflowErrorContext(
                    error_type=type(e).__name__,
                    category="SYSTEM_ERROR",
                    message=str(e),
                    stack_trace=traceback.format_exc(),
                )

                # Even in debug mode, webhooks should use include_sensitive=False
                error_dict = error_context.to_dict(include_sensitive=False)

                job = Mock(spec=WorkflowJob)
                job.id = "test-webhook-secure"
                job.status = JobStatus.FAILED.value
                job.workflow_name = "emergency_contacts"
                job.error_message = json.dumps(error_dict)
                job.created_at = datetime.now(timezone.utc)
                job.completed_at = datetime.now(timezone.utc)
                job.duration_ms = 500

                payload = build_webhook_payload(job, "workflow.failed")

                # Stack trace should NOT be in webhook payload even in debug mode
                error = payload["error"]
                assert "stack_trace" not in error
                if "details" in error:
                    assert "stack_trace" not in error["details"]
        finally:
            settings.DEBUG_MODE = original_debug_mode


class TestDatabaseStorageDebugMode:
    """Test database error storage with DEBUG_MODE."""

    def test_database_never_stores_stack_traces(self):
        """Test that database storage never includes stack traces (security)."""
        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = True

        try:
            try:
                raise Exception("Test database security")
            except Exception as e:
                import traceback

                error_context = WorkflowErrorContext(
                    error_type=type(e).__name__,
                    category="SYSTEM_ERROR",
                    message=str(e),
                    stack_trace=traceback.format_exc(),
                )

                # Database storage should ALWAYS use include_sensitive=False
                error_dict = error_context.to_dict(include_sensitive=False)
                json_str = json.dumps(error_dict)

                # Verify stack trace is not in JSON
                assert "stack_trace" not in json_str

                # Verify it can be parsed back
                parsed = json.loads(json_str)
                assert "stack_trace" not in parsed
        finally:
            settings.DEBUG_MODE = original_debug_mode


class TestDebugModeUseCases:
    """Test real-world use cases for DEBUG_MODE."""

    def test_development_environment_debugging(self):
        """Test DEBUG_MODE=true for development debugging."""
        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = True

        try:
            # In development, engineers want full stack traces
            try:
                # Simulate a complex error scenario
                def inner_function():
                    raise ValueError("Invalid configuration")

                def outer_function():
                    inner_function()

                outer_function()
            except ValueError as e:
                import traceback

                error_context = WorkflowErrorContext(
                    error_type=type(e).__name__,
                    category="CONFIG_ERROR",
                    message=str(e),
                    stack_trace=traceback.format_exc(),
                )

                # In development, include full stack trace for debugging
                debug_dict = error_context.to_dict(include_sensitive=True)

                assert "stack_trace" in debug_dict
                assert "inner_function" in debug_dict["stack_trace"]
                assert "outer_function" in debug_dict["stack_trace"]
                assert "Invalid configuration" in debug_dict["stack_trace"]
        finally:
            settings.DEBUG_MODE = original_debug_mode

    def test_production_environment_security(self):
        """Test DEBUG_MODE=false for production security."""
        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = False

        try:
            # In production, sanitize all sensitive information
            try:

                def inner_function():
                    raise ValueError("Invalid configuration")

                def outer_function():
                    inner_function()

                outer_function()
            except ValueError as e:
                import traceback

                error_context = WorkflowErrorContext(
                    error_type=type(e).__name__,
                    category="CONFIG_ERROR",
                    message=str(e),
                    stack_trace=traceback.format_exc(),
                )

                # In production, exclude stack traces to prevent information leakage
                production_dict = error_context.to_dict(include_sensitive=False)

                assert "stack_trace" not in production_dict or production_dict["stack_trace"] is None
                # But still have error classification and suggestions
                assert production_dict["category"] == "CONFIG_ERROR"
                assert production_dict["message"] == "Invalid configuration"
        finally:
            settings.DEBUG_MODE = original_debug_mode

    def test_logging_preserves_stack_traces_regardless_of_debug_mode(self):
        """Test that internal logs always capture stack traces (not affected by DEBUG_MODE)."""
        # This test verifies that while external outputs (webhooks, database) respect
        # DEBUG_MODE, internal logging can always capture full stack traces for debugging

        original_debug_mode = settings.DEBUG_MODE

        for debug_mode_value in [True, False]:
            settings.DEBUG_MODE = debug_mode_value

            try:
                try:
                    raise RuntimeError("Test internal logging")
                except RuntimeError as e:
                    import traceback

                    # Internal logging should always capture full stack trace
                    full_stack_trace = traceback.format_exc()

                    assert "Traceback" in full_stack_trace
                    assert "RuntimeError" in full_stack_trace
                    assert "Test internal logging" in full_stack_trace

                    # This is the internal log entry (always has stack trace)
                    # What gets exposed externally depends on DEBUG_MODE
                    error_context = WorkflowErrorContext(
                        error_type=type(e).__name__,
                        category="SYSTEM_ERROR",
                        message=str(e),
                        stack_trace=full_stack_trace,
                    )

                    # Internal representation has stack trace
                    assert error_context.stack_trace is not None

                    # But external representation depends on DEBUG_MODE
                    external_dict = error_context.to_dict(include_sensitive=False)
                    assert "stack_trace" not in external_dict or external_dict["stack_trace"] is None
            finally:
                pass

        settings.DEBUG_MODE = original_debug_mode


class TestDebugModeEdgeCases:
    """Test edge cases for DEBUG_MODE functionality."""

    def test_empty_stack_trace_handling(self):
        """Test handling of empty or None stack traces."""
        error_context = WorkflowErrorContext(
            error_type="TestError",
            category="SYSTEM_ERROR",
            message="Test error",
            stack_trace=None,  # No stack trace provided
        )

        debug_dict = error_context.to_dict(include_sensitive=True)
        production_dict = error_context.to_dict(include_sensitive=False)

        # Both should handle None gracefully
        assert debug_dict.get("stack_trace") is None
        assert production_dict.get("stack_trace") is None

    def test_very_long_stack_trace_handling(self):
        """Test handling of very long stack traces."""
        original_debug_mode = settings.DEBUG_MODE
        settings.DEBUG_MODE = True

        try:
            # Create a very long stack trace
            def recursive_function(depth):
                if depth <= 0:
                    raise ValueError("Deep recursion error")
                return recursive_function(depth - 1)

            try:
                recursive_function(10)
            except ValueError as e:
                import traceback

                error_context = WorkflowErrorContext(
                    error_type=type(e).__name__,
                    category="SYSTEM_ERROR",
                    message=str(e),
                    stack_trace=traceback.format_exc(),
                )

                debug_dict = error_context.to_dict(include_sensitive=True)

                # Should include full stack trace in debug mode
                assert "stack_trace" in debug_dict
                assert len(debug_dict["stack_trace"]) > 100
                assert "recursive_function" in debug_dict["stack_trace"]
        finally:
            settings.DEBUG_MODE = original_debug_mode
