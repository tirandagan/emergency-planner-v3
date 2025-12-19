# AI Task Template

> **Instructions:** This template helps you create comprehensive task documents for AI-driven development. Fill out each section thoroughly to ensure the AI agent has all necessary context and can execute the task systematically.

---

## 1. Task Overview

### Task Title
**Title:** Enhance LLM Service User Action Tracking and Jobs API Filtering

### Goal Statement
**Goal:** Improve the LLM service's job tracking capabilities by adding user context (username and action description) to workflow submissions and enhancing the jobs API with time-based filtering. This will provide better observability for debugging, monitoring user activity patterns, and understanding workflow execution context. The changes will also improve the admin dashboard's LLM Queue tab by adding a configurable result limit filter.

---

## 2. Strategic Analysis & Solution Options

### When to Use Strategic Analysis
This task has a straightforward implementation path with clear requirements. The API changes are additive (new optional parameters) and don't introduce breaking changes. The implementation follows established patterns in the codebase.

**✅ SKIP STRATEGIC ANALYSIS** - Direct implementation is appropriate because:
- Requirements are specific and clearly defined
- No architectural decisions or trade-offs to evaluate
- Changes are additive and backward-compatible
- Implementation pattern is established (REST API extension)

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **LLM Service Framework**: FastAPI (Python) with Pydantic schemas
- **Database & ORM**: PostgreSQL with SQLAlchemy
- **Task Queue**: Celery with Redis backend
- **API Versioning**: `/api/v1/` endpoints
- **Frontend**: Next.js 15+ with TypeScript, React 19
- **Admin Dashboard**: Server Components with Server Actions
- **Key Architectural Patterns**:
  - Microservice architecture (LLM service separate from Next.js app)
  - RESTful API design with Pydantic validation
  - Database models with SQLAlchemy ORM
  - Type-safe API contracts with TypeScript

### Current State
**LLM Service Current Implementation:**
- Workflow submission accepts `user_id` (UUID) but not username or action description
- Jobs API supports status filtering (`all`, `running`, `completed`, `failed`) and pagination
- No time-based filtering for jobs (no date range queries)
- Frontend LLM Queue tab shows all jobs or filtered by status, no limit control

**Database Schema (`llm_workflow_jobs` table):**
- Has `user_id` column (UUID) for tracking which user submitted the job
- Missing `username` and `action` columns for better context
- Timestamps available: `created_at`, `started_at`, `completed_at`, `queued_at`

**Existing Code Patterns:**
- API endpoints use Pydantic schemas for request/response validation
- SQLAlchemy models with query filtering and pagination
- Server Actions in Next.js for API communication
- TypeScript types mirror Python Pydantic schemas

### Existing Context Providers Analysis
**Not applicable** - This is a backend microservice enhancement focused on the LLM service API and database schema. The frontend changes are minimal (adding a filter dropdown).

---

## 4. Context & Problem Definition

### Problem Statement
When debugging workflow execution issues or analyzing user behavior patterns, the current LLM service lacks sufficient context about:

1. **Who initiated the workflow** - Only `user_id` (UUID) is stored, requiring database joins to find the username
2. **What action triggered the workflow** - No information about the user's activity (e.g., "generate mission report", "add driving directions")
3. **Time-based analysis** - No easy way to query jobs from specific time periods (today, last 7 days, last 30 days)
4. **Result limiting** - Frontend has no control over result set size, always fetches 50 records

These limitations make it harder to:
- Debug issues ("Which user was generating contacts when the workflow failed?")
- Monitor usage patterns ("How many mission reports were generated this week?")
- Optimize performance ("Show me only today's failed jobs")

### Success Criteria
- [x] Database schema includes `username` and `action` columns in `llm_workflow_jobs` table
- [x] Workflow submission API accepts optional `username` and `action` parameters
- [x] Jobs API supports `limit_results` parameter accepting numbers (e.g., 25, 50) or time periods ("Today", "7 Days", "30 Days")
- [x] Job summary responses include `username` and `action` fields
- [x] Frontend LLM Queue tab shows limit results filter dropdown with default value of 25
- [x] Backward compatibility maintained (existing API calls continue working)
- [x] Type-safe implementation with Pydantic/TypeScript validation

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
- **FR-1**: Database must store `username` (VARCHAR 255, nullable) and `action` (VARCHAR 255, nullable) for each workflow job
- **FR-2**: Workflow submission API must accept optional `username` and `action` string parameters
- **FR-3**: Jobs list API must accept `limit_results` parameter that accepts:
  - Numeric values (1-500) for exact record count
  - String value `"Today"` for jobs created today (UTC timezone)
  - String value `"7 Days"` for jobs created in last 7 days
  - String value `"30 Days"` for jobs created in last 30 days
- **FR-4**: Job summary responses must include `username` and `action` fields when available
- **FR-5**: Admin dashboard LLM Queue tab must show limit results filter with default value of 25
- **FR-6**: All existing API functionality must continue working unchanged

### Non-Functional Requirements
- **Performance**: Time-based filtering queries must use indexed `created_at` column for efficiency
- **Security**: Username and action fields are informational only (no sensitive data)
- **Usability**: Filter dropdown should be intuitive with clear labels
- **Responsive Design**: Must work on mobile (320px+), tablet (768px+), and desktop (1024px+)
- **Theme Support**: Must support both light and dark mode using existing theme system
- **Compatibility**: Must maintain backward compatibility with existing API consumers

### Technical Constraints
- **Must use existing database indexes** on `created_at` for efficient time-based queries
- **Cannot modify existing API response structure** (only add new optional fields)
- **Must follow FastAPI/Pydantic patterns** for API schema definitions
- **Must use SQLAlchemy ORM** for database queries (no raw SQL in business logic)

---

## 7. Data & Database Changes

### Database Schema Changes
```sql
-- Add username and action columns to llm_workflow_jobs table
-- Migration: drizzle/migrations/XXXX_add_username_action_to_workflow_jobs.sql

ALTER TABLE llm_workflow_jobs
  ADD COLUMN username VARCHAR(255) NULL,
  ADD COLUMN action VARCHAR(255) NULL;

-- Add comments for documentation
COMMENT ON COLUMN llm_workflow_jobs.username IS 'Username of person who triggered the workflow (informational)';
COMMENT ON COLUMN llm_workflow_jobs.action IS 'User activity that required the workflow (e.g., "generate mission report", "add driving directions")';

-- No additional indexes needed - created_at already has index
-- idx_workflow_jobs_created_at exists and will be used for time-based filtering
```

### Data Model Updates
```python
# LLM_service/app/models/workflow_job.py
# Add two new fields to WorkflowJob model

from sqlalchemy import Column, String

class WorkflowJob(Base):
    __tablename__ = 'llm_workflow_jobs'

    # ... existing fields ...

    # NEW FIELDS - Add after user_id field
    username = Column(String(255), nullable=True)  # Username who triggered workflow
    action = Column(String(255), nullable=True)    # Activity requiring workflow

    # ... rest of model ...

    def to_dict(self) -> dict:
        """Convert model to dictionary for API responses."""
        return {
            # ... existing fields ...
            "username": self.username,  # NEW
            "action": self.action,      # NEW
            # ... rest of fields ...
        }
```

### Data Migration Plan
- [x] **Step 1**: Create Alembic migration to add columns (nullable, no defaults needed)
- [x] **Step 2**: Apply migration to development database
- [x] **Step 3**: Update SQLAlchemy model with new fields
- [x] **Step 4**: Update Pydantic schemas to include new fields
- [x] **Step 5**: Verify existing jobs display correctly with NULL values
- [x] **Step 6**: Test new submissions with username/action populated

**Note**: Existing records will have NULL values for `username` and `action`, which is acceptable for historical data.

### 🚨 MANDATORY: Down Migration Safety Protocol
**CRITICAL REQUIREMENT:** Before running ANY database migration, you MUST create the corresponding down migration file following the `drizzle_down_migration.md` template process:

- [ ] **Step 1: Generate Migration** - Create Alembic migration file with `ADD COLUMN` statements
- [ ] **Step 2: Create Down Migration** - Create rollback SQL that drops the two columns
- [ ] **Step 3: Create Subdirectory** - Create migration subdirectory with `down.sql` file
- [ ] **Step 4: Generate down.sql** - Include `DROP COLUMN IF EXISTS` statements
- [ ] **Step 5: Verify Safety** - Ensure rollback operations use `IF EXISTS` (no warnings needed - columns are informational only)
- [ ] **Step 6: Apply Migration** - Only after down migration is created, apply the migration

**🛑 NEVER apply the migration without first creating the down migration file!**

**Down Migration Content Preview:**
```sql
-- down.sql - Rollback adding username and action columns

-- Drop columns (IF EXISTS for safety)
ALTER TABLE llm_workflow_jobs DROP COLUMN IF EXISTS username;
ALTER TABLE llm_workflow_jobs DROP COLUMN IF EXISTS action;

-- ℹ️ NOTE: No data loss concerns - these columns are informational only
-- Users can re-submit workflows if needed after rollback
```

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**🚨 MANDATORY: Follow these rules strictly:**

#### **API Routes** → `LLM_service/app/api/v1/[endpoint].py` - REST endpoints only
- [x] **Modify workflow.py** - Add `username` and `action` to WorkflowSubmitRequest schema
- [x] **Modify jobs.py** - Add `limit_results` query parameter with validation
- [x] **What qualifies as API routes**: REST endpoints for external consumption (LLM service is a microservice)

#### **Database Queries** → SQLAlchemy ORM queries in route handlers
- [x] **Simple queries in route handlers** - Direct SQLAlchemy queries in `jobs.py`
- [x] **Time-based filtering** - Use existing `created_at` index with SQLAlchemy date filters
- [x] **No complex query functions needed** - Queries are straightforward WHERE clauses

#### **No Server Actions Needed** - This is backend microservice work only
- [x] LLM service is Python FastAPI, not Next.js
- [x] Frontend changes use existing Server Actions (`actions.ts`)

### API Route Changes

#### Modified Endpoint: `POST /api/v1/workflow`
**File**: `LLM_service/app/api/v1/workflow.py`

**Request Schema Update** (`WorkflowSubmitRequest` in `app/schemas/workflow.py`):
```python
class WorkflowSubmitRequest(BaseModel):
    workflow_name: str = Field(...)
    user_id: Optional[str] = Field(None, ...)
    input_data: Dict[str, Any] = Field(...)
    webhook_url: HttpUrl = Field(...)
    webhook_secret: Optional[str] = Field(None, ...)
    priority: int = Field(default=0, ge=0, le=10, ...)
    debug_mode: bool = Field(default=False, ...)

    # NEW FIELDS
    username: Optional[str] = Field(
        None,
        max_length=255,
        description="Username of person who triggered the workflow (informational)",
        examples=["john.doe@example.com", "jane_smith"]
    )
    action: Optional[str] = Field(
        None,
        max_length=255,
        description="User activity requiring the workflow (e.g., 'generate mission report', 'add driving directions')",
        examples=["generate mission report", "add driving directions", "generate contacts"]
    )
```

**Handler Update** (`submit_workflow()` in `app/api/v1/workflow.py`):
```python
# Line ~148 - Add username and action to job creation
job = WorkflowJob(
    id=job_id,
    celery_task_id=celery_task_id,
    workflow_name=request.workflow_name,
    priority=request.priority,
    webhook_url=str(request.webhook_url) if request.webhook_url else None,
    webhook_secret=request.webhook_secret,
    debug_mode=request.debug_mode,
    user_id=uuid.UUID(request.user_id) if request.user_id else None,
    username=request.username,  # NEW
    action=request.action,      # NEW
    status=JobStatus.PENDING.value,
    input_data=request.input_data,
    queued_at=datetime.now(timezone.utc),
)
```

#### Modified Endpoint: `GET /api/v1/jobs`
**File**: `LLM_service/app/api/v1/jobs.py`

**Query Parameter Addition**:
```python
@router.get("/jobs", ...)
def list_jobs(
    status_filter: Optional[str] = Query(None, ...),
    user_id: Optional[str] = Query(None, ...),
    limit: int = Query(50, ge=1, le=200, ...),
    offset: int = Query(0, ge=0, ...),

    # NEW PARAMETER
    limit_results: Optional[str] = Query(
        None,
        description=(
            "Filter by result count or time period. "
            "Accepts: numeric value (1-500), 'Today', '7 Days', or '30 Days'"
        ),
        examples=["25", "100", "Today", "7 Days", "30 Days"]
    ),

    db: Session = Depends(get_db)
) -> JobsListResponse:
    # ... implementation below ...
```

**Query Logic Update** (inside `list_jobs()` function):
```python
# Build base query
query = db.query(WorkflowJob)

# ... existing status and user filters ...

# NEW: Apply limit_results filter
if limit_results:
    # Check if it's a time period filter
    if limit_results in ["Today", "7 Days", "30 Days"]:
        from datetime import timedelta
        now = datetime.now(timezone.utc)

        if limit_results == "Today":
            # Jobs created today (UTC)
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(WorkflowJob.created_at >= start_of_day)
            logger.debug(f"Applied 'Today' filter (since {start_of_day.isoformat()})")

        elif limit_results == "7 Days":
            # Jobs created in last 7 days
            seven_days_ago = now - timedelta(days=7)
            query = query.filter(WorkflowJob.created_at >= seven_days_ago)
            logger.debug(f"Applied '7 Days' filter (since {seven_days_ago.isoformat()})")

        elif limit_results == "30 Days":
            # Jobs created in last 30 days
            thirty_days_ago = now - timedelta(days=30)
            query = query.filter(WorkflowJob.created_at >= thirty_days_ago)
            logger.debug(f"Applied '30 Days' filter (since {thirty_days_ago.isoformat()})")

    else:
        # Assume it's a numeric limit (validate and override default limit)
        try:
            numeric_limit = int(limit_results)
            if 1 <= numeric_limit <= 500:
                limit = numeric_limit  # Override default limit parameter
                logger.debug(f"Applied numeric limit: {numeric_limit}")
            else:
                # Invalid range - log warning but don't fail request
                logger.warning(f"Invalid limit_results value (out of range): {limit_results}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "error": "InvalidLimitResults",
                        "message": f"Numeric limit must be between 1-500 (got: {limit_results})",
                        "limit_results": limit_results
                    }
                )
        except ValueError:
            # Not a valid number or time period
            logger.warning(f"Invalid limit_results value: {limit_results}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "InvalidLimitResults",
                    "message": (
                        f"Invalid limit_results value: '{limit_results}'. "
                        "Expected: numeric value (1-500), 'Today', '7 Days', or '30 Days'"
                    ),
                    "limit_results": limit_results,
                    "valid_values": ["1-500", "Today", "7 Days", "30 Days"]
                }
            )

# ... rest of existing query logic (sorting, pagination) ...
```

**Response Schema Update** (`JobSummary` in `app/schemas/jobs.py`):
```python
class JobSummary(BaseModel):
    job_id: str = Field(...)
    workflow_name: str = Field(...)
    status: str = Field(...)
    priority: int = Field(...)
    user_id: Optional[str] = Field(None, ...)

    # NEW FIELDS
    username: Optional[str] = Field(
        None,
        description="Username of person who triggered workflow (if provided)",
        examples=["john.doe@example.com", "jane_smith"]
    )
    action: Optional[str] = Field(
        None,
        description="User activity that required the workflow (if provided)",
        examples=["generate mission report", "add driving directions"]
    )

    created_at: str = Field(...)
    started_at: Optional[str] = Field(None, ...)
    completed_at: Optional[str] = Field(None, ...)
    duration_ms: Optional[int] = Field(None, ...)
    error_message: Optional[str] = Field(None, ...)
```

**Job Summary Builder Update** (in `list_jobs()` function, line ~194):
```python
# Build lightweight job summaries
job_summaries = []
for job in jobs:
    job_summaries.append(
        JobSummary(
            job_id=str(job.id),
            workflow_name=job.workflow_name,
            status=job.status,
            priority=job.priority,
            user_id=str(job.user_id) if job.user_id else None,
            username=job.username,  # NEW
            action=job.action,      # NEW
            created_at=job.created_at.isoformat() if job.created_at else None,
            started_at=job.started_at.isoformat() if job.started_at else None,
            completed_at=job.completed_at.isoformat() if job.completed_at else None,
            duration_ms=job.duration_ms,
            error_message=job.error_message
        )
    )
```

### External Integrations
**No external integrations required** - All changes are within existing LLM service infrastructure.

---

## 9. Frontend Changes

### New Components
**No new components required** - Using existing UI components from Shadcn.

### Page Updates
- [ ] **`src/app/(protected)/admin/debug/page.tsx`** - No changes needed (layout already renders LLMQueueTab)
- [ ] **`src/app/(protected)/admin/debug/LLMQueueTab.tsx`** - Add limit results filter dropdown
- [ ] **`src/app/(protected)/admin/debug/actions.ts`** - Update `fetchLLMJobs()` to accept limit_results parameter
- [ ] **`src/app/(protected)/admin/debug/llm-types.ts`** - Add `username` and `action` fields to `LLMJob` interface

### State Management
**Minimal state changes** - Add one new state variable for limit results filter:
```typescript
const [limitResults, setLimitResults] = useState<string>('25'); // Default 25 records
```

### 🚨 CRITICAL: Context Usage Strategy

**MANDATORY: Before creating any component props or planning data fetching, verify existing context availability**

**Not applicable** - This task doesn't involve user authentication context or subscription data. Changes are limited to:
- Admin-only LLM Queue tab (already protected by admin auth in layout)
- Fetching job data via Server Actions (no context needed)
- Local component state for filter values

---

## 10. Code Changes Overview

### 🚨 MANDATORY: Always Show High-Level Code Changes Before Implementation

#### 📂 **Current Implementation (Before)**

**Python Backend - Database Model:**
```python
# LLM_service/app/models/workflow_job.py (lines 36-97)
class WorkflowJob(Base):
    __tablename__ = 'llm_workflow_jobs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    celery_task_id = Column(String(255), unique=True, nullable=False)
    workflow_name = Column(String(100), nullable=False)
    priority = Column(Integer, default=0)
    webhook_url = Column(Text, nullable=True)
    webhook_secret = Column(String(255), nullable=True)
    debug_mode = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)  # Only UUID, no context
    # ❌ Missing: username, action fields

    status = Column(String(50), nullable=False, default=JobStatus.PENDING.value)
    # ... rest of fields ...
```

**Python Backend - API Request Schema:**
```python
# LLM_service/app/schemas/workflow.py (lines 14-106)
class WorkflowSubmitRequest(BaseModel):
    workflow_name: str = Field(...)
    user_id: Optional[str] = Field(None, ...)
    input_data: Dict[str, Any] = Field(...)
    # ❌ Missing: username, action parameters
    webhook_url: HttpUrl = Field(...)
    priority: int = Field(default=0, ...)
    debug_mode: bool = Field(default=False, ...)
```

**Python Backend - Jobs Query:**
```python
# LLM_service/app/api/v1/jobs.py (lines 53-78)
def list_jobs(
    status_filter: Optional[str] = Query(None, ...),
    user_id: Optional[str] = Query(None, ...),
    limit: int = Query(50, ge=1, le=200, ...),
    offset: int = Query(0, ge=0, ...),
    # ❌ Missing: limit_results parameter
    db: Session = Depends(get_db)
) -> JobsListResponse:
    # ... query logic with no time-based filtering ...
```

**Frontend - LLM Queue Tab:**
```typescript
// src/app/(protected)/admin/debug/LLMQueueTab.tsx (lines 44-56)
export function LLMQueueTab() {
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');
  // ❌ Missing: limitResults state

  // Fetch jobs function
  const fetchJobs = useCallback(async () => {
    const data: LLMJobsResponse = await fetchLLMJobs(statusFilter);
    // ❌ Not passing limit_results parameter
    setJobs(data.jobs);
  }, [statusFilter]);
}
```

**Frontend - Filter UI:**
```typescript
// src/app/(protected)/admin/debug/LLMQueueTab.tsx (lines 179-190)
<div className="flex gap-2">
  <Select value={statusFilter} onValueChange={...}>
    <SelectTrigger className="w-[140px]">
      <SelectValue placeholder="Filter status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All</SelectItem>
      <SelectItem value="running">Running</SelectItem>
      <SelectItem value="completed">Completed</SelectItem>
      <SelectItem value="failed">Failed</SelectItem>
    </SelectContent>
  </Select>
  {/* ❌ Missing: limit results dropdown */}
  <Button onClick={handleRefresh} ...>
```

#### 📂 **After Refactor**

**Python Backend - Database Model (Enhanced):**
```python
# LLM_service/app/models/workflow_job.py
class WorkflowJob(Base):
    __tablename__ = 'llm_workflow_jobs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    celery_task_id = Column(String(255), unique=True, nullable=False)
    workflow_name = Column(String(100), nullable=False)
    priority = Column(Integer, default=0)
    webhook_url = Column(Text, nullable=True)
    webhook_secret = Column(String(255), nullable=True)
    debug_mode = Column(Boolean, default=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)

    # ✅ NEW: User context fields
    username = Column(String(255), nullable=True)  # Who triggered workflow
    action = Column(String(255), nullable=True)    # What activity required it

    status = Column(String(50), nullable=False, default=JobStatus.PENDING.value)
    # ... rest of fields ...
```

**Python Backend - API Request Schema (Enhanced):**
```python
# LLM_service/app/schemas/workflow.py
class WorkflowSubmitRequest(BaseModel):
    workflow_name: str = Field(...)
    user_id: Optional[str] = Field(None, ...)
    input_data: Dict[str, Any] = Field(...)

    # ✅ NEW: User context parameters
    username: Optional[str] = Field(None, max_length=255,
        description="Username of person who triggered workflow")
    action: Optional[str] = Field(None, max_length=255,
        description="User activity requiring workflow (e.g., 'generate mission report')")

    webhook_url: HttpUrl = Field(...)
    priority: int = Field(default=0, ...)
    debug_mode: bool = Field(default=False, ...)
```

**Python Backend - Jobs Query (Enhanced):**
```python
# LLM_service/app/api/v1/jobs.py
def list_jobs(
    status_filter: Optional[str] = Query(None, ...),
    user_id: Optional[str] = Query(None, ...),
    limit: int = Query(50, ge=1, le=200, ...),
    offset: int = Query(0, ge=0, ...),

    # ✅ NEW: Time-based and numeric filtering
    limit_results: Optional[str] = Query(None,
        description="Filter by count (1-500) or time ('Today', '7 Days', '30 Days')"),

    db: Session = Depends(get_db)
) -> JobsListResponse:
    query = db.query(WorkflowJob)

    # ✅ NEW: Time-based filtering logic
    if limit_results:
        if limit_results == "Today":
            start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(WorkflowJob.created_at >= start_of_day)
        elif limit_results == "7 Days":
            query = query.filter(WorkflowJob.created_at >= now - timedelta(days=7))
        elif limit_results == "30 Days":
            query = query.filter(WorkflowJob.created_at >= now - timedelta(days=30))
        else:
            limit = int(limit_results)  # Numeric limit override

    # ... rest of query logic ...
```

**Frontend - LLM Queue Tab (Enhanced):**
```typescript
// src/app/(protected)/admin/debug/LLMQueueTab.tsx
export function LLMQueueTab() {
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>('all');
  const [limitResults, setLimitResults] = useState<string>('25'); // ✅ NEW: Default 25

  // ✅ MODIFIED: Pass limitResults to API
  const fetchJobs = useCallback(async () => {
    const data: LLMJobsResponse = await fetchLLMJobs(statusFilter, limitResults);
    setJobs(data.jobs);
  }, [statusFilter, limitResults]); // ✅ NEW: Dependency on limitResults
}
```

**Frontend - Filter UI (Enhanced):**
```typescript
// src/app/(protected)/admin/debug/LLMQueueTab.tsx
<div className="flex gap-2">
  <Select value={statusFilter} onValueChange={...}>
    {/* Existing status filter */}
  </Select>

  {/* ✅ NEW: Limit results filter dropdown */}
  <Select value={limitResults} onValueChange={setLimitResults}>
    <SelectTrigger className="w-[140px]">
      <SelectValue placeholder="Limit results" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="25">25 records</SelectItem>
      <SelectItem value="50">50 records</SelectItem>
      <SelectItem value="100">100 records</SelectItem>
      <SelectItem value="200">200 records</SelectItem>
      <SelectItem value="Today">Today</SelectItem>
      <SelectItem value="7 Days">Last 7 Days</SelectItem>
      <SelectItem value="30 Days">Last 30 Days</SelectItem>
    </SelectContent>
  </Select>

  <Button onClick={handleRefresh} ...>
```

#### 🎯 **Key Changes Summary**
- [ ] **Backend - Database Schema**: Added `username` and `action` columns to `llm_workflow_jobs` table (nullable VARCHAR(255))
- [ ] **Backend - API Request**: Extended `WorkflowSubmitRequest` with optional `username` and `action` fields
- [ ] **Backend - API Response**: Added `username` and `action` to `JobSummary` schema
- [ ] **Backend - Jobs Query**: Implemented `limit_results` parameter with time-based filtering ("Today", "7 Days", "30 Days") and numeric limits (1-500)
- [ ] **Frontend - Types**: Added `username` and `action` to `LLMJob` interface
- [ ] **Frontend - Server Action**: Updated `fetchLLMJobs()` to accept and pass `limitResults` parameter
- [ ] **Frontend - UI**: Added limit results filter dropdown with 7 options (4 numeric, 3 time-based), default value 25
- [ ] **Files Modified**: 7 files across Python backend and TypeScript frontend

---

## 11. Implementation Plan

### Phase 1: Database Schema Changes
**Goal:** Add username and action columns to llm_workflow_jobs table with safe rollback capability

- [ ] **Task 1.1:** Create Alembic Migration File
  - Files: `LLM_service/migrations/versions/XXXX_add_username_action_to_workflow_jobs.py`
  - Details: Use Alembic autogenerate to create migration with `ADD COLUMN` statements
  - Command: `cd LLM_service && alembic revision --autogenerate -m "Add username and action to workflow jobs"`

- [ ] **Task 1.2:** Create Down Migration (MANDATORY)
  - Files: `LLM_service/migrations/versions/XXXX_add_username_action_to_workflow_jobs/down.sql`
  - Details: Create rollback SQL with `DROP COLUMN IF EXISTS` statements
  - Validation: Ensure `IF EXISTS` clauses present, no data loss warnings needed

- [ ] **Task 1.3:** Apply Migration to Development Database
  - Command: `cd LLM_service && alembic upgrade head`
  - Details: Verify columns exist with `\d llm_workflow_jobs` in psql
  - Validation: Check existing jobs still display correctly

### Phase 2: Python Backend - Database Model Updates
**Goal:** Update SQLAlchemy model and Pydantic schemas to support new fields

- [ ] **Task 2.1:** Update WorkflowJob SQLAlchemy Model
  - Files: `LLM_service/app/models/workflow_job.py`
  - Details: Add `username` and `action` columns, update `to_dict()` method
  - Lines: ~64 (add columns), ~107-128 (update to_dict)

- [ ] **Task 2.2:** Update WorkflowSubmitRequest Pydantic Schema
  - Files: `LLM_service/app/schemas/workflow.py`
  - Details: Add optional `username` and `action` fields with validation
  - Lines: ~14-106 (add new fields after debug_mode)

- [ ] **Task 2.3:** Update JobSummary Pydantic Schema
  - Files: `LLM_service/app/schemas/jobs.py`
  - Details: Add `username` and `action` to response schema
  - Lines: ~12-138 (add fields after user_id)

### Phase 3: Python Backend - API Endpoint Updates
**Goal:** Modify workflow submission and jobs list endpoints to handle new parameters

- [ ] **Task 3.1:** Update Workflow Submission Handler
  - Files: `LLM_service/app/api/v1/workflow.py`
  - Details: Extract `username` and `action` from request, pass to WorkflowJob constructor
  - Lines: ~148-160 (job creation with new fields)

- [ ] **Task 3.2:** Add limit_results Query Parameter
  - Files: `LLM_service/app/api/v1/jobs.py`
  - Details: Add `limit_results` parameter to `list_jobs()` function signature
  - Lines: ~53-78 (add new query parameter)

- [ ] **Task 3.3:** Implement Time-Based Filtering Logic
  - Files: `LLM_service/app/api/v1/jobs.py`
  - Details: Add datetime filtering for "Today", "7 Days", "30 Days" options
  - Lines: After line ~157 (after user filter, before count query)

- [ ] **Task 3.4:** Implement Numeric Limit Override
  - Files: `LLM_service/app/api/v1/jobs.py`
  - Details: Parse numeric values and override default limit parameter
  - Lines: Same location as Task 3.3

- [ ] **Task 3.5:** Update Job Summary Builder
  - Files: `LLM_service/app/api/v1/jobs.py`
  - Details: Include `username` and `action` in JobSummary construction
  - Lines: ~194-209 (job_summaries loop)

### Phase 4: TypeScript Frontend - Type Definitions
**Goal:** Update TypeScript types to match new API contract

- [ ] **Task 4.1:** Update LLMJob Interface
  - Files: `src/app/(protected)/admin/debug/llm-types.ts`
  - Details: Add `username?: string` and `action?: string` fields
  - Lines: ~7-19 (LLMJob interface)

### Phase 5: TypeScript Frontend - Server Actions
**Goal:** Modify Server Actions to pass limit_results parameter to API

- [ ] **Task 5.1:** Update fetchLLMJobs Server Action
  - Files: `src/app/(protected)/admin/debug/actions.ts`
  - Details: Add `limitResults?: string` parameter, include in API query string
  - Lines: Find `fetchLLMJobs` function, update signature and URL construction

### Phase 6: React Frontend - UI Component Updates
**Goal:** Add limit results filter dropdown to LLM Queue tab

- [ ] **Task 6.1:** Add limitResults State Variable
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Add `useState` hook with default value '25'
  - Lines: ~44-56 (after statusFilter state)

- [ ] **Task 6.2:** Update fetchJobs Callback
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Pass `limitResults` to `fetchLLMJobs()` call, add to dependency array
  - Lines: ~90-102 (fetchJobs useCallback)

- [ ] **Task 6.3:** Add Limit Results Filter Dropdown
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Add Select component with 7 options (25, 50, 100, 200, Today, 7 Days, 30 Days)
  - Lines: ~179-205 (add new Select before Refresh button)

- [ ] **Task 6.4:** Update Table to Display New Fields (Optional Enhancement)
  - Files: `src/app/(protected)/admin/debug/LLMQueueTab.tsx`
  - Details: Consider adding "Action" column to jobs table (optional - can be added later)
  - Lines: ~243-277 (table headers and cells)
  - Note: This is optional for now - fields are in API response but not displayed

### Phase 7: Basic Code Validation (AI-Only)
**Goal:** Run safe static analysis only - NEVER run dev server, build, or application commands

- [ ] **Task 7.1:** Python Code Quality Verification
  - Files: LLM service Python files
  - Details: Run linting with `flake8` or `pylint` (static analysis only)
  - Command: `cd LLM_service && flake8 app/ --max-line-length=120` (if available)

- [ ] **Task 7.2:** TypeScript Code Quality Verification
  - Files: TypeScript files in `src/app/(protected)/admin/debug/`
  - Details: Run `npm run lint` for ESLint validation
  - Command: `npm run lint` (existing Next.js linting)

- [ ] **Task 7.3:** Static Logic Review
  - Files: All modified Python and TypeScript files
  - Details: Read code to verify parameter handling, type safety, edge cases
  - Focus: Ensure nullable fields handled correctly, filter validation logic sound

🛑 **CRITICAL WORKFLOW CHECKPOINT**
After completing Phase 7, you MUST:
1. Present "Implementation Complete!" message (exact text from section 16)
2. Wait for user approval of code review
3. Execute comprehensive code review process
4. NEVER proceed to user testing without completing code review first

### Phase 8: Comprehensive Code Review (Mandatory)
**Goal:** Present implementation completion and request thorough code review

- [ ] **Task 8.1:** Present "Implementation Complete!" Message (MANDATORY)
  - Template: Use exact message from section 16, step 7
  - Details: STOP here and wait for user code review approval

- [ ] **Task 8.2:** Execute Comprehensive Code Review (If Approved)
  - Process: Follow step 8 comprehensive review checklist from section 16
  - Details: Read all files, verify requirements, integration testing, provide detailed summary

### Phase 9: User Testing (Only After Code Review)
**Goal:** Request human testing for API functionality and UI behavior

- [ ] **Task 9.1:** Present AI Testing Results
  - Files: Summary of static analysis and code review
  - Details: Provide comprehensive results of all AI-verifiable checks

- [ ] **Task 9.2:** Request User Manual Testing
  - Testing Checklist:
    - **Backend API Testing**: Use Postman/curl to submit workflow with username/action
    - **Backend API Testing**: Test /jobs endpoint with limit_results parameter variations
    - **Frontend Testing**: Verify limit results dropdown shows all 7 options
    - **Frontend Testing**: Test each filter option and verify correct job counts
    - **Frontend Testing**: Check responsive design on mobile/tablet/desktop
    - **Integration Testing**: Submit workflow from Next.js app, verify fields stored correctly
  - Details: Provide clear test cases and expected results

- [ ] **Task 9.3:** Wait for User Confirmation
  - Files: N/A
  - Details: Wait for user to complete manual testing and confirm results

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
└── migrations/
    └── versions/
        ├── XXXX_add_username_action_to_workflow_jobs.py  # Alembic migration
        └── XXXX_add_username_action_to_workflow_jobs/
            └── down.sql                                    # Rollback migration
```

### Files to Modify
- [ ] **`LLM_service/app/models/workflow_job.py`** - Add username/action columns to WorkflowJob model
- [ ] **`LLM_service/app/schemas/workflow.py`** - Add username/action to WorkflowSubmitRequest
- [ ] **`LLM_service/app/schemas/jobs.py`** - Add username/action to JobSummary
- [ ] **`LLM_service/app/api/v1/workflow.py`** - Pass username/action to job creation
- [ ] **`LLM_service/app/api/v1/jobs.py`** - Add limit_results parameter and filtering logic
- [ ] **`src/app/(protected)/admin/debug/llm-types.ts`** - Add username/action to LLMJob interface
- [ ] **`src/app/(protected)/admin/debug/actions.ts`** - Update fetchLLMJobs to accept limitResults
- [ ] **`src/app/(protected)/admin/debug/LLMQueueTab.tsx`** - Add limit results filter dropdown

### Dependencies to Add
**No new dependencies required** - Using existing libraries (SQLAlchemy, FastAPI, Pydantic, React, Shadcn UI).

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze
- [ ] **Error Scenario 1:** Invalid limit_results value passed to /jobs endpoint
  - **Code Review Focus:** `LLM_service/app/api/v1/jobs.py` - Check validation logic for limit_results parameter
  - **Potential Fix:** Return 400 Bad Request with clear error message listing valid values

- [ ] **Error Scenario 2:** Database migration fails halfway through (one column added, second fails)
  - **Code Review Focus:** `LLM_service/migrations/versions/XXXX_*.py` - Verify migration is atomic
  - **Potential Fix:** Alembic transactions are atomic by default - no additional handling needed

- [ ] **Error Scenario 3:** Existing API consumers break due to response schema changes
  - **Code Review Focus:** `LLM_service/app/schemas/jobs.py` - Verify new fields are optional
  - **Potential Fix:** All new fields are nullable/optional - backward compatible by design

### Edge Cases to Consider
- [ ] **Edge Case 1:** User requests "Today" filter at midnight UTC boundary
  - **Analysis Approach:** Check if timezone handling is correct in time-based filter logic
  - **Recommendation:** Use UTC timezone consistently, document timezone behavior in API docs

- [ ] **Edge Case 2:** Numeric limit_results exceeds database record count
  - **Analysis Approach:** Verify query doesn't fail, just returns fewer records
  - **Recommendation:** SQLAlchemy .limit() handles this gracefully - no action needed

- [ ] **Edge Case 3:** Username or action strings exceed 255 characters
  - **Analysis Approach:** Check Pydantic validation enforces max_length
  - **Recommendation:** Pydantic Field(max_length=255) already handles truncation/validation

### Security & Access Control Review
- [ ] **Admin Access Control:** LLM Queue tab already protected by admin-only route - no changes needed
- [ ] **Authentication State:** LLM service uses X-API-Secret header for authentication - existing pattern
- [ ] **Form Input Validation:** Username/action are informational only (no security implications)
- [ ] **Permission Boundaries:** All endpoints require API secret - no new permission concerns
- [ ] **SQL Injection:** SQLAlchemy ORM prevents injection - no raw SQL used

### AI Agent Analysis Approach
**Focus:** Review API parameter validation, time-based filtering logic, and database migration safety.

**Priority Order:**
1. **Critical:** Database migration rollback safety (down.sql must be correct)
2. **Important:** API parameter validation for limit_results (prevent 500 errors)
3. **Nice-to-have:** Additional logging for debugging filter usage

---

## 15. Deployment & Configuration

### Environment Variables
**No new environment variables required** - Using existing LLM service configuration.

---

## 16. AI Agent Instructions

### Default Workflow - STRATEGIC ANALYSIS FIRST
This task has straightforward requirements with no architectural decisions needed. Proceeding directly to implementation after task document approval.

### Communication Preferences
- [ ] Ask for clarification if time-based filtering logic is unclear
- [ ] Provide progress updates after completing each backend/frontend phase
- [ ] Flag any database migration concerns immediately
- [ ] Suggest improvements if better filter UX patterns are identified

### Implementation Approach - CRITICAL WORKFLOW
Follow the 8-step workflow from the task template exactly.

### What Constitutes "Explicit User Approval"
Follow the approval patterns from the task template exactly.

### Code Quality Standards
- [ ] Follow TypeScript best practices
- [ ] Add proper error handling for invalid limit_results values
- [ ] **🚨 MANDATORY: Write Professional Comments - Never Historical Comments**
- [ ] **🚨 MANDATORY: Use early returns to keep code clean and readable**
- [ ] **🚨 MANDATORY: Use async/await instead of .then() chaining**
- [ ] **🚨 MANDATORY: NO FALLBACK BEHAVIOR - Always throw errors instead**
- [ ] **🚨 MANDATORY: Create down migration files before running ANY database migration**
- [ ] **Ensure responsive design (mobile-first approach with Tailwind breakpoints)**
- [ ] **Test components in both light and dark mode**
- [ ] Follow Python PEP 8 style guidelines
- [ ] Use type hints for all Python function parameters and return values
- [ ] **🚨 MANDATORY: Clean up removal artifacts**

### Architecture Compliance
- [ ] **✅ VERIFY: Used correct data access pattern**
  - API routes for REST endpoints (LLM service)
  - SQLAlchemy ORM queries in route handlers
  - No Server Actions needed (Python backend)
- [ ] **❌ AVOID: Creating unnecessary complexity**
- [ ] **🔍 DOUBLE-CHECK: Are time-based filters using indexed created_at column efficiently?**

---

## 17. Notes & Additional Context

### Research Links
- **Alembic Documentation**: https://alembic.sqlalchemy.org/en/latest/tutorial.html
- **FastAPI Query Parameters**: https://fastapi.tiangolo.com/tutorial/query-params/
- **SQLAlchemy DateTime Filtering**: https://docs.sqlalchemy.org/en/14/core/sqlelement.html#sqlalchemy.sql.expression.ColumnElement.between

### Additional Implementation Notes

**Backend - Database Migration:**
- Use Alembic autogenerate to create migration (detects model changes automatically)
- Test migration in development environment before applying to production
- Verify down migration works by rolling back and re-applying

**Backend - API Parameter Validation:**
- Pydantic validation handles max_length enforcement automatically
- FastAPI returns 422 Unprocessable Entity for validation failures
- Custom error messages in HTTPException for limit_results validation

**Frontend - Filter UX:**
- Consider adding tooltips to explain time-based filters (e.g., "Jobs created today in UTC timezone")
- Could add "All Jobs" option to reset limit filter (optional enhancement)
- Default value of 25 balances performance and usability

**Testing Strategy:**
- Use Postman or curl to test API directly (bypass frontend)
- Create test workflow submissions with various username/action combinations
- Test each limit_results variation (numeric and time-based)
- Verify existing jobs without username/action display correctly (NULL handling)

---

## 18. Second-Order Consequences & Impact Analysis

### AI Analysis Instructions
🔍 **MANDATORY: The AI agent must analyze this section thoroughly before implementation**

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No breaking changes - all new fields are optional
- [ ] **Database Dependencies:** Existing queries unaffected - new columns nullable
- [ ] **Component Dependencies:** Frontend changes localized to LLMQueueTab component
- [ ] **Authentication/Authorization:** No changes to auth logic

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** New fields flow through API → Database → UI (no side effects)
- [ ] **UI/UX Cascading Effects:** Filter dropdown self-contained, no parent dependencies
- [ ] **State Management:** Local component state only, no global state affected
- [ ] **Routing Dependencies:** No route changes

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** Time-based filtering uses indexed `created_at` column (efficient)
- [ ] **Bundle Size:** No new dependencies added to frontend
- [ ] **Server Load:** Filtering reduces query result size (improves performance)
- [ ] **Caching Strategy:** No caching in place - could add later if needed

#### 4. **Security Considerations**
- [ ] **Attack Surface:** Username/action are informational only (no security risk)
- [ ] **Data Exposure:** Fields visible only to admins (already protected)
- [ ] **Permission Escalation:** No new permission logic introduced
- [ ] **Input Validation:** Pydantic validates max_length, FastAPI handles injection prevention

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** Additive changes only - existing workflows unchanged
- [ ] **Data Migration:** Historical jobs show NULL values (acceptable - informational fields)
- [ ] **Feature Deprecation:** No features removed
- [ ] **Learning Curve:** Filter dropdown is self-explanatory with clear labels

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** Minimal increase - straightforward filtering logic
- [ ] **Dependencies:** No new external dependencies
- [ ] **Testing Overhead:** Simple validation testing required
- [ ] **Documentation:** API docs need update to reflect new parameters

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [ ] **Database Migration Required:** Yes - requires Alembic migration in development environment
- [ ] **Breaking API Changes:** None - all changes are backward compatible
- [ ] **Performance Degradation:** None - filtering improves performance by reducing result size
- [ ] **Security Vulnerabilities:** None identified
- [ ] **User Data Loss:** None - migration adds nullable columns only

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Increased Complexity:** Minor - one new filter parameter with validation logic
- [ ] **New Dependencies:** None
- [ ] **UI/UX Changes:** Minimal - one new dropdown added to admin tab
- [ ] **Maintenance Overhead:** Low - standard REST API maintenance

### Mitigation Strategies

#### Database Changes
- [ ] **Backup Strategy:** Development environment only - no production backup needed yet
- [ ] **Rollback Plan:** Down migration file created and tested before applying forward migration
- [ ] **Staging Testing:** Test migration in local development environment first
- [ ] **Gradual Migration:** Not needed - columns are nullable and non-critical

#### API Changes
- [ ] **Versioning Strategy:** Not needed - changes are additive and backward compatible
- [ ] **Deprecation Timeline:** No deprecation - existing functionality preserved
- [ ] **Client Communication:** Update API documentation with new parameters
- [ ] **Graceful Degradation:** Old API calls work unchanged (fields optional)

#### UI/UX Changes
- [ ] **Feature Flags:** Not needed - admin-only feature with limited user base
- [ ] **User Communication:** No notification needed - admin users expect tool improvements
- [ ] **Help Documentation:** Update admin guide if it exists
- [ ] **Feedback Collection:** Monitor admin feedback on filter usefulness

### AI Agent Checklist

Before presenting the task document to the user, the AI agent must:
- [x] **Complete Impact Analysis:** All sections filled out with specific details
- [x] **Identify Critical Issues:** One red flag identified (database migration required)
- [x] **Propose Mitigation:** Down migration strategy documented and required
- [x] **Alert User:** Database migration requirement clearly stated
- [x] **Recommend Alternatives:** No alternatives needed - implementation is straightforward

### Example Analysis Summary

```
🔍 **SECOND-ORDER IMPACT ANALYSIS:**

**Breaking Changes Identified:**
- None - all API changes are additive and backward compatible

**Performance Implications:**
- Positive impact - time-based filtering reduces query result size
- Uses indexed created_at column for efficient date range queries
- No new dependencies to load

**Security Considerations:**
- Username/action fields are informational only (no sensitive data)
- Already admin-protected route (no new access control needed)
- Pydantic validation prevents oversized input strings

**User Experience Impacts:**
- Minor improvement - admins can filter jobs more efficiently
- Historical jobs show NULL values for username/action (acceptable)
- Filter dropdown is self-explanatory with clear labels

**Mitigation Recommendations:**
- Create down migration file before applying schema changes (MANDATORY)
- Test time-based filtering with various timezone edge cases
- Update API documentation with new parameter descriptions
- Consider adding tooltips to explain time-based filter behavior

**🚨 USER ATTENTION REQUIRED:**
Database migration is required to add username and action columns. This is a development environment change only and includes a tested rollback migration for safety. Migration is non-destructive (adds nullable columns).
```

---

*Template Version: 1.3*
*Last Updated: 12/19/2025*
*Created By: AI Task Template + Brandon Hancock*
