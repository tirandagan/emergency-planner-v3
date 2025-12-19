# LLM Workflow Microservice - Complete API Reference

**Comprehensive API documentation for the LLM Workflow Microservice v1.0.0**

---

## Table of Contents

- [Overview](#overview)
- [Base URL & Environment](#base-url--environment)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Health & Status](#health--status)
  - [Workflow Management](#workflow-management)
  - [Job Management](#job-management)
- [Webhook System](#webhook-system)
- [Error Handling](#error-handling)
- [Rate Limits & Performance](#rate-limits--performance)
- [Next.js Integration Guide](#nextjs-integration-guide)

---

## Overview

The LLM Workflow Microservice provides asynchronous AI workflow execution with webhook-based result delivery. Built with FastAPI, Celery, and PostgreSQL, it offers:

- **Asynchronous Execution**: Submit workflows and receive results via webhooks
- **Secure Authentication**: API secret-based authentication for all endpoints
- **HMAC-Signed Webhooks**: SHA-256 HMAC signatures for webhook verification
- **Job Tracking**: Real-time status queries and comprehensive job history
- **Cost Tracking**: Token usage and cost data for all LLM operations
- **Retry Logic**: Exponential backoff for failed webhook deliveries

### Architecture

```
Client (Next.js)              LLM Service              Workers
┌─────────────┐              ┌──────────┐           ┌─────────┐
│             │──POST /workflow─→│ FastAPI  │──queue──→│ Celery  │
│  Browser    │              │  + Redis │           │ Workers │
│             │              │          │           │         │
│             │◀──202 job_id───┤          │           │  LLM    │
│             │              └──────────┘           │  Calls  │
│             │                    ▲                └─────────┘
│  Webhook    │◀───────────────────┘                     │
│  Handler    │           HMAC-Signed                    │
└─────────────┘           Webhook                        │
      │                                                   │
      └──Update Database◀──────────────────────────────┘
```

---

## Base URL & Environment

### Local Development
```
Base URL: http://localhost:8000
API Prefix: /api/v1
Full API Base: http://localhost:8000/api/v1
```

### Production (Render.com)
```
Base URL: https://llm-service-api.onrender.com
API Prefix: /api/v1
Full API Base: https://llm-service-api.onrender.com/api/v1
```

### API Documentation
- **Swagger UI**: `{BASE_URL}/docs`
- **ReDoc**: `{BASE_URL}/redoc`
- **OpenAPI JSON**: `{BASE_URL}/openapi.json`

---

## Authentication

All API endpoints (except `/` and `/health`) require authentication via API secret header.

### Authentication Method

**Header-Based Authentication**:
```http
X-API-Secret: your-shared-secret-key
```

### Configuration

**Server-Side** (LLM Service `.env`):
```bash
LLM_WEBHOOK_SECRET=your-shared-secret-key-here
```

**Client-Side** (Next.js `.env.local`):
```bash
LLM_WEBHOOK_SECRET=your-shared-secret-key-here  # Must match server
```

### Security Best Practices

1. **Secret Strength**: Use cryptographically strong secrets (minimum 32 characters)
2. **Secret Rotation**: Rotate secrets periodically (every 90 days recommended)
3. **Environment Variables**: Never hardcode secrets in source code
4. **HTTPS Only**: Always use HTTPS in production
5. **Secret Storage**: Use secure secret management services (AWS Secrets Manager, etc.)

### Authentication Errors

```json
{
  "error": "InvalidAPISecret",
  "message": "Invalid or missing API secret. Include X-API-Secret header with valid secret."
}
```

**HTTP Status**: `401 Unauthorized`

---

## API Endpoints

### Health & Status

#### `GET /` - Root Endpoint

**Description**: Service information and health check

**Authentication**: None required

**Response**:
```json
{
  "service": "LLM Workflow Microservice",
  "version": "1.0.0",
  "status": "online",
  "docs": "/docs"
}
```

**Status Code**: `200 OK`

---

#### `GET /health` - Comprehensive Health Check

**Description**: Check health status of all service dependencies

**Authentication**: None required

**Health Checks**:
- ✓ API server status
- ✓ PostgreSQL database connectivity
- ✓ Redis connectivity (Celery broker)
- ✓ Celery worker availability

**Response (Healthy)**:
```json
{
  "status": "healthy",
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
      "workers": 2
    }
  }
}
```

**Response (Degraded)**:
```json
{
  "status": "degraded",
  "services": {
    "database": {
      "status": "healthy",
      "type": "postgresql"
    },
    "redis": {
      "status": "unhealthy",
      "error": "Connection timeout"
    },
    "celery": {
      "status": "no_workers",
      "workers": 0
    }
  }
}
```

**Status Codes**:
- `200 OK`: Service is operational (healthy or degraded)

**Status Values**:
- `healthy`: All services operational
- `degraded`: Some non-critical services unavailable (Redis, Celery)
- `unhealthy`: Critical services unavailable (Database)

---

### Workflow Management

#### `POST /api/v1/workflow` - Submit Workflow

**Description**: Submit a workflow for asynchronous execution via Celery queue

**Authentication**: Required (`X-API-Secret` header)

**Request Body**:
```json
{
  "workflow_name": "emergency_contacts",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "input_data": {
    "formData": {
      "location": "Seattle, WA",
      "scenarios": ["earthquake", "wildfire"],
      "familyMembers": [...]
    }
  },
  "webhook_url": "https://app.beprepared.ai/api/webhooks/llm",
  "webhook_secret": "optional-job-specific-secret",
  "priority": 0,
  "debug_mode": false
}
```

**Request Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_name` | string | Yes | Workflow definition name (e.g., `emergency_contacts`, `mission_generation`) |
| `user_id` | string (UUID) | No | User identifier from Supabase Auth |
| `input_data` | object | Yes | Workflow-specific input data (structure varies by workflow) |
| `webhook_url` | string (URL) | Yes | HTTPS URL to receive completion webhook |
| `webhook_secret` | string | No | Job-specific HMAC secret (uses global default if omitted) |
| `priority` | integer (0-10) | No | Job priority (higher = more urgent, default: 0) |
| `debug_mode` | boolean | No | Include debug info in webhook payloads (default: false) |

**Response (Success - 202 Accepted)**:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "celery_task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "queued",
  "estimated_wait_seconds": null,
  "status_url": "/api/v1/status/123e4567-e89b-12d3-a456-426614174000"
}
```

**Status Codes**:
- `202 Accepted`: Workflow queued successfully
- `400 Bad Request`: Invalid request (validation error, workflow not found)
- `401 Unauthorized`: Missing or invalid API secret
- `404 Not Found`: Workflow definition not found
- `500 Internal Server Error`: Database or Celery error

**Error Responses**:

```json
// Workflow not found
{
  "error": "WorkflowNotFound",
  "message": "Workflow 'invalid_workflow' not found",
  "workflow_name": "invalid_workflow"
}

// Invalid input data
{
  "error": "WorkflowValidationError",
  "message": "Workflow definition invalid: ...",
  "workflow_name": "emergency_contacts"
}

// Database error
{
  "error": "DatabaseError",
  "message": "Failed to create job record: ...",
  "job_id": "123e4567-e89b-12d3-a456-426614174000"
}

// Celery error
{
  "error": "CeleryError",
  "message": "Failed to queue workflow execution: ...",
  "job_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Example (curl)**:
```bash
curl -X POST https://llm-service-api.onrender.com/api/v1/workflow \
  -H "Content-Type: application/json" \
  -H "X-API-Secret: your-secret-key" \
  -d '{
    "workflow_name": "emergency_contacts",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "input_data": {
      "formData": {
        "location": "Seattle, WA",
        "scenarios": ["earthquake"]
      }
    },
    "webhook_url": "https://app.beprepared.ai/api/webhooks/llm",
    "priority": 0
  }'
```

---

#### `POST /api/v1/workflow/validate` - Validate Workflow

**Description**: Validate workflow configuration and estimate resources (dry-run mode)

**Authentication**: Required (`X-API-Secret` header)

**Request Body**:
```json
{
  "workflow_name": "emergency_contacts",
  "input_data": {
    "formData": {
      "location": "Seattle, WA"
    }
  }
}
```

**Request Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_name` | string | Yes | Workflow definition name to validate |
| `input_data` | object | Yes | Input data to validate against workflow schema |

**Response (Valid - 200 OK)**:
```json
{
  "valid": true,
  "workflow_name": "emergency_contacts",
  "errors": null,
  "estimated_tokens": 5000,
  "estimated_cost_usd": 0.15,
  "estimated_duration_seconds": 20
}
```

**Response (Invalid - 200 OK)**:
```json
{
  "valid": false,
  "workflow_name": "emergency_contacts",
  "errors": [
    "Missing required field: location",
    "Invalid scenario type"
  ],
  "estimated_tokens": null,
  "estimated_cost_usd": null,
  "estimated_duration_seconds": null
}
```

**Status Codes**:
- `200 OK`: Validation complete (check `valid` field)
- `400 Bad Request`: Workflow not found
- `401 Unauthorized`: Missing or invalid API secret

**Use Cases**:
- Pre-flight validation before workflow submission
- Cost estimation for budgeting
- Input data validation for user feedback

---

#### `GET /api/v1/status/{job_id}` - Get Job Status

**Description**: Query execution status and results for a specific job

**Authentication**: Required (`X-API-Secret` header)

**Path Parameters**:
- `job_id` (string, UUID): Job identifier returned from workflow submission

**Response (Queued)**:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "queued",
  "workflow_name": "emergency_contacts",
  "created_at": "2024-12-18T10:00:00Z",
  "started_at": null,
  "completed_at": null,
  "duration_ms": null,
  "result": null,
  "error_message": null,
  "current_step": null,
  "steps_completed": null,
  "total_steps": null
}
```

**Response (Processing)**:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "processing",
  "workflow_name": "emergency_contacts",
  "created_at": "2024-12-18T10:00:00Z",
  "started_at": "2024-12-18T10:00:05Z",
  "completed_at": null,
  "duration_ms": null,
  "result": null,
  "error_message": null,
  "current_step": "fetch_hospitals",
  "steps_completed": 2,
  "total_steps": 8
}
```

**Response (Completed)**:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "workflow_name": "emergency_contacts",
  "created_at": "2024-12-18T10:00:00Z",
  "started_at": "2024-12-18T10:00:05Z",
  "completed_at": "2024-12-18T10:00:25Z",
  "duration_ms": 20000,
  "result": {
    "contacts": [
      {
        "name": "Swedish Medical Center",
        "service_type": "hospital",
        "phone": "(206) 744-3000",
        "address": "747 Broadway, Seattle, WA 98122",
        "priority": 1
      }
    ],
    "metadata": {
      "total_tokens": 8000,
      "total_cost": 0.24,
      "llm_calls": [...]
    }
  },
  "error_message": null,
  "current_step": null,
  "steps_completed": null,
  "total_steps": null
}
```

**Response (Failed)**:
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "failed",
  "workflow_name": "emergency_contacts",
  "created_at": "2024-12-18T10:00:00Z",
  "started_at": "2024-12-18T10:00:05Z",
  "completed_at": "2024-12-18T10:00:15Z",
  "duration_ms": 10000,
  "result": null,
  "error_message": "{\"type\":\"APIError\",\"category\":\"EXTERNAL_ERROR\",\"message\":\"OpenRouter API rate limit exceeded\",\"retryable\":true,\"retry_after\":60}",
  "current_step": null,
  "steps_completed": null,
  "total_steps": null
}
```

**Status Values**:
- `pending`: Job created but not yet queued
- `queued`: Job queued in Celery, waiting for worker
- `processing`: Job actively executing
- `completed`: Job finished successfully
- `failed`: Job failed with error
- `cancelled`: Job cancelled by user (future feature)

**Status Codes**:
- `200 OK`: Job found, status returned
- `400 Bad Request`: Invalid job_id format
- `401 Unauthorized`: Missing or invalid API secret
- `404 Not Found`: Job not found
- `500 Internal Server Error`: Database error

**Error Responses**:

```json
// Invalid job ID format
{
  "error": "InvalidJobID",
  "message": "Invalid job ID format (expected UUID): invalid-id",
  "job_id": "invalid-id"
}

// Job not found
{
  "error": "JobNotFound",
  "message": "Job not found: 123e4567-e89b-12d3-a456-426614174000",
  "job_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

### Job Management

#### `GET /api/v1/jobs` - List Jobs

**Description**: Query workflow jobs with filtering and pagination (for admin dashboards)

**Authentication**: Required (`X-API-Secret` header)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `running`, `completed`, `failed`, `all` (default: all) |
| `user_id` | string (UUID) | No | Filter by user ID |
| `limit` | integer (1-200) | No | Max jobs to return (default: 50) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Status Filter Values**:
- `running`: Jobs in `queued` or `processing` state
- `completed`: Jobs in `completed` state
- `failed`: Jobs in `failed` state
- `all` (or omit): All jobs regardless of status

**Response (200 OK)**:
```json
{
  "jobs": [
    {
      "job_id": "123e4567-e89b-12d3-a456-426614174000",
      "workflow_name": "emergency_contacts",
      "status": "completed",
      "priority": 0,
      "user_id": "user-123",
      "created_at": "2025-12-18T10:00:00Z",
      "started_at": "2025-12-18T10:00:05Z",
      "completed_at": "2025-12-18T10:00:25Z",
      "duration_ms": 20000,
      "error_message": null
    },
    {
      "job_id": "456e7890-e12b-34c5-d678-901234567890",
      "workflow_name": "mission_generation",
      "status": "processing",
      "priority": 5,
      "user_id": "user-456",
      "created_at": "2025-12-18T10:05:00Z",
      "started_at": "2025-12-18T10:05:02Z",
      "completed_at": null,
      "duration_ms": null,
      "error_message": null
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

**Response Fields**:
- `jobs`: Array of job summaries (excludes heavy `result_data` and `input_data`)
- `total`: Total jobs matching filter criteria
- `limit`: Number of jobs returned
- `offset`: Starting offset used

**Status Codes**:
- `200 OK`: Jobs retrieved successfully
- `400 Bad Request`: Invalid status filter or user_id format
- `401 Unauthorized`: Missing or invalid API secret
- `500 Internal Server Error`: Database error

**Error Responses**:

```json
// Invalid status filter
{
  "error": "InvalidStatusFilter",
  "message": "Invalid status filter: 'invalid'. Valid values: 'running', 'completed', 'failed', 'all'",
  "valid_values": ["running", "completed", "failed", "all"]
}

// Invalid user_id format
{
  "error": "InvalidUserID",
  "message": "Invalid user_id format (expected UUID): invalid-uuid",
  "user_id": "invalid-uuid"
}
```

**Example Queries**:

```bash
# Get all running jobs
curl "https://llm-service-api.onrender.com/api/v1/jobs?status=running" \
  -H "X-API-Secret: your-secret-key"

# Get completed jobs for specific user
curl "https://llm-service-api.onrender.com/api/v1/jobs?status=completed&user_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "X-API-Secret: your-secret-key"

# Paginated query (page 2, 100 jobs per page)
curl "https://llm-service-api.onrender.com/api/v1/jobs?limit=100&offset=100" \
  -H "X-API-Secret: your-secret-key"

# Get all failed jobs
curl "https://llm-service-api.onrender.com/api/v1/jobs?status=failed" \
  -H "X-API-Secret: your-secret-key"
```

**Use Cases**:
- Admin dashboards showing job queue status
- User activity monitoring
- Debugging failed workflows
- Usage analytics and reporting
- Load monitoring and capacity planning

---

## Webhook System

### Overview

The LLM service delivers results via HMAC-signed webhooks to ensure authenticity and data integrity. Webhooks use exponential backoff retry strategy with up to 4 attempts.

### Webhook Events

| Event Type | Description | Trigger |
|------------|-------------|---------|
| `workflow.completed` | Workflow finished successfully | Job status = completed |
| `workflow.failed` | Workflow execution failed | Job status = failed |
| `llm.step.completed` | Individual LLM step completed | Debug mode only |

### Webhook Headers

All webhook requests include these headers:

```http
Content-Type: application/json
X-Webhook-Signature: sha256=<hmac_hex_digest>
X-Webhook-Event: workflow.completed
User-Agent: LLM Workflow Microservice/1.0.0
```

### HMAC Signature Verification

**Signature Format**: `sha256=<hex_digest>`

**Verification Algorithm**:
```typescript
import { createHmac } from 'crypto';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signature.slice(7); // Remove 'sha256=' prefix
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}
```

**Security Best Practices**:
1. Always verify HMAC signature before processing webhook
2. Use constant-time comparison to prevent timing attacks
3. Reject webhooks with invalid or missing signatures (401 Unauthorized)
4. Log all webhook attempts for audit trail
5. Return 200 OK only after successful processing and signature verification

### Webhook Retry Strategy

**Retry Schedule** (Exponential Backoff):
1. **Attempt 1**: Immediate (0 seconds)
2. **Attempt 2**: +5 seconds delay
3. **Attempt 3**: +15 seconds delay
4. **Attempt 4**: +45 seconds delay (final attempt)

**Retry Triggers**:
- HTTP status codes: 4xx, 5xx (except 200-299)
- Network errors (timeout, connection refused)
- DNS resolution failures

**Permanent Failure**:
After 4 failed attempts, webhook is marked as permanently failed and:
- No further retry attempts
- Admin notification email sent (if configured)
- Job marked with `webhook_permanently_failed = true`

### Webhook Payload Structures

#### `workflow.completed` Event

```json
{
  "event": "workflow.completed",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "workflow_name": "emergency_contacts",
  "result": {
    "contacts": [
      {
        "name": "Swedish Medical Center",
        "service_type": "hospital",
        "phone": "(206) 744-3000",
        "address": "747 Broadway, Seattle, WA 98122",
        "priority": 1
      }
    ],
    "meeting_locations": [
      {
        "name": "Cal Anderson Park",
        "address": "1635 11th Ave, Seattle, WA 98122",
        "coordinates": {"lat": 47.6174, "lng": -122.3201},
        "type": "park"
      }
    ]
  },
  "cost_data": {
    "total_tokens": 8000,
    "cost_usd": 0.24,
    "llm_calls": [
      {
        "step_id": "generate_contacts",
        "model": "anthropic/claude-3.5-sonnet",
        "input_tokens": 5000,
        "output_tokens": 3000,
        "cost_usd": 0.24,
        "duration_ms": 1500
      }
    ]
  },
  "duration_ms": 20000,
  "timestamp": "2024-12-18T10:00:25.000Z"
}
```

#### `workflow.failed` Event (Structured Error)

```json
{
  "event": "workflow.failed",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "failed",
  "workflow_name": "emergency_contacts",
  "error_message": "OpenRouter API rate limit exceeded",
  "error": {
    "type": "RateLimitError",
    "category": "EXTERNAL_ERROR",
    "message": "OpenRouter API rate limit exceeded. Please retry after 60 seconds.",
    "retryable": true,
    "retry_after": 60,
    "step_id": "generate_contacts",
    "details": {
      "service": "openrouter",
      "operation": "chat_completion",
      "suggestions": [
        "Wait 60 seconds before retrying",
        "Reduce request frequency",
        "Upgrade to higher tier plan"
      ]
    }
  },
  "duration_ms": 5000,
  "created_at": "2024-12-18T10:00:00.000Z",
  "timestamp": "2024-12-18T10:00:05.000Z"
}
```

**Error Categories**:
- `USER_ERROR`: Invalid input data, fixable by user
- `CONFIG_ERROR`: Configuration issue (missing API keys, etc.)
- `SYSTEM_ERROR`: Internal system error (database failure, etc.)
- `EXTERNAL_ERROR`: External API failure (OpenRouter, Google Maps, etc.)

#### `llm.step.completed` Event (Debug Mode Only)

```json
{
  "event": "llm.step.completed",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "workflow_name": "emergency_contacts",
  "step_id": "generate_contacts",
  "result": {
    "contacts": [...]
  },
  "tokens": {
    "input": 5000,
    "output": 3000,
    "total": 8000
  },
  "cost_usd": 0.24,
  "duration_ms": 1500,
  "debug": {
    "prompt": "Generate emergency contacts for Seattle, WA...",
    "model": "anthropic/claude-3.5-sonnet",
    "temperature": 0.7
  },
  "timestamp": "2024-12-18T10:00:20.000Z"
}
```

**Note**: `llm.step.completed` events are only sent when `debug_mode: true` in workflow submission.

### Webhook Handler Implementation

**Next.js Route Handler** (`app/api/webhooks/llm/route.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = process.env.LLM_WEBHOOK_SECRET!;

interface WorkflowCompletedPayload {
  event: 'workflow.completed';
  job_id: string;
  status: 'completed';
  workflow_name: string;
  result: any;
  cost_data: {
    total_tokens: number;
    cost_usd: number;
    llm_calls: any[];
  };
  duration_ms: number;
  timestamp: string;
}

interface WorkflowFailedPayload {
  event: 'workflow.failed';
  job_id: string;
  status: 'failed';
  workflow_name: string;
  error_message: string;
  error?: {
    type: string;
    category: 'USER_ERROR' | 'CONFIG_ERROR' | 'SYSTEM_ERROR' | 'EXTERNAL_ERROR';
    message: string;
    retryable: boolean;
    retry_after?: number;
    step_id?: string;
    details?: any;
  };
  duration_ms?: number;
  created_at?: string;
  timestamp: string;
}

type WebhookPayload = WorkflowCompletedPayload | WorkflowFailedPayload;

function verifySignature(payload: string, signature: string): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signature.slice(7);
  const hmac = createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify HMAC signature
    if (!verifySignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse payload
    const payload: WebhookPayload = JSON.parse(rawBody);
    const { event, job_id } = payload;

    console.log(`Webhook received: ${event} for job ${job_id}`);

    // Get Supabase client
    const supabase = await createClient();

    if (event === 'workflow.completed') {
      // Update job status in database
      const { error: updateError } = await supabase
        .from('ai_workflow_jobs')
        .update({
          status: 'completed',
          output: payload.result,
          metadata: payload.cost_data,
          completed_at: new Date().toISOString(),
        })
        .eq('job_id', job_id);

      if (updateError) {
        console.error('Failed to update job status:', updateError);
      }

      // Handle workflow-specific processing
      if (payload.workflow_name === 'emergency_contacts') {
        await handleEmergencyContactsComplete(job_id, payload.result, supabase);
      }

    } else if (event === 'workflow.failed') {
      // Update job with error
      await supabase
        .from('ai_workflow_jobs')
        .update({
          status: 'failed',
          error_message: payload.error_message,
          error_details: payload.error || null,
          completed_at: new Date().toISOString(),
        })
        .eq('job_id', job_id);

      console.error(`Workflow ${job_id} failed:`, payload.error);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Error Handling

### Error Response Format

All API errors follow this standard format:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description",
  "field_name": "additional_context"
}
```

### HTTP Status Codes

| Status Code | Meaning | Common Errors |
|-------------|---------|---------------|
| `200 OK` | Request successful | - |
| `202 Accepted` | Job queued for processing | - |
| `400 Bad Request` | Invalid request data | `WorkflowNotFound`, `InvalidStatusFilter`, `InvalidUserID` |
| `401 Unauthorized` | Authentication failed | `InvalidAPISecret` |
| `404 Not Found` | Resource not found | `JobNotFound` |
| `500 Internal Server Error` | Server error | `DatabaseError`, `CeleryError` |

### Error Categories (Workflow Failures)

Structured error objects in `workflow.failed` webhooks include categorization:

| Category | Description | Handling Strategy |
|----------|-------------|-------------------|
| `USER_ERROR` | Invalid input data | Show user-friendly message, allow correction |
| `CONFIG_ERROR` | Configuration issue | Contact support, check environment variables |
| `SYSTEM_ERROR` | Internal error | Retry later, contact support if persistent |
| `EXTERNAL_ERROR` | API failure | Retry with backoff, show temporary error message |

### Retry Guidance

Structured errors include `retryable` flag and optional `retry_after` seconds:

```typescript
if (error.retryable && error.retry_after) {
  // Wait specified seconds before retry
  setTimeout(() => retryWorkflow(), error.retry_after * 1000);
} else if (!error.retryable) {
  // Permanent failure - show error to user
  showErrorMessage(error.message);
}
```

---

## Rate Limits & Performance

### Request Limits

**Current**: No enforced rate limits (trust-based)

**Recommended Client-Side Limits**:
- Max 10 concurrent workflow submissions
- Max 100 status queries per minute

**Future Implementation**:
- Token bucket algorithm
- Per-user rate limits
- IP-based throttling

### Performance Metrics

**API Response Times** (95th percentile):
- `POST /workflow`: <100ms (excluding Celery queue)
- `GET /status/{job_id}`: <50ms
- `GET /jobs`: <200ms (50 jobs)
- `GET /health`: <100ms

**Workflow Execution Times** (varies by workflow):
- `emergency_contacts`: 15-30 seconds
- `mission_generation`: 30-60 seconds

**Webhook Delivery**:
- Timeout: 30 seconds (configurable)
- Retry delays: 5s, 15s, 45s (exponential backoff)

---

## Next.js Integration Guide

### Quick Start

**1. Environment Configuration** (`.env.local`):

```bash
# LLM Microservice
LLM_SERVICE_URL=https://llm-service-api.onrender.com
LLM_WEBHOOK_SECRET=your-shared-secret-key

# Public webhook URL (for microservice callbacks)
NEXT_PUBLIC_WEBHOOK_BASE_URL=https://beprepared.ai
```

**2. TypeScript Client** (`lib/llm-client.ts`):

```typescript
const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL!;
const LLM_WEBHOOK_SECRET = process.env.LLM_WEBHOOK_SECRET!;
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL!;

export async function submitWorkflow(
  workflowName: string,
  inputData: any,
  userId?: string
) {
  const webhookUrl = `${WEBHOOK_BASE_URL}/api/webhooks/llm`;

  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/workflow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Secret': LLM_WEBHOOK_SECRET,
    },
    body: JSON.stringify({
      workflow_name: workflowName,
      input_data: inputData,
      webhook_url: webhookUrl,
      user_id: userId,
      priority: 0,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Workflow submission failed');
  }

  return response.json();
}

export async function getJobStatus(jobId: string) {
  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/status/${jobId}`, {
    headers: {
      'X-API-Secret': LLM_WEBHOOK_SECRET,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get job status');
  }

  return response.json();
}
```

**3. Server Action** (`actions/llm-workflows.ts`):

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { submitWorkflow } from '@/lib/llm-client';
import { revalidatePath } from 'next/cache';

export async function generateEmergencyContacts(formData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const job = await submitWorkflow('emergency_contacts', formData, user.id);

    // Store job_id in database
    await supabase.from('ai_workflow_jobs').insert({
      job_id: job.job_id,
      user_id: user.id,
      workflow_name: 'emergency_contacts',
      status: job.status,
      created_at: new Date().toISOString(),
    });

    return { success: true, jobId: job.job_id };
  } catch (error) {
    console.error('Workflow submission failed:', error);
    throw error;
  }
}
```

**4. Webhook Handler** (see [Webhook Handler Implementation](#webhook-handler-implementation))

**5. Database Schema** (Drizzle ORM):

```typescript
export const aiWorkflowJobs = pgTable('ai_workflow_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  workflowName: varchar('workflow_name', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('queued'),
  output: jsonb('output'),
  errorMessage: text('error_message'),
  errorDetails: jsonb('error_details'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});
```

### Production Checklist

- [ ] Set `LLM_SERVICE_URL` to production URL
- [ ] Set `LLM_WEBHOOK_SECRET` (must match microservice)
- [ ] Set `NEXT_PUBLIC_WEBHOOK_BASE_URL` to production domain
- [ ] Verify webhook endpoint is publicly accessible
- [ ] Test HMAC signature verification
- [ ] Add database indexes for `job_id` lookups
- [ ] Set up monitoring for webhook failures
- [ ] Configure retry logic for failed webhooks
- [ ] Test error handling for all error categories
- [ ] Set up alerting for permanent webhook failures

---

## Support

- **Documentation**: See `README.md`, `WORKFLOW_SCHEMA.md`, `TESTING_GUIDE.md`
- **GitHub Issues**: Report bugs and feature requests
- **Email**: support@beprepared.ai

---

## License

MIT License - see LICENSE file for details.

---

**Last Updated**: December 18, 2024
**API Version**: v1.0.0
**Service**: LLM Workflow Microservice
