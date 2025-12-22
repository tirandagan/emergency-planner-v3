#!/usr/bin/env node

/**
 * Test webhook signature generation to debug mismatch
 * This script tests HMAC signature generation with the exact same data
 */

const crypto = require('crypto');

const SECRET = 'xAZd/X36nt1+U813leiiboWFgbm7+CsWxQYl8RON6r0=';

// Sample payload from logs (first 300 chars shown in logs)
const samplePayload = {
  "cost_data": {
    "cost_usd": 0.0,
    "llm_calls": [{
      "cost_usd": 0.014706,
      "duration_ms": 14451,
      "input_tokens": 1842,
      "metadata": {"step_id": "generate_contacts"},
      "model": "anthropic/claude-3.5-sonnet",
      "output_tokens": 612,
      "provider": "openrouter",
      "total_tokens": 2454
    }],
    "total_tokens": 2454
  },
  "duration_ms": 17707,
  "event": "workflow.completed"
};

console.log('='.repeat(80));
console.log('WEBHOOK SIGNATURE GENERATION TEST');
console.log('='.repeat(80));

console.log('\nSecret:');
console.log('  Length:', SECRET.length);
console.log('  First 10 chars:', SECRET.substring(0, 10));
console.log('  Last 4 chars:', SECRET.substring(SECRET.length - 4));

// Test 1: JSON.stringify with default settings (what JavaScript normally does)
console.log('\n' + '='.repeat(80));
console.log('TEST 1: Default JSON.stringify (JavaScript default)');
console.log('='.repeat(80));

const defaultJson = JSON.stringify(samplePayload);
console.log('Payload length:', defaultJson.length);
console.log('First 200 chars:', defaultJson.substring(0, 200));
console.log('Has spaces after colons:', defaultJson.includes(': '));
console.log('Has spaces after commas:', defaultJson.includes(', '));

const defaultSignature = crypto
  .createHmac('sha256', SECRET)
  .update(defaultJson)
  .digest('hex');

console.log('Signature:', `sha256=${defaultSignature}`);

// Test 2: Compact JSON (Python style - what LLM service uses)
console.log('\n' + '='.repeat(80));
console.log('TEST 2: Compact JSON.stringify (Python style)');
console.log('='.repeat(80));

const compactJson = JSON.stringify(samplePayload, null, 0);
console.log('Payload length:', compactJson.length);
console.log('First 200 chars:', compactJson.substring(0, 200));
console.log('Same as default?', compactJson === defaultJson);

const compactSignature = crypto
  .createHmac('sha256', SECRET)
  .update(compactJson)
  .digest('hex');

console.log('Signature:', `sha256=${compactSignature}`);

// Test 3: Sorted keys (Python uses sort_keys=True)
console.log('\n' + '='.repeat(80));
console.log('TEST 3: Sorted keys');
console.log('='.repeat(80));

function sortedStringify(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

const sortedJson = sortedStringify(samplePayload);
console.log('Payload length:', sortedJson.length);
console.log('First 200 chars:', sortedJson.substring(0, 200));

const sortedSignature = crypto
  .createHmac('sha256', SECRET)
  .update(sortedJson)
  .digest('hex');

console.log('Signature:', `sha256=${sortedSignature}`);

// Test 4: Check for whitespace in secret
console.log('\n' + '='.repeat(80));
console.log('TEST 4: Secret validation');
console.log('='.repeat(80));

const secretTrimmed = SECRET.trim();
console.log('Secret has leading/trailing whitespace?', SECRET !== secretTrimmed);
console.log('Secret before trim length:', SECRET.length);
console.log('Secret after trim length:', secretTrimmed.length);

if (SECRET !== secretTrimmed) {
  const trimmedSignature = crypto
    .createHmac('sha256', secretTrimmed)
    .update(defaultJson)
    .digest('hex');
  console.log('Signature with trimmed secret:', `sha256=${trimmedSignature}`);
}

// Test 5: Compare with received signature from logs
console.log('\n' + '='.repeat(80));
console.log('TEST 5: Compare with actual webhook signatures from logs');
console.log('='.repeat(80));

const receivedSignature = '14aa6e2fac24bb197b1c652f28f506b954d586e2ce987de8e745dc319b5eb862';
const expectedSignature = '8537695a64e401f9956fb64a8556bd2fd61eaf83564de701066154206968a068';

console.log('Received from LLM service:', `sha256=${receivedSignature}`);
console.log('Expected by Next.js:', `sha256=${expectedSignature}`);
console.log('');
console.log('Match with default JSON?', defaultSignature === receivedSignature);
console.log('Match with compact JSON?', compactSignature === receivedSignature);
console.log('Match with sorted JSON?', sortedSignature === receivedSignature);

console.log('\n' + '='.repeat(80));
console.log('NEXT STEPS');
console.log('='.repeat(80));
console.log('1. Check if LLM service is using trimmed secret');
console.log('2. Check if there are any JSON serialization differences');
console.log('3. Verify both services are reading same environment variable');
console.log('4. Check for Base64 encoding issues in the secret');
console.log('='.repeat(80));
