# API Integration Guide

**Complete guide for integrating the LLM Workflow Microservice with Next.js 15+ applications.**

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [TypeScript Client](#typescript-client)
- [Webhook Handler](#webhook-handler)
- [Workflow Examples](#workflow-examples)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

---

## Overview

The LLM Workflow Microservice exposes a REST API for submitting AI workflows and delivers results via HMAC-signed webhooks. This guide shows how to integrate it with your Next.js application.

### Integration Architecture

```
Next.js App (Port 3000)          LLM Microservice (Port 8000)
┌─────────────────────────┐      ┌──────────────────────────┐
│                         │      │                          │
│  Server Action          │─────▶│  POST /api/v1/jobs       │
│  submitWorkflow()       │      │                          │
│                         │      │  (Returns job_id)        │
└─────────────────────────┘      └──────────────────────────┘
         ▲                                   │
         │                                   │ Webhook
         │                                   ▼
┌─────────────────────────┐      ┌──────────────────────────┐
│                         │◀─────│  Workflow Complete       │
│  Webhook Handler        │      │  (HMAC Signed)           │
│  /api/webhooks/llm      │      │                          │
│                         │      │  {job_id, output, cost}  │
└─────────────────────────┘      └──────────────────────────┘
```

### Key Concepts

1. **Async Execution**: Submit job → Get job_id → Receive webhook when complete
2. **Webhook Notifications**: Receive results via POST to your webhook endpoint
3. **HMAC Verification**: Verify webhook authenticity with shared secret
4. **Cost Tracking**: Receive token usage and cost data in webhook payload

---

## Prerequisites

- **Next.js 15+** with App Router
- **TypeScript 5+** (strict mode recommended)
- **LLM Microservice** deployed and accessible
- **Webhook endpoint** publicly accessible (ngrok for local development)

---

## Environment Setup

### Next.js Application (.env.local)

```bash
# LLM Microservice Configuration
LLM_SERVICE_URL=http://localhost:8000  # Local Docker
# LLM_SERVICE_URL=https://llm-service-api.onrender.com  # Production

# Webhook Secret (must match microservice LLM_WEBHOOK_SECRET)
LLM_WEBHOOK_SECRET=your-shared-secret-key-here

# Public webhook URL (for microservice to call back)
NEXT_PUBLIC_WEBHOOK_BASE_URL=https://your-app.com
# NEXT_PUBLIC_WEBHOOK_BASE_URL=https://abc123.ngrok.io  # Local dev with ngrok
```

### Local Development with ngrok

For local development, use ngrok to expose your webhook endpoint:

```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Copy the HTTPS URL and set as NEXT_PUBLIC_WEBHOOK_BASE_URL
# Example: https://abc123.ngrok.io
```

---

## TypeScript Client

### Client Implementation

Create `src/lib/llm-microservice-client.ts`:

```typescript
import type { WizardFormData } from '@/types/wizard';

const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || 'http://localhost:3000';

export interface JobSubmission {
  workflow_name: string;
  input_data: unknown;
  webhook_url: string;
  webhook_secret?: string;
  user_id?: string;
  debug_mode?: boolean;
}

export interface JobResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  workflow_name: string;
  created_at: string;
}

export interface JobStatus extends JobResponse {
  output?: unknown;
  error_message?: string;
  metadata?: {
    duration_ms: number;
    total_tokens: number;
    total_cost_usd: number;
  };
  completed_at?: string;
}

export interface WorkflowError {
  type: string;
  category: 'USER_ERROR' | 'CONFIG_ERROR' | 'SYSTEM_ERROR' | 'EXTERNAL_ERROR';
  message: string;
  retryable: boolean;
  retry_after?: number;
  step_id?: string;
  details?: {
    service?: string;
    operation?: string;
    suggestions?: string[];
  };
}

/**
 * Submit a workflow job to the LLM microservice
 */
export async function submitWorkflow(
  workflowName: string,
  inputData: unknown,
  userId?: string,
  debugMode: boolean = false
): Promise<JobResponse> {
  const webhookUrl = `${WEBHOOK_BASE_URL}/api/webhooks/llm`;

  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workflow_name: workflowName,
      input_data: inputData,
      webhook_url: webhookUrl,
      user_id: userId,
      debug_mode: debugMode,
    } satisfies JobSubmission),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to submit workflow: ${error.detail || response.statusText}`);
  }

  return response.json();
}

/**
 * Get job status and results
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/jobs/${jobId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get job status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Validate a workflow JSON file before submission
 */
export async function validateWorkflow(workflowName: string): Promise<{ valid: boolean; errors?: string[] }> {
  const response = await fetch(`${LLM_SERVICE_URL}/api/v1/workflows/${workflowName}/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.json();
}
```

### Usage in Server Actions

Create `src/actions/llm-workflows.ts`:

```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { submitWorkflow, getJobStatus } from '@/lib/llm-microservice-client';
import { revalidatePath } from 'next/cache';
import type { WizardFormData } from '@/types/wizard';

export async function generateEmergencyContacts(formData: WizardFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Submit workflow to microservice
    const job = await submitWorkflow(
      'emergency_contacts',
      {
        formData,
        city: formData.location.city,
        state: formData.location.state,
        lat: formData.location.coordinates.lat,
        lng: formData.location.coordinates.lng,
        scenarios: formData.scenarios,
        familySize: formData.familyMembers.length,
        duration: `${formData.durationDays}_days`,
        userTier: 'BASIC', // From user profile
        staticContacts: '', // Optional pre-filled data
      },
      user.id,
      false // debug_mode
    );

    // Store job_id in database for tracking
    // The webhook will update this record when complete
    const { error } = await supabase
      .from('ai_workflow_jobs')
      .insert({
        job_id: job.job_id,
        user_id: user.id,
        workflow_name: job.workflow_name,
        status: job.status,
        created_at: job.created_at,
      });

    if (error) {
      console.error('Failed to store job in database:', error);
    }

    return {
      success: true,
      jobId: job.job_id,
      status: job.status,
    };
  } catch (error) {
    console.error('Error submitting workflow:', error);
    throw error;
  }
}

export async function generateMissionPlan(formData: WizardFormData, bundles: unknown[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const job = await submitWorkflow(
      'mission_generation',
      {
        formData,
        bundles,
        familyDetails: formData.familyMembers.map((m, i) =>
          `Person ${i + 1}: ${m.age < 18 ? 'child' : m.age >= 65 ? 'senior' : 'adult'} (age ${m.age})${m.medicalConditions ? `; medical: ${m.medicalConditions}` : ''}${m.specialNeeds ? `; special needs: ${m.specialNeeds}` : ''}`
        ).join('\n- '),
        mobility: 'BUG_IN',
        budgetTierLabel: getBudgetTierLabel(formData.budgetTier),
        budgetAmount: getBudgetAmount(formData.budgetTier),
      },
      user.id
    );

    return {
      success: true,
      jobId: job.job_id,
      status: job.status,
    };
  } catch (error) {
    console.error('Error submitting mission generation:', error);
    throw error;
  }
}

// Helper functions
function getBudgetTierLabel(tier: string): string {
  const tiers: Record<string, string> = {
    LOW: 'Tight Budget (<$500)',
    MEDIUM: 'Moderate Budget ($500-1,500)',
    HIGH: 'Premium Budget ($1,500+)',
  };
  return tiers[tier] || 'Moderate Budget ($500-1,500)';
}

function getBudgetAmount(tier: string): number {
  const budgets: Record<string, number> = {
    LOW: 350,
    MEDIUM: 1000,
    HIGH: 2000,
  };
  return budgets[tier] || 1000;
}
```

---

## Webhook Handler

### Webhook Route Handler

Create `src/app/api/webhooks/llm/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = process.env.LLM_WEBHOOK_SECRET!;

interface WebhookPayload {
  event: 'workflow.completed' | 'workflow.failed';
  job_id: string;
  status: string;
  workflow_name: string;
  output?: unknown;
  error?: {
    type: string;
    category: string;
    message: string;
    retryable: boolean;
  };
  metadata?: {
    duration_ms: number;
    total_tokens: number;
    total_cost_usd: number;
  };
}

/**
 * Verify HMAC signature from webhook
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signature.slice(7); // Remove 'sha256=' prefix
  const hmac = createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}

/**
 * Handle webhook POST requests from LLM microservice
 */
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
    const { event, job_id, status, workflow_name, output, error, metadata } = payload;

    console.log(`Webhook received: ${event} for job ${job_id}`);

    // Get Supabase client
    const supabase = await createClient();

    if (event === 'workflow.completed') {
      // Update job status in database
      const { error: updateError } = await supabase
        .from('ai_workflow_jobs')
        .update({
          status: 'completed',
          output,
          metadata,
          completed_at: new Date().toISOString(),
        })
        .eq('job_id', job_id);

      if (updateError) {
        console.error('Failed to update job status:', updateError);
      }

      // Log AI usage for cost tracking
      if (metadata) {
        // Get user_id from job record
        const { data: job } = await supabase
          .from('ai_workflow_jobs')
          .select('user_id')
          .eq('job_id', job_id)
          .single();

        if (job?.user_id) {
          await supabase.from('userActivityLog').insert({
            userId: job.user_id,
            action: `llm_workflow_${workflow_name}`,
            metadata: {
              job_id,
              model: 'anthropic/claude-3.5-sonnet',
              tokens: metadata.total_tokens,
              cost_usd: metadata.total_cost_usd,
              duration_ms: metadata.duration_ms,
            },
          });
        }
      }

      // Workflow-specific handling
      if (workflow_name === 'emergency_contacts') {
        await handleEmergencyContactsComplete(job_id, output, supabase);
      } else if (workflow_name === 'mission_generation') {
        await handleMissionGenerationComplete(job_id, output, supabase);
      }

    } else if (event === 'workflow.failed') {
      // Update job with error
      await supabase
        .from('ai_workflow_jobs')
        .update({
          status: 'failed',
          error_message: error?.message || 'Workflow failed',
          error_details: error,
          completed_at: new Date().toISOString(),
        })
        .eq('job_id', job_id);

      console.error(`Workflow ${job_id} failed:`, error);
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

/**
 * Handle emergency contacts workflow completion
 */
async function handleEmergencyContactsComplete(
  jobId: string,
  output: unknown,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  // Cast output to expected type
  const result = output as {
    contacts: Array<{
      name: string;
      service_type: string;
      phone: string;
      address: string;
      priority: number;
    }>;
    meeting_locations: Array<{
      name: string;
      address: string;
      coordinates: { lat: number; lng: number };
    }>;
  };

  // Store contacts in database or send notification
  console.log(`Emergency contacts generated for job ${jobId}:`, result);

  // Optional: Store in a separate table
  // await supabase.from('emergency_contacts').insert({
  //   job_id: jobId,
  //   contacts: result.contacts,
  //   meeting_locations: result.meeting_locations,
  // });
}

/**
 * Handle mission generation workflow completion
 */
async function handleMissionGenerationComplete(
  jobId: string,
  output: unknown,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  const result = output as {
    mission_plan: string;
    parsed_sections: Record<string, string>;
    llm_usage: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      cost_usd: number;
    };
  };

  console.log(`Mission plan generated for job ${jobId}:`, {
    length: result.mission_plan.length,
    tokens: result.llm_usage.total_tokens,
    cost: result.llm_usage.cost_usd,
  });

  // Optional: Store mission plan
  // await supabase.from('mission_reports').insert({
  //   job_id: jobId,
  //   content: result.mission_plan,
  //   parsed_sections: result.parsed_sections,
  // });
}
```

### Database Schema for Job Tracking

Add to your Drizzle schema:

```typescript
// src/db/schema/ai-workflows.ts
import { pgTable, uuid, text, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core';

export const aiWorkflowJobs = pgTable('ai_workflow_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
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

---

## Workflow Examples

### Emergency Contacts Generation

```typescript
// In your form submission handler
async function handleEmergencyContactsSubmit(formData: WizardFormData) {
  const { jobId } = await generateEmergencyContacts(formData);

  // Redirect to status page or show loading state
  router.push(`/dashboard/jobs/${jobId}`);

  // The webhook will update the database when complete
  // Your UI can poll the database or use real-time subscriptions
}
```

### Mission Plan Generation

```typescript
async function handleMissionPlanSubmit(formData: WizardFormData) {
  // Load product bundles from database
  const bundles = await db.query.bundles.findMany({
    where: eq(bundles.isActive, true),
  });

  const { jobId } = await generateMissionPlan(formData, bundles);

  // Show loading state with job_id
  router.push(`/dashboard/jobs/${jobId}`);
}
```

### Polling for Job Status

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export function JobStatusPolling({ jobId }: { jobId: string }) {
  const [status, setStatus] = useState<string>('queued');
  const [output, setOutput] = useState<unknown>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`job:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_workflow_jobs',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          setStatus(payload.new.status);
          setOutput(payload.new.output);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  if (status === 'queued' || status === 'processing') {
    return <div>Processing workflow... Status: {status}</div>;
  }

  if (status === 'completed') {
    return <div>Workflow complete! Output: {JSON.stringify(output)}</div>;
  }

  if (status === 'failed') {
    return <div>Workflow failed. Please try again.</div>;
  }

  return null;
}
```

---

## Error Handling

### Error Categories

The microservice returns structured errors in four categories:

| Category | Description | Handling Strategy |
|----------|-------------|-------------------|
| `USER_ERROR` | Invalid input | Show user-friendly message, allow correction |
| `CONFIG_ERROR` | Configuration issue | Contact support, check environment variables |
| `SYSTEM_ERROR` | Internal error | Retry later, contact support if persistent |
| `EXTERNAL_ERROR` | API failure | Retry with backoff, show temporary error message |

### Error Handling Pattern

```typescript
try {
  const job = await submitWorkflow(workflowName, inputData, userId);
  return { success: true, jobId: job.job_id };
} catch (error) {
  if (error instanceof Error) {
    // Parse error response
    try {
      const errorData = JSON.parse(error.message);

      if (errorData.category === 'USER_ERROR') {
        // Show user-friendly error
        return {
          success: false,
          error: errorData.message,
          retryable: false,
        };
      } else if (errorData.category === 'EXTERNAL_ERROR' && errorData.retryable) {
        // Show retry option
        return {
          success: false,
          error: errorData.message,
          retryable: true,
          retryAfter: errorData.retry_after || 30,
        };
      }
    } catch {
      // Fallback for non-JSON errors
      return {
        success: false,
        error: error.message,
        retryable: false,
      };
    }
  }

  throw error;
}
```

---

## Type Definitions

### Shared Types

Create `src/types/llm-workflows.ts`:

```typescript
export interface EmergencyContact {
  name: string;
  service_type: string;
  phone: string;
  address: string;
  priority: number;
  distance_miles?: number;
  hours?: string;
}

export interface MeetingLocation {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type: string;
}

export interface EmergencyContactsOutput {
  contacts: EmergencyContact[];
  meeting_locations: MeetingLocation[];
}

export interface MissionPlanOutput {
  mission_plan: string;
  parsed_sections: {
    executive_summary?: string;
    risk_assessment?: string;
    recommended_bundles?: string;
    survival_skills?: string;
    day_by_day?: string;
    next_steps?: string;
  };
  llm_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd: number;
  };
  cost_data: {
    provider: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd: number;
  };
}

export interface WorkflowJob {
  job_id: string;
  user_id: string;
  workflow_name: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  output?: EmergencyContactsOutput | MissionPlanOutput;
  error_message?: string;
  error_details?: {
    type: string;
    category: string;
    message: string;
    retryable: boolean;
  };
  metadata?: {
    duration_ms: number;
    total_tokens: number;
    total_cost_usd: number;
  };
  created_at: string;
  completed_at?: string;
}
```

---

## Testing

### Unit Tests for Client

```typescript
// src/lib/__tests__/llm-microservice-client.test.ts
import { submitWorkflow, getJobStatus } from '../llm-microservice-client';

describe('LLM Microservice Client', () => {
  it('should submit workflow successfully', async () => {
    const response = await submitWorkflow('test_workflow', { test: 'data' });
    expect(response.job_id).toBeDefined();
    expect(response.status).toBe('queued');
  });

  it('should get job status', async () => {
    const job = await submitWorkflow('test_workflow', { test: 'data' });
    const status = await getJobStatus(job.job_id);
    expect(status.job_id).toBe(job.job_id);
  });
});
```

### Integration Tests

```bash
# Test webhook handler with test server
cd LLM_service/tests/webhook_test_server
python app.py

# Submit test workflow
curl -X POST http://localhost:8000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_name": "emergency_contacts",
    "input_data": {...},
    "webhook_url": "http://localhost:5001/webhook"
  }'

# Verify webhook received at http://localhost:5001
```

---

## Production Deployment

### Checklist

- [ ] Set `LLM_SERVICE_URL` to production URL
- [ ] Set `LLM_WEBHOOK_SECRET` (must match microservice)
- [ ] Set `NEXT_PUBLIC_WEBHOOK_BASE_URL` to production domain
- [ ] Verify webhook endpoint is publicly accessible
- [ ] Test HMAC signature verification
- [ ] Add database indexes for `job_id` lookups
- [ ] Set up monitoring for webhook failures
- [ ] Configure retry logic for failed webhooks

### Environment Variables (Production)

```bash
# Next.js Production
LLM_SERVICE_URL=https://llm-service-api.onrender.com
LLM_WEBHOOK_SECRET=<strong-random-secret>
NEXT_PUBLIC_WEBHOOK_BASE_URL=https://beprepared.ai
```

### Security Considerations

1. **HMAC Verification**: Always verify webhook signatures in production
2. **HTTPS Only**: Use HTTPS for both API and webhook endpoints
3. **Secret Rotation**: Rotate webhook secret periodically
4. **Rate Limiting**: Implement rate limiting on webhook endpoint
5. **Logging**: Log all webhook attempts for audit trail

---

## Support

- **Documentation**: See [README.md](README.md) and [WORKFLOW_SCHEMA.md](WORKFLOW_SCHEMA.md)
- **Issues**: GitHub Issues
- **Email**: support@beprepared.ai

---

## License

MIT License - see [LICENSE](LICENSE) file for details.
