'use server'

import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { checkAdmin, getAdminUser } from '@/lib/adminAuth'
import { db } from '@/db'
import { userActivityLog } from '@/db/schema/analytics'
import { profiles } from '@/db/schema/profiles'
import { systemLogs, type SystemLogSeverity, type SystemLogCategory } from '@/db/schema/system-logs'
import { desc, sql, eq, isNull, and, gte } from 'drizzle-orm'
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

// Check Supabase Database with detailed stats
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now()
  try {
    // Simple ping test
    await db.execute(sql`SELECT 1 as ping`)
    const latency = Date.now() - start

    // Get database connection info (sanitized)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'not configured'
    
    // Determine status based only on latency for speed
    let status: HealthStatus = 'healthy'
    if (latency > 1000) {
      status = 'degraded'
    }
    if (latency > 3000) {
      status = 'unhealthy'
    }

    return {
      name: 'Supabase',
      status,
      latency,
      message: `Connected in ${latency}ms`,
      details: {
        supabaseUrl,
        responseTime: `${latency}ms`,
      }
    }
  } catch (error) {
    return {
      name: 'Supabase',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed'
    }
  }
}

// Check Supabase Auth with comprehensive metrics
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

    // Simple auth check - detailed metrics would be too slow for health check
    return {
      name: 'Supabase Auth',
      status: 'healthy',
      latency,
      message: `Auth service operational`,
      details: {
        responseTime: `${latency}ms`,
        sessionValid: !!data.session
      }
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
    
    // Add timeout to Stripe API calls
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Stripe API timeout after 5 seconds')), 5000)
    )
    
    // Fetch multiple metrics in parallel with timeout
    const [balance, customers, charges, subscriptions, disputes] = await Promise.race([
      Promise.all([
        stripe.balance.retrieve(),
        stripe.customers.list({ limit: 1 }), // Just to get total count
        stripe.charges.list({ limit: 10, created: { gte: Math.floor(Date.now() / 1000) - 86400 } }), // Last 24h
        stripe.subscriptions.list({ limit: 1, status: 'active' }), // Just to get count
        stripe.disputes.list({ limit: 10 }), // Recent disputes
      ]),
      timeoutPromise
    ])
    
    const latency = Date.now() - start

    // Calculate metrics
    const chargesLast24h = charges.data.length
    const successfulCharges = charges.data.filter(c => c.status === 'succeeded').length
    const failedCharges = charges.data.filter(c => c.status === 'failed').length
    const activeSubscriptions = subscriptions.has_more ? '1000+' : String(subscriptions.data.length)
    const totalCustomers = customers.has_more ? '100+' : String(customers.data.length)
    const openDisputes = disputes.data.filter(d => d.status !== 'won' && d.status !== 'lost').length
    
    // Format balance
    const availableBalance = balance.available.length > 0 
      ? `${balance.available[0].currency.toUpperCase()} ${(balance.available[0].amount / 100).toFixed(2)}`
      : 'N/A'
    const pendingBalance = balance.pending.length > 0
      ? `${balance.pending[0].currency.toUpperCase()} ${(balance.pending[0].amount / 100).toFixed(2)}`
      : 'N/A'

    // Determine status
    let status: HealthStatus = 'healthy'
    if (openDisputes > 0 || failedCharges > 5) {
      status = 'degraded'
    }
    if (openDisputes > 3 || failedCharges > 10) {
      status = 'unhealthy'
    }

    return {
      name: 'Stripe',
      status,
      latency,
      message: `${successfulCharges} charges today, ${activeSubscriptions} active subscriptions`,
      details: {
        availableBalance,
        pendingBalance,
        chargesLast24h,
        successfulCharges,
        failedCharges,
        activeSubscriptions,
        totalCustomers,
        openDisputes,
        responseTime: `${latency}ms`
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

// Check Resend (Email) connectivity and metrics
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
    
    // Fetch domains and recent emails in parallel with timeout
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Resend API timeout after 5 seconds')), 5000)
    )
    
    const [domainsResult, emailsResult] = await Promise.race([
      Promise.all([
        resend.domains.list(),
        resend.emails.list({ limit: 100 })
      ]),
      timeoutPromise
    ])
    
    const latency = Date.now() - start

    if (domainsResult.error) {
      return {
        name: 'Resend (Email)',
        status: 'degraded',
        latency,
        message: domainsResult.error.message
      }
    }

    // Calculate email metrics
    const emails = emailsResult.data?.data || []
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const emailsSentToday = emails.filter(e => 
      e.created_at && new Date(e.created_at) >= todayStart
    ).length
    
    const emailsSentThisWeek = emails.filter(e => 
      e.created_at && new Date(e.created_at) >= weekStart
    ).length
    
    const recentBounces = emails.filter(e => 
      e.last_event === 'bounced'
    ).length
    
    const recentFailures = emails.filter(e => 
      e.last_event === 'delivery_delayed' || e.last_event === 'complained'
    ).length
    
    const lastEmail = emails[0]
    const lastEmailSent = lastEmail?.created_at 
      ? new Date(lastEmail.created_at).toISOString()
      : 'Never'
    
    const domainsConfigured = domainsResult.data?.data?.length || 0
    
    // Determine status based on failures
    let status: HealthStatus = 'healthy'
    if (recentFailures > 10 || recentBounces > 20) {
      status = 'degraded'
    }

    return {
      name: 'Resend (Email)',
      status,
      latency,
      message: `${emailsSentToday} sent today, ${domainsConfigured} domain(s)`,
      details: {
        emailsSentToday,
        emailsSentThisWeek,
        recentBounces,
        recentFailures,
        domainsConfigured,
        domains: domainsResult.data?.data?.map(d => d.name) || [],
        lastEmailSent,
        responseTime: `${latency}ms`
      }
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

// Check OpenRouter (AI) connectivity and usage metrics
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
    // Helper to format dates for OpenRouter API (YYYY-MM-DD)
    const formatDate = (daysAgo: number): string => {
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      return date.toISOString().split('T')[0]
    }

    // Generate date ranges
    const today = formatDate(0)
    const last7Days = Array.from({ length: 7 }, (_, i) => formatDate(i))
    const last30Days = Array.from({ length: 30 }, (_, i) => formatDate(i))

    // Fetch all data in parallel with timeout
    const [creditsResponse, modelsResponse, activityToday, activity7Days, activity30Days] = await Promise.all([
      fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
        signal: AbortSignal.timeout(5000)
      }),
      fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
        signal: AbortSignal.timeout(5000)
      }),
      // Today's activity
      fetch(`https://openrouter.ai/api/v1/activity?date=${today}`, {
        headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
        signal: AbortSignal.timeout(5000)
      }),
      // Last 7 days activity (aggregate)
      Promise.all(last7Days.map(date => 
        fetch(`https://openrouter.ai/api/v1/activity?date=${date}`, {
          headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
          signal: AbortSignal.timeout(5000)
        }).then(r => r.ok ? r.json() : { data: [] })
      )),
      // Last 30 days activity (aggregate)
      Promise.all(last30Days.map(date => 
        fetch(`https://openrouter.ai/api/v1/activity?date=${date}`, {
          headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` },
          signal: AbortSignal.timeout(5000)
        }).then(r => r.ok ? r.json() : { data: [] })
      ))
    ])
    
    const latency = Date.now() - start

    if (!modelsResponse.ok) {
      return {
        name: 'OpenRouter (AI)',
        status: 'degraded',
        latency,
        message: `API returned ${modelsResponse.status}`
      }
    }

    const modelsData = await modelsResponse.json()
    const modelCount = modelsData.data?.length || 0
    
    // Get credit balance
    let creditBalance = null
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json()
      creditBalance = creditsData.data?.limit || null
    }

    // Parse activity data
    const parseActivity = (activityData: any) => {
      const data = activityData?.data || []
      return {
        requests: data.reduce((sum: number, d: any) => sum + (d.requests || 0), 0),
        cost: data.reduce((sum: number, d: any) => sum + (d.usage || 0), 0),
        promptTokens: data.reduce((sum: number, d: any) => sum + (d.prompt_tokens || 0), 0),
        completionTokens: data.reduce((sum: number, d: any) => sum + (d.completion_tokens || 0), 0),
      }
    }

    const todayData = activityToday.ok ? await activityToday.json() : { data: [] }
    const usage = {
      today: parseActivity(todayData),
      last7Days: activity7Days.reduce((acc, d) => ({
        requests: acc.requests + parseActivity(d).requests,
        cost: acc.cost + parseActivity(d).cost,
        promptTokens: acc.promptTokens + parseActivity(d).promptTokens,
        completionTokens: acc.completionTokens + parseActivity(d).completionTokens,
      }), { requests: 0, cost: 0, promptTokens: 0, completionTokens: 0 }),
      last30Days: activity30Days.reduce((acc, d) => ({
        requests: acc.requests + parseActivity(d).requests,
        cost: acc.cost + parseActivity(d).cost,
        promptTokens: acc.promptTokens + parseActivity(d).promptTokens,
        completionTokens: acc.completionTokens + parseActivity(d).completionTokens,
      }), { requests: 0, cost: 0, promptTokens: 0, completionTokens: 0 })
    }
    
    // Determine status based on credit balance
    let status: HealthStatus = 'healthy'
    if (creditBalance !== null && creditBalance < 1) {
      status = 'unhealthy'
    } else if (creditBalance !== null && creditBalance < 10) {
      status = 'degraded'
    }

    return {
      name: 'OpenRouter (AI)',
      status,
      latency,
      message: `${usage.today.requests} requests today, $${usage.today.cost.toFixed(4)} spent`,
      details: {
        creditBalance: creditBalance !== null ? `$${creditBalance.toFixed(2)}` : 'N/A',
        modelsAvailable: modelCount,
        // Today
        requestsToday: usage.today.requests,
        costToday: `$${usage.today.cost.toFixed(4)}`,
        tokensToday: usage.today.promptTokens + usage.today.completionTokens,
        // Last 7 days
        requests7Days: usage.last7Days.requests,
        cost7Days: `$${usage.last7Days.cost.toFixed(4)}`,
        tokens7Days: usage.last7Days.promptTokens + usage.last7Days.completionTokens,
        // Last 30 days
        requests30Days: usage.last30Days.requests,
        cost30Days: `$${usage.last30Days.cost.toFixed(4)}`,
        tokens30Days: usage.last30Days.promptTokens + usage.last30Days.completionTokens,
        responseTime: `${latency}ms`
      }
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
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=40.7128,-74.0060&aqi=no`,
      {
        signal: AbortSignal.timeout(5000)
      }
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

// Check LLM_Service health
async function checkLLMService(): Promise<ServiceHealth> {
  const start = Date.now()

  const llmServiceUrl = await getLLMServiceURL()

  try {
    const response = await fetch(`${llmServiceUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // Add timeout
      signal: AbortSignal.timeout(5000)
    })
    const latency = Date.now() - start

    if (!response.ok) {
      return {
        name: 'LLM Service',
        status: 'degraded',
        latency,
        message: `Service returned ${response.status}`
      }
    }

    const data = await response.json()

    return {
      name: 'LLM Service',
      status: data.status === 'healthy' ? 'healthy' : 'degraded',
      latency,
      message: `Connected. Status: ${data.status || 'unknown'}`,
      details: {
        ...data,
        serviceUrl: llmServiceUrl
      }
    }
  } catch (error) {
    return {
      name: 'LLM Service',
      status: 'unhealthy',
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : 'Connection failed',
      details: {
        serviceUrl: llmServiceUrl
      }
    }
  }
}

// Check environment configuration
function checkEnvironment(): ServiceHealth {
  const requiredVars = [
    // Database & Auth
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',

    // Payment
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',

    // Email
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    // Note: ADMIN_EMAIL moved to system_settings table

    // AI Services
    'OPENROUTER_API_KEY',
    // Note: LLM_SERVICE_URL moved to system_settings table
    'LLM_WEBHOOK_SECRET',

    // External APIs
    'NEXT_PUBLIC_WEATHERAPI_API_KEY',
    'NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY',

    // Amazon Product API
    'AMAZON_ACCESS_KEY',
    'AMAZON_SECRET_KEY',
    'AMAZON_ASSOCIATE_TAG',

    // Web Scraping
    'DECODO_USER',
    'DECODO_PASS',
    'FIRECRAWL_API_KEY',
  ]

  const missing = requiredVars.filter(v => !process.env[v])
  const configured = requiredVars.length - missing.length

  // Create a details object with status of each variable
  const variables: Record<string, string> = {}
  requiredVars.forEach(varName => {
    variables[varName] = process.env[varName] ? 'configured' : 'missing'
  })

  return {
    name: 'Environment Config',
    status: missing.length === 0 ? 'healthy' : missing.length <= 3 ? 'degraded' : 'unhealthy',
    message: `${configured}/${requiredVars.length} required variables configured`,
    details: { variables }
  }
}

// Main health check function
// Helper to wrap any health check with a timeout
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: T,
  serviceName: string
): Promise<T> {
  console.log(`[HealthCheck] Starting ${serviceName}...`)
  const startTime = Date.now()
  
  let timeoutId: NodeJS.Timeout
  let isResolved = false
  
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        console.warn(`[HealthCheck] ${serviceName} timed out after ${timeoutMs}ms`)
        isResolved = true
        resolve(fallback)
      }
    }, timeoutMs)
  })
  
  const result = await Promise.race([
    promise.then(res => {
      isResolved = true
      clearTimeout(timeoutId)
      return res
    }),
    timeoutPromise
  ])
  
  const elapsed = Date.now() - startTime
  console.log(`[HealthCheck] ${serviceName} completed in ${elapsed}ms`)
  return result
}

export async function checkSystemHealth(): Promise<SystemHealth> {
  try {
    // Check admin first with timeout
    console.log('[HealthCheck] Checking admin auth...')
    const adminCheckPromise = checkAdmin()
    const adminTimeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Admin check timeout after 5 seconds')), 5000)
    )
    await Promise.race([adminCheckPromise, adminTimeout])
    console.log('[HealthCheck] Admin auth verified')

    // Run all health checks in parallel with individual 5-second timeouts
    // If any check hangs, it will be replaced with an "unhealthy" fallback
    console.log('[HealthCheck] Starting all service checks...')
    const [database, supabase, stripe, resend, openrouter, weatherapi, llmService] = await Promise.all([
      withTimeout(checkDatabase(), 5000, {
        name: 'Supabase',
        status: 'unhealthy',
        message: 'Health check timed out'
      }, 'Supabase Database'),
      withTimeout(checkSupabaseAuth(), 5000, {
        name: 'Supabase Auth',
        status: 'unhealthy',
        message: 'Health check timed out'
      }, 'Supabase Auth'),
      withTimeout(checkStripe(), 7000, {
        name: 'Stripe',
        status: 'unhealthy',
        message: 'Health check timed out'
      }, 'Stripe'),
      withTimeout(checkResend(), 5000, {
        name: 'Resend (Email)',
        status: 'unhealthy',
        message: 'Health check timed out'
      }, 'Resend'),
      withTimeout(checkOpenRouter(), 5000, {
        name: 'OpenRouter (AI)',
        status: 'unhealthy',
        message: 'Health check timed out'
      }, 'OpenRouter'),
      withTimeout(checkWeatherAPI(), 5000, {
        name: 'WeatherAPI',
        status: 'unhealthy',
        message: 'Health check timed out'
      }, 'WeatherAPI'),
      withTimeout(checkLLMService(), 5000, {
        name: 'LLM Service',
        status: 'unhealthy',
        message: 'Health check timed out'
      }, 'LLM Service'),
    ])
    console.log('[HealthCheck] All service checks completed')

    const environment = checkEnvironment()

    const services = [database, supabase, stripe, resend, openrouter, weatherapi, llmService, environment]

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
  } catch (error) {
    // If entire health check fails, return degraded status
    console.error('System health check failed:', error)
    return {
      overall: 'unhealthy',
      services: [{
        name: 'System',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed'
      }],
      checkedAt: new Date().toISOString()
    }
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

// ==================== SYSTEM SETTINGS ====================

export type SystemSettingWithUser = {
  id: string
  key: string
  value: string
  valueType: 'number' | 'string' | 'boolean' | 'object' | 'array'
  description: string | null
  category: string
  isEditable: boolean
  environment: string | null
  lastModifiedBy: string | null
  modifiedByEmail?: string
  createdAt: Date
  updatedAt: Date
}

// Get all system settings
export async function getAllSystemSettings(): Promise<SystemSettingWithUser[]> {
  await checkAdmin()

  try {
    const { systemSettings } = await import('@/db/schema')

    const settings = await db
      .select({
        id: systemSettings.id,
        key: systemSettings.key,
        value: systemSettings.value,
        valueType: systemSettings.valueType,
        description: systemSettings.description,
        category: systemSettings.category,
        isEditable: systemSettings.isEditable,
        environment: systemSettings.environment,
        lastModifiedBy: systemSettings.lastModifiedBy,
        createdAt: systemSettings.createdAt,
        updatedAt: systemSettings.updatedAt,
      })
      .from(systemSettings)
      .orderBy(systemSettings.category, systemSettings.key)

    // Get user emails for the settings
    const userIds = [...new Set(settings.filter(s => s.lastModifiedBy).map(s => s.lastModifiedBy!))]
    const users = userIds.length > 0
      ? await db
          .select({ id: profiles.id, email: profiles.email })
          .from(profiles)
          .where(sql`${profiles.id} IN ${userIds}`)
      : []

    const userMap = new Map(users.map(u => [u.id, u.email]))

    return settings.map(setting => ({
      ...setting,
      valueType: setting.valueType as 'number' | 'string' | 'boolean' | 'object' | 'array',
      modifiedByEmail: setting.lastModifiedBy ? userMap.get(setting.lastModifiedBy) || undefined : undefined,
    }))
  } catch (error) {
    console.error('[Debug] Failed to get system settings:', error)
    return []
  }
}

// Update a system setting (admin only)
export async function updateSystemSettingAction(
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAdminUser()

  try {
    const { updateSystemSetting } = await import('@/db/queries/system-settings')

    const result = await updateSystemSetting(key, value, user.id)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    // Revalidate admin pages that might use system settings
    revalidatePath('/admin', 'page')

    return { success: true }
  } catch (error) {
    console.error('[Debug] Failed to update system setting:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update setting',
    }
  }
}

/**
 * Fetches the LLM service URL from environment variable or system settings
 * Priority: 1) LLM_SERVICE_URL env var, 2) system_settings table, 3) fallback URL
 */
export async function getLLMServiceURL(): Promise<string> {
  // First check environment variable (recommended)
  const envUrl = process.env.LLM_SERVICE_URL
  if (envUrl) {
    return envUrl
  }

  // Fall back to system setting
  const { getSystemSetting } = await import('@/db/queries/system-settings')
  const url = await getSystemSetting<string>('llm_service_url')
  return url ?? 'https://llm-service-api.onrender.com'
}

// ==================== LLM SERVICE PROXY ====================

/**
 * Fetch LLM service health status (server-side proxy)
 */
export async function fetchLLMHealth(): Promise<any> {
  await checkAdmin()

  try {
    const llmServiceUrl = await getLLMServiceURL()
    const response = await fetch(`${llmServiceUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(7000), // 7 second timeout
    })

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[LLM Service] Health check failed:', error)
    throw error
  }
}

/**
 * Fetch LLM service jobs (server-side proxy)
 * Enriches jobs with user email from profiles table
 */
export async function fetchLLMJobs(
  status: string = 'all',
  limitResults?: string
): Promise<any> {
  await checkAdmin()

  try {
    const llmServiceUrl = await getLLMServiceURL()
    const webhookSecret = process.env.LLM_WEBHOOK_SECRET || ''

    // Build query parameters
    const params = new URLSearchParams({ status, limit: '100' })
    if (limitResults) {
      params.set('limit_results', limitResults)
    }

    const response = await fetch(
      `${llmServiceUrl}/api/v1/jobs?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': webhookSecret,
        },
        signal: AbortSignal.timeout(7000), // 7 second timeout
      }
    )

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Enrich jobs with user emails from profiles table
    if (data.jobs && Array.isArray(data.jobs)) {
      // Extract unique non-null user IDs
      const userIds = [...new Set(
        data.jobs
          .map((job: any) => job.user_id)
          .filter((id: any) => id != null)
      )]

      if (userIds.length > 0) {
        // Fetch user profiles in a single query
        const { profiles } = await import('@/db/schema/profiles')
        const { inArray } = await import('drizzle-orm')

        const userProfiles = await db
          .select({
            id: profiles.id,
            email: profiles.email,
          })
          .from(profiles)
          .where(inArray(profiles.id, userIds as string[]))

        // Create a map of user_id -> email
        const userEmailMap = new Map(
          userProfiles.map(p => [p.id, p.email])
        )

        // Enrich each job with user_email
        data.jobs = data.jobs.map((job: any) => ({
          ...job,
          user_email: job.user_id ? userEmailMap.get(job.user_id) : null,
        }))
      }
    }

    return data
  } catch (error) {
    console.error('[LLM Service] Fetch jobs failed:', error)
    throw error
  }
}

/**
 * Fetch single LLM job details (server-side proxy)
 */
export async function fetchLLMJobDetails(jobId: string): Promise<any> {
  await checkAdmin()

  try {
    const llmServiceUrl = await getLLMServiceURL()
    const webhookSecret = process.env.LLM_WEBHOOK_SECRET || ''

    const response = await fetch(
      `${llmServiceUrl}/api/v1/status/${jobId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': webhookSecret,
        },
        signal: AbortSignal.timeout(7000), // 7 second timeout
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Job not found')
      }
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[LLM Service] Fetch job details failed:', error)
    throw error
  }
}

/**
 * Bulk delete LLM jobs by IDs (server-side proxy)
 * Deletes jobs from database, terminates running tasks, and removes from Redis queue
 */
export async function bulkDeleteLLMJobs(jobIds: string[]): Promise<{
  success: boolean
  deleted_count: number
  tasks_revoked?: number
  redis_removed?: number
  message: string
}> {
  await checkAdmin()

  try {
    const llmServiceUrl = await getLLMServiceURL()
    const webhookSecret = process.env.LLM_WEBHOOK_SECRET || ''

    const response = await fetch(
      `${llmServiceUrl}/api/v1/jobs/bulk`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': webhookSecret,
        },
        body: JSON.stringify({ job_ids: jobIds }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      deleted_count: data.deleted_count,
      tasks_revoked: data.tasks_revoked,
      redis_removed: data.redis_removed,
      message: data.message
    }
  } catch (error) {
    console.error('[LLM Service] Bulk delete jobs failed:', error)
    return {
      success: false,
      deleted_count: 0,
      message: error instanceof Error ? error.message : 'Failed to delete jobs'
    }
  }
}
