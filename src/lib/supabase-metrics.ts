/**
 * Supabase Prometheus Metrics Parser
 * Fetches and parses infrastructure metrics from Supabase's Prometheus endpoint
 */

export interface PrometheusMetrics {
  // Database Performance (Priority A)
  activeConnections: number
  maxConnections: number
  connectionPoolUsage: number // percentage
  slowQueries: number
  
  // Storage Metrics (Priority D)
  storageUsedBytes: number
  storageUsedGB: number
  fileCount: number
  storageBandwidthBytes: number
  
  // Realtime Subscriptions (Priority E)
  realtimeConnections: number
  realtimeChannels: number
  realtimeMessagesPerSec: number
}

/**
 * Parse a single metric value from Prometheus text format
 * Format: metric_name{labels} value timestamp
 */
function parseMetricValue(text: string, metricName: string): number {
  const lines = text.split('\n')
  
  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || !line.trim()) continue
    
    // Check if line starts with the metric name
    if (line.startsWith(metricName)) {
      // Extract the value (second column, after optional labels)
      const parts = line.split(/\s+/)
      if (parts.length >= 2) {
        const value = parseFloat(parts[1])
        if (!isNaN(value)) {
          return value
        }
      }
    }
  }
  
  return 0
}

/**
 * Parse metric with labels (e.g., pg_stat_database_numbackends{datname="postgres"})
 */
function parseMetricWithLabel(text: string, metricName: string, labelMatch?: string): number {
  const lines = text.split('\n')
  
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue
    
    if (line.startsWith(metricName)) {
      // If we need to match a specific label, check for it
      if (labelMatch && !line.includes(labelMatch)) continue
      
      // Extract value after the metric and labels
      const match = line.match(/}\s+(\S+)/)
      if (match) {
        const value = parseFloat(match[1])
        if (!isNaN(value)) {
          return value
        }
      }
      
      // If no labels, just get the value
      const parts = line.split(/\s+/)
      if (parts.length >= 2) {
        const value = parseFloat(parts[1])
        if (!isNaN(value)) {
          return value
        }
      }
    }
  }
  
  return 0
}

/**
 * Fetch and parse Supabase Prometheus metrics
 * 
 * @param projectRef - Supabase project reference (from URL)
 * @param serviceRoleKey - Supabase service role key
 * @returns Parsed metrics or null if fetch fails
 */
export async function fetchSupabaseMetrics(
  projectRef: string,
  serviceRoleKey: string
): Promise<PrometheusMetrics | null> {
  try {
    const endpoint = `https://${projectRef}.supabase.co/customer/v1/privileged/metrics`
    
    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    try {
      // Create Basic Auth header (use btoa for edge runtime compatibility)
      const authString = `service_role:${serviceRoleKey}`
      const base64Auth = typeof Buffer !== 'undefined' 
        ? Buffer.from(authString).toString('base64')
        : btoa(authString)
      
      // Fetch metrics using Basic Auth
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Basic ${base64Auth}`,
        },
        // Don't cache - we want fresh metrics
        cache: 'no-store',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        console.error(`Failed to fetch Supabase metrics: ${response.status} ${response.statusText}`)
        return null
      }
      
      const text = await response.text()
    
    // Parse database performance metrics
    const activeConnections = parseMetricWithLabel(text, 'pg_stat_database_numbackends')
    const maxConnections = parseMetricValue(text, 'pg_settings_max_connections')
    const connectionPoolUsage = maxConnections > 0 
      ? Math.round((activeConnections / maxConnections) * 100)
      : 0
    
    // Parse slow queries (queries taking > 1 second)
    const slowQueries = parseMetricValue(text, 'pg_stat_statements_calls') || 0
    
    // Parse storage metrics
    const storageUsedBytes = parseMetricValue(text, 'storage_size_bytes')
    const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024)
    const fileCount = parseMetricValue(text, 'storage_object_count')
    const storageBandwidthBytes = parseMetricValue(text, 'storage_bandwidth_bytes')
    
    // Parse realtime metrics
    const realtimeConnections = parseMetricValue(text, 'realtime_connections')
    const realtimeChannels = parseMetricValue(text, 'realtime_channels')
    const realtimeMessagesPerSec = parseMetricValue(text, 'realtime_messages_per_sec')
    
      return {
        // Database Performance
        activeConnections,
        maxConnections,
        connectionPoolUsage,
        slowQueries,
        
        // Storage Metrics
        storageUsedBytes,
        storageUsedGB,
        fileCount,
        storageBandwidthBytes,
        
        // Realtime Subscriptions
        realtimeConnections,
        realtimeChannels,
        realtimeMessagesPerSec,
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Supabase metrics fetch timed out after 5 seconds')
      } else {
        console.error('Error during Supabase metrics fetch:', fetchError)
      }
      return null
    }
  } catch (error) {
    console.error('Error fetching Supabase metrics:', error)
    return null
  }
}

