# Task 046: LLM Microservice Implementation

## 1. Task Overview

### Task Title
**Build Python LLM Microservice with Async Workflow Engine**

### Goal Statement
Create a standalone Python microservice (`LLM_service/`) to handle asynchronous AI workflows with webhook notifications, eliminating timeout issues and enabling concurrent request processing. The service uses Celery + Redis for queue management, FastAPI for the API layer, and a flexible JSON-based workflow engine with conditional branching support. This replaces synchronous AI API calls in the Next.js app with an async, scalable, webhook-driven architecture.

---

## 2. Strategic Analysis & Solution Options

### Problem Context
Current AI workflows (mission generation, emergency contacts, bundle recommendations) run synchronously within HTTP request lifecycles, causing:
- **Timeout issues** - Complex workflows exceed Next.js 120s timeout
- **No concurrency** - Sequential processing wastes resources
- **Polling required** - Frontend must poll for completion status
- **Difficult scaling** - Cannot add more AI capacity without redeploying main app

A microservice architecture solves these by decoupling AI processing from the web request/response cycle.

### Solution Options Analysis

#### Option A: Simple Background Jobs (Bull/BullMQ in Node.js)
**Approach:** Keep everything in Node.js, use Bull queue with Redis

**Pros:**
- ✅ Same language as main app (TypeScript)
- ✅ Easier for team to maintain
- ✅ No new deployment complexity

**Cons:**
- ❌ Node.js single-threaded - limited concurrent processing
- ❌ Less mature ecosystem for long-running AI tasks
- ❌ No built-in workflow engine with conditional branching
- ❌ Harder to scale workers independently

**Implementation Complexity:** Low
**Risk Level:** Low - Known technology

#### Option B: Python Microservice with Celery (Recommended)
**Approach:** Dedicated Python service with Celery + Redis + FastAPI

**Pros:**
- ✅ Python is AI/ML industry standard
- ✅ Celery battle-tested for long-running tasks
- ✅ True multi-process concurrency
- ✅ Independent scaling (add workers without touching main app)
- ✅ Rich ecosystem for AI/LLM tooling
- ✅ Can build sophisticated workflow engine with transformations

**Cons:**
- ❌ New language/stack for team
- ❌ Additional deployment complexity
- ❌ Cross-service integration required

**Implementation Complexity:** Medium-High
**Risk Level:** Medium - New technology but industry-standard

#### Option C: Serverless Functions (AWS Lambda / Vercel Functions)
**Approach:** Deploy each workflow as serverless function

**Pros:**
- ✅ No infrastructure management
- ✅ Auto-scaling built-in
- ✅ Pay per execution

**Cons:**
- ❌ 15-minute timeout limits (AWS Lambda)
- ❌ Cold starts add latency
- ❌ No persistent queue state
- ❌ Harder to implement complex workflow orchestration
- ❌ Vendor lock-in

**Implementation Complexity:** Low-Medium
**Risk Level:** Medium - Timeout constraints

### Recommendation & Rationale

**🎯 RECOMMENDED SOLUTION:** Option B - Python Microservice with Celery

**Why this is the best choice:**
1. **Industry Standard** - Python + Celery is the proven solution for async AI/ML tasks at scale
2. **True Concurrency** - Multi-process workers handle concurrent LLM calls efficiently (bottleneck is LLM response time, not CPU)
3. **Workflow Engine** - Can build sophisticated workflow orchestration with conditional branching, transformations, and error handling
4. **Independent Scaling** - Add more Celery workers without touching main Next.js app
5. **Future-Proof** - Easy to add new AI features, models, or providers without main app changes

**Key Decision Factors:**
- **Performance Impact:** Async processing eliminates timeouts, enables true concurrency
- **User Experience:** Webhooks provide instant notifications vs polling
- **Maintainability:** Clear separation of concerns, workflows defined in JSON files
- **Scalability:** Add AI capacity independently of web tier
- **Security:** Separate service isolates AI processing from user-facing app

**Alternative Consideration:**
Option A (Node.js Bull) would be simpler initially but would hit scaling limits quickly. The investment in Python/Celery pays off as AI usage grows.

---

## 3. Project Analysis & Current State

### Technology & Architecture
- **Main App:** Next.js 15.3, React 19, TypeScript 5.4 (strict mode)
- **Database:** Supabase PostgreSQL via Drizzle ORM
- **AI Integration:** Vercel AI SDK + OpenRouter (Claude Sonnet 3.5, Haiku)
- **Authentication:** Supabase Auth managed by middleware
- **Current AI Pattern:** Synchronous server actions calling OpenRouter directly

### Current State
**Existing AI Workflows (all synchronous):**
1. **Mission Generation** (`src/lib/ai/mission-generator.ts`) - Streaming with 120s timeout
2. **Emergency Contacts** (`src/lib/ai/emergency-contacts-generator.ts`) - Non-streaming, ~30s
3. **Bundle Recommendations** (embedded in mission generation) - Part of mission workflow
4. **Email Personalization** (planned) - Not yet implemented

**Current Limitations:**
- All workflows run within HTTP request lifecycle
- No queue or job tracking
- No retry logic
- No concurrency (sequential processing)
- Polling required for long-running tasks

### Existing Context Providers Analysis
**Main app contexts:**
- **UserContext (`useUser()`)** - User profile, subscription tier, role
- **UsageContext (`useUsage()`)** - Token usage, billing data
- **Available throughout:** Protected routes wrapped in context providers

**Database Tables (relevant to microservice):**
- `userActivityLog` - AI usage tracking (JSONB metadata: tokens, cost, model)
- `profiles` - User subscription tiers (FREE, BASIC, PRO)
- `missionReports` - Generated reports with JSONB data
- `systemLogs` - Error logging

---

## 4. Context & Problem Definition

### Problem Statement
Current synchronous AI workflows are hitting scalability and reliability limits:
- **Timeouts:** Mission generation with complex scenarios exceeds 120s Next.js limit
- **Resource waste:** LLM API calls wait sequentially instead of processing concurrently
- **Poor UX:** Users stare at loading spinners for 30-90 seconds with no feedback
- **Difficult monitoring:** No visibility into queue depth, job status, or failure rates
- **Hard to scale:** Adding AI capacity requires redeploying entire Next.js app

**Pain Points:**
- Admin reports: "Users abandon during mission generation"
- Logs show: 5-10% of AI requests timeout
- Cannot process multiple user requests simultaneously
- No retry logic when OpenRouter has transient errors

### Success Criteria
- [ ] All AI workflows complete successfully regardless of duration (no timeouts)
- [ ] Concurrent processing: Handle 10+ simultaneous user requests
- [ ] Webhook notifications: Frontend receives updates without polling
- [ ] Job tracking: Complete audit trail in database (queued, processing, completed, failed)
- [ ] Cost transparency: Return token counts and cost data to main app
- [ ] Emergency contacts workflow migrated and tested end-to-end
- [ ] Mission generation workflow migrated with streaming support
- [ ] Monitoring dashboard (Celery Flower) shows real-time worker status

---

## 5. Development Mode Context

### Development Mode Context
- **🚨 IMPORTANT: This is a new microservice - greenfield development**
- **No backwards compatibility concerns** - Fresh codebase
- **Shared database** - Uses same Supabase PostgreSQL as main app
- **Priority: Production-ready architecture** - Build for scale from day 1
- **Aggressive iteration allowed** - Refactor workflows as we learn

---

## 6. Technical Requirements

### Functional Requirements
- **FR1:** Submit AI workflow jobs via REST API (POST /workflow)
- **FR2:** Check job status via REST API (GET /status/{job_id})
- **FR3:** Execute workflows defined in JSON files with conditional branching
- **FR4:** Support step types: llm, external_api, transform, conditional, parallel
- **FR5:** Send webhook notifications on job completion with HMAC signatures
- **FR6:** Retry webhook delivery 3 times with exponential backoff (5s, 15s, 45s)
- **FR7:** Track all jobs in database with status (pending, queued, processing, completed, failed)
- **FR8:** Calculate and return LLM costs (tokens + USD) to caller
- **FR9:** Support priority queues (0-10, higher = more urgent)
- **FR10:** Dry-run mode: Validate workflows without executing (cost estimation)
- **FR11:** CLI tools: Interactive workflow editor, validator, diagram generator
- **FR12:** Load prompt templates from markdown files (reuse main app pattern)

### Non-Functional Requirements
- **Performance:**
  - API response time < 100ms (for job submission)
  - Webhook delivery success rate > 99%
  - Job execution success rate > 95%
  - Support 10+ concurrent workflows
- **Security:**
  - API key authentication for main app
  - HMAC webhook signatures (sha256)
  - Input validation via Pydantic schemas
  - Per-user rate limiting (configurable, default: off)
- **Reliability:**
  - Database-backed queue (survives service restarts)
  - Stale job cleanup (auto-mark jobs older than 72 hours)
  - Graceful error handling (fail/continue/retry modes)
- **Observability:**
  - Structured JSON logs (job_id, workflow_name, step, duration)
  - Celery Flower monitoring dashboard
  - Health check endpoint (Redis, database, workers)
- **Responsive Design:** N/A (backend service only)
- **Theme Support:** N/A
- **Compatibility:** Python 3.11+, PostgreSQL 14+, Redis 7+

### Technical Constraints
- **Must use:** Supabase PostgreSQL database (shared with main app)
- **Must support:** OpenRouter, Anthropic, OpenAI providers
- **Must preserve:** Prompt templates in markdown files (for version control)
- **Must return:** Cost data to caller (main app logs to `userActivityLog`)
- **Must deploy:** Render web service + worker + managed Redis

---

## 7. Data & Database Changes

### Database Schema Changes

**New Tables (in Supabase PostgreSQL):**

```sql
-- Primary job tracking table
CREATE TABLE llm_workflow_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    celery_task_id VARCHAR(255) UNIQUE NOT NULL,
    workflow_name VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 0,
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    input_data JSONB NOT NULL,
    result_data JSONB,
    error_message TEXT,
    queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    is_stale BOOLEAN DEFAULT FALSE,
    stale_reason VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflow_jobs_celery_task ON llm_workflow_jobs(celery_task_id);
CREATE INDEX idx_workflow_jobs_status ON llm_workflow_jobs(status);
CREATE INDEX idx_workflow_jobs_user_id ON llm_workflow_jobs(user_id);
CREATE INDEX idx_workflow_jobs_workflow_name ON llm_workflow_jobs(workflow_name);
CREATE INDEX idx_workflow_jobs_created_at ON llm_workflow_jobs(created_at);
CREATE INDEX idx_workflow_jobs_stale ON llm_workflow_jobs(is_stale) WHERE is_stale = TRUE;

-- Webhook delivery attempts (Dead Letter Queue tracking)
CREATE TABLE llm_webhook_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES llm_workflow_jobs(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    webhook_url TEXT NOT NULL,
    payload JSONB NOT NULL,
    http_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INTEGER,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_attempts_job_id ON llm_webhook_attempts(job_id);
CREATE INDEX idx_webhook_attempts_status ON llm_webhook_attempts(http_status);
CREATE INDEX idx_webhook_attempts_next_retry ON llm_webhook_attempts(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- LLM provider usage tracking (microservice internal)
CREATE TABLE llm_provider_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES llm_workflow_jobs(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
    duration_ms INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_usage_job_id ON llm_provider_usage(job_id);
CREATE INDEX idx_provider_usage_provider ON llm_provider_usage(provider);
CREATE INDEX idx_provider_usage_model ON llm_provider_usage(model);
CREATE INDEX idx_provider_usage_created_at ON llm_provider_usage(created_at);
```

**Note:** Celery also creates default tables (`celery_taskmeta`, `celery_tasksetmeta`) for internal state management.

### Data Model Updates
**New Types (Python/SQLAlchemy):**
```python
from enum import Enum

class JobStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class WorkflowJob(Base):
    __tablename__ = "llm_workflow_jobs"
    # ... fields matching SQL schema above
```

### Data Migration Plan
- [ ] Create migration script in `LLM_service/migrations/`
- [ ] Run migration against development Supabase database
- [ ] Verify tables created with correct indexes
- [ ] Test Celery can read/write to tables
- [ ] No data migration needed (new tables)

### 🚨 MANDATORY: Down Migration Safety Protocol
- [ ] **Step 1: Generate Migration** - Create SQL script in `migrations/001_create_llm_tables.sql`
- [ ] **Step 2: Create Down Migration** - Create `migrations/001_create_llm_tables_down.sql`
- [ ] **Step 3: Test Down Migration** - Verify rollback drops all tables cleanly
- [ ] **Step 4: Apply Migration** - Run `001_create_llm_tables.sql` against database

**Down Migration Script:**
```sql
-- migrations/001_create_llm_tables_down.sql
DROP TABLE IF EXISTS llm_provider_usage CASCADE;
DROP TABLE IF EXISTS llm_webhook_attempts CASCADE;
DROP TABLE IF EXISTS llm_workflow_jobs CASCADE;
```

---

## 8. API & Backend Changes

### Data Access Pattern - CRITICAL ARCHITECTURE RULES

**This is a Python microservice - different patterns than Next.js app:**

#### **FastAPI Endpoints** → `app/api/v1/*.py`
- [ ] `POST /api/v1/workflow` - Submit workflow job
- [ ] `GET /api/v1/status/{job_id}` - Check job status
- [ ] `POST /api/v1/workflow/validate` - Dry-run validation
- [ ] `DELETE /api/v1/workflow/{job_id}` - Cancel job
- [ ] `GET /api/v1/health` - Health check
- [ ] `POST /api/v1/admin/cleanup/stale` - Stale job cleanup (admin only)

#### **Celery Tasks** → `app/tasks/*.py`
- [ ] `execute_workflow` - Main workflow executor
- [ ] `deliver_webhook` - Webhook delivery with retries
- [ ] `cleanup_stale_jobs` - Scheduled cleanup (Celery beat)

#### **Database Access** → SQLAlchemy ORM (not Drizzle)
- [ ] All database operations use SQLAlchemy models
- [ ] Connection pooling via SQLAlchemy engine
- [ ] Session management with context managers

### API Endpoints Specification

**POST /api/v1/workflow**
```python
# Request
{
  "workflow_name": "emergency_contacts",
  "user_id": "uuid",
  "input_data": {
    "formData": { /* WizardFormData */ }
  },
  "webhook_url": "https://app.com/webhook",  # optional
  "webhook_secret": "shared_secret",  # optional
  "priority": 0  # optional, 0-10
}

# Response 202 Accepted
{
  "job_id": "uuid",
  "celery_task_id": "uuid",
  "status": "queued",
  "estimated_wait_seconds": 5,
  "status_url": "/api/v1/status/<job_id>"
}
```

**GET /api/v1/status/{job_id}**
```python
# Response 200 OK
{
  "job_id": "uuid",
  "status": "completed",  # pending|queued|processing|completed|failed|cancelled
  "workflow_name": "emergency_contacts",
  "created_at": "2024-12-16T10:00:00Z",
  "started_at": "2024-12-16T10:00:05Z",
  "completed_at": "2024-12-16T10:00:25Z",
  "duration_ms": 20000,
  "result": {
    "contacts": [...],
    "meetingLocations": [...],
    "cost_data": {
      "provider": "openrouter",
      "model": "anthropic/claude-3.5-sonnet",
      "input_tokens": 5000,
      "output_tokens": 3000,
      "total_tokens": 8000,
      "cost_usd": 0.24
    }
  },
  "error_message": null
}
```

### External Integrations
- **OpenRouter API** - Primary LLM provider (Claude models)
- **Anthropic API** - Direct Claude access (optional fallback)
- **OpenAI API** - GPT models (optional)
- **Google Places API** - Emergency services lookup (from workflows)

**🚨 MANDATORY: Use Latest AI Models**
- OpenRouter: `anthropic/claude-3.5-sonnet` (not claude-3-sonnet)
- Anthropic Direct: `claude-3-5-sonnet-20241022`
- OpenAI: `gpt-4o` (not gpt-4-turbo or gpt-3.5-turbo)

---

## 9. Frontend Changes

**No frontend changes in Phase 1-8 (Emergency Contacts migration)**

Frontend integration happens in **Phase 10** (Main App Integration):
- [ ] Create `src/lib/llm-microservice-client.ts` - TypeScript client
- [ ] Create `src/app/api/webhooks/llm/route.ts` - Webhook handler
- [ ] Add HMAC verification in webhook handler
- [ ] Update existing server actions to call microservice (optional, gradual migration)

---

## 10. Code Changes Overview

### 📂 **New Service (Greenfield Development)**

This task creates an entirely new Python microservice in a new directory:

```
LLM_service/  (NEW - not part of existing Next.js app)
├── app/
│   ├── main.py                    # FastAPI application
│   ├── celery_app.py              # Celery configuration
│   ├── config.py                  # Settings loader
│   ├── database.py                # SQLAlchemy setup
│   ├── api/v1/                    # FastAPI endpoints
│   ├── models/                    # SQLAlchemy models
│   ├── schemas/                   # Pydantic schemas
│   ├── tasks/                     # Celery tasks
│   ├── services/                  # LLM clients, webhooks
│   ├── workflows/                 # Workflow engine
│   └── utils/                     # Logging, security
├── workflows/
│   ├── definitions/               # JSON workflow files
│   └── prompts/                   # Markdown templates (copied from main app)
├── cli/                           # CLI tools
├── tests/                         # Unit & integration tests
├── migrations/                    # Database migrations
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── settings.ini
└── README.md
```

**No modifications to existing Next.js codebase until Phase 10 (integration)**

### 🎯 **Key Architecture Patterns**

**Workflow Engine:**
```python
# Workflow JSON defines steps
{
  "name": "emergency_contacts",
  "steps": [
    {"id": "fetch", "type": "external_api", ...},
    {"id": "transform", "type": "transform", ...},
    {"id": "llm", "type": "llm", ...},
    {"id": "parse", "type": "transform", ...}
  ]
}

# Engine executes steps sequentially
for step in workflow.steps:
    result = execute_step(step, context)
    context.set(step.id, result)
```

**LLM Provider Abstraction:**
```python
# Provider interface
class LLMProvider(ABC):
    async def generate(prompt, model, **kwargs) -> LLMResponse
    def calculate_cost(model, tokens) -> float

# Implementations
OpenRouterProvider()
AnthropicProvider()
OpenAIProvider()
```

---

## 11. Implementation Plan

### Phase 1: Core Infrastructure ✅ COMPLETED
**Goal:** FastAPI + Celery + Redis + Database setup

**Tasks:**
- [x] Create `LLM_service/` directory with Python venv
- [x] Install dependencies (`fastapi`, `celery`, `redis`, `sqlalchemy`, `pydantic`, `httpx`)
- [x] Implement `app/config.py` - Load `settings.ini` with env var expansion
- [x] Implement `app/database.py` - SQLAlchemy connection to Supabase
- [x] Create database migration scripts (`migrations/001_create_llm_tables.sql`)
- [x] Implement `app/celery_app.py` - Celery configuration with Redis broker
- [x] Create `docker-compose.yml` - FastAPI + Celery workers + Redis + Flower
- [x] Implement `app/main.py` - FastAPI app with health check endpoint
- [x] Test: `docker-compose up` starts all services successfully (ready for manual testing)

**Success Criteria:**
- ✅ Docker containers start without errors (docker-compose.yml created, ready to test)
- ✅ GET /health returns 200 with service status (implemented)
- ✅ Celery worker connects to Redis (configured)
- ✅ Database tables created successfully (3 tables: llm_workflow_jobs, llm_webhook_attempts, llm_provider_usage)
- ✅ Flower monitoring accessible at localhost:5555 (configured in docker-compose)

**Implementation Report (2024-12-16):**

**Files Created:**
1. **Directory Structure** (`LLM_service/`)
   - `app/` - Python application code
   - `migrations/` - SQL migration scripts
   - `tests/` - Test directory (empty, for future use)
   - `.python-version` - Python 3.12.0 (for Render deployment)

2. **Configuration Files**
   - `requirements.txt` - 15 Python dependencies (FastAPI, Celery, SQLAlchemy, Pydantic, etc.)
   - `settings.ini` - Configuration template with environment variable substitution
   - `.env.local` - Environment variables (DATABASE_URL, OPENROUTER_API_KEY, GOOGLE_SERVICES_API_KEY, REDIS_URL)
   - `.gitignore` - Python, environment, IDE, OS exclusions

3. **Python Application Files**
   - `app/config.py` - Pydantic Settings with .env.local loading
   - `app/database.py` - SQLAlchemy engine with connection pooling (10 connections, 20 overflow)
   - `app/celery_app.py` - Celery configuration with Redis broker/backend
   - `app/main.py` - FastAPI app with health check endpoint (database, Redis, Celery workers)
   - `app/__init__.py` - Empty init file

4. **Docker Configuration**
   - `Dockerfile` - Python 3.12-slim with PostgreSQL client
   - `docker-compose.yml` - 4 services (api, worker, redis, flower)

5. **Database Migrations**
   - `migrations/001_create_llm_tables.sql` - Create 3 tables with indexes
   - `migrations/001_create_llm_tables_down.sql` - Rollback script (safe migration)

6. **Documentation**
   - `README.md` - Quick start guide, architecture overview, testing instructions

**Database Tables Created:**
- `llm_workflow_jobs` - Primary job tracking (16 columns, 6 indexes)
- `llm_webhook_attempts` - Webhook delivery tracking (11 columns, 3 indexes)
- `llm_provider_usage` - LLM usage and cost tracking (10 columns, 4 indexes)

**Key Architecture Decisions:**
1. **Python 3.12** - Latest stable version with `.python-version` for Render
2. **Pydantic Settings** - Type-safe configuration with environment variable loading
3. **SQLAlchemy Connection Pooling** - 10 connections, 20 overflow, pool_pre_ping enabled
4. **Celery Configuration** - Task tracking, acks_late, prefetch_multiplier=1
5. **Health Check Endpoint** - Verifies database, Redis, and Celery worker connectivity

**Environment Variables:**
- `DATABASE_URL` - Supabase PostgreSQL connection (shared with main app)
- `OPENROUTER_API_KEY` - Claude models via OpenRouter
- `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY` - Google Places API
- `REDIS_URL` - Redis message broker (Docker: redis://redis:6379)

**Testing Status:**
- ✅ Database migration applied successfully (3 tables created)
- ✅ Docker Compose tested - all 4 containers start successfully
- ✅ Health check endpoint tested - returns healthy status
- ✅ Celery worker connectivity tested - connected to Redis
- ✅ Flower dashboard tested - accessible at localhost:5555

**Final Test Results (2024-12-16):**

**Docker Compose Startup:**
```
✔ Container llm-redis   - Ready to accept connections tcp
✔ Container llm-worker  - celery@4291c02fa1bc ready (2 concurrent workers)
✔ Container llm-flower  - Visit me at http://0.0.0.0:5555
✔ Container llm-api     - ✅ Application startup complete
```

**Health Check Response:**
- Endpoint: `GET http://localhost:8000/health`
- Status: `200 OK`
- Response: All services healthy (database, redis, celery)

**Service Connectivity:**
- ✅ **Redis**: Connected on redis://redis:6379 (Docker network)
- ✅ **PostgreSQL**: Connected via SQLAlchemy with pool_pre_ping
- ✅ **Celery Worker**: Connected to broker and result backend
- ✅ **Flower**: Connected to Redis, monitoring worker

**Known Issues Resolved:**
1. ✅ Docker Compose `.env.local` loading - Fixed with `env_file` directive
2. ✅ Pydantic validation error - Fixed with `validation_alias` for Google API key
3. ✅ Redis connection refused - Fixed with dynamic `BROKER_URL`/`RESULT_BACKEND` from `REDIS_URL`
4. ✅ SQLAlchemy dialect error - Fixed with `postgres://` → `postgresql://` URL rewrite

**Phase 1 Complete - Ready for Phase 2! 🎉**

---

### Phase 2: LLM Provider Abstraction ✅ COMPLETED
**Goal:** Multi-provider LLM client with cost tracking

**Overview:**
Create an abstract LLM provider interface with OpenRouter implementation for Claude Sonnet 3.5. Support cost tracking based on token usage and standardized response format across providers.

**Tasks:**
- [x] Create `app/services/` directory structure
- [x] Define `LLMProvider` abstract base class in `app/services/llm_provider.py`
- [x] Implement `OpenRouterProvider` in `app/services/openrouter.py`
- [x] Create cost calculator in `app/services/cost_calculator.py`
- [x] Add provider factory pattern (`get_llm_provider("openrouter")`)
- [x] Update `settings.ini` with model cost configuration (already existed)
- [x] Write unit tests for cost calculation
- [x] Test: Call OpenRouter with Claude Sonnet, verify tokens and cost

**Success Criteria:**
- ✅ OpenRouter returns successful LLM response
- ✅ Token counts match API response
- ✅ Cost calculated correctly ($3/$15 per 1M tokens for Sonnet 3.5)
- ✅ Easy to switch providers via config
- ✅ Standardized `LLMResponse` type with tokens, cost, content

**Implementation Report (2024-12-16):**

**Files Created:**
1. **`app/services/llm_provider.py`** (200 lines) - Abstract base class
   - Pydantic models: `Message`, `UsageInfo`, `LLMResponse`
   - Custom exceptions: `LLMProviderError`, `LLMProviderTimeout`, `LLMProviderAuthError`, `LLMProviderRateLimitError`
   - Abstract interface with `generate()` and `close()` methods
   - Full type safety with Field descriptions for API documentation

2. **`app/services/cost_calculator.py`** (180 lines) - Cost calculation engine
   - `MODEL_COSTS` dictionary with 13+ models (Claude, GPT, Gemini, Llama)
   - `CostCalculator` class with calculation formula implementation
   - Helper methods: `get_model_pricing()`, `is_model_supported()`, `list_supported_models()`
   - Handles unknown models gracefully (returns $0.00)
   - 6 decimal precision matching database DECIMAL(10, 6)

3. **`app/services/openrouter.py`** (280 lines) - OpenRouter HTTP client
   - `OpenRouterProvider` class implementing `LLMProvider` interface
   - httpx AsyncClient with 120s timeout for long generations
   - Request building with all OpenRouter parameters (temperature, max_tokens, etc.)
   - Response parsing for content and token usage
   - Comprehensive error handling (401→Auth, 429→RateLimit, 400→BadRequest, 5xx→ServerError)
   - Cost calculation integration via CostCalculator
   - Metadata tracking (response_id, model_used)

4. **`app/services/__init__.py`** (90 lines) - Provider factory
   - `get_llm_provider(provider_name)` factory function
   - Configuration-driven provider selection
   - Future-ready for Anthropic and OpenAI providers
   - Exports all public symbols

5. **`tests/test_cost_calculator.py`** (250 lines) - Comprehensive unit tests
   - 15 test cases covering all scenarios
   - Model-specific tests: Sonnet 3.5, Opus 4, Haiku, GPT-4o
   - Edge cases: unknown models, zero tokens, large token counts
   - Precision testing: 6 decimal places
   - Helper method validation
   - Custom model costs support

6. **`test_openrouter_integration.py`** (220 lines) - Integration tests
   - 4 integration tests with real OpenRouter API
   - Test 1: Basic generation (31 tokens, $0.000177)
   - Test 2: Longer generation (90 tokens, $0.000966)
   - Test 3: Different models (Sonnet 3.5, Haiku)
   - Test 4: Error handling (invalid API key)

**Configuration:**
- `app/config.py` - `OPENROUTER_BASE_URL` already existed with correct default

**Testing Results:**

**Unit Tests:** ✅ 15/15 passed (0.28s)
```
✅ test_sonnet_cost_calculation
✅ test_opus_cost_calculation
✅ test_haiku_cost_calculation
✅ test_gpt4o_cost_calculation
✅ test_unknown_model_returns_zero
✅ test_zero_tokens_returns_zero
✅ test_large_token_counts
✅ test_cost_precision_six_decimals
✅ test_get_model_pricing
✅ test_is_model_supported
✅ test_list_supported_models
✅ test_custom_model_costs
✅ test_input_only_tokens
✅ test_output_only_tokens
✅ test_all_models_have_pricing
```

**Integration Tests:** ✅ 4/4 passed (~5s)
```
Test 1 - Basic Generation:
  Request: 24 input + 7 output = 31 total tokens
  Response: "Hello, world!"
  Cost: $0.000177 (verified correct)
  Duration: 1498ms

Test 2 - Longer Generation:
  Request: 32 input + 58 output = 90 total tokens
  Response: Emergency preparedness explanation
  Cost: $0.000966 (verified correct)

Test 3 - Different Models:
  Sonnet 3.5: 21 tokens, $0.000123
  Haiku: 21 tokens, $0.000010

Test 4 - Error Handling:
  Invalid API key → LLMProviderAuthError (correct)
```

**Key Architecture Decisions:**
1. **Pydantic Models** - Type safety with automatic validation and API documentation
2. **httpx AsyncClient** - Non-blocking I/O with persistent connections
3. **Cost Calculator Separation** - Single responsibility, easy pricing updates
4. **Provider Factory Pattern** - Easy addition of new providers (Anthropic, OpenAI)
5. **Custom Exception Hierarchy** - Enables intelligent retry logic and error handling
6. **6 Decimal Precision** - Matches database DECIMAL(10, 6) for cost_usd column

**API Request/Response Format:**

**Request:**
```json
POST https://openrouter.ai/api/v1/chat/completions
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [{"role": "user", "content": "Hello!"}],
  "temperature": 0.7,
  "max_tokens": 4000
}
```

**Response:**
```python
LLMResponse(
    content="Hello! How can I assist you today?",
    model="anthropic/claude-3.5-sonnet",
    usage=UsageInfo(input_tokens=23, output_tokens=12, total_tokens=35),
    cost_usd=0.000249,
    duration_ms=1250,
    provider="openrouter"
)
```

**Model Pricing (per 1M tokens):**
- Claude Sonnet 3.5: $3 input / $15 output
- Claude Opus 4: $15 input / $75 output
- Claude Haiku: $0.25 input / $1.25 output
- GPT-4o: $2.5 input / $10 output
- + 9 more models (Gemini, Llama, etc.)

**Performance Metrics:**
- API response time: ~1.5s for simple generation
- Unit tests execution: 0.28s
- Cost calculation overhead: <0.001ms
- Provider instantiation: <1ms

**Phase 2 Complete - Ready for Phase 3! 🎉**

---

### Phase 3: Workflow Engine Core
**Goal:** JSON workflow loading and step execution

**Tasks:**
- [ ] Define workflow JSON schema in `app/workflows/schema.py`
- [ ] Implement `WorkflowEngine` in `app/workflows/engine.py`
- [ ] Implement `WorkflowContext` for variable management
- [ ] Implement variable substitution (`${context.var}`, `${steps.step_id.output}`)
- [ ] Implement `executeLLMStep` with prompt template loading
- [ ] Implement prompt template loader (support `{{include:}}` directives)
- [ ] Test: Load workflow JSON, execute LLM step with mocked LLM

**Success Criteria:**
- ✅ Load workflow from JSON file without errors
- ✅ Execute LLM step with variable substitution working
- ✅ Prompt templates load with includes resolved
- ✅ Step outputs accessible in subsequent steps

---

### Phase 4: Transformation Library
**Goal:** Build 10 predefined transformation operations

**Tasks:**
- [ ] Implement `extract_fields` with JSONPath support
- [ ] Implement `filter` with condition evaluation
- [ ] Implement `map`, `join`, `sort`, `unique`
- [ ] Implement `regex_extract` with regex pattern matching
- [ ] Implement `markdown_to_json` (port from `emergency-contacts-generator.ts`)
- [ ] Implement `template`, `merge` operations
- [ ] Add transformation registry for dispatch
- [ ] Write unit tests for all 10 transformations

**Success Criteria:**
- ✅ All 10 transformations implemented
- ✅ Unit tests pass with 100% coverage
- ✅ `markdown_to_json` correctly parses emergency contacts response
- ✅ Error handling works (fail/continue/default modes)

---

### Phase 5: External API Integration
**Goal:** Google Places service with caching

**Tasks:**
- [ ] Implement `ExternalServiceRegistry` in `app/workflows/external_services.py`
- [ ] Implement `GooglePlacesService` with auth and error handling
- [ ] Add two-level caching (memory + database cache table)
- [ ] Implement rate limiter with Redis
- [ ] Add `executeExternalAPIStep` to workflow engine
- [ ] Test: Call Google Places API, verify caching works

**Success Criteria:**
- ✅ Google Places API returns results
- ✅ Cache hits work (memory and database)
- ✅ Rate limiting prevents excessive API calls
- ✅ Graceful error handling for API failures

---

### Phase 6: Workflow API & Celery Tasks
**Goal:** FastAPI endpoints and Celery task execution

**Tasks:**
- [ ] Implement `POST /api/v1/workflow` endpoint
- [ ] Implement `GET /api/v1/status/{job_id}` endpoint
- [ ] Implement `POST /api/v1/workflow/validate` (dry-run)
- [ ] Create Celery task `execute_workflow` in `app/tasks/workflows.py`
- [ ] Add progress tracking and step notifications
- [ ] Implement error propagation (fail/continue/retry modes)
- [ ] Test: Submit workflow via API, check status, verify Celery execution

**Success Criteria:**
- ✅ POST /workflow returns job_id immediately (< 100ms)
- ✅ GET /status returns current job state
- ✅ Celery task executes workflow end-to-end
- ✅ Job state persisted in `llm_workflow_jobs` table

---

### Phase 7: Webhook System
**Goal:** Webhook delivery with retry logic

**Tasks:**
- [ ] Implement `WebhookSender` in `app/services/webhook_sender.py`
- [ ] Add HMAC signature generation (sha256)
- [ ] Implement retry logic with exponential backoff (5s, 15s, 45s)
- [ ] Create Celery task `deliver_webhook` in `app/tasks/webhooks.py`
- [ ] Track attempts in `llm_webhook_attempts` table
- [ ] Test: Send webhooks, verify retries work, check HMAC

**Success Criteria:**
- ✅ Webhook delivered successfully on first attempt
- ✅ Retries triggered on failure with correct delays
- ✅ HMAC signature validates correctly
- ✅ Webhook attempts logged to database

---

### Phase 8: Emergency Contacts Migration
**Goal:** Convert existing workflow to JSON

**Tasks:**
- [ ] Copy `prompts/emergency-contacts/` from main app to `LLM_service/workflows/prompts/`
- [ ] Create `workflows/definitions/emergency_contacts.json`
- [ ] Map steps: fetch_google_places → extract_fields → generate_analysis → parse_response
- [ ] Test workflow end-to-end with real Google Places + OpenRouter
- [ ] Verify output matches `src/lib/ai/emergency-contacts-generator.ts`
- [ ] Verify costs calculated correctly

**Success Criteria:**
- ✅ Workflow JSON loads successfully
- ✅ Executes all steps without errors
- ✅ Output structure matches existing implementation
- ✅ Costs match existing usage-logger calculations

---

### Phase 9: CLI Tools
**Goal:** Build developer workflow management tools

**Tasks:**
- [ ] Create CLI entry point in `cli/__main__.py`
- [ ] Implement interactive workflow editor (`cli/editor.py`)
- [ ] Implement Mermaid diagram generator (`cli/diagram.py` - uses LLM)
- [ ] Implement workflow validator (`cli/validator.py`)
- [ ] Implement dry-run executor (`cli/dry_run.py`)
- [ ] Test: Edit workflow, generate diagram, validate, dry-run

**Success Criteria:**
- ✅ Can edit `emergency_contacts.json` interactively
- ✅ Mermaid diagram generated via LLM
- ✅ Validator catches errors (duplicate IDs, missing prompts)
- ✅ Dry-run shows execution plan without API calls

---

### Phase 10: Main App Integration
**Goal:** Connect Next.js app to microservice

**Tasks:**
- [ ] Create TypeScript client in `src/lib/llm-microservice-client.ts`
- [ ] Create webhook handler in `src/app/api/webhooks/llm/route.ts`
- [ ] Add HMAC verification in webhook handler
- [ ] Update `userActivityLog` when webhook receives cost data
- [ ] Test integration: Submit workflow, receive webhook
- [ ] Add environment variables to main app `.env.local`

**Success Criteria:**
- ✅ Main app can submit workflows
- ✅ Main app can check job status
- ✅ Webhook received and HMAC validated
- ✅ AI usage logged to `userActivityLog` table
- ✅ Costs match microservice calculation

---

### Phase 11: Mission Generation Migration
**Goal:** Convert mission generation workflow to JSON

**Tasks:**
- [ ] Copy `prompts/mission-generation/` to microservice
- [ ] Create `workflows/definitions/mission_generation.json`
- [ ] Implement streaming support in workflow engine
- [ ] Map steps: load_bundles → build_prompt → generate_streaming → parse_sections
- [ ] Test with real mission generation data
- [ ] Verify streaming chunks delivered via webhook

**Success Criteria:**
- ✅ Mission generation workflow executes successfully
- ✅ Streaming chunks delivered to webhook
- ✅ Output matches existing `mission-generator.ts`
- ✅ Bundle recommendations integrated correctly

---

### Phase 12: Testing & Documentation
**Goal:** Comprehensive tests and docs

**Tasks:**
- [ ] Write unit tests for transformations
- [ ] Write integration tests for workflow engine
- [ ] Test emergency contacts + mission generation end-to-end
- [ ] Create `README.md` - Service implementation guide
- [ ] Create `API_GUIDE.md` - Integration guide
- [ ] Add Node.js client examples
- [ ] Document workflow JSON schema

**Success Criteria:**
- ✅ All unit tests pass
- ✅ Integration tests pass
- ✅ Documentation complete and clear
- ✅ Node.js examples work

---

### Phase 13: Production Deployment
**Goal:** Deploy to Render

**Tasks:**
- [ ] Create production `settings.production.ini`
- [ ] Create `render.yaml` deployment config
- [ ] Configure Supabase connection pooling
- [ ] Deploy: API service + Worker service + Managed Redis
- [ ] Set up Flower monitoring
- [ ] Test production deployment end-to-end

**Success Criteria:**
- ✅ Service deployed and accessible
- ✅ Celery workers processing jobs
- ✅ Webhooks delivering to production app
- ✅ Monitoring dashboards active
- ✅ No errors in logs

---

## 12. Task Completion Tracking

### Phase 1: Core Infrastructure
- [ ] Create `LLM_service/` directory ⏳
- [ ] Install dependencies ⏳
- [ ] Implement config loader ⏳
- [ ] Implement database connection ⏳
- [ ] Create migration scripts ⏳
- [ ] Implement Celery setup ⏳
- [ ] Create docker-compose.yml ⏳
- [ ] Implement FastAPI app ⏳
- [ ] Test containers start ⏳

### Phase 2: LLM Provider Abstraction
- [ ] Define LLMProvider interface ⏳
- [ ] Implement OpenRouterProvider ⏳
- [ ] Implement cost calculator ⏳
- [ ] Add provider factory ⏳
- [ ] Test OpenRouter calls ⏳

### Phase 3: Workflow Engine Core
- [ ] Define workflow schema ⏳
- [ ] Implement WorkflowEngine ⏳
- [ ] Implement WorkflowContext ⏳
- [ ] Implement variable substitution ⏳
- [ ] Implement executeLLMStep ⏳
- [ ] Implement prompt loader ⏳
- [ ] Test workflow execution ⏳

### Phase 4: Transformation Library
- [ ] Implement extract_fields ⏳
- [ ] Implement filter ⏳
- [ ] Implement map, join, sort, unique ⏳
- [ ] Implement regex_extract ⏳
- [ ] Implement markdown_to_json ⏳
- [ ] Implement template, merge ⏳
- [ ] Write unit tests ⏳

### Phase 5: External API Integration
- [ ] Implement ExternalServiceRegistry ⏳
- [ ] Implement GooglePlacesService ⏳
- [ ] Add caching ⏳
- [ ] Implement rate limiter ⏳
- [ ] Add executeExternalAPIStep ⏳
- [ ] Test Google Places ⏳

### Phase 6: Workflow API & Celery Tasks
- [ ] Implement POST /workflow ⏳
- [ ] Implement GET /status ⏳
- [ ] Implement POST /validate ⏳
- [ ] Create execute_workflow task ⏳
- [ ] Add progress tracking ⏳
- [ ] Test API + Celery ⏳

### Phase 7: Webhook System
- [ ] Implement WebhookSender ⏳
- [ ] Add HMAC signatures ⏳
- [ ] Implement retry logic ⏳
- [ ] Create deliver_webhook task ⏳
- [ ] Track attempts ⏳
- [ ] Test webhooks ⏳

### Phase 8: Emergency Contacts Migration
- [ ] Copy prompts ⏳
- [ ] Create workflow JSON ⏳
- [ ] Map steps ⏳
- [ ] Test end-to-end ⏳
- [ ] Verify output ⏳
- [ ] Verify costs ⏳

### Phase 9: CLI Tools
- [ ] Create CLI entry point ⏳
- [ ] Implement editor ⏳
- [ ] Implement diagram generator ⏳
- [ ] Implement validator ⏳
- [ ] Implement dry-run ⏳
- [ ] Test CLI tools ⏳

### Phase 10: Main App Integration
- [ ] Create TS client ⏳
- [ ] Create webhook handler ⏳
- [ ] Add HMAC verification ⏳
- [ ] Update userActivityLog ⏳
- [ ] Test integration ⏳
- [ ] Add env vars ⏳

### Phase 11: Mission Generation Migration
- [ ] Copy prompts ⏳
- [ ] Create workflow JSON ⏳
- [ ] Implement streaming ⏳
- [ ] Map steps ⏳
- [ ] Test mission generation ⏳
- [ ] Verify streaming ⏳

### Phase 12: Testing & Documentation
- [ ] Write unit tests ⏳
- [ ] Write integration tests ⏳
- [ ] Test workflows ⏳
- [ ] Create README ⏳
- [ ] Create API_GUIDE ⏳
- [ ] Add examples ⏳
- [ ] Document schema ⏳

### Phase 13: Production Deployment
- [ ] Create production config ⏳
- [ ] Create render.yaml ⏳
- [ ] Configure Supabase ⏳
- [ ] Deploy services ⏳
- [ ] Set up Flower ⏳
- [ ] Test production ⏳

---

## 13. File Structure & Organization

### New Project Structure

```
LLM_service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI entry point
│   ├── celery_app.py              # Celery configuration
│   ├── config.py                  # Settings loader
│   ├── database.py                # SQLAlchemy setup
│   ├── dependencies.py            # FastAPI dependencies
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── workflow.py        # POST /workflow, POST /validate
│   │       ├── status.py          # GET /status/{job_id}
│   │       ├── admin.py           # Admin endpoints
│   │       └── health.py          # GET /health
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── workflow_job.py        # SQLAlchemy models
│   │   ├── webhook_attempt.py
│   │   └── provider_usage.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── workflow.py            # Pydantic request/response
│   │   ├── status.py
│   │   └── webhook.py
│   │
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── workflows.py           # Celery: execute_workflow
│   │   ├── webhooks.py            # Celery: deliver_webhook
│   │   └── cleanup.py             # Celery beat: cleanup_stale_jobs
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── llm_provider.py        # LLM provider interface
│   │   ├── openrouter.py          # OpenRouter implementation
│   │   ├── anthropic_client.py    # Anthropic implementation
│   │   ├── cost_calculator.py     # Cost calculation
│   │   ├── rate_limiter.py        # Per-user rate limiting
│   │   └── webhook_sender.py      # Webhook delivery
│   │
│   ├── workflows/
│   │   ├── __init__.py
│   │   ├── engine.py              # Core workflow engine
│   │   ├── transformations.py     # Transformation library
│   │   ├── loader.py              # Workflow JSON loader
│   │   ├── context.py             # WorkflowContext
│   │   ├── prompt_loader.py       # Markdown template loader
│   │   └── external_services.py   # Google Places, etc.
│   │
│   └── utils/
│       ├── __init__.py
│       ├── logging.py             # Structured logging
│       ├── security.py            # API key, HMAC
│       └── metrics.py             # Prometheus metrics
│
├── workflows/
│   ├── definitions/
│   │   ├── emergency_contacts.json
│   │   └── mission_generation.json
│   └── prompts/                   # Copied from main app
│       ├── emergency-contacts/
│       └── mission-generation/
│
├── cli/
│   ├── __init__.py
│   ├── __main__.py                # CLI entry point
│   ├── editor.py                  # Interactive editor
│   ├── diagram.py                 # Mermaid generator
│   ├── validator.py               # Workflow validator
│   └── dry_run.py                 # Dry-run executor
│
├── tests/
│   ├── __init__.py
│   ├── test_transformations.py
│   ├── test_workflow_engine.py
│   ├── test_llm_provider.py
│   ├── test_api.py
│   └── test_emergency_contacts.py
│
├── migrations/
│   ├── 001_create_llm_tables.sql
│   └── 001_create_llm_tables_down.sql
│
├── docker-compose.yml
├── Dockerfile
├── render.yaml
├── requirements.txt
├── settings.ini
├── settings.development.ini
├── settings.production.ini
├── README.md
├── API_GUIDE.md
└── .gitignore
```

---

## 14. Potential Issues & Security Review

### Error Scenarios to Analyze

**Error Scenario 1: Webhook Delivery Failure**
- **What could go wrong:** Main app temporarily down during deployment, webhook never delivered
- **Code Review Focus:** `app/services/webhook_sender.py` - verify retry logic, check `llm_webhook_attempts` tracking
- **Potential Fix:** Implement dead letter queue with manual replay option in admin UI

**Error Scenario 2: LLM Provider Timeout**
- **What could go wrong:** OpenRouter takes >120s, Celery task times out
- **Code Review Focus:** `app/services/openrouter.py` - check timeout config, verify task_time_limit in Celery
- **Potential Fix:** Increase Celery `task_time_limit` to 600s (10 minutes), add timeout to httpx client

**Error Scenario 3: Database Connection Exhaustion**
- **What could go wrong:** Too many Celery workers, connection pool exhausted
- **Code Review Focus:** `app/database.py` - verify SQLAlchemy pool_size matches worker count
- **Potential Fix:** Set `pool_size=10, max_overflow=20` in SQLAlchemy engine

**Error Scenario 4: Stale Jobs Accumulate**
- **What could go wrong:** Workers crash, jobs stuck in "processing" state forever
- **Code Review Focus:** `app/tasks/cleanup.py` - verify stale detection logic (72 hours default)
- **Potential Fix:** Add Celery beat schedule to run cleanup every 24 hours

### Edge Cases to Consider

**Edge Case 1: Workflow JSON with Circular Step References**
- **Analysis Approach:** Check `app/workflows/engine.py` variable resolution
- **Recommendation:** Add cycle detection in `WorkflowEngine.executeWorkflow()`

**Edge Case 2: Webhook URL Returns 200 but Invalid Response**
- **Analysis Approach:** Check `app/services/webhook_sender.py` response validation
- **Recommendation:** Log warning but mark delivery as successful (caller's responsibility)

**Edge Case 3: User Deletes Profile While Job Running**
- **Analysis Approach:** Check `llm_workflow_jobs.user_id ON DELETE CASCADE`
- **Recommendation:** Already handled by CASCADE, job deleted automatically

### Security & Access Control Review

**Admin Access Control:**
- [ ] **Check:** `POST /api/v1/admin/cleanup/stale` requires admin API key
- [ ] **Implementation:** Separate `ADMIN_API_KEY` environment variable, validate in FastAPI dependency

**Authentication State:**
- [ ] **Check:** Main app authenticates via `X-API-Key` header
- [ ] **Implementation:** FastAPI dependency checks header against `LLM_MICROSERVICE_API_KEY`

**Form Input Validation:**
- [ ] **Check:** All API inputs validated via Pydantic schemas
- [ ] **Implementation:** Strict Pydantic models in `app/schemas/workflow.py`

**Permission Boundaries:**
- [ ] **Check:** Users can only access their own job status
- [ ] **Implementation:** Filter by `user_id` in GET /status endpoint (if user_id provided)

**Webhook Security:**
- [ ] **Check:** HMAC signature prevents webhook spoofing
- [ ] **Implementation:** sha256 HMAC with shared secret, validate in main app webhook handler

**Rate Limiting:**
- [ ] **Check:** Per-user rate limits configurable
- [ ] **Implementation:** Redis-based rate limiter in `app/services/rate_limiter.py`

---

## 15. Deployment & Configuration

### Environment Variables

**Required for Local Development:**
```bash
# Supabase (shared with main app)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis (Docker container)
REDIS_URL=redis://localhost:6379

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# Google Places (for workflows)
GOOGLE_PLACES_API_KEY=AIza...

# Security
LLM_MICROSERVICE_API_KEY=your-secret-key-here
ADMIN_API_KEY=your-admin-key-here
LLM_WEBHOOK_SECRET=shared-secret-with-main-app
```

**Required for Render Production:**
```bash
# Same as above, plus:
ENVIRONMENT=production
PORT=8000  # Render provides this
```

### Render Deployment Configuration

**render.yaml:**
```yaml
services:
  # FastAPI API Server
  - type: web
    name: llm-api
    env: docker
    dockerfilePath: ./Dockerfile
    dockerCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        fromService:
          name: llm-redis
          type: redis
          property: connectionString
      - key: OPENROUTER_API_KEY
        sync: false
      - key: LLM_MICROSERVICE_API_KEY
        sync: false

  # Celery Worker
  - type: worker
    name: llm-worker
    env: docker
    dockerfilePath: ./Dockerfile
    dockerCommand: celery -A app.celery_app worker --loglevel=info --concurrency=4
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        fromService:
          name: llm-redis
          type: redis
          property: connectionString

  # Celery Beat (Scheduled Tasks)
  - type: worker
    name: llm-beat
    env: docker
    dockerfilePath: ./Dockerfile
    dockerCommand: celery -A app.celery_app beat --loglevel=info
    envVars:
      - key: REDIS_URL
        fromService:
          name: llm-redis
          type: redis
          property: connectionString

  # Celery Flower (Monitoring)
  - type: web
    name: llm-flower
    env: docker
    dockerfilePath: ./Dockerfile
    dockerCommand: celery -A app.celery_app flower --port=$PORT
    envVars:
      - key: REDIS_URL
        fromService:
          name: llm-redis
          type: redis
          property: connectionString

  # Managed Redis
  - type: redis
    name: llm-redis
    plan: starter  # ~$7/month
    ipAllowList: []
```

---

## 16. AI Agent Instructions

### Communication Preferences
- [ ] Ask for clarification if workflow design unclear
- [ ] Provide progress updates after each phase
- [ ] Flag any blockers immediately (missing API keys, Supabase access, etc.)
- [ ] Suggest improvements (e.g., additional transformations, better error handling)

### Implementation Approach

**Phase-by-Phase Execution:**
1. **Complete Phase 1-4 first** (Core + LLM + Workflows + Transformations)
2. **Test infrastructure** before moving to Phase 5+
3. **Validate each phase** with real API calls (not mocks)
4. **Document as you go** - Update README.md continuously

**Code Quality Standards:**
- [ ] Follow Python PEP 8 style guide
- [ ] Add proper error handling (try/except with logging)
- [ ] Write professional docstrings (not historical comments)
- [ ] Use type hints for all function parameters and returns
- [ ] Use async/await consistently (FastAPI is async)
- [ ] Create down migrations for all database changes

**Testing Strategy:**
- [ ] Unit tests for transformation library (100% coverage)
- [ ] Integration tests for workflow engine
- [ ] End-to-end test with emergency contacts workflow
- [ ] Real LLM calls (no mocks) - verify token counts and costs
- [ ] Test webhook delivery with retry scenarios

---

## 17. Notes & Additional Context

### Research Links
- **Celery Documentation:** https://docs.celeryq.dev/
- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **SQLAlchemy Documentation:** https://docs.sqlalchemy.org/
- **OpenRouter API:** https://openrouter.ai/docs
- **Render Docker Deployment:** https://render.com/docs/docker

### Reference Implementations
- **Existing emergency contacts:** `src/lib/ai/emergency-contacts-generator.ts`
- **Existing mission generation:** `src/lib/ai/mission-generator.ts`
- **Existing usage logger:** `src/lib/ai/usage-logger.ts`
- **Existing cost calculator:** `src/lib/ai/model-config.ts`

---

## 18. Second-Order Consequences & Impact Analysis

### Impact Assessment Framework

#### 1. **Breaking Changes Analysis**
- [ ] **Existing API Contracts:** No breaking changes (new service, not modifying existing endpoints)
- [ ] **Database Dependencies:** New tables only, no modifications to existing schema
- [ ] **Component Dependencies:** No frontend components affected until Phase 10 (optional integration)
- [ ] **Authentication/Authorization:** Main app continues to work independently

#### 2. **Ripple Effects Assessment**
- [ ] **Data Flow Impact:** Main app can optionally call microservice, existing sync code unaffected
- [ ] **UI/UX Cascading Effects:** No UI changes until Phase 10 (optional migration)
- [ ] **State Management:** No changes to main app state management
- [ ] **Routing Dependencies:** No route changes in main app

#### 3. **Performance Implications**
- [ ] **Database Query Impact:** New tables increase database size, but separate indexes prevent impact on main app queries
- [ ] **Bundle Size:** No impact (backend service only)
- [ ] **Server Load:** **Reduced load on main app** - AI processing offloaded to separate service
- [ ] **Caching Strategy:** New cache tables for external API calls (Google Places)

#### 4. **Security Considerations**
- [ ] **Attack Surface:** New API surface, but authenticated via API key and rate-limited
- [ ] **Data Exposure:** Job data stored in database, sensitive data (API keys) in environment variables only
- [ ] **Permission Escalation:** No access to main app authentication, users authenticated by main app before calling microservice
- [ ] **Input Validation:** Pydantic schemas validate all inputs, prevent injection attacks

#### 5. **User Experience Impacts**
- [ ] **Workflow Disruption:** No disruption - parallel operation, gradual migration
- [ ] **Data Migration:** No user data migration required
- [ ] **Feature Deprecation:** No existing features removed
- [ ] **Learning Curve:** No user-facing changes (backend only)

#### 6. **Maintenance Burden**
- [ ] **Code Complexity:** New Python codebase adds maintenance burden, but clear separation of concerns
- [ ] **Dependencies:** Python dependencies managed separately from Node.js app
- [ ] **Testing Overhead:** New test suite required, but isolated from main app tests
- [ ] **Documentation:** Comprehensive README and API guide required

### Critical Issues Identification

#### 🚨 **RED FLAGS - Alert User Immediately**
- [ ] **Database Migration Required:** New tables in production database (but no existing data affected)
- [ ] **Breaking API Changes:** None - new service doesn't modify existing APIs
- [ ] **Performance Degradation:** None expected - offloads work from main app
- [ ] **Security Vulnerabilities:** API key authentication required, HMAC webhook signatures required
- [ ] **User Data Loss:** No risk - new tables only, no modifications to existing data

#### ⚠️ **YELLOW FLAGS - Discuss with User**
- [ ] **Increased Complexity:** New service adds operational complexity (Docker, Celery, Redis)
- [ ] **New Dependencies:** Python ecosystem, Redis, Celery, SQLAlchemy
- [ ] **UI/UX Changes:** No immediate changes, but future migration may change AI response times
- [ ] **Maintenance Overhead:** New codebase requires Python expertise

### Mitigation Strategies

#### Database Changes
- [ ] **Backup Strategy:** No backup needed for new tables (no existing data)
- [ ] **Rollback Plan:** Down migration drops tables cleanly
- [ ] **Staging Testing:** Test all migrations in development Supabase first
- [ ] **Gradual Migration:** Parallel operation allows fallback to sync code if needed

#### API Changes
- [ ] **Versioning Strategy:** API versioned at `/api/v1` for future compatibility
- [ ] **Deprecation Timeline:** No deprecation - new service is additive
- [ ] **Client Communication:** Main app is only client, no external API consumers
- [ ] **Graceful Degradation:** Main app can fallback to sync code if microservice unavailable

#### UI/UX Changes
- [ ] **Feature Flags:** Main app controls which workflows use microservice (gradual migration)
- [ ] **User Communication:** No user-facing changes initially
- [ ] **Help Documentation:** No help docs needed (backend service)
- [ ] **Feedback Collection:** Monitor error rates and job success rates

### AI Agent Checklist

Before presenting implementation, the AI agent must:
- [ ] **Complete Impact Analysis:** All sections above filled out
- [ ] **Identify Critical Issues:** No red flags identified (new service is additive)
- [ ] **Propose Mitigation:** Database down migrations created, API versioning implemented
- [ ] **Alert User:** No critical impacts requiring user approval
- [ ] **Recommend Alternatives:** Option B (Python microservice) is recommended after analysis

---

## Summary

This task creates a production-ready Python microservice for asynchronous AI workflow processing. The service uses industry-standard tools (FastAPI, Celery, Redis) and integrates seamlessly with the existing Next.js app via webhooks. The phased implementation plan ensures systematic progress with testing at each stage. The service architecture supports concurrent processing, webhook notifications, and flexible JSON-based workflow definitions, eliminating timeout issues and enabling scalable AI operations.

**Key Benefits:**
- ✅ Eliminates timeout issues (async processing)
- ✅ Enables concurrent AI requests
- ✅ Webhook-driven (no polling)
- ✅ Database-backed queue (survives restarts)
- ✅ JSON workflows (no code changes for new workflows)
- ✅ Comprehensive monitoring (Celery Flower)
- ✅ Independent scaling (add workers without main app changes)
