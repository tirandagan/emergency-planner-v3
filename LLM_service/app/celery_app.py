"""Celery application configuration."""
# CRITICAL: eventlet.monkey_patch() MUST be called before any other imports
# when using --pool=eventlet. This ensures all blocking operations are patched.
import sys

# Only monkey patch in Celery worker context (not FastAPI/Gunicorn)
if 'celery' in sys.argv[0] or 'worker' in sys.argv:
    try:
        import eventlet
        eventlet.monkey_patch()
        print("✅ eventlet.monkey_patch() applied successfully")

        # CRITICAL: Apply nest_asyncio IMMEDIATELY after monkey_patch
        # This allows asyncio event loops (used by Redis cache/rate limiter) to work
        # with eventlet's green threads without socket conflicts
        try:
            import nest_asyncio
            nest_asyncio.apply()
            print("✅ nest_asyncio applied for asyncio compatibility")

            # Disable eventlet's multiple readers check since nest_asyncio handles it
            # nest_asyncio intentionally uses multiple readers for nested event loops
            # and eventlet's safety check treats this as an error
            eventlet.debug.hub_prevent_multiple_readers(False)
            print("✅ Disabled eventlet multiple readers check (handled by nest_asyncio)")
        except Exception as e:
            print(f"⚠️  Failed to apply nest_asyncio: {e}")
            print("   Asyncio operations may conflict with eventlet")

        # CRITICAL: Patch psycopg2 for PostgreSQL connections under eventlet
        # This prevents "Second simultaneous read on fileno" errors when multiple
        # green threads access database connections from the connection pool
        try:
            from eventlet.support import psycopg2_patcher
            psycopg2_patcher.make_psycopg_green()
            print("✅ psycopg2 patched for eventlet green threads")
        except Exception as e:
            print(f"⚠️  Failed to patch psycopg2: {e}")
            print("   This may cause socket conflicts with PostgreSQL connections")

    except ImportError:
        print("⚠️  eventlet not available")

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
