import { Fragment, useEffect, useRef } from 'react'
import { Archive, Barcode, ChevronDown, ChevronUp, PencilLine, Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatTHB } from '@/lib/formatCurrency'
import type { CatalogCategory, CatalogProductRecord } from '@/lib/erp-api'

import { productSelectionState } from '../products/barcodeLabels'

type ProductTableProps = {
  products: CatalogProductRecord[]
  categories: CatalogCategory[]
  archiveBusy?: boolean
  selectedVariantIds: Set<string>
  barcodeLabelCount: number
  onCreateProduct: () => void
  onEditProduct: (product: CatalogProductRecord) => void
  onArchiveProduct: (product: CatalogProductRecord) => void
  onArchiveVariant: (product: CatalogProductRecord, variantId: string) => void
  onReorderVariants: (productId: string, variantIds: string[]) => void
  onToggleProductVariants: (product: CatalogProductRecord, checked: boolean) => void
  onToggleVariant: (variantId: string, checked: boolean) => void
  onOpenBarcodePreview: () => void
  onClearBarcodeSelection: () => void
}

export function ProductTable({
  products,
  categories,
  archiveBusy = false,
  selectedVariantIds,
  barcodeLabelCount,
  onCreateProduct,
  onEditProduct,
  onArchiveProduct,
  onArchiveVariant,
  onReorderVariants,
  onToggleProductVariants,
  onToggleVariant,
  onOpenBarcodePreview,
  onClearBarcodeSelection,
}: ProductTableProps) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]))
  const selectedCount = barcodeLabelCount

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/25 px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">Parent products with nested variants, THB pricing, and archive actions.</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {selectedCount > 0 ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={onClearBarcodeSelection}>
              <X className="h-4 w-4" />
              Clear {selectedCount}
            </Button>
          ) : null}
          <Button variant="outline" className="gap-2" onClick={onOpenBarcodePreview} disabled={selectedCount === 0}>
            <Barcode className="h-4 w-4" />
            Print barcodes{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Button>
          <Button className="gap-2 transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]" onClick={onCreateProduct}>
            <Plus className="h-4 w-4" />
            Create product
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-lg font-semibold">No products yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first product or import a CSV to start managing variants, stock, and reports.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/70 text-left text-xs uppercase tracking-[0.16em] text-foreground">
              <tr>
                <th className="w-12 px-6 py-3">Print</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Variants / Stock</th>
                <th className="px-6 py-3">Price range</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((record) => {
                const variants = record.variants ?? []
                const prices = variants.map((variant) => variant.price)
                const minPrice = prices.length ? Math.min(...prices) : 0
                const maxPrice = prices.length ? Math.max(...prices) : 0
                const totalStock = variants.reduce((sum, v) => sum + ((v as any).stockLevel ?? 0), 0)
                const selection = productSelectionState(record, selectedVariantIds)

                return (
                  <Fragment key={record.product.id}>
                    <tr className="border-t border-border/70 align-top transition-colors duration-150 hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <IndeterminateCheckbox
                          ariaLabel={`Select all active variants for ${record.product.name}`}
                          checked={selection.checked}
                          indeterminate={selection.indeterminate}
                          disabled={selection.activeIds.length === 0}
                          onChange={(checked) => onToggleProductVariants(record, checked)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {record.product.image_url ? (
                            <img src={record.product.image_url} alt={record.product.name} className="h-10 w-10 rounded-md object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                              {record.product.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{record.product.name}</p>
                            <p className="text-xs text-muted-foreground">{record.product.description ?? 'No description'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{record.category?.name ?? categoryNames.get(record.product.category_id ?? '') ?? 'Uncategorized'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
                          {selection.selectedCount > 0 ? <span className="text-xs font-medium text-primary">{selection.selectedCount} active selected for print</span> : null}
                          {totalStock > 0 ? (
                            <span className={`text-xs font-medium ${totalStock < 10 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {totalStock} in stock
                            </span>
                          ) : (
                            <span className="text-xs text-destructive">Out of stock</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{variants.length ? `${formatTHB(minPrice)} – ${formatTHB(maxPrice)}` : '—'}</td>
                      <td className="px-6 py-4">{record.product.is_active ? 'Active' : 'Archived'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => onEditProduct(record)}>
                            <PencilLine className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" className="gap-2" onClick={() => onArchiveProduct(record)} disabled={archiveBusy}>
                            <Archive className="h-4 w-4" />
                            Archive
                          </Button>
                        </div>
                      </td>
                    </tr>

                    <tr className="border-t border-border/50 bg-muted/20">
                      <td className="px-6 py-4" colSpan={7}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Nested variants</p>
                            <Button variant="ghost" size="sm" className="gap-2" onClick={() => onReorderVariants(record.product.id, variants.map((variant) => variant.id))} disabled={archiveBusy}>
                              Reorder variants
                            </Button>
                          </div>

                          {variants.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No variants yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {variants.map((variant, index) => {
                                const nextIds = variants.map((item) => item.id)
                                const moveVariant = (from: number, to: number) => {
                                  if (to < 0 || to >= nextIds.length) {
                                    return
                                  }
                                  const next = [...nextIds]
                                  const [selected] = next.splice(from, 1)
                                  next.splice(to, 0, selected)
                                  onReorderVariants(record.product.id, next)
                                }

                                return (
<div key={variant.id} 
                                      className="animate-fade-in-up flex flex-wrap items-center gap-3 rounded-card border border-border bg-background px-4 py-3 transition-all duration-200 hover:border-border/90 hover:shadow-sm"
                                      style={{ animationDelay: `${index * 40}ms` }}
                                    >
                                    <input
                                      type="checkbox"
                                      aria-label={`Select barcode label for ${record.product.name} ${variant.name}`}
                                      checked={variant.is_active && selectedVariantIds.has(variant.id)}
                                      disabled={!variant.is_active}
                                      onChange={(event) => onToggleVariant(variant.id, event.currentTarget.checked)}
                                      className="h-4 w-4 rounded border-border"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium">{variant.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        SKU {variant.sku} · {variant.barcode ?? 'No barcode'} · {formatTHB(variant.price)}
                                        {!variant.is_active ? <span className="ml-2 font-medium text-muted-foreground">· Archived, not printable</span> : null}
                                        {(variant as any).stockLevel !== undefined && (
                                          <span className={`ml-2 font-medium ${(variant as any).stockLevel === 0 ? 'text-destructive' : (variant as any).stockLevel < 10 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                            · Stock: {(variant as any).stockLevel}
                                          </span>
                                        )}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Button variant="outline" size="icon-sm" onClick={() => moveVariant(index, index - 1)} disabled={index === 0 || archiveBusy}>
                                        <ChevronUp className="h-4 w-4" />
                                      </Button>
                                      <Button variant="outline" size="icon-sm" onClick={() => moveVariant(index, index + 1)} disabled={index === variants.length - 1 || archiveBusy}>
                                        <ChevronDown className="h-4 w-4" />
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => onArchiveVariant(record, variant.id)} disabled={archiveBusy}>
                                        <Archive className="mr-2 h-4 w-4" />
                                        Archive variant
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function IndeterminateCheckbox({ ariaLabel, checked, indeterminate, disabled, onChange }: { ariaLabel: string; checked: boolean; indeterminate: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked}
      aria-checked={indeterminate ? 'mixed' : checked}
      disabled={disabled}
      onChange={(event) => onChange(event.currentTarget.checked)}
      className="h-4 w-4 rounded border-border"
    />
  )
}
