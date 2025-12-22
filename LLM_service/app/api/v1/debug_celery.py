"""
Debug endpoint to check what secret Celery workers are using.
"""

import hashlib
import hmac
import logging

from fastapi import APIRouter, status
from app.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@celery_app.task(name="debug_secret_check")
def debug_secret_check_task():
    """Celery task to check what secret the worker is using."""
    secret = settings.LLM_WEBHOOK_SECRET

    # Create test signature
    test_payload = '{"test":"data"}'
    test_signature = hmac.new(
        secret.encode('utf-8'),
        test_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Create secret hash
    secret_hash = hmac.new(
        b'test-key',
        secret.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return {
        "worker": "celery",
        "configured": True if secret and secret != "default-webhook-secret-change-in-production" else False,
        "secret_length": len(secret),
        "secret_hash": secret_hash,
        "secret_preview": f"{secret[:10]}...{secret[-4:]}",
        "test_payload": test_payload,
        "test_signature": f"sha256={test_signature}"
    }


@router.get(
    "/debug/celery-secret",
    status_code=status.HTTP_200_OK,
    summary="Check Celery worker webhook secret configuration",
    description="Triggers a Celery task to check what secret the worker processes are using"
)
async def get_celery_secret():
    """
    Check what secret Celery workers are using for webhook signatures.

    This is important because the FastAPI app and Celery workers might
    have different environment variables if they were started at different times.
    """
    # Trigger the task and wait for result (with timeout)
    result = debug_secret_check_task.apply_async()

    try:
        worker_config = result.get(timeout=5)
        return {
            "fastapi": {
                "configured": True if settings.LLM_WEBHOOK_SECRET and settings.LLM_WEBHOOK_SECRET != "default-webhook-secret-change-in-production" else False,
                "secret_length": len(settings.LLM_WEBHOOK_SECRET),
                "secret_preview": f"{settings.LLM_WEBHOOK_SECRET[:10]}...{settings.LLM_WEBHOOK_SECRET[-4:]}",
            },
            "celery_worker": worker_config,
            "match": worker_config["secret_hash"] == hmac.new(
                b'test-key',
                settings.LLM_WEBHOOK_SECRET.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
        }
    except Exception as e:
        return {
            "error": f"Failed to get Celery worker response: {str(e)}",
            "note": "Worker might be offline or task queue is full"
        }
