import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ActiveSwitch } from '@/components/ui/active-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTHB } from '@/lib/formatCurrency'
import type { CatalogCategory, CatalogProductRecord, ProductFormValues, VariantFormValues } from '@/lib/erp-api'
import { normalizeProductDraft } from '@/lib/erp-api'
import { useImageUpload } from '@/hooks/useImageUpload'

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

const controlBaseClass =
  'w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const selectClassName = `${controlBaseClass} h-11`
const textareaClassName = `${controlBaseClass} min-h-24 resize-y`
const panelClassName = 'rounded-xl border border-border bg-background p-4 shadow-sm'

export function ProductDrawer({ open, product, categories, onOpenChange, onSave }: ProductDrawerProps) {
  const [draft, setDraft] = useState<ProductFormValues>(() => normalizeProductDraft(product))
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { state: uploadState, upload, reset: resetUpload } = useImageUpload((url) => {
    setDraft((current) => ({ ...current, imageUrl: url }))
  })

  useEffect(() => {
    if (open) {
      setDraft(normalizeProductDraft(product))
      resetUpload()
    }
  }, [open, product])

  const title = useMemo(() => (product ? 'Edit product' : 'Create product'), [product])

  const updateVariant = (index: number, patch: Partial<VariantFormValues>) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => (variantIndex === index ? { ...variant, ...patch } : variant)),
    }))
  }

  const handleFile = (file: File | null | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    void upload(file)
  }

  const isUploading = uploadState.status === 'compressing' || uploadState.status === 'uploading'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-border px-6 py-5 text-left shrink-0">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Manage the parent product, nested variants, and image from one place.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-6 py-6"
            onSubmit={(event) => {
              event.preventDefault()
              void onSave(draft)
            }}
          >
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Product details</h3>
                <p className="mt-1 text-sm text-muted-foreground">Core fields that define how the product appears in ERP and POS.</p>
              </div>

              <div className="grid gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm md:grid-cols-2">
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
                    className={selectClassName}
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
                    className={textareaClassName}
                  />
                </Field>

                <div className="md:col-span-2 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Product image</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Upload a JPG, PNG, or WebP image up to 10 MB. It will be compressed automatically.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Optional</span>
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload image: click or drag and drop"
                    aria-busy={isUploading}
                    className={[
                      'group relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      isDragging ? 'border-brand bg-brand/5' : 'border-border bg-muted/10 hover:bg-muted/30',
                      isUploading ? 'pointer-events-none opacity-70' : '',
                    ].join(' ')}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        fileInputRef.current?.click()
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      handleFile(e.dataTransfer.files[0])
                    }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">
                          {uploadState.status === 'compressing' ? 'Compressing…' : 'Uploading…'}
                        </p>
                        <p className="text-xs text-muted-foreground">Keep this dialog open while the image is being processed.</p>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Click to browse or drag and drop</p>
                          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP. Best results use a square or near-square image.</p>
                        </div>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleFile(event.target.files?.[0])}
                    />
                  </div>

                  {uploadState.status === 'error' && (
                    <div className="rounded-card border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {uploadState.message}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Or paste image URL</p>
                    <Input
                      aria-label="Image URL"
                      placeholder="https://example.com/image.jpg"
                      value={draft.imageUrl}
                      onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))}
                    />
                  </div>

                  {draft.imageUrl ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/20 p-3">
                      <img
                        src={draft.imageUrl}
                        alt={draft.name ? `${draft.name} preview` : 'Product preview'}
                        className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">Current image</p>
                        <p className="truncate text-xs text-muted-foreground">{draft.imageUrl}</p>
                      </div>
                      <button
                        type="button"
                        aria-label="Remove image"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        onClick={() => setDraft((current) => ({ ...current, imageUrl: '' }))}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>

                <ActiveSwitch
                  label="Active in POS"
                  description="Show this product in POS for cashiers to ring up."
                  checked={draft.isActive}
                  onCheckedChange={(checked) => setDraft((current) => ({ ...current, isActive: checked }))}
                  className="md:col-span-2"
                />
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Variants</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Each variant keeps its own SKU, barcode, price, and cost.</p>
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
                  <article key={variant.id ?? `${variant.sku}-${index}`} className={panelClassName}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-foreground">
                          {variant.name || variant.sku || `Variant ${index + 1}`}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {variant.name ? (variant.sku ? `SKU ${variant.sku}` : 'No SKU set') : 'Keep barcode, SKU, and pricing aligned.'}
                        </p>
                      </div>
                      <ActiveSwitch
                        label="Active"
                        ariaLabel={`Variant ${index + 1} active`}
                        checked={variant.isActive}
                        onCheckedChange={(checked) => updateVariant(index, { isActive: checked })}
                        compact
                      />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 md:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Price preview</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {formatTHB(Math.round(variant.price * 100))}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Calculated from the entered price.</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <DialogFooter className="sticky bottom-0 border-t border-border bg-background px-0 py-5">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>Save product</Button>
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
