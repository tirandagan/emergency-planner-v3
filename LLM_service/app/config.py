"""Configuration management with environment variable expansion."""
import os
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Environment
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str
    POOL_SIZE: int = 10
    MAX_OVERFLOW: int = 20
    POOL_TIMEOUT: int = 30
    POOL_RECYCLE: int = 3600

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_DB: int = 0

    # Celery (will be computed from REDIS_URL after initialization)
    BROKER_URL: str = ""
    RESULT_BACKEND: str = ""
    TASK_SERIALIZER: str = "json"
    RESULT_SERIALIZER: str = "json"
    TIMEZONE: str = "UTC"
    TASK_TIME_LIMIT: int = 3600
    TASK_SOFT_TIME_LIMIT: int = 3300

    def __init__(self, **kwargs):
        """Initialize settings and set Celery URLs from REDIS_URL."""
        super().__init__(**kwargs)
        # Set Celery broker and backend from REDIS_URL if not explicitly set
        if not self.BROKER_URL:
            self.BROKER_URL = self.REDIS_URL
        if not self.RESULT_BACKEND:
            self.RESULT_BACKEND = self.REDIS_URL

    # API
    API_TITLE: str = "LLM Workflow Microservice"
    API_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: str = "http://localhost:3000"

    # OpenRouter
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Google Services (alias to match main app's env var name)
    GOOGLE_PLACES_API_KEY: str = Field(
        ..., validation_alias="NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY"
    )

    class Config:
        env_file = ".env.local"
        case_sensitive = True
        populate_by_name = True  # Allow both field name and alias


def load_settings() -> Settings:
    """Load settings from .env.local and environment variables."""
    from dotenv import load_dotenv

    # Load .env.local from LLM_service directory
    env_path = Path(__file__).parent.parent / ".env.local"
    load_dotenv(env_path)

    # Create settings from environment
    return Settings()


# Global settings instance
settings = load_settings()
