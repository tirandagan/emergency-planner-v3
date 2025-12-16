/**
 * Alternative diagnostic script using Supabase client directly
 * Run with: npx tsx check-admin-supabase.ts <user-email>
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

const userEmail = process.argv[2]

if (!userEmail) {
  console.error('Usage: npx tsx check-admin-supabase.ts <user-email>')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('📡 Connecting to Supabase:', supabaseUrl)

async function checkAdminStatus(): Promise<void> {
  try {
    // TypeScript narrowing: we've already validated these exist above
    const supabase = createClient(supabaseUrl!, supabaseKey!, {
      auth: { persistSession: false }
    })

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, subscription_tier')
      .eq('email', userEmail)
      .single()

    if (error) {
      console.error('❌ Error fetching profile:', error.message)
      process.exit(1)
    }

    if (!data) {
      console.error(`❌ No profile found for email: ${userEmail}`)
      process.exit(1)
    }

    console.log('\n✅ Profile found:')
    console.log('─────────────────────────────────────')
    console.log(`ID:              ${data.id}`)
    console.log(`Email:           ${data.email}`)
    console.log(`Name:            ${data.full_name || '(not set)'}`)
    console.log(`Role:            ${data.role} ${data.role === 'ADMIN' ? '👑' : '👤'}`)
    console.log(`Subscription:    ${data.subscription_tier}`)
    console.log('─────────────────────────────────────\n')

    if (data.role === 'ADMIN') {
      console.log('✅ User IS an admin')
      console.log('\n💡 If the admin menu is not showing:')
      console.log('   1. Clear browser localStorage')
      console.log('   2. Sign out and sign back in')
      console.log('   3. Hard refresh the page (Ctrl+Shift+R)')
    } else {
      console.log('ℹ️  User is NOT an admin (role: ' + data.role + ')')
      console.log('\n💡 To make this user an admin, run:')
      console.log(`   UPDATE profiles SET role = 'ADMIN' WHERE email = '${userEmail}';`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error checking admin status:', error)
    process.exit(1)
  }
}

checkAdminStatus()
