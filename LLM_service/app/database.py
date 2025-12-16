"""SQLAlchemy database connection with Supabase PostgreSQL."""
from sqlalchemy import create_engine, event, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Fix DATABASE_URL for SQLAlchemy 2.0 (requires postgresql:// not postgres://)
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# SQLAlchemy engine with connection pooling
engine = create_engine(
    database_url,
    poolclass=QueuePool,
    pool_size=settings.POOL_SIZE,
    max_overflow=settings.MAX_OVERFLOW,
    pool_timeout=settings.POOL_TIMEOUT,
    pool_recycle=settings.POOL_RECYCLE,
    pool_pre_ping=True,  # Verify connections before using
    echo=settings.ENVIRONMENT == "development",
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()


def get_db():
    """Dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection() -> bool:
    """Test database connectivity."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


# Connection event listeners for debugging
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Log successful connections."""
    logger.debug("Database connection established")


@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Log connection checkout from pool."""
    logger.debug("Connection checked out from pool")
