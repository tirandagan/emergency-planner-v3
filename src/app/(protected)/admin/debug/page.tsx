'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  checkSystemHealth,
  getRecentActivityLogs,
  clearAllAdminCache,
  sendTestEmail,
  type SystemHealth,
  type ActivityLogEntry,
  type HealthStatus,
} from './actions'
import { SystemLogsTab } from './SystemLogsTab'
import { SystemSettingsTab } from './SystemSettingsTab'
import { LLMQueueTab } from './LLMQueueTab'
import { LLMCallbackHistoryTab } from './LLMCallbackHistoryTab'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Mail,
  CreditCard,
  Bot,
  Shield,
  Settings,
  Trash2,
  Send,
  Loader2,
  Clock,
  User,
  Bug,
  Cpu,
  Layers,
  HardDrive,
  Radio,
  Zap,
  DollarSign,
} from 'lucide-react'

const statusColors: Record<HealthStatus, string> = {
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  degraded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  unhealthy: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const statusIcons: Record<HealthStatus, React.ReactNode> = {
  healthy: <CheckCircle2 className="w-4 h-4" />,
  degraded: <AlertTriangle className="w-4 h-4" />,
  unhealthy: <XCircle className="w-4 h-4" />,
  unknown: <Clock className="w-4 h-4" />,
}

const serviceIcons: Record<string, React.ReactNode> = {
  'Supabase': <Database className="w-5 h-5" />,
  'Supabase Auth': <Shield className="w-5 h-5" />,
  'Stripe': <CreditCard className="w-5 h-5" />,
  'Resend (Email)': <Mail className="w-5 h-5" />,
  'OpenRouter (AI)': <Bot className="w-5 h-5" />,
  'WeatherAPI': <Activity className="w-5 h-5" />,
  'LLM Service': <Cpu className="w-5 h-5" />,
  'Environment Config': <Settings className="w-5 h-5" />,
}

// Helper function for connection pool badge color
function getConnectionPoolBadgeColor(usage: number): string {
  if (usage > 90) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  if (usage > 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
}

export default function DebugPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([])
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null)
  const [cacheResult, setCacheResult] = useState<{ success: boolean; message: string } | null>(null)

  // Get active tab from URL query parameter, default to 'settings'
  const activeTab = searchParams.get('tab') || 'settings'

  // Update URL when tab changes
  const setActiveTab = useCallback((newTab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newTab)
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const runHealthCheck = useCallback(async () => {
    setIsCheckingHealth(true)
    try {
      const result = await checkSystemHealth()
      setHealth(result)
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setIsCheckingHealth(false)
    }
  }, [])

  const loadActivityLogs = useCallback(async () => {
    setIsLoadingLogs(true)
    try {
      const logs = await getRecentActivityLogs(50)
      setActivityLogs(logs)
    } catch (error) {
      console.error('Failed to load activity logs:', error)
    } finally {
      setIsLoadingLogs(false)
    }
  }, [])

  useEffect(() => {
    runHealthCheck()
    loadActivityLogs()
  }, [runHealthCheck, loadActivityLogs])

  const handleClearCache = async () => {
    setIsClearingCache(true)
    setCacheResult(null)
    try {
      const result = await clearAllAdminCache()
      setCacheResult(result)
    } catch {
      setCacheResult({ success: false, message: 'Failed to clear cache' })
    } finally {
      setIsClearingCache(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) return
    setIsSendingEmail(true)
    setEmailResult(null)
    try {
      const result = await sendTestEmail(testEmail)
      setEmailResult(result)
    } catch {
      setEmailResult({ success: false, message: 'Failed to send email' })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString()
  }

  const formatLatency = (ms?: number) => {
    if (ms === undefined) return '-'
    if (ms < 100) return <span className="text-green-600 dark:text-green-400">{ms}ms</span>
    if (ms < 500) return <span className="text-yellow-600 dark:text-yellow-400">{ms}ms</span>
    return <span className="text-red-600 dark:text-red-400">{ms}ms</span>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Debug Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">System health, activity logs, and diagnostic tools</p>
        </div>
        <Button
          onClick={runHealthCheck}
          disabled={isCheckingHealth}
          variant="outline"
          className="gap-2"
        >
          {isCheckingHealth ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-4xl grid-cols-8">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Clock className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Bug className="w-4 h-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="llm-queue" className="gap-2">
            <Cpu className="w-4 h-4" />
            LLM Queue
          </TabsTrigger>
          <TabsTrigger value="callbacks" className="gap-2">
            <Shield className="w-4 h-4" />
            Callbacks
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Activity className="w-4 h-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="cache" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Cache
          </TabsTrigger>
        </TabsList>

        {/* Health Check Tab */}
        <TabsContent value="health" className="space-y-6 mt-6">
          {/* Overall Status */}
          {health && (
            <Card className={`border-2 ${
              health.overall === 'healthy' ? 'border-green-500 dark:border-green-600' :
              health.overall === 'degraded' ? 'border-yellow-500 dark:border-yellow-600' :
              'border-red-500 dark:border-red-600'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {statusIcons[health.overall]}
                    System Status: {health.overall.charAt(0).toUpperCase() + health.overall.slice(1)}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    Last checked: {formatDate(health.checkedAt)}
                  </span>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Service Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {health?.services.map((service) => (
              <Card key={service.name} className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {serviceIcons[service.name] || <Settings className="w-5 h-5" />}
                      <CardTitle className="text-base font-medium text-foreground">{service.name}</CardTitle>
                    </div>
                    <Badge className={statusColors[service.status]}>
                      {statusIcons[service.status]}
                      <span className="ml-1">{service.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-sm ${service.status === 'unhealthy' ? 'text-red-600 dark:text-red-400 font-medium' : service.status === 'degraded' ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-muted-foreground'}`}>
                    {service.status !== 'healthy' && (
                      <div className="flex items-start gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{service.message}</span>
                      </div>
                    )}
                    {service.status === 'healthy' && <p>{service.message}</p>}
                  </div>
                  {service.latency !== undefined && (
                    <p className="text-xs mt-2">
                      Latency: {formatLatency(service.latency)}
                    </p>
                  )}
                  {service.details && Object.keys(service.details).length > 0 && (
                    <>
                      {service.name === 'Supabase' && service.details.supabaseUrl ? (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3" />
                                <span className="font-medium">Supabase URL</span>
                              </div>
                              <span className="font-mono text-[10px]">{(service.details.supabaseUrl as string).replace('https://', '')}</span>
                            </div>
                            {service.details.userCount !== undefined && (
                              <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3" />
                                  <span className="font-medium">Total Users</span>
                                </div>
                                <Badge variant="outline">{service.details.userCount as number}</Badge>
                              </div>
                            )}
                            {service.details.totalLogs !== undefined && (
                              <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <Bug className="w-3 h-3" />
                                  <span className="font-medium">Total Logs</span>
                                </div>
                                <Badge variant="outline">{service.details.totalLogs as number}</Badge>
                              </div>
                            )}
                            {service.details.unresolvedErrors !== undefined && (
                              <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span className="font-medium">Unresolved Errors</span>
                                </div>
                                <Badge className={`${(service.details.unresolvedErrors as number) > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                                  {service.details.unresolvedErrors as number}
                                </Badge>
                              </div>
                            )}
                            {service.details.criticalAlerts !== undefined && (
                              <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-3 h-3" />
                                  <span className="font-medium">Critical Alerts</span>
                                </div>
                                <Badge className={`${(service.details.criticalAlerts as number) > 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                                  {service.details.criticalAlerts as number}
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">Response Time</span>
                              </div>
                              <span>{service.details.responseTime as string}</span>
                            </div>
                            
                            {/* Database Performance Section */}
                            {service.details.activeConnections !== undefined && (
                              <>
                                <div className="text-xs font-semibold text-muted-foreground mt-3 mb-1">
                                  Database Performance
                                </div>
                                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-3 h-3" />
                                    <span className="font-medium">Active Connections</span>
                                  </div>
                                  <Badge variant="outline">
                                    {service.details.activeConnections as number} / {service.details.maxConnections as number}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <Activity className="w-3 h-3" />
                                    <span className="font-medium">Connection Pool Usage</span>
                                  </div>
                                  <Badge className={getConnectionPoolBadgeColor(service.details.connectionPoolUsage as number)}>
                                    {service.details.connectionPoolUsage as number}%
                                  </Badge>
                                </div>
                                {(service.details.slowQueries as number) > 0 && (
                                  <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span className="font-medium">Slow Queries</span>
                                    </div>
                                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                      {service.details.slowQueries as number}
                                    </Badge>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Storage Metrics Section */}
                            {service.details.storageUsedGB !== undefined && (
                              <>
                                <div className="text-xs font-semibold text-muted-foreground mt-3 mb-1">
                                  Storage
                                </div>
                                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <HardDrive className="w-3 h-3" />
                                    <span className="font-medium">Storage Used</span>
                                  </div>
                                  <Badge variant="outline">{service.details.storageUsedGB as number} GB</Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <Database className="w-3 h-3" />
                                    <span className="font-medium">File Count</span>
                                  </div>
                                  <Badge variant="outline">{(service.details.fileCount as number)?.toLocaleString()}</Badge>
                                </div>
                                {(service.details.storageBandwidthGB as number) > 0 && (
                                  <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-2">
                                      <Zap className="w-3 h-3" />
                                      <span className="font-medium">Bandwidth Used</span>
                                    </div>
                                    <Badge variant="outline">{service.details.storageBandwidthGB as number} GB</Badge>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {/* Realtime Metrics Section */}
                            {service.details.realtimeConnections !== undefined && (
                              <>
                                <div className="text-xs font-semibold text-muted-foreground mt-3 mb-1">
                                  Realtime Subscriptions
                                </div>
                                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <Radio className="w-3 h-3" />
                                    <span className="font-medium">Active Connections</span>
                                  </div>
                                  <Badge variant="outline">{service.details.realtimeConnections as number}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-3 h-3" />
                                    <span className="font-medium">Active Channels</span>
                                  </div>
                                  <Badge variant="outline">{service.details.realtimeChannels as number}</Badge>
                                </div>
                                {(service.details.realtimeMessagesPerSec as number) > 0 && (
                                  <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-2">
                                      <Zap className="w-3 h-3" />
                                      <span className="font-medium">Messages/Sec</span>
                                    </div>
                                    <Badge variant="outline">{service.details.realtimeMessagesPerSec as number}</Badge>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </details>
                      ) : service.name === 'Supabase Auth' && service.details.activeUsersNow !== undefined ? (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3" />
                                <span className="font-medium">Active Users Now</span>
                                <span className="text-muted-foreground text-[10px]">(last 15 min)</span>
                              </div>
                              <Badge variant="outline">{service.details.activeUsersNow as number}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="font-medium">Logins Today</span>
                              </div>
                              <Badge variant="outline">{service.details.loginsToday as number}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-3 h-3" />
                                <span className="font-medium">Failed Logins Today</span>
                              </div>
                              <Badge className={`${(service.details.failedLoginsToday as number) > 10 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : (service.details.failedLoginsToday as number) > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {service.details.failedLoginsToday as number}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3" />
                                <span className="font-medium">Recent Signups</span>
                                <span className="text-muted-foreground text-[10px]">(24h)</span>
                              </div>
                              <Badge variant="outline">{service.details.recentSignups24h as number}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                <span className="font-medium">Admin Users</span>
                              </div>
                              <Badge variant="outline">{service.details.adminUsers as number}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="font-medium">Auth Errors</span>
                                <span className="text-muted-foreground text-[10px]">(unresolved)</span>
                              </div>
                              <Badge className={`${(service.details.authErrors as number) > 5 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : (service.details.authErrors as number) > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {service.details.authErrors as number}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">Response Time</span>
                              </div>
                              <span>{service.details.responseTime as string}</span>
                            </div>
                          </div>
                        </details>
                      ) : service.name === 'LLM Service' ? (
                        <div className="mt-3 space-y-2">
                          {!!service.details.serviceUrl && (
                            <div className="mb-2">
                              <a
                                href={service.details.serviceUrl as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-muted-foreground hover:text-foreground underline"
                              >
                                {service.details.serviceUrl as string}
                              </a>
                            </div>
                          )}
                          {!!service.details.services && Object.entries(service.details.services as Record<string, unknown>).map(([key, unknownValue]) => {
                            const value = unknownValue as {
                              status?: string;
                              error?: string;
                              message?: string;
                              details?: string | Record<string, unknown>;
                              type?: string;
                              workers?: number;
                            }
                            const isHealthy = value.status === 'healthy'
                            const hasDetails = value.error || value.message || value.details
                            return (
                              <div key={key} className="space-y-1">
                                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    {key === 'database' && <Database className="w-3 h-3" />}
                                    {key === 'redis' && <Activity className="w-3 h-3" />}
                                    {key === 'celery' && <Cpu className="w-3 h-3" />}
                                    <span className="font-medium capitalize">{key}</span>
                                    {value.type && <span className="text-muted-foreground">({value.type})</span>}
                                    {value.workers !== undefined && (
                                      <span className="text-muted-foreground">({value.workers} worker{value.workers !== 1 ? 's' : ''})</span>
                                    )}
                                  </div>
                                  <Badge className={`${isHealthy ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {isHealthy ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    <span className="ml-1">{value.status}</span>
                                  </Badge>
                                </div>
                                {!isHealthy && hasDetails && (
                                  <div className="text-[10px] text-red-600 dark:text-red-400 pl-2 pr-2 py-1 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                    {value.error && (
                                      <div className="flex items-start gap-1">
                                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                        <span className="flex-1"><strong>Error:</strong> {value.error}</span>
                                      </div>
                                    )}
                                    {value.message && !value.error && (
                                      <div className="flex items-start gap-1">
                                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                        <span className="flex-1">{value.message}</span>
                                      </div>
                                    )}
                                    {value.details && typeof value.details === 'string' && (
                                      <div className="mt-1 text-muted-foreground">{value.details}</div>
                                    )}
                                    {value.details && typeof value.details === 'object' && (
                                      <div className="mt-1 space-y-0.5">
                                        {Object.entries(value.details).map(([detailKey, detailValue]) => (
                                          <div key={detailKey} className="flex justify-between">
                                            <span className="text-muted-foreground">{detailKey}:</span>
                                            <span className="font-medium">{String(detailValue)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : service.name === 'Resend (Email)' && service.details.emailsSentToday !== undefined ? (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Send className="w-3 h-3" />
                                <span className="font-medium">Emails Sent Today</span>
                              </div>
                              <Badge variant="outline">{service.details.emailsSentToday as number}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                <span className="font-medium">Emails Sent This Week</span>
                              </div>
                              <Badge variant="outline">{service.details.emailsSentThisWeek as number}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="font-medium">Recent Bounces</span>
                              </div>
                              <Badge className={`${(service.details.recentBounces as number) > 10 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : (service.details.recentBounces as number) > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {service.details.recentBounces as number}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-3 h-3" />
                                <span className="font-medium">Recent Failures</span>
                              </div>
                              <Badge className={`${(service.details.recentFailures as number) > 5 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : (service.details.recentFailures as number) > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                                {service.details.recentFailures as number}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Database className="w-3 h-3" />
                                <span className="font-medium">Domains Configured</span>
                              </div>
                              <Badge variant="outline">{service.details.domainsConfigured as number}</Badge>
                            </div>
                            {!!service.details.domains && (service.details.domains as string[]).length > 0 && (
                              <div className="text-xs p-2 bg-muted rounded">
                                <div className="font-medium mb-1">Domains:</div>
                                <div className="space-y-1">
                                  {(service.details.domains as string[]).map((domain) => (
                                    <div key={domain} className="font-mono text-[10px] text-muted-foreground">{domain}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">Last Email Sent</span>
                              </div>
                              <span className="text-[10px]">{service.details.lastEmailSent === 'Never' ? 'Never' : formatDate(service.details.lastEmailSent as string)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <Activity className="w-3 h-3" />
                                <span className="font-medium">Response Time</span>
                              </div>
                              <span>{service.details.responseTime as string}</span>
                            </div>
                          </div>
                        </details>
                      ) : service.name === 'OpenRouter (AI)' && service.details.modelsAvailable !== undefined ? (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <div className="mt-3 space-y-3">
                            {/* API Status Section */}
                            <div className="space-y-2">
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">API Status</div>
                              <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <Bot className="w-3 h-3" />
                                  <span className="font-medium">Models Available</span>
                                </div>
                                <Badge variant="outline">{service.details.modelsAvailable as number}</Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  <span className="font-medium">API Response Time</span>
                                </div>
                                <Badge variant="outline">{service.details.responseTime as string}</Badge>
                              </div>
                            </div>

                            {/* Account Balance Section */}
                            <div className="space-y-2">
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Account Balance</div>
                              <div className="flex items-center justify-between text-xs p-3 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4" />
                                  <span className="font-medium">Available Credits</span>
                                </div>
                                <Badge 
                                  className={`font-mono text-sm px-3 py-1 ${
                                    service.details.creditBalance === 'N/A' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' :
                                    parseFloat((service.details.creditBalance as string).replace('$', '')) < 1 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    parseFloat((service.details.creditBalance as string).replace('$', '')) < 10 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  }`}
                                >
                                  {service.details.creditBalance as string}
                                </Badge>
                              </div>
                            </div>

                            {/* Usage - Today */}
                            {service.details.requestsToday !== undefined && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Today&apos;s Usage</div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <Activity className="w-3 h-3" />
                                      <span className="text-[10px]">Requests</span>
                                    </div>
                                    <div className="font-semibold">{(service.details.requestsToday as number).toLocaleString()}</div>
                                  </div>
                                  <div className="text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <DollarSign className="w-3 h-3" />
                                      <span className="text-[10px]">Cost</span>
                                    </div>
                                    <div className="font-semibold font-mono">{service.details.costToday as string}</div>
                                  </div>
                                  <div className="text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <Zap className="w-3 h-3" />
                                      <span className="text-[10px]">Tokens</span>
                                    </div>
                                    <div className="font-semibold">{(service.details.tokensToday as number).toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Usage - Last 7 Days */}
                            {service.details.requests7Days !== undefined && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Last 7 Days</div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <Activity className="w-3 h-3" />
                                      <span className="text-[10px]">Requests</span>
                                    </div>
                                    <div className="font-semibold">{(service.details.requests7Days as number).toLocaleString()}</div>
                                  </div>
                                  <div className="text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <DollarSign className="w-3 h-3" />
                                      <span className="text-[10px]">Cost</span>
                                    </div>
                                    <div className="font-semibold font-mono">{service.details.cost7Days as string}</div>
                                  </div>
                                  <div className="text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <Zap className="w-3 h-3" />
                                      <span className="text-[10px]">Tokens</span>
                                    </div>
                                    <div className="font-semibold">{(service.details.tokens7Days as number).toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Usage - Last 30 Days */}
                            {service.details.requests30Days !== undefined && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Last 30 Days</div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <Activity className="w-3 h-3" />
                                      <span className="text-[10px]">Requests</span>
                                    </div>
                                    <div className="font-semibold">{(service.details.requests30Days as number).toLocaleString()}</div>
                                  </div>
                                  <div className="text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <DollarSign className="w-3 h-3" />
                                      <span className="text-[10px]">Cost</span>
                                    </div>
                                    <div className="font-semibold font-mono">{service.details.cost30Days as string}</div>
                                  </div>
                                  <div className="text-xs p-2 bg-muted rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                      <Zap className="w-3 h-3" />
                                      <span className="text-[10px]">Tokens</span>
                                    </div>
                                    <div className="font-semibold">{(service.details.tokens30Days as number).toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </details>
                      ) : service.name === 'Stripe' && service.details.availableBalance !== undefined ? (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <div className="mt-3 space-y-3">
                            {/* Balance Section */}
                            <div className="space-y-2">
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Account Balance</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <CreditCard className="w-3 h-3" />
                                    <span className="text-[10px]">Available</span>
                                  </div>
                                  <div className="font-semibold font-mono">{service.details.availableBalance as string}</div>
                                </div>
                                <div className="text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-[10px]">Pending</span>
                                  </div>
                                  <div className="font-semibold font-mono">{service.details.pendingBalance as string}</div>
                                </div>
                              </div>
                            </div>

                            {/* Transactions (Last 24h) Section */}
                            <div className="space-y-2">
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Transactions (Last 24h)</div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                    <Activity className="w-3 h-3" />
                                    <span className="text-[10px]">Total</span>
                                  </div>
                                  <div className="font-semibold">{service.details.chargesLast24h as number}</div>
                                </div>
                                <div className="text-xs p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                  <div className="flex items-center gap-1 text-green-700 dark:text-green-400 mb-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span className="text-[10px]">Success</span>
                                  </div>
                                  <div className="font-semibold text-green-700 dark:text-green-400">{service.details.successfulCharges as number}</div>
                                </div>
                                <div className="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                  <div className="flex items-center gap-1 text-red-700 dark:text-red-400 mb-1">
                                    <XCircle className="w-3 h-3" />
                                    <span className="text-[10px]">Failed</span>
                                  </div>
                                  <div className="font-semibold text-red-700 dark:text-red-400">{service.details.failedCharges as number}</div>
                                </div>
                              </div>
                            </div>

                            {/* Account Metrics Section */}
                            <div className="space-y-2">
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">Account Metrics</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <Bot className="w-3 h-3" />
                                    <span className="font-medium">Active Subscriptions</span>
                                  </div>
                                  <Badge variant="outline">{service.details.activeSubscriptions as string}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    <span className="font-medium">Total Customers</span>
                                  </div>
                                  <Badge variant="outline">{service.details.totalCustomers as string}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span className="font-medium">Open Disputes</span>
                                </div>
                                <Badge className={`${
                                  (service.details.openDisputes as number) > 3 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                  (service.details.openDisputes as number) > 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                  {service.details.openDisputes as number}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  <span className="font-medium">API Response Time</span>
                                </div>
                                <Badge variant="outline">{service.details.responseTime as string}</Badge>
                              </div>
                            </div>
                          </div>
                        </details>
                      ) : service.name === 'Environment Config' && service.details.variables ? (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <div className="mt-3 space-y-2">
                            {Object.entries(service.details.variables as Record<string, string>).map(([varName, status]) => {
                              const isConfigured = status === 'configured'
                              return (
                                <div key={varName} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                                  <div className="flex items-center gap-2">
                                    <Settings className="w-3 h-3" />
                                    <span className="font-mono text-[10px]">{varName}</span>
                                  </div>
                                  <Badge className={`${isConfigured ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {isConfigured ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    <span className="ml-1">{status}</span>
                                  </Badge>
                                </div>
                              )
                            })}
                          </div>
                        </details>
                      ) : (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View details
                          </summary>
                          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                            {JSON.stringify(service.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {isCheckingHealth && !health && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>

        {/* System Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <SystemLogsTab />
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <SystemSettingsTab />
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="activity" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Last 50 activity log entries</CardDescription>
                </div>
                <Button
                  onClick={loadActivityLogs}
                  disabled={isLoadingLogs}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {isLoadingLogs ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activity logs yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-32" title={log.userEmail}>
                                {log.userEmail || log.userId.slice(0, 8)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.activityType}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.metadata && Object.keys(log.metadata).length > 0 ? (
                              <details>
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  View
                                </summary>
                                <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-w-xs max-h-24">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Cache Management</CardTitle>
              <CardDescription>Clear Next.js cache for admin pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will revalidate all admin page caches, forcing fresh data to be fetched on the next request.
                Use this if you see stale data after making changes.
              </p>

              <Button
                onClick={handleClearCache}
                disabled={isClearingCache}
                variant="destructive"
                className="gap-2"
              >
                {isClearingCache ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Clear All Admin Caches
              </Button>

              {cacheResult && (
                <div className={`p-4 rounded-lg ${
                  cacheResult.success
                    ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    {cacheResult.success ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {cacheResult.message}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Test Tab */}
        <TabsContent value="email" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Test Email</CardTitle>
              <CardDescription>Send a test email to verify email configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendTestEmail}
                  disabled={isSendingEmail || !testEmail}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  {isSendingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Test
                </Button>
              </div>

              {emailResult && (
                <div className={`p-4 rounded-lg ${
                  emailResult.success
                    ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    {emailResult.success ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {emailResult.message}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Test emails are sent from: {process.env.NEXT_PUBLIC_APP_NAME || 'Emergency Planner'} via Resend
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM Queue Tab */}
        <TabsContent value="llm-queue" className="mt-6">
          <LLMQueueTab />
        </TabsContent>

        {/* Callbacks Tab */}
        <TabsContent value="callbacks" className="mt-6">
          <LLMCallbackHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
