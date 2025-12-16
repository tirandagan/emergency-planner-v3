'use client'

import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { importData, getImportHistory, getTemplateData, getTableConfigs } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
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
  Upload,
  Download,
  FileSpreadsheet,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  FileText,
} from 'lucide-react'
import type { ImportHistory } from '@/db/schema/imports'

type TableConfig = {
  key: string
  label: string
  fields: { value: string; label: string; required?: boolean }[]
}

type RowError = {
  row: number
  field: string
  message: string
}

type ImportResult = {
  success: boolean
  count?: number
  error?: string
  errors?: string[]
  rowErrors?: RowError[]
  historyId?: string
}

export function ImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [selectedTable, setSelectedTable] = useState<string>('specific_products')
  const [headers, setHeaders] = useState<string[]>([])
  const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([])
  const [mapping, setMapping] = useState<Record<string, { target: string; enabled: boolean }>>({})
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [history, setHistory] = useState<ImportHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [tableConfigs, setTableConfigs] = useState<TableConfig[]>([])
  const [activeTab, setActiveTab] = useState('import')

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    try {
      const data = await getImportHistory(10)
      setHistory(data)
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  const loadTableConfigs = useCallback(async () => {
    try {
      const configs = await getTableConfigs()
      setTableConfigs(configs)
    } catch (error) {
      console.error('Failed to load table configs:', error)
    }
  }, [])

  useEffect(() => {
    loadHistory()
    loadTableConfigs()
  }, [loadHistory, loadTableConfigs])

  const currentFields = tableConfigs.find(t => t.key === selectedTable)?.fields || []

  const autoMapHeaders = (fileHeaders: string[], table: string) => {
    const newMapping: Record<string, { target: string; enabled: boolean }> = {}
    const fields = tableConfigs.find(t => t.key === table)?.fields || []

    fileHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase()
      let target = ''
      let enabled = false

      // Exact match (label or value)
      const exactMatch = fields.find(f =>
        f.label.toLowerCase() === lowerHeader || f.value.toLowerCase() === lowerHeader
      )

      if (exactMatch) {
        target = exactMatch.value
        enabled = true
      } else {
        // Heuristics for common field names
        if (lowerHeader.includes('image') || lowerHeader.includes('img')) {
          target = 'image_url'
        } else if (lowerHeader.includes('link') || lowerHeader.includes('url')) {
          if (table === 'specific_products') target = 'product_url'
          else if (table === 'suppliers') target = 'website_url'
        } else if (lowerHeader.includes('name') || lowerHeader.includes('title')) {
          target = 'name'
        } else if (lowerHeader.includes('price') || lowerHeader.includes('cost') || lowerHeader.includes('msrp')) {
          target = 'price'
        } else if (lowerHeader.includes('desc')) {
          target = 'description'
        } else if (lowerHeader.includes('asin')) {
          target = 'asin'
        } else if (lowerHeader.includes('upc')) {
          target = 'upc'
        } else if (lowerHeader.includes('status')) {
          target = 'status'
        }

        if (target) enabled = true
      }

      newMapping[header] = { target, enabled }
    })
    return newMapping
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setResult(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      const bstr = evt.target?.result
      const wb = XLSX.read(bstr, { type: 'binary' })
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Record<string, unknown>[]

      if (data.length > 0) {
        const fileHeaders = Object.keys(data[0])
        setHeaders(fileHeaders)
        setParsedData(data)
        const initialMapping = autoMapHeaders(fileHeaders, selectedTable)
        setMapping(initialMapping)
      }
    }
    reader.readAsBinaryString(uploadedFile)
  }

  const handleTableChange = (newTable: string) => {
    setSelectedTable(newTable)
    if (headers.length > 0) {
      const newMapping = autoMapHeaders(headers, newTable)
      setMapping(newMapping)
    }
  }

  const handleMappingChange = (header: string, field: 'target' | 'enabled', value: string | boolean) => {
    setMapping(prev => ({
      ...prev,
      [header]: {
        ...prev[header],
        [field]: value
      }
    }))
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    setResult(null)

    try {
      const finalMapping: Record<string, { targetField: string; enabled: boolean }> = {}
      Object.entries(mapping).forEach(([header, config]) => {
        finalMapping[header] = {
          targetField: config.target,
          enabled: config.enabled
        }
      })

      const sanitizedData = JSON.parse(JSON.stringify(parsedData))
      const importResult = await importData(selectedTable, sanitizedData, finalMapping, file.name)

      setResult(importResult)

      if (importResult.success) {
        setFile(null)
        setParsedData([])
        setHeaders([])
        setMapping({})
        loadHistory()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setResult({ success: false, error: errorMessage })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    const templateData = await getTemplateData(selectedTable)
    if (!templateData.success) return

    const { headers: templateHeaders, exampleRow, tableName } = templateData

    const wb = XLSX.utils.book_new()
    const wsData = [templateHeaders, exampleRow]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths
    ws['!cols'] = templateHeaders.map(() => ({ wch: 20 }))

    XLSX.utils.book_append_sheet(wb, ws, tableName)

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tableName.toLowerCase()}_template.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      XLSX.writeFile(wb, `${tableName.toLowerCase()}_template.xlsx`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><AlertCircle className="w-3 h-3 mr-1" />Partial</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString()
  }

  const clearFile = () => {
    setFile(null)
    setParsedData([])
    setHeaders([])
    setMapping({})
    setResult(null)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import Tool</h1>
          <p className="text-sm text-muted-foreground mt-1">Import products, vendors, or categories from CSV/Excel files</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="import" className="gap-2">
            <Upload className="w-4 h-4" />
            Import Data
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6 mt-6">
          {/* Table Selection & Templates */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">1. Select Target & Download Template</CardTitle>
              <CardDescription>Choose what to import and download a template to fill out</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Target Table</label>
                  <Select value={selectedTable} onValueChange={handleTableChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tableConfigs.map(config => (
                        <SelectItem key={config.key} value={config.key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate('csv')}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV Template
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Excel Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">2. Upload File</CardTitle>
              <CardDescription>Upload a CSV or Excel file with your data</CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">CSV, XLS, or XLSX files</p>
                  </div>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-foreground">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{parsedData.length} rows found</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFile}>
                    Remove
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Column Mapping */}
          {parsedData.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">3. Map Columns</CardTitle>
                <CardDescription>Match your file columns to database fields. Required fields are marked.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Import</TableHead>
                        <TableHead>File Column</TableHead>
                        <TableHead>Maps To</TableHead>
                        <TableHead>Preview (Row 1)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {headers.map((header) => {
                        const config = mapping[header] || { target: '', enabled: false }
                        const targetField = currentFields.find(f => f.value === config.target)
                        return (
                          <TableRow key={header} className={!config.enabled ? "opacity-50" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={config.enabled}
                                onChange={(e) => handleMappingChange(header, 'enabled', e.target.checked)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{header}</TableCell>
                            <TableCell>
                              <Select
                                value={config.target}
                                onValueChange={(value) => handleMappingChange(header, 'target', value)}
                                disabled={!config.enabled}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  {currentFields.map(field => (
                                    <SelectItem key={field.value} value={field.value}>
                                      {field.label}
                                      {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {targetField?.required && config.enabled && (
                                <span className="text-xs text-red-500 ml-2">Required</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                              {String(parsedData[0][header] || '')}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Run Import
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card className={result.success
              ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20"
              : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
            }>
              <CardHeader>
                <CardTitle className={`text-lg flex items-center gap-2 ${result.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                  {result.success ? (
                    <><CheckCircle2 className="w-5 h-5" /> Import Successful</>
                  ) : (
                    <><XCircle className="w-5 h-5" /> Import Failed</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.success ? (
                  <p className="text-green-700 dark:text-green-300">Successfully imported {result.count} records.</p>
                ) : (
                  <div className="space-y-3">
                    {result.error && <p className="text-red-700 dark:text-red-300">{result.error}</p>}
                    {result.count !== undefined && result.count > 0 && (
                      <p className="text-yellow-700 dark:text-yellow-300">Partially imported {result.count} records.</p>
                    )}
                    {result.rowErrors && result.rowErrors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">Row Errors:</p>
                        <div className="max-h-48 overflow-y-auto bg-white dark:bg-gray-900 rounded border border-red-200 dark:border-red-800">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-20">Row</TableHead>
                                <TableHead>Field</TableHead>
                                <TableHead>Error</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.rowErrors.map((err, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="font-mono">{err.row}</TableCell>
                                  <TableCell>{err.field}</TableCell>
                                  <TableCell className="text-red-600 dark:text-red-400">{err.message}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Import History</CardTitle>
              <CardDescription>Recent import operations and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No import history yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File</TableHead>
                        <TableHead>Target</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Rows</TableHead>
                        <TableHead className="text-right">Success</TableHead>
                        <TableHead className="text-right">Errors</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.fileName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {tableConfigs.find(t => t.key === item.targetTable)?.label || item.targetTable}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell className="text-right">{item.totalRows}</TableCell>
                          <TableCell className="text-right text-green-600 dark:text-green-400">{item.successCount}</TableCell>
                          <TableCell className="text-right text-red-600 dark:text-red-400">{item.errorCount}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
