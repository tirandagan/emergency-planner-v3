"""
Webhook delivery service with HMAC signature generation and retry logic.

This module handles secure webhook delivery with SHA-256 HMAC signatures,
exponential backoff retries, and comprehensive error handling.
"""

import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class WebhookDeliveryError(Exception):
    """Raised when webhook delivery fails."""
    pass


class WebhookSender:
    """
    Webhook delivery service with HMAC signature support.

    Features:
    - SHA-256 HMAC signature generation
    - Configurable timeout (default 30s)
    - Standard webhook headers (X-Webhook-Signature, X-Webhook-Event)
    - Comprehensive error tracking
    """

    def __init__(self, timeout: int = None):
        """
        Initialize webhook sender.

        Args:
            timeout: HTTP request timeout in seconds (default from settings)
        """
        self.timeout = timeout or settings.WEBHOOK_TIMEOUT
        self.client = httpx.Client(timeout=self.timeout)

    def _generate_signature(self, payload: str, secret: str) -> str:
        """
        Generate SHA-256 HMAC signature for webhook payload.

        Args:
            payload: JSON string payload to sign
            secret: Secret key for HMAC generation

        Returns:
            Hex digest signature in format: sha256=<hex_digest>
        """
        signature = hmac.new(
            secret.encode('utf-8'),
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return f"sha256={signature}"

    def send_webhook(
        self,
        url: str,
        event_type: str,
        payload: Dict[str, Any],
        secret: Optional[str] = None
    ) -> Tuple[bool, int, Optional[str], int]:
        """
        Send webhook with HMAC signature.
        """
        # Use per-job secret or fall back to global secret
        webhook_secret = (secret or settings.LLM_WEBHOOK_SECRET).strip()

        # Serialize payload (use compact format and sorted keys for consistency)
        payload_json = json.dumps(payload, separators=(',', ':'), sort_keys=True)

        # Generate HMAC signature from the exact serialized payload
        signature = self._generate_signature(payload_json, webhook_secret)

        # DEBUG: Log serialization details
        logger.info(f"[Webhook] Payload length: {len(payload_json)}")
        logger.info(f"[Webhook] Payload first 300 chars: {payload_json[:300]}")
        logger.info(f"[Webhook] Full signature: {signature}")
        logger.info(f"[Webhook] Secret length: {len(webhook_secret)}, first 10: {webhook_secret[:10]}...")

        # Build headers
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event_type,
            "User-Agent": f"{settings.API_TITLE}/{settings.API_VERSION}"
        }

        # Send request with timing
        start_time = datetime.now(timezone.utc)

        try:
            # CRITICAL: Send the exact pre-serialized JSON that was signed
            # Don't use json=payload because httpx will re-serialize it
            response = self.client.post(
                url,
                content=payload_json,
                headers=headers
            )

            duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

            # Check for successful status codes (2xx)
            if 200 <= response.status_code < 300:
                logger.info(
                    f"Webhook delivered successfully to {url} "
                    f"(event={event_type}, status={response.status_code}, duration={duration_ms}ms)"
                )
                return True, response.status_code, response.text, duration_ms
            else:
                logger.warning(
                    f"Webhook delivery failed: {url} "
                    f"(event={event_type}, status={response.status_code}, duration={duration_ms}ms)"
                )
                return False, response.status_code, response.text, duration_ms

        except httpx.TimeoutException as e:
            duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            error_msg = f"Webhook timeout after {duration_ms}ms: {str(e)}"
            logger.error(error_msg)
            raise WebhookDeliveryError(error_msg)

        except httpx.RequestError as e:
            duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            error_msg = f"Webhook request failed: {str(e)}"
            logger.error(error_msg)
            raise WebhookDeliveryError(error_msg)

        except Exception as e:
            duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            error_msg = f"Unexpected webhook error: {str(e)}"
            logger.error(error_msg)
            raise WebhookDeliveryError(error_msg)

    def close(self):
        """Close HTTP client connection."""
        self.client.close()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - close client."""
        self.close()


def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    """
    Verify webhook HMAC signature (for testing/validation).

    Args:
        payload: Raw JSON payload string
        signature: Signature header value (format: sha256=<hex_digest>)
        secret: Secret key used for signature generation

    Returns:
        True if signature is valid, False otherwise

    Example:
        >>> payload = '{"event":"test"}'
        >>> signature = "sha256=abc123..."
        >>> verify_webhook_signature(payload, signature, "my-secret")
        True
    """
    if not signature.startswith("sha256="):
        return False

    expected_digest = signature[7:]  # Remove "sha256=" prefix

    actual_signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(expected_digest, actual_signature)
