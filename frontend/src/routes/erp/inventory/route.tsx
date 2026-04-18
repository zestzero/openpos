<<<<<<< HEAD
import { createFileRoute } from '@tanstack/react-router'
import { useState, useCallback } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { bulkRestock, exportStockLevels, bulkStockCount, type BulkRestockRow, type BulkStockCountRow, type StockLevelExport } from '@/lib/api-client'
import { toast } from 'sonner'

export const Route = createFileRoute('/erp/inventory/')({
  component: InventoryBulkPage,
})

interface ParsedRow {
  variant_id: string
  quantity: number
  reason?: string
  error?: string
}

interface RestockResult {
  variant_id: string
  success: boolean
  error?: string
}

interface CountResult {
  variant_id: string
  success: boolean
  previous_balance?: number
  new_balance?: number
  adjustment_delta?: number
  error?: string
}

function InventoryBulkPage() {
  const [activeTab, setActiveTab] = useState<'restock' | 'count'>('restock')
  const [restockData, setRestockData] = useState<ParsedRow[]>([])
  const [countData, setCountData] = useState<ParsedRow[]>([])
  const [restockResults, setRestockResults] = useState<RestockResult[]>([])
  const [countResults, setCountResults] = useState<CountResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: 'restock' | 'count') => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedRow[] = []
        const errors: string[] = []

        results.data.forEach((row: any, index: number) => {
          const variantId = row.variant_id?.trim()
          const quantity = type === 'restock' ? parseInt(row.quantity, 10) : parseInt(row.counted_quantity ?? row.quantity, 10)
          const reason = row.reason?.trim()

          if (!variantId) {
            errors.push(`Row ${index + 1}: Missing variant_id`)
            return
          }

          if (isNaN(quantity) || quantity < 0) {
            errors.push(`Row ${index + 1}: Invalid quantity`)
            return
          }

          parsed.push({ variant_id: variantId, quantity, reason })
        })

        if (errors.length > 0) {
          toast.error(`Validation errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)
        }

        if (type === 'restock') {
          setRestockData(parsed)
        } else {
          setCountData(parsed)
        }
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`)
      },
    })
  }, [])

  const handleExportTemplate = useCallback((type: 'restock' | 'count') => {
    const headers = type === 'restock'
      ? ['variant_id', 'quantity', 'reason']
      : ['variant_id', 'counted_quantity', 'reason']
    const csv = headers.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stock_${type}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleExportCurrentStock = useCallback(async () => {
    setIsExporting(true)
    try {
      const response = await exportStockLevels()
      const csv = [
        ['variant_id', 'sku', 'barcode', 'product_name', 'balance', 'last_updated'].join(','),
        ...response.levels.map((level: StockLevelExport) =>
          [level.variant_id, level.sku ?? '', level.barcode ?? '', level.product_name ?? '', level.balance, level.last_updated ?? ''].join(',')
        ),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stock_export_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${response.levels.length} stock levels`)
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }, [])

  const handleProcessRestock = useCallback(async () => {
    if (restockData.length === 0) {
      toast.error('No data to process. Please upload a CSV first.')
      return
    }

    setIsProcessing(true)
    try {
      const rows: BulkRestockRow[] = restockData.map(row => ({
        variant_id: row.variant_id,
        quantity: row.quantity,
        reason: row.reason,
      }))

      const response = await bulkRestock(rows)
      setRestockResults(response.results)
      toast.success(`Restock complete: ${response.success_count} succeeded, ${response.failure_count} failed`)
    } catch (error) {
      toast.error(`Restock failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [restockData])

  const handleProcessStockCount = useCallback(async () => {
    if (countData.length === 0) {
      toast.error('No data to process. Please upload a CSV first.')
      return
    }

    setIsProcessing(true)
    try {
      const rows: BulkStockCountRow[] = countData.map(row => ({
        variant_id: row.variant_id,
        counted_quantity: row.quantity,
        reason: row.reason,
      }))

      const response = await bulkStockCount(rows)
      setCountResults(response.results)
      toast.success(`Stock count complete: ${response.success_count} succeeded, ${response.failure_count} failed`)
    } catch (error) {
      toast.error(`Stock count failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [countData])

  const handleDownloadErrors = useCallback((results: RestockResult[] | CountResult[], type: 'restock' | 'count') => {
    const failedRows = results.filter(r => !r.success)
    if (failedRows.length === 0) {
      toast.error('No failed rows to download')
      return
    }

    const csv = [
      ['variant_id', 'error'].join(','),
      ...failedRows.map(r => [r.variant_id, r.error ?? 'Unknown error'].join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_errors_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const successCount = restockResults.filter(r => r.success).length
  const failureCount = restockResults.filter(r => !r.success).length
  const countSuccessCount = countResults.filter(r => r.success).length
  const countFailureCount = countResults.filter(r => !r.success).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Stock Operations</h2>
          <p className="text-gray-500">Upload CSV files to restock or reconcile inventory</p>
        </div>
        <Button variant="outline" onClick={handleExportCurrentStock} disabled={isExporting}>
          {isExporting ? 'Exporting...' : 'Export Current Stock'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Restock</CardTitle>
            <CardDescription>Upload CSV with variant_id, quantity, reason</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv"
                id="restock-file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'restock')}
              />
              <label htmlFor="restock-file">
                <Button variant="outline" as="span" className="cursor-pointer">
                  Choose Restock CSV
                </Button>
              </label>
              <Button variant="ghost" onClick={() => handleExportTemplate('restock')}>
                Download Template
              </Button>
            </div>
            {restockData.length > 0 && (
              <div className="text-sm text-gray-600">
                {restockData.length} rows parsed
              </div>
            )}
            <Button onClick={handleProcessRestock} disabled={isProcessing || restockData.length === 0}>
              {isProcessing ? 'Processing...' : 'Process Restock'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Stock Count</CardTitle>
            <CardDescription>Upload CSV with variant_id, counted_quantity, reason</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="file"
                accept=".csv"
                id="count-file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'count')}
              />
              <label htmlFor="count-file">
                <Button variant="outline" as="span" className="cursor-pointer">
                  Choose Count CSV
                </Button>
              </label>
              <Button variant="ghost" onClick={() => handleExportTemplate('count')}>
                Download Template
              </Button>
            </div>
            {countData.length > 0 && (
              <div className="text-sm text-gray-600">
                {countData.length} rows parsed
              </div>
            )}
            <Button onClick={handleProcessStockCount} disabled={isProcessing || countData.length === 0}>
              {isProcessing ? 'Processing...' : 'Process Stock Count'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {restockResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Restock Results</CardTitle>
            <CardDescription>
              {successCount} succeeded, {failureCount} failed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Variant ID</th>
                    <th className="px-2 py-1 text-left">Status</th>
                    <th className="px-2 py-1 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {restockResults.map((result, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1 font-mono text-xs">{result.variant_id}</td>
                      <td className="px-2 py-1">
                        <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-red-600">{result.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {failureCount > 0 && (
              <Button variant="outline" className="mt-2" onClick={() => handleDownloadErrors(restockResults, 'restock')}>
                Download Error Report
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {countResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Count Results</CardTitle>
            <CardDescription>
              {countSuccessCount} succeeded, {countFailureCount} failed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Variant ID</th>
                    <th className="px-2 py-1 text-right">Previous</th>
                    <th className="px-2 py-1 text-right">New</th>
                    <th className="px-2 py-1 text-right">Adjustment</th>
                    <th className="px-2 py-1 text-left">Status</th>
                    <th className="px-2 py-1 text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {countResults.map((result, i) => (
                    <tr key={i} className="border-b">
                      <td className="px-2 py-1 font-mono text-xs">{result.variant_id}</td>
                      <td className="px-2 py-1 text-right">{result.previous_balance ?? '-'}</td>
                      <td className="px-2 py-1 text-right">{result.new_balance ?? '-'}</td>
                      <td className="px-2 py-1 text-right">
                        {result.adjustment_delta !== undefined && (
                          <span className={result.adjustment_delta > 0 ? 'text-green-600' : result.adjustment_delta < 0 ? 'text-red-600' : ''}>
                            {result.adjustment_delta > 0 ? '+' : ''}{result.adjustment_delta}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-red-600">{result.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {countFailureCount > 0 && (
              <Button variant="outline" className="mt-2" onClick={() => handleDownloadErrors(countResults, 'count')}>
                Download Error Report
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
=======
import { createFileRoute, Outlet } from "@tanstack/react--router";

export const Route = createFileRoute("/erp/inventory")({
  component: InventoryLayout,
});

function InventoryLayout() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>
      <Outlet />
    </div>
  );
>>>>>>> 2313688 (feat(OPE-4): add ERP route structure and layout)
}
