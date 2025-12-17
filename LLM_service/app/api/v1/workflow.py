"""
Workflow submission and validation endpoints.

Endpoints:
- POST /workflow - Submit workflow for asynchronous execution
- POST /workflow/validate - Validate workflow configuration (dry-run)
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.workflow import (
    WorkflowSubmitRequest,
    WorkflowSubmitResponse,
    WorkflowValidateRequest,
    WorkflowValidateResponse,
)
from app.schemas.common import ErrorResponse
from app.models.workflow_job import WorkflowJob, JobStatus
from app.workflows.schema import Workflow
from app.tasks.workflows import execute_workflow
from pydantic import ValidationError as PydanticValidationError

logger = logging.getLogger(__name__)

router = APIRouter()


def load_workflow_definition(workflow_name: str) -> Workflow:
    """
    Load and validate workflow definition from JSON file.

    Args:
        workflow_name: Name of workflow (e.g., 'emergency_contacts')

    Returns:
        Validated Workflow object

    Raises:
        HTTPException: If workflow not found or invalid
    """
    workflow_path = Path("workflows/definitions") / f"{workflow_name}.json"

    if not workflow_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "WorkflowNotFound",
                "message": f"Workflow '{workflow_name}' not found",
                "workflow_name": workflow_name,
            }
        )

    try:
        import json
        with open(workflow_path, 'r') as f:
            workflow_data = json.load(f)
            return Workflow(**workflow_data)
    except PydanticValidationError as e:
        logger.error(f"Workflow validation failed: {workflow_name}", exc_info=e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "WorkflowValidationError",
                "message": f"Workflow definition invalid: {str(e)}",
                "workflow_name": workflow_name,
            }
        )
    except Exception as e:
        logger.error(f"Error loading workflow: {workflow_name}", exc_info=e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "WorkflowLoadError",
                "message": f"Failed to load workflow: {str(e)}",
                "workflow_name": workflow_name,
            }
        )


@router.post(
    "/workflow",
    response_model=WorkflowSubmitResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit workflow for execution",
    description="Submit a workflow job for asynchronous execution via Celery. Returns job ID for status tracking.",
    responses={
        202: {
            "description": "Job accepted and queued for execution",
            "model": WorkflowSubmitResponse
        },
        400: {
            "description": "Invalid request (validation error, workflow not found)",
            "model": ErrorResponse
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    }
)
def submit_workflow(
    request: WorkflowSubmitRequest,
    db: Session = Depends(get_db)
) -> WorkflowSubmitResponse:
    """
    Submit workflow for asynchronous execution.

    Workflow Execution Flow:
    1. Validate workflow exists and is well-formed
    2. Create job record in database with PENDING status
    3. Queue Celery task for asynchronous execution
    4. Return job ID for status tracking

    Response:
    - 202 Accepted: Job queued successfully
    - 400 Bad Request: Workflow not found or validation error
    - 500 Internal Server Error: Database or Celery error
    """
    logger.info(f"Workflow submission: {request.workflow_name} (user: {request.user_id})")

    # Validate workflow exists and is well-formed
    try:
        workflow = load_workflow_definition(request.workflow_name)
        logger.debug(f"Loaded workflow: {workflow.name} (version {workflow.version})")
    except HTTPException:
        raise  # Re-raise HTTP exceptions as-is

    # Generate job and task IDs
    job_id = uuid.uuid4()
    celery_task_id = str(uuid.uuid4())

    # Create job record in database
    try:
        job = WorkflowJob(
            id=job_id,
            celery_task_id=celery_task_id,
            workflow_name=request.workflow_name,
            priority=request.priority,
            webhook_url=str(request.webhook_url) if request.webhook_url else None,
            webhook_secret=request.webhook_secret,
            debug_mode=request.debug_mode,
            user_id=uuid.UUID(request.user_id) if request.user_id else None,
            status=JobStatus.PENDING.value,
            input_data=request.input_data,
            queued_at=datetime.now(timezone.utc),
        )

        db.add(job)
        db.commit()
        db.refresh(job)

        logger.info(f"Created job record: {job_id} (task: {celery_task_id})")

    except Exception as e:
        logger.error(f"Failed to create job record: {job_id}", exc_info=e)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "DatabaseError",
                "message": f"Failed to create job record: {str(e)}",
                "job_id": str(job_id),
            }
        )

    # Queue Celery task for execution
    try:
        # Apply async with task ID and priority
        execute_workflow.apply_async(
            task_id=celery_task_id,
            args=[str(job_id)],
            priority=request.priority,
        )

        # Update job status to QUEUED
        job.status = JobStatus.QUEUED.value
        db.commit()

        logger.info(f"Queued Celery task: {celery_task_id} (job: {job_id}, priority: {request.priority})")

    except Exception as e:
        logger.error(f"Failed to queue Celery task: {celery_task_id}", exc_info=e)

        # Update job status to FAILED
        job.status = JobStatus.FAILED.value
        job.error_message = f"Failed to queue task: {str(e)}"
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "CeleryError",
                "message": f"Failed to queue workflow execution: {str(e)}",
                "job_id": str(job_id),
            }
        )

    # Return response with job ID and status URL
    return WorkflowSubmitResponse(
        job_id=str(job_id),
        celery_task_id=celery_task_id,
        status=job.status,
        estimated_wait_seconds=None,  # TODO: Implement queue depth estimation
        status_url=f"/api/v1/status/{job_id}"
    )


@router.post(
    "/workflow/validate",
    response_model=WorkflowValidateResponse,
    status_code=status.HTTP_200_OK,
    summary="Validate workflow configuration",
    description="Validate workflow and input data without executing (dry-run mode). Returns estimated tokens, cost, and duration.",
    responses={
        200: {
            "description": "Workflow validated successfully",
            "model": WorkflowValidateResponse
        },
        400: {
            "description": "Validation failed (workflow not found, invalid input)",
            "model": ErrorResponse
        }
    }
)
def validate_workflow(
    request: WorkflowValidateRequest
) -> WorkflowValidateResponse:
    """
    Validate workflow configuration without execution (dry-run).

    Validation Steps:
    1. Check workflow definition exists and is well-formed
    2. Validate input data against workflow schema
    3. Estimate token consumption, cost, and duration
    4. Return validation result with estimates

    Response:
    - 200 OK: Validation successful or failed (check 'valid' field)
    - 400 Bad Request: Workflow not found
    """
    logger.info(f"Workflow validation: {request.workflow_name}")

    errors = []

    # Step 1: Validate workflow exists
    try:
        workflow = load_workflow_definition(request.workflow_name)
        logger.debug(f"Loaded workflow: {workflow.name} (version {workflow.version})")
    except HTTPException as e:
        return WorkflowValidateResponse(
            valid=False,
            workflow_name=request.workflow_name,
            errors=[e.detail.get("message", str(e))]
        )

    # Step 2: Validate input data structure
    # TODO: Implement input schema validation based on workflow requirements
    # For now, just check that input_data is a dict
    if not isinstance(request.input_data, dict):
        errors.append("input_data must be a dictionary/object")

    # Step 3: Validate required fields (workflow-specific)
    # TODO: Implement workflow-specific input validation
    # Example: For emergency_contacts, check for required location field

    # If validation failed, return errors
    if errors:
        logger.info(f"Workflow validation failed: {request.workflow_name} ({len(errors)} errors)")
        return WorkflowValidateResponse(
            valid=False,
            workflow_name=request.workflow_name,
            errors=errors
        )

    # Step 4: Estimate resources (tokens, cost, duration)
    # TODO: Implement resource estimation based on workflow complexity
    # For now, return placeholder estimates
    estimated_tokens = len(workflow.steps) * 1000  # Rough estimate: 1000 tokens per step
    estimated_cost_usd = estimated_tokens * 0.000015  # Rough estimate: $15 per 1M tokens
    estimated_duration_seconds = len(workflow.steps) * 5  # Rough estimate: 5 seconds per step

    logger.info(f"Workflow validation passed: {request.workflow_name}")

    return WorkflowValidateResponse(
        valid=True,
        workflow_name=request.workflow_name,
        errors=None,
        estimated_tokens=estimated_tokens,
        estimated_cost_usd=round(estimated_cost_usd, 4),
        estimated_duration_seconds=estimated_duration_seconds
    )
