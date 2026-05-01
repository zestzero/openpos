'use client'

import { useQuery } from '@tanstack/react-query'
import { api, type Category } from '@/lib/api'
import { Button } from '@/components/ui/button'

interface CatalogCategoryNavProps {
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CatalogCategoryNav({
  selectedCategory,
  onSelectCategory,
}: CatalogCategoryNavProps) {
  const { data: categoriesData, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await api.getCategories()
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const categories: Category[] = categoriesData ?? []

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-10 w-28 animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load categories
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar" aria-label="Product categories">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        size="sm"
        className={selectedCategory === null
          ? 'min-h-[42px] shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold shadow-card'
          : 'min-h-[42px] shrink-0 rounded-full border-border bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'}
        onClick={() => onSelectCategory(null)}
      >
        All items
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? 'default' : 'outline'}
          size="sm"
          className={selectedCategory === category.id
            ? 'min-h-[42px] shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold shadow-card'
            : 'min-h-[42px] shrink-0 rounded-full border-border bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'}
          onClick={() => onSelectCategory(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
