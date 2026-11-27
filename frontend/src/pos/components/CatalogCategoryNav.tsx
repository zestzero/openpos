import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { api, type Category } from '@/lib/api'
import { usePosCopy } from '@/pos/lib/copy'

interface CatalogCategoryNavProps {
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CatalogCategoryNav({ selectedCategory, onSelectCategory }: CatalogCategoryNavProps) {
  const posCopy = usePosCopy()
  const [expanded, setExpanded] = useState(false)
  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.getCategories()).data,
    staleTime: 5 * 60 * 1000,
  })
  const categories: Category[] = data ?? []
  const visibleCategories = expanded ? categories : categories.slice(0, 4)

  if (isLoading) return <div className="h-12 rounded-xl bg-muted" aria-label={posCopy.loadingCategories} />
  if (error) return null

  const categoryButton = (id: string | null, label: string) => (
    <Chip
      key={id ?? 'all'}
      active={selectedCategory === id}
      onClick={() => onSelectCategory(id)}
    >
      {label}
    </Chip>
  )

  return (
    <nav className="flex flex-wrap gap-2" aria-label={posCopy.productCategories}>
      {categoryButton(null, posCopy.allItems)}
      {visibleCategories.map((category) => categoryButton(category.id, category.name))}
      {categories.length > 4 ? (
        <Button variant="ghost" className="min-h-12 rounded-xl px-3 text-base" onClick={() => setExpanded((value) => !value)}>
          {expanded ? posCopy.fewerCategories : posCopy.allCategories}
        </Button>
      ) : null}
    </nav>
  )
}
