"""
API v1 routes.

Includes:
- /workflow - Workflow submission and validation endpoints
- /status/{job_id} - Job status query endpoint
- /jobs - Jobs list with filtering and pagination
"""

from fastapi import APIRouter
from app.api.v1 import workflow, status, jobs

# V1 API router
router = APIRouter()

# Include endpoint routers
router.include_router(workflow.router, tags=["workflow"])
router.include_router(status.router, tags=["status"])
router.include_router(jobs.router, tags=["jobs"])

__all__ = ["router"]
