import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';
import { getCallbackById } from '@/lib/llm-callbacks';

/**
 * GET /api/admin/llm-callbacks/[id]
 * Fetch full callback details with viewed status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: callbackId } = await params;

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

    // 3. Fetch callback details with viewed status
    const callback = await getCallbackById(callbackId, user.id);

    if (!callback) {
      return NextResponse.json(
        { error: 'Callback not found' },
        { status: 404 }
      );
    }

    // 4. Return full callback details
    return NextResponse.json(callback, { status: 200 });
  } catch (error) {
    console.error('[Admin API] Error fetching callback details:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
