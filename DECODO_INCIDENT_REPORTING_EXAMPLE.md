# Decodo API - Incident Reporting Implementation Example

This document shows exactly how to add incident reporting to the existing Decodo API integration.

## Current State (No Incident Reporting)

The current [src/lib/decodo.ts](src/lib/decodo.ts) only uses `console.error`:

```typescript
// ❌ Current - No admin notification
try {
    const response = await fetch(`${DECODO_BASE_URL}/task`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Decodo API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return (await response.json()) as DecodoTaskResponse;
} catch (error: any) {
    console.error('Decodo Task Creation Error:', error.message); // ❌ Only logs to console
    throw error;
}
```

## Enhanced Version (With Incident Reporting)

### Step 1: Add Error Patterns to `src/lib/system-logger.ts`

```typescript
// In src/lib/system-logger.ts, add these patterns to ERROR_PATTERNS:

const ERROR_PATTERNS: Record<
  string,
  { userMessage: string; suggestion: string; category: SystemLogCategory }
> = {
  // ... existing patterns ...

  // Decodo API Errors
  DECODO_AUTH_FAILED: {
    userMessage: 'Product information service authentication failed. Our team has been notified.',
    suggestion: 'Verify DECODO_USER and DECODO_PASS in environment variables. Check Decodo account status and billing.',
    category: 'external_service',
  },
  DECODO_RATE_LIMIT: {
    userMessage: 'Product information service is busy. Please try again in a moment.',
    suggestion: 'Decodo API rate limit exceeded. Consider implementing request queuing or upgrading Decodo plan.',
    category: 'external_service',
  },
  DECODO_INVALID_ASIN: {
    userMessage: 'The product code you entered is invalid or the product is not available.',
    suggestion: 'Add ASIN format validation before making API calls. Pattern: /^[A-Z0-9]{10}$/',
    category: 'validation_error',
  },
  DECODO_TASK_TIMEOUT: {
    userMessage: 'Product information request timed out. Please try again.',
    suggestion: 'Increase maxAttempts or intervalMs in pollDecodoTask(). Check Decodo service status.',
    category: 'external_service',
  },
  DECODO_TASK_FAILED: {
    userMessage: 'Failed to retrieve product information. Please verify the product URL and try again.',
    suggestion: 'Check Decodo logs for task failure reason. Verify ASIN/URL format and product availability.',
    category: 'external_service',
  },
  DECODO_INVALID_CREDENTIALS: {
    userMessage: 'Product service configuration error. Our team has been notified.',
    suggestion: 'DECODO_USER or DECODO_PASS environment variables are missing or invalid.',
    category: 'external_service',
  },
  DECODO_URL_EXPANSION_FAILED: {
    userMessage: 'Failed to process the product URL. Please try entering the full Amazon product URL.',
    suggestion: 'Shortened URL (a.co, amzn.to) expansion failed. Check network connectivity or use full URLs.',
    category: 'external_service',
  },
};
```

### Step 2: Add Error Detection in `parseError()`

```typescript
// In src/lib/system-logger.ts, add detection logic:

function parseError(error: unknown): {
  message: string;
  errorName: string;
  errorCode: string;
  stackTrace?: string;
} {
  if (error instanceof Error) {
    let errorCode = 'UNKNOWN_ERROR';

    // ... existing detection logic ...

    // Check for Decodo errors
    if (error.message.includes('Decodo credentials missing')) {
      errorCode = 'DECODO_INVALID_CREDENTIALS';
    } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorCode = 'DECODO_AUTH_FAILED';
    } else if (error.message.includes('429') || error.message.includes('rate limit')) {
      errorCode = 'DECODO_RATE_LIMIT';
    } else if (error.message.includes('Unable to extract a valid Amazon ASIN')) {
      errorCode = 'DECODO_INVALID_ASIN';
    } else if (error.message.includes('Decodo task timed out')) {
      errorCode = 'DECODO_TASK_TIMEOUT';
    } else if (error.message.includes('Decodo task failed')) {
      errorCode = 'DECODO_TASK_FAILED';
    } else if (error.message.includes('Failed to expand shortened URL')) {
      errorCode = 'DECODO_URL_EXPANSION_FAILED';
    }

    return {
      message: error.message,
      errorName: error.name || 'Error',
      errorCode,
      stackTrace: error.stack,
    };
  }

  // ... rest of parseError logic
}
```

### Step 3: Update `src/lib/decodo.ts` with Incident Reporting

```typescript
import { logExternalServiceError } from '@/lib/system-logger';

// Enhanced createDecodoTask with incident reporting
async function createDecodoTask(
  payload: any,
  context?: {
    userId?: string;
    userAction?: string;
    component?: string;
    route?: string;
  }
) {
  if (!DECODO_USER || !DECODO_PASS) {
    const error = new Error('Decodo credentials missing. Please set DECODO_USER and DECODO_PASS in .env.local');

    // Log critical configuration error
    await logExternalServiceError('Decodo API', error, {
      userId: context?.userId,
      userAction: context?.userAction || 'Accessing Decodo API',
      component: context?.component || 'DecodoClient',
      route: context?.route,
      requestData: {
        hasUser: !!DECODO_USER,
        hasPass: !!DECODO_PASS,
        target: payload.target,
      },
    });

    throw error;
  }

  const auth = Buffer.from(`${DECODO_USER}:${DECODO_PASS}`).toString('base64');

  try {
    const response = await fetch(`${DECODO_BASE_URL}/task`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Decodo API Error: ${response.status} ${response.statusText} - ${errorText}`);

      // Log the API failure with full context
      await logExternalServiceError('Decodo API', error, {
        userId: context?.userId,
        userAction: context?.userAction || 'Creating Decodo task',
        component: context?.component || 'DecodoClient',
        route: context?.route,
        requestData: {
          target: payload.target,
          query: payload.query,
          country: payload.country,
        },
        responseData: {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500), // Limit size
        },
      });

      throw error;
    }

    return (await response.json()) as DecodoTaskResponse;
  } catch (error: any) {
    // If it's a network error (fetch failed), also log it
    if (!error.message.includes('Decodo API Error')) {
      await logExternalServiceError('Decodo API', error, {
        userId: context?.userId,
        userAction: context?.userAction || 'Creating Decodo task',
        component: context?.component || 'DecodoClient',
        route: context?.route,
        requestData: {
          endpoint: `${DECODO_BASE_URL}/task`,
          target: payload.target,
          query: payload.query,
        },
        metadata: {
          errorType: 'NetworkError',
        },
      });
    }

    throw error;
  }
}

// Enhanced pollDecodoTask with incident reporting
async function pollDecodoTask(
  taskId: string,
  maxAttempts = 30,
  intervalMs = 2000,
  context?: {
    userId?: string;
    userAction?: string;
    component?: string;
    route?: string;
  }
): Promise<any> {
  if (!DECODO_USER || !DECODO_PASS) {
    const error = new Error('Decodo credentials missing');

    await logExternalServiceError('Decodo API', error, {
      userId: context?.userId,
      userAction: context?.userAction || 'Polling Decodo task',
      component: context?.component || 'DecodoClient',
      route: context?.route,
    });

    throw error;
  }

  const auth = Buffer.from(`${DECODO_USER}:${DECODO_PASS}`).toString('base64');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${DECODO_BASE_URL}/task/${taskId}/results`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
          continue;
        }

        const errorText = await response.text();
        const error = new Error(`Decodo Polling Error: ${response.status} - ${errorText}`);

        await logExternalServiceError('Decodo API', error, {
          userId: context?.userId,
          userAction: context?.userAction || 'Polling Decodo task results',
          component: context?.component || 'DecodoClient',
          route: context?.route,
          requestData: {
            taskId,
            attempt: i + 1,
            maxAttempts,
          },
          responseData: {
            status: response.status,
            body: errorText.substring(0, 500),
          },
        });

        throw error;
      }

      const text = await response.text();

      if (!text) {
        throw new Error(`Decodo returned empty response body. Status: ${response.status}`);
      }

      const data = JSON.parse(text) as DecodoResultResponse;

      if (data.results) {
        return data.results;
      }

      if (data.status === 'done') {
        return data.result;
      }

      if (data.status === 'failed' || data.status === 'error') {
        const error = new Error(`Decodo task failed with status: ${data.status}`);

        await logExternalServiceError('Decodo API', error, {
          userId: context?.userId,
          userAction: context?.userAction || 'Processing Decodo task',
          component: context?.component || 'DecodoClient',
          route: context?.route,
          requestData: {
            taskId,
            attempt: i + 1,
          },
          responseData: {
            status: data.status,
            taskResult: data,
          },
        });

        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));

    } catch (error: any) {
      console.error('Polling Error:', error.message);

      if (i === maxAttempts - 1) {
        // Only log timeout on final attempt
        const timeoutError = new Error('Decodo task timed out');

        await logExternalServiceError('Decodo API', timeoutError, {
          userId: context?.userId,
          userAction: context?.userAction || 'Polling Decodo task',
          component: context?.component || 'DecodoClient',
          route: context?.route,
          requestData: {
            taskId,
            totalAttempts: maxAttempts,
            intervalMs,
            totalWaitTime: maxAttempts * intervalMs,
          },
          metadata: {
            lastError: error.message,
          },
        });

        throw timeoutError;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Decodo task timed out');
}

// Enhanced URL expansion with incident reporting
async function expandShortenedUrl(
  shortUrl: string,
  context?: {
    userId?: string;
    userAction?: string;
    component?: string;
    route?: string;
  }
): Promise<string> {
  try {
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow'
    });

    return response.url;
  } catch (error) {
    console.error('[Decodo] Failed to expand shortened URL:', error);

    await logExternalServiceError('URL Expansion', error, {
      userId: context?.userId,
      userAction: context?.userAction || 'Expanding shortened Amazon URL',
      component: context?.component || 'DecodoClient',
      route: context?.route,
      requestData: {
        shortUrl,
      },
      metadata: {
        urlType: shortUrl.includes('a.co') ? 'a.co' : 'amzn.to',
      },
    });

    // Return original URL as fallback
    return shortUrl;
  }
}

// Enhanced main API function with context propagation
export async function getDecodoProductDetails(
  urlOrAsin: string,
  country = 'US',
  context?: {
    userId?: string;
    userAction?: string;
    component?: string;
    route?: string;
  }
): Promise<SimplifiedProduct | null> {
  let processedUrl = urlOrAsin.trim();

  const isShortenedUrl = processedUrl.includes('a.co/') || processedUrl.includes('amzn.to/');

  if (isShortenedUrl) {
    console.log('[Decodo] Detected shortened URL, expanding:', processedUrl);
    processedUrl = await expandShortenedUrl(processedUrl, context);
    console.log('[Decodo] Expanded URL:', processedUrl);
  }

  const asinMatch = processedUrl.match(/(?:\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/|\/product\/)([A-Z0-9]{10})(?:\/|$|\?)/);
  const isAsin = /^[A-Z0-9]{10}$/.test(processedUrl);

  let query: string;

  if (isAsin) {
    query = processedUrl;
    console.log('[Decodo] Using direct ASIN:', query);
  } else if (asinMatch && asinMatch[1]) {
    query = asinMatch[1];
    console.log('[Decodo] Extracted ASIN from URL:', query);
  } else {
    const error = new Error(
      'Unable to extract a valid Amazon ASIN from the provided URL. ' +
      'Please ensure the URL contains a valid product identifier (e.g., /dp/B001234567). ' +
      'Alternatively, you can enter the 10-character ASIN directly in the SKU/ASIN field.'
    );

    await logExternalServiceError('Decodo API', error, {
      userId: context?.userId,
      userAction: context?.userAction || 'Extracting ASIN from URL',
      component: context?.component || 'DecodoClient',
      route: context?.route,
      requestData: {
        originalInput: urlOrAsin,
        processedUrl,
        isShortenedUrl,
      },
    });

    throw error;
  }

  if (query.length !== 10) {
    const error = new Error(
      `Invalid ASIN length: "${query}" is ${query.length} characters, but ASINs must be exactly 10 characters. ` +
      'Please check the product URL or enter a valid ASIN directly.'
    );

    await logExternalServiceError('Decodo API', error, {
      userId: context?.userId,
      userAction: context?.userAction || 'Validating ASIN',
      component: context?.component || 'DecodoClient',
      route: context?.route,
      requestData: {
        extractedAsin: query,
        asinLength: query.length,
      },
    });

    throw error;
  }

  const task = await createDecodoTask({
    query: query,
    target: 'amazon_product',
    country,
    domain: 'com',
    device_type: 'desktop_chrome',
    parse: true
  }, context);

  if (!task.id) throw new Error('No task ID returned from Decodo');

  const result = await pollDecodoTask(task.id, 30, 2000, context);

  if (!result || (Array.isArray(result) && result.length === 0)) return null;

  const firstItem = Array.isArray(result) ? result[0] : result;

  if (firstItem && firstItem.content) {
    return mapProductDetails(firstItem.content);
  }

  return mapProductDetails(firstItem);
}

// Similar enhancement for searchDecodoProducts
export async function searchDecodoProducts(
  query: string,
  country = 'US',
  context?: {
    userId?: string;
    userAction?: string;
    component?: string;
    route?: string;
  }
): Promise<SimplifiedProduct[]> {
  const task = await createDecodoTask({
    query: query,
    target: 'amazon_search',
    country,
    domain: 'com',
    device_type: 'desktop_chrome',
    parse: true
  }, context);

  if (!task.id) throw new Error('No task ID returned from Decodo');

  const result = await pollDecodoTask(task.id, 30, 2000, context);

  if (!result) return [];

  // ... rest of search logic
}
```

### Step 4: Update Calling Code to Pass Context

Now when you call these functions from your admin products page, pass the context:

```typescript
// In src/app/(protected)/admin/products/actions.ts or components

import { getDecodoProductDetails } from '@/lib/decodo';
import { createClient } from '@/utils/supabase/server';

export async function fetchProductDetails(urlOrAsin: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const productDetails = await getDecodoProductDetails(
      urlOrAsin,
      'US',
      {
        userId: user?.id,
        userAction: 'Adding product from Amazon via Decodo API',
        component: 'ProductEditDialog',
        route: '/admin/products',
      }
    );

    return { success: true, data: productDetails };
  } catch (error) {
    // Error is already logged to admin via incident reporting
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch product details',
    };
  }
}
```

## What Admin Will Receive

When a Decodo API error occurs, the admin email will include:

**Subject**: `🟠 [ERROR] Decodo API Error - Emergency Planner`

**Email Body**:
```
🚨 System Error Alert
────────────────────────────────
ERROR - Emergency Planner

🌐 EXTERNAL SERVICE          Log ID: abc123...

┌─────────────────────────────────────────────┐
│ Decodo API Error                            │
│                                             │
│ Decodo API Error: 401 Unauthorized -       │
│ Invalid credentials                         │
│                                             │
│ Error Code: DECODO_AUTH_FAILED              │
└─────────────────────────────────────────────┘

📍 Context
──────────
Timestamp: Monday, December 18, 2024, 10:30:45 AM EST
Component: DecodoClient → ProductEditDialog
Route: /admin/products
User Action: Adding product from Amazon via Decodo API

👤 Affected User
────────────────
User ID: 550e8400-e29b-41d4-a716-446655440000
Email: admin@beprepared.ai
Name: John Doe

💡 Suggested Resolution
───────────────────────
Verify DECODO_USER and DECODO_PASS in environment
variables. Check Decodo account status and billing.

📊 Request Data
───────────────
{
  "target": "amazon_product",
  "query": "B08N5WRWNW",
  "country": "US"
}

📊 Response Data
────────────────
{
  "status": 401,
  "statusText": "Unauthorized",
  "body": "Invalid credentials provided"
}

🔍 Stack Trace
──────────────
Error: Decodo API Error: 401 Unauthorized - Invalid credentials
  at createDecodoTask (decodo.ts:38)
  at getDecodoProductDetails (decodo.ts:285)
  at fetchProductDetails (actions.ts:15)
  ...

[View in Debug Console] [System Health]
```

## Benefits

✅ **Automatic admin notification** for all Decodo failures
✅ **Full user context** - who was affected and what they were trying to do
✅ **Request/response data** - exactly what was sent and received
✅ **Actionable suggestions** - how to fix each type of error
✅ **Historical tracking** - all errors logged to database
✅ **Debug console integration** - click link to view full details

## Summary

To add incident reporting to ANY external service:

1. **Add error patterns** to `ERROR_PATTERNS` in `system-logger.ts`
2. **Add detection logic** in `parseError()` function
3. **Import and use** `logExternalServiceError()` in API client
4. **Pass context** from calling code (userId, userAction, component, route)
5. **Test** that admin receives properly formatted emails

The system handles everything else automatically!
