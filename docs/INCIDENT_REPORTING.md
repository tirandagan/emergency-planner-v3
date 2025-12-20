# Incident Reporting System Documentation

## Overview

The Emergency Planner application includes a comprehensive incident reporting system that automatically logs errors, notifies admins, and provides resolution suggestions. This system captures full context about errors including user information, actions, technical details, and stack traces.

## System Architecture

### Components

1. **System Logger** (`src/lib/system-logger.ts`)
   - Main logging functions for different error types
   - Automatic categorization and severity detection
   - Integration with admin notifications

2. **Admin Notifications** (`src/lib/admin-notifications.ts`)
   - Beautifully formatted HTML email notifications
   - Fetches user context from database
   - Links to debug console for further investigation

3. **Database Schema** (`src/db/schema/system-logs.ts`)
   - Persistent storage of all system logs
   - Indexed for fast querying and filtering
   - Tracks resolution status and admin notifications

### Email Notification Features

Admin notification emails include:
- ✅ **Severity badge** (Critical, Error, Warning, Info)
- ✅ **Error details** (Name, message, error code)
- ✅ **User context** (ID, email, name if available)
- ✅ **Action context** (What user was doing, which screen, which component)
- ✅ **Technical details** (Stack trace, function, line numbers)
- ✅ **Resolution suggestion** (Possible remedy based on error pattern)
- ✅ **Metadata** (Additional context like API responses)
- ✅ **Direct links** to debug console with log ID

## Configuration

### Environment Variables

Required in `.env.local`:

```bash
# Resend API for sending emails
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@beprepared.ai
ADMIN_EMAIL=admin@beprepared.ai  # Where incident reports are sent
```

### Severity Levels

- **`critical`** - System-breaking errors requiring immediate attention
- **`error`** - Failures affecting user functionality (auto-notifies admin)
- **`warning`** - Non-critical issues that should be reviewed
- **`info`** - Informational logs for tracking
- **`debug`** - Detailed debugging information

### Error Categories

- **`api_error`** - REST API failures
- **`auth_error`** - Authentication/authorization failures
- **`database_error`** - Database query/connection failures
- **`external_service`** - Third-party API failures (Google, Stripe, etc.)
- **`payment_error`** - Stripe payment processing failures
- **`ai_error`** - OpenRouter/AI generation failures
- **`validation_error`** - Input validation failures
- **`permission_error`** - Permission/access control failures
- **`system_error`** - General system errors
- **`user_action`** - User-initiated actions for tracking

## Usage Examples

### 1. External Service Errors (Decodo API, Google Maps, etc.)

**Example: Product API Failure**

```typescript
import { logExternalServiceError } from '@/lib/system-logger';

// In your product fetching code
export async function fetchProductFromDecodo(asin: string, userId: string): Promise<Product> {
  try {
    const response = await fetch(`https://api.decodo.com/product/${asin}`, {
      headers: {
        'Authorization': `Bearer ${process.env.DECODO_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Decodo API returned ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    // Log the error with full context
    await logExternalServiceError(
      'Decodo API',
      error,
      {
        userId,
        userAction: 'Adding product to emergency kit',
        component: 'ProductManager',
        route: '/admin/products',
        requestData: {
          asin,
          endpoint: 'product-fetch',
        },
        responseData: {
          status: error instanceof Response ? error.status : undefined,
          // Include API response if available
        },
      }
    );

    // Re-throw or handle gracefully
    throw error;
  }
}
```

**What the admin receives:**
- Email subject: `🟠 [ERROR] Decodo API Error - Emergency Planner`
- User info: Email, name, ID
- Context: "Adding product to emergency kit" on `/admin/products`
- Component: `ProductManager`
- Error details: Full error message and stack trace
- Request data: ASIN and endpoint
- Response data: HTTP status and response body
- Suggested resolution: Based on error pattern

### 2. AI Service Errors

**Example: Mission Plan Generation Failure**

```typescript
import { logAiError } from '@/lib/system-logger';

export async function generateMissionPlan(formData: WizardFormData, userId: string): Promise<Plan> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [...],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API failed: ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    await logAiError(error, {
      model: 'anthropic/claude-3.5-sonnet',
      userId,
      userAction: 'Generating disaster preparedness plan',
      component: 'MissionGenerator',
      route: '/plans/new',
      requestData: {
        scenario: formData.scenario,
        location: formData.location,
        // Don't include sensitive user data
      },
      responseData: error instanceof Response ? {
        status: error.status,
        statusText: error.statusText,
      } : undefined,
    });

    throw error;
  }
}
```

### 3. Payment Processing Errors

**Example: Stripe Subscription Creation Failure**

```typescript
import { logPaymentError } from '@/lib/system-logger';

export async function createSubscription(
  userId: string,
  priceId: string,
  paymentMethodId: string
): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { payment_method_types: ['card'] },
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    await logPaymentError(error, {
      userId,
      stripeCustomerId: customerId,
      amount: priceAmount,
      currency: 'usd',
      component: 'SubscriptionManager',
      route: '/api/stripe/create-subscription',
    });

    throw error;
  }
}
```

### 4. API Route Errors

**Example: Server Action Failure**

```typescript
import { logApiError } from '@/lib/system-logger';

export async function updateUserProfile(
  userId: string,
  updates: ProfileUpdates
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    await logApiError(error, {
      route: '/api/profile/update',
      userId,
      userAction: 'Updating profile information',
      requestData: {
        fieldsUpdated: Object.keys(updates),
        // Don't include sensitive values
      },
    });

    return { success: false };
  }
}
```

### 5. General System Errors

**Example: Database Connection Failure**

```typescript
import { logSystemError } from '@/lib/system-logger';

export async function initializeDatabase(): Promise<void> {
  try {
    await db.execute(sql`SELECT 1`);
  } catch (error) {
    await logSystemError(error, {
      severity: 'critical', // This is critical - app won't work
      category: 'database_error',
      component: 'DatabaseInitializer',
      route: '/api/health',
      metadata: {
        connectionString: process.env.DATABASE_URL?.replace(/:[^:]+@/, ':***@'), // Redact password
      },
      notifyAdmin: true, // Explicitly request admin notification
    });

    throw error;
  }
}
```

### 6. Custom Error Patterns

You can add custom error patterns to `src/lib/system-logger.ts`:

```typescript
const ERROR_PATTERNS: Record<
  string,
  { userMessage: string; suggestion: string; category: SystemLogCategory }
> = {
  // ... existing patterns ...

  // Add your custom pattern
  DECODO_API_RATE_LIMIT: {
    userMessage: 'Product information is temporarily unavailable due to high demand. Please try again in a moment.',
    suggestion: 'Implement rate limiting on Decodo API calls. Consider caching product data for 24 hours.',
    category: 'external_service',
  },
  DECODO_INVALID_ASIN: {
    userMessage: 'The product code you entered is invalid. Please check and try again.',
    suggestion: 'Add ASIN format validation before making API calls. Pattern: /^B[0-9A-Z]{9}$/',
    category: 'validation_error',
  },
};
```

Then update the `parseError` function to detect your error:

```typescript
function parseError(error: unknown): {
  message: string;
  errorName: string;
  errorCode: string;
  stackTrace?: string;
} {
  if (error instanceof Error) {
    let errorCode = 'UNKNOWN_ERROR';

    // Check for Decodo errors
    if (error.message.includes('rate limit exceeded')) {
      errorCode = 'DECODO_API_RATE_LIMIT';
    } else if (error.message.includes('invalid ASIN')) {
      errorCode = 'DECODO_INVALID_ASIN';
    }

    // ... rest of detection logic
  }
}
```

## Best Practices

### DO ✅

1. **Always include user context** when available:
   ```typescript
   await logSystemError(error, {
     userId: user?.id,
     userAction: 'What they were trying to do',
     component: 'ComponentName',
     route: '/current/route',
   });
   ```

2. **Use specific helper functions** for better categorization:
   - `logExternalServiceError()` for third-party APIs
   - `logAiError()` for AI/LLM services
   - `logPaymentError()` for Stripe/payment issues
   - `logApiError()` for REST API failures

3. **Include request/response data** for debugging:
   ```typescript
   requestData: {
     asin: 'B08N5WRWNW',
     endpoint: 'product-details',
   },
   responseData: {
     status: 429,
     body: 'Rate limit exceeded',
   },
   ```

4. **Set appropriate severity**:
   - `critical`: System is down or data loss risk
   - `error`: Feature broken for users (auto-notifies admin)
   - `warning`: Degraded performance or recoverable errors
   - `info`: Successfully handled issues worth tracking

5. **Add metadata for context**:
   ```typescript
   metadata: {
     retryCount: 3,
     apiVersion: 'v2',
     datacenter: 'us-east-1',
   },
   ```

### DON'T ❌

1. **Don't log sensitive data**:
   ```typescript
   // ❌ Bad
   requestData: {
     password: userPassword,
     creditCard: cardNumber,
   }

   // ✅ Good
   requestData: {
     passwordLength: userPassword.length,
     cardLast4: cardNumber.slice(-4),
   }
   ```

2. **Don't skip error logging in critical paths**:
   ```typescript
   // ❌ Bad
   try {
     await criticalOperation();
   } catch (error) {
     console.error(error); // Only console, no admin notification
   }

   // ✅ Good
   try {
     await criticalOperation();
   } catch (error) {
     await logSystemError(error, { severity: 'critical', ... });
     throw error;
   }
   ```

3. **Don't over-notify**:
   ```typescript
   // ❌ Bad - will spam admin
   for (const item of items) {
     try {
       await processItem(item);
     } catch (error) {
       await logSystemError(error); // Separate email per item!
     }
   }

   // ✅ Good - batch or use warning severity
   const errors = [];
   for (const item of items) {
     try {
       await processItem(item);
     } catch (error) {
       errors.push({ item, error });
     }
   }
   if (errors.length > 0) {
     await logSystemError(new Error(`Batch processing failed for ${errors.length} items`), {
       metadata: { errors: errors.map(e => ({ item: e.item.id, error: e.error.message })) },
     });
   }
   ```

4. **Don't forget to await**:
   ```typescript
   // ❌ Bad - logging might not complete
   logSystemError(error, { ... });

   // ✅ Good - ensure logging completes
   await logSystemError(error, { ... });
   ```

## Testing Admin Notifications

You can test the notification system:

```typescript
import { sendTestAdminNotification } from '@/lib/admin-notifications';

// In a test route or script
await sendTestAdminNotification();
```

This sends a test email to `ADMIN_EMAIL` with sample error data.

## Viewing Logs

Admins can view all system logs in the Admin Debug Console:
- **URL**: `/admin/debug?tab=logs`
- **Features**:
  - Filter by severity, category, date range
  - Search by user, component, error code
  - View full error details including stack traces
  - Mark errors as resolved
  - See which errors triggered admin notifications

## When to Add New Error Patterns

Add a new error pattern when:

1. **A new third-party service is integrated** (APIs, SDKs)
2. **A new error type occurs frequently** and needs specific handling
3. **Users need a better error message** than the technical one
4. **There's a known resolution** that should be documented

### Adding New Patterns: Step-by-Step

1. **Identify the error** from logs or user reports

2. **Add pattern to ERROR_PATTERNS**:
   ```typescript
   // src/lib/system-logger.ts
   const ERROR_PATTERNS = {
     // ... existing patterns ...

     YOUR_ERROR_CODE: {
       userMessage: 'User-friendly message here',
       suggestion: 'Resolution steps for admin/developer',
       category: 'external_service', // or appropriate category
     },
   };
   ```

3. **Add detection logic** in `parseError()`:
   ```typescript
   function parseError(error: unknown) {
     // ... existing logic ...

     // Check for your error
     if (error.message.includes('your error signature')) {
       errorCode = 'YOUR_ERROR_CODE';
     }
   }
   ```

4. **Use the logging system** where the error occurs:
   ```typescript
   try {
     await yourOperation();
   } catch (error) {
     await logExternalServiceError('ServiceName', error, {
       userId,
       userAction: 'What user was doing',
       component: 'ComponentName',
       route: '/route',
       requestData: { /* sanitized request */ },
       responseData: { /* API response */ },
     });
     throw error;
   }
   ```

5. **Test** that admin receives the email with proper context

## Error Notification Email Example

Here's what admins receive:

```
Subject: 🟠 [ERROR] Decodo API Error - Emergency Planner

───────────────────────────────────
🚨 System Error Alert
ERROR - Emergency Planner
───────────────────────────────────

🔌 EXTERNAL SERVICE          Log ID: abc123...

┌─────────────────────────────────┐
│ Decodo API Error                │
│                                 │
│ Failed to fetch product: ASIN   │
│ B08N5WRWNW not found            │
│                                 │
│ Error Code: DECODO_NOT_FOUND    │
└─────────────────────────────────┘

📍 Context
─────────
Timestamp: Monday, December 18, 2024, 10:30:45 AM EST
Component: ProductManager
Route: /admin/products
User Action: Adding product to emergency kit

👤 Affected User
───────────────
User ID: 550e8400-e29b-41d4-a716-446655440000
Email: user@example.com
Name: John Doe

💡 Suggested Resolution
──────────────────────
Verify ASIN format before calling API.
Check if product exists in Amazon catalog.
Consider implementing ASIN validation:
Pattern: /^B[0-9A-Z]{9}$/

🔍 Stack Trace
─────────────
Error: Failed to fetch product
  at fetchProductFromDecodo (product-manager.ts:42)
  at ProductEditDialog (ProductEditDialog.tsx:156)
  ...

[View in Debug Console] [System Health]
```

## Summary

The incident reporting system is **production-ready** and **fully implemented**. To add reporting for new error types:

1. **Identify** the error signature and context needed
2. **Add error pattern** to `ERROR_PATTERNS` (optional but recommended)
3. **Use appropriate logging function** (`logExternalServiceError`, `logApiError`, etc.)
4. **Include full context** (user, action, component, route, metadata)
5. **Test** that admin receives proper notification

The system automatically:
- ✅ Logs to database for historical tracking
- ✅ Sends formatted email to admin for critical/error severity
- ✅ Includes stack traces and line numbers
- ✅ Fetches user information from database
- ✅ Provides resolution suggestions
- ✅ Links to debug console for investigation

Need help implementing reporting for a specific error type? Just describe the error scenario and I'll show you exactly how to implement it!
