'use client'

import { useState, useEffect, useCallback } from 'react'
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
  'Database (PostgreSQL)': <Database className="w-5 h-5" />,
  'Supabase Auth': <Shield className="w-5 h-5" />,
  'Stripe': <CreditCard className="w-5 h-5" />,
  'Resend (Email)': <Mail className="w-5 h-5" />,
  'OpenRouter (AI)': <Bot className="w-5 h-5" />,
  'Environment Config': <Settings className="w-5 h-5" />,
}

export default function DebugPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([])
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null)
  const [cacheResult, setCacheResult] = useState<{ success: boolean; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState('health')

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
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="health" className="gap-2">
            <Activity className="w-4 h-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Bug className="w-4 h-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Clock className="w-4 h-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="cache" className="gap-2">
            <Trash2 className="w-4 h-4" />
            Cache
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                  <p className="text-sm text-muted-foreground">{service.message}</p>
                  {service.latency !== undefined && (
                    <p className="text-xs mt-2">
                      Latency: {formatLatency(service.latency)}
                    </p>
                  )}
                  {service.details && Object.keys(service.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        View details
                      </summary>
                      <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                        {JSON.stringify(service.details, null, 2)}
                      </pre>
                    </details>
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
      </Tabs>
    </div>
  )
}
