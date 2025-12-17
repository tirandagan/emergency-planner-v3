"""FastAPI application with health check endpoint."""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.database import get_db, test_connection, engine
from app.celery_app import celery_app
from app.api import router as api_router
import redis
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    description="LLM Microservice for asynchronous AI workflow execution",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
def startup_event():
    """Run on application startup."""
    logger.info(f"🚀 Starting {settings.API_TITLE} v{settings.API_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    # Test database connection
    if not test_connection():
        logger.error("Database connection failed on startup")

    logger.info("✅ Application startup complete")


@app.on_event("shutdown")
def shutdown_event():
    """Run on application shutdown."""
    logger.info("Shutting down application...")
    engine.dispose()
    logger.info("✅ Application shutdown complete")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint.

    Checks:
    - API server status
    - Database connectivity
    - Redis connectivity
    - Celery worker status
    """
    health = {
        "status": "healthy",
        "services": {},
    }

    # Check database
    try:
        db.execute(text("SELECT 1"))
        health["services"]["database"] = {"status": "healthy", "type": "postgresql"}
    except Exception as e:
        health["status"] = "unhealthy"
        health["services"]["database"] = {"status": "unhealthy", "error": str(e)}

    # Check Redis
    redis_client = None
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        redis_client.ping()
        health["services"]["redis"] = {"status": "healthy"}
    except Exception as e:
        health["status"] = "degraded"
        health["services"]["redis"] = {"status": "unhealthy", "error": str(e)}
    finally:
        if redis_client:
            redis_client.close()

    # Check Celery workers
    try:
        inspect = celery_app.control.inspect()
        active_workers = inspect.active()
        if active_workers:
            health["services"]["celery"] = {
                "status": "healthy",
                "workers": len(active_workers),
            }
        else:
            health["status"] = "degraded"
            health["services"]["celery"] = {
                "status": "no_workers",
                "workers": 0,
            }
    except Exception as e:
        health["status"] = "degraded"
        health["services"]["celery"] = {"status": "unavailable", "error": str(e)}

    return health


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
    )
