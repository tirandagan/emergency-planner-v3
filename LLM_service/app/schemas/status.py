"""
Pydantic schemas for workflow status endpoint.

Defines response schema for GET /api/v1/status/{job_id}.
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


class JobStatusEnum(str, Enum):
    """Job execution status values."""
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class CostData(BaseModel):
    """LLM cost and token usage data."""

    provider: str = Field(
        ...,
        description="LLM provider name",
        examples=["openrouter", "anthropic"]
    )

    model: str = Field(
        ...,
        description="Model identifier",
        examples=["anthropic/claude-3.5-sonnet", "claude-3-5-sonnet-20241022"]
    )

    input_tokens: int = Field(
        ...,
        ge=0,
        description="Number of input tokens consumed",
        examples=[5000, 10000]
    )

    output_tokens: int = Field(
        ...,
        ge=0,
        description="Number of output tokens generated",
        examples=[3000, 5000]
    )

    total_tokens: int = Field(
        ...,
        ge=0,
        description="Total tokens (input + output)",
        examples=[8000, 15000]
    )

    cost_usd: float = Field(
        ...,
        ge=0,
        description="Total cost in USD",
        examples=[0.24, 0.45]
    )


class WorkflowStatusResponse(BaseModel):
    """
    Response schema for workflow status query.

    Example (completed):
    {
        "job_id": "123e4567-e89b-12d3-a456-426614174000",
        "status": "completed",
        "workflow_name": "emergency_contacts",
        "created_at": "2024-12-16T10:00:00Z",
        "started_at": "2024-12-16T10:00:05Z",
        "completed_at": "2024-12-16T10:00:25Z",
        "duration_ms": 20000,
        "result": {
            "contacts": [...],
            "cost_data": {
                "provider": "openrouter",
                "model": "anthropic/claude-3.5-sonnet",
                "input_tokens": 5000,
                "output_tokens": 3000,
                "total_tokens": 8000,
                "cost_usd": 0.24
            }
        },
        "error_message": null
    }
    """

    job_id: str = Field(
        ...,
        description="Unique job identifier (UUID)",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )

    status: JobStatusEnum = Field(
        ...,
        description="Current job status",
        examples=["queued", "processing", "completed", "failed"]
    )

    workflow_name: str = Field(
        ...,
        description="Name of workflow being executed",
        examples=["emergency_contacts", "mission_generation"]
    )

    # Timestamps
    created_at: str = Field(
        ...,
        description="Job creation timestamp (ISO 8601)",
        examples=["2024-12-16T10:00:00Z"]
    )

    started_at: Optional[str] = Field(
        None,
        description="Job start timestamp (ISO 8601)",
        examples=["2024-12-16T10:00:05Z"]
    )

    completed_at: Optional[str] = Field(
        None,
        description="Job completion timestamp (ISO 8601)",
        examples=["2024-12-16T10:00:25Z"]
    )

    duration_ms: Optional[int] = Field(
        None,
        ge=0,
        description="Total execution time in milliseconds",
        examples=[20000, 45000]
    )

    # Results and errors
    result: Optional[Dict[str, Any]] = Field(
        None,
        description="Workflow execution result (if completed)",
        examples=[{
            "contacts": [],
            "cost_data": {
                "provider": "openrouter",
                "model": "anthropic/claude-3.5-sonnet",
                "input_tokens": 5000,
                "output_tokens": 3000,
                "total_tokens": 8000,
                "cost_usd": 0.24
            }
        }]
    )

    error_message: Optional[str] = Field(
        None,
        description="Error message (if failed)",
        examples=["Workflow execution failed: Invalid API key"]
    )

    # Progress tracking (if processing)
    current_step: Optional[str] = Field(
        None,
        description="Currently executing step ID (if processing)",
        examples=["fetch_hospitals", "generate_contacts"]
    )

    steps_completed: Optional[int] = Field(
        None,
        ge=0,
        description="Number of steps completed (if processing)",
        examples=[3, 5]
    )

    total_steps: Optional[int] = Field(
        None,
        ge=0,
        description="Total number of steps in workflow (if processing)",
        examples=[8, 12]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "job_id": "123e4567-e89b-12d3-a456-426614174000",
                    "status": "completed",
                    "workflow_name": "emergency_contacts",
                    "created_at": "2024-12-16T10:00:00Z",
                    "started_at": "2024-12-16T10:00:05Z",
                    "completed_at": "2024-12-16T10:00:25Z",
                    "duration_ms": 20000,
                    "result": {
                        "contacts": [],
                        "cost_data": {
                            "provider": "openrouter",
                            "model": "anthropic/claude-3.5-sonnet",
                            "input_tokens": 5000,
                            "output_tokens": 3000,
                            "total_tokens": 8000,
                            "cost_usd": 0.24
                        }
                    },
                    "error_message": None
                },
                {
                    "job_id": "456e7890-e12b-34c5-d678-901234567890",
                    "status": "processing",
                    "workflow_name": "emergency_contacts",
                    "created_at": "2024-12-16T10:05:00Z",
                    "started_at": "2024-12-16T10:05:02Z",
                    "completed_at": None,
                    "duration_ms": None,
                    "result": None,
                    "error_message": None,
                    "current_step": "fetch_hospitals",
                    "steps_completed": 2,
                    "total_steps": 8
                },
                {
                    "job_id": "789e0123-e45b-67c8-d901-234567890123",
                    "status": "failed",
                    "workflow_name": "emergency_contacts",
                    "created_at": "2024-12-16T10:10:00Z",
                    "started_at": "2024-12-16T10:10:02Z",
                    "completed_at": "2024-12-16T10:10:15Z",
                    "duration_ms": 13000,
                    "result": None,
                    "error_message": "Workflow execution failed: Invalid API key"
                }
            ]
        }
    }
