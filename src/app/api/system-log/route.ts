import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logSystemError, type LogErrorOptions } from '@/lib/system-logger';
import { headers } from 'next/headers';

/**
 * POST /api/system-log
 * Log a client-side error to the system logs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      error: errorMessage,
      errorName,
      errorCode,
      severity,
      category,
      component,
      route,
      userAction,
      metadata,
    } = body;

    if (!errorMessage) {
      return NextResponse.json(
        { error: 'Error message is required' },
        { status: 400 }
      );
    }

    // Get user info if authenticated
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // User not authenticated, continue without userId
    }

    // Get request metadata
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || undefined;
    const forwardedFor = headersList.get('x-forwarded-for');
    const ipAddress = forwardedFor?.split(',')[0].trim() || undefined;

    // Create an error object for logging
    const error = new Error(errorMessage);
    error.name = errorName || 'ClientError';

    // Prepare log options
    const logOptions: LogErrorOptions = {
      severity: severity || 'error',
      category: category || 'api_error',
      errorCode,
      userId,
      userAction,
      component,
      route,
      metadata: {
        ...metadata,
        source: 'client',
      },
      userAgent,
      ipAddress,
      notifyAdmin: severity === 'critical' || severity === 'error',
    };

    // Log the error
    const logId = await logSystemError(error, logOptions);

    return NextResponse.json({
      success: true,
      logId,
      message: 'Error logged successfully',
    });
  } catch (error) {
    console.error('[SystemLog API] Failed to log error:', error);
    return NextResponse.json(
      { error: 'Failed to log error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
