# LLM Workflow Microservice

**Production-ready Python microservice for asynchronous AI workflow processing with comprehensive error handling, external API integration, and webhook notifications.**

[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green.svg)](https://fastapi.tiangolo.com/)
[![Celery](https://img.shields.io/badge/Celery-5.3.6-brightgreen.svg)](https://docs.celeryproject.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [Architecture](#architecture)
- [Workflow System](#workflow-system)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Monitoring](#monitoring)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The LLM Workflow Microservice is a production-grade AI workflow orchestration system that executes multi-step AI operations with external API integration, intelligent caching, rate limiting, and comprehensive error handling.

### Key Capabilities

- **Multi-Step Workflows**: Chain LLM calls, external APIs, and data transformations
- **External API Integration**: WeatherAPI, Google Places, and custom service integrations
- **Intelligent Caching**: Redis-backed caching with configurable TTLs
- **Rate Limiting**: Per-service rate limiting with exponential backoff
- **Error Handling**: Structured error context with retry logic and suggestions
- **Webhook Notifications**: HMAC-signed webhook delivery with retry logic
- **Real-time Monitoring**: Flower dashboard for task monitoring
- **Production-Ready**: Docker deployment with health checks and graceful shutdown

---

## Features

### ✅ Implemented (Phases 1-9)

- **Phase 1**: Core Infrastructure (FastAPI, Celery, Redis, PostgreSQL)
- **Phase 2**: LLM Provider Abstraction (OpenRouter, Anthropic, OpenAI)
- **Phase 3**: Workflow Engine Core (JSON workflow loading and execution)
- **Phase 4**: Transformation Library (10+ predefined transformations)
- **Phase 5**: External API Integration (WeatherAPI, Google Places)
- **Phase 6**: Workflow API & Celery Tasks
- **Phase 7**: Webhook System (HMAC signatures, retry logic)
- **Phase 8**: Error Handling (Structured errors, retryability, sanitization)
- **Phase 9**: Cache Management (Redis caching, TTL management)

### 🚧 Planned (Phase 10+)

- **Phase 10**: Next.js Integration (API client, type generation)
- **Phase 11**: Monitoring & Observability (Prometheus, Grafana)
- **Phase 12**: Advanced Features (Multi-model support, streaming responses)

---

## Quick Start

### Prerequisites

- **Python 3.12+**
- **Docker & Docker Compose** (for containerized deployment)
- **PostgreSQL** (Supabase or self-hosted)
- **Redis** (included in Docker setup)

### Environment Variables

Create `.env.local` with the following required variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# LLM Providers
OPENROUTER_API_KEY=sk-or-v1-...

# External APIs
WEATHERAPI_API_KEY=your-weatherapi-key
GOOGLE_SERVICES_API_KEY=your-google-api-key

# Webhooks (optional)
LLM_WEBHOOK_SECRET=your-secret-key-change-in-production

# Redis (auto-configured in Docker)
REDIS_URL=redis://redis:6379
```

### Local Development Setup

```bash
# 1. Clone repository
cd LLM_service

# 2. Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations
psql $DATABASE_URL < migrations/001_create_llm_tables.sql
psql $DATABASE_URL < migrations/002_create_external_api_cache.sql
psql $DATABASE_URL < migrations/003_add_webhook_fields.sql

# 5. Start services with Docker Compose
docker-compose up --build
```

### Docker Services

| Service | URL | Description |
|---------|-----|-------------|
| **API** | http://localhost:8000 | FastAPI REST API |
| **API Docs** | http://localhost:8000/docs | Interactive API documentation |
| **Flower** | http://localhost:5555 | Celery task monitoring |
| **Redis** | localhost:6379 | Message broker & cache |

### Health Check

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "healthy",
      "type": "postgresql"
    },
    "redis": {
      "status": "healthy"
    },
    "celery": {
      "status": "healthy",
      "workers": 1
    }
  },
  "timestamp": "2025-12-17T04:30:00Z"
}
```

---

## Production Deployment

### Deploying to Render

#### Prerequisites
- **Render account** (https://render.com)
- **PostgreSQL database** (Render PostgreSQL or Supabase)
- **Docker Hub account** (optional, for custom images)

#### Step 1: Build and Push Docker Image (Optional)

If using a custom Docker image:

```bash
# Build image
docker build -t yourusername/llm-service:latest .

# Push to Docker Hub
docker push yourusername/llm-service:latest
```

#### Step 2: Create Render Services

**2.1 Create PostgreSQL Database (if not using Supabase)**

1. Go to Render Dashboard → New → PostgreSQL
2. Name: `llm-service-db`
3. Region: Choose closest to your users
4. Plan: Select based on needs (Starter for testing)
5. Note the **Internal Database URL** for environment variables

**2.2 Create Redis Instance**

1. Go to Render Dashboard → New → Redis
2. Name: `llm-service-redis`
3. Region: Same as your database
4. Plan: Select based on needs
5. Note the **Internal Redis URL** for environment variables

**2.3 Create Web Service (API)**

1. Go to Render Dashboard → New → Web Service
2. Connect your Git repository or use Docker image
3. Configuration:
   - **Name**: `llm-service-api`
   - **Region**: Same as database/Redis
   - **Branch**: `main`
   - **Root Directory**: `LLM_service`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile`
   - **Docker Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Select based on needs (Starter for testing)

4. **Environment Variables**:
   ```bash
   DATABASE_URL=<from step 2.1 or Supabase>
   REDIS_URL=<from step 2.2>
   OPENROUTER_API_KEY=<your-openrouter-key>
   WEATHERAPI_API_KEY=<your-weatherapi-key>
   GOOGLE_SERVICES_API_KEY=<your-google-key>
   LLM_WEBHOOK_SECRET=<generate-random-secret>
   ENVIRONMENT=production
   PORT=10000
   ```

5. **Health Check Path**: `/health`

**2.4 Create Background Worker (Celery)**

1. Go to Render Dashboard → New → Background Worker
2. Same repository and configuration as Web Service
3. Configuration:
   - **Name**: `llm-service-worker`
   - **Start Command**: `celery -A app.celery_app worker --loglevel=info --pool=eventlet --concurrency=10 --events`
   - **Same environment variables** as Web Service

**2.5 Create Monitoring Service (Flower - Optional)**

1. Go to Render Dashboard → New → Web Service
2. Configuration:
   - **Name**: `llm-service-flower`
   - **Start Command**: `celery -A app.celery_app flower --port=$PORT`
   - **Plan**: Free tier sufficient
   - **Same environment variables** as Web Service

#### Step 3: Run Database Migrations

After services are deployed, run migrations via Render Shell:

1. Go to `llm-service-api` → Shell
2. Run migrations:
   ```bash
   psql $DATABASE_URL < migrations/001_create_llm_tables.sql
   psql $DATABASE_URL < migrations/002_create_external_api_cache.sql
   psql $DATABASE_URL < migrations/003_add_webhook_fields.sql
   ```

#### Step 4: Verify Deployment

```bash
# Test health endpoint
curl https://llm-service-api.onrender.com/health

# Test workflow execution
curl -X POST https://llm-service-api.onrender.com/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "emergency_contacts",
    "input_data": {
      "city": "San Francisco",
      "state": "CA",
      "lat": 37.7749,
      "lng": -122.4194,
      "scenarios": ["earthquake"],
      "family_size": 4,
      "duration": "72_hours",
      "user_tier": "BASIC",
      "static_contacts": ""
    }
  }'
```

### IPv6 Connectivity Issues (Render/Railway)

Some hosting platforms don't support IPv6 outbound connections to Supabase. If you see `ENETUNREACH` errors:

```bash
# Run the IPv4 resolution script
DATABASE_URL="your-connection-string" node scripts/resolve-db-ipv4.js

# Copy the outputted IPv4 connection string
# Set it as DATABASE_URL in your hosting platform's environment variables
```

**Note**: The IP address may change over time. Re-run if connection fails.

### Environment-Specific Configuration

#### Production Settings

```bash
ENVIRONMENT=production
DEBUG_MODE=false
LOG_LEVEL=info
CELERY_TASK_ALWAYS_EAGER=false
WEBHOOK_TIMEOUT=30
CACHE_DEFAULT_TTL=3600
```

#### Development Settings

```bash
ENVIRONMENT=development
DEBUG_MODE=true
LOG_LEVEL=debug
CELERY_TASK_ALWAYS_EAGER=false
```

#### Testing Settings

```bash
ENVIRONMENT=test
DEBUG_MODE=true
CELERY_TASK_ALWAYS_EAGER=true
DATABASE_URL=postgresql://localhost/test_db
```

---

## Architecture

### System Diagram

```
┌─────────────────┐
│   Next.js App   │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐      ┌──────────────┐
│   FastAPI API   │─────▶│  PostgreSQL  │
└────────┬────────┘      └──────────────┘
         │ Celery
         ▼
┌─────────────────┐      ┌──────────────┐
│  Celery Worker  │─────▶│    Redis     │
└────────┬────────┘      └──────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│  External APIs  │  │   Webhooks   │
│  - WeatherAPI   │  │  (HMAC Auth) │
│  - Google Places│  └──────────────┘
│  - OpenRouter   │
└─────────────────┘
```

### Component Overview

#### 1. FastAPI API (`app/main.py`)
- REST API for workflow submission and job management
- Request validation with Pydantic
- Health checks and monitoring endpoints
- CORS configuration for Next.js integration

#### 2. Celery Worker (`app/celery_app.py`)
- Asynchronous workflow execution
- Eventlet pool for async operations (10 concurrent tasks)
- Graceful shutdown handling
- Task result backend via Redis

#### 3. Workflow Engine (`app/workflows/engine.py`)
- Multi-step workflow orchestration
- Context management and variable resolution
- Error handling with continue/fail modes
- Step execution tracking and metadata collection

#### 4. External Services (`app/workflows/services/`)
- **WeatherAPI**: Current weather conditions
- **Google Places**: Nearby search for emergency services
- **OpenRouter**: LLM provider abstraction (Claude, GPT, etc.)

#### 5. Cache Manager (`app/workflows/cache_manager.py`)
- Redis-backed caching with configurable TTLs
- Automatic cache invalidation
- Cache statistics and monitoring

#### 6. Rate Limiter (`app/workflows/rate_limiter.py`)
- Per-service rate limiting
- Token bucket algorithm
- Exponential backoff on rate limit errors

#### 7. Webhook System (`app/services/webhook_sender.py`)
- HMAC SHA-256 signature generation
- Retry logic with exponential backoff
- Webhook delivery tracking

---

## Workflow System

### What is a Workflow?

A workflow is a JSON-defined sequence of steps that orchestrate:
- **LLM API calls** (OpenRouter, Anthropic, OpenAI)
- **External API calls** (WeatherAPI, Google Places, custom)
- **Data transformations** (templates, JSON parsing, formatting)

### Workflow File Structure

```
workflows/
├── definitions/           # Workflow JSON definitions
│   ├── emergency_contacts.json
│   └── emergency_contacts_README.md
├── prompts/              # Prompt templates
│   ├── emergency-contacts/
│   │   ├── workflow-prompt.md
│   │   ├── output-format.md
│   │   ├── system-prompt.md
│   │   └── scenario-specific/
│   └── shared/
│       ├── safety-disclaimers.md
│       └── tone-and-voice.md
```

### Creating a Workflow

See [WORKFLOW_DESIGN.md](WORKFLOW_DESIGN.md) for design principles and [WORKFLOW_SCHEMA.md](WORKFLOW_SCHEMA.md) for JSON schema documentation.

**Quick Example:**

```json
{
  "name": "my_workflow",
  "version": "1.0.0",
  "description": "My custom workflow",
  "steps": [
    {
      "id": "fetch_data",
      "type": "external_api",
      "config": {
        "service": "weatherapi",
        "operation": "current",
        "config": {"lat": "${input.lat}", "lng": "${input.lng}"}
      }
    },
    {
      "id": "generate_response",
      "type": "llm",
      "config": {
        "model": "anthropic/claude-3.5-sonnet",
        "prompt_template": "my-workflow/prompt.md",
        "variables": {"weather": "${steps.fetch_data.data}"}
      }
    }
  ],
  "timeout_seconds": 120
}
```

---

## API Reference

### REST Endpoints

#### POST `/api/v1/jobs`

Submit a new workflow job for async execution.

**Request:**
```json
{
  "workflow_name": "emergency_contacts",
  "input_data": {
    "city": "San Francisco",
    "state": "CA",
    "lat": 37.7749,
    "lng": -122.4194
  },
  "webhook_url": "https://your-app.com/webhooks/llm",
  "webhook_secret": "optional-custom-secret"
}
```

**Response (202 Accepted):**
```json
{
  "job_id": "83134e38-36ec-4e71-977d-2540d54d98c6",
  "status": "queued",
  "workflow_name": "emergency_contacts",
  "created_at": "2025-12-17T04:30:00Z"
}
```

#### GET `/api/v1/jobs/{job_id}`

Get job status and results.

**Response (200 OK):**
```json
{
  "job_id": "83134e38-36ec-4e71-977d-2540d54d98c6",
  "status": "completed",
  "workflow_name": "emergency_contacts",
  "output": {
    "contacts": [...],
    "meeting_locations": [...]
  },
  "metadata": {
    "duration_ms": 14523,
    "total_tokens": 3842,
    "total_cost_usd": 0.023
  },
  "created_at": "2025-12-17T04:30:00Z",
  "completed_at": "2025-12-17T04:30:15Z"
}
```

#### GET `/health`

System health check.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "services": {
    "database": {"status": "healthy"},
    "redis": {"status": "healthy"},
    "celery": {"status": "healthy", "workers": 1}
  }
}
```

### Webhook Payloads

Webhooks are sent via POST with HMAC SHA-256 signatures.

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...
X-Webhook-Event: workflow.completed | workflow.failed
User-Agent: LLM-Workflow-Service/1.0.0
```

**Payload (Success):**
```json
{
  "event": "workflow.completed",
  "job_id": "83134e38-36ec-4e71-977d-2540d54d98c6",
  "status": "completed",
  "workflow_name": "emergency_contacts",
  "output": {...},
  "metadata": {...}
}
```

**Payload (Failure):**
```json
{
  "event": "workflow.failed",
  "job_id": "83134e38-36ec-4e71-977d-2540d54d98c6",
  "status": "failed",
  "workflow_name": "emergency_contacts",
  "error": {
    "type": "TimeoutError",
    "category": "EXTERNAL_ERROR",
    "message": "API request timed out",
    "retryable": true,
    "retry_after": 30,
    "details": {
      "service": "weatherapi",
      "suggestions": ["Retry after 30s", "Check service status"]
    }
  }
}
```

---

## Error Handling

### Error Categories

The system classifies all errors into four categories:

| Category | Description | Retryable | Examples |
|----------|-------------|-----------|----------|
| `USER_ERROR` | Invalid user input | ❌ No | Invalid coordinates, missing fields |
| `CONFIG_ERROR` | Configuration issues | ❌ No | Missing API keys, invalid settings |
| `SYSTEM_ERROR` | Internal system errors | ❌ No | Event loop closed, memory errors |
| `EXTERNAL_ERROR` | External service failures | ✅ Yes | API timeouts, rate limits, network errors |

### Error Context Structure

All errors include comprehensive context for debugging:

```typescript
interface ErrorContext {
  type: string;              // Error type (e.g., "TimeoutError")
  category: ErrorCategory;   // Error classification
  message: string;           // Human-readable message
  retryable: boolean;        // Whether retry is recommended
  retry_after?: number;      // Seconds to wait before retry
  step_id?: string;          // Workflow step that failed
  details?: {
    service?: string;        // External service name
    operation?: string;      // API operation
    inputs?: object;         // Sanitized input parameters
    config?: object;         // Sanitized configuration
    suggestions?: string[];  // Actionable debugging suggestions
  }
}
```

### Retryability Detection

The system automatically determines if errors are retryable:

```python
# Retryable: Timeout errors, rate limits, server errors (5xx)
is_retryable_error(TimeoutError())  # True
is_retryable_error(RateLimitExceeded())  # True

# Not retryable: Auth failures, validation errors, bad requests
is_retryable_error(ValueError())  # False
is_retryable_error(AuthenticationError())  # False
```

### Sensitive Data Sanitization

All error contexts automatically sanitize sensitive data:

- **API keys** → `[REDACTED]`
- **Tokens** → `[REDACTED]`
- **Passwords** → `[REDACTED]`
- **Long values** → Truncated to 200 characters

Fields named `auth`, `secret`, `key`, `password`, etc. are completely redacted for security.

---

## Monitoring

### Flower Dashboard

Access real-time task monitoring at http://localhost:5555 (or your deployed Flower URL).

**Features:**
- Active tasks and workers
- Task success/failure rates
- Task execution times
- Worker resource usage
- Task retry history

### Logs

```bash
# View API logs
docker logs llm-api -f

# View worker logs
docker logs llm-worker -f

# View Redis logs
docker logs llm-redis -f
```

### Database Queries

```sql
-- Recent jobs
SELECT job_id, status, workflow_name, created_at, completed_at
FROM workflow_jobs
ORDER BY created_at DESC
LIMIT 10;

-- Failed jobs with errors
SELECT job_id, workflow_name, error_message
FROM workflow_jobs
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Cache statistics
SELECT service, operation, COUNT(*) as hit_count,
       AVG(EXTRACT(EPOCH FROM (expires_at - created_at))) as avg_ttl_seconds
FROM external_api_cache
GROUP BY service, operation;
```

---

## Development

### Running Without Docker

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Celery Worker
source venv/bin/activate
celery -A app.celery_app worker --loglevel=debug --pool=eventlet --concurrency=4 --events

# Terminal 3: Start FastAPI
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 4: Start Flower (optional)
source venv/bin/activate
celery -A app.celery_app flower --port=5555
```

### Code Organization

```
LLM_service/
├── app/
│   ├── api/              # REST API endpoints
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic services
│   ├── tasks/            # Celery tasks
│   ├── workflows/        # Workflow engine
│   │   ├── engine.py     # Core orchestration
│   │   ├── context.py    # Variable resolution
│   │   ├── errors.py     # Error handling
│   │   ├── services/     # Step executors
│   │   └── ...
│   ├── main.py           # FastAPI app
│   ├── celery_app.py     # Celery configuration
│   └── config.py         # Settings
├── workflows/
│   ├── definitions/      # Workflow JSON files
│   └── prompts/          # Prompt templates
├── tests/                # Test suite
├── migrations/           # Database migrations
├── docker-compose.yml    # Docker services
├── Dockerfile            # Container image
└── requirements.txt      # Python dependencies
```

---

## Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing documentation.

### Quick Test Commands

```bash
# Run all tests
source venv/bin/activate
python -m pytest tests/ -v

# Run specific test suite
python -m pytest tests/test_error_handling.py -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html
```

### Test Categories

- **Unit Tests**: `tests/test_*.py` (35 error handling tests ✅)
- **Integration Tests**: `tests/test_*_integration.py`
- **API Tests**: `tests/test_api_endpoints.py`
- **Webhook Tests**: `tests/test_webhook_error_payloads.py`

---

## Troubleshooting

### Common Issues

#### 1. Redis Connection Errors

**Symptom**: `Error 111 connecting to localhost:6379. Connection refused.`

**Solution**:
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
docker-compose restart redis

# Check Redis logs
docker logs llm-redis
```

#### 2. Database Connection Pool Exhaustion

**Symptom**: `FATAL: remaining connection slots are reserved`

**Solution**:
- Use connection pooling in Supabase (Transaction mode)
- Set `pool_pre_ping=True` in SQLAlchemy
- Monitor active connections

#### 3. Event Loop Closed Errors

**Symptom**: `RuntimeError: Event loop is closed`

**Solution**:
- Ensure Celery worker uses `eventlet` or `gevent` pool
- Don't close event loops manually
- Let eventlet manage loop lifecycle

```bash
# Correct worker command
celery -A app.celery_app worker --pool=eventlet --concurrency=10 --events
```

#### 4. Webhook Signature Validation Fails

**Symptom**: Webhook receivers report invalid signatures

**Solution**:
- Ensure webhook secret matches between sender and receiver
- Use exact pre-serialized JSON for signature verification
- Check for serialization format differences

#### 5. Docker Container to Host Communication

**Symptom**: `ECONNREFUSED` when accessing localhost from containers

**Solution**:
```bash
# Use host.docker.internal instead of localhost
WEBHOOK_URL=http://host.docker.internal:5001/webhook
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
# In .env.local
DEBUG_MODE=true
LOG_LEVEL=debug

# Restart services
docker-compose restart
```

### Support

- **Documentation**: [WORKFLOW_DESIGN.md](WORKFLOW_DESIGN.md), [WORKFLOW_SCHEMA.md](WORKFLOW_SCHEMA.md)
- **Issues**: GitHub Issues
- **Email**: support@beprepared.ai

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Version History

### v1.0.0 (Current)
- ✅ Complete Phase 1-9 implementation
- ✅ Production-ready deployment
- ✅ Comprehensive error handling
- ✅ Docker containerization
- ✅ Webhook system with HMAC authentication
- ✅ Cache management and rate limiting

### Roadmap

- **v1.1.0**: Next.js integration (Phase 10)
- **v1.2.0**: Monitoring & observability (Phase 11)
- **v2.0.0**: Advanced features (Phase 12)
