import { Search, ScanBarcode } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onScanPress?: () => void
}

export function SearchBar({ value, onChange, onScanPress }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-background sticky top-0 z-10 border-b">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search products or SKU..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 h-11"
        />
      </div>
      <button
        onClick={onScanPress}
        className="flex items-center justify-center h-11 w-11 rounded-md bg-accent text-white shrink-0"
        aria-label="Scan barcode"
      >
        <ScanBarcode className="h-5 w-5" />
      </button>
    </div>
  )
}
