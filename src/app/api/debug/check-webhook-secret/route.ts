import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';

/**
 * DEBUG endpoint to verify webhook secret configuration
 * Returns hash of secret to confirm it matches between services
 * DO NOT expose the actual secret!
 */
export async function GET(): Promise<NextResponse> {
  const secret = process.env.LLM_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({
      configured: false,
      error: 'LLM_WEBHOOK_SECRET not set',
    });
  }

  // Create a hash of the secret (safe to expose)
  const secretHash = createHmac('sha256', 'test-key')
    .update(secret)
    .digest('hex');

  // Test signature with known payload
  const testPayload = '{"test":"data"}';
  const testSignature = createHmac('sha256', secret)
    .update(testPayload)
    .digest('hex');

  return NextResponse.json({
    configured: true,
    secretLength: secret.length,
    secretHash,
    secretPreview: `${secret.substring(0, 10)}...${secret.substring(secret.length - 4)}`,
    hasTrimmedDifference: secret !== secret.trim(),
    testPayload,
    testSignature: `sha256=${testSignature}`,
  });
}
