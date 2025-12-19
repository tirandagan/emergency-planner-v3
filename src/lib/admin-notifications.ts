import { Resend } from 'resend';
import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';
import { eq } from 'drizzle-orm';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = `BePrepared.AI System Alert <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://beprepared.ai';

/**
 * Error notification data structure
 */
export interface ErrorNotificationData {
  logId: string;
  severity: string;
  category: string;
  errorCode?: string;
  errorName: string;
  message: string;
  userId?: string;
  userAction?: string;
  component?: string;
  route?: string;
  stackTrace?: string;
  suggestion?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Get severity color for email styling
 */
function getSeverityColor(severity: string): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'critical':
      return { bg: '#7f1d1d', text: '#fef2f2', border: '#dc2626' };
    case 'error':
      return { bg: '#fef2f2', text: '#991b1b', border: '#dc2626' };
    case 'warning':
      return { bg: '#fefce8', text: '#854d0e', border: '#eab308' };
    case 'info':
      return { bg: '#eff6ff', text: '#1e40af', border: '#3b82f6' };
    default:
      return { bg: '#f9fafb', text: '#374151', border: '#d1d5db' };
  }
}

/**
 * Get category icon (emoji for email compatibility)
 */
function getCategoryEmoji(category: string): string {
  switch (category) {
    case 'api_error':
      return '🔌';
    case 'auth_error':
      return '🔐';
    case 'database_error':
      return '🗄️';
    case 'external_service':
      return '🌐';
    case 'payment_error':
      return '💳';
    case 'ai_error':
      return '🤖';
    case 'validation_error':
      return '⚠️';
    case 'permission_error':
      return '🚫';
    case 'system_error':
      return '⚙️';
    case 'user_action':
      return '👤';
    default:
      return '📋';
  }
}

/**
 * Fetch user details for error context
 */
async function getUserDetails(userId?: string): Promise<{ email?: string; displayName?: string } | null> {
  if (!userId) return null;

  try {
    const [user] = await db
      .select({
        email: profiles.email,
        fullName: profiles.fullName,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    return user ? { email: user.email, displayName: user.fullName ?? undefined } : null;
  } catch {
    return null;
  }
}

/**
 * Generate HTML email template for error notifications
 */
function generateErrorEmailHtml(data: ErrorNotificationData, user: { email?: string; displayName?: string } | null): string {
  const colors = getSeverityColor(data.severity);
  const categoryEmoji = getCategoryEmoji(data.category);
  const formattedDate = new Date(data.timestamp).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Error Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${colors.border}; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🚨 System Error Alert
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${data.severity.toUpperCase()} - Emergency Planner
              </p>
            </td>
          </tr>

          <!-- Severity Badge -->
          <tr>
            <td style="padding: 20px 24px 0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: ${colors.bg}; color: ${colors.text}; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 12px; text-transform: uppercase; border: 2px solid ${colors.border};">
                      ${categoryEmoji} ${data.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td align="right">
                    <span style="color: #6b7280; font-size: 12px;">
                      Log ID: ${data.logId.slice(0, 8)}...
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Error Summary -->
          <tr>
            <td style="padding: 20px 24px;">
              <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 16px; border-radius: 0 8px 8px 0;">
                <h2 style="margin: 0 0 8px 0; color: ${colors.text}; font-size: 18px;">
                  ${data.errorName}
                </h2>
                <p style="margin: 0; color: ${colors.text}; font-size: 14px; line-height: 1.5;">
                  ${data.message}
                </p>
                ${data.errorCode ? `
                <p style="margin: 12px 0 0 0; font-family: monospace; background-color: rgba(0,0,0,0.1); padding: 8px 12px; border-radius: 4px; font-size: 12px; color: ${colors.text};">
                  Error Code: ${data.errorCode}
                </p>
                ` : ''}
              </div>
            </td>
          </tr>

          <!-- Context Details -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                📍 Context
              </h3>
              <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px;">
                <tr>
                  <td style="color: #6b7280; width: 140px; vertical-align: top;">Timestamp:</td>
                  <td style="color: #111827;">${formattedDate}</td>
                </tr>
                ${data.component ? `
                <tr style="background-color: #f9fafb;">
                  <td style="color: #6b7280; vertical-align: top;">Component:</td>
                  <td style="color: #111827; font-family: monospace;">${data.component}</td>
                </tr>
                ` : ''}
                ${data.route ? `
                <tr>
                  <td style="color: #6b7280; vertical-align: top;">Route:</td>
                  <td style="color: #111827; font-family: monospace;">${data.route}</td>
                </tr>
                ` : ''}
                ${data.userAction ? `
                <tr style="background-color: #f9fafb;">
                  <td style="color: #6b7280; vertical-align: top;">User Action:</td>
                  <td style="color: #111827;">${data.userAction}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- User Information (if available) -->
          ${user ? `
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                👤 Affected User
              </h3>
              <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px; background-color: #eff6ff; border-radius: 8px;">
                <tr>
                  <td style="color: #6b7280; width: 140px; vertical-align: top;">User ID:</td>
                  <td style="color: #111827; font-family: monospace;">${data.userId}</td>
                </tr>
                ${user.email ? `
                <tr>
                  <td style="color: #6b7280; vertical-align: top;">Email:</td>
                  <td style="color: #111827;">${user.email}</td>
                </tr>
                ` : ''}
                ${user.displayName ? `
                <tr>
                  <td style="color: #6b7280; vertical-align: top;">Name:</td>
                  <td style="color: #111827;">${user.displayName}</td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Resolution Suggestion -->
          ${data.suggestion ? `
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                💡 Suggested Resolution
              </h3>
              <div style="background-color: #ecfdf5; border: 1px solid #10b981; padding: 16px; border-radius: 8px;">
                <p style="margin: 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                  ${data.suggestion}
                </p>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Stack Trace (collapsible via details) -->
          ${data.stackTrace ? `
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                🔍 Stack Trace
              </h3>
              <div style="background-color: #1f2937; padding: 16px; border-radius: 8px; overflow-x: auto;">
                <pre style="margin: 0; color: #f3f4f6; font-size: 11px; line-height: 1.4; white-space: pre-wrap; word-break: break-all;">${data.stackTrace.slice(0, 2000)}${data.stackTrace.length > 2000 ? '\n\n... (truncated)' : ''}</pre>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Additional Metadata -->
          ${data.metadata && Object.keys(data.metadata).length > 0 ? `
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                📊 Additional Metadata
              </h3>
              <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; overflow-x: auto;">
                <pre style="margin: 0; color: #374151; font-size: 12px; line-height: 1.4;">${JSON.stringify(data.metadata, null, 2)}</pre>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${SITE_URL}/admin/debug?tab=logs&logId=${data.logId}"
                       style="display: inline-block; background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 12px;">
                      View in Debug Console
                    </a>
                    <a href="${SITE_URL}/admin/debug"
                       style="display: inline-block; background-color: #6b7280; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                      System Health
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                This is an automated notification from Emergency Planner.<br>
                <a href="${SITE_URL}/admin/settings" style="color: #1e40af;">Manage notification preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of the error email
 */
function generateErrorEmailText(data: ErrorNotificationData, user: { email?: string; displayName?: string } | null): string {
  const formattedDate = new Date(data.timestamp).toLocaleString();

  let text = `
🚨 SYSTEM ERROR ALERT - ${data.severity.toUpperCase()}
====================================================

Error: ${data.errorName}
Message: ${data.message}
${data.errorCode ? `Error Code: ${data.errorCode}` : ''}

CONTEXT
-------
Category: ${data.category}
Timestamp: ${formattedDate}
Log ID: ${data.logId}
${data.component ? `Component: ${data.component}` : ''}
${data.route ? `Route: ${data.route}` : ''}
${data.userAction ? `User Action: ${data.userAction}` : ''}
`;

  if (user) {
    text += `
AFFECTED USER
-------------
User ID: ${data.userId}
${user.email ? `Email: ${user.email}` : ''}
${user.displayName ? `Name: ${user.displayName}` : ''}
`;
  }

  if (data.suggestion) {
    text += `
SUGGESTED RESOLUTION
--------------------
${data.suggestion}
`;
  }

  if (data.stackTrace) {
    text += `
STACK TRACE
-----------
${data.stackTrace.slice(0, 2000)}${data.stackTrace.length > 2000 ? '\n... (truncated)' : ''}
`;
  }

  text += `
----------------------------------------------------
View in Debug Console: ${SITE_URL}/admin/debug?tab=logs&logId=${data.logId}
System Health: ${SITE_URL}/admin/debug

This is an automated notification from Emergency Planner.
`;

  return text.trim();
}

/**
 * Send error notification email to admin
 */
export async function sendAdminErrorNotification(data: ErrorNotificationData): Promise<{ success: boolean; error?: string }> {
  // Check if admin email is configured
  if (!ADMIN_EMAIL) {
    console.warn('[AdminNotifications] ADMIN_EMAIL not configured, skipping notification');
    return { success: false, error: 'ADMIN_EMAIL not configured' };
  }

  // Check if Resend API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('[AdminNotifications] RESEND_API_KEY not configured, skipping notification');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    // Fetch user details if userId is provided
    const user = await getUserDetails(data.userId);

    // Generate email content
    const html = generateErrorEmailHtml(data, user);
    const text = generateErrorEmailText(data, user);

    // Prepare subject line
    const severityEmoji = data.severity === 'critical' ? '🔴' : data.severity === 'error' ? '🟠' : '🟡';
    const subject = `${severityEmoji} [${data.severity.toUpperCase()}] ${data.errorName} - Emergency Planner`;

    // Send email
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('[AdminNotifications] Failed to send notification:', error);
      return { success: false, error: error.message };
    }

    console.log(`[AdminNotifications] Error notification sent to ${ADMIN_EMAIL}`);
    return { success: true };
  } catch (error) {
    console.error('[AdminNotifications] Exception sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a test notification to admin
 */
export async function sendTestAdminNotification(): Promise<{ success: boolean; error?: string }> {
  const testData: ErrorNotificationData = {
    logId: 'test-' + Date.now().toString(36),
    severity: 'info',
    category: 'system_error',
    errorCode: 'TEST_NOTIFICATION',
    errorName: 'Test Notification',
    message: 'This is a test notification to verify admin notifications are working correctly.',
    userAction: 'Testing admin notification system',
    component: 'AdminNotifications',
    route: '/admin/debug',
    suggestion: 'No action required - this is just a test notification.',
    timestamp: new Date().toISOString(),
  };

  return sendAdminErrorNotification(testData);
}

export default {
  sendAdminErrorNotification,
  sendTestAdminNotification,
};
