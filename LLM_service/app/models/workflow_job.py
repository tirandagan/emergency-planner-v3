"""
SQLAlchemy model for llm_workflow_jobs table.

Tracks asynchronous workflow job execution with status, results, and metadata.
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, Text, Boolean, DateTime, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class JobStatus(str, Enum):
    """
    Job execution status.

    States:
    - PENDING: Job created but not yet queued
    - QUEUED: Job queued in Celery
    - PROCESSING: Job currently executing
    - COMPLETED: Job finished successfully
    - FAILED: Job failed with error
    - CANCELLED: Job cancelled by user or system
    """
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class WorkflowJob(Base):
    """
    Workflow job tracking model.

    Stores workflow execution state, results, and metadata. Integrates with
    Celery for asynchronous processing and provides webhook notification support.

    Relationships:
    - user_id: Foreign key to profiles table (Supabase Auth)
    - job_id: Primary key used by API for status queries
    - celery_task_id: Celery task ID for worker coordination
    """

    __tablename__ = 'llm_workflow_jobs'

    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    celery_task_id = Column(String(255), unique=True, nullable=False)
    workflow_name = Column(String(100), nullable=False)

    # Priority and webhook configuration
    priority = Column(Integer, default=0)
    webhook_url = Column(Text, nullable=True)
    webhook_secret = Column(String(255), nullable=True)
    webhook_permanently_failed = Column(Boolean, default=False)
    debug_mode = Column(Boolean, default=False)

    # User tracking
    user_id = Column(UUID(as_uuid=True), nullable=True)  # References profiles(id)

    # Execution state
    status = Column(String(50), nullable=False, default=JobStatus.PENDING.value)
    input_data = Column(JSONB, nullable=False)
    result_data = Column(JSONB, nullable=True)
    error_message = Column(Text, nullable=True)

    # Timing metadata
    queued_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # Retry logic
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)

    # Stale job detection
    is_stale = Column(Boolean, default=False)
    stale_reason = Column(String(100), nullable=True)

    # Audit timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_workflow_jobs_celery_task', 'celery_task_id'),
        Index('idx_workflow_jobs_status', 'status'),
        Index('idx_workflow_jobs_user_id', 'user_id'),
        Index('idx_workflow_jobs_workflow_name', 'workflow_name'),
        Index('idx_workflow_jobs_created_at', 'created_at'),
        {'schema': None}  # Use default schema
    )

    def __repr__(self) -> str:
        return (
            f"<WorkflowJob(id={self.id}, "
            f"workflow={self.workflow_name}, "
            f"status={self.status}, "
            f"celery_task={self.celery_task_id})>"
        )

    def to_dict(self) -> dict:
        """Convert model to dictionary for API responses."""
        return {
            "job_id": str(self.id),
            "celery_task_id": self.celery_task_id,
            "workflow_name": self.workflow_name,
            "status": self.status,
            "priority": self.priority,
            "user_id": str(self.user_id) if self.user_id else None,
            "input_data": self.input_data,
            "result_data": self.result_data,
            "error_message": self.error_message,
            "queued_at": self.queued_at.isoformat() if self.queued_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_ms": self.duration_ms,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "is_stale": self.is_stale,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
