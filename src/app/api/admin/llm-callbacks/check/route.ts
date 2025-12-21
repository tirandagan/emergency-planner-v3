import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { getRecentCallbacks } from '@/lib/llm-callbacks';

/**
 * GET /api/admin/llm-callbacks/check
 * Cursor-based polling endpoint for admin notifications
 * Query params:
 *   - after: ISO timestamp cursor (optional)
 *   - limit: Max results (optional, default 20)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify admin role
    const [currentUser] = await db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // 3. Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const afterCursor = searchParams.get('after') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 4. Validate limit parameter
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // 5. Fetch callbacks using cursor-based pagination
    const { items, nextCursor } = await getRecentCallbacks(afterCursor, limit);

    // 6. Return callbacks with next cursor for pagination
    return NextResponse.json(
      {
        items: items.map((callback) => ({
          id: callback.id,
          callbackId: callback.callbackId,
          eventType: callback.eventType,
          workflowName: callback.workflowName,
          signatureValid: callback.signatureValid,
          payloadPreview: callback.payloadPreview,
          createdAt: callback.createdAt.toISOString(),
        })),
        nextCursor,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Admin API] Error fetching callbacks:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
