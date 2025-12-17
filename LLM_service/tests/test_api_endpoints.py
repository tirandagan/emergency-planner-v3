"""
Integration tests for Phase 6 API endpoints.

Tests:
- POST /api/v1/workflow - Workflow submission
- GET /api/v1/status/{job_id} - Status query
- POST /api/v1/workflow/validate - Workflow validation (dry-run)
"""

import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.config import settings

# Test database setup (use in-memory SQLite for testing)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestWorkflowEndpoints:
    """Test workflow submission and validation endpoints."""

    def setup_method(self):
        """Create test database tables before each test."""
        Base.metadata.create_all(bind=engine)

    def teardown_method(self):
        """Drop test database tables after each test."""
        Base.metadata.drop_all(bind=engine)

    def test_submit_workflow_emergency_contacts(self):
        """Test workflow submission with emergency_contacts workflow."""
        payload = {
            "workflow_name": "emergency_contacts",
            "user_id": str(uuid.uuid4()),
            "input_data": {
                "formData": {
                    "location": "Seattle, WA",
                    "scenario": "earthquake"
                }
            },
            "priority": 0
        }

        response = client.post("/api/v1/workflow", json=payload)

        assert response.status_code == 202
        data = response.json()

        assert "job_id" in data
        assert "celery_task_id" in data
        assert "status" in data
        assert "status_url" in data
        assert data["status"] in ["queued", "pending"]

        # Verify job_id is a valid UUID
        job_id = uuid.UUID(data["job_id"])
        assert isinstance(job_id, uuid.UUID)

    def test_submit_workflow_invalid_name(self):
        """Test workflow submission with invalid workflow name."""
        payload = {
            "workflow_name": "nonexistent_workflow",
            "input_data": {"test": "data"},
            "priority": 0
        }

        response = client.post("/api/v1/workflow", json=payload)

        assert response.status_code == 404
        data = response.json()
        assert "error" in data["detail"]
        assert data["detail"]["error"] == "WorkflowNotFound"

    def test_submit_workflow_with_webhook(self):
        """Test workflow submission with webhook configuration."""
        payload = {
            "workflow_name": "emergency_contacts",
            "user_id": str(uuid.uuid4()),
            "input_data": {"formData": {"location": "Seattle, WA"}},
            "webhook_url": "https://example.com/webhook",
            "webhook_secret": "test_secret_123",
            "priority": 5
        }

        response = client.post("/api/v1/workflow", json=payload)

        assert response.status_code == 202
        data = response.json()
        assert data["status"] in ["queued", "pending"]

    def test_submit_workflow_missing_webhook_secret(self):
        """Test workflow submission with webhook_url but no secret."""
        payload = {
            "workflow_name": "emergency_contacts",
            "input_data": {"formData": {"location": "Seattle, WA"}},
            "webhook_url": "https://example.com/webhook",
            # Missing webhook_secret
            "priority": 0
        }

        response = client.post("/api/v1/workflow", json=payload)

        # Should fail validation
        assert response.status_code == 422

    def test_validate_workflow_valid(self):
        """Test workflow validation with valid workflow."""
        payload = {
            "workflow_name": "emergency_contacts",
            "input_data": {
                "formData": {
                    "location": "Seattle, WA",
                    "scenario": "earthquake"
                }
            }
        }

        response = client.post("/api/v1/workflow/validate", json=payload)

        assert response.status_code == 200
        data = response.json()

        assert data["valid"] is True
        assert data["workflow_name"] == "emergency_contacts"
        assert "estimated_tokens" in data
        assert "estimated_cost_usd" in data
        assert "estimated_duration_seconds" in data

    def test_validate_workflow_not_found(self):
        """Test workflow validation with nonexistent workflow."""
        payload = {
            "workflow_name": "nonexistent_workflow",
            "input_data": {"test": "data"}
        }

        response = client.post("/api/v1/workflow/validate", json=payload)

        # Validation endpoint returns 200 with valid=false for workflow not found
        # (different from submit endpoint which returns 404)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert "errors" in data


class TestStatusEndpoint:
    """Test job status query endpoint."""

    def setup_method(self):
        """Create test database tables before each test."""
        Base.metadata.create_all(bind=engine)

    def teardown_method(self):
        """Drop test database tables after each test."""
        Base.metadata.drop_all(bind=engine)

    def test_get_status_not_found(self):
        """Test status query for nonexistent job."""
        job_id = str(uuid.uuid4())
        response = client.get(f"/api/v1/status/{job_id}")

        assert response.status_code == 404
        data = response.json()
        assert "error" in data["detail"]
        assert data["detail"]["error"] == "JobNotFound"

    def test_get_status_invalid_uuid(self):
        """Test status query with invalid job ID format."""
        response = client.get("/api/v1/status/invalid-uuid")

        assert response.status_code == 400
        data = response.json()
        assert "error" in data["detail"]
        assert data["detail"]["error"] == "InvalidJobID"

    def test_get_status_after_submission(self):
        """Test status query after workflow submission."""
        # First, submit a workflow
        submit_payload = {
            "workflow_name": "emergency_contacts",
            "input_data": {"formData": {"location": "Seattle, WA"}},
            "priority": 0
        }

        submit_response = client.post("/api/v1/workflow", json=submit_payload)
        assert submit_response.status_code == 202

        job_id = submit_response.json()["job_id"]

        # Then, query status
        status_response = client.get(f"/api/v1/status/{job_id}")

        assert status_response.status_code == 200
        data = status_response.json()

        assert data["job_id"] == job_id
        assert data["status"] in ["pending", "queued", "processing"]
        assert data["workflow_name"] == "emergency_contacts"
        assert "created_at" in data


class TestHealthEndpoint:
    """Test health check endpoint."""

    def test_health_check(self):
        """Test health check returns service status."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert "services" in data
        assert "database" in data["services"]
        assert "redis" in data["services"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
