"""
FastAPI API routes.

Organizes API endpoints by version (v1, v2, etc.).
"""

from fastapi import APIRouter
from app.api.v1 import router as v1_router

# Main API router
router = APIRouter()

# Include versioned API routers
router.include_router(v1_router, prefix="/v1", tags=["v1"])

__all__ = ["router"]
