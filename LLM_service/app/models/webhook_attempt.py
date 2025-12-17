"""
SQLAlchemy model for llm_webhook_attempts table.

Tracks webhook delivery attempts with retry logic and dead letter queue support.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class WebhookAttempt(Base):
    """
    Webhook delivery attempt tracking model.

    Stores webhook delivery attempts with HTTP response data, error messages,
    and retry scheduling. Implements dead letter queue pattern for failed deliveries.

    Relationships:
    - job_id: Foreign key to llm_workflow_jobs table
    """

    __tablename__ = 'llm_webhook_attempts'

    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), nullable=False)  # References llm_workflow_jobs(id)

    # Attempt metadata
    attempt_number = Column(Integer, nullable=False)
    webhook_url = Column(Text, nullable=False)
    payload = Column(JSONB, nullable=False)

    # Response data
    http_status = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    # Timing
    attempted_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    duration_ms = Column(Integer, nullable=True)
    next_retry_at = Column(DateTime, nullable=True)

    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_webhook_attempts_job_id', 'job_id'),
        Index('idx_webhook_attempts_status', 'http_status'),
        {'schema': None}  # Use default schema
    )

    def __repr__(self) -> str:
        return (
            f"<WebhookAttempt(id={self.id}, "
            f"job_id={self.job_id}, "
            f"attempt={self.attempt_number}, "
            f"status={self.http_status})>"
        )

    def to_dict(self) -> dict:
        """Convert model to dictionary for API responses."""
        return {
            "id": str(self.id),
            "job_id": str(self.job_id),
            "attempt_number": self.attempt_number,
            "webhook_url": self.webhook_url,
            "payload": self.payload,
            "http_status": self.http_status,
            "response_body": self.response_body,
            "error_message": self.error_message,
            "attempted_at": self.attempted_at.isoformat() if self.attempted_at else None,
            "duration_ms": self.duration_ms,
            "next_retry_at": self.next_retry_at.isoformat() if self.next_retry_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
