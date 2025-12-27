"""
Workflow status query endpoint.

Endpoint:
- GET /status/{job_id} - Query job execution status and results
"""

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database import get_db
from app.schemas.status import WorkflowStatusResponse, JobStatusEnum
from app.schemas.common import ErrorResponse
from app.models.workflow_job import WorkflowJob
from app.dependencies.auth import verify_api_secret

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/status/{job_id}",
    response_model=WorkflowStatusResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_api_secret)],
    summary="Get workflow job status",
    description="Query the execution status and results of a workflow job by ID. Requires X-API-Secret header.",
    responses={
        200: {
            "description": "Job status retrieved successfully",
            "model": WorkflowStatusResponse
        },
        401: {
            "description": "Invalid or missing API secret",
            "model": ErrorResponse
        },
        404: {
            "description": "Job not found",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    }
)
def get_workflow_status(
    job_id: str = Path(
        ...,
        description="Job ID (UUID format)",
        examples=["123e4567-e89b-12d3-a456-426614174000"]
    ),
    db: Session = Depends(get_db)
) -> WorkflowStatusResponse:
    """
    Get workflow job status and results.

    Returns comprehensive job information including:
    - Current execution status (pending, queued, processing, completed, failed)
    - Timing metadata (created, started, completed, duration)
    - Results (if completed successfully)
    - Error message (if failed)
    - Progress tracking (if currently processing)

    Response:
    - 200 OK: Job found, status returned
    - 404 Not Found: Job ID does not exist
    - 500 Internal Server Error: Database error
    """
    logger.info(f"Status query: {job_id}")

    # Validate job_id format
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "InvalidJobID",
                "message": f"Invalid job ID format (expected UUID): {job_id}",
                "job_id": job_id,
            }
        )

    # Query job from database
    try:
        job = db.query(WorkflowJob).filter(WorkflowJob.id == job_uuid).first()

        if not job:
            logger.warning(f"Job not found: {job_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "JobNotFound",
                    "message": f"Job not found: {job_id}",
                    "job_id": job_id,
                }
            )

        logger.debug(f"Job found: {job_id} (status: {job.status})")

    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is
    except Exception as e:
        logger.error(f"Database error querying job: {job_id}", exc_info=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "DatabaseError",
                "message": f"Failed to query job status: {str(e)}",
                "job_id": job_id,
            }
        )

    # Extract progress tracking data from result_data (if processing)
    current_step: Optional[str] = None
    steps_completed: Optional[int] = None
    total_steps: Optional[int] = None

    if job.status == JobStatusEnum.PROCESSING.value and job.result_data:
        # Extract progress metadata if available
        progress = job.result_data.get("progress", {})
        current_step = progress.get("current_step")
        steps_completed = progress.get("steps_completed")
        total_steps = progress.get("total_steps")

    # Build response
    response = WorkflowStatusResponse(
        job_id=str(job.id),
        status=JobStatusEnum(job.status),
        workflow_name=job.workflow_name,
        created_at=job.created_at.isoformat() if job.created_at else None,
        started_at=job.started_at.isoformat() if job.started_at else None,
        completed_at=job.completed_at.isoformat() if job.completed_at else None,
        duration_ms=job.duration_ms,
        result=job.result_data if job.status == JobStatusEnum.COMPLETED.value else None,
        error_message=job.error_message,
        current_step=current_step,
        steps_completed=steps_completed,
        total_steps=total_steps,
        webhook_url=job.webhook_url,
    )

    logger.info(f"Status returned: {job_id} ({job.status})")

    return response
