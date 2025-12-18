# BePreparedd.ai Monorepo Deployment Guide

**Complete guide for deploying both Next.js app and LLM microservice to Render.com**

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Environment Variables Setup](#environment-variables-setup)
- [Database Migration](#database-migration)
- [Post-Deployment Verification](#post-deployment-verification)
- [Troubleshooting](#troubleshooting)
- [Cost Breakdown](#cost-breakdown)

---

## Overview

This monorepo contains two main applications:

1. **Next.js Web Application** (beprepared.ai) - Frontend + API routes
2. **LLM Microservice** - Python FastAPI backend with Celery workers

Both applications are deployed to Render.com using a **Blueprint** configuration (`render.yaml`).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Render.com Cloud                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │  Next.js Web App     │─────▶│  LLM API Service     │    │
│  │  (Node.js)           │      │  (FastAPI/Python)    │    │
│  │                      │      │  Port: 10000         │    │
│  │  - User Interface    │      └──────────┬───────────┘    │
│  │  - API Routes        │                 │                 │
│  │  - Authentication    │                 │                 │
│  │  - Stripe Integration│                 ▼                 │
│  └──────────┬───────────┘      ┌──────────────────────┐    │
│             │                   │  Celery Worker       │    │
│             │                   │  (Background Tasks)  │    │
│             │                   └──────────┬───────────┘    │
│             │                              │                 │
│             │                   ┌──────────▼───────────┐    │
│             │                   │  Redis Cache         │    │
│             │                   │  (Message Broker)    │    │
│             │                   └──────────────────────┘    │
│             │                                                │
│             │                   ┌──────────────────────┐    │
│             │                   │  Flower Dashboard    │    │
│             │                   │  (Monitoring)        │    │
│             │                   └──────────────────────┘    │
│             │                                                │
│             ▼                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Supabase PostgreSQL Database               │  │
│  │           (Shared by both services)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Service Count:** 5 services total
- 1 Next.js web service
- 3 LLM microservice containers (API, Worker, Flower)
- 1 managed Redis database

---

## Pre-Deployment Checklist

### ✅ Prerequisites

- [ ] **GitHub Repository**: Code pushed to GitHub main branch
- [ ] **Render Account**: Sign up at [render.com](https://render.com) (free to start)
- [ ] **Supabase Database**: PostgreSQL database ready
- [ ] **API Keys Ready**:
  - [ ] OpenRouter API key (for Claude AI)
  - [ ] Google Services API key (Maps, Geocoding, Routes)
  - [ ] WeatherAPI key
  - [ ] Stripe API keys (publishable + secret)
  - [ ] Resend API key (for emails)
- [ ] **Webhook Secret**: Generate a strong secret (see below)

### 🔐 Generate Webhook Secret

```bash
# Generate a secure 32-character random secret
openssl rand -hex 32

# Example output:
# a3f7b2c8d9e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9

# ⚠️ IMPORTANT: Store this secret - you'll need it in TWO places:
# 1. Next.js app: LLM_WEBHOOK_SECRET
# 2. LLM service: LLM_WEBHOOK_SECRET
```

### 📊 Database Preparation

**Option 1: Use Existing Supabase Database (Recommended)**

If you already have Supabase for your project:

1. Get your connection string:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres
   ```

2. **Use Transaction Mode Pooler** (required for Render):
   ```
   postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

3. You'll use this same `DATABASE_URL` for both Next.js and LLM service

**Option 2: Create New Render PostgreSQL**

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - Name: `beprepared-db`
   - Region: Oregon (or same as your services)
   - Plan: Starter ($7/month)
3. Note the connection string for later

---

## Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Ensure `render.yaml` is in your repository root**
   ```bash
   # The updated render.yaml should be at:
   /home/tiran/emergency-planner-v2/render.yaml
   ```

2. **Commit and push to GitHub**
   ```bash
   cd /home/tiran/emergency-planner-v2
   git add render.yaml
   git commit -m "Add complete Render.com deployment configuration"
   git push origin main
   ```

### Step 2: Connect Render to GitHub

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Click **Connect GitHub Account** (if not already connected)
4. Authorize Render to access your repositories
5. Select your repository: `emergency-planner-v2`
6. Click **Connect**

### Step 3: Apply Blueprint

Render will automatically:
- ✅ Detect `render.yaml` in your repository
- ✅ Show you a preview of all 5 services to be created
- ✅ Display all environment variables that need configuration

**Review the blueprint preview:**
```
Services to be created:
✓ beprepared-nextjs (Web Service - Node)
✓ llm-service-api (Web Service - Docker)
✓ llm-service-worker (Background Worker - Docker)
✓ llm-service-flower (Web Service - Docker)
✓ llm-service-redis (Redis Database)
```

Click **Apply** to create all services.

### Step 4: Initial Deployment (Will Fail - Expected!)

Render will start deploying, but **services will fail** because environment variables aren't set yet.

**This is normal!** ✅ Don't panic.

You'll see errors like:
```
Error: Environment variable DATABASE_URL is not set
Error: Missing required configuration
```

We'll fix this in the next step.

---

## Environment Variables Setup

### Step 5A: Configure Next.js App Environment Variables

1. Go to Render Dashboard
2. Click on **beprepared-nextjs** service
3. Click **Environment** tab
4. Add/update these variables:

#### Database & Auth (Supabase)
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

#### AI Services
```bash
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIza...  # Optional
```

#### Google Services
```bash
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=AIza...
GOOGLE_CUSTOM_SEARCH_CX=...  # Optional
```

#### Weather API
```bash
NEXT_PUBLIC_WEATHERAPI_API_KEY=...
```

#### Stripe Payments
```bash
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/p/login/...
```

#### Email (Resend)
```bash
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

#### LLM Service Integration
```bash
LLM_SERVICE_URL=https://llm-service-api.onrender.com
LLM_WEBHOOK_SECRET=[paste the secret you generated earlier]
```

#### Site Configuration
```bash
NEXT_PUBLIC_SITE_URL=https://beprepared-nextjs.onrender.com
# Update this to your custom domain later
```

5. Click **Save Changes**
6. Service will automatically redeploy

### Step 5B: Configure LLM API Service Environment Variables

1. Go to **llm-service-api** service
2. Click **Environment** tab
3. Add these variables:

```bash
# Database (same as Next.js)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# External APIs
WEATHERAPI_API_KEY=...
GOOGLE_SERVICES_API_KEY=AIza...

# Webhook Security (MUST match Next.js)
LLM_WEBHOOK_SECRET=[same secret as Next.js]

# Email
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

**Note:** `REDIS_URL` is automatically set by Render from the managed Redis service.

4. Click **Save Changes**

### Step 5C: Configure LLM Worker Service Environment Variables

1. Go to **llm-service-worker** service
2. Click **Environment** tab
3. Add **the same variables** as the API service (Step 5B)
4. Click **Save Changes**

**Why the same?** The worker needs access to the same database and APIs as the API service.

---

## Database Migration

### Step 6: Run LLM Service Migrations

After all services are deployed and running:

1. Go to **llm-service-api** service
2. Click **Shell** tab (opens a terminal in the running container)
3. Run migrations:

```bash
# Navigate to migrations directory
cd /app/migrations

# Run each migration in order
psql $DATABASE_URL < 001_create_llm_tables.sql
psql $DATABASE_URL < 002_create_external_api_cache.sql
psql $DATABASE_URL < 003_add_webhook_fields.sql

# Verify tables were created
psql $DATABASE_URL -c "\dt llm_*"
```

**Expected output:**
```
List of relations
 Schema |         Name          | Type  |  Owner
--------+-----------------------+-------+----------
 public | llm_workflow_jobs     | table | postgres
 public | llm_webhook_attempts  | table | postgres
 public | external_api_cache    | table | postgres
```

**Alternative:** Run migrations locally

If you prefer to run migrations from your local machine:

```bash
# From project root
cd LLM_service/migrations

# Run migrations (use your Supabase connection string)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres" < 001_create_llm_tables.sql
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres" < 002_create_external_api_cache.sql
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:6543/postgres" < 003_add_webhook_fields.sql
```

---

## Post-Deployment Verification

### Step 7: Verify All Services Are Running

Check Render Dashboard - all 5 services should show **Live** or **Available**:

```
✅ beprepared-nextjs           [Live]
✅ llm-service-api             [Live]
✅ llm-service-worker          [Live]
✅ llm-service-flower          [Live]
✅ llm-service-redis           [Available]
```

### Step 8: Test Health Endpoints

#### Test Next.js App
```bash
curl https://beprepared-nextjs.onrender.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-12-17T10:00:00Z"
}
```

**Note:** If you don't have a `/api/health` endpoint yet, create one:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
```

#### Test LLM Service
```bash
curl https://llm-service-api.onrender.com/health

# Expected response:
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

### Step 9: Test End-to-End Workflow

Test a complete workflow from Next.js → LLM Service:

```bash
# Submit a job to LLM service
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
    "webhook_url": "https://beprepared-nextjs.onrender.com/api/webhooks/llm"
  }'

# Expected response:
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "workflow_name": "emergency_contacts",
  "created_at": "2025-12-17T10:00:00Z"
}
```

### Step 10: Monitor Celery with Flower

1. Visit: `https://llm-service-flower.onrender.com`
2. You should see the Flower monitoring dashboard
3. Check:
   - ✅ Active workers
   - ✅ Task queue status
   - ✅ Completed tasks
   - ✅ Task execution times

---

## Troubleshooting

### Issue 1: Services Won't Start

**Symptom:** Service shows "Deploy failed" or keeps restarting

**Solutions:**
1. Check logs: Service → **Logs** tab
2. Verify all environment variables are set
3. Check for typos in `DATABASE_URL`
4. Ensure Supabase database is accessible

### Issue 2: Database Connection Errors

**Symptom:** `FATAL: remaining connection slots are reserved`

**Solutions:**
1. Use Supabase **Transaction Mode** pooler:
   ```
   postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. Reduce connection pool size in Next.js/LLM service

### Issue 3: IPv6 Connection Errors (ENETUNREACH)

**Symptom:** `Error: connect ENETUNREACH` when connecting to Supabase

**Solution:** Use IPv4 resolution script

```bash
# From project root
DATABASE_URL="your-supabase-url" node scripts/resolve-db-ipv4.js

# Use the outputted IPv4 connection string in Render
```

### Issue 4: Webhook Delivery Fails

**Symptom:** LLM jobs complete but Next.js doesn't receive webhook

**Solutions:**
1. Verify `LLM_WEBHOOK_SECRET` matches in both services
2. Check webhook endpoint exists: `/api/webhooks/llm`
3. View webhook logs in `llm_webhook_attempts` table:
   ```sql
   SELECT * FROM llm_webhook_attempts
   ORDER BY created_at DESC LIMIT 10;
   ```

### Issue 5: Build Failures

**Next.js build fails:**
- Check Node.js version (should be 18+ or 20+)
- Verify all dependencies install: check build logs
- Check for TypeScript errors

**Docker build fails:**
- Check `LLM_service/Dockerfile` exists
- Verify `requirements.txt` is valid
- Check Docker build logs for Python errors

### Issue 6: Out of Memory

**Symptom:** Service crashes with "Killed" or memory errors

**Solutions:**
1. Upgrade plan: Starter → Standard (2 GB RAM)
2. Reduce Celery concurrency: `--concurrency=5`
3. Optimize Next.js build output

---

## Cost Breakdown

### Monthly Costs (Render.com)

| Service | Type | Plan | Monthly Cost |
|---------|------|------|--------------|
| **beprepared-nextjs** | Web Service | Starter | **$7** |
| **llm-service-api** | Web Service | Starter | **$7** |
| **llm-service-worker** | Background Worker | Starter | **$7** |
| **llm-service-flower** | Web Service | Free | **$0** |
| **llm-service-redis** | Managed Redis | Starter | **$7** |
| **Supabase Database** | PostgreSQL | Free Tier | **$0** |
| | | **TOTAL** | **$28/month** |

### Free Tier Option (Development Only)

Render offers **750 hours/month free** for web services:

- Next.js app: Free tier (limited resources)
- LLM API: Free tier (limited resources)
- Worker: **NOT available on free tier**
- Redis: Use external free Redis (e.g., Redis Labs)

**Limitation:** No background workers on free tier - tasks run synchronously.

### Scaling Costs

**Upgrade to Standard Plan ($25/month per service):**
- 2 GB RAM (vs 512 MB)
- 1 CPU (vs 0.5 CPU)
- Better performance for production

**Add More Workers:**
- Each additional worker: $7/month (Starter) or $25/month (Standard)
- Recommended for >10 concurrent jobs

---

## Next Steps After Deployment

### ✅ Production Checklist

- [ ] **Custom Domain**: Add your domain in Render Dashboard
- [ ] **SSL Certificate**: Render provides free SSL (auto-configured)
- [ ] **Stripe Webhooks**: Update Stripe webhook URL to production
- [ ] **Environment Variables**: Double-check all secrets are set
- [ ] **Database Backups**: Enable Supabase backups (or Render PostgreSQL)
- [ ] **Monitoring**: Set up alerts in Render Dashboard
- [ ] **Error Tracking**: Consider adding Sentry or similar
- [ ] **Performance**: Monitor Flower dashboard for task queues

### 🔄 Continuous Deployment

Render automatically deploys when you push to `main`:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Render automatically:
# 1. Detects the push
# 2. Rebuilds affected services
# 3. Deploys new version
# 4. Performs health checks
```

### 📊 Monitoring

**Render Dashboard:**
- CPU/Memory usage graphs
- Request logs
- Error logs
- Deploy history

**Flower Dashboard:**
- Active Celery tasks
- Task success/failure rates
- Worker health

**Supabase Dashboard:**
- Database connections
- Query performance
- Table sizes

---

## Support & Resources

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Status**: [status.render.com](https://status.render.com)
- **LLM Service API Guide**: [LLM_service/API_GUIDE.md](LLM_service/API_GUIDE.md)
- **LLM Service Deployment**: [LLM_service/DEPLOYMENT_GUIDE.md](LLM_service/DEPLOYMENT_GUIDE.md)

---

## Emergency Rollback

If deployment fails and you need to revert:

1. **Revert Code:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Manual Rollback in Render:**
   - Go to Service → **Events**
   - Find previous successful deploy
   - Click **Redeploy**

3. **Database Rollback** (if migrations ran):
   ```bash
   # Run down migrations in reverse order
   psql $DATABASE_URL < LLM_service/migrations/003_add_webhook_fields_down.sql
   psql $DATABASE_URL < LLM_service/migrations/002_create_external_api_cache_down.sql
   psql $DATABASE_URL < LLM_service/migrations/001_create_llm_tables_down.sql
   ```

---

## Success! 🎉

Your monorepo is now deployed with:

✅ **Next.js Web App** - User-facing application
✅ **LLM API Service** - AI workflow processing
✅ **Celery Workers** - Background task execution
✅ **Redis Cache** - Fast message broker
✅ **Flower Dashboard** - Real-time monitoring

**Access your apps:**
- **Web App**: `https://beprepared-nextjs.onrender.com`
- **LLM API**: `https://llm-service-api.onrender.com`
- **Monitoring**: `https://llm-service-flower.onrender.com`

**Next:** Configure your custom domain and start using your deployed application!
