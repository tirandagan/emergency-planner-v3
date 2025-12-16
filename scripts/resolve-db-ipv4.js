#!/usr/bin/env node

/**
 * Resolves Supabase pooler hostname to IPv4 address
 * Usage: node scripts/resolve-db-ipv4.js
 *
 * This script helps resolve IPv6 connectivity issues on hosting platforms
 * that don't support IPv6 (like Render) by converting the DATABASE_URL
 * to use an IPv4 address instead of a hostname.
 */

const dns = require('dns').promises;

async function resolveToIPv4(hostname) {
  try {
    // Force IPv4 lookup
    const addresses = await dns.resolve4(hostname);
    return addresses[0]; // Return first IPv4 address
  } catch (error) {
    console.error(`Failed to resolve ${hostname}:`, error.message);
    process.exit(1);
  }
}

async function main() {
  const originalUrl = process.env.DATABASE_URL;

  if (!originalUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set');
    console.error('\nUsage:');
    console.error('  DATABASE_URL="your-connection-string" node scripts/resolve-db-ipv4.js');
    process.exit(1);
  }

  try {
    // Parse the connection string
    const url = new URL(originalUrl);
    const originalHostname = url.hostname;

    console.log('Original hostname:', originalHostname);
    console.log('Resolving to IPv4...\n');

    // Resolve to IPv4
    const ipv4Address = await resolveToIPv4(originalHostname);

    console.log('✓ Resolved to IPv4:', ipv4Address);

    // Create new connection string with IPv4
    const ipv4Url = originalUrl.replace(originalHostname, ipv4Address);

    console.log('\n' + '='.repeat(80));
    console.log('IPv4 CONNECTION STRING:');
    console.log('='.repeat(80));
    console.log(ipv4Url);
    console.log('='.repeat(80));
    console.log('\nSet this as your DATABASE_URL on Render to avoid IPv6 connectivity issues.');
    console.log('\nIMPORTANT: This IP address may change. If connection fails in the future,');
    console.log('run this script again to get the updated IPv4 address.');

  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

main();
