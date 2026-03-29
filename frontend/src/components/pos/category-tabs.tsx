import type { CategoryResponse } from '@/lib/api-client'

interface CategoryTabsProps {
  categories: CategoryResponse[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryTabs({ categories, selectedId, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-none border-b bg-background">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium transition-colors ${
          selectedId === null
            ? 'bg-accent text-white'
            : 'bg-surface text-zinc-600 hover:bg-zinc-200'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            selectedId === cat.id
              ? 'bg-accent text-white'
              : 'bg-surface text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
