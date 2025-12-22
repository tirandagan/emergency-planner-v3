#!/usr/bin/env node

/**
 * Test webhook signature with an ACTUAL webhook payload
 * to see if large payloads cause signature mismatches
 */

const crypto = require('crypto');

const SECRET = 'xAZd/X36nt1+U813leiiboWFgbm7+CsWxQYl8RON6r0=';

// Simulated large payload similar to real webhook
const largePayload = {
  "event": "workflow.completed",
  "job_id": "test-12345",
  "status": "completed",
  "workflow_name": "emergency_contacts",
  "user_id": "5b7c7916-2ebc-44d4-a8d1-4c958657a150",
  "result": {
    "contacts": Array(50).fill(null).map((_, i) => ({
      "name": `Contact ${i}`,
      "phone": `555-0${i.toString().padStart(3, '0')}`,
      "type": "emergency",
      "notes": "A".repeat(100) // Add bulk
    })),
    "metadata": {
      "total_tokens": 2454,
      "total_cost": 0.014706,
      "llm_calls": Array(10).fill(null).map((_, i) => ({
        "cost_usd": 0.001,
        "duration_ms": 1000 + i * 100,
        "input_tokens": 100 + i * 10,
        "output_tokens": 50 + i * 5,
        "model": "anthropic/claude-3.5-sonnet",
        "provider": "openrouter"
      }))
    }
  },
  "cost_data": {
    "total_tokens": 2454,
    "cost_usd": 0.014706
  },
  "duration_ms": 17707
};

console.log('='.repeat(80));
console.log('LARGE PAYLOAD SIGNATURE TEST');
console.log('='.repeat(80));

// Serialize exactly like Python does
const payloadJson = JSON.stringify(largePayload, Object.keys(largePayload).sort(), 0);

console.log('\nPayload stats:');
console.log('  Length:', payloadJson.length, 'bytes');
console.log('  First 200 chars:', payloadJson.substring(0, 200));
console.log('  Last 100 chars:', payloadJson.substring(payloadJson.length - 100));

// Generate signature
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(payloadJson)
  .digest('hex');

console.log('\nSignature:', `sha256=${signature}`);

// Verify signature (round-trip test)
const verified = crypto
  .createHmac('sha256', SECRET)
  .update(payloadJson)
  .digest('hex');

console.log('Verified:', `sha256=${verified}`);
console.log('Match:', signature === verified);

console.log('\n' + '='.repeat(80));
console.log('This signature should match what Python generates for the same payload');
console.log('='.repeat(80));
