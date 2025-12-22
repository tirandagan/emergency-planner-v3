"""
Debug endpoints for troubleshooting configuration issues.

Endpoints:
- GET /debug/webhook-config - Check webhook secret configuration
"""

import hashlib
import hmac
import logging

from fastapi import APIRouter, status
from app.config import settings
from app.schemas.common import ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/debug/webhook-config",
    status_code=status.HTTP_200_OK,
    summary="Check webhook secret configuration",
    description="Returns diagnostic information about webhook secret configuration (safe - does not expose actual secret)",
    responses={
        200: {
            "description": "Webhook configuration diagnostics",
        },
        500: {
            "description": "Internal server error",
            "model": ErrorResponse
        }
    }
)
async def get_webhook_config():
    """
    Get webhook secret configuration diagnostics.

    Returns safe diagnostic information without exposing the actual secret:
    - Whether secret is configured
    - Secret length
    - Hash of secret for comparison
    - Test signature for verification
    """
    secret = settings.LLM_WEBHOOK_SECRET

    if not secret or secret == "default-webhook-secret-change-in-production":
        return {
            "configured": False,
            "error": "LLM_WEBHOOK_SECRET not properly configured",
            "using_default": secret == "default-webhook-secret-change-in-production"
        }

    # Create a hash of the secret (safe to expose)
    secret_hash = hmac.new(
        b'test-key',
        secret.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Test signature with known payload
    test_payload = '{"test":"data"}'
    test_signature = hmac.new(
        secret.encode('utf-8'),
        test_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return {
        "configured": True,
        "secret_length": len(secret),
        "secret_hash": secret_hash,
        "secret_preview": f"{secret[:10]}...{secret[-4:]}",
        "has_trimmed_difference": secret != secret.strip(),
        "test_payload": test_payload,
        "test_signature": f"sha256={test_signature}"
    }
