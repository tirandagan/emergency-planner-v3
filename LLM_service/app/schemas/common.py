"""
Common Pydantic schemas used across multiple endpoints.

Defines shared schemas for error responses and health checks.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """
    Standard error response schema.

    Example:
    {
        "error": "ValidationError",
        "message": "workflow_name must contain only alphanumeric characters",
        "detail": {
            "field": "workflow_name",
            "value": "invalid@workflow"
        }
    }
    """

    error: str = Field(
        ...,
        description="Error type or category",
        examples=["ValidationError", "NotFoundError", "ServerError"]
    )

    message: str = Field(
        ...,
        description="Human-readable error message",
        examples=["Workflow not found", "Invalid input data"]
    )

    detail: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional error details and context",
        examples=[{"field": "workflow_name", "value": "invalid@workflow"}]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "error": "ValidationError",
                    "message": "workflow_name must contain only alphanumeric characters",
                    "detail": {
                        "field": "workflow_name",
                        "value": "invalid@workflow"
                    }
                },
                {
                    "error": "NotFoundError",
                    "message": "Workflow 'unknown_workflow' not found",
                    "detail": {
                        "workflow_name": "unknown_workflow",
                        "available_workflows": ["emergency_contacts", "mission_generation"]
                    }
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """
    Health check response schema.

    Example:
    {
        "status": "healthy",
        "services": {
            "database": {"status": "healthy", "type": "postgresql"},
            "redis": {"status": "healthy"},
            "celery": {"status": "healthy", "workers": 2}
        }
    }
    """

    status: str = Field(
        ...,
        description="Overall service health status",
        examples=["healthy", "degraded", "unhealthy"]
    )

    services: Dict[str, Dict[str, Any]] = Field(
        ...,
        description="Health status of individual services",
        examples=[{
            "database": {"status": "healthy", "type": "postgresql"},
            "redis": {"status": "healthy"},
            "celery": {"status": "healthy", "workers": 2}
        }]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "healthy",
                    "services": {
                        "database": {"status": "healthy", "type": "postgresql"},
                        "redis": {"status": "healthy"},
                        "celery": {"status": "healthy", "workers": 2}
                    }
                },
                {
                    "status": "degraded",
                    "services": {
                        "database": {"status": "healthy", "type": "postgresql"},
                        "redis": {"status": "healthy"},
                        "celery": {"status": "no_workers", "workers": 0}
                    }
                }
            ]
        }
    }
