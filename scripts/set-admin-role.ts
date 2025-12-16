#!/usr/bin/env tsx
/**
 * One-time script to set admin role for test user
 * Usage: npx tsx scripts/set-admin-role.ts
 */

import { db } from '../src/db';
import { profiles } from '../src/db/schema/profiles';
import { eq } from 'drizzle-orm';

const ADMIN_EMAIL = 'tiran@tirandagan.com';

async function setAdminRole() {
  try {
    console.log(`Setting admin role for ${ADMIN_EMAIL}...`);

    // Update the user's role to ADMIN
    const result = await db
      .update(profiles)
      .set({ role: 'ADMIN' })
      .where(eq(profiles.email, ADMIN_EMAIL))
      .returning({ id: profiles.id, email: profiles.email, role: profiles.role });

    if (result.length === 0) {
      console.error(`❌ User not found: ${ADMIN_EMAIL}`);
      console.log('Please ensure the user has signed up first.');
      process.exit(1);
    }

    console.log('✅ Admin role set successfully!');
    console.log('User:', result[0]);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
    process.exit(1);
  }
}

setAdminRole();
