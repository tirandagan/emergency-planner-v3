"""
Celery tasks for webhook delivery with retry logic.

Handles asynchronous webhook delivery with exponential backoff,
attempt tracking, and admin notifications on permanent failure.
Enhanced with structured error context in webhook payloads.
"""

import logging
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.celery_app import celery_app
from app.database import get_db
from app.models.workflow_job import WorkflowJob
from app.models.webhook_attempt import WebhookAttempt
from app.services.webhook_sender import WebhookSender, WebhookDeliveryError
from app.services.email_notifier import EmailNotifier
from app.config import settings

logger = logging.getLogger(__name__)


def parse_retry_delays() -> list[int]:
    """
    Parse retry delays from settings.

    Returns:
        List of delay values in seconds [5, 15, 45]
    """
    delays_str = settings.WEBHOOK_RETRY_DELAYS
    return [int(d.strip()) for d in delays_str.split(',')]


def build_webhook_payload(
    job: WorkflowJob,
    event_type: str,
    step_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build webhook payload based on event type.

    Args:
        job: WorkflowJob instance
        event_type: Event type (workflow.completed, workflow.failed, llm.step.completed)
        step_data: Optional step-specific data for LLM step completion events

    Returns:
        Webhook payload dictionary
    """
    if event_type == "llm.step.completed":
        # LLM step completion event (only when debug_mode=true)
        payload = {
            "event": event_type,
            "job_id": str(job.id),
            "workflow_name": job.workflow_name,
            "step_id": step_data.get("step_id"),
            "result": step_data.get("result"),
            "tokens": step_data.get("tokens", {}),
            "cost_usd": step_data.get("cost_usd", 0.0),
            "duration_ms": step_data.get("duration_ms", 0),
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
        }

        # Add debug info if debug mode enabled
        if job.debug_mode:
            payload["debug"] = {
                "prompt": step_data.get("prompt", ""),
                "model": step_data.get("model", ""),
                "temperature": step_data.get("temperature", 0.7)
            }

        return payload

    elif event_type == "workflow.completed":
        # Workflow completion event
        return {
            "event": event_type,
            "job_id": str(job.id),
            "status": "completed",
            "workflow_name": job.workflow_name,
            "user_id": str(job.user_id) if job.user_id else None,
            "result": job.result_data or {},
            "cost_data": {
                "total_tokens": job.result_data.get("metadata", {}).get("total_tokens", 0) if job.result_data else 0,
                "cost_usd": job.result_data.get("metadata", {}).get("total_cost", 0.0) if job.result_data else 0.0,
                "llm_calls": job.result_data.get("metadata", {}).get("llm_calls", []) if job.result_data else []
            },
            "duration_ms": job.duration_ms,
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
        }

    elif event_type == "workflow.failed":
        # Workflow failure event with enhanced error context
        payload = {
            "event": event_type,
            "job_id": str(job.id),
            "status": "failed",
            "workflow_name": job.workflow_name,
            "timestamp": datetime.now(timezone.utc).isoformat() + "Z"
        }

        # Try to parse error_message as JSON for structured error context
        if job.error_message:
            try:
                # Attempt to parse as JSON (new structured format)
                error_obj = json.loads(job.error_message)

                # Add basic error message for backward compatibility
                payload["error_message"] = error_obj.get("message", job.error_message)

                # Add full structured error object
                payload["error"] = error_obj

                logger.info(
                    f"Webhook includes structured error: "
                    f"type={error_obj.get('type')}, "
                    f"category={error_obj.get('category')}, "
                    f"retryable={error_obj.get('retryable')}"
                )

            except (json.JSONDecodeError, TypeError):
                # Fallback for old plain string errors
                payload["error_message"] = job.error_message
                logger.debug("Webhook contains legacy plain-text error (not structured)")
        else:
            # No error message available
            payload["error_message"] = "Unknown error"

        # Add duration and created_at for context
        if job.duration_ms:
            payload["duration_ms"] = job.duration_ms
        if job.created_at:
            payload["created_at"] = job.created_at.isoformat() + "Z"

        return payload

    else:
        raise ValueError(f"Unknown event type: {event_type}")


@celery_app.task(
    bind=True,
    max_retries=3,
    default_retry_delay=5,  # Will be overridden by countdown in retry
    acks_late=True,
    reject_on_worker_lost=True
)
def deliver_webhook(
    self,
    job_id: str,
    event_type: str = "workflow.completed",
    step_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Deliver webhook with retry logic and attempt tracking.

    This task implements exponential backoff retry strategy:
    - Attempt 1: Immediate
    - Attempt 2: +5 seconds
    - Attempt 3: +15 seconds
    - Attempt 4: +45 seconds (final attempt)

    Args:
        job_id: Workflow job UUID
        event_type: Type of webhook event to send
        step_data: Optional step-specific data for LLM events

    Returns:
        Dict with delivery status and metadata

    Raises:
        Exception: Re-raises on final failure for Celery tracking
    """
    db: Session = next(get_db())

    try:
        # Load job from database
        job = db.query(WorkflowJob).filter(WorkflowJob.id == job_id).first()

        if not job:
            logger.error(f"Job {job_id} not found for webhook delivery")
            return {"success": False, "error": "Job not found"}

        if not job.webhook_url:
            logger.warning(f"Job {job_id} has no webhook_url configured")
            return {"success": False, "error": "No webhook URL"}

        # Skip if webhook already permanently failed
        if job.webhook_permanently_failed:
            logger.info(f"Skipping webhook for job {job_id} - already permanently failed")
            return {"success": False, "error": "Webhook permanently failed"}

        # Build webhook payload
        payload = build_webhook_payload(job, event_type, step_data)

        # Get current attempt number (from Celery retries)
        attempt_number = self.request.retries + 1

        logger.info(
            f"Delivering webhook for job {job_id} "
            f"(event={event_type}, attempt={attempt_number}/{settings.WEBHOOK_MAX_RETRIES + 1})"
        )

        # Attempt webhook delivery
        sender = WebhookSender()
        start_time = datetime.now(timezone.utc)

        try:
            success, status_code, response_body, duration_ms = sender.send_webhook(
                url=job.webhook_url,
                event_type=event_type,
                payload=payload,
                secret=job.webhook_secret
            )

            # Track attempt in database
            attempt = WebhookAttempt(
                job_id=job.id,
                attempt_number=attempt_number,
                webhook_url=job.webhook_url,
                payload=payload,
                http_status=status_code,
                response_body=response_body[:1000] if response_body else None,  # Limit size
                duration_ms=duration_ms,
                attempted_at=start_time
            )
            db.add(attempt)
            db.commit()

            if success:
                logger.info(f"Webhook delivered successfully for job {job_id}")
                return {
                    "success": True,
                    "attempt": attempt_number,
                    "status_code": status_code,
                    "duration_ms": duration_ms
                }
            else:
                # Delivery failed, check if we should retry
                if attempt_number <= settings.WEBHOOK_MAX_RETRIES:
                    # Calculate next retry delay
                    retry_delays = parse_retry_delays()
                    next_delay = retry_delays[attempt_number - 1] if attempt_number <= len(retry_delays) else 45

                    logger.warning(
                        f"Webhook delivery failed for job {job_id}, "
                        f"retrying in {next_delay}s (attempt {attempt_number}/{settings.WEBHOOK_MAX_RETRIES + 1})"
                    )

                    # Update attempt with next retry time
                    attempt.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=next_delay)
                    db.commit()

                    # Retry with exponential backoff
                    raise self.retry(countdown=next_delay)
                else:
                    # All retries exhausted - mark as permanently failed
                    job.webhook_permanently_failed = True
                    db.commit()

                    logger.error(
                        f"Webhook delivery permanently failed for job {job_id} "
                        f"after {attempt_number} attempts"
                    )

                    # Send admin email notification
                    try:
                        notifier = EmailNotifier()
                        notifier.send_webhook_failure_notification(
                            job_id=str(job.id),
                            workflow_name=job.workflow_name,
                            webhook_url=job.webhook_url,
                            error_message=f"HTTP {status_code}: {response_body[:200] if response_body else 'No response body'}",
                            attempt_count=attempt_number
                        )
                    except Exception as email_error:
                        logger.error(f"Failed to send admin email notification: {email_error}")

                    return {
                        "success": False,
                        "permanently_failed": True,
                        "attempt": attempt_number,
                        "status_code": status_code
                    }

        except WebhookDeliveryError as e:
            # Network or timeout error
            error_message = str(e)
            duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

            # Track failed attempt
            attempt = WebhookAttempt(
                job_id=job.id,
                attempt_number=attempt_number,
                webhook_url=job.webhook_url,
                payload=payload,
                http_status=None,
                error_message=error_message,
                duration_ms=duration_ms,
                attempted_at=start_time
            )
            db.add(attempt)

            # Check if we should retry
            if attempt_number <= settings.WEBHOOK_MAX_RETRIES:
                retry_delays = parse_retry_delays()
                next_delay = retry_delays[attempt_number - 1] if attempt_number <= len(retry_delays) else 45

                attempt.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=next_delay)
                db.commit()

                logger.warning(
                    f"Webhook delivery error for job {job_id}, "
                    f"retrying in {next_delay}s: {error_message}"
                )

                raise self.retry(countdown=next_delay)
            else:
                # All retries exhausted
                job.webhook_permanently_failed = True
                db.commit()

                logger.error(
                    f"Webhook delivery permanently failed for job {job_id} "
                    f"after {attempt_number} attempts: {error_message}"
                )

                # Send admin email notification
                try:
                    notifier = EmailNotifier()
                    notifier.send_webhook_failure_notification(
                        job_id=str(job.id),
                        workflow_name=job.workflow_name,
                        webhook_url=job.webhook_url,
                        error_message=error_message,
                        attempt_count=attempt_number
                    )
                except Exception as email_error:
                    logger.error(f"Failed to send admin email notification: {email_error}")

                return {
                    "success": False,
                    "permanently_failed": True,
                    "attempt": attempt_number,
                    "error": error_message
                }

        finally:
            sender.close()

    except Exception as e:
        logger.error(f"Unexpected error in webhook delivery task: {e}")
        db.rollback()
        raise

    finally:
        db.close()


from datetime import timedelta, timezone
