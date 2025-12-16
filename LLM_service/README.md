# LLM Workflow Microservice

Python microservice for asynchronous AI workflow processing with Celery and FastAPI.

## Quick Start

### Prerequisites
- Python 3.12
- Docker and Docker Compose
- Access to Supabase PostgreSQL database

### Setup

1. **Create `.env.local`** (already created, verify values):
```bash
DATABASE_URL=postgres://...
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=AIza...
```

2. **Install dependencies**:
```bash
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Run database migrations**:
```bash
psql $DATABASE_URL < migrations/001_create_llm_tables.sql
```

4. **Start services with Docker**:
```bash
docker-compose up --build
```

### Services

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Flower Dashboard**: http://localhost:5555
- **Redis**: localhost:6379

### Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": {"status": "healthy", "type": "postgresql"},
    "redis": {"status": "healthy"},
    "celery": {"status": "healthy", "workers": 1}
  }
}
```

## Development

### Run locally without Docker:
```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Celery Worker
celery -A app.celery_app worker --loglevel=info

# Terminal 3: FastAPI
uvicorn app.main:app --reload

# Terminal 4: Flower
celery -A app.celery_app flower
```

### Database Migrations

**Apply migration**:
```bash
psql $DATABASE_URL < migrations/001_create_llm_tables.sql
```

**Rollback migration**:
```bash
psql $DATABASE_URL < migrations/001_create_llm_tables_down.sql
```

## Architecture

- **FastAPI**: REST API for workflow submission
- **Celery**: Async task queue for workflow execution
- **Redis**: Message broker and result backend
- **PostgreSQL**: Job state and result persistence
- **Flower**: Real-time monitoring dashboard

## Phase 1 Complete ✅

This is Phase 1 of the implementation (Core Infrastructure). All services are set up and ready for Phase 2 (LLM Provider Abstraction).

### Success Criteria Met:
- ✅ Docker containers start without errors
- ✅ GET /health returns 200 with service status
- ✅ Celery worker connects to Redis
- ✅ Database tables created successfully
- ✅ Flower monitoring accessible at localhost:5555

## Next Steps

- **Phase 2**: LLM Provider Abstraction (OpenRouter, Anthropic, OpenAI clients)
- **Phase 3**: Workflow Engine Core (JSON workflow loading and execution)
- **Phase 4**: Transformation Library (10 predefined transformations)
- **Phase 5**: External API Integration (Google Places)
- **Phase 6**: Workflow API & Celery Tasks
- **Phase 7**: Webhook System
- **Phase 8**: Emergency Contacts Migration
