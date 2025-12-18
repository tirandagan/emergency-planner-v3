# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Add Jobs List API Endpoint with Filtering

### Goal Statement
**Goal:** Create a new API endpoint (`GET /api/v1/jobs`) that returns a user-friendly list of workflow jobs with optional filtering by status (running, completed, failed, all). This will provide a convenient way to query multiple jobs without requiring individual status checks, enabling dashboard views and job monitoring interfaces.

---

## 2. Strategic Analysis & Solution Options

### ✅ APPROVED APPROACH: GET Endpoint with Header Authentication

**User Decision:** Use GET endpoint with `X-API-Secret` header authentication for all API endpoints.

### Authentication Architecture

**Security Model:**
- **Global API Secret:** Single shared secret from `LLM_WEBHOOK_SECRET` environment variable
- **Authentication Method:** HTTP Header (`X-API-Secret: your-secret`)
- **Scope:** ALL API endpoints require authentication (new `/jobs` + existing `/status`, `/workflow`)
- **Implementation:** FastAPI dependency injection for reusable auth validation

**Why Header Authentication:**
1. ✅ **Works with all HTTP methods** - GET, POST, PUT, DELETE
2. ✅ **RESTful design preserved** - GET requests for read operations
3. ✅ **Cacheable** - HTTP caching works with header-based auth
4. ✅ **Single mechanism** - Same auth for all endpoints
5. ✅ **Easy to apply** - FastAPI dependencies make it simple to add to existing endpoints
6. ✅ **OpenAPI documentation** - Automatically documented in `/docs` endpoint

### Endpoint Design

**New Endpoint:**
```http
GET /api/v1/jobs?status=running&limit=50&offset=0
X-API-Secret: your-secret-from-env
```

**Authentication Dependency:**
```python
# app/dependencies/auth.py
async def verify_api_secret(
    x_api_secret: str = Header(..., alias="X-API-Secret")
):
    if x_api_secret != settings.LLM_WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid API secret")
```

**Applied to all endpoints:**
```python
@router.get("/jobs", dependencies=[Depends(verify_api_secret)])
@router.get("/status/{job_id}", dependencies=[Depends(verify_api_secret)])
@router.post("/workflow", dependencies=[Depends(verify_api_secret)])
```

### Filter Parameters

**Status Mapping:**
- `?status=running` → Jobs in `QUEUED` or `PROCESSING` state
- `?status=completed` → Jobs in `COMPLETED` state
- `?status=failed` → Jobs in `FAILED` state
- `?status=all` or no filter → All jobs

**Pagination:**
- `?limit=50` (default, max 200)
- `?offset=0` (default)

**Optional User Scoping:**
- `?user_id={uuid}` - Filter by specific user

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Framework & Version:** FastAPI (Python web framework for building APIs)
- **Language:** Python 3.11+ with type hints and Pydantic schemas
- **Database & ORM:** PostgreSQL via SQLAlchemy ORM with declarative models
- **Task Queue:** Celery with Redis broker for asynchronous job execution
- **Authentication:** User-scoped queries via `user_id` (UUID references Supabase profiles)
- **Key Architectural Patterns:**
  - FastAPI routers for API endpoints (`app/api/v1/`)
  - Pydantic schemas for request/response validation (`app/schemas/`)
  - SQLAlchemy models for database tables (`app/models/`)
  - Existing pagination and filtering patterns in codebase
- **Relevant Existing Components:**
  - `app/api/v1/status.py` - Single job status endpoint (template for new endpoint)
  - `app/models/workflow_job.py` - WorkflowJob model with `to_dict()` method
  - `app/schemas/status.py` - Pydantic schemas for job status (reusable)

### Current State
The LLM service currently supports:
- **Workflow submission** - `POST /api/v1/workflow` creates jobs in `PENDING` status
- **Single job status** - `GET /api/v1/status/{job_id}` returns detailed job info
- **Database tracking** - `llm_workflow_jobs` table stores all job metadata

**What's missing:**
- No way to query multiple jobs at once
- No filtering by status or other criteria
- No pagination for large job lists
- No user-scoped job listing (security risk if implemented wrong)

**Existing database indexes:**
- `idx_workflow_jobs_status` - Fast filtering by status
- `idx_workflow_jobs_user_id` - Fast filtering by user
- `idx_workflow_jobs_created_at` - Date-based sorting

### Existing Context Providers Analysis
**N/A** - This is a backend Python FastAPI service, not a frontend React application with context providers. The relevant architecture is:
- **Database Session:** Provided via FastAPI dependency injection (`db: Session = Depends(get_db)`)
- **Authentication:** User ID passed via request (to be added to endpoint)

---

## 4. Context & Problem Definition

### Problem Statement
Users of the LLM workflow service need a way to retrieve lists of jobs without knowing specific job IDs. The current `/status/{job_id}` endpoint requires exact job IDs, making it impossible to:
- View all jobs for a user
- Monitor currently running jobs
- Review job history (completed/failed)
- Build dashboard UIs showing job lists

This creates friction for:
- **Frontend developers** - Can't build job monitoring dashboards
- **End users** - Can't see job history or track multiple concurrent jobs
- **Operations** - Can't monitor overall job queue health

### Success Criteria
- [x] New endpoint `GET /api/v1/jobs` returns list of jobs
- [x] Optional `status` filter accepts: `running`, `completed`, `failed`, `all` (default)
- [x] Optional `user_id` filter for user-scoped queries
- [x] Response includes friendly job information (job ID, workflow name, status, timestamps)
- [x] Response excludes full result data (use `/status/{job_id}` for that)
- [x] Returns jobs sorted by `created_at` descending (newest first)
- [x] Includes pagination support (limit/offset) to handle large job lists
- [x] Proper error handling for invalid filters
- [x] OpenAPI documentation auto-generated

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new application in active development**
- **No backwards compatibility concerns** - feel free to make breaking changes
- **Data loss acceptable** - existing data can be wiped/migrated aggressively
- **Users are developers/testers** - not production users requiring careful migration
- **Priority: Speed and simplicity** over data preservation
- **Aggressive refactoring allowed** - delete/recreate components as needed

---

## 6. Technical Requirements

### Functional Requirements
- **FR1:** User can request list of jobs via `GET /api/v1/jobs`
- **FR2:** User can filter by status using `?status=running|completed|failed|all`
- **FR3:** User can filter by user_id using `?user_id={uuid}`
- **FR4:** System returns jobs sorted by created_at descending (newest first)
- **FR5:** Response includes: job_id, workflow_name, status, priority, created_at, started_at, completed_at, duration_ms, user_id
- **FR6:** Response excludes: full result_data, full input_data (keep payload small)
- **FR7:** System supports pagination via `?limit={int}&offset={int}`
- **FR8:** Invalid status values return 400 Bad Request with clear error message
- **FR9:** Default behavior (no filters) returns all jobs
- **FR10:** Status filter "all" explicitly returns all jobs (same as no filter)

### Non-Functional Requirements
- **Performance:** Response time <200ms for typical queries (≤100 jobs)
- **Performance:** Query must use database indexes (status, user_id, created_at)
- **Security:** User-scoped queries prevent unauthorized access to other users' jobs
- **Usability:** Clear, consistent API design matching existing `/status/{job_id}` patterns
- **Maintainability:** Code follows existing FastAPI router patterns in `app/api/v1/`
- **Documentation:** OpenAPI schema auto-generated with examples

### Technical Constraints
- **Must use existing SQLAlchemy models** - Reuse `WorkflowJob` model from `app/models/workflow_job.py`
- **Must follow FastAPI patterns** - Router registration, dependency injection, Pydantic schemas
- **Must use Pydantic for validation** - Request/response schemas in `app/schemas/`
- **Must handle database errors** - Graceful error handling with appropriate HTTP status codes

---

## 7. Data & Database Changes

### Database Schema Changes
**No database schema changes required.** The existing `llm_workflow_jobs` table already has all necessary data and indexes:

```sql
-- Existing table (no changes needed)
CREATE TABLE llm_workflow_jobs (
    id UUID PRIMARY KEY,
    celery_task_id VARCHAR(255) UNIQUE NOT NULL,
    workflow_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    user_id UUID,
    priority INTEGER DEFAULT 0,
    input_data JSONB NOT NULL,
    result_data JSONB,
    error_message TEXT,
    queued_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Existing indexes (already optimal for this query)
CREATE INDEX idx_workflow_jobs_status ON llm_workflow_jobs(status);
CREATE INDEX idx_workflow_jobs_user_id ON llm_workflow_jobs(user_id);
CREATE INDEX idx_workflow_jobs_created_at ON llm_workflow_jobs(created_at);
```

### Data Model Updates
**New Pydantic schemas needed:**

```python
# app/schemas/jobs.py (new file)
from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime

class JobSummary(BaseModel):
    """
    Lightweight job summary for list views.
    Excludes heavy fields like result_data and input_data.
    """
    job_id: str = Field(..., description="Job UUID")
    workflow_name: str = Field(..., description="Workflow identifier")
    status: str = Field(..., description="Current job status")
    priority: int = Field(..., description="Job priority (0-10)")
    user_id: Optional[str] = Field(None, description="User UUID")
    created_at: str = Field(..., description="ISO 8601 timestamp")
    started_at: Optional[str] = Field(None, description="ISO 8601 timestamp")
    completed_at: Optional[str] = Field(None, description="ISO 8601 timestamp")
    duration_ms: Optional[int] = Field(None, description="Execution duration in milliseconds")
    error_message: Optional[str] = Field(None, description="Error message if failed")

class JobsListResponse(BaseModel):
    """Response schema for GET /api/v1/jobs"""
    jobs: List[JobSummary] = Field(..., description="List of job summaries")
    total: int = Field(..., description="Total number of jobs matching filter")
    limit: int = Field(..., description="Number of jobs returned")
    offset: int = Field(..., description="Starting offset for pagination")
```

### Data Migration Plan
**No data migration required** - This is a new read-only endpoint using existing data.

### 🚨 MANDATORY: Down Migration Safety Protocol
**N/A** - No database migrations required for this feature.

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 This is a QUERY operation** → Direct database query in endpoint function

#### **QUERIES (Data Fetching)** → Direct in endpoint (simple query)
- [x] **Direct in API Endpoint** - Simple `db.query(WorkflowJob).filter(...)` call
- [x] Used when: Single table query, simple WHERE clauses, list pagination
- [x] Example: `jobs = db.query(WorkflowJob).filter(WorkflowJob.status == status).all()`

**No Server Actions needed** - This is read-only data retrieval
**No API routes for mutations** - This is GET-only endpoint
**No complex queries in lib/** - Query is straightforward filtering on indexed columns

### API Routes

**🔐 Authentication Dependency (New):**
- [x] **`app/dependencies/auth.py`** - Shared authentication dependency
  - Function: `verify_api_secret(x_api_secret: str = Header(...))`
  - Validates `X-API-Secret` header against `settings.LLM_WEBHOOK_SECRET`
  - Returns: `HTTPException 401` if invalid
  - Used by: ALL API endpoints via `dependencies=[Depends(verify_api_secret)]`

**📝 New API Endpoint:**
- [x] **`GET /api/v1/jobs`** - List jobs with optional filtering
  - **Authentication:** Required via `X-API-Secret` header
  - Query parameters:
    - `status` (optional): `running|completed|failed|all` - Filter by job status
    - `user_id` (optional): UUID string - Filter by user
    - `limit` (optional): Integer (default 50, max 200) - Pagination limit
    - `offset` (optional): Integer (default 0) - Pagination offset
  - Response: `JobsListResponse` (list of `JobSummary` objects)
  - Status codes:
    - 200 OK - Jobs retrieved successfully
    - 401 Unauthorized - Missing or invalid API secret
    - 400 Bad Request - Invalid status value or pagination parameters
    - 500 Internal Server Error - Database error

**🔒 Update Existing Endpoints (Security Fix):**
- [x] **`GET /api/v1/status/{job_id}`** - Add authentication dependency
- [x] **`POST /api/v1/workflow`** - Add authentication dependency
- [x] **`POST /api/v1/workflow/validate`** - Add authentication dependency

**Status Mapping:**
- `running` → Filter for jobs with status `QUEUED` OR `PROCESSING`
- `completed` → Filter for jobs with status `COMPLETED`
- `failed` → Filter for jobs with status `FAILED`
- `all` → No status filter (return all)

**OpenAPI Documentation:**
- All endpoints will automatically show `X-API-Secret` header requirement in `/docs`
- FastAPI's security schemas will document the authentication model

---

## 9. Frontend Changes

**N/A** - This is a backend API endpoint only. Frontend integration is out of scope for this task.

---

## 10. Code Changes Overview

### 🚨 MANDATORY: High-Level Code Changes

#### 📂 **New Files to Create**

**File 1: `app/dependencies/auth.py`** (Authentication dependency)
```python
# New file - no "before" state
"""FastAPI authentication dependency for API secret validation."""
from fastapi import Header, HTTPException, status
from app.config import settings

async def verify_api_secret(
    x_api_secret: str = Header(..., alias="X-API-Secret")
) -> bool:
    """
    Verify API secret from X-API-Secret header.

    Args:
        x_api_secret: Secret from X-API-Secret header

    Returns:
        True if valid

    Raises:
        HTTPException: 401 if invalid or missing secret
    """
    if x_api_secret != settings.LLM_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "InvalidAPISecret",
                "message": "Invalid or missing API secret"
            }
        )
    return True
```

**File 2: `app/schemas/jobs.py`** (New Pydantic schemas)
```python
# New file - no "before" state
from typing import List, Optional
from pydantic import BaseModel, Field

class JobSummary(BaseModel):
    """Lightweight job summary for list views."""
    job_id: str
    workflow_name: str
    status: str
    priority: int
    user_id: Optional[str]
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    duration_ms: Optional[int]
    error_message: Optional[str]

class JobsListResponse(BaseModel):
    """Response schema for GET /api/v1/jobs"""
    jobs: List[JobSummary]
    total: int
    limit: int
    offset: int
```

**File 2: `app/api/v1/jobs.py`** (New API endpoint)
```python
# New file - no "before" state
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.jobs import JobsListResponse, JobSummary
from app.models.workflow_job import WorkflowJob, JobStatus

router = APIRouter()

@router.get("/jobs", response_model=JobsListResponse)
def list_jobs(
    status: Optional[str] = Query(None, description="Filter by status"),
    user_id: Optional[str] = Query(None, description="Filter by user"),
    limit: int = Query(50, ge=1, le=200, description="Pagination limit"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db)
) -> JobsListResponse:
    """
    List workflow jobs with optional filtering and pagination.

    Status filters:
    - running: Jobs in QUEUED or PROCESSING state
    - completed: Jobs in COMPLETED state
    - failed: Jobs in FAILED state
    - all: All jobs (no filter)
    """
    # Build query with filters
    query = db.query(WorkflowJob)

    # Apply status filter
    if status and status != "all":
        if status == "running":
            query = query.filter(WorkflowJob.status.in_(["queued", "processing"]))
        elif status == "completed":
            query = query.filter(WorkflowJob.status == "completed")
        elif status == "failed":
            query = query.filter(WorkflowJob.status == "failed")
        else:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    # Apply user filter
    if user_id:
        query = query.filter(WorkflowJob.user_id == user_id)

    # Get total count before pagination
    total = query.count()

    # Apply pagination and sorting
    jobs = query.order_by(WorkflowJob.created_at.desc()).limit(limit).offset(offset).all()

    # Build response
    return JobsListResponse(
        jobs=[JobSummary(**job.to_dict()) for job in jobs],
        total=total,
        limit=limit,
        offset=offset
    )
```

#### 📂 **Files to Modify**

**File 1: `app/api/v1/status.py`** (Add authentication)

**Before:**
```python
@router.get(
    "/status/{job_id}",
    response_model=WorkflowStatusResponse,
    status_code=status.HTTP_200_OK,
    # ... other params
)
def get_workflow_status(
    job_id: str = Path(...),
    db: Session = Depends(get_db)
) -> WorkflowStatusResponse:
```

**After:**
```python
from app.dependencies.auth import verify_api_secret  # Added import

@router.get(
    "/status/{job_id}",
    response_model=WorkflowStatusResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_api_secret)],  # Added auth
    # ... other params
)
def get_workflow_status(
    job_id: str = Path(...),
    db: Session = Depends(get_db)
) -> WorkflowStatusResponse:
```

**File 2: `app/api/v1/workflow.py`** (Add authentication to both endpoints)

**Before:**
```python
@router.post("/workflow", response_model=WorkflowSubmitResponse)
def submit_workflow(request: WorkflowSubmitRequest, db: Session = Depends(get_db)):

@router.post("/workflow/validate", response_model=WorkflowValidateResponse)
def validate_workflow(request: WorkflowValidateRequest):
```

**After:**
```python
from app.dependencies.auth import verify_api_secret  # Added import

@router.post(
    "/workflow",
    response_model=WorkflowSubmitResponse,
    dependencies=[Depends(verify_api_secret)]  # Added auth
)
def submit_workflow(request: WorkflowSubmitRequest, db: Session = Depends(get_db)):

@router.post(
    "/workflow/validate",
    response_model=WorkflowValidateResponse,
    dependencies=[Depends(verify_api_secret)]  # Added auth
)
def validate_workflow(request: WorkflowValidateRequest):
```

**File 3: `app/api/v1/__init__.py`** (Register new router)

**Before:**
```python
from fastapi import APIRouter
from app.api.v1 import workflow, status

api_router = APIRouter()
api_router.include_router(workflow.router, tags=["workflow"])
api_router.include_router(status.router, tags=["status"])
```

**After:**
```python
from fastapi import APIRouter
from app.api.v1 import workflow, status, jobs  # Added jobs import

api_router = APIRouter()
api_router.include_router(workflow.router, tags=["workflow"])
api_router.include_router(status.router, tags=["status"])
api_router.include_router(jobs.router, tags=["jobs"])  # Added jobs router
```

#### 🎯 **Key Changes Summary**
- [x] **🔐 New Authentication System** - FastAPI dependency validates `X-API-Secret` header
- [x] **🔒 Security Fix** - ALL endpoints now require authentication (was previously open)
- [x] **New Pydantic schemas** - `JobSummary` and `JobsListResponse` for lightweight job data
- [x] **New API endpoint** - `GET /api/v1/jobs` with filtering and pagination
- [x] **OpenAPI Documentation** - `/docs` will show authentication requirement automatically
- [x] **Files Modified:** 3 files (`app/api/v1/status.py`, `app/api/v1/workflow.py`, `app/api/v1/__init__.py`)
- [x] **Files Created:** 4 files (`app/dependencies/auth.py`, `app/dependencies/__init__.py`, `app/schemas/jobs.py`, `app/api/v1/jobs.py`)
- [x] **Impact:** New endpoint + critical security fix for existing endpoints

---

## 11. Implementation Plan

### Phase 1: Create Authentication Dependency
**Goal:** Implement shared authentication mechanism for all API endpoints

- [x] **Task 1.1:** Create `app/dependencies/` directory (if not exists) ✓ 2025-12-18
  - Files: `app/dependencies/` (new directory) ✓
  - Details: Created directory for FastAPI dependencies ✓

- [x] **Task 1.2:** Create authentication dependency ✓ 2025-12-18
  - Files: `app/dependencies/auth.py` (new file) ✓
  - Details: Implemented `verify_api_secret()` async function with X-API-Secret header validation ✓

- [x] **Task 1.3:** Create `__init__.py` for dependencies ✓ 2025-12-18
  - Files: `app/dependencies/__init__.py` (new file) ✓
  - Details: Exported `verify_api_secret` for easy imports ✓

### Phase 2: Apply Authentication to Existing Endpoints
**Goal:** Secure existing endpoints with authentication requirement

- [x] **Task 2.1:** Update `/api/v1/status.py` ✓ 2025-12-18
  - Files: `app/api/v1/status.py` (modified: +1 import, +1 dependency, +1 response code) ✓
  - Details: Added `dependencies=[Depends(verify_api_secret)]` to `@router.get("/status/{job_id}")` and 401 response ✓

- [x] **Task 2.2:** Update `/api/v1/workflow.py` ✓ 2025-12-18
  - Files: `app/api/v1/workflow.py` (modified: +1 import, +2 dependencies, +2 response codes) ✓
  - Details: Added `dependencies=[Depends(verify_api_secret)]` to both `/workflow` and `/workflow/validate` endpoints with 401 responses ✓

### Phase 3: Create Pydantic Schemas
**Goal:** Define request/response data structures for jobs list endpoint

- [x] **Task 3.1:** Create `app/schemas/jobs.py` file ✓ 2025-12-18
  - Files: `app/schemas/jobs.py` (new file, 235 lines) ✓
  - Details: Defined `JobSummary` (lightweight job data) and `JobsListResponse` (paginated list) Pydantic models with comprehensive examples ✓

### Phase 4: Implement Jobs List Endpoint
**Goal:** Create the jobs list endpoint with filtering and pagination

- [x] **Task 4.1:** Create `app/api/v1/jobs.py` file ✓ 2025-12-18
  - Files: `app/api/v1/jobs.py` (new file, 243 lines) ✓
  - Details: Implemented `GET /jobs` endpoint with authentication, status filtering (running/completed/failed/all), user filtering, pagination (limit/offset), comprehensive error handling and logging ✓

- [x] **Task 4.2:** Register router in API v1 ✓ 2025-12-18
  - Files: `app/api/v1/__init__.py` (modified: +1 import, +1 router registration, +1 doc line) ✓
  - Details: Imported `jobs` router and added to `router.include_router()` with 'jobs' tag ✓

### Phase 5: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [x] **Task 5.1:** Code Quality Verification ✓ 2025-12-18
  - Files: All modified files ✓
  - Details: Manual syntax review completed (linting tools not available without venv) - no syntax errors found ✓

- [x] **Task 5.2:** Static Logic Review ✓ 2025-12-18
  - Files: `app/api/v1/jobs.py`, `app/dependencies/auth.py`, all modified endpoints ✓
  - Details: Verified auth logic, query filtering (including OR logic for 'running'), pagination, error handling, UUID validation, edge cases ✓

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 3, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 4: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 4.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [ ] **Task 4.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, provide detailed summary

### Phase 5: User Testing (Only After Code Review)
**Goal:** Request human testing for API functionality

- [ ] **Task 5.1:** Request User API Testing
  - Files: Testing checklist for user
  - Details: Clear instructions for testing endpoint with curl/Postman

- [ ] **Task 5.2:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete API testing and confirm results

---

## 12. Task Completion Tracking - MANDATORY WORKFLOW

### Task Completion Tracking - MANDATORY WORKFLOW
🚨 **CRITICAL: Real-time task completion tracking is mandatory**

- [ ] **🗓️ GET TODAY'S DATE FIRST** - Before adding any completion timestamps, use the `time` tool to get the correct current date
- [ ] **Update task document immediately** after each completed subtask
- [ ] **Mark checkboxes as [x]** with completion timestamp using ACTUAL current date
- [ ] **Add brief completion notes** (file paths, key changes, etc.)

---

## 13. File Structure & Organization

### New Files to Create
```
LLM_service/
├── app/
│   ├── dependencies/
│   │   ├── __init__.py                # Export auth dependencies
│   │   └── auth.py                    # Authentication dependency
│   ├── api/
│   │   └── v1/
│   │       └── jobs.py                # New jobs list endpoint
│   └── schemas/
│       └── jobs.py                    # New Pydantic schemas for jobs list
```

### Files to Modify
- [ ] **`app/api/v1/__init__.py`** - Register new jobs router
- [ ] **`app/api/v1/status.py`** - Add authentication dependency
- [ ] **`app/api/v1/workflow.py`** - Add authentication dependency to both endpoints

### Dependencies to Add
**No new dependencies required** - Using existing FastAPI, SQLAlchemy, Pydantic stack.

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Invalid status filter value (e.g., `?status=invalid`)
  - **Code Review Focus:** `app/api/v1/jobs.py` - status filter validation logic
  - **Potential Fix:** Return 400 Bad Request with clear error message listing valid values

- [ ] **Error Scenario 2:** Invalid UUID format for user_id filter
  - **Code Review Focus:** `app/api/v1/jobs.py` - user_id parsing and validation
  - **Potential Fix:** Use Pydantic UUID type validation or try/except with clear error

- [ ] **Error Scenario 3:** Database connection failure during query
  - **Code Review Focus:** `app/api/v1/jobs.py` - SQLAlchemy exception handling
  - **Potential Fix:** Wrap query in try/except, return 500 with generic error message

- [ ] **Error Scenario 4:** Pagination parameters exceed limits (negative offset, limit > 200)
  - **Code Review Focus:** `app/api/v1/jobs.py` - Pydantic Query parameter validation
  - **Potential Fix:** Pydantic `ge` (greater-equal) and `le` (less-equal) constraints handle this automatically

### Edge Cases to Consider
- [ ] **Edge Case 1:** User requests jobs but has no jobs in database
  - **Analysis Approach:** Query returns empty list - verify response includes `total: 0, jobs: []`
  - **Recommendation:** Should work correctly, but verify empty list handling in response serialization

- [ ] **Edge Case 2:** Very large result sets (10,000+ jobs)
  - **Analysis Approach:** Check pagination limits and query performance with large datasets
  - **Recommendation:** Current limit of 200 jobs per request is reasonable, but consider warning in docs

- [ ] **Edge Case 3:** Jobs with null user_id (system jobs)
  - **Analysis Approach:** Filter `user_id == uuid` will exclude null values correctly
  - **Recommendation:** Ensure this is documented - system jobs won't appear in user-filtered results

### Security & Access Control Review
- [ ] **User Authorization:** Does endpoint properly scope results to requesting user?
  - **Check:** Current implementation allows querying ANY user's jobs via `user_id` parameter
  - **⚠️ SECURITY CONCERN:** Endpoint should authenticate user and auto-scope to their jobs only
  - **Recommendation:** Add authentication dependency and force `user_id = current_user.id`

- [ ] **Input Validation:** Are query parameters validated before database queries?
  - **Check:** Pydantic `Query()` validators on limit/offset, manual status validation
  - **✅ SECURE:** Pydantic handles SQL injection prevention via parameter binding

- [ ] **Data Exposure:** Can users access sensitive data they shouldn't?
  - **Check:** `JobSummary` excludes `input_data` and `result_data` - good
  - **✅ SECURE:** Only metadata exposed, full data requires separate `/status/{job_id}` call

### AI Agent Analysis Approach
**Priority Focus:**
1. **CRITICAL:** User authorization - ensure users can't access other users' jobs
2. **Important:** Input validation - prevent SQL injection and invalid parameters
3. **Nice-to-have:** Performance optimization - ensure queries use indexes

**Recommendation:** Add authentication middleware that extracts user ID from JWT token and forces user_id filter instead of accepting it as a query parameter.

---

## 15. Deployment & Configuration

### Environment Variables
**No new environment variables required** - Endpoint uses existing database connection and configurations.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
🎯 **STANDARD OPERATING PROCEDURE:**
This task document already includes strategic analysis (Section 2) with recommended solution. Proceed to implementation after user approval.

### Communication Preferences
- [x] Ask for clarification if requirements are unclear
- [x] Provide regular progress updates during implementation
- [x] Flag security concerns immediately (user authorization issue identified)
- [x] Suggest improvements when appropriate

### Implementation Approach - CRITICAL WORKFLOW
🚨 **MANDATORY: Follow this exact sequence:**

1. **✅ STRATEGIC ANALYSIS COMPLETE** (Already done in Section 2)

2. **CREATE TASK DOCUMENT** ✅ COMPLETE

3. **PRESENT IMPLEMENTATION OPTIONS (Required)**

   **👤 IMPLEMENTATION OPTIONS:**

   **A) Preview High-Level Code Changes**
   Would you like me to show you detailed code snippets and specific changes before implementing? I'll walk through exactly what files will be modified and show before/after code examples.

   **B) Proceed with Implementation**
   Ready to begin implementation? Say "Approved" or "Go ahead" and I'll start implementing phase by phase.

   **C) Provide More Feedback**
   Have questions or want to modify the approach? I can adjust the plan based on additional requirements or concerns.

   **⚠️ SECURITY NOTE:** I've identified a potential security issue - the endpoint currently allows querying ANY user's jobs via the `user_id` parameter. I recommend adding authentication to automatically scope results to the authenticated user. Should I include this fix in the implementation?

4. **IMPLEMENT PHASE-BY-PHASE (Only after Option B approval)**

   For each phase, follow the exact pattern specified in Section 16 of the template.

### What Constitutes "Explicit User Approval"

**✅ OPTION A RESPONSES (Show detailed code previews):**
- "A" or "Option A"
- "Preview the changes"
- "Show me the code"

**✅ OPTION B RESPONSES (Start implementation immediately):**
- "B" or "Option B"
- "Proceed" or "Go ahead"
- "Approved" or "Start implementation"

**✅ OPTION C RESPONSES (Provide more feedback):**
- "C" or "Option C"
- Questions or concerns
- Requests for changes

🛑 **NEVER start coding without explicit A/B/C choice from user!**

### Code Quality Standards
- [x] Follow FastAPI best practices (dependency injection, Pydantic schemas)
- [x] Add proper error handling with appropriate HTTP status codes
- [x] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
- [x] **🚨 MANDATORY: Use early returns** to reduce nesting
- [x] **🚨 MANDATORY: Use async/await** (N/A - FastAPI sync endpoint is fine for simple DB query)
- [x] Follow existing code patterns in `app/api/v1/status.py`
- [x] Ensure OpenAPI documentation is complete and accurate

### Architecture Compliance
- [x] **✅ VERIFY: Used correct data access pattern** - Direct query in endpoint (simple filtering)
- [x] **❌ AVOID: Creating unnecessary API routes** - N/A, this IS the API route
- [x] **🔍 SECURITY CHECK: Add user authentication** - Verify user can only access their own jobs

---

## 17. Notes & Additional Context

### Research Links
- FastAPI Query Parameters: https://fastapi.tiangolo.com/tutorial/query-params/
- SQLAlchemy Filtering: https://docs.sqlalchemy.org/en/14/orm/tutorial.html#common-filter-operators
- Existing status endpoint: `app/api/v1/status.py` (reference implementation)

### **⚠️ Security Considerations**

**CRITICAL:** The current design allows any client to query jobs for any user by passing `?user_id={uuid}`. This is a security vulnerability in a production system.

**Recommended Fix:**
1. Add authentication dependency to extract user from JWT token
2. Force `user_id = current_user.id` instead of accepting it as a parameter
3. Allow admin users to query all users (optional)

**Example secure implementation:**
```python
@router.get("/jobs", response_model=JobsListResponse)
def list_jobs(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Add auth dependency
) -> JobsListResponse:
    # Force user_id to authenticated user
    query = db.query(WorkflowJob).filter(WorkflowJob.user_id == current_user.id)
    # ... rest of implementation
```

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [x] **Existing API Contracts:** No breaking changes - this is a new endpoint
- [x] **Database Dependencies:** Read-only queries, no schema changes
- [x] **Component Dependencies:** No dependencies on this endpoint yet
- [x] **Authentication/Authorization:** ⚠️ Current design allows unauthorized access - needs auth

#### 2. **Ripple Effects Assessment**
- [x] **Data Flow Impact:** No impact - read-only queries don't modify data
- [x] **UI/UX Cascading Effects:** Enables new dashboard features (positive impact)
- [x] **State Management:** N/A - backend API only
- [x] **Routing Dependencies:** New route registered in `app/api/v1/__init__.py`

#### 3. **Performance Implications**
- [x] **Database Query Impact:** Uses existing indexes (`status`, `user_id`, `created_at`) - minimal impact
- [x] **Potential Performance Issue:** Large result sets without pagination could be slow
- [x] **Mitigation:** Enforce pagination limits (max 200 jobs per request)

#### 4. **Security Considerations**
- [x] **Attack Surface:** ⚠️ Without authentication, anyone can query any user's jobs
- [x] **Data Exposure:** ✅ JobSummary excludes sensitive data (input_data, result_data)
- [x] **Permission Escalation:** ⚠️ Could accidentally bypass authorization checks if auth not added
- [x] **Input Validation:** ✅ Pydantic handles validation, SQL injection prevented

#### 5. **User Experience Impacts**
- [x] **Workflow Disruption:** N/A - new feature, no existing workflows disrupted
- [x] **Data Migration:** N/A - no schema changes
- [x] **Feature Enablement:** ✅ Enables dashboard UIs and job monitoring features

#### 6. **Maintenance Burden**
- [x] **Code Complexity:** Low - follows existing patterns
- [x] **Dependencies:** No new dependencies
- [x] **Testing Overhead:** Moderate - needs tests for filtering, pagination, error cases
- [x] **Documentation:** OpenAPI auto-generated, minimal manual docs needed

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [x] **Security Vulnerability:** Endpoint allows querying any user's jobs without authentication
  - **Impact:** Unauthorized access to job metadata and status
  - **Severity:** HIGH
  - **Recommendation:** Add authentication before deploying to production

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [x] **Pagination Limits:** Max 200 jobs per request may not be sufficient for power users
  - **Impact:** Users with >200 jobs need multiple requests
  - **Severity:** LOW
  - **Recommendation:** Document pagination clearly, consider increasing limit if needed

### Mitigation Strategies

#### Security Fix (CRITICAL)
- [x] **Add authentication dependency** - Extract user ID from JWT token
- [x] **Force user scoping** - Only return jobs for authenticated user
- [x] **Optional admin override** - Allow admin users to query all users

#### Performance Optimization
- [x] **Verify index usage** - Ensure queries use `idx_workflow_jobs_status`, `idx_workflow_jobs_user_id`
- [x] **Add query timeout** - Prevent long-running queries from blocking workers

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections filled out
- [x] **Identify Critical Issues:** Security vulnerability flagged
- [x] **Propose Mitigation:** Authentication dependency recommended
- [x] **Alert User:** Security concern highlighted in multiple sections
- [x] **Recommend Alternatives:** Secure implementation example provided

---

*Template Version: 1.3*
*Last Updated: 12/18/2024*
*Task Number: 050*
