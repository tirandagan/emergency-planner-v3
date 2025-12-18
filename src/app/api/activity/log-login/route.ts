import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, userActivityLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logSystemError } from '@/lib/system-logger';

export async function POST(request: NextRequest) {
  let userId: string | undefined;

  try {
    const body = await request.json();
    userId = body.userId;

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

      await logSystemError(activityError, {
        category: 'database_error',
        userId,
        component: 'ActivityLog',
        route: '/api/activity/log-login',
        userAction: 'Logging user login activity to database',
      });

      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Activity] Error logging login activity:', error);

    await logSystemError(error, {
      category: 'database_error',
      userId,
      component: 'ActivityLog',
      route: '/api/activity/log-login',
      userAction: 'Updating last login timestamp',
    });

    return NextResponse.json(
      { error: 'Failed to log login activity' },
      { status: 500 }
    );
  }
}
