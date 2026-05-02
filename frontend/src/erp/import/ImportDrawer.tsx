'use client'

import { useMemo, useState, type ChangeEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { AlertCircle, FileSpreadsheet, Upload, Wand2 } from 'lucide-react'
import * as XLSX from 'xlsx'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { importProducts, type ImportProductInput } from '@/lib/erp-api'

import { generateVariantBarcode } from '../products/variantBarcode'

type ImportPreviewRow = {
  id: string
  productName: string
  productDescription: string
  categoryId: string
  imageUrl: string
  variantName: string
  sku: string
  barcode: string
  priceSatang: number | null
  costSatang: number | null
  isActive: boolean
  errors: string[]
}

type ImportRowDraft = Omit<ImportPreviewRow, 'errors'>

const headerAliases = {
  productName: ['product_name', 'product', 'name'],
  productDescription: ['product_description', 'description'],
  categoryId: ['category_id', 'category'],
  imageUrl: ['image_url', 'image'],
  variantName: ['variant_name', 'variant'],
  sku: ['sku', 'variant_sku'],
  barcode: ['barcode', 'variant_barcode'],
  price: ['price', 'price_satang'],
  cost: ['cost', 'cost_satang'],
  isActive: ['is_active', 'active'],
} as const

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

function coerceText(value: unknown) {
  if (value == null) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }

  return ''
}

function parseMoney(value: unknown) {
  const text = coerceText(value)
  if (!text) {
    return null
  }

  const normalized = text.replace(/,/g, '')
  const numeric = Number(normalized)
  if (!Number.isFinite(numeric)) {
    return null
  }

  return normalized.includes('.') ? Math.round(numeric * 100) : Math.trunc(numeric)
}

function parseBoolean(value: unknown) {
  const text = coerceText(value).toLowerCase()
  if (!text) {
    return true
  }

  return !['false', '0', 'no', 'n', 'off'].includes(text)
}

function readCell(row: Record<string, unknown>, aliases: readonly string[]) {
  for (const alias of aliases) {
    if (alias in row) {
      return row[alias]
    }
  }
  return ''
}

function validateRows(baseRows: ImportRowDraft[]): ImportPreviewRow[] {
  const duplicateSkuRows = new Map<string, number[]>()
  const duplicateBarcodeRows = new Map<string, number[]>()

  baseRows.forEach((row, index) => {
    if (row.sku) {
      const positions = duplicateSkuRows.get(row.sku) ?? []
      positions.push(index)
      duplicateSkuRows.set(row.sku, positions)
    }

    if (row.barcode) {
      const positions = duplicateBarcodeRows.get(row.barcode) ?? []
      positions.push(index)
      duplicateBarcodeRows.set(row.barcode, positions)
    }
  })

  return baseRows.map((row) => {
    const errors: string[] = []

    if (!row.productName) errors.push('Product name is required')
    if (!row.variantName) errors.push('Variant name is required')
    if (!row.sku) errors.push('SKU is required')
    if (row.priceSatang == null) errors.push('Price is required')
    if (row.priceSatang != null && row.priceSatang < 0) errors.push('Price must be non-negative')
    if (row.costSatang != null && row.costSatang < 0) errors.push('Cost must be non-negative')

    if (row.sku && (duplicateSkuRows.get(row.sku)?.length ?? 0) > 1) {
      errors.push('SKU must be unique inside the import file')
    }

    if (row.barcode && (duplicateBarcodeRows.get(row.barcode)?.length ?? 0) > 1) {
      errors.push('Barcode must be unique inside the import file')
    }

    return {
      ...row,
      errors,
    }
  })
}

function parseRows(rawRows: Record<string, unknown>[]): ImportPreviewRow[] {
  const baseRows = rawRows.map((row, index) => ({
    id: `${index + 2}`,
    productName: coerceText(readCell(row, headerAliases.productName)),
    productDescription: coerceText(readCell(row, headerAliases.productDescription)),
    categoryId: coerceText(readCell(row, headerAliases.categoryId)),
    imageUrl: coerceText(readCell(row, headerAliases.imageUrl)),
    variantName: coerceText(readCell(row, headerAliases.variantName)),
    sku: coerceText(readCell(row, headerAliases.sku)),
    barcode: coerceText(readCell(row, headerAliases.barcode)),
    priceSatang: parseMoney(readCell(row, headerAliases.price)),
    costSatang: parseMoney(readCell(row, headerAliases.cost)),
    isActive: parseBoolean(readCell(row, headerAliases.isActive)),
  }))

  return validateRows(baseRows)
}

function rowsToProducts(rows: ImportPreviewRow[]): ImportProductInput[] {
  const products = new Map<string, ImportProductInput>()

  rows.forEach((row) => {
    if (row.errors.length > 0 || row.priceSatang == null) {
      return
    }

    const key = [row.productName, row.productDescription, row.categoryId, row.imageUrl, String(row.isActive)].join('::')
    const existing = products.get(key)

    const variant = {
      sku: row.sku,
      barcode: row.barcode || null,
      name: row.variantName,
      price: row.priceSatang,
      cost: row.costSatang,
      is_active: row.isActive,
    }

    if (existing) {
      existing.variants.push(variant)
      return
    }

    products.set(key, {
      name: row.productName,
      description: row.productDescription,
      category_id: row.categoryId || null,
      image_url: row.imageUrl || null,
      is_active: row.isActive,
      variants: [variant],
    })
  })

  return [...products.values()]
}

async function readFileRows(file: File) {
  const workbook = file.name.toLowerCase().endsWith('.csv')
    ? XLSX.read(await file.text(), { type: 'string' })
    : XLSX.read(await file.arrayBuffer(), { type: 'array' })

  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return []
  }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    return []
  }

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    .map((row) => {
      const normalizedRow: Record<string, unknown> = {}
      Object.entries(row).forEach(([key, value]) => {
        normalizedRow[normalizeHeader(key)] = value
      })
      return normalizedRow
    })
}

export function ImportDrawer() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ImportPreviewRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loadingError, setLoadingError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: importProducts,
    onSuccess: () => {
      setOpen(false)
      setRows([])
      setFileName('')
      setLoadingError(null)
    },
  })

  const canSubmit = rows.length > 0 && rows.every((row) => row.errors.length === 0) && !mutation.isPending
  const hasErrors = rows.some((row) => row.errors.length > 0)

  const previewCount = useMemo(() => rows.length, [rows])

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setFileName(file.name)
    setLoadingError(null)

    try {
      const rawRows = await readFileRows(file)
      setRows(parseRows(rawRows))
    } catch (error) {
      setRows([])
      setLoadingError(error instanceof Error ? error.message : 'Unable to parse spreadsheet file')
    }
  }

  function updateBarcode(rowId: string) {
    setRows((current) => {
      const existingBarcodes = current.map((row) => row.barcode).filter(Boolean)

      return validateRows(
        current.map((row) =>
          row.id !== rowId
            ? { ...row }
            : {
                ...row,
                barcode: generateVariantBarcode({
                  productName: row.productName,
                  variantName: row.variantName,
                  existingBarcodes,
                }),
              },
        ),
      )
    })
  }

  function handleBarcodeChange(rowId: string, barcode: string) {
    setRows((current) => validateRows(current.map((row) => (row.id === rowId ? { ...row, barcode } : { ...row }))))
  }

  function handleSubmit() {
    const products = rowsToProducts(rows)
    mutation.mutate({ products })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>

      <DialogContent className="right-0 top-0 h-dvh max-w-3xl translate-x-0 translate-y-0 rounded-none border-l p-0 sm:max-w-3xl">
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-border px-6 py-5 text-left">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileSpreadsheet className="h-5 w-5 text-brand" />
              Spreadsheet import
            </DialogTitle>
            <DialogDescription>
              Upload CSV or XLSX rows, review validation issues, then submit the validated products and variants.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-3 rounded-card border border-border bg-background p-4">
              <label className="space-y-2 text-sm font-medium text-foreground">
                Upload CSV or XLSX file
                <Input aria-label="Upload CSV or XLSX file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
              </label>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{fileName || 'No file selected'}</span>
                <span>•</span>
                <span>{previewCount} preview row{previewCount === 1 ? '' : 's'}</span>
                {hasErrors ? (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Row-level errors detected
                  </span>
                ) : null}
              </div>
              {loadingError ? <p className="text-sm text-destructive">{loadingError}</p> : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Preview</h3>
                <span className="text-sm text-muted-foreground">Validated rows are grouped by product before submit.</span>
              </div>

              {rows.length === 0 ? (
                <div className="rounded-card border border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
                  Create your first product or import a CSV to start managing variants, stock, and reports.
                </div>
              ) : (
                <div className="space-y-3">
                  {rows.map((row) => (
                    <div key={row.id} className="rounded-card border border-border bg-card px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{row.productName || 'Missing product name'}</p>
                          <p className="text-sm text-muted-foreground">{row.variantName || 'Missing variant name'}</p>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">SKU {row.sku || '—'}</p>
                        </div>

                        <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => updateBarcode(row.id)}>
                          <Wand2 className="h-4 w-4" />
                          Generate barcode
                        </Button>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="space-y-1 text-sm">
                          <span className="font-medium text-muted-foreground">Barcode</span>
                          <Input
                            value={row.barcode}
                            onChange={(event) => handleBarcodeChange(row.id, event.target.value)}
                            placeholder="Optional barcode"
                          />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Price (satang)" value={row.priceSatang == null ? '—' : String(row.priceSatang)} />
                          <Field label="Cost (satang)" value={row.costSatang == null ? '—' : String(row.costSatang)} />
                        </div>
                      </div>

                      {row.errors.length > 0 ? (
                        <ul className="mt-3 space-y-1 text-sm text-destructive">
                          {row.errors.map((error) => (
                            <li key={error}>• {error}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">Ready to submit</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
            <p className="text-sm text-muted-foreground">
              {canSubmit ? 'All preview rows are valid.' : 'Fix preview errors before submitting.'}
            </p>
            <Button type="button" disabled={!canSubmit} onClick={handleSubmit}>
              {mutation.isPending ? 'Importing…' : 'Import validated rows'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-background px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  )
}
