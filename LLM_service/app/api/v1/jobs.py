"""
Jobs list endpoint for querying workflow jobs.

Endpoints:
- GET /jobs - List jobs with filtering and pagination
- DELETE /jobs/bulk - Bulk delete jobs by IDs
"""

import logging
from typing import Optional, List
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel

from app.database import get_db
from app.schemas.jobs import JobsListResponse, JobSummary
from app.schemas.common import ErrorResponse
from app.models.workflow_job import WorkflowJob, JobStatus
from app.dependencies.auth import verify_api_secret

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/jobs",
    response_model=JobsListResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_api_secret)],
    summary="List workflow jobs",
    description="Query workflow jobs with optional filtering by status and user. Requires X-API-Secret header. Returns paginated list of job summaries.",
    responses={
        200: {
            "description": "Jobs retrieved successfully",
            "model": JobsListResponse
        },
        401: {
            "description": "Invalid or missing API secret",
            "model": ErrorResponse
        },
        400: {
            "description": "Invalid filter parameters",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    }
)
def list_jobs(
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by job status: 'running' (queued/processing), 'completed', 'failed', or 'all'",
        examples=["running", "completed", "failed", "all"]
    ),
    user_id: Optional[str] = Query(
        None,
        description="Filter by user ID (UUID format)",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    ),
    limit: int = Query(
        50,
        ge=1,
        le=200,
        description="Maximum number of jobs to return (pagination)",
        examples=[50, 100, 200]
    ),
    offset: int = Query(
        0,
        ge=0,
        description="Number of jobs to skip (pagination)",
        examples=[0, 50, 100]
    ),
    limit_results: Optional[str] = Query(
        None,
        description=(
            "Filter by result count or time period. "
            "Accepts: numeric value (1-500), 'Today', '7 Days', or '30 Days'"
        ),
        examples=["25", "100", "Today", "7 Days", "30 Days"]
    ),
    db: Session = Depends(get_db)
) -> JobsListResponse:
    """
    List workflow jobs with optional filtering and pagination.

    Query Parameters:
    - status: Filter by job status
      - 'running': Jobs in QUEUED or PROCESSING state
      - 'completed': Jobs in COMPLETED state
      - 'failed': Jobs in FAILED state
      - 'all' or omitted: All jobs (no status filter)
    - user_id: Filter by user UUID (optional)
    - limit: Number of jobs to return (1-200, default 50)
    - offset: Starting offset for pagination (default 0)

    Returns:
    - jobs: List of lightweight job summaries (excludes full result/input data)
    - total: Total number of jobs matching filter criteria
    - limit: Number of jobs returned
    - offset: Starting offset used

    Response Codes:
    - 200 OK: Jobs retrieved successfully
    - 400 Bad Request: Invalid status filter value
    - 401 Unauthorized: Missing or invalid API secret
    - 500 Internal Server Error: Database error
    """
    logger.info(
        f"Jobs list query: status={status_filter}, user_id={user_id}, "
        f"limit={limit}, offset={offset}"
    )

    # Build base query
    query = db.query(WorkflowJob)

    # Apply status filter
    if status_filter and status_filter != "all":
        if status_filter == "running":
            # Running = QUEUED or PROCESSING
            query = query.filter(
                or_(
                    WorkflowJob.status == JobStatus.QUEUED.value,
                    WorkflowJob.status == JobStatus.PROCESSING.value
                )
            )
            logger.debug("Applied 'running' filter (queued/processing)")
        elif status_filter == "completed":
            query = query.filter(WorkflowJob.status == JobStatus.COMPLETED.value)
            logger.debug("Applied 'completed' filter")
        elif status_filter == "failed":
            query = query.filter(WorkflowJob.status == JobStatus.FAILED.value)
            logger.debug("Applied 'failed' filter")
        else:
            # Invalid status value
            logger.warning(f"Invalid status filter: {status_filter}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "InvalidStatusFilter",
                    "message": f"Invalid status filter: '{status_filter}'. Valid values: 'running', 'completed', 'failed', 'all'",
                    "valid_values": ["running", "completed", "failed", "all"]
                }
            )

    # Apply user filter
    if user_id:
        try:
            user_uuid = uuid.UUID(user_id)
            query = query.filter(WorkflowJob.user_id == user_uuid)
            logger.debug(f"Applied user filter: {user_id}")
        except ValueError:
            logger.warning(f"Invalid user_id format: {user_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "InvalidUserID",
                    "message": f"Invalid user_id format (expected UUID): {user_id}",
                    "user_id": user_id
                }
            )

    # Apply limit_results filter (time-based or numeric)
    if limit_results:
        from datetime import timedelta

        # Check if it's a time period filter
        if limit_results in ["Today", "7 Days", "30 Days"]:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc)

            if limit_results == "Today":
                # Jobs created in the last 24 hours
                twenty_four_hours_ago = now - timedelta(hours=24)
                query = query.filter(WorkflowJob.created_at >= twenty_four_hours_ago)
                logger.debug(f"Applied 'Today' filter (last 24 hours since {twenty_four_hours_ago.isoformat()})")

            elif limit_results == "7 Days":
                # Jobs created in last 7 days
                seven_days_ago = now - timedelta(days=7)
                query = query.filter(WorkflowJob.created_at >= seven_days_ago)
                logger.debug(f"Applied '7 Days' filter (since {seven_days_ago.isoformat()})")

            elif limit_results == "30 Days":
                # Jobs created in last 30 days
                thirty_days_ago = now - timedelta(days=30)
                query = query.filter(WorkflowJob.created_at >= thirty_days_ago)
                logger.debug(f"Applied '30 Days' filter (since {thirty_days_ago.isoformat()})")

        else:
            # Assume it's a numeric limit (validate and override default limit)
            try:
                numeric_limit = int(limit_results)
                if 1 <= numeric_limit <= 500:
                    limit = numeric_limit  # Override default limit parameter
                    logger.debug(f"Applied numeric limit: {numeric_limit}")
                else:
                    # Invalid range
                    logger.warning(f"Invalid limit_results value (out of range): {limit_results}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail={
                            "error": "InvalidLimitResults",
                            "message": f"Numeric limit must be between 1-500 (got: {limit_results})",
                            "limit_results": limit_results
                        }
                    )
            except ValueError:
                # Not a valid number or time period
                logger.warning(f"Invalid limit_results value: {limit_results}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": "InvalidLimitResults",
                        "message": (
                            f"Invalid limit_results value: '{limit_results}'. "
                            "Expected: numeric value (1-500), 'Today', '7 Days', or '30 Days'"
                        ),
                        "limit_results": limit_results,
                        "valid_values": ["1-500", "Today", "7 Days", "30 Days"]
                    }
                )

    # Get total count (before pagination)
    try:
        total = query.count()
        logger.debug(f"Total jobs matching filters: {total}")
    except Exception as e:
        logger.error("Database error counting jobs", exc_info=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "DatabaseError",
                "message": f"Failed to count jobs: {str(e)}"
            }
        )

    # Apply sorting (newest first) and pagination
    try:
        jobs = (
            query
            .order_by(WorkflowJob.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        logger.debug(f"Retrieved {len(jobs)} jobs (offset={offset}, limit={limit})")
    except Exception as e:
        logger.error("Database error querying jobs", exc_info=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "DatabaseError",
                "message": f"Failed to query jobs: {str(e)}"
            }
        )

    # Build lightweight job summaries
    job_summaries = []
    for job in jobs:
        job_summaries.append(
            JobSummary(
                job_id=str(job.id),
                workflow_name=job.workflow_name,
                status=job.status,
                priority=job.priority,
                user_id=str(job.user_id) if job.user_id else None,
                username=job.username,
                action=job.action,
                created_at=job.created_at.isoformat() if job.created_at else None,
                started_at=job.started_at.isoformat() if job.started_at else None,
                completed_at=job.completed_at.isoformat() if job.completed_at else None,
                duration_ms=job.duration_ms,
                error_message=job.error_message
            )
        )

    logger.info(
        f"Jobs list returned: {len(job_summaries)} jobs "
        f"(total matching: {total})"
    )

    return JobsListResponse(
        jobs=job_summaries,
        total=total,
        limit=limit,
        offset=offset
    )


# Request/Response schemas for bulk delete
class BulkDeleteRequest(BaseModel):
    """Request schema for bulk job deletion."""
    job_ids: List[str]

    class Config:
        json_schema_extra = {
            "example": {
                "job_ids": [
                    "123e4567-e89b-12d3-a456-426614174000",
                    "987e6543-e21b-12d3-a456-426614174999"
                ]
            }
        }


class BulkDeleteResponse(BaseModel):
    """Response schema for bulk job deletion."""
    deleted_count: int
    job_ids: List[str]
    message: str

    class Config:
        json_schema_extra = {
            "example": {
                "deleted_count": 2,
                "job_ids": ["123e4567-e89b-12d3-a456-426614174000"],
                "message": "Successfully deleted 2 jobs"
            }
        }


@router.delete(
    "/jobs/bulk",
    response_model=BulkDeleteResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_api_secret)],
    summary="Bulk delete workflow jobs",
    description="Delete multiple workflow jobs by their IDs. Requires X-API-Secret header. Returns count of deleted jobs.",
    responses={
        200: {
            "description": "Jobs deleted successfully",
            "model": BulkDeleteResponse
        },
        401: {
            "description": "Invalid or missing API secret",
            "model": ErrorResponse
        },
        400: {
            "description": "Invalid request (empty list or invalid UUIDs)",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    }
)
def bulk_delete_jobs(
    request: BulkDeleteRequest = Body(...),
    db: Session = Depends(get_db)
) -> BulkDeleteResponse:
    """
    Bulk delete workflow jobs by their IDs.

    Request Body:
    - job_ids: List of job UUIDs to delete (required, non-empty)

    Returns:
    - deleted_count: Number of jobs actually deleted
    - job_ids: List of deleted job IDs
    - message: Success message

    Response Codes:
    - 200 OK: Jobs deleted successfully
    - 400 Bad Request: Empty list or invalid UUIDs
    - 401 Unauthorized: Missing or invalid API secret
    - 500 Internal Server Error: Database error
    """
    # Validate request
    if not request.job_ids:
        logger.warning("Bulk delete called with empty job_ids list")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "EmptyJobIdsList",
                "message": "job_ids list cannot be empty",
            }
        )

    # Convert string IDs to UUIDs and validate
    job_uuids = []
    invalid_ids = []
    for job_id in request.job_ids:
        try:
            job_uuids.append(uuid.UUID(job_id))
        except ValueError:
            invalid_ids.append(job_id)

    if invalid_ids:
        logger.warning(f"Bulk delete called with invalid UUIDs: {invalid_ids}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "InvalidJobIDs",
                "message": f"Invalid job ID format (expected UUID)",
                "invalid_ids": invalid_ids
            }
        )

    logger.info(f"Bulk delete request for {len(job_uuids)} jobs")

    # Delete jobs from database
    try:
        deleted_count = (
            db.query(WorkflowJob)
            .filter(WorkflowJob.id.in_(job_uuids))
            .delete(synchronize_session=False)
        )
        db.commit()
        logger.info(f"Successfully deleted {deleted_count} jobs out of {len(job_uuids)} requested")
    except Exception as e:
        db.rollback()
        logger.error("Database error during bulk delete", exc_info=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "DatabaseError",
                "message": f"Failed to delete jobs: {str(e)}"
            }
        )

    return BulkDeleteResponse(
        deleted_count=deleted_count,
        job_ids=[str(job_id) for job_id in job_uuids[:deleted_count]],
        message=f"Successfully deleted {deleted_count} job{'s' if deleted_count != 1 else ''}"
    )
