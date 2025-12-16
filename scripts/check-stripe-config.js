#!/usr/bin/env node

/**
 * Check Stripe configuration for missing environment variables
 * Run: node scripts/check-stripe-config.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 Checking Stripe Configuration...\n');

const requiredVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_BASIC_PRICE_ID',
  'STRIPE_PRO_PRICE_ID',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_SITE_URL',
];

let allPresent = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? `${value.substring(0, 20)}...` : 'NOT SET';
  
  console.log(`${status} ${varName}: ${display}`);
  
  if (!value) {
    allPresent = false;
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (allPresent) {
  console.log('✅ All Stripe environment variables are configured!\n');
  console.log('If checkout still fails, check:');
  console.log('  1. Stripe dashboard → Developers → API keys (keys are valid)');
  console.log('  2. Stripe dashboard → Products → Verify Price IDs exist');
  console.log('  3. Browser console for error toast message');
  console.log('  4. Terminal logs for Stripe API errors\n');
} else {
  console.log('❌ Missing Stripe configuration!\n');
  console.log('Add these to your .env.local file:\n');
  console.log('# Stripe Configuration');
  console.log('STRIPE_SECRET_KEY=sk_test_...');
  console.log('STRIPE_BASIC_PRICE_ID=price_...');
  console.log('STRIPE_PRO_PRICE_ID=price_...');
  console.log('STRIPE_WEBHOOK_SECRET=whsec_...');
  console.log('NEXT_PUBLIC_SITE_URL=http://localhost:3000\n');
  console.log('Get these values from:');
  console.log('  • Stripe Dashboard → Developers → API keys');
  console.log('  • Stripe Dashboard → Products → Create prices for Basic ($9.99/mo) and Pro ($49.99/mo)\n');
}

