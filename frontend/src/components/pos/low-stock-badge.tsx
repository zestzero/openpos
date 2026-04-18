import { Badge } from '@/components/ui/badge'

interface LowStockBadgeProps {
  status: 'low' | 'out'
  balance: number
  threshold: number
}

export function LowStockBadge({ status, balance, threshold }: LowStockBadgeProps) {
  if (status === 'out') {
    return (
      <Badge
        variant="destructive"
        className="absolute top-2 right-2"
      >
        OUT ({balance})
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className="absolute top-2 right-2 bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100"
    >
      LOW ({balance}/{threshold})
    </Badge>
  )
}
