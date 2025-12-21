import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { markCallbackAsViewed } from '@/lib/llm-callbacks';

/**
 * POST /api/admin/llm-callbacks/mark-viewed
 * Mark an LLM callback as viewed by the current admin user
 *
 * Request body: { callbackId: string }
 * Response: { success: boolean, error?: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
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
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { callbackId } = body;

    if (!callbackId || typeof callbackId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid callback ID' },
        { status: 400 }
      );
    }

    // 4. Mark callback as viewed (idempotent)
    await markCallbackAsViewed(callbackId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Error marking callback as viewed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
