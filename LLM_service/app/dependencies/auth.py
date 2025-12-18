"""
FastAPI authentication dependency for API secret validation.

Provides authentication for all LLM service endpoints using a shared
secret from environment configuration (LLM_WEBHOOK_SECRET).
"""

import logging
from fastapi import Header, HTTPException, status
from app.config import settings

logger = logging.getLogger(__name__)


async def verify_api_secret(
    x_api_secret: str = Header(..., alias="X-API-Secret", description="API secret for authentication")
) -> bool:
    """
    Verify API secret from X-API-Secret header against configured secret.

    This dependency should be applied to all API endpoints to ensure
    only authorized clients can access the LLM workflow service.

    Args:
        x_api_secret: Secret value from X-API-Secret HTTP header

    Returns:
        True if authentication successful

    Raises:
        HTTPException: 401 Unauthorized if secret is invalid or missing

    Example:
        @router.get("/endpoint", dependencies=[Depends(verify_api_secret)])
        def my_endpoint():
            return {"status": "authenticated"}
    """
    if x_api_secret != settings.LLM_WEBHOOK_SECRET:
        logger.warning("Authentication failed: Invalid API secret provided")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "InvalidAPISecret",
                "message": "Invalid or missing API secret. Include X-API-Secret header with valid secret."
            }
        )

    logger.debug("Authentication successful")
    return True
