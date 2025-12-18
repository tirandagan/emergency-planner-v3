import { db } from '@/db';
import { eq } from 'drizzle-orm';
import {
  systemLogs,
  type SystemLogSeverity,
  type SystemLogCategory,
  type NewSystemLog,
} from '@/db/schema/system-logs';
import { sendAdminErrorNotification } from './admin-notifications';

/**
 * System Logger Options
 */
export interface LogErrorOptions {
  severity?: SystemLogSeverity;
  category?: SystemLogCategory;
  errorCode?: string;
  userId?: string;
  userAction?: string;
  component?: string;
  route?: string;
  stackTrace?: string;
  requestData?: Record<string, unknown>;
  responseData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  notifyAdmin?: boolean;
}

/**
 * Error context for user-friendly messages
 */
export interface ErrorContext {
  userMessage: string;
  developerMessage: string;
  suggestion?: string;
}

/**
 * Known error patterns with user-friendly messages and resolution hints
 */
const ERROR_PATTERNS: Record<
  string,
  { userMessage: string; suggestion: string; category: SystemLogCategory }
> = {
  // Google Maps/Places API Errors
  RefererNotAllowedMapError: {
    userMessage:
      'Location services are temporarily unavailable. Our team has been notified and is working on it.',
    suggestion:
      'Add the production domain to Google Cloud Console > APIs & Services > Credentials > API Key restrictions. Add both the root domain (beprepared.ai) and with www prefix.',
    category: 'external_service',
  },
  ApiNotActivatedMapError: {
    userMessage:
      'Location services are not available. Our team has been notified.',
    suggestion:
      'Enable the Google Maps JavaScript API, Places API, and Geocoding API in Google Cloud Console for this project.',
    category: 'external_service',
  },
  InvalidKeyMapError: {
    userMessage:
      'Location services are temporarily unavailable. Please try again later.',
    suggestion:
      'Verify the Google Maps API key is correct in environment variables (NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY).',
    category: 'external_service',
  },
  OverQueryLimitMapError: {
    userMessage:
      'Location services are busy. Please try again in a few moments.',
    suggestion:
      'Check Google Cloud Console for quota limits. Consider upgrading the API billing plan or implementing rate limiting.',
    category: 'external_service',
  },
  RequestDeniedMapError: {
    userMessage:
      'Location request was denied. Please try again or enter your location manually.',
    suggestion:
      'Check API key restrictions and ensure the referrer is allowed. Verify API is enabled for the correct project.',
    category: 'external_service',
  },

  // OpenRouter/AI Errors
  OPENROUTER_RATE_LIMIT: {
    userMessage:
      'Our AI service is experiencing high demand. Please try again in a moment.',
    suggestion:
      'Implement request queuing or increase rate limits with OpenRouter. Consider caching responses.',
    category: 'ai_error',
  },
  OPENROUTER_INVALID_KEY: {
    userMessage:
      'AI services are temporarily unavailable. Our team has been notified.',
    suggestion:
      'Verify OPENROUTER_API_KEY is correct and has sufficient credits.',
    category: 'ai_error',
  },

  // Stripe Errors
  stripe_card_declined: {
    userMessage:
      'Your card was declined. Please try a different payment method.',
    suggestion:
      'No action needed - this is a user card issue. Consider showing specific decline reason.',
    category: 'payment_error',
  },

  // Auth Errors
  Profile_fetch_timeout: {
    userMessage:
      'Loading took longer than expected. Please refresh the page.',
    suggestion:
      'Check Supabase connection and database performance. Consider adding connection pooling.',
    category: 'auth_error',
  },

  // Default/Unknown
  UNKNOWN_ERROR: {
    userMessage:
      'Something went wrong. Our team has been notified and is looking into it.',
    suggestion:
      'Review the stack trace and metadata for more context.',
    category: 'system_error',
  },
};

/**
 * Sanitize request/response data before logging to prevent sensitive information exposure
 * Recursively redacts sensitive keys like passwords, API keys, tokens, etc.
 */
function sanitizeLogData(
  data: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'apikey',
    'api_key',
    'secret',
    'token',
    'authorization',
    'creditcard',
    'cardnumber',
    'cvv',
    'ssn',
    'privatekey',
    'private_key',
    'resend_api_key',
    'openrouter_api_key',
    'stripe_secret_key',
    'next_public_google_services_api_key',
    'access_token',
    'refresh_token',
    'bearer',
    'x-api-key',
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains any sensitive pattern
    const isSensitive = sensitiveKeys.some((sensitiveKey) =>
      lowerKey.includes(sensitiveKey)
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      // Sanitize arrays of objects
      sanitized[key] = value.map((item) =>
        typeof item === 'object' && item !== null
          ? sanitizeLogData(item as Record<string, unknown>)
          : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Parse error to extract meaningful information
 */
function parseError(error: unknown): {
  message: string;
  errorName: string;
  errorCode: string;
  stackTrace?: string;
} {
  if (error instanceof Error) {
    // Try to extract error code from message
    let errorCode = 'UNKNOWN_ERROR';

    // Check for Google Maps errors
    const googleErrorMatch = error.message.match(
      /(RefererNotAllowedMapError|ApiNotActivatedMapError|InvalidKeyMapError|OverQueryLimitMapError|RequestDeniedMapError)/
    );
    if (googleErrorMatch) {
      errorCode = googleErrorMatch[1];
    }

    // Check for OpenRouter errors
    if (error.message.includes('rate limit')) {
      errorCode = 'OPENROUTER_RATE_LIMIT';
    } else if (error.message.includes('invalid key')) {
      errorCode = 'OPENROUTER_INVALID_KEY';
    }

    // Check for profile fetch timeout
    if (error.message.includes('Profile fetch timeout')) {
      errorCode = 'Profile_fetch_timeout';
    }

    return {
      message: error.message,
      errorName: error.name || 'Error',
      errorCode,
      stackTrace: error.stack,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      errorName: 'StringError',
      errorCode: 'UNKNOWN_ERROR',
    };
  }

  return {
    message: JSON.stringify(error) || 'Unknown error',
    errorName: 'UnknownError',
    errorCode: 'UNKNOWN_ERROR',
  };
}

/**
 * Get error context with user-friendly and developer messages
 */
export function getErrorContext(error: unknown): ErrorContext {
  const { message, errorCode } = parseError(error);
  const pattern = ERROR_PATTERNS[errorCode] || ERROR_PATTERNS.UNKNOWN_ERROR;

  return {
    userMessage: pattern.userMessage,
    developerMessage: message,
    suggestion: pattern.suggestion,
  };
}

/**
 * Log a system error with optional admin notification
 */
export async function logSystemError(
  error: unknown,
  options: LogErrorOptions = {}
): Promise<string | null> {
  const parsed = parseError(error);
  const pattern = ERROR_PATTERNS[parsed.errorCode] || ERROR_PATTERNS.UNKNOWN_ERROR;

  // Determine severity based on error type
  const severity =
    options.severity ||
    (parsed.errorCode === 'UNKNOWN_ERROR' ? 'error' : 'warning');

  // Determine category from pattern or options
  const category = options.category || pattern.category;

  // Log to console for developers
  const consolePrefix = `[SystemLog:${severity.toUpperCase()}]`;
  const consoleMessage = `${consolePrefix} [${category}] ${parsed.errorName}: ${parsed.message}`;

  if (severity === 'critical' || severity === 'error') {
    console.error(consoleMessage);
    if (parsed.stackTrace) {
      console.error(`Stack trace:\n${parsed.stackTrace}`);
    }
    console.error(`Resolution suggestion: ${pattern.suggestion}`);
  } else if (severity === 'warning') {
    console.warn(consoleMessage);
    console.warn(`Resolution suggestion: ${pattern.suggestion}`);
  } else {
    console.log(consoleMessage);
  }

  // Additional context logging for developers
  if (options.component) {
    console.log(`  Component: ${options.component}`);
  }
  if (options.route) {
    console.log(`  Route: ${options.route}`);
  }
  if (options.userId) {
    console.log(`  User ID: ${options.userId}`);
  }
  if (options.userAction) {
    console.log(`  User Action: ${options.userAction}`);
  }

  try {
    // Sanitize request and response data before logging
    const sanitizedRequestData = sanitizeLogData(options.requestData);
    const sanitizedResponseData = sanitizeLogData(options.responseData);

    // Prepare log entry
    const logEntry: NewSystemLog = {
      severity,
      category,
      errorCode: parsed.errorCode,
      errorName: parsed.errorName,
      message: parsed.message,
      userId: options.userId || null,
      userAction: options.userAction,
      component: options.component,
      route: options.route,
      stackTrace: options.stackTrace || parsed.stackTrace,
      requestData: sanitizedRequestData,
      responseData: sanitizedResponseData,
      metadata: {
        ...options.metadata,
        suggestion: pattern.suggestion,
      },
      userAgent: options.userAgent,
      ipAddress: options.ipAddress,
    };

    // Insert log entry
    const [result] = await db
      .insert(systemLogs)
      .values(logEntry)
      .returning({ id: systemLogs.id });

    const logId = result.id;

    // Send admin notification for critical/error severity
    const shouldNotify =
      options.notifyAdmin !== false &&
      (severity === 'critical' || severity === 'error');

    if (shouldNotify) {
      try {
        await sendAdminErrorNotification({
          logId,
          severity,
          category,
          errorCode: parsed.errorCode,
          errorName: parsed.errorName,
          message: parsed.message,
          userId: options.userId,
          userAction: options.userAction,
          component: options.component,
          route: options.route,
          stackTrace: parsed.stackTrace,
          suggestion: pattern.suggestion,
          metadata: options.metadata,
          timestamp: new Date().toISOString(),
        });

        // Update log with notification timestamp
        await db
          .update(systemLogs)
          .set({ adminNotified: new Date() })
          .where(eq(systemLogs.id, logId));
      } catch (notifyError) {
        console.error(
          '[SystemLog] Failed to send admin notification:',
          notifyError
        );
      }
    }

    return logId;
  } catch (dbError) {
    // If database logging fails, at least we have console output
    console.error('[SystemLog] Failed to write to database:', dbError);
    return null;
  }
}

/**
 * Quick helper for logging external service errors (Google, OpenRouter, etc.)
 */
export async function logExternalServiceError(
  serviceName: string,
  error: unknown,
  context: {
    userId?: string;
    userAction?: string;
    component?: string;
    route?: string;
    requestData?: Record<string, unknown>;
    responseData?: Record<string, unknown>;
  } = {}
): Promise<string | null> {
  return logSystemError(error, {
    category: 'external_service',
    component: context.component || serviceName,
    metadata: { serviceName },
    ...context,
  });
}

/**
 * Quick helper for logging API errors
 */
export async function logApiError(
  error: unknown,
  context: {
    route: string;
    userId?: string;
    userAction?: string;
    requestData?: Record<string, unknown>;
    responseData?: Record<string, unknown>;
  }
): Promise<string | null> {
  return logSystemError(error, {
    category: 'api_error',
    ...context,
  });
}

/**
 * Quick helper for logging AI-related errors
 */
export async function logAiError(
  error: unknown,
  context: {
    model?: string;
    userId?: string;
    userAction?: string;
    component?: string;
    route?: string;
    requestData?: Record<string, unknown>;
    responseData?: Record<string, unknown>;
  } = {}
): Promise<string | null> {
  return logSystemError(error, {
    category: 'ai_error',
    metadata: { model: context.model },
    ...context,
  });
}

/**
 * Quick helper for logging payment errors
 */
export async function logPaymentError(
  error: unknown,
  context: {
    userId?: string;
    stripeCustomerId?: string;
    amount?: number;
    currency?: string;
    component?: string;
    route?: string;
    userAction?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<string | null> {
  return logSystemError(error, {
    category: 'payment_error',
    ...context,
    metadata: {
      stripeCustomerId: context.stripeCustomerId,
      amount: context.amount,
      currency: context.currency,
      ...context.metadata,
    },
  });
}

export default {
  logSystemError,
  logExternalServiceError,
  logApiError,
  logAiError,
  logPaymentError,
  getErrorContext,
};
