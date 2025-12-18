"""
Pydantic schemas for jobs list endpoint.

Defines response schemas for GET /api/v1/jobs endpoint with lightweight
job summaries optimized for list views (excludes heavy result/input data).
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class JobSummary(BaseModel):
    """
    Lightweight job summary for list views.

    Excludes heavy fields (result_data, input_data) to keep response size manageable.
    For full job details including results, use GET /status/{job_id}.

    Example:
    {
        "job_id": "123e4567-e89b-12d3-a456-426614174000",
        "workflow_name": "emergency_contacts",
        "status": "completed",
        "priority": 0,
        "user_id": "user-uuid",
        "created_at": "2025-12-18T10:00:00Z",
        "started_at": "2025-12-18T10:00:05Z",
        "completed_at": "2025-12-18T10:00:25Z",
        "duration_ms": 20000,
        "error_message": null
    }
    """

    job_id: str = Field(
        ...,
        description="Unique job identifier (UUID)",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )

    workflow_name: str = Field(
        ...,
        description="Name of workflow executed",
        examples=["emergency_contacts", "mission_generation"]
    )

    status: str = Field(
        ...,
        description="Current job status",
        examples=["pending", "queued", "processing", "completed", "failed"]
    )

    priority: int = Field(
        ...,
        ge=0,
        le=10,
        description="Job priority (0-10, higher = more urgent)",
        examples=[0, 5, 10]
    )

    user_id: Optional[str] = Field(
        None,
        description="User UUID (if associated with user)",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    )

    created_at: str = Field(
        ...,
        description="Job creation timestamp (ISO 8601)",
        examples=["2025-12-18T10:00:00Z"]
    )

    started_at: Optional[str] = Field(
        None,
        description="Job start timestamp (ISO 8601)",
        examples=["2025-12-18T10:00:05Z"]
    )

    completed_at: Optional[str] = Field(
        None,
        description="Job completion timestamp (ISO 8601)",
        examples=["2025-12-18T10:00:25Z"]
    )

    duration_ms: Optional[int] = Field(
        None,
        ge=0,
        description="Execution duration in milliseconds",
        examples=[20000, 45000]
    )

    error_message: Optional[str] = Field(
        None,
        description="Error message if job failed",
        examples=["Workflow execution failed: Invalid API key"]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "job_id": "123e4567-e89b-12d3-a456-426614174000",
                    "workflow_name": "emergency_contacts",
                    "status": "completed",
                    "priority": 0,
                    "user_id": "user-123",
                    "created_at": "2025-12-18T10:00:00Z",
                    "started_at": "2025-12-18T10:00:05Z",
                    "completed_at": "2025-12-18T10:00:25Z",
                    "duration_ms": 20000,
                    "error_message": None
                },
                {
                    "job_id": "456e7890-e12b-34c5-d678-901234567890",
                    "workflow_name": "emergency_contacts",
                    "status": "processing",
                    "priority": 5,
                    "user_id": "user-456",
                    "created_at": "2025-12-18T10:05:00Z",
                    "started_at": "2025-12-18T10:05:02Z",
                    "completed_at": None,
                    "duration_ms": None,
                    "error_message": None
                },
                {
                    "job_id": "789e0123-e45b-67c8-d901-234567890123",
                    "workflow_name": "mission_generation",
                    "status": "failed",
                    "priority": 0,
                    "user_id": None,
                    "created_at": "2025-12-18T10:10:00Z",
                    "started_at": "2025-12-18T10:10:02Z",
                    "completed_at": "2025-12-18T10:10:15Z",
                    "duration_ms": 13000,
                    "error_message": "Workflow execution failed: Invalid API key"
                }
            ]
        }
    }


class JobsListResponse(BaseModel):
    """
    Response schema for GET /api/v1/jobs endpoint.

    Returns paginated list of job summaries with metadata for
    building list views and dashboards.

    Example:
    {
        "jobs": [
            {
                "job_id": "123...",
                "workflow_name": "emergency_contacts",
                "status": "completed",
                ...
            }
        ],
        "total": 42,
        "limit": 50,
        "offset": 0
    }
    """

    jobs: List[JobSummary] = Field(
        ...,
        description="List of job summaries",
        examples=[[]]
    )

    total: int = Field(
        ...,
        ge=0,
        description="Total number of jobs matching filter criteria",
        examples=[42, 0, 150]
    )

    limit: int = Field(
        ...,
        ge=1,
        le=200,
        description="Number of jobs returned in this response",
        examples=[50, 100, 200]
    )

    offset: int = Field(
        ...,
        ge=0,
        description="Starting offset for pagination",
        examples=[0, 50, 100]
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "jobs": [
                        {
                            "job_id": "123e4567-e89b-12d3-a456-426614174000",
                            "workflow_name": "emergency_contacts",
                            "status": "completed",
                            "priority": 0,
                            "user_id": "user-123",
                            "created_at": "2025-12-18T10:00:00Z",
                            "started_at": "2025-12-18T10:00:05Z",
                            "completed_at": "2025-12-18T10:00:25Z",
                            "duration_ms": 20000,
                            "error_message": None
                        }
                    ],
                    "total": 42,
                    "limit": 50,
                    "offset": 0
                },
                {
                    "jobs": [],
                    "total": 0,
                    "limit": 50,
                    "offset": 0
                }
            ]
        }
    }
