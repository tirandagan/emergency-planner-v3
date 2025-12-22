"""
Debug tasks for Celery worker diagnostics.
"""

import hashlib
import hmac
import logging

from app.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)


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
