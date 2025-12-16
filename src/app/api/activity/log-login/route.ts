import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, userActivityLog } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update last_login_at timestamp
    await db
      .update(profiles)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(profiles.id, userId));

    // Log activity to userActivityLog table
    try {
      await db.insert(userActivityLog).values({
        userId,
        activityType: 'login',
        metadata: {
          timestamp: new Date().toISOString(),
        },
        createdAt: new Date(),
      });
      console.log(`[Activity] Logged login activity for user ${userId}`);
    } catch (activityError) {
      console.error('[Activity] Failed to log user activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Activity] Error logging login activity:', error);
    return NextResponse.json(
      { error: 'Failed to log login activity' },
      { status: 500 }
    );
  }
}
