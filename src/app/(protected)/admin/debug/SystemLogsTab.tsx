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
  debug: 'text-gray-500 dark:text-gray-400',
  info: 'text-blue-500 dark:text-blue-400',
  warning: 'text-yellow-500 dark:text-yellow-400',
  error: 'text-red-500 dark:text-red-400',
  critical: 'text-red-600 dark:text-red-300',
}

const severityIcons: Record<string, React.ReactNode> = {
  debug: <Bug className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  critical: <XCircle className="w-4 h-4" />,
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

// Log Entry Component
function LogEntry({ 
  log, 
  onView, 
  onResolve 
}: { 
  log: SystemLogEntry
  onView: (log: SystemLogEntry) => void
  onResolve: (log: SystemLogEntry) => void
}) {
  const formatTime = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleTimeString()
  }

  return (
    <div
      className={`border-l-4 ${categoryColors[log.category] || 'border-gray-500'} bg-card rounded-r-lg p-3 space-y-2`}
    >
      {/* Header row with time, severity, status, actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatTime(log.createdAt)}
        </span>

        <div className={`${severityColors[log.severity]}`} title={log.severity}>
          {severityIcons[log.severity]}
        </div>

        <Badge variant="outline" className="text-xs">
          {log.category.replace(/_/g, ' ')}
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          {log.resolved ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 text-xs">
              <Check className="w-3 h-3 mr-1" />
              Resolved
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 text-xs">
              Open
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(log)}
            className="h-7 w-7 p-0"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>

          {!log.resolved && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onResolve(log)}
              className="h-7 w-7 p-0"
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="text-sm break-words">
        {log.errorName && <span className="font-medium">{log.errorName}: </span>}
        <span className="text-muted-foreground">{log.message}</span>
      </div>

      {/* Component and User info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        {log.component && (
          <span className="break-all">{log.component}</span>
        )}
        {log.userId && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-32" title={log.userEmail || log.userId}>
              {log.userEmail || log.userId.slice(0, 8)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
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
  const [groupBy, setGroupBy] = useState<'date' | 'category' | 'severity'>('date')

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

  const formatTime = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleTimeString()
  }

  const getDateKey = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const groupLogsByDate = (logs: SystemLogEntry[]) => {
    const grouped = new Map<string, SystemLogEntry[]>()

    logs.forEach((log) => {
      const dateKey = getDateKey(log.createdAt)
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(log)
    })

    return Array.from(grouped.entries()).map(([date, logs]) => ({ 
      date, 
      logs: logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }))
  }

  const groupLogsByCategory = (logs: SystemLogEntry[]) => {
    const grouped = new Map<string, SystemLogEntry[]>()

    logs.forEach((log) => {
      const categoryKey = log.category.replace(/_/g, ' ')
      if (!grouped.has(categoryKey)) {
        grouped.set(categoryKey, [])
      }
      grouped.get(categoryKey)!.push(log)
    })

    return Array.from(grouped.entries()).map(([category, categoryLogs]) => ({
      category,
      dateGroups: groupLogsByDate(categoryLogs)
    }))
  }

  const groupLogsBySeverity = (logs: SystemLogEntry[]) => {
    const severityOrder = ['critical', 'error', 'warning', 'info', 'debug']
    const grouped = new Map<string, SystemLogEntry[]>()

    logs.forEach((log) => {
      if (!grouped.has(log.severity)) {
        grouped.set(log.severity, [])
      }
      grouped.get(log.severity)!.push(log)
    })

    const sortedGroups = Array.from(grouped.entries())
      .sort((a, b) => severityOrder.indexOf(a[0]) - severityOrder.indexOf(b[0]))

    return sortedGroups.map(([severity, severityLogs]) => ({
      severity,
      categoryGroups: categoryFilter === 'all' 
        ? groupLogsByCategory(severityLogs)
        : [{ category: 'all', dateGroups: groupLogsByDate(severityLogs) }]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-lg">System Logs</CardTitle>
              <CardDescription>Recent error and system logs</CardDescription>
            </div>

            {/* Stats Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {isLoadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Badge variant="secondary" className="gap-1">
                    Total: {stats?.total || 0}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-red-500 text-red-600 dark:text-red-400">
                    Unresolved: {stats?.unresolved || 0}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600 dark:text-yellow-400">
                    24h: {stats?.last24Hours || 0}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-blue-500 text-blue-600 dark:text-blue-400">
                    Critical/Error: {(stats?.bySeverity?.critical || 0) + (stats?.bySeverity?.error || 0)}
                  </Badge>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSendTestNotification}
                disabled={isSendingTestNotification}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isSendingTestNotification ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                Test Admin Notification
              </Button>

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
          </div>

          {/* Notification Result */}
          {notificationResult && (
            <div className={`p-3 rounded-lg text-sm mt-4 ${
              notificationResult.success
                ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {notificationResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {notificationResult.message}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 pt-4 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'date' | 'category' | 'severity')}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Group by Date</SelectItem>
                <SelectItem value="category">Group by Category</SelectItem>
                <SelectItem value="severity">Group by Severity</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-border" />

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-auto">
                <SelectValue />
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

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-auto">
                <SelectValue />
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

            <label className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={unresolvedOnly}
                onChange={(e) => setUnresolvedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 cursor-pointer"
              />
              <span className="whitespace-nowrap">Unresolved</span>
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
            <div className="max-h-[600px] overflow-y-auto">
              <div className="space-y-6">
                {groupBy === 'date' && groupLogsByDate(logs).map(({ date, logs: dateLogs }) => (
                  <div key={date} className="space-y-2">
                    {/* Date Header */}
                    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 mb-2">
                      <h3 className="text-sm font-semibold text-muted-foreground">{date}</h3>
                    </div>

                    {/* Logs for this date */}
                    <div className="space-y-2">
                      {dateLogs.map((log) => (
                        <LogEntry 
                          key={log.id} 
                          log={log} 
                          onView={handleViewLog}
                          onResolve={handleOpenResolveModal}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {groupBy === 'category' && groupLogsByCategory(logs).map(({ category, dateGroups }) => (
                  <div key={category} className="space-y-2">
                    {/* Category Header */}
                    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 mb-2">
                      <h3 className="text-sm font-semibold text-foreground capitalize">{category}</h3>
                    </div>

                    {/* Date groups within category */}
                    <div className="space-y-4 ml-4">
                      {dateGroups.map(({ date, logs: dateLogs }) => (
                        <div key={date} className="space-y-2">
                          <h4 className="text-xs font-medium text-muted-foreground">{date}</h4>
                          <div className="space-y-2">
                            {dateLogs.map((log) => (
                              <LogEntry 
                                key={log.id} 
                                log={log}
                                onView={handleViewLog}
                                onResolve={handleOpenResolveModal}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {groupBy === 'severity' && groupLogsBySeverity(logs).map(({ severity, categoryGroups }) => (
                  <div key={severity} className="space-y-2">
                    {/* Severity Header */}
                    <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={severityColors[severity]}>{severityIcons[severity]}</div>
                        <h3 className={`text-sm font-semibold capitalize ${severityColors[severity]}`}>{severity}</h3>
                      </div>
                    </div>

                    {/* Category groups within severity */}
                    <div className="space-y-4 ml-4">
                      {categoryGroups.map(({ category, dateGroups }) => (
                        <div key={category} className="space-y-2">
                          {category !== 'all' && (
                            <h4 className="text-xs font-medium text-foreground capitalize">{category}</h4>
                          )}
                          <div className={category !== 'all' ? 'ml-4 space-y-4' : 'space-y-4'}>
                            {dateGroups.map(({ date, logs: dateLogs }) => (
                              <div key={date} className="space-y-2">
                                <h5 className="text-xs font-medium text-muted-foreground">{date}</h5>
                                <div className="space-y-2">
                                  {dateLogs.map((log) => (
                                    <LogEntry 
                                      key={log.id} 
                                      log={log}
                                      onView={handleViewLog}
                                      onResolve={handleOpenResolveModal}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
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
