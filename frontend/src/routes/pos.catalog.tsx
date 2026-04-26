'use client'

import { useState } from 'react'
import { createRoute } from '@tanstack/react-router'
import { PosLayout } from '@/pos/layout/PosLayout'
import { CatalogCategoryNav } from '@/pos/components/CatalogCategoryNav'
import { CatalogGrid } from '@/pos/components/CatalogGrid'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: 'pos/catalog',
  component: PosCatalogRoute,
})

function PosCatalogRoute() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <PosLayout>
      <div className="flex flex-col gap-4">
        <CatalogCategoryNav
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <CatalogGrid categoryId={selectedCategory} />
      </div>
    </PosLayout>
  )
}