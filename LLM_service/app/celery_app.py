"""Celery application configuration."""
# NOTE: eventlet.monkey_patch() should ONLY be called in Celery worker processes,
# NOT in the FastAPI application. Monkey patching in FastAPI causes threading
# conflicts with Gunicorn + Uvicorn workers and SQLAlchemy connection pooling.
# The Celery worker process will handle its own monkey patching if using --pool=eventlet

import ssl
from celery import Celery
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Configure SSL for Redis connections if using rediss://
broker_use_ssl = {}
backend_use_ssl = {}

if settings.BROKER_URL.startswith("rediss://"):
    broker_use_ssl = {
        "ssl_cert_reqs": ssl.CERT_NONE,
        "ssl_check_hostname": False,
    }

if settings.RESULT_BACKEND.startswith("rediss://"):
    backend_use_ssl = {
        "ssl_cert_reqs": ssl.CERT_NONE,
        "ssl_check_hostname": False,
    }

# Initialize Celery app
celery_app = Celery(
    "llm_workflow_service",
    broker=settings.BROKER_URL,
    backend=settings.RESULT_BACKEND,
)

# Celery configuration
celery_app.conf.update(
    task_serializer=settings.TASK_SERIALIZER,
    result_serializer=settings.RESULT_SERIALIZER,
    accept_content=[settings.TASK_SERIALIZER],
    timezone=settings.TIMEZONE,
    enable_utc=True,
    task_track_started=True,
    task_time_limit=settings.TASK_TIME_LIMIT,
    task_soft_time_LIMIT=settings.TASK_SOFT_TIME_LIMIT,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=3600,  # 1 hour
    broker_use_ssl=broker_use_ssl if broker_use_ssl else None,
    redis_backend_use_ssl=backend_use_ssl if backend_use_ssl else None,
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.tasks"])

logger.info("✅ Celery app initialized")
