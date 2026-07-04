import { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'
import type { ProductWithVariants } from '@/lib/api'

interface InventoryProductCardProps {
  product: ProductWithVariants
  draftQuantity: number
  draftReason: string
  onChange: (variantId: string, quantity: number, reason: any) => void
}

export function InventoryProductCard({ product, draftQuantity, draftReason, onChange }: InventoryProductCardProps) {
  const { product: p, variants, category } = product
  const primaryVariant = variants[0]
  if (!primaryVariant) return null

  const categoryLabel = category?.name ?? 'General'
  const skuLabel = primaryVariant.sku ?? p.name.slice(0, 3).toUpperCase()
  const stockLevel = primaryVariant.stockLevel ?? 0

  const [inputValue, setInputValue] = useState(draftQuantity > 0 ? `+${draftQuantity}` : String(draftQuantity))

  useEffect(() => {
    setInputValue(draftQuantity > 0 ? `+${draftQuantity}` : String(draftQuantity))
  }, [draftQuantity])

  const handleIncrement = () => {
    onChange(primaryVariant.id, draftQuantity + 1, draftReason)
  }

  const handleDecrement = () => {
    onChange(primaryVariant.id, draftQuantity - 1, draftReason)
  }

  const handleQuantityChange = (val: string) => {
    setInputValue(val)
    if (val === '' || val === '-' || val === '+') {
      return
    }
    const parsed = Number(val)
    if (Number.isInteger(parsed)) {
      onChange(primaryVariant.id, parsed, draftReason)
    }
  }

  const handleBlur = () => {
    setInputValue(draftQuantity > 0 ? `+${draftQuantity}` : String(draftQuantity))
  }

  const hasActiveDraft = draftQuantity !== 0

  return (
    <div className={`group rounded-3xl border bg-card text-foreground overflow-hidden flex flex-col justify-between transition-all duration-300 ${hasActiveDraft ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-border/60 shadow-xs hover:shadow-md'}`}>
      {/* Product Image / Placeholder */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        {p.image_url ? (
          <img
            alt={p.name}
            src={p.image_url}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-orange-50 p-4">
            <div className="text-center">
              <div className="text-4xl">🍽️</div>
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 shadow-sm backdrop-blur-md">
          {categoryLabel}
        </div>

        {/* Stock Level Badge */}
        <div className="absolute right-3 top-3">
          {stockLevel <= 0 ? (
            <span className="rounded-full bg-red-100/90 text-red-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-sm backdrop-blur-md">
              Out of stock
            </span>
          ) : stockLevel < 10 ? (
            <span className="rounded-full bg-amber-100/90 text-amber-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-sm backdrop-blur-md">
              Low: {stockLevel}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100/90 text-emerald-700 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-sm backdrop-blur-md">
              Stock: {stockLevel}
            </span>
          )}
        </div>
      </div>

      {/* Card Info and Inputs */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <p className="line-clamp-2 text-sm font-bold text-foreground leading-tight min-h-[2.5rem]">{p.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">SKU: {skuLabel}</p>
        </div>

        <div>
          {/* Quantity stepper */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-gray-500">Adjustment:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDecrement}
                className="h-7 w-7 rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground active:scale-90 flex items-center justify-center text-sm font-bold transition-all"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3 stroke-[2.5]" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onBlur={handleBlur}
                className="w-12 text-center text-xs font-bold border border-border rounded-lg py-1 bg-background text-foreground focus-visible:ring-indigo-500 focus:outline-none"
                aria-label="Adjustment quantity"
              />
              <button
                type="button"
                onClick={handleIncrement}
                className="h-7 w-7 rounded-lg border border-border bg-muted hover:bg-muted/80 text-foreground active:scale-90 flex items-center justify-center text-sm font-bold transition-all"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Reason code */}
          <select
            value={draftReason}
            onChange={(e) => onChange(primaryVariant.id, draftQuantity, e.target.value)}
            disabled={!hasActiveDraft}
            className={`mt-2.5 w-full text-xs border border-border rounded-lg p-2 bg-background text-foreground transition-all focus:outline-none focus:ring-1 ${hasActiveDraft ? 'border-indigo-300 focus:ring-indigo-500 font-semibold cursor-pointer' : 'text-muted-foreground cursor-not-allowed'}`}
          >
            <option value="RESTOCK">RESTOCK (Add)</option>
            <option value="ADJUSTMENT">ADJUSTMENT (Count)</option>
            <option value="DAMAGE">DAMAGE (Write-off)</option>
            <option value="LOST">LOST (Missing)</option>
            <option value="RETURN">RETURN (Customer)</option>
          </select>
        </div>
      </div>
    </div>
  )
}
