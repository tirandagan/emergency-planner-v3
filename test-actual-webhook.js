#!/usr/bin/env node
/**
 * Test actual webhook signature from database
 *
 * Run this script to test signature validation with real webhook data
 */

const crypto = require('crypto');

// From your screenshot - actual webhook callback
const actualCallbackId = '406d2af5-ddb9-4c5a-a55e-2f5e831700f9';
const actualSignature = 'sha256=b0749644811afe1612d57e8f05b252e2b0cf85077fccd054723866db31327b31';
const secret = 'xAZd/X36nt1+U813leiiboWFgbm7+CsWxQYl8RON6r0=';

// Actual payload from the screenshot (truncated for brevity in visible part)
// This is what we need to get the FULL version of to test properly

console.log('='.repeat(80));
console.log('ACTUAL WEBHOOK SIGNATURE TEST');
console.log('='.repeat(80));
console.log('\nCallback ID:', actualCallbackId);
console.log('Signature:  ', actualSignature);
console.log('Secret:     ', secret.substring(0, 10) + '...');

console.log('\n' + '='.repeat(80));
console.log('TESTING DIFFERENT PAYLOAD FORMATS');
console.log('='.repeat(80));

// The issue is that we need the EXACT payload that was sent
// Let's test with a minimal version first
const testPayloads = [
  {
    name: 'Minimal (no metadata)',
    payload: {
      "event": "workflow.completed",
      "job_id": "406d2af5-ddb9-4c5a-a55e-2f5e831700f9",
      "workflow_name": "emergency_contacts"
    }
  },
  {
    name: 'With result object',
    payload: {
      "event": "workflow.completed",
      "job_id": "406d2af5-ddb9-4c5a-a55e-2f5e831700f9",
      "result": {
        "output": {
          "contacts": []
        }
      },
      "workflow_name": "emergency_contacts"
    }
  }
];

testPayloads.forEach(({ name, payload }) => {
  // Python uses: json.dumps(payload, separators=(',', ':'), sort_keys=True)
  // This creates compact JSON with NO spaces and SORTED keys

  // Step 1: Sort keys recursively
  function sortObjectKeys(obj) {
    if (Array.isArray(obj)) {
      return obj.map(sortObjectKeys);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
          result[key] = sortObjectKeys(obj[key]);
          return result;
        }, {});
    }
    return obj;
  }

  const sortedPayload = sortObjectKeys(payload);

  // Step 2: Serialize with NO spaces (separators=(',', ':'))
  const compactJson = JSON.stringify(sortedPayload, null, 0)
    .replace(/,\s*/g, ',')  // Remove spaces after commas
    .replace(/:\s*/g, ':'); // Remove spaces after colons

  // Step 3: Generate signature
  const signature = crypto
    .createHmac('sha256', secret)
    .update(compactJson)
    .digest('hex');

  const fullSignature = `sha256=${signature}`;
  const isMatch = fullSignature === actualSignature;

  console.log(`\n${name}:`);
  console.log('  Payload length:', compactJson.length);
  console.log('  Signature:', fullSignature);
  console.log('  Match:', isMatch ? '✅ YES' : '❌ NO');

  if (isMatch) {
    console.log('\n' + '='.repeat(80));
    console.log('✅✅✅ SUCCESS! SIGNATURE MATCHED! ✅✅✅');
    console.log('='.repeat(80));
    console.log('\nPayload that was signed:');
    console.log(compactJson);
  }
});

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSIS');
console.log('='.repeat(80));
console.log(`
To find the exact issue, we need to:

1. Get the FULL payload JSON from the database
2. Test signature generation with that exact payload
3. Compare byte-by-byte with what Python sends

The signature format is correct: sha256=<hex_digest>
The secret appears to be loaded correctly.
The issue is likely in the JSON serialization.

Python uses: json.dumps(payload, separators=(',', ':'), sort_keys=True)
This creates:
  - No whitespace after : or ,
  - Keys sorted alphabetically (at ALL levels recursively)
  - Compact format

Node.js by default includes spaces, which breaks the signature.
`);

console.log('\n' + '='.repeat(80));
