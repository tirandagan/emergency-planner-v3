import { db } from '@/db';
import { profiles } from '@/db/schema/profiles';

/**
 * Create a test user for development
 * ID: 00000000-0000-0000-0000-000000000000
 */
async function createTestUser() {
  try {
    const testUserId = '00000000-0000-0000-0000-000000000000';

    // Check if test user already exists
    const existingUser = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, testUserId))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✓ Test user already exists');
      return;
    }

    // Create test user
    await db.insert(profiles).values({
      id: testUserId,
      email: 'test@example.com',
      role: 'user',
    });

    console.log('✓ Test user created successfully');
    console.log(`  ID: ${testUserId}`);
    console.log(`  Email: test@example.com`);
  } catch (error) {
    console.error('Failed to create test user:', error);
    process.exit(1);
  }
}

// Missing import
import { eq } from 'drizzle-orm';

createTestUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
