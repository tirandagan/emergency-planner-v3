/**
 * Quick diagnostic script to check admin status in database
 * Run with: npx tsx check-admin-status.ts <user-email>
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file and override shell environment variables
config({ path: resolve(process.cwd(), '.env.local'), override: true })

// Debug: Check if DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables')
  console.error('Please check your .env.local file')
  process.exit(1)
}

// Show connection info (hide password)
const dbUrl = process.env.DATABASE_URL
const urlParts = dbUrl.match(/^postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)$/)
if (urlParts) {
  const [, user, , host, database] = urlParts
  console.log('📡 Connecting to:', { host, database, user })
} else {
  console.log('📡 DATABASE_URL format seems invalid')
}

// Show the actual URL format (with password hidden)
const sanitizedUrl = dbUrl.replace(/:([^@]+)@/, ':****@')
console.log('📡 Full connection string:', sanitizedUrl)
console.log('📡 URL starts with:', dbUrl.substring(0, 20))
console.log('')

const userEmail = process.argv[2]

if (!userEmail) {
  console.error('Usage: npx tsx check-admin-status.ts <user-email>')
  process.exit(1)
}

async function checkAdminStatus(): Promise<void> {
  try {
    // Dynamic import AFTER environment variables are loaded
    const { db } = await import('@/db')
    const { profiles } = await import('@/db/schema/profiles')
    const { eq } = await import('drizzle-orm')

    const [profile] = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        fullName: profiles.fullName,
        role: profiles.role,
        subscriptionTier: profiles.subscriptionTier,
      })
      .from(profiles)
      .where(eq(profiles.email, userEmail))
      .limit(1)

    if (!profile) {
      console.error(`❌ No profile found for email: ${userEmail}`)
      process.exit(1)
    }

    console.log('\n✅ Profile found:')
    console.log('─────────────────────────────────────')
    console.log(`ID:              ${profile.id}`)
    console.log(`Email:           ${profile.email}`)
    console.log(`Name:            ${profile.fullName || '(not set)'}`)
    console.log(`Role:            ${profile.role} ${profile.role === 'ADMIN' ? '👑' : '👤'}`)
    console.log(`Subscription:    ${profile.subscriptionTier}`)
    console.log('─────────────────────────────────────\n')

    if (profile.role === 'ADMIN') {
      console.log('✅ User IS an admin')
    } else {
      console.log('ℹ️  User is NOT an admin (role: ' + profile.role + ')')
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error checking admin status:', error)
    process.exit(1)
  }
}

checkAdminStatus()
