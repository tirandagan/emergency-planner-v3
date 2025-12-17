"""Celery application configuration."""
# IMPORTANT: eventlet monkey patching must be first for worker with --pool=eventlet
import eventlet
eventlet.monkey_patch()

from celery import Celery
from app.config import settings
import logging

logger = logging.getLogger(__name__)

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
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.tasks"])

logger.info("✅ Celery app initialized")
