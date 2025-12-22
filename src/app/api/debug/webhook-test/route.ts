import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

/**
 * DEBUG ENDPOINT: Test webhook signature validation
 *
 * This endpoint helps diagnose webhook signature issues by:
 * 1. Accepting the same payload format as the real webhook
 * 2. Logging the exact bytes received
 * 3. Calculating the expected signature
 * 4. Comparing with the received signature
 *
 * IMPORTANT: Remove or protect this endpoint in production!
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Read raw body (same as real webhook handler)
    const rawBody = await request.text();

    // Get signature header (try both possible names)
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-llm-signature');

    // Get secret from environment
    const webhookSecret = process.env.LLM_WEBHOOK_SECRET?.trim() || '';

    if (!webhookSecret) {
      return NextResponse.json({
        error: 'LLM_WEBHOOK_SECRET not configured',
        hint: 'Set LLM_WEBHOOK_SECRET in .env.local',
      }, { status: 500 });
    }

    // Calculate what the signature SHOULD be
    const expectedDigest = createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedSignature = `sha256=${expectedDigest}`;

    // Extract digest from received signature
    const receivedDigest = signature?.startsWith('sha256=')
      ? signature.substring(7)
      : signature;

    // Check if they match
    const isMatch = expectedDigest === receivedDigest;

    // Parse payload for display
    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(rawBody);
    } catch {
      parsedPayload = { error: 'Failed to parse JSON' };
    }

    return NextResponse.json({
      success: true,
      validation: {
        isMatch,
        matchStatus: isMatch ? '✅ VALID' : '❌ INVALID',
      },
      received: {
        bodyLength: rawBody.length,
        bodyPreview: rawBody.substring(0, 300),
        signature: signature || 'MISSING',
        signatureDigest: receivedDigest || 'MISSING',
      },
      calculated: {
        expectedSignature,
        expectedDigest,
      },
      configuration: {
        secretLength: webhookSecret.length,
        secretPreview: `${webhookSecret.substring(0, 10)}...${webhookSecret.substring(webhookSecret.length - 4)}`,
      },
      payload: parsedPayload,
      diagnostics: {
        bodyHasSpaces: rawBody.includes(', ') || rawBody.includes(': '),
        bodyHasNewlines: rawBody.includes('\n'),
        firstChar: rawBody.charAt(0),
        lastChar: rawBody.charAt(rawBody.length - 1),
      },
    }, { status: 200 });

  } catch (error) {
    console.error('[Webhook Test] Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
