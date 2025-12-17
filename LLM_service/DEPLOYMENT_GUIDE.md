# Production Deployment Guide

**Step-by-step guide for deploying the LLM Workflow Microservice to Render.**

---

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Render Setup](#render-setup)
- [Database Configuration](#database-configuration)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Prerequisites

- [ ] **GitHub Repository**: Code pushed to GitHub with `LLM_service/` directory
- [ ] **Render Account**: Create account at [render.com](https://render.com)
- [ ] **PostgreSQL Database**: Supabase or Render PostgreSQL ready
- [ ] **API Keys**: OpenRouter, WeatherAPI, Google Services API keys
- [ ] **Webhook Secret**: Generate strong random secret (32+ characters)
- [ ] **Email Service**: Resend API key for notifications

### Required API Keys

```bash
# Generate webhook secret
openssl rand -hex 32
# Example output: a3f7b2c8d9e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9

# Store securely - you'll need this for:
# 1. LLM_WEBHOOK_SECRET in Render
# 2. LLM_WEBHOOK_SECRET in Next.js app
```

---

## Render Setup

### Step 1: Connect GitHub Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub account
4. Select your repository
5. Click **Apply**

Render will automatically detect `render.yaml` and create all services.

### Step 2: Review Service Configuration

Render creates 4 services from `render.yaml`:

| Service | Type | Purpose | Plan |
|---------|------|---------|------|
| `llm-service-api` | Web Service | FastAPI REST API | Starter ($7/mo) |
| `llm-service-worker` | Background Worker | Celery task processor | Starter ($7/mo) |
| `llm-service-flower` | Web Service | Monitoring dashboard | Free |
| `llm-service-redis` | Redis | Message broker & cache | Starter ($7/mo) |

**Total Monthly Cost**: ~$21 (excluding database)

---

## Database Configuration

### Option 1: Use Existing Supabase Database

**Recommended** if you already have Supabase for your Next.js app.

1. Get your Supabase connection string:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
   ```

2. **Important**: Use **Transaction Mode** pooler for Supabase:
   ```
   postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

3. Run migrations via Supabase SQL Editor or local `psql`:
   ```bash
   psql "your-supabase-connection-string" < LLM_service/migrations/001_create_llm_tables.sql
   psql "your-supabase-connection-string" < LLM_service/migrations/002_create_external_api_cache.sql
   psql "your-supabase-connection-string" < LLM_service/migrations/003_add_webhook_fields.sql
   ```

### Option 2: Create Render PostgreSQL

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configuration:
   - **Name**: `llm-service-db`
   - **Database**: `llm_service`
   - **User**: `llm_service`
   - **Region**: Same as your services (e.g., Oregon)
   - **Plan**: Starter ($7/mo)

3. Note the **Internal Database URL** (starts with `postgresql://...`)

4. Run migrations via Render Shell:
   ```bash
   # In Render Dashboard: llm-service-api → Shell
   psql $DATABASE_URL < migrations/001_create_llm_tables.sql
   psql $DATABASE_URL < migrations/002_create_external_api_cache.sql
   psql $DATABASE_URL < migrations/003_add_webhook_fields.sql
   ```

### IPv6 Connectivity Issue (Supabase)

If using Supabase and seeing `ENETUNREACH` errors, resolve to IPv4:

```bash
# Local resolution script (requires Node.js)
cd LLM_service
DATABASE_URL="your-supabase-url" node -e "
const dns = require('dns');
const url = new URL(process.env.DATABASE_URL);
dns.resolve4(url.hostname, (err, addresses) => {
  if (err) throw err;
  url.hostname = addresses[0];
  console.log('IPv4 Connection String:');
  console.log(url.toString());
});
"

# Copy the output and use as DATABASE_URL in Render
```

**Note**: IP addresses may change. Re-run if connection fails.

---

## Environment Variables

### Required Environment Variables

Set these in Render Dashboard for **both** `llm-service-api` and `llm-service-worker`:

```bash
# Database (Required)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DATABASE]

# Redis (Auto-configured by render.yaml)
REDIS_URL=<auto-from-redis-service>

# LLM Providers (Required)
OPENROUTER_API_KEY=sk-or-v1-...

# External APIs (Required)
WEATHERAPI_API_KEY=your-weatherapi-key
GOOGLE_SERVICES_API_KEY=your-google-api-key

# Webhooks (Required)
LLM_WEBHOOK_SECRET=<your-32-char-random-secret>

# Email Notifications (Optional)
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com

# Production Settings
ENVIRONMENT=production
DEBUG_MODE=false
LOG_LEVEL=info
CELERY_TASK_ALWAYS_EAGER=false
WEBHOOK_TIMEOUT=30
CACHE_DEFAULT_TTL=3600
```

### Setting Environment Variables

**Method 1: Render Dashboard**
1. Go to service → **Environment**
2. Click **Add Environment Variable**
3. Enter key and value
4. Click **Save Changes**

**Method 2: Render Blueprint (render.yaml)**
- Variables in `render.yaml` are automatically created
- `sync: false` means you must set values manually in dashboard

---

## Deployment

### Step 1: Trigger Deployment

Deployment happens automatically when you:
1. Push code to GitHub `main` branch
2. Change environment variables in Render Dashboard
3. Click **Manual Deploy** in Render Dashboard

### Step 2: Monitor Deployment

Watch deployment logs:
1. Go to service (e.g., `llm-service-api`)
2. Click **Logs** tab
3. Watch for:
   ```
   ✅ Application startup complete
   ✅ INFO:     Uvicorn running on http://0.0.0.0:10000
   ```

### Step 3: Wait for All Services

All 4 services must be running:
- ✅ `llm-service-api`: Status **Live**
- ✅ `llm-service-worker`: Status **Live**
- ✅ `llm-service-flower`: Status **Live**
- ✅ `llm-service-redis`: Status **Available**

---

## Post-Deployment

### Step 1: Verify Health Check

```bash
curl https://llm-service-api.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "database": {"status": "healthy", "type": "postgresql"},
    "redis": {"status": "healthy"},
    "celery": {"status": "healthy", "workers": 1}
  },
  "timestamp": "2025-12-17T10:00:00Z"
}
```

### Step 2: Test Workflow Execution

```bash
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
    },
    "webhook_url": "https://your-app.com/api/webhooks/llm"
  }'
```

**Expected Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "workflow_name": "emergency_contacts",
  "created_at": "2025-12-17T10:00:00Z"
}
```

### Step 3: Check Job Status

```bash
curl https://llm-service-api.onrender.com/api/v1/jobs/550e8400-e29b-41d4-a716-446655440000
```

### Step 4: Verify Webhook Delivery

Check your Next.js app webhook logs for incoming POST request with:
- Header: `X-Webhook-Signature: sha256=...`
- Header: `X-Webhook-Event: workflow.completed`
- Valid HMAC signature

---

## Monitoring

### Flower Dashboard

Access Celery monitoring at:
```
https://llm-service-flower.onrender.com
```

**Features:**
- Active tasks and workers
- Task success/failure rates
- Task execution times
- Worker resource usage

### Render Metrics

View in Render Dashboard:
- **CPU Usage**: Should stay < 80% average
- **Memory Usage**: Should stay < 80% average
- **Response Time**: Should be < 500ms for API endpoints
- **Error Rate**: Should be < 1%

### Database Monitoring

```sql
-- Active jobs
SELECT COUNT(*) as active_jobs
FROM llm_workflow_jobs
WHERE status IN ('queued', 'processing');

-- Recent failures
SELECT workflow_name, error_message, created_at
FROM llm_workflow_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- Cache hit rate
SELECT service, operation,
       COUNT(*) as total_requests,
       SUM(hit_count) as cache_hits,
       ROUND(SUM(hit_count)::NUMERIC / COUNT(*) * 100, 2) as hit_rate_percent
FROM external_api_cache
GROUP BY service, operation;
```

---

## Scaling

### Horizontal Scaling (More Workers)

**When to Scale:**
- Active jobs consistently > 10
- Worker CPU > 80%
- Task queue growing

**How to Scale:**
1. Go to `llm-service-worker` → **Settings**
2. Increase **Instance Count** (e.g., 1 → 2)
3. Each worker costs $7/mo (Starter plan)

### Vertical Scaling (Bigger Instances)

**When to Scale:**
- Memory usage > 80%
- CPU usage > 90%
- Out of memory errors

**How to Scale:**
1. Go to service → **Settings**
2. Upgrade **Plan**:
   - Starter: 512 MB RAM, 0.5 CPU
   - Standard: 2 GB RAM, 1 CPU
   - Pro: 4 GB RAM, 2 CPU

### Worker Concurrency

Adjust Celery worker concurrency:

```bash
# In render.yaml or Render Dashboard
dockerCommand: celery -A app.celery_app worker --loglevel=info --pool=eventlet --concurrency=20

# Default: 10 concurrent tasks
# Increase to 20-30 for more throughput
# Monitor memory usage - each task uses ~50-100 MB
```

---

## Troubleshooting

### Issue 1: Service Won't Start

**Symptom**: Service shows **Deploy failed** or **Exited**

**Solutions:**
1. Check **Logs** tab for error messages
2. Verify all environment variables are set (especially `DATABASE_URL`, `REDIS_URL`)
3. Ensure Dockerfile builds successfully locally
4. Check database connection (ping from Render Shell)

### Issue 2: Database Connection Errors

**Symptom**: `FATAL: remaining connection slots are reserved`

**Solutions:**
1. Use Supabase **Transaction Mode** pooler
2. Set `pool_pre_ping=True` in SQLAlchemy (already configured)
3. Reduce max connections in `app/database.py`:
   ```python
   pool_size=5,  # Reduce from 10
   max_overflow=10  # Reduce from 20
   ```

### Issue 3: Redis Connection Errors

**Symptom**: `Error 111 connecting to redis. Connection refused.`

**Solutions:**
1. Verify `REDIS_URL` environment variable is set
2. Check Redis service status in Render Dashboard
3. Restart Redis service
4. Check firewall rules (should be none for internal Render services)

### Issue 4: Webhook Delivery Failures

**Symptom**: Jobs complete but webhooks never arrive

**Solutions:**
1. Check webhook URL is publicly accessible (use ngrok for local dev)
2. Verify HMAC secret matches between microservice and Next.js app
3. Check webhook delivery logs in `llm_webhook_attempts` table:
   ```sql
   SELECT * FROM llm_webhook_attempts
   WHERE http_status IS NULL OR http_status >= 400
   ORDER BY created_at DESC
   LIMIT 10;
   ```
4. Enable debug mode to see webhook payloads

### Issue 5: Out of Memory Errors

**Symptom**: Worker crashes with `MemoryError` or `Killed`

**Solutions:**
1. Reduce Celery concurrency (10 → 5)
2. Upgrade plan to Standard (2 GB RAM)
3. Monitor memory usage per task
4. Implement pagination for large data transformations

### Issue 6: Slow Deployments

**Symptom**: Deployments take > 10 minutes

**Solutions:**
1. Use Docker layer caching (already configured)
2. Reduce dependencies in `requirements.txt`
3. Use slim base image (already using `python:3.12-slim`)
4. Consider using pre-built Docker image from Docker Hub

---

## Security Best Practices

### 1. Rotate Secrets Regularly

- Rotate `LLM_WEBHOOK_SECRET` every 90 days
- Rotate API keys when team members leave
- Use Render's **Secret Files** for sensitive data

### 2. Enable HTTPS Only

- Render provides free SSL certificates
- All API endpoints use HTTPS by default
- Never accept HTTP webhook callbacks

### 3. Implement Rate Limiting

Already configured in code:
- Per-service rate limits via Redis
- Configurable in `settings.ini`

### 4. Monitor Access Logs

Check Render logs for:
- Unusual API access patterns
- Failed authentication attempts
- High error rates

### 5. Database Security

- Use strong passwords (32+ characters)
- Enable connection pooling
- Use read-only users for reporting queries
- Regular backups (Render auto-backup enabled)

---

## Cost Optimization

### Current Monthly Costs

| Service | Plan | Cost |
|---------|------|------|
| API | Starter | $7 |
| Worker | Starter | $7 |
| Flower | Free | $0 |
| Redis | Starter | $7 |
| **Total** | | **$21/mo** |

**Note**: Database costs separate (Supabase free tier or Render $7/mo)

### Cost Reduction Tips

1. **Use Supabase Free Tier**: Save $7/mo on database
2. **Disable Flower in Production**: Save $0 (already free)
3. **Share Redis with Next.js App**: Requires custom Redis setup
4. **Optimize Cache TTLs**: Reduce external API costs
5. **Monitor LLM Token Usage**: Biggest variable cost

### Free Tier Alternative

For testing/development, use free tier:
- Web Service: Free (750 hours/month)
- Background Worker: Not available on free tier
- Redis: Use external Redis (Redis Labs free tier)

**Limitation**: No background worker on free tier - tasks run synchronously

---

## Support

- **Render Status**: [status.render.com](https://status.render.com)
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **GitHub Issues**: [your-repo/issues](https://github.com/your-repo/issues)
- **Email**: support@yourdomain.com

---

## Rollback Procedure

If deployment fails:

1. **Revert Code**: Push previous working commit
2. **Manual Redeploy**: Render Dashboard → Manual Deploy → Select previous deploy
3. **Database Rollback**: Run down migrations if schema changed
   ```bash
   psql $DATABASE_URL < migrations/003_add_webhook_fields_down.sql
   psql $DATABASE_URL < migrations/002_create_external_api_cache_down.sql
   psql $DATABASE_URL < migrations/001_create_llm_tables_down.sql
   ```

4. **Verify Rollback**: Check health endpoint and test workflow

---

## Next Steps

After successful deployment:

1. ✅ Test all workflows end-to-end
2. ✅ Integrate with Next.js app (see [API_GUIDE.md](API_GUIDE.md))
3. ✅ Set up monitoring alerts
4. ✅ Configure auto-scaling rules
5. ✅ Plan for disaster recovery

**Congratulations! Your LLM Workflow Microservice is now live in production! 🎉**
