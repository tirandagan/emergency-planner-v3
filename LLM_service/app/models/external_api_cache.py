"""
SQLAlchemy model for external_api_cache table.

Stores external API responses with automatic expiration.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class ExternalAPICache(Base):
    """
    External API response cache model.

    Stores API responses from Google Places, WeatherAPI, and other external services.
    Implements automatic expiration and cache hit tracking.
    """

    __tablename__ = 'external_api_cache'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_name = Column(String(50), nullable=False)
    operation = Column(String(50), nullable=False)
    cache_key = Column(String(255), nullable=False)
    request_params = Column(JSONB, nullable=False)
    response_data = Column(JSONB, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    hit_count = Column(Integer, default=0)
    last_accessed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index('idx_cache_lookup', 'service_name', 'operation', 'cache_key', 'expires_at'),
        Index('idx_cache_expiration', 'expires_at'),
        Index('idx_cache_analytics', 'service_name', 'created_at'),
        {'schema': None}  # Use default schema
    )

    def __repr__(self) -> str:
        return (
            f"<ExternalAPICache(service={self.service_name}, "
            f"operation={self.operation}, "
            f"expires_at={self.expires_at}, "
            f"hits={self.hit_count})>"
        )
