'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getRecentSystemLogs,
  getSystemLogStats,
  resolveSystemLog,
  testAdminNotification,
  type SystemLogEntry,
  type SystemLogStats,
} from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Bug,
  Loader2,
  User,
  Bell,
  Filter,
  Eye,
  Check,
} from 'lucide-react'

const severityColors: Record<string, string> = {
  debug: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  critical: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300',
}

const severityIcons: Record<string, React.ReactNode> = {
  debug: <Bug className="w-3 h-3" />,
  info: <Info className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
  error: <AlertCircle className="w-3 h-3" />,
  critical: <XCircle className="w-3 h-3" />,
}

const categoryColors: Record<string, string> = {
  api_error: 'border-blue-500',
  auth_error: 'border-purple-500',
  database_error: 'border-orange-500',
  external_service: 'border-cyan-500',
  payment_error: 'border-green-500',
  ai_error: 'border-pink-500',
  validation_error: 'border-yellow-500',
  permission_error: 'border-red-500',
  system_error: 'border-gray-500',
  user_action: 'border-indigo-500',
}

export function SystemLogsTab() {
  const [logs, setLogs] = useState<SystemLogEntry[]>([])
  const [stats, setStats] = useState<SystemLogStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false)
  const [notificationResult, setNotificationResult] = useState<{ success: boolean; message: string } | null>(null)

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [unresolvedOnly, setUnresolvedOnly] = useState(false)

  // View log modal
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Resolve modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [resolution, setResolution] = useState('')
  const [isResolving, setIsResolving] = useState(false)

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const filters: {
        severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical'
        category?: 'api_error' | 'auth_error' | 'database_error' | 'external_service' | 'payment_error' | 'ai_error' | 'validation_error' | 'permission_error' | 'system_error' | 'user_action'
        unresolvedOnly?: boolean
      } = {}

      if (severityFilter !== 'all') {
        filters.severity = severityFilter as 'debug' | 'info' | 'warning' | 'error' | 'critical'
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter as 'api_error' | 'auth_error' | 'database_error' | 'external_service' | 'payment_error' | 'ai_error' | 'validation_error' | 'permission_error' | 'system_error' | 'user_action'
      }
      if (unresolvedOnly) {
        filters.unresolvedOnly = true
      }

      const result = await getRecentSystemLogs(50, Object.keys(filters).length > 0 ? filters : undefined)
      setLogs(result)
    } catch (error) {
      console.error('Failed to load system logs:', error)
    } finally {
      setIsLoading(false)
    }
  }, [severityFilter, categoryFilter, unresolvedOnly])

  const loadStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const result = await getSystemLogStats()
      setStats(result)
    } catch (error) {
      console.error('Failed to load system log stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    loadLogs()
    loadStats()
  }, [loadLogs, loadStats])

  const handleViewLog = (log: SystemLogEntry) => {
    setSelectedLog(log)
    setIsViewModalOpen(true)
  }

  const handleOpenResolveModal = (log: SystemLogEntry) => {
    setSelectedLog(log)
    setResolution('')
    setIsResolveModalOpen(true)
  }

  const handleResolve = async () => {
    if (!selectedLog || !resolution.trim()) return

    setIsResolving(true)
    try {
      const result = await resolveSystemLog(selectedLog.id, resolution)
      if (result.success) {
        setIsResolveModalOpen(false)
        loadLogs()
        loadStats()
      }
    } catch (error) {
      console.error('Failed to resolve log:', error)
    } finally {
      setIsResolving(false)
    }
  }

  const handleSendTestNotification = async () => {
    setIsSendingTestNotification(true)
    setNotificationResult(null)
    try {
      const result = await testAdminNotification()
      setNotificationResult(result)
    } catch {
      setNotificationResult({ success: false, message: 'Failed to send test notification' })
    } finally {
      setIsSendingTestNotification(false)
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Logs</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.total || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription>Unresolved</CardDescription>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">
              {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.unresolved || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription>Last 24 Hours</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.last24Hours || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription>Critical/Error</CardDescription>
            <CardTitle className="text-2xl">
              {isLoadingStats ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                (stats?.bySeverity?.critical || 0) + (stats?.bySeverity?.error || 0)
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Test Notification Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Admin Notifications
          </CardTitle>
          <CardDescription>Test the admin error notification system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSendTestNotification}
            disabled={isSendingTestNotification}
            className="gap-2"
          >
            {isSendingTestNotification ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            Send Test Notification
          </Button>

          {notificationResult && (
            <div className={`p-4 rounded-lg ${
              notificationResult.success
                ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {notificationResult.success ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {notificationResult.message}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Admin email: {process.env.ADMIN_EMAIL || 'Not configured (set ADMIN_EMAIL in .env.local)'}
          </p>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">System Logs</CardTitle>
              <CardDescription>Recent error and system logs</CardDescription>
            </div>
            <Button
              onClick={loadLogs}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 pt-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="external_service">External Service</SelectItem>
                <SelectItem value="api_error">API Error</SelectItem>
                <SelectItem value="auth_error">Auth Error</SelectItem>
                <SelectItem value="database_error">Database Error</SelectItem>
                <SelectItem value="payment_error">Payment Error</SelectItem>
                <SelectItem value="ai_error">AI Error</SelectItem>
                <SelectItem value="validation_error">Validation Error</SelectItem>
                <SelectItem value="permission_error">Permission Error</SelectItem>
                <SelectItem value="system_error">System Error</SelectItem>
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={unresolvedOnly}
                onChange={(e) => setUnresolvedOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              Unresolved only
            </label>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bug className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No system logs found</p>
              <p className="text-sm">System logs will appear here when errors occur</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className={`border-l-4 ${categoryColors[log.category] || 'border-gray-500'}`}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge className={severityColors[log.severity]}>
                          {severityIcons[log.severity]}
                          <span className="ml-1">{log.severity}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {log.category.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate text-sm" title={log.message}>
                          {log.errorName && <span className="font-medium">{log.errorName}: </span>}
                          {log.message.slice(0, 60)}
                          {log.message.length > 60 && '...'}
                        </div>
                        {log.component && (
                          <div className="text-xs text-muted-foreground">
                            {log.component}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.userId ? (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs truncate max-w-20" title={log.userEmail}>
                              {log.userEmail || log.userId.slice(0, 8)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.resolved ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                            <Check className="w-3 h-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!log.resolved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenResolveModal(log)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Log Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && severityIcons[selectedLog.severity]}
              {selectedLog?.errorName || 'System Log'}
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={severityColors[selectedLog.severity]}>
                  {selectedLog.severity}
                </Badge>
                <Badge variant="outline">
                  {selectedLog.category.replace(/_/g, ' ')}
                </Badge>
                {selectedLog.errorCode && (
                  <Badge variant="secondary">{selectedLog.errorCode}</Badge>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-1">Message</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {selectedLog.message}
                </p>
              </div>

              {selectedLog.userAction && (
                <div>
                  <h4 className="font-medium mb-1">User Action</h4>
                  <p className="text-sm text-muted-foreground">{selectedLog.userAction}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedLog.component && (
                  <div>
                    <span className="font-medium">Component:</span>{' '}
                    <span className="text-muted-foreground">{selectedLog.component}</span>
                  </div>
                )}
                {selectedLog.route && (
                  <div>
                    <span className="font-medium">Route:</span>{' '}
                    <span className="text-muted-foreground">{selectedLog.route}</span>
                  </div>
                )}
                {selectedLog.userEmail && (
                  <div>
                    <span className="font-medium">User:</span>{' '}
                    <span className="text-muted-foreground">{selectedLog.userEmail}</span>
                  </div>
                )}
                {selectedLog.adminNotified && (
                  <div>
                    <span className="font-medium">Admin Notified:</span>{' '}
                    <span className="text-muted-foreground">{formatDate(selectedLog.adminNotified)}</span>
                  </div>
                )}
              </div>

              {selectedLog.stackTrace && (
                <div>
                  <h4 className="font-medium mb-1">Stack Trace</h4>
                  <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-48">
                    {selectedLog.stackTrace}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Metadata</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Modal */}
      <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Log</DialogTitle>
            <DialogDescription>
              Mark this log as resolved and add resolution notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1 text-sm">Error</h4>
              <p className="text-sm text-muted-foreground">
                {selectedLog?.errorName || selectedLog?.message.slice(0, 100)}
              </p>
            </div>

            <div>
              <label className="font-medium text-sm">Resolution Notes</label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this issue was resolved..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={isResolving || !resolution.trim()}
            >
              {isResolving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
