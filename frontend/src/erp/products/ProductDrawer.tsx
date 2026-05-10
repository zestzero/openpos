import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTHB } from '@/lib/formatCurrency'
import type { CatalogCategory, CatalogProductRecord, ProductFormValues, VariantFormValues } from '@/lib/erp-api'
import { normalizeProductDraft } from '@/lib/erp-api'

type ProductDrawerProps = {
  open: boolean
  product?: CatalogProductRecord | null
  categories: CatalogCategory[]
  onOpenChange: (open: boolean) => void
  onSave: (values: ProductFormValues) => void | Promise<void>
}

const emptyVariant = (): VariantFormValues => ({
  sku: '',
  barcode: '',
  name: '',
  price: 0,
  cost: 0,
  isActive: true,
})

export function ProductDrawer({ open, product, categories, onOpenChange, onSave }: ProductDrawerProps) {
  const [draft, setDraft] = useState<ProductFormValues>(() => normalizeProductDraft(product))

  useEffect(() => {
    if (open) {
      setDraft(normalizeProductDraft(product))
    }
  }, [open, product])

  const title = useMemo(() => (product ? 'Edit product' : 'Create product'), [product])

  const updateVariant = (index: number, patch: Partial<VariantFormValues>) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => (variantIndex === index ? { ...variant, ...patch } : variant)),
    }))
  }

  const handleImageUpload = async (file: File | null) => {
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setDraft((current) => ({ ...current, imageUrl: String(reader.result ?? '') }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,760px)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:rounded-card">
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-border px-6 py-5 text-left">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Owners can manage the parent product, nested variants, and the product image from this drawer.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5"
            onSubmit={(event) => {
              event.preventDefault()
              void onSave(draft)
            }}
          >
            <section className="grid gap-4 md:grid-cols-2">
              <Field label="Product name">
                <Input
                  value={draft.name}
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                />
              </Field>

              <Field label="Category">
                <select
                  aria-label="Category"
                  value={draft.categoryId ?? ''}
                  onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value || null }))}
                  className="h-11 w-full rounded-pill border border-input bg-background px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Description" className="md:col-span-2">
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-28 w-full rounded-card border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </Field>

              <Field label="Image URL" className="md:col-span-2">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Input
                      id="image-url"
                      aria-label="Image URL"
                      value={draft.imageUrl}
                      onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))}
                    />
                    <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium hover:bg-muted">
                      Upload
                      <input
                        className="hidden"
                        type="file"
                        accept="image/*"
                        onChange={(event) => void handleImageUpload(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  {draft.imageUrl ? (
                    <div className="flex items-center gap-4 rounded-card border border-border bg-muted/40 p-3">
                      <img
                        src={draft.imageUrl}
                        alt={draft.name ? `${draft.name} preview` : 'Product preview'}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Preview</p>
                        <p className="truncate text-xs text-muted-foreground">{draft.imageUrl}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Field>

              <label className="flex items-center gap-3 text-sm font-medium text-foreground md:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))}
                />
                Active in POS
              </label>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Variants</h3>
                  <p className="text-sm text-muted-foreground">Each variant keeps its own SKU, barcode, price, and cost.</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDraft((current) => ({ ...current, variants: [...current.variants, emptyVariant()] }))}
                >
                  Add variant
                </Button>
              </div>

              <div className="space-y-4">
                {draft.variants.map((variant, index) => (
                  <article key={variant.id ?? `${variant.sku}-${index}`} className="rounded-card border border-border bg-background p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold">Variant {index + 1}</h4>
                      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={variant.isActive}
                          onChange={(event) => updateVariant(index, { isActive: event.target.checked })}
                        />
                        Active
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Variant name">
                        <Input value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} />
                      </Field>
                      <Field label="SKU">
                        <Input value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} />
                      </Field>
                      <Field label="Barcode">
                        <Input value={variant.barcode} onChange={(event) => updateVariant(index, { barcode: event.target.value })} />
                      </Field>
                      <Field label="Price (THB)">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price}
                          onChange={(event) => updateVariant(index, { price: Number(event.target.value || 0) })}
                        />
                      </Field>
                      <Field label="Cost (THB)">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.cost}
                          onChange={(event) => updateVariant(index, { cost: Number(event.target.value || 0) })}
                        />
                      </Field>
                      <div className="rounded-card border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                        {variant.price ? formatTHB(Math.round(variant.price * 100)) : '฿0.00'}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <DialogFooter className="border-t border-border px-0 py-5">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save product</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`space-y-2 text-sm font-medium text-foreground ${className ?? ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}
