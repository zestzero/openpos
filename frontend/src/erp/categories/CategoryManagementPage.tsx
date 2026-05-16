import { useState } from 'react'

import { CategoryDrawer } from '@/erp/categories/CategoryDrawer'
import { CategoryTable } from '@/erp/tables/CategoryTable'
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  type CatalogCategory,
  type CategoryFormValues,
} from '@/lib/erp-api'

export function CategoryManagementPage() {
  const { data: categories = [] } = useCategoriesQuery()
  const createCategoryMutation = useCreateCategoryMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null)

  const openCreateCategory = () => {
    setSelectedCategory(null)
    setCategoryDrawerOpen(true)
  }

  const openEditCategory = (category: CatalogCategory) => {
    setSelectedCategory(category)
    setCategoryDrawerOpen(true)
  }

  const saveCategory = async (values: CategoryFormValues) => {
    if (selectedCategory) {
      await updateCategoryMutation.mutateAsync({ id: selectedCategory.id, values })
    } else {
      await createCategoryMutation.mutateAsync(values)
    }

    setSelectedCategory(null)
    setCategoryDrawerOpen(false)
  }

  return (
    <div className="space-y-6">
      <CategoryTable categories={categories} onCreateCategory={openCreateCategory} onEditCategory={openEditCategory} />

      <CategoryDrawer
        open={categoryDrawerOpen}
        category={selectedCategory}
        categories={categories}
        onOpenChange={(open) => {
          setCategoryDrawerOpen(open)
          if (!open) {
            setSelectedCategory(null)
          }
        }}
        onSave={saveCategory}
      />
    </div>
  )
}
