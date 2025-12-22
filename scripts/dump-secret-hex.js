#!/usr/bin/env node

/**
 * Dump secret as hex to see exact bytes
 */

require('dotenv').config({ path: '.env.local' });

const secret = process.env.LLM_WEBHOOK_SECRET;

if (!secret) {
  console.log('LLM_WEBHOOK_SECRET not found');
  process.exit(1);
}

console.log('Secret Analysis:');
console.log('Length:', secret.length);
console.log('String:', secret);
console.log('');
console.log('Hex dump (each character):');

for (let i = 0; i < secret.length; i++) {
  const char = secret[i];
  const code = secret.charCodeAt(i);
  const hex = code.toString(16).padStart(2, '0');
  console.log(`[${i.toString().padStart(2, ' ')}] '${char}' = 0x${hex} (${code})`);
}

console.log('');
console.log('Full hex:', Buffer.from(secret, 'utf8').toString('hex'));
console.log('');
console.log('Copy this to compare with LLM service:');
console.log(secret);
