'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import {
  getAllSystemSettings,
  updateSystemSettingAction,
  type SystemSettingWithUser,
} from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import {
  RefreshCw,
  Settings,
  Loader2,
  Edit,
  Save,
  X,
  Lock,
  CheckCircle2,
  XCircle,
  Info,
  Type,
  Hash,
  CheckSquare,
  Braces,
  List,
} from 'lucide-react'

// Value type info with professional Lucide icons
const valueTypeInfo: Record<
  string,
  { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; label: string }
> = {
  string: { icon: Type, label: 'string' },
  number: { icon: Hash, label: 'number' },
  boolean: { icon: CheckSquare, label: 'boolean' },
  object: { icon: Braces, label: 'object' },
  array: { icon: List, label: 'array' },
}

// Edit Setting Component
function EditSettingDialog({
  setting,
  isOpen,
  onClose,
  onSave,
}: {
  setting: SystemSettingWithUser | null
  isOpen: boolean
  onClose: () => void
  onSave: (key: string, value: string) => Promise<void>
}) {
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (setting) {
      setEditValue(setting.value)
      setError(null)
    }
  }, [setting])

  const handleSave = async () => {
    if (!setting) return

    setIsSaving(true)
    setError(null)

    try {
      // Validate based on type
      let validatedValue = editValue

      if (setting.valueType === 'number') {
        const num = Number(editValue)
        if (isNaN(num)) {
          throw new Error('Invalid number format')
        }
        validatedValue = String(num)
      } else if (setting.valueType === 'boolean') {
        if (!['true', 'false'].includes(editValue.toLowerCase())) {
          throw new Error('Boolean value must be "true" or "false"')
        }
        validatedValue = editValue.toLowerCase()
      } else if (setting.valueType === 'object' || setting.valueType === 'array') {
        // Validate JSON
        try {
          JSON.parse(editValue)
        } catch {
          throw new Error('Invalid JSON format')
        }
      }

      await onSave(setting.key, validatedValue)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save setting')
    } finally {
      setIsSaving(false)
    }
  }

  if (!setting) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="!w-5 !h-5" strokeWidth={2.5} />
            Edit Setting
          </DialogTitle>
          <DialogDescription>{setting.description || 'No description available'}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Setting Info */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">
              {setting.key}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {setting.category}
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              {valueTypeInfo[setting.valueType]?.icon &&
                (() => {
                  const IconComponent = valueTypeInfo[setting.valueType].icon
                  return <IconComponent className="!w-3 !h-3" strokeWidth={2.5} />
                })()}
              <span className="text-xs">{valueTypeInfo[setting.valueType]?.label}</span>
            </Badge>
          </div>

          {/* Value Input */}
          <div className="space-y-2">
            <Label htmlFor="setting-value">Value</Label>
            {setting.valueType === 'boolean' ? (
              <Select value={editValue} onValueChange={setEditValue}>
                <SelectTrigger id="setting-value">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            ) : setting.valueType === 'object' || setting.valueType === 'array' ? (
              <Textarea
                id="setting-value"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder={setting.valueType === 'object' ? '{"key": "value"}' : '["item1", "item2"]'}
              />
            ) : setting.valueType === 'number' ? (
              <Input
                id="setting-value"
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-mono"
              />
            ) : (
              <Input
                id="setting-value"
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-mono"
              />
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                <XCircle className="!w-4 !h-4" strokeWidth={2.5} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-xs text-muted-foreground space-y-2 bg-muted/30 p-4 rounded-md border border-border/50">
            {setting.lastModifiedBy && (
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-fit">Last modified by:</span>
                <span className="text-foreground/70">{setting.modifiedByEmail || setting.lastModifiedBy.slice(0, 8)}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="font-medium min-w-fit">Updated:</span>
              <span className="text-foreground/70">{new Date(setting.updatedAt).toLocaleString()}</span>
            </div>
            {setting.environment && setting.environment !== 'all' && (
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-fit">Environment:</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {setting.environment}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="gap-2">
            <X className="!w-4 !h-4" strokeWidth={2} />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !editValue.trim()} className="gap-2">
            {isSaving ? (
              <Loader2 className="!w-4 !h-4 animate-spin" strokeWidth={2.5} />
            ) : (
              <Save className="!w-4 !h-4" strokeWidth={2.5} />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SystemSettingsTab() {
  const [settings, setSettings] = useState<SystemSettingWithUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedSetting, setSelectedSetting] = useState<SystemSettingWithUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null)

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getAllSystemSettings()
      setSettings(result)
    } catch (error) {
      console.error('Failed to load system settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleEditClick = (setting: SystemSettingWithUser) => {
    setSelectedSetting(setting)
    setIsEditModalOpen(true)
    setSaveResult(null)
  }

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      const result = await updateSystemSettingAction(key, value)
      if (result.success) {
        setSaveResult({ success: true, message: 'Setting updated successfully' })
        await loadSettings()
        setTimeout(() => setSaveResult(null), 3000)
      } else {
        setSaveResult({ success: false, message: result.error || 'Failed to update setting' })
      }
    } catch (error) {
      setSaveResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update setting',
      })
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString()
  }

  const formatValue = (value: string, valueType: string) => {
    if (valueType === 'boolean') {
      return value === 'true' ? (
        <Badge variant="outline" className="gap-1.5 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
          <CheckCircle2 className="!w-3 !h-3" strokeWidth={2.5} />
          true
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1.5 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
          <XCircle className="!w-3 !h-3" strokeWidth={2.5} />
          false
        </Badge>
      )
    }

    if (valueType === 'object' || valueType === 'array') {
      try {
        const parsed = JSON.parse(value)
        return (
          <details className="cursor-pointer group">
            <summary className="text-xs text-muted-foreground hover:text-primary transition-colors list-none flex items-center gap-1.5">
              <Braces className="!w-3 !h-3" strokeWidth={2} />
              View JSON
            </summary>
            <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-auto max-h-32 mt-2 border border-border">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </details>
        )
      } catch {
        return (
          <Badge variant="outline" className="gap-1.5 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="!w-3 !h-3" strokeWidth={2.5} />
            Invalid JSON
          </Badge>
        )
      }
    }

    return <span className="font-mono text-sm text-foreground/90">{value}</span>
  }

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(settings.map((s) => s.category)))]

  // Filter and group settings by category
  const filteredSettings =
    categoryFilter === 'all' ? settings : settings.filter((s) => s.category === categoryFilter)

  // Group settings by category
  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    const category = setting.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(setting)
    return acc
  }, {} as Record<string, SystemSettingWithUser[]>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="!w-5 !h-5" strokeWidth={2.5} />
                System Settings
              </CardTitle>
              <CardDescription>
                Global admin-configurable settings for system behaviors
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={loadSettings} disabled={isLoading} variant="outline" size="sm" className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors">
                {isLoading ? <Loader2 className="!w-4 !h-4 animate-spin" strokeWidth={2.5} /> : <RefreshCw className="!w-4 !h-4" strokeWidth={2} />}
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Save Result */}
          {saveResult && (
            <div
              className={`p-4 rounded-md text-sm mt-4 border ${
                saveResult.success
                  ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {saveResult.success ? <CheckCircle2 className="!w-4 !h-4" strokeWidth={2.5} /> : <XCircle className="!w-4 !h-4" strokeWidth={2.5} />}
                <span className="font-medium">{saveResult.message}</span>
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex items-center gap-2 pt-4">
            <span className="text-sm text-muted-foreground">Filter by category:</span>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {filteredSettings.length} setting{filteredSettings.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="!w-8 !h-8 animate-spin text-primary/60 mb-3" strokeWidth={2} />
              <p className="text-sm text-muted-foreground">Loading settings...</p>
            </div>
          ) : filteredSettings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="!w-16 !h-16 mx-auto mb-4 opacity-40" strokeWidth={1.5} />
              <p className="text-base font-medium mb-1">No system settings found</p>
              <p className="text-sm text-muted-foreground/70">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[50px] px-2"></TableHead>
                      <TableHead className="font-semibold">Key</TableHead>
                      <TableHead className="font-semibold">Value</TableHead>
                      <TableHead className="font-semibold">Last Modified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedSettings).map(([category, categorySettings]) => (
                      <Fragment key={`category-${category}`}>
                        {/* Category Header Row */}
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableCell colSpan={4} className="py-2.5">
                            <div className="flex items-center gap-2">
                              <Settings className="!w-4 !h-4 text-muted-foreground" strokeWidth={2} />
                              <span className="font-semibold text-sm capitalize text-foreground">
                                {category}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {categorySettings.length} setting{categorySettings.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Category Settings */}
                        {categorySettings.map((setting) => (
                          <TableRow key={setting.id} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="w-[50px] px-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(setting)}
                                disabled={!setting.isEditable}
                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                                title={setting.isEditable ? 'Edit setting' : 'Setting is not editable'}
                              >
                                <Edit className="!w-4 !h-4" strokeWidth={2} />
                              </Button>
                            </TableCell>
                            <TableCell className="min-w-[280px] max-w-xl">
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs break-words font-medium text-foreground">{setting.key}</span>
                                  {!setting.isEditable && (
                                    <Lock className="!w-3 !h-3 text-muted-foreground/60 flex-shrink-0" strokeWidth={2} />
                                  )}
                                </div>
                                {setting.description && (
                                  <div className="flex items-start gap-1.5 text-muted-foreground">
                                    <Info className="!w-3 !h-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
                                    <span className="text-sm leading-relaxed">{setting.description}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[150px] max-w-xs">{formatValue(setting.value, setting.valueType)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="text-xs">{formatDate(setting.updatedAt)}</div>
                                {setting.modifiedByEmail && (
                                  <div className="text-xs text-muted-foreground/70">by {setting.modifiedByEmail}</div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {filteredSettings.map((setting) => (
                  <Card key={setting.id} className="border border-border hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-medium break-all">{setting.key}</span>
                            {!setting.isEditable && (
                              <Lock className="!w-3 !h-3 text-muted-foreground/60 flex-shrink-0" strokeWidth={2} />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="capitalize text-xs">
                              {setting.category}
                            </Badge>
                            <Badge variant="outline" className="gap-1.5">
                              {valueTypeInfo[setting.valueType]?.icon &&
                                (() => {
                                  const IconComponent = valueTypeInfo[setting.valueType].icon
                                  return <IconComponent className="!w-3 !h-3" strokeWidth={2.5} />
                                })()}
                              <span className="text-xs">{valueTypeInfo[setting.valueType]?.label}</span>
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(setting)}
                          disabled={!setting.isEditable}
                          className="gap-2 hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                        >
                          <Edit className="!w-4 !h-4" strokeWidth={2} />
                        </Button>
                      </div>

                      {/* Value */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-muted-foreground">Value</div>
                        <div>{formatValue(setting.value, setting.valueType)}</div>
                      </div>

                      {/* Description */}
                      {setting.description && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-medium text-muted-foreground">Description</div>
                          <div className="flex items-start gap-2">
                            <Info className="!w-4 !h-4 text-muted-foreground/60 flex-shrink-0 mt-0.5" strokeWidth={2} />
                            <span className="text-sm text-muted-foreground leading-relaxed">{setting.description}</span>
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="pt-2 border-t border-border/50">
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>Updated: {formatDate(setting.updatedAt)}</div>
                          {setting.modifiedByEmail && <div>By: {setting.modifiedByEmail}</div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <EditSettingDialog
        setting={selectedSetting}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveSetting}
      />
    </div>
  )
}
