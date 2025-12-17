"""
Test suite for webhook error payload structure and validation.

Tests webhook payload structure, backward compatibility,
error object inclusion, and JSON serialization.
"""

import pytest
import json
from datetime import datetime, timezone
from unittest.mock import Mock, patch
from app.tasks.webhooks import build_webhook_payload
from app.workflows.errors import WorkflowErrorContext, ErrorCategory
from app.models import WorkflowJob, JobStatus


class TestWebhookErrorPayloadStructure:
    """Test webhook payload structure for failed jobs."""

    def test_webhook_payload_with_structured_error(self):
        """Test webhook payload includes structured error object."""
        # Create error context
        error_context = WorkflowErrorContext(
            error_type="TimeoutError",
            category=ErrorCategory.EXTERNAL_ERROR,
            message="API request timed out",
            step_id="fetch_weather",
            service="weatherapi",
            operation="current",
            inputs={"lat": 40.7128, "lng": -74.0060},
            config={"timeout": 30, "cache_ttl": 3600},
            retryable=True,
            retry_after=30,
            suggestions=[
                "Retry the request after 30 seconds",
                "Check WeatherAPI service status",
            ],
        )

        # Create mock job with structured error
        job = Mock(spec=WorkflowJob)
        job.id = "test-job-123"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = json.dumps(error_context.to_dict(include_sensitive=False))
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 5000

        # Build webhook payload
        payload = build_webhook_payload(job, "workflow.failed")

        # Verify basic structure
        assert payload["event"] == "workflow.failed"
        assert payload["job_id"] == "test-job-123"
        assert payload["status"] == JobStatus.FAILED.value
        assert payload["workflow_name"] == "emergency_contacts"

        # Verify error object is included
        assert "error" in payload
        assert isinstance(payload["error"], dict)

        # Verify error object structure
        error = payload["error"]
        assert error["type"] == "TimeoutError"
        assert error["category"] == "EXTERNAL_ERROR"
        assert error["message"] == "API request timed out"
        assert error.get("step_id") == "fetch_weather"
        assert error.get("service") == "weatherapi" or error.get("details", {}).get("service") == "weatherapi"
        assert error.get("operation") == "current" or error.get("details", {}).get("operation") == "current"

        # Verify error details
        assert "details" in error or "inputs" in error
        if "details" in error:
            assert error["details"]["inputs"]["lat"] == 40.7128
            assert error["details"]["inputs"]["lng"] == -74.0060
            assert error["details"]["retryable"] is True
            assert error["details"]["retry_after"] == 30
        else:
            assert error["inputs"]["lat"] == 40.7128
            assert error["retryable"] is True

        # Verify suggestions
        assert "suggestions" in error or ("details" in error and "suggestions" in error["details"])
        suggestions = error.get("suggestions") or error["details"]["suggestions"]
        assert len(suggestions) == 2
        assert "retry" in suggestions[0].lower()

        # Verify backward compatibility - error_message still present
        assert "error_message" in payload
        assert payload["error_message"] == "API request timed out"

    def test_webhook_payload_without_error_details(self):
        """Test webhook payload for successful job (no error)."""
        job = Mock(spec=WorkflowJob)
        job.id = "test-job-456"
        job.status = JobStatus.COMPLETED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = None
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 3000

        payload = build_webhook_payload(job, "workflow.completed")

        assert payload["event"] == "workflow.completed"
        assert payload["job_id"] == "test-job-456"
        assert payload["status"] == JobStatus.COMPLETED.value
        assert "error" not in payload
        assert "error_message" not in payload or payload["error_message"] is None

    def test_webhook_payload_with_plain_string_error(self):
        """Test webhook payload handles legacy plain string errors."""
        job = Mock(spec=WorkflowJob)
        job.id = "test-job-789"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = "Plain string error message"  # Legacy format
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 2000

        payload = build_webhook_payload(job, "workflow.failed")

        # Should include error_message for backward compatibility
        assert payload["error_message"] == "Plain string error message"

        # Should NOT include structured error object for plain strings
        assert "error" not in payload or payload["error"] is None


class TestWebhookPayloadSerialization:
    """Test JSON serialization of webhook payloads."""

    def test_webhook_payload_json_serializable(self):
        """Test that webhook payload can be serialized to JSON."""
        error_context = WorkflowErrorContext(
            error_type="ValidationError",
            category=ErrorCategory.USER_ERROR,
            message="Invalid coordinate format",
            step_id="geocode",
            service="google_places",
            operation="geocode",
            inputs={"address": "123 Main St"},
            retryable=False,
            suggestions=["Provide valid coordinates", "Check address format"],
        )

        job = Mock(spec=WorkflowJob)
        job.id = "test-job-json"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "evacuation_route"
        job.error_message = json.dumps(error_context.to_dict(include_sensitive=False))
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 1500

        payload = build_webhook_payload(job, "workflow.failed")

        # Should be serializable to JSON
        json_str = json.dumps(payload)
        assert isinstance(json_str, str)

        # Should be parseable back to dict
        parsed = json.loads(json_str)
        assert parsed["job_id"] == "test-job-json"
        assert parsed["error"]["category"] == "USER_ERROR"

    def test_webhook_payload_datetime_serialization(self):
        """Test that datetime objects are properly serialized."""
        job = Mock(spec=WorkflowJob)
        job.id = "test-job-dt"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = "Test error"
        job.created_at = datetime(2025, 12, 16, 12, 0, 0, tzinfo=timezone.utc)
        job.completed_at = datetime(2025, 12, 16, 12, 5, 0, tzinfo=timezone.utc)
        job.duration_ms = 300000

        payload = build_webhook_payload(job, "workflow.failed")

        # Serialize to JSON
        json_str = json.dumps(payload)
        parsed = json.loads(json_str)

        # Verify datetime fields are ISO format strings
        assert isinstance(parsed["created_at"], str)
        assert "2025-12-16" in parsed["created_at"]
        assert isinstance(parsed["completed_at"], str)


class TestWebhookBackwardCompatibility:
    """Test backward compatibility with existing webhook consumers."""

    def test_existing_webhook_consumers_still_work(self):
        """Test that existing webhook consumers can still parse payloads."""
        error_context = WorkflowErrorContext(
            error_type="ConfigurationError",
            category=ErrorCategory.CONFIG_ERROR,
            message="Missing API key",
            suggestions=["Set WEATHERAPI_KEY environment variable"],
        )

        job = Mock(spec=WorkflowJob)
        job.id = "test-job-compat"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = json.dumps(error_context.to_dict(include_sensitive=False))
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 1000

        payload = build_webhook_payload(job, "workflow.failed")

        # Legacy consumers expect these fields
        assert "event" in payload
        assert "job_id" in payload
        assert "status" in payload
        assert "error_message" in payload

        # Legacy consumers can ignore the new "error" field
        assert payload["error_message"] == "Missing API key"

    def test_enhanced_webhook_consumers_get_structured_errors(self):
        """Test that enhanced consumers can access structured error data."""
        error_context = WorkflowErrorContext(
            error_type="RateLimitExceeded",
            category=ErrorCategory.EXTERNAL_ERROR,
            message="Rate limit exceeded",
            service="google_places",
            operation="nearby_search",
            retryable=True,
            retry_after=120,
            suggestions=["Wait 120 seconds before retrying", "Reduce request frequency"],
        )

        job = Mock(spec=WorkflowJob)
        job.id = "test-job-enhanced"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "evacuation_route"
        job.error_message = json.dumps(error_context.to_dict(include_sensitive=False))
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 2500

        payload = build_webhook_payload(job, "workflow.failed")

        # Enhanced consumers can check for "error" field
        assert "error" in payload
        error = payload["error"]

        # Enhanced consumers can implement retry logic based on error data
        if error.get("retryable"):
            retry_after = error.get("retry_after") or (error.get("details") or {}).get("retry_after")
            assert retry_after == 120

        # Enhanced consumers can display actionable suggestions
        suggestions = error.get("suggestions") or (error.get("details") or {}).get("suggestions", [])
        assert len(suggestions) == 2


class TestWebhookErrorCategories:
    """Test webhook payloads for different error categories."""

    def test_external_error_category(self):
        """Test webhook payload for EXTERNAL_ERROR."""
        error_context = WorkflowErrorContext(
            error_type="TimeoutError",
            category=ErrorCategory.EXTERNAL_ERROR,
            message="API timeout",
            service="weatherapi",
            retryable=True,
        )

        job = Mock(spec=WorkflowJob)
        job.id = "test-external"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = json.dumps(error_context.to_dict(include_sensitive=False))
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 5000

        payload = build_webhook_payload(job, "workflow.failed")

        assert payload["error"]["category"] == "EXTERNAL_ERROR"
        retryable = payload["error"].get("retryable") or (payload["error"].get("details") or {}).get("retryable")
        assert retryable is True

    def test_config_error_category(self):
        """Test webhook payload for CONFIG_ERROR."""
        error_context = WorkflowErrorContext(
            error_type="MissingAPIKey",
            category=ErrorCategory.CONFIG_ERROR,
            message="Missing API key",
            retryable=False,
        )

        job = Mock(spec=WorkflowJob)
        job.id = "test-config"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = json.dumps(error_context.to_dict(include_sensitive=False))
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 500

        payload = build_webhook_payload(job, "workflow.failed")

        assert payload["error"]["category"] == "CONFIG_ERROR"
        retryable = payload["error"].get("retryable") or (payload["error"].get("details") or {}).get("retryable")
        assert retryable is False

    def test_user_error_category(self):
        """Test webhook payload for USER_ERROR."""
        error_context = WorkflowErrorContext(
            error_type="ValidationError",
            category=ErrorCategory.USER_ERROR,
            message="Invalid input",
            inputs={"lat": "invalid"},
            retryable=False,
        )

        job = Mock(spec=WorkflowJob)
        job.id = "test-user"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = json.dumps(error_context.to_dict(include_sensitive=False))
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 300

        payload = build_webhook_payload(job, "workflow.failed")

        assert payload["error"]["category"] == "USER_ERROR"

    def test_system_error_category(self):
        """Test webhook payload for SYSTEM_ERROR."""
        error_context = WorkflowErrorContext(
            error_type="RuntimeError",
            category=ErrorCategory.SYSTEM_ERROR,
            message="Event loop closed",
            retryable=False,
        )

        job = Mock(spec=WorkflowJob)
        job.id = "test-system"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = json.dumps(error_context.to_dict(include_sensitive=False))
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 1000

        payload = build_webhook_payload(job, "workflow.failed")

        assert payload["error"]["category"] == "SYSTEM_ERROR"


class TestWebhookSensitiveDataHandling:
    """Test that sensitive data is properly sanitized in webhook payloads."""

    def test_api_keys_sanitized_in_webhook(self):
        """Test that API keys are redacted in webhook payloads."""
        error_context = WorkflowErrorContext(
            error_type="AuthError",
            category=ErrorCategory.CONFIG_ERROR,
            message="Invalid API key",
            inputs={"api_key": "secret123", "location": "New York"},
            config={"weatherapi_key": "secret456"},
        )

        # Sanitize before storing in database
        error_dict = error_context.to_dict(include_sensitive=False)

        job = Mock(spec=WorkflowJob)
        job.id = "test-sanitize"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = json.dumps(error_dict)
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 500

        payload = build_webhook_payload(job, "workflow.failed")

        # Verify API keys are redacted
        error = payload["error"]
        inputs = error.get("inputs") or (error.get("details") or {}).get("inputs", {})
        assert inputs.get("api_key") == "[REDACTED]"
        assert inputs.get("location") == "New York"

    def test_stack_trace_excluded_by_default(self):
        """Test that stack traces are excluded from webhook payloads by default."""
        error_context = WorkflowErrorContext(
            error_type="SystemError",
            category=ErrorCategory.SYSTEM_ERROR,
            message="Internal error",
            stack_trace="Traceback (most recent call last):\n  File test.py, line 10",
        )

        # Sanitize (include_sensitive=False is default for webhooks)
        error_dict = error_context.to_dict(include_sensitive=False)

        job = Mock(spec=WorkflowJob)
        job.id = "test-no-trace"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = json.dumps(error_dict)
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 1000

        payload = build_webhook_payload(job, "workflow.failed")

        # Stack trace should not be in payload
        error = payload["error"]
        assert "stack_trace" not in error
        details = error.get("details", {})
        assert "stack_trace" not in details


class TestWebhookPayloadCompleteness:
    """Test that webhook payloads include all required fields."""

    def test_all_required_fields_present(self):
        """Test that all required fields are present in webhook payload."""
        error_context = WorkflowErrorContext(
            error_type="TestError",
            category=ErrorCategory.EXTERNAL_ERROR,
            message="Test error",
        )

        job = Mock(spec=WorkflowJob)
        job.id = "test-complete"
        job.status = JobStatus.FAILED.value
        job.workflow_name = "emergency_contacts"
        job.error_message = json.dumps(error_context.to_dict(include_sensitive=False))
        job.created_at = datetime.now(timezone.utc)
        job.completed_at = datetime.now(timezone.utc)
        job.duration_ms = 1000

        payload = build_webhook_payload(job, "workflow.failed")

        # Required top-level fields
        required_fields = ["event", "job_id", "status", "workflow_name", "created_at", "duration_ms"]
        for field in required_fields:
            assert field in payload, f"Missing required field: {field}"

        # Required error fields
        assert "error" in payload
        error_required = ["type", "category", "message"]
        for field in error_required:
            assert field in payload["error"], f"Missing required error field: {field}"
