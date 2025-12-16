'use server'

import { checkAdmin, getAdminUser } from '@/lib/adminAuth'
import { db } from '@/db'
import { specificProducts } from '@/db/schema/products'
import { suppliers } from '@/db/schema/suppliers'
import { categories } from '@/db/schema/categories'
import { importHistory } from '@/db/schema/imports'
import { desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type Mapping = {
  [fileHeader: string]: {
    targetField: string
    enabled: boolean
  }
}

type RowError = {
  row: number
  field: string
  message: string
}

const TABLE_CONFIGS: Record<string, {
  schema: typeof specificProducts | typeof suppliers | typeof categories
  label: string
  fields: { value: string; label: string; required?: boolean }[]
}> = {
  specific_products: {
    schema: specificProducts,
    label: "Products",
    fields: [
      { value: "name", label: "Name", required: true },
      { value: "description", label: "Description" },
      { value: "price", label: "Price" },
      { value: "image_url", label: "Image URL" },
      { value: "product_url", label: "Product Link" },
      { value: "asin", label: "ASIN" },
      { value: "upc", label: "UPC" },
      { value: "ean", label: "EAN" },
      { value: "gtin", label: "GTIN" },
      { value: "status", label: "Status" },
      { value: "type", label: "Type (AFFILIATE/DROP_SHIP)" },
    ]
  },
  suppliers: {
    schema: suppliers,
    label: "Vendors",
    fields: [
      { value: "name", label: "Name", required: true },
      { value: "website_url", label: "Website URL" },
      { value: "fulfillment_type", label: "Fulfillment Type" },
    ]
  },
  categories: {
    schema: categories,
    label: "Categories",
    fields: [
      { value: "name", label: "Name", required: true },
      { value: "slug", label: "Slug", required: true },
      { value: "description", label: "Description" },
      { value: "icon", label: "Icon/Emoji" },
    ]
  }
}

export async function getTableConfigs() {
  await checkAdmin()
  return Object.entries(TABLE_CONFIGS).map(([key, config]) => ({
    key,
    label: config.label,
    fields: config.fields
  }))
}

export async function importData(
  table: string,
  data: Record<string, unknown>[],
  mapping: Mapping,
  fileName: string
) {
  const user = await getAdminUser()

  const tableConfig = TABLE_CONFIGS[table]
  if (!tableConfig) {
    return { success: false, error: `Unknown table: ${table}` }
  }

  // Create import history record
  const [historyRecord] = await db.insert(importHistory).values({
    userId: user.id,
    fileName,
    targetTable: table,
    status: 'processing',
    totalRows: data.length,
    mapping,
    startedAt: new Date(),
  }).returning()

  const rowErrors: RowError[] = []
  const recordsToInsert: Record<string, unknown>[] = []

  // Validate and transform each row
  data.forEach((row, rowIndex) => {
    const record: Record<string, unknown> = {}
    let hasEnabledFields = false

    Object.entries(mapping).forEach(([fileHeader, config]) => {
      if (!config.enabled || !config.targetField) return

      const value = row[fileHeader]

      // Check required fields
      const fieldConfig = tableConfig.fields.find(f => f.value === config.targetField)
      if (fieldConfig?.required && (value === undefined || value === null || value === '')) {
        rowErrors.push({
          row: rowIndex + 2, // +2 for 1-indexed and header row
          field: config.targetField,
          message: `Required field "${fieldConfig.label}" is empty`
        })
        return
      }

      if (value !== undefined && value !== null && value !== '') {
        // Type conversion
        if (config.targetField === 'price') {
          const parsed = parseFloat(String(value).replace(/[^0-9.-]+/g, ""))
          if (isNaN(parsed)) {
            rowErrors.push({
              row: rowIndex + 2,
              field: config.targetField,
              message: `Invalid price format: "${value}"`
            })
            return
          }
          record[config.targetField] = parsed
        } else {
          record[config.targetField] = value
        }
        hasEnabledFields = true
      }
    })

    if (hasEnabledFields && !rowErrors.some(e => e.row === rowIndex + 2)) {
      recordsToInsert.push(record)
    }
  })

  if (recordsToInsert.length === 0) {
    await db.update(importHistory)
      .set({
        status: 'failed',
        errorCount: rowErrors.length,
        errors: rowErrors.slice(0, 100), // Limit stored errors
        completedAt: new Date(),
      })
      .where(eq(importHistory.id, historyRecord.id))

    revalidatePath('/admin/import')
    return {
      success: false,
      error: 'No valid records to import.',
      rowErrors: rowErrors.slice(0, 20),
      historyId: historyRecord.id
    }
  }

  // Chunk inserts
  const CHUNK_SIZE = 100
  let successCount = 0
  const dbErrors: string[] = []

  for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
    const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE)

    try {
      await db.insert(tableConfig.schema).values(chunk as never[])
      successCount += chunk.length
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error'
      console.error('Import chunk error:', error)
      dbErrors.push(errorMessage)

      // Add row errors for this chunk
      chunk.forEach((_, idx) => {
        rowErrors.push({
          row: i + idx + 2,
          field: 'database',
          message: errorMessage
        })
      })
    }
  }

  // Determine final status
  const finalStatus = dbErrors.length > 0
    ? (successCount > 0 ? 'partial' : 'failed')
    : 'completed'

  // Update history record
  await db.update(importHistory)
    .set({
      status: finalStatus,
      successCount,
      errorCount: rowErrors.length,
      errors: rowErrors.slice(0, 100),
      completedAt: new Date(),
    })
    .where(eq(importHistory.id, historyRecord.id))

  revalidatePath('/admin/import')

  if (dbErrors.length > 0) {
    return {
      success: false,
      count: successCount,
      errors: dbErrors,
      rowErrors: rowErrors.slice(0, 20),
      historyId: historyRecord.id
    }
  }

  return {
    success: true,
    count: successCount,
    historyId: historyRecord.id
  }
}

export async function getImportHistory(limit = 10) {
  await checkAdmin()

  const history = await db
    .select()
    .from(importHistory)
    .orderBy(desc(importHistory.createdAt))
    .limit(limit)

  return history
}

export async function getTemplateData(table: string): Promise<
  | { success: false; error: string }
  | { success: true; tableName: string; headers: string[]; exampleRow: string[]; fields: Array<{ value: string; label: string; required?: boolean }> }
> {
  await checkAdmin()

  const tableConfig = TABLE_CONFIGS[table]
  if (!tableConfig) {
    return { success: false, error: `Unknown table: ${table}` }
  }

  // Return headers and example row
  const headers = tableConfig.fields.map(f => f.label)
  const exampleRow = tableConfig.fields.map(f => {
    if (f.required) return `(Required) Example ${f.label}`
    return `Example ${f.label}`
  })

  return {
    success: true,
    tableName: tableConfig.label,
    headers,
    exampleRow,
    fields: tableConfig.fields
  }
}
