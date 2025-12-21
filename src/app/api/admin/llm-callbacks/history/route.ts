import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { llmCallbacks } from '@/db/schema/llm-callbacks';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/admin/llm-callbacks/history
 * Fetch paginated callback history for admin users
 *
 * Query params:
 * - limit: number (default: 25, max: 100)
 * - offset: number (default: 0)
 *
 * Response: { callbacks: CallbackListItem[] }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Verify admin role
    const [profile] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = Math.min(parseInt(limitParam || '25', 10), 100);
    const offset = parseInt(offsetParam || '0', 10);

    // 4. Fetch callbacks with pagination
    const callbacks = await db
      .select({
        id: llmCallbacks.id,
        callbackId: llmCallbacks.callbackId,
        signatureValid: llmCallbacks.signatureValid,
        eventType: llmCallbacks.eventType,
        workflowName: llmCallbacks.workflowName,
        payloadPreview: llmCallbacks.payloadPreview,
        createdAt: llmCallbacks.createdAt,
      })
      .from(llmCallbacks)
      .orderBy(desc(llmCallbacks.createdAt))
      .limit(limit)
      .offset(offset);

    // 5. Format dates as ISO strings
    const formattedCallbacks = callbacks.map(callback => ({
      ...callback,
      createdAt: callback.createdAt.toISOString(),
    }));

    return NextResponse.json({ callbacks: formattedCallbacks });
  } catch (error) {
    console.error('[API] Error fetching callback history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
