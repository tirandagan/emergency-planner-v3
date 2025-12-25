/**
 * GET /api/llm-service/jobs/[jobId]
 * Get the status of a workflow job
 * Proxy endpoint that forwards requests with API secret authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';
const LLM_WEBHOOK_SECRET = process.env.LLM_WEBHOOK_SECRET;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check webhook secret configuration
    if (!LLM_WEBHOOK_SECRET) {
      console.error('[LLM Service] Webhook secret not configured');
      return NextResponse.json(
        { error: 'LLM service not configured' },
        { status: 500 }
      );
    }

    // Await params (Next.js 15 requirement)
    const { jobId } = await params;

    // Forward request to LLM service
    const response = await fetch(`${LLM_SERVICE_URL}/api/v1/jobs/${jobId}`, {
      headers: {
        'X-API-Secret': LLM_WEBHOOK_SECRET,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));

      console.error('[LLM Service] Job status fetch failed:', errorData);

      return NextResponse.json(
        { error: errorData.error || 'Failed to get job status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[LLM Service] Job status error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
