'use server'

import { createClient } from '@/utils/supabase/server'
import { checkAdmin, getAdminUser } from '@/lib/adminAuth'
import { db } from '@/db'
import { userActivityLog } from '@/db/schema/analytics'
import { profiles } from '@/db/schema/profiles'
import { systemLogs, type SystemLogSeverity, type SystemLogCategory } from '@/db/schema/system-logs'
import { desc, sql, eq, isNull, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { sendTestAdminNotification } from '@/lib/admin-notifications'

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

export type ServiceHealth = {
  name: string
  status: HealthStatus
  latency?: number
  message?: string
  details?: Record<string, unknown>
}

export type SystemHealth = {
  overall: HealthStatus
  services: ServiceHealth[]
  checkedAt: string
}

export type ActivityLogEntry = {
  id: string
  userId: string
  userEmail?: string
  activityType: string
  metadata: Record<string, unknown> | null
  createdAt: Date
}

// Check database connectivity
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now()
  try {
    await db.execute(sql`SELECT 1 as ping`)
    const latency = Date.now() - start

    // Also check profile count as a simple data check
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles)

    return {
      name: 'Database (PostgreSQL)',
      status: latency > 1000 ? 'degraded' : 'healthy',
      latency,
      message: `Connected. ${countResult.count} users in system.`,
      details: { userCount: countResult.count }
    }
  } catch (error) {
    return {
      name: 'Database (PostgreSQL)',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Check Supabase Auth
async function checkSupabaseAuth(): Promise<ServiceHealth> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getSession()
    const latency = Date.now() - start

    if (error) {
      return {
        name: 'Supabase Auth',
        status: 'degraded',
        latency,
        message: error.message
      }
    }

    return {
      name: 'Supabase Auth',
      status: 'healthy',
      latency,
      message: data.session ? 'Authenticated session active' : 'Service responding'
    }
  } catch (error) {
    return {
      name: 'Supabase Auth',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Check Stripe connectivity
async function checkStripe(): Promise<ServiceHealth> {
  const start = Date.now()

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      name: 'Stripe',
      status: 'unhealthy',
      message: 'STRIPE_SECRET_KEY not configured'
    }
  }

  try {
    // Dynamic import to avoid initialization errors
    const { stripe } = await import('@/lib/stripe')
    const balance = await stripe.balance.retrieve()
    const latency = Date.now() - start

    return {
      name: 'Stripe',
      status: 'healthy',
      latency,
      message: 'Connected and authenticated',
      details: {
        available: balance.available.map(b => `${b.currency.toUpperCase()}: ${b.amount / 100}`),
        pending: balance.pending.map(b => `${b.currency.toUpperCase()}: ${b.amount / 100}`)
      }
    }
  } catch (error) {
    return {
      name: 'Stripe',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Check Resend (Email) connectivity
async function checkResend(): Promise<ServiceHealth> {
  const start = Date.now()

  if (!process.env.RESEND_API_KEY) {
    return {
      name: 'Resend (Email)',
      status: 'unhealthy',
      message: 'RESEND_API_KEY not configured'
    }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    // List domains to verify API key is valid
    const { data, error } = await resend.domains.list()
    const latency = Date.now() - start

    if (error) {
      return {
        name: 'Resend (Email)',
        status: 'degraded',
        latency,
        message: error.message
      }
    }

    return {
      name: 'Resend (Email)',
      status: 'healthy',
      latency,
      message: `Connected. ${data?.data?.length || 0} domain(s) configured.`,
      details: { domains: data?.data?.map(d => d.name) }
    }
  } catch (error) {
    return {
      name: 'Resend (Email)',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Check OpenRouter (AI) connectivity
async function checkOpenRouter(): Promise<ServiceHealth> {
  const start = Date.now()

  if (!process.env.OPENROUTER_API_KEY) {
    return {
      name: 'OpenRouter (AI)',
      status: 'unhealthy',
      message: 'OPENROUTER_API_KEY not configured'
    }
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    })
    const latency = Date.now() - start

    if (!response.ok) {
      return {
        name: 'OpenRouter (AI)',
        status: 'degraded',
        latency,
        message: `API returned ${response.status}`
      }
    }

    const data = await response.json()
    const modelCount = data.data?.length || 0

    return {
      name: 'OpenRouter (AI)',
      status: 'healthy',
      latency,
      message: `Connected. ${modelCount} models available.`,
      details: { modelCount }
    }
  } catch (error) {
    return {
      name: 'OpenRouter (AI)',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Check WeatherAPI connectivity
async function checkWeatherAPI(): Promise<ServiceHealth> {
  const start = Date.now()

  const apiKey = process.env.NEXT_PUBLIC_WEATHERAPI_API_KEY
  if (!apiKey) {
    return {
      name: 'WeatherAPI',
      status: 'unhealthy',
      message: 'NEXT_PUBLIC_WEATHERAPI_API_KEY not configured'
    }
  }

  try {
    // Use a known location (New York) for the health check
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=40.7128,-74.0060&aqi=no`
    )
    const latency = Date.now() - start

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        name: 'WeatherAPI',
        status: 'degraded',
        latency,
        message: errorData.error?.message || `API returned ${response.status}`
      }
    }

    const data = await response.json()

    return {
      name: 'WeatherAPI',
      status: 'healthy',
      latency,
      message: `Connected. Test location: ${data.location?.name || 'Unknown'}`,
      details: {
        location: data.location?.name,
        region: data.location?.region,
        currentTemp: data.current?.temp_f ? `${data.current.temp_f}°F` : undefined
      }
    }
  } catch (error) {
    return {
      name: 'WeatherAPI',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Check environment configuration
function checkEnvironment(): ServiceHealth {
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'OPENROUTER_API_KEY',
    'NEXT_PUBLIC_WEATHERAPI_API_KEY',
  ]

  const missing = requiredVars.filter(v => !process.env[v])
  const configured = requiredVars.length - missing.length

  return {
    name: 'Environment Config',
    status: missing.length === 0 ? 'healthy' : missing.length <= 2 ? 'degraded' : 'unhealthy',
    message: `${configured}/${requiredVars.length} required variables configured`,
    details: { missing: missing.length > 0 ? missing : undefined }
  }
}

// Main health check function
export async function checkSystemHealth(): Promise<SystemHealth> {
  await checkAdmin()

  const [database, supabase, stripe, resend, openrouter, weatherapi] = await Promise.all([
    checkDatabase(),
    checkSupabaseAuth(),
    checkStripe(),
    checkResend(),
    checkOpenRouter(),
    checkWeatherAPI(),
  ])

  const environment = checkEnvironment()

  const services = [database, supabase, stripe, resend, openrouter, weatherapi, environment]

  // Calculate overall status
  const unhealthyCount = services.filter(s => s.status === 'unhealthy').length
  const degradedCount = services.filter(s => s.status === 'degraded').length

  let overall: HealthStatus = 'healthy'
  if (unhealthyCount > 0) overall = 'unhealthy'
  else if (degradedCount > 0) overall = 'degraded'

  return {
    overall,
    services,
    checkedAt: new Date().toISOString()
  }
}

// Get recent activity logs
export async function getRecentActivityLogs(limit = 50): Promise<ActivityLogEntry[]> {
  await checkAdmin()

  const logs = await db
    .select({
      id: userActivityLog.id,
      userId: userActivityLog.userId,
      activityType: userActivityLog.activityType,
      metadata: userActivityLog.metadata,
      createdAt: userActivityLog.createdAt,
    })
    .from(userActivityLog)
    .orderBy(desc(userActivityLog.createdAt))
    .limit(limit)

  // Get user emails for the logs
  const userIds = [...new Set(logs.map(l => l.userId))]
  const users = userIds.length > 0
    ? await db
        .select({ id: profiles.id, email: profiles.email })
        .from(profiles)
        .where(sql`${profiles.id} IN ${userIds}`)
    : []

  const userMap = new Map(users.map(u => [u.id, u.email]))

  return logs.map(log => ({
    ...log,
    userEmail: userMap.get(log.userId) || undefined,
    metadata: log.metadata as Record<string, unknown> | null,
  }))
}

// Clear cache for specific paths
export async function clearCache(paths: string[]): Promise<{ success: boolean; clearedPaths: string[] }> {
  await checkAdmin()

  const clearedPaths: string[] = []

  for (const path of paths) {
    try {
      revalidatePath(path)
      clearedPaths.push(path)
    } catch (error) {
      console.error(`Failed to clear cache for ${path}:`, error)
    }
  }

  return { success: clearedPaths.length > 0, clearedPaths }
}

// Clear all admin caches
export async function clearAllAdminCache(): Promise<{ success: boolean; message: string }> {
  await checkAdmin()

  try {
    // Revalidate common admin paths
    const paths = [
      '/admin',
      '/admin/users',
      '/admin/bundles',
      '/admin/products',
      '/admin/suppliers',
      '/admin/categories',
      '/admin/import',
    ]

    for (const path of paths) {
      revalidatePath(path)
    }

    // Note: revalidateTag signature changed in Next.js 16
    // Commenting out until we can determine the correct signature
    // try {
    //   revalidateTag('admin');
    //   revalidateTag('products');
    //   revalidateTag('bundles');
    // } catch {
    //   // Tags may not be used
    // }

    return { success: true, message: `Cleared cache for ${paths.length} admin paths` }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear cache'
    }
  }
}

// Send test email
export async function sendTestEmail(recipientEmail: string): Promise<{ success: boolean; message: string }> {
  const user = await getAdminUser()

  if (!process.env.RESEND_API_KEY) {
    return { success: false, message: 'RESEND_API_KEY not configured' }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: 'Test Email - Emergency Planner Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e40af;">Test Email</h2>
          <p>This is a test email sent from the Emergency Planner admin debug tools.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Sent by:</strong> ${user.email}</p>
            <p style="margin: 8px 0 0 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">If you received this email, your email configuration is working correctly.</p>
        </div>
      `,
    })

    if (error) {
      return { success: false, message: error.message }
    }

    return { success: true, message: `Test email sent to ${recipientEmail}` }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

// Debug auth (existing function, kept for compatibility)
export async function debugAuth() {
  await checkAdmin()

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('--- AUTH DEBUG ---')
  console.log('User:', user ? user.id : 'NULL')
  console.log('Error:', error ? error.message : 'NULL')
  console.log('------------------')

  return user
}

// ==================== SYSTEM LOGS ====================

export type SystemLogEntry = {
  id: string
  severity: SystemLogSeverity
  category: SystemLogCategory
  errorCode: string | null
  errorName: string | null
  message: string
  userId: string | null
  userEmail?: string
  userAction: string | null
  component: string | null
  route: string | null
  stackTrace: string | null
  metadata: Record<string, unknown> | null
  resolved: Date | null
  adminNotified: Date | null
  createdAt: Date
}

export type SystemLogStats = {
  total: number
  unresolved: number
  bySeverity: Record<string, number>
  byCategory: Record<string, number>
  last24Hours: number
}

// Get recent system logs
export async function getRecentSystemLogs(
  limit = 50,
  filters?: {
    severity?: SystemLogSeverity
    category?: SystemLogCategory
    unresolvedOnly?: boolean
  }
): Promise<SystemLogEntry[]> {
  await checkAdmin()

  try {
    // Build conditions array
    const conditions = []
    if (filters?.severity) {
      conditions.push(eq(systemLogs.severity, filters.severity))
    }
    if (filters?.category) {
      conditions.push(eq(systemLogs.category, filters.category))
    }
    if (filters?.unresolvedOnly) {
      conditions.push(isNull(systemLogs.resolved))
    }

    const logs = await db
      .select({
        id: systemLogs.id,
        severity: systemLogs.severity,
        category: systemLogs.category,
        errorCode: systemLogs.errorCode,
        errorName: systemLogs.errorName,
        message: systemLogs.message,
        userId: systemLogs.userId,
        userAction: systemLogs.userAction,
        component: systemLogs.component,
        route: systemLogs.route,
        stackTrace: systemLogs.stackTrace,
        metadata: systemLogs.metadata,
        resolved: systemLogs.resolved,
        adminNotified: systemLogs.adminNotified,
        createdAt: systemLogs.createdAt,
      })
      .from(systemLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(systemLogs.createdAt))
      .limit(limit)

    // Get user emails for the logs
    const userIds = [...new Set(logs.filter(l => l.userId).map(l => l.userId!))]
    const users = userIds.length > 0
      ? await db
          .select({ id: profiles.id, email: profiles.email })
          .from(profiles)
          .where(sql`${profiles.id} IN ${userIds}`)
      : []

    const userMap = new Map(users.map(u => [u.id, u.email]))

    return logs.map(log => ({
      ...log,
      userEmail: log.userId ? userMap.get(log.userId) || undefined : undefined,
      metadata: log.metadata as Record<string, unknown> | null,
    }))
  } catch (error) {
    console.error('[Debug] Failed to get system logs:', error)
    return []
  }
}

// Get system log statistics
export async function getSystemLogStats(): Promise<SystemLogStats> {
  await checkAdmin()

  try {
    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemLogs)

    // Get unresolved count
    const [unresolvedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemLogs)
      .where(isNull(systemLogs.resolved))

    // Get counts by severity
    const severityCounts = await db
      .select({
        severity: systemLogs.severity,
        count: sql<number>`count(*)`,
      })
      .from(systemLogs)
      .groupBy(systemLogs.severity)

    // Get counts by category
    const categoryCounts = await db
      .select({
        category: systemLogs.category,
        count: sql<number>`count(*)`,
      })
      .from(systemLogs)
      .groupBy(systemLogs.category)

    // Get last 24 hours count
    const [last24HoursResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(systemLogs)
      .where(sql`${systemLogs.createdAt} > NOW() - INTERVAL '24 hours'`)

    return {
      total: totalResult.count,
      unresolved: unresolvedResult.count,
      bySeverity: Object.fromEntries(severityCounts.map(s => [s.severity, s.count])),
      byCategory: Object.fromEntries(categoryCounts.map(c => [c.category, c.count])),
      last24Hours: last24HoursResult.count,
    }
  } catch (error) {
    console.error('[Debug] Failed to get system log stats:', error)
    return {
      total: 0,
      unresolved: 0,
      bySeverity: {},
      byCategory: {},
      last24Hours: 0,
    }
  }
}

// Mark a system log as resolved
export async function resolveSystemLog(
  logId: string,
  resolution: string
): Promise<{ success: boolean; message: string }> {
  const user = await getAdminUser()

  try {
    await db
      .update(systemLogs)
      .set({
        resolved: new Date(),
        resolvedBy: user.id,
        resolution,
      })
      .where(eq(systemLogs.id, logId))

    return { success: true, message: 'Log marked as resolved' }
  } catch (error) {
    console.error('[Debug] Failed to resolve system log:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to resolve log',
    }
  }
}

// Test admin notification
export async function testAdminNotification(): Promise<{ success: boolean; message: string }> {
  await checkAdmin()

  try {
    const result = await sendTestAdminNotification()
    if (result.success) {
      return { success: true, message: 'Test notification sent to admin email' }
    }
    return { success: false, message: result.error || 'Failed to send test notification' }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send test notification',
    }
  }
}
