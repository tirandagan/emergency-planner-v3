#!/usr/bin/env node
/**
 * Debug webhook signature validation
 *
 * This script helps diagnose why webhook signatures are failing by:
 * 1. Simulating the exact payload serialization from Python
 * 2. Generating the expected signature
 * 3. Comparing with what the webhook receiver gets
 */

const crypto = require('crypto');

// Example from your screenshot
const signatureHeader = 'sha256=b0749644811afe1612d57e8f05b252e2b0cf85077fccd054723866db31327b31';
const secret = 'xAZd/X36nt1+U813leiiboWFgbm7+CsWxQYl8RON6r0=';

// Example payload (from screenshot)
const payload = {
  "event": "workflow.completed",
  "job_id": "406d2af5-ddb9-4c5a-a55e-2f5e831700f9",
  "result": {
    "output": {
      "contacts": [
        {
          "name": "Emergency Services (911)",
          "phone": "+1-911",
          "address": null,
          "website": null,
          "category": "government",
          "priority": "critical",
          "fit_score": 100,
          "reasoning": "Universal emergency number for immediate life-threatening situations"
        }
      ]
    }
  },
  "workflow_name": "emergency_contacts"
};

console.log('='.repeat(80));
console.log('WEBHOOK SIGNATURE DEBUG');
console.log('='.repeat(80));

// Test 1: Compact JSON (Python default with separators=(',', ':'))
const compactJson = JSON.stringify(payload, null, 0);
const compactSignature = crypto
  .createHmac('sha256', secret)
  .update(compactJson)
  .digest('hex');

console.log('\n1. COMPACT JSON (no spaces):');
console.log('   Length:', compactJson.length);
console.log('   Signature:', `sha256=${compactSignature}`);
console.log('   Match:', `sha256=${compactSignature}` === signatureHeader ? '✅ YES' : '❌ NO');

// Test 2: Compact JSON with sorted keys
const sortedCompactJson = JSON.stringify(payload, Object.keys(payload).sort(), 0);
const sortedCompactSignature = crypto
  .createHmac('sha256', secret)
  .update(sortedCompactJson)
  .digest('hex');

console.log('\n2. COMPACT JSON (sorted keys):');
console.log('   Length:', sortedCompactJson.length);
console.log('   Signature:', `sha256=${sortedCompactSignature}`);
console.log('   Match:', `sha256=${sortedCompactSignature}` === signatureHeader ? '✅ YES' : '❌ NO');

// Test 3: Pretty JSON (formatted with spaces)
const prettyJson = JSON.stringify(payload, null, 2);
const prettySignature = crypto
  .createHmac('sha256', secret)
  .update(prettyJson)
  .digest('hex');

console.log('\n3. PRETTY JSON (2 spaces):');
console.log('   Length:', prettyJson.length);
console.log('   Signature:', `sha256=${prettySignature}`);
console.log('   Match:', `sha256=${prettySignature}` === signatureHeader ? '✅ YES' : '❌ NO');

// Test 4: Custom replacer for true sorted keys
function sortKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] = sortKeys(obj[key]);
        return result;
      }, {});
  }
  return obj;
}

const trulySortedJson = JSON.stringify(sortKeys(payload));
const trulySortedSignature = crypto
  .createHmac('sha256', secret)
  .update(trulySortedJson)
  .digest('hex');

console.log('\n4. TRULY SORTED JSON (recursive sort):');
console.log('   Length:', trulySortedJson.length);
console.log('   Signature:', `sha256=${trulySortedSignature}`);
console.log('   Match:', `sha256=${trulySortedSignature}` === signatureHeader ? '✅ YES' : '❌ NO');

console.log('\n' + '='.repeat(80));
console.log('EXPECTED SIGNATURE FROM HEADER');
console.log('='.repeat(80));
console.log(signatureHeader);

console.log('\n' + '='.repeat(80));
console.log('SECRET CONFIGURATION');
console.log('='.repeat(80));
console.log('Secret length:', secret.length);
console.log('Secret preview:', secret.substring(0, 10) + '...');

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSIS');
console.log('='.repeat(80));

if (`sha256=${compactSignature}` === signatureHeader) {
  console.log('✅ SUCCESS: Signature matches compact JSON format');
  console.log('   The webhook sender is using compact JSON serialization.');
} else if (`sha256=${trulySortedSignature}` === signatureHeader) {
  console.log('✅ SUCCESS: Signature matches sorted JSON format');
  console.log('   The webhook sender is using sorted key JSON serialization.');
} else {
  console.log('❌ FAILURE: None of the tested formats match');
  console.log('   Possible issues:');
  console.log('   1. Secret mismatch between sender and receiver');
  console.log('   2. Payload modification during transmission');
  console.log('   3. Different JSON serialization library behavior');
  console.log('   4. Character encoding issues');
  console.log('\n   Next steps:');
  console.log('   1. Check LLM_WEBHOOK_SECRET in both .env.local files');
  console.log('   2. Log the raw body in webhook handler');
  console.log('   3. Compare exact bytes being signed vs received');
}

console.log('\n' + '='.repeat(80));
