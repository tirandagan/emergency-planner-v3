"""
SQLAlchemy model for llm_provider_usage table.

Tracks LLM API usage, token consumption, and costs for billing and analytics.
"""

from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Integer, DateTime, Numeric, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class ProviderUsage(Base):
    """
    LLM provider usage tracking model.

    Stores token consumption, costs, and performance metrics for each LLM API call.
    Used for billing, analytics, and cost optimization.

    Relationships:
    - job_id: Foreign key to llm_workflow_jobs table
    """

    __tablename__ = 'llm_provider_usage'

    # Primary identification
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), nullable=True)  # References llm_workflow_jobs(id)

    # Provider metadata
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)

    # Token usage
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)

    # Cost tracking (6 decimal places for precision)
    cost_usd = Column(Numeric(10, 6), nullable=False, default=Decimal('0.000000'))

    # Performance metrics
    duration_ms = Column(Integer, nullable=True)

    # Additional metadata (model-specific parameters, response IDs, etc.)
    # Note: Using 'extra_metadata' instead of 'metadata' (reserved by SQLAlchemy)
    extra_metadata = Column('metadata', JSONB, nullable=True)

    # Audit
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_provider_usage_job_id', 'job_id'),
        Index('idx_provider_usage_provider', 'provider'),
        Index('idx_provider_usage_model', 'model'),
        Index('idx_provider_usage_created_at', 'created_at'),
        {'schema': None}  # Use default schema
    )

    def __repr__(self) -> str:
        return (
            f"<ProviderUsage(id={self.id}, "
            f"provider={self.provider}, "
            f"model={self.model}, "
            f"tokens={self.total_tokens}, "
            f"cost=${self.cost_usd})>"
        )

    def to_dict(self) -> dict:
        """Convert model to dictionary for API responses."""
        return {
            "id": str(self.id),
            "job_id": str(self.job_id) if self.job_id else None,
            "provider": self.provider,
            "model": self.model,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "cost_usd": float(self.cost_usd),
            "duration_ms": self.duration_ms,
            "metadata": self.extra_metadata,  # Map extra_metadata back to metadata for API
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
