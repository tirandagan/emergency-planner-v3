import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createLLMCallback } from '@/lib/llm-callbacks';
import { getAdminEmail } from '@/db/queries/system-settings';
import { handleEmergencyContactsComplete } from '@/lib/ai/webhook-handlers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = `BePrepared.AI Security Alert <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://beprepared.ai';

const MAX_PAYLOAD_SIZE = 1_048_576; // 1MB
let lastSecretMissingAlert: number | null = null;

/**
 * Verify HMAC-SHA256 webhook signature against raw body
 * Prevents timing attacks with constant-time comparison
 */
function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expectedDigest = signature.substring(7); // Remove 'sha256=' prefix

  const actualDigest = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (expectedDigest.length !== actualDigest.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(expectedDigest),
    Buffer.from(actualDigest)
  );
}

/**
 * Send hourly alert to admins when webhook secret is missing
 * Rate limited to once per hour to avoid spam
 */
async function sendSecretMissingAlert(): Promise<void> {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (lastSecretMissingAlert && (now - lastSecretMissingAlert) < oneHour) {
    return;
  }

  lastSecretMissingAlert = now;

  try {
    const adminEmail = await getAdminEmail();

    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: '🚨 LLM Webhook Secret Missing - Action Required',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #7f1d1d; color: #fef2f2; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 Security Alert</h1>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 2px solid #dc2626; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #991b1b; margin-top: 0;">LLM Webhook Secret Missing</h2>

            <p style="color: #374151; line-height: 1.6;">
              The <code style="background: #fef2f2; padding: 2px 6px; border-radius: 4px; color: #dc2626;">LLM_WEBHOOK_SECRET</code>
              environment variable is not configured. This prevents webhook signature verification, which is a critical security requirement.
            </p>

            <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #991b1b; font-size: 16px;">⚠️ Security Impact</h3>
              <ul style="margin: 0; color: #7f1d1d; line-height: 1.8;">
                <li>Webhooks cannot verify authenticity</li>
                <li>System is vulnerable to spoofed callbacks</li>
                <li>Potential for malicious payload injection</li>
              </ul>
            </div>

            <h3 style="color: #374151; margin-top: 25px;">🔧 How to Fix</h3>
            <ol style="color: #374151; line-height: 1.8;">
              <li>Add <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">LLM_WEBHOOK_SECRET=&lt;secret&gt;</code> to your <code>.env.local</code> file</li>
              <li>Ensure the secret matches the LLM service configuration</li>
              <li>Restart the application to load the new environment variable</li>
              <li>Verify webhooks are processing with signature validation enabled</li>
            </ol>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This alert will repeat hourly until the issue is resolved.
              </p>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                <strong>Dashboard:</strong> <a href="${SITE_URL}/admin/debug" style="color: #2563eb;">View Admin Debug Panel</a>
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.error('[LLM Webhook] Security alert sent: LLM_WEBHOOK_SECRET missing');
  } catch (error) {
    console.error('[LLM Webhook] Failed to send security alert:', error);
  }
}

/**
 * POST /api/webhooks/llm-callback
 * Receives callbacks from LLM service with signature verification
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Check payload size limit BEFORE reading body
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      console.error('[LLM Webhook] Payload too large:', contentLength);
      return NextResponse.json(
        { error: 'Payload too large', maxSize: '1MB' },
        { status: 413 }
      );
    }

    // 2. Read raw body (needed for signature verification)
    const rawBody = await request.text();

    if (rawBody.length > MAX_PAYLOAD_SIZE) {
      console.error('[LLM Webhook] Payload too large:', rawBody.length);
      return NextResponse.json(
        { error: 'Payload too large', maxSize: '1MB' },
        { status: 413 }
      );
    }

    // 3. Get signature header (try both possible header names)
    const signature = request.headers.get('x-llm-signature') || request.headers.get('x-webhook-signature');

    if (!signature) {
      console.error('[LLM Webhook] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 401 }
      );
    }

    // 4. Check if webhook secret is configured
    const webhookSecret = process.env.LLM_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[LLM Webhook] LLM_WEBHOOK_SECRET not configured - sending alert');
      await sendSecretMissingAlert();

      // Accept webhook but store with signature_valid = false
      const payload = JSON.parse(rawBody);
      await createLLMCallback({
        callbackId: payload.job_id || `unsigned-${Date.now()}`,
        signatureValid: false,
        signatureHeader: signature,
        verifiedAt: null,
        payload,
        payloadPreview: rawBody.substring(0, 200),
        externalJobId: payload.job_id,
        workflowName: payload.workflow_name,
        eventType: payload.event,
      });

      return NextResponse.json(
        {
          received: true,
          warning: 'Webhook secret not configured - signature not verified'
        },
        { status: 200 }
      );
    }

    // 5. Verify signature against raw body
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('[LLM Webhook] Invalid signature');

      // Store callback with invalid signature for security monitoring
      const payload = JSON.parse(rawBody);
      await createLLMCallback({
        callbackId: payload.job_id || `invalid-${Date.now()}`,
        signatureValid: false,
        signatureHeader: signature,
        verifiedAt: null,
        payload,
        payloadPreview: rawBody.substring(0, 200),
        externalJobId: payload.job_id,
        workflowName: payload.workflow_name,
        eventType: payload.event,
      });

      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 6. Parse JSON payload (only after signature verification)
    const payload = JSON.parse(rawBody);

    // 7. Extract fields for database storage
    const callbackId = payload.job_id;

    if (!callbackId) {
      console.error('[LLM Webhook] Missing job_id in payload');
      return NextResponse.json(
        { error: 'Missing job_id in payload' },
        { status: 400 }
      );
    }

    // 8. Create payload preview (first 200 chars)
    const payloadPreview = JSON.stringify(payload).substring(0, 200);

    // 9. Store to database (idempotent upsert)
    await createLLMCallback({
      callbackId,
      signatureValid: true,
      signatureHeader: signature,
      verifiedAt: new Date(),
      payload,
      payloadPreview,
      externalJobId: payload.job_id,
      workflowName: payload.workflow_name || null,
      eventType: payload.event || null,
    });

    console.log('[LLM Webhook] Callback stored successfully:', callbackId);

    // 10. Handle workflow-specific processing (Async - don't block response)
    // Try to get user_id from payload top-level or result.metadata
    const userId = payload.user_id || payload.result?.metadata?.user_id;

    if (payload.event === 'workflow.completed' && userId) {
      if (payload.workflow_name === 'emergency_contacts') {
        // Trigger processing but don't await to keep webhook response <200ms
        handleEmergencyContactsComplete(userId, payload.result).catch(err => {
          console.error('[LLM Webhook] Async processing failed:', err);
        });
      }
    }

    // 11. Return 200 OK immediately (<200ms target)
    return NextResponse.json(
      { received: true, callbackId },
      { status: 200 }
    );

  } catch (error) {
    console.error('[LLM Webhook] Error processing webhook:', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
