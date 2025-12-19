"""
Pydantic schemas for workflow submission and validation endpoints.

Defines request/response schemas for:
- POST /api/v1/workflow - Submit workflow for execution
- POST /api/v1/workflow/validate - Validate workflow without execution (dry-run)
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, HttpUrl, field_validator
from datetime import datetime


class WorkflowSubmitRequest(BaseModel):
    """
    Request schema for workflow submission.

    Example:
    {
        "workflow_name": "emergency_contacts",
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "input_data": {
            "formData": {...}
        },
        "webhook_url": "https://app.com/webhook",
        "webhook_secret": "shared_secret",
        "priority": 0
    }
    """

    workflow_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Name of workflow definition (e.g., 'emergency_contacts')",
        examples=["emergency_contacts", "mission_generation"]
    )

    user_id: Optional[str] = Field(
        None,
        description="User ID from Supabase Auth (UUID format)",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )

    input_data: Dict[str, Any] = Field(
        ...,
        description="Input data for workflow execution (workflow-specific structure)",
        examples=[{"formData": {"location": "Seattle, WA"}}]
    )

    webhook_url: HttpUrl = Field(
        ...,
        description="URL to receive webhook notification on completion (REQUIRED in Phase 7)",
        examples=["https://app.com/webhook"]
    )

    webhook_secret: Optional[str] = Field(
        None,
        min_length=8,
        max_length=255,
        description="Shared secret for HMAC webhook signature verification (uses global default if not provided)",
        examples=["shared_secret_key_123"]
    )

    priority: int = Field(
        default=0,
        ge=0,
        le=10,
        description="Job priority (0-10, higher = more urgent)",
        examples=[0, 5, 10]
    )

    debug_mode: bool = Field(
        default=False,
        description="When true, webhook payloads include full LLM prompts and debug information (Phase 7)",
        examples=[False, True]
    )

    username: Optional[str] = Field(
        None,
        max_length=255,
        description="Username of person who triggered the workflow (informational)",
        examples=["john.doe@example.com", "jane_smith"]
    )

    action: Optional[str] = Field(
        None,
        max_length=255,
        description="User activity requiring the workflow (e.g., 'generate mission report', 'add driving directions')",
        examples=["generate mission report", "add driving directions", "generate contacts"]
    )

    @field_validator('workflow_name')
    @classmethod
    def validate_workflow_name(cls, v: str) -> str:
        """Validate workflow name format."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('workflow_name must contain only alphanumeric characters, underscores, and hyphens')
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "workflow_name": "emergency_contacts",
                    "user_id": "123e4567-e89b-12d3-a456-426614174000",
                    "input_data": {
                        "formData": {
                            "location": "Seattle, WA",
                            "scenario": "earthquake"
                        }
                    },
                    "webhook_url": "https://app.com/api/webhooks/llm",
                    "webhook_secret": "shared_secret_key_123",
                    "priority": 0
                }
            ]
        }
    }


class WorkflowSubmitResponse(BaseModel):
    """
    Response schema for workflow submission.

    Example:
    {
        "job_id": "123e4567-e89b-12d3-a456-426614174000",
        "celery_task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "status": "queued",
        "estimated_wait_seconds": 5,
        "status_url": "/api/v1/status/123e4567-e89b-12d3-a456-426614174000"
    }
    """

    job_id: str = Field(
        ...,
        description="Unique job ID for status queries (UUID format)",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )

    celery_task_id: str = Field(
        ...,
        description="Celery task ID for internal tracking",
        examples=["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
    )

    status: str = Field(
        ...,
        description="Initial job status (typically 'queued')",
        examples=["queued", "pending"]
    )

    estimated_wait_seconds: Optional[int] = Field(
        None,
        description="Estimated seconds until job starts (if available)",
        examples=[5, 10, 30]
    )

    status_url: str = Field(
        ...,
        description="URL path to check job status",
        examples=["/api/v1/status/123e4567-e89b-12d3-a456-426614174000"]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "job_id": "123e4567-e89b-12d3-a456-426614174000",
                    "celery_task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                    "status": "queued",
                    "estimated_wait_seconds": 5,
                    "status_url": "/api/v1/status/123e4567-e89b-12d3-a456-426614174000"
                }
            ]
        }
    }


class WorkflowValidateRequest(BaseModel):
    """
    Request schema for workflow validation (dry-run).

    Validates workflow configuration and input data without executing.

    Example:
    {
        "workflow_name": "emergency_contacts",
        "input_data": {"formData": {...}}
    }
    """

    workflow_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Name of workflow definition to validate",
        examples=["emergency_contacts", "mission_generation"]
    )

    input_data: Dict[str, Any] = Field(
        ...,
        description="Input data to validate against workflow schema",
        examples=[{"formData": {"location": "Seattle, WA"}}]
    )

    @field_validator('workflow_name')
    @classmethod
    def validate_workflow_name(cls, v: str) -> str:
        """Validate workflow name format."""
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('workflow_name must contain only alphanumeric characters, underscores, and hyphens')
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "workflow_name": "emergency_contacts",
                    "input_data": {
                        "formData": {
                            "location": "Seattle, WA",
                            "scenario": "earthquake"
                        }
                    }
                }
            ]
        }
    }


class WorkflowValidateResponse(BaseModel):
    """
    Response schema for workflow validation.

    Example (success):
    {
        "valid": true,
        "workflow_name": "emergency_contacts",
        "estimated_tokens": 5000,
        "estimated_cost_usd": 0.15,
        "estimated_duration_seconds": 20
    }

    Example (failure):
    {
        "valid": false,
        "workflow_name": "emergency_contacts",
        "errors": [
            "Missing required field: location",
            "Invalid scenario type"
        ]
    }
    """

    valid: bool = Field(
        ...,
        description="Whether the workflow and input data are valid",
        examples=[True, False]
    )

    workflow_name: str = Field(
        ...,
        description="Name of validated workflow",
        examples=["emergency_contacts"]
    )

    errors: Optional[list[str]] = Field(
        None,
        description="Validation errors (if valid=false)",
        examples=[["Missing required field: location", "Invalid scenario type"]]
    )

    estimated_tokens: Optional[int] = Field(
        None,
        description="Estimated token consumption (if valid=true)",
        examples=[5000, 10000]
    )

    estimated_cost_usd: Optional[float] = Field(
        None,
        description="Estimated cost in USD (if valid=true)",
        examples=[0.15, 0.30]
    )

    estimated_duration_seconds: Optional[int] = Field(
        None,
        description="Estimated execution time in seconds (if valid=true)",
        examples=[20, 45, 90]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "valid": True,
                    "workflow_name": "emergency_contacts",
                    "estimated_tokens": 5000,
                    "estimated_cost_usd": 0.15,
                    "estimated_duration_seconds": 20
                },
                {
                    "valid": False,
                    "workflow_name": "emergency_contacts",
                    "errors": [
                        "Missing required field: location",
                        "Invalid scenario type"
                    ]
                }
            ]
        }
    }
