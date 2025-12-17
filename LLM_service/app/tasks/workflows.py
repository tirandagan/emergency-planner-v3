"""
Celery tasks for workflow execution.

Tasks:
- execute_workflow: Asynchronous workflow execution with progress tracking
- Enhanced error handling with structured error context storage
"""

import logging
import time
import uuid
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from celery import Task
from sqlalchemy.orm import Session

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.workflow_job import WorkflowJob, JobStatus
from app.models.provider_usage import ProviderUsage
from app.workflows.engine import WorkflowEngine, WorkflowResult, WorkflowExecutionError
from app.workflows.errors import WorkflowErrorContext
from app.services import LLMResponse

logger = logging.getLogger(__name__)


class WorkflowTask(Task):
    """
    Custom Celery task base class for workflow execution.

    Provides:
    - Database session management
    - Progress tracking callbacks
    - Error handling and retry logic
    """

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Handle task failure.

        Updates job status to FAILED and stores structured error message with context.
        """
        logger.error(f"Task failed: {task_id}", exc_info=exc)

        job_id = args[0] if args else None
        if not job_id:
            logger.error(f"No job_id in task args: {task_id}")
            return

        # Update job status in database
        db = SessionLocal()
        try:
            job = db.query(WorkflowJob).filter(WorkflowJob.id == uuid.UUID(job_id)).first()
            if job:
                job.status = JobStatus.FAILED.value

                # Extract and store structured error context if available
                if hasattr(exc, 'context') and isinstance(exc.context, WorkflowErrorContext):
                    error_dict = exc.context.to_dict(include_sensitive=False)
                    job.error_message = json.dumps(error_dict)
                    logger.error(
                        f"Task failure - type={error_dict['type']}, "
                        f"category={error_dict['category']}, "
                        f"retryable={error_dict['retryable']}"
                    )
                else:
                    # Fallback for exceptions without context
                    job.error_message = str(exc)

                job.completed_at = datetime.now(timezone.utc)

                # Calculate duration if started
                if job.started_at:
                    duration = (job.completed_at - job.started_at).total_seconds() * 1000
                    job.duration_ms = int(duration)

                db.commit()
                logger.info(f"Updated job status to FAILED: {job_id}")

                # Trigger webhook delivery for failure (Phase 7)
                if job.webhook_url:
                    try:
                        from app.tasks.webhooks import deliver_webhook

                        logger.info(f"Triggering failure webhook for job {job_id}")
                        deliver_webhook.apply_async(
                            args=[str(job.id), "workflow.failed"],
                            countdown=0
                        )
                    except Exception as webhook_error:
                        logger.error(f"Failed to trigger failure webhook: {webhook_error}")
            else:
                logger.error(f"Job not found in on_failure: {job_id}")
        except Exception as e:
            logger.error(f"Failed to update job status on failure: {job_id}", exc_info=e)
            db.rollback()
        finally:
            db.close()

    def on_success(self, retval, task_id, args, kwargs):
        """Handle task success."""
        logger.info(f"Task completed successfully: {task_id}")


@celery_app.task(
    bind=True,
    base=WorkflowTask,
    name="execute_workflow",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
    reject_on_worker_lost=True,
)
def execute_workflow(self, job_id: str) -> Dict[str, Any]:
    """
    Execute workflow asynchronously.

    Args:
        job_id: UUID of workflow job

    Returns:
        Workflow execution result with metadata

    Raises:
        WorkflowExecutionError: If workflow execution fails

    Workflow Execution Flow:
    1. Load job from database and update status to PROCESSING
    2. Initialize WorkflowEngine with job input data
    3. Execute workflow steps sequentially with progress tracking
    4. Store LLM usage data in provider_usage table
    5. Update job with results and status COMPLETED
    6. Handle errors and update status to FAILED if needed
    """
    logger.info(f"Starting workflow execution: job={job_id}, task={self.request.id}")

    start_time = time.time()
    db = SessionLocal()

    try:
        # Step 1: Load job from database
        job = db.query(WorkflowJob).filter(WorkflowJob.id == uuid.UUID(job_id)).first()

        if not job:
            error_msg = f"Job not found: {job_id}"
            logger.error(error_msg)
            raise WorkflowExecutionError(error_msg)

        logger.info(f"Loaded job: {job_id} (workflow: {job.workflow_name})")

        # Step 2: Update job status to PROCESSING
        job.status = JobStatus.PROCESSING.value
        job.started_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(f"Job status updated to PROCESSING: {job_id}")

        # Step 3: Initialize WorkflowEngine
        engine = WorkflowEngine()

        # Define progress callback for real-time updates
        def progress_callback(step_id: str, step_index: int, total_steps: int, output: Any):
            """
            Progress callback for workflow execution.

            Updates job result_data with progress information.
            """
            try:
                # Update progress in database
                progress_data = {
                    "progress": {
                        "current_step": step_id,
                        "steps_completed": step_index,
                        "total_steps": total_steps,
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                    }
                }

                job.result_data = progress_data
                db.commit()

                logger.debug(f"Progress update: {step_id} ({step_index}/{total_steps})")

            except Exception as e:
                logger.warning(f"Failed to update progress: {e}")

        # Step 4: Execute workflow
        logger.info(f"Executing workflow: {job.workflow_name}")

        try:
            result: WorkflowResult = engine.execute(
                workflow_name=job.workflow_name,
                input_data=job.input_data,
                progress_callback=progress_callback
            )

            logger.info(f"Workflow execution completed: {job_id} (success: {result.success})")

        except WorkflowExecutionError as e:
            logger.error(f"Workflow execution failed: {job_id}", exc_info=e)

            # Update job status to FAILED with structured error context
            job.status = JobStatus.FAILED.value

            # Extract and store structured error context if available
            if hasattr(e, 'context') and isinstance(e.context, WorkflowErrorContext):
                error_dict = e.context.to_dict(include_sensitive=False)
                job.error_message = json.dumps(error_dict)
                logger.error(
                    f"Workflow error details: type={error_dict['type']}, "
                    f"category={error_dict['category']}, "
                    f"step_id={error_dict.get('step_id', 'N/A')}"
                )
            else:
                # Fallback for exceptions without context
                job.error_message = str(e)

            job.completed_at = datetime.now(timezone.utc)

            # Calculate duration
            if job.started_at:
                duration = (job.completed_at - job.started_at).total_seconds() * 1000
                job.duration_ms = int(duration)

            db.commit()

            raise  # Re-raise to trigger Celery retry logic

        # Step 5: Store LLM usage data
        if result.metadata.get("llm_calls"):
            logger.info(f"Storing LLM usage data: {len(result.metadata['llm_calls'])} calls")

            for llm_call in result.metadata["llm_calls"]:
                usage = ProviderUsage(
                    job_id=uuid.UUID(job_id),
                    provider=llm_call.get("provider", "unknown"),
                    model=llm_call.get("model", "unknown"),
                    input_tokens=llm_call.get("input_tokens", 0),
                    output_tokens=llm_call.get("output_tokens", 0),
                    total_tokens=llm_call.get("total_tokens", 0),
                    cost_usd=llm_call.get("cost_usd", 0.0),
                    duration_ms=llm_call.get("duration_ms"),
                    extra_metadata=llm_call.get("metadata", {}),  # Use extra_metadata attribute
                )
                db.add(usage)

            db.commit()
            logger.info(f"Stored {len(result.metadata['llm_calls'])} LLM usage records")

        # Step 6: Update job with results
        job.status = JobStatus.COMPLETED.value if result.success else JobStatus.FAILED.value
        job.result_data = result.to_dict()

        # Store error message (structured JSON or plain string)
        if result.success:
            job.error_message = None
        else:
            # Check if workflow result has structured error context
            if "error_context" in result.metadata:
                # Store error context as JSON
                job.error_message = json.dumps(result.metadata["error_context"])
                logger.error(
                    f"Workflow failed with error context: "
                    f"type={result.metadata['error_context'].get('type')}, "
                    f"category={result.metadata['error_context'].get('category')}"
                )
            else:
                # Fallback to plain error string
                job.error_message = result.metadata.get("error")

        job.completed_at = datetime.now(timezone.utc)

        # Calculate duration
        if job.started_at:
            duration = (job.completed_at - job.started_at).total_seconds() * 1000
            job.duration_ms = int(duration)

        db.commit()

        execution_time = time.time() - start_time
        logger.info(f"Job completed: {job_id} ({execution_time:.2f}s)")

        # Step 7: Trigger webhook delivery (Phase 7)
        if job.webhook_url:
            # Import here to avoid circular dependency
            from app.tasks.webhooks import deliver_webhook

            event_type = "workflow.completed" if result.success else "workflow.failed"
            logger.info(f"Triggering webhook delivery for job {job_id} (event: {event_type})")

            # Trigger async webhook delivery (non-blocking)
            deliver_webhook.apply_async(
                args=[str(job.id), event_type],
                countdown=0  # Send immediately
            )

        # Return result for Celery
        return {
            "job_id": job_id,
            "status": job.status,
            "workflow_name": job.workflow_name,
            "duration_ms": job.duration_ms,
            "success": result.success,
        }

    except Exception as e:
        logger.error(f"Unexpected error in workflow execution: {job_id}", exc_info=e)

        # Update job status to FAILED with structured error context if available
        try:
            job = db.query(WorkflowJob).filter(WorkflowJob.id == uuid.UUID(job_id)).first()
            if job:
                job.status = JobStatus.FAILED.value

                # Extract and store structured error context if available
                if hasattr(e, 'context') and isinstance(e.context, WorkflowErrorContext):
                    error_dict = e.context.to_dict(include_sensitive=False)
                    job.error_message = json.dumps(error_dict)
                    logger.error(
                        f"Unexpected error details: type={error_dict['type']}, "
                        f"category={error_dict['category']}"
                    )
                else:
                    # Fallback for exceptions without context
                    job.error_message = f"Unexpected error: {str(e)}"

                job.completed_at = datetime.now(timezone.utc)

                if job.started_at:
                    duration = (job.completed_at - job.started_at).total_seconds() * 1000
                    job.duration_ms = int(duration)

                db.commit()
        except Exception as db_error:
            logger.error(f"Failed to update job status on error: {job_id}", exc_info=db_error)
            db.rollback()

        raise  # Re-raise to trigger Celery retry logic

    finally:
        db.close()
