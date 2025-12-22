#!/usr/bin/env node
/**
 * Test webhook secret loading and validation
 */

require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

const secret = process.env.LLM_WEBHOOK_SECRET || '';

console.log('='.repeat(80));
console.log('WEBHOOK SECRET VALIDATION');
console.log('='.repeat(80));

console.log('\nSecret loaded:', secret ? '✅ YES' : '❌ NO');

if (secret) {
  console.log('Secret length:', secret.length);
  console.log('Secret preview:', `${secret.substring(0, 10)}...${secret.substring(secret.length - 4)}`);
  console.log('Has whitespace:', /\s/.test(secret) ? '⚠️  YES (PROBLEM!)' : '✅ NO');
  console.log('Has quotes:', /["']/.test(secret) ? '⚠️  YES (PROBLEM!)' : '✅ NO');

  // Test signature generation
  const testPayload = '{"test":"data"}';
  const testSig = crypto.createHmac('sha256', secret.trim()).update(testPayload).digest('hex');
  console.log('\nTest signature:', `sha256=${testSig}`);
  console.log('Signature length:', testSig.length, '(should be 64)');
} else {
  console.log('\n❌ LLM_WEBHOOK_SECRET not found in .env.local');
  console.log('   Make sure .env.local exists in:', process.cwd());
}

console.log('\n' + '='.repeat(80));
