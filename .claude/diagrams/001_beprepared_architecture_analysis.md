# BePrepared.AI System Architecture - Comprehensive Analysis

## Overview
This diagram documents the complete system architecture of BePrepared.AI, a disaster preparedness platform that generates personalized emergency plans using AI. The system employs a **hybrid microservices architecture** with separate frontend and worker services communicating via webhooks.

## Diagram Rendering

### Online Rendering
1. Copy the contents of [`001_beprepared_architecture.puml`](./001_beprepared_architecture.puml)
2. Visit https://www.plantuml.com/plantuml/uml/
3. Paste content and view the rendered diagram
4. Export as PNG, SVG, or PDF

### Local Rendering
```bash
# Using PlantUML CLI
plantuml 001_beprepared_architecture.puml

# Using VS Code PlantUML extension
# Open .puml file and press Alt+D to preview
```

---

## Architecture Layers

### 1. Frontend Layer (Next.js 15 + React 19)

**Technology Stack:**
- **Framework:** Next.js 15 with App Router
- **UI Library:** React 19 with Server Components
- **Styling:** Tailwind CSS v4 with Shadcn UI components
- **Language:** TypeScript 5+ with strict mode

**Key Components:**

#### App Router
- **Purpose:** Routing and page orchestration
- **Features:** Server-first rendering, nested layouts, streaming
- **Location:** `src/app/`

#### Server Components
- **Purpose:** SSR with direct database/auth access
- **Benefits:** Zero client JavaScript, fast initial load, SEO-friendly
- **Examples:** Dashboard, plan details, admin pages
- **Pattern:** Async components that fetch data directly

#### Client Components
- **Purpose:** Interactive UI with hooks and state
- **Pattern:** Marked with `'use client'` directive
- **Examples:** Forms, maps, wizard steps, real-time updates
- **Location:** `src/components/`

#### API Routes
Six major API route categories:

1. **Mission Plan Generation** (`/api/mission-plan/*`)
   - `POST /generate` - Trigger AI plan generation
   - `GET /check` - Poll job status
   - `POST /cancel` - Cancel running job
   - **Flow:** Next.js → LLM Service → Webhook callback

2. **Webhook Receivers** (`/api/webhooks/*`)
   - `/llm-callback` - Receives LLM service completion events
   - `/stripe` - Processes Stripe subscription events
   - **Security:** HMAC-SHA256 signature verification

3. **Payment Processing** (`/api/stripe/*`)
   - `/prices` - Fetch current Stripe pricing
   - **Integration:** Stripe SDK with webhook sync

4. **Emergency Services** (`/api/emergency-services`)
   - **Purpose:** Find nearby hospitals, shelters, police stations
   - **Dependencies:** Google Places API, Geocoding API

5. **Product Recommendations** (`/api/amazon/product`)
   - **Purpose:** Fetch Amazon product data for bundles
   - **Integration:** Decodo API with variant selection

6. **Content Extraction** (`/api/firecrawl/*`)
   - **Purpose:** Extract structured content from web pages
   - **Integration:** Firecrawl API

---

### 2. Authentication & Session Layer

**Provider:** Supabase Auth with email-first OTP flow

**Architecture:**
```
User Email → OTP Generation → Email Delivery → OTP Verification → Session Creation
```

**Components:**

#### Email OTP Flow
- **Pattern:** Passwordless authentication (email magic link optional)
- **Security:** Time-limited one-time passwords
- **User Experience:** No password management required
- **Implementation:** `src/app/(auth)/`

#### Session Management
- **Type:** Cookie-based sessions via `@supabase/ssr`
- **Storage:** HttpOnly cookies (secure, SameSite=Lax)
- **Refresh:** Automatic token refresh via middleware
- **Server Access:** `createClient()` from `@/utils/supabase/server`
- **Client Access:** `createClient()` from `@/utils/supabase/client`

#### Database Integration
- **auth.users:** Managed by Supabase Auth (email, auth metadata)
- **profiles:** Application user data (subscription tier, usage limits)
- **RLS Policies:** Row-level security enforced by Supabase

**Critical Pattern:**
```typescript
// Server Components (async required)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Client Components (no await)
const supabase = createClient();
```

---

### 3. Database Layer (Drizzle ORM)

**Database:** PostgreSQL via Supabase with direct connection pooling

**ORM Strategy:** Drizzle ORM for type-safe queries

**⚠️ CRITICAL RULE:**
- **NEVER** use Supabase REST API (`supabase.from()`)
- **ALWAYS** use Drizzle ORM with direct PostgreSQL connection
- **Reason:** Full type safety, complex joins, better performance

**Key Tables:**

#### mission_reports
- **Purpose:** Store generated emergency plans
- **Schema:** User ID, plan content (markdown), form data (JSON), metadata
- **Retention:** FREE tier = 1 plan, BASIC/PRO = unlimited
- **Location:** `src/db/schema/mission-reports.ts`

#### calls (AI Usage Tracking)
- **Purpose:** Log all AI API calls for billing and analytics
- **Schema:** User ID, model, tokens (input/output), cost, duration
- **Analytics:** Admin dashboard aggregations
- **Location:** `src/db/schema/calls.ts`

#### profiles
- **Purpose:** User settings and subscription data
- **Schema:** User ID, subscription tier, role, preferences
- **Sync:** Updated via Stripe webhooks
- **Location:** `src/db/schema/profiles.ts`

#### subscriptions
- **Purpose:** Track active Stripe subscriptions
- **Schema:** User ID, Stripe subscription ID, status, current period
- **Sync:** Bidirectional with Stripe via webhooks
- **Location:** `src/db/schema/subscriptions.ts`

#### llm_callbacks
- **Purpose:** Store webhook callbacks from LLM service
- **Schema:** Job ID, signature validation, payload, event type
- **Security:** Invalid signatures logged for monitoring
- **Location:** `src/db/schema/llm-callbacks.ts`

#### system_logs
- **Purpose:** Application-wide error and event logging
- **Schema:** Severity, category, message, context, user ID
- **Admin Access:** Searchable via admin dashboard
- **Location:** `src/db/schema/system-logs.ts`

**Migration Pattern:**
```bash
# 1. Modify schema files
# 2. Generate migration
npm run db:generate

# 3. Review SQL in drizzle/migrations/
# 4. Apply migration
npm run db:migrate
```

---

### 4. LLM Microservice (Python FastAPI + Celery)

**Purpose:** Asynchronous AI workflow execution with job queue management

**Architecture Components:**

#### FastAPI Server
- **Framework:** FastAPI with Uvicorn
- **Port:** 8000 (default)
- **API Spec:** OpenAPI 3.0 with `/docs` endpoint
- **Location:** `LLM_service/app/main.py`

**Endpoints:**

1. **POST /api/v1/workflow**
   - **Purpose:** Submit workflow for async execution
   - **Auth:** X-API-Secret header
   - **Response:** 202 Accepted with job ID
   - **Flow:** Validate workflow → Create job record → Queue Celery task

2. **GET /api/v1/jobs/{job_id}**
   - **Purpose:** Poll job status
   - **Response:** Job status (PENDING/QUEUED/RUNNING/COMPLETED/FAILED)
   - **Location:** `LLM_service/app/api/v1/jobs.py`

3. **POST /api/v1/workflow/validate**
   - **Purpose:** Dry-run validation without execution
   - **Response:** Estimated tokens, cost, duration
   - **Use Case:** Preview costs before execution

4. **GET /health**
   - **Purpose:** Service health check
   - **Checks:** Database, Redis, Celery workers
   - **Response:** Healthy/Degraded/Unhealthy

#### Celery Workers
- **Queue System:** Redis-backed task queue
- **Concurrency:** Eventlet pool for async I/O
- **Worker Command:** `celery -A app.celery_app worker --pool=eventlet`

**Key Tasks:**

1. **execute_workflow**
   - **Purpose:** Execute multi-step AI workflows
   - **Location:** `LLM_service/app/tasks/workflows.py`
   - **Timeout:** 300 seconds (5 minutes)
   - **Retry:** Exponential backoff on failure

**Workflow Engine:**
- **Definition Format:** JSON workflow files in `LLM_service/workflows/definitions/`
- **Steps:** Sequential or parallel execution of LLM calls
- **State Tracking:** Update job status in PostgreSQL
- **Result Handling:** Send webhook to Next.js callback URL

**Worker Database (PostgreSQL):**
- **workflow_jobs:** Job records with status tracking
- **Schema:** Job ID, Celery task ID, workflow name, status, input/output data
- **Location:** `LLM_service/app/models/workflow_job.py`

#### Redis Queue
- **Purpose:** Task queue and result backend
- **Connection:** SSL-enabled (rediss://) for production
- **Configuration:**
  - Task Queue: Celery task distribution
  - Result Backend: Store task results and metadata
- **Monitoring:** Celery Flower (optional)

---

### 5. AI Provider Layer (OpenRouter)

**Service:** OpenRouter API for unified LLM access

**Provider Implementation:** Custom OpenRouter client with httpx

**Configuration:**
- **API Key:** `OPENROUTER_API_KEY` environment variable
- **Base URL:** `https://openrouter.ai/api/v1`
- **Timeout:** 300 seconds
- **Connection Pooling:** 100 max connections, 0 keepalive
- **Location:** `LLM_service/app/services/openrouter.py`

**Available Models:**

1. **Claude 3.5 Sonnet** (Default)
   - **ID:** `anthropic/claude-3.5-sonnet`
   - **Use Case:** Mission plan generation, complex workflows
   - **Cost:** ~$15 per 1M tokens

2. **Claude Opus 4**
   - **ID:** `anthropic/claude-opus-4`
   - **Use Case:** Highest quality, critical operations
   - **Cost:** Higher than Sonnet

3. **Claude Haiku 3**
   - **ID:** `anthropic/claude-3-haiku`
   - **Use Case:** Cost-effective, simple tasks
   - **Cost:** Lowest cost option

**Request Pattern:**
```python
response = await provider.generate(
    messages=[Message(role="user", content="...")],
    model="anthropic/claude-3.5-sonnet",
    temperature=0.7,
    max_tokens=4000
)
```

**Cost Tracking:**
- **Logging:** All calls logged to `calls` table in Next.js database
- **Metrics:** Input tokens, output tokens, total cost (USD)
- **Analytics:** Admin dashboard aggregations

**Why OpenRouter vs. Direct Anthropic API?**
- ✅ Unified API for multiple LLM providers
- ✅ Fallback models if primary unavailable
- ✅ Built-in rate limiting and error handling
- ✅ No need to manage separate API keys per provider

---

### 6. External API Integrations

#### Google Cloud APIs

**Maps JavaScript API**
- **Purpose:** Client-side map rendering
- **Usage:** Display evacuation routes, emergency services locations
- **Component:** `src/components/plans/map/MapComponent.tsx`
- **Key:** `NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY`

**Geocoding API**
- **Purpose:** Convert addresses to coordinates
- **Usage:** User location, waypoint geocoding
- **Library:** `src/lib/geocoding.ts`

**Routes API**
- **Purpose:** Calculate drivable routes between waypoints
- **Usage:** Evacuation route generation with turn-by-turn directions
- **Library:** `src/lib/google-routes.ts`
- **Features:** Traffic-aware routing, ETA estimation

**Places API**
- **Purpose:** Search for nearby emergency services
- **Usage:** Find hospitals, police stations, shelters
- **Endpoint:** `src/app/api/emergency-services/route.ts`
- **Also Used By:** LLM Service for emergency contact generation

#### Stripe

**Subscriptions**
- **Tiers:** FREE (1 plan), BASIC ($9/mo), PRO ($29/mo)
- **Features:** Unlimited plans, priority support, advanced features
- **Implementation:** `src/lib/stripe.ts`

**Webhooks**
- **Events:** `customer.subscription.created`, `updated`, `deleted`
- **Handler:** `src/app/api/webhooks/stripe/route.ts`
- **Sync:** Updates `subscriptions` table in real-time

**Prices API**
- **Purpose:** Fetch current pricing for display
- **Endpoint:** `src/app/api/stripe/prices/route.ts`

#### Firecrawl

**Web Scraping Service**
- **Purpose:** Extract structured content from URLs
- **Usage:** Content extraction for AI context
- **Library:** `src/lib/firecrawl.ts`
- **API:** `@mendable/firecrawl-js` SDK

#### Decodo API

**Amazon Product Data**
- **Purpose:** Fetch product details for emergency supply bundles
- **Features:** Pricing, images, reviews, availability
- **Library:** `src/lib/decodo.ts`
- **Critical:** `autoselect_variant: true` required for correct pricing

**Variant Selection:**
- **Problem:** Amazon products with multiple sizes/colors return base variant price
- **Solution:** Decodo API selects correct variant automatically
- **Impact:** Accurate pricing for product recommendations

#### Resend

**Email Delivery**
- **Purpose:** Transactional emails (OTP, alerts, notifications)
- **Library:** `resend` npm package
- **From Address:** `RESEND_FROM_EMAIL` environment variable

**Use Cases:**
- User OTP delivery (authentication)
- Admin alerts (webhook errors, security issues)
- Subscription notifications (payment failed, plan upgraded)

---

## Critical Data Flows

### Flow 1: Mission Plan Generation (End-to-End)

```
User → Wizard Form → Next.js API → LLM Service → OpenRouter → Webhook → Database
```

**Step-by-Step:**

1. **User Input**
   - Location: `src/app/planner/page.tsx` (wizard)
   - Data: Location, household size, pets, special needs, hazards
   - Validation: Zod schemas in `src/lib/validation/`

2. **Next.js API Call**
   - Endpoint: `POST /api/mission-plan/generate`
   - Handler: `src/app/api/mission-plan/generate/route.ts`
   - Auth: Verify user session via Supabase

3. **LLM Service Submission**
   - Request: `POST {LLM_SERVICE_URL}/api/v1/workflow`
   - Payload: Workflow name, input data, user ID, webhook URL
   - Auth: X-API-Secret header

4. **Job Queue**
   - FastAPI creates job record (PENDING status)
   - Celery task queued in Redis
   - Response: 202 Accepted with job ID

5. **Celery Execution**
   - Worker picks up task (RUNNING status)
   - Workflow engine loads workflow definition
   - Execute steps sequentially/parallel

6. **OpenRouter AI Call**
   - Model: Claude 3.5 Sonnet (default)
   - Prompt: Mega prompt with user data + system prompts
   - Streaming: Not used (full response required)

7. **Webhook Callback**
   - Worker sends: `POST {NEXT_PUBLIC_SITE_URL}/api/webhooks/llm-callback`
   - Signature: HMAC-SHA256 with `LLM_WEBHOOK_SECRET`
   - Payload: Job ID, status, result, metadata

8. **Result Storage**
   - Verify signature (timingSafeEqual for security)
   - Store to `llm_callbacks` table
   - Process result asynchronously
   - Save mission plan to `mission_reports` table

9. **User Notification**
   - Update UI via polling or websocket
   - Display generated plan in dashboard
   - Download as PDF/Excel option

**Performance Targets:**
- API response: <200ms (async job queued)
- Total generation time: 30-120 seconds
- Webhook callback: <200ms response time

---

### Flow 2: Webhook Security & Verification

**Purpose:** Prevent spoofed callbacks and ensure authenticity

**HMAC-SHA256 Signature Algorithm:**

```typescript
// Sender (LLM Service)
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(rawBody)
  .digest('hex');

headers['x-webhook-signature'] = `sha256=${signature}`;
```

```typescript
// Receiver (Next.js)
const expectedDigest = signature.substring(7); // Remove 'sha256='
const actualDigest = crypto
  .createHmac('sha256', SECRET)
  .update(rawBody)
  .digest('hex');

const isValid = timingSafeEqual(
  Buffer.from(expectedDigest, 'hex'),
  Buffer.from(actualDigest, 'hex')
);
```

**Security Features:**
1. **Constant-time comparison:** Prevents timing attacks
2. **Raw body requirement:** Signature computed on exact bytes
3. **Secret validation:** Shared secret between services
4. **Invalid signature logging:** Security monitoring for attacks
5. **Rate-limited alerts:** Hourly admin emails if secret missing

**Payload Size Limit:** 1MB maximum to prevent DoS attacks

**Handler Location:** `src/app/api/webhooks/llm-callback/route.ts`

---

### Flow 3: Stripe Subscription Sync

**Purpose:** Keep subscription data in sync between Stripe and database

**Event Flow:**

```
Stripe → Webhook → Next.js API → Database Update → User Profile Refresh
```

**Webhook Events:**
- `customer.subscription.created` → Insert new subscription
- `customer.subscription.updated` → Update status, current period
- `customer.subscription.deleted` → Mark as cancelled

**Handler:** `src/app/api/webhooks/stripe/route.ts`

**Sync Pattern:**
```typescript
// Idempotent upsert
await db
  .insert(subscriptions)
  .values({ ...subscriptionData })
  .onConflictDoUpdate({ ...updateData });
```

**User Impact:**
- Plan limits updated immediately
- Feature access granted/revoked
- Admin dashboard reflects current state

---

## Deployment Architecture

### Platform Options

**Next.js App:**
- **Vercel** (Recommended): Automatic deployments, edge functions
- **Render:** Docker-based deployment with custom build

**LLM Service:**
- **Render:** FastAPI + Celery workers as separate services
- **Railway:** Alternative with Redis included

**Redis:**
- **Upstash:** Serverless Redis with SSL
- **Render:** Managed Redis instance

### Environment Variables

**Next.js (.env.local):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...

# AI
OPENROUTER_API_KEY=sk-or-v1-...

# Google
NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY=AIza...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LLM Service
LLM_SERVICE_URL=https://llm.example.com
LLM_API_SECRET=your-secret
LLM_WEBHOOK_SECRET=your-webhook-secret

# Email
RESEND_API_KEY=re_...
```

**LLM Service (.env):**
```bash
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=rediss://...
BROKER_URL=rediss://...
RESULT_BACKEND=rediss://...

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# Webhook
NEXT_JS_WEBHOOK_URL=https://app.example.com/api/webhooks/llm-callback
WEBHOOK_SECRET=your-webhook-secret

# Google
GOOGLE_PLACES_API_KEY=AIza...
```

---

## Key Insights & Recommendations

### ✅ Strengths

1. **Separation of Concerns**
   - Frontend handles UI/auth/session
   - Worker service handles compute-heavy AI operations
   - Clear boundaries prevent coupling

2. **Async by Default**
   - Non-blocking AI generation
   - Fast API responses (<200ms)
   - Background processing with Celery

3. **Type Safety**
   - TypeScript strict mode in Next.js
   - Drizzle ORM provides full type inference
   - Pydantic models in Python service

4. **Security**
   - HMAC webhook signatures
   - Row-level security (Supabase RLS)
   - API key authentication
   - Constant-time comparisons

5. **Monitoring**
   - AI usage tracking in `calls` table
   - System logs for errors
   - Webhook validation logging
   - Health check endpoints

### ⚠️ Potential Improvements

1. **Webhook Reliability**
   - **Current:** Fire-and-forget webhooks
   - **Recommendation:** Add retry mechanism with exponential backoff
   - **Implementation:** Dead letter queue for failed webhooks

2. **Caching Layer**
   - **Current:** No caching for API responses
   - **Recommendation:** Redis cache for common queries (emergency services, pricing)
   - **Benefit:** Reduce external API calls and costs

3. **Real-time Updates**
   - **Current:** Polling for job status
   - **Recommendation:** WebSocket or Server-Sent Events for live updates
   - **Benefit:** Better UX, less server load

4. **Cost Optimization**
   - **Current:** All plans use Claude Sonnet
   - **Recommendation:** Use Haiku for FREE tier, Sonnet for paid tiers
   - **Benefit:** Reduce AI costs for free users

5. **Observability**
   - **Current:** Basic logging to database
   - **Recommendation:** Structured logging with Sentry/DataDog
   - **Benefit:** Better error tracking and alerting

6. **Database Connection Pooling**
   - **Current:** Direct PostgreSQL connections
   - **Recommendation:** Connection pool with PgBouncer
   - **Benefit:** Handle high concurrent load

---

## Related Files

### Frontend (Next.js)
- [src/app/api/mission-plan/generate/route.ts](../../src/app/api/mission-plan/generate/route.ts) - Mission plan generation endpoint
- [src/app/api/webhooks/llm-callback/route.ts](../../src/app/api/webhooks/llm-callback/route.ts) - LLM webhook handler
- [src/lib/openrouter.ts](../../src/lib/openrouter.ts) - OpenRouter client configuration
- [src/utils/supabase/server.ts](../../src/utils/supabase/server.ts) - Supabase server client
- [src/db/schema/index.ts](../../src/db/schema/index.ts) - Drizzle ORM schemas

### LLM Service (Python)
- [LLM_service/app/main.py](../../LLM_service/app/main.py) - FastAPI application entry point
- [LLM_service/app/celery_app.py](../../LLM_service/app/celery_app.py) - Celery configuration
- [LLM_service/app/api/v1/workflow.py](../../LLM_service/app/api/v1/workflow.py) - Workflow submission endpoint
- [LLM_service/app/services/openrouter.py](../../LLM_service/app/services/openrouter.py) - OpenRouter provider implementation
- [LLM_service/app/tasks/workflows.py](../../LLM_service/app/tasks/workflows.py) - Celery workflow task

### Documentation
- [CLAUDE.md](../../CLAUDE.md) - Project overview and development guide
- [LLM_service/README.md](../../LLM_service/README.md) - LLM service documentation
- [LLM_service/API_GUIDE.md](../../LLM_service/API_GUIDE.md) - API usage examples

---

**Diagram Version:** 1.0
**Last Updated:** 2025-12-22
**Created By:** Claude Code (SuperClaude)
**Focus:** Complete system architecture with all integrations
