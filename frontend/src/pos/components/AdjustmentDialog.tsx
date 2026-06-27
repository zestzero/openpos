import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type SearchVariantRow } from '@/lib/api'

interface AdjustmentDialogProps {
  variant: SearchVariantRow | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (quantity: number, reason: 'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOST') => void
}

const REASON_OPTIONS = [
  { value: 'ADJUSTMENT', label: 'Manual Correction' },
  { value: 'RESTOCK', label: 'Restock (Add)' },
  { value: 'RETURN', label: 'Customer Return' },
  { value: 'DAMAGE', label: 'Damage Written Off' },
  { value: 'LOST', label: 'Lost / Missing Goods' },
] as const

export function AdjustmentDialog({ variant, isOpen, onClose, onSubmit }: AdjustmentDialogProps) {
  const [quantity, setQuantity] = useState('1')
  const [reason, setReason] = useState<'RESTOCK' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE' | 'LOST'>('ADJUSTMENT')

  useEffect(() => {
    if (isOpen) {
      setQuantity('1')
      setReason('ADJUSTMENT')
    }
  }, [isOpen])

  if (!variant) return null

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Number(quantity)
    if (Number.isInteger(parsed) && parsed !== 0) {
      onSubmit(parsed, reason)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-2xl backdrop-blur-md">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
              Record Stock Adjustment
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Specify quantity change (positive or negative) and reason for this item.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border/50 bg-muted/30 p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Scanned Item
            </p>
            <h4 className="font-semibold text-foreground truncate">{variant.product_name || variant.name}</h4>
            <div className="flex justify-between gap-4 text-sm text-muted-foreground">
              <span className="truncate">SKU: {variant.sku}</span>
              <span className="shrink-0 font-medium text-foreground">{variant.barcode}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Quantity Change (integer)
              </Label>
              <Input
                id="quantity"
                type="number"
                step="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 5 or -2"
                className="rounded-xl border-border/70 bg-background px-4 py-5 font-medium text-foreground focus:ring-2 focus:ring-primary"
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Use positive numbers to add stock, negative numbers to deduct stock.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Reason Code
              </Label>
              <Select
                value={reason}
                onValueChange={(val) => setReason(val as typeof reason)}
              >
                <SelectTrigger id="reason" className="w-full rounded-xl border-border/70 bg-background px-4 py-5 font-medium text-foreground">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-lg">
                  {REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="rounded-lg py-2.5">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-border px-5 py-4 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!quantity || Number(quantity) === 0}
              className="rounded-xl px-6 py-4 font-semibold shadow-md shadow-primary/20"
            >
              Save Adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
