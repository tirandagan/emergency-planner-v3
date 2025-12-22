#!/usr/bin/env node

/**
 * Verify webhook configuration between local and deployed environments
 * Helps diagnose signature mismatch issues
 */

const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

console.log('='.repeat(80));
console.log('WEBHOOK CONFIGURATION VERIFICATION');
console.log('='.repeat(80));

// Check Next.js environment
const nextjsSecret = process.env.LLM_WEBHOOK_SECRET;

console.log('\nNext.js Environment (Local):');
console.log('  LLM_WEBHOOK_SECRET exists:', !!nextjsSecret);
if (nextjsSecret) {
  console.log('  Length:', nextjsSecret.length);
  console.log('  First 10 chars:', nextjsSecret.substring(0, 10));
  console.log('  Last 4 chars:', nextjsSecret.substring(nextjsSecret.length - 4));
  console.log('  Trimmed length:', nextjsSecret.trim().length);
  console.log('  Has whitespace:', nextjsSecret !== nextjsSecret.trim());

  // Check for common encoding issues
  const encoded = Buffer.from(nextjsSecret, 'utf8');
  console.log('  UTF-8 byte length:', encoded.length);
  console.log('  Contains null bytes:', encoded.includes(0));
  console.log('  Contains newlines:', nextjsSecret.includes('\n') || nextjsSecret.includes('\r'));
}

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSTIC TEST');
console.log('='.repeat(80));

// Create two versions of the secret to test
const testPayload = '{"test":"data"}';

if (nextjsSecret) {
  // Test 1: As-is from env
  const sig1 = crypto.createHmac('sha256', nextjsSecret).update(testPayload).digest('hex');
  console.log('\nSignature with raw secret:', `sha256=${sig1}`);

  // Test 2: Trimmed
  const sig2 = crypto.createHmac('sha256', nextjsSecret.trim()).update(testPayload).digest('hex');
  console.log('Signature with trimmed secret:', `sha256=${sig2}`);
  console.log('Signatures match?', sig1 === sig2);

  // Test 3: Check if secret might be base64 encoded incorrectly
  try {
    const decoded = Buffer.from(nextjsSecret, 'base64').toString('utf8');
    console.log('\nIf secret was base64 encoded:');
    console.log('  Decoded length:', decoded.length);
    console.log('  Decoded preview:', decoded.substring(0, 20) + '...');
    const sig3 = crypto.createHmac('sha256', decoded).update(testPayload).digest('hex');
    console.log('  Signature:', `sha256=${sig3}`);
  } catch (e) {
    console.log('\nSecret is not base64 encoded (expected)');
  }
}

console.log('\n' + '='.repeat(80));
console.log('DEPLOYED SERVICE COMPARISON');
console.log('='.repeat(80));
console.log('\nTo verify deployed LLM service secret:');
console.log('1. Check Render dashboard for llm-service-api environment variables');
console.log('2. Ensure LLM_WEBHOOK_SECRET exactly matches (no extra spaces/newlines)');
console.log('3. Both services should show same length (44 characters)');
console.log('4. Redeploy both services after confirming secrets match');
console.log('\n' + '='.repeat(80));
