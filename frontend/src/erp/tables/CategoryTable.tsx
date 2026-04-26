import { ArrowDown, ArrowUp, PencilLine, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { CatalogCategory } from '@/lib/erp-api'

type CategoryTableProps = {
  categories: CatalogCategory[]
  onCreateCategory: () => void
  onEditCategory: (category: CatalogCategory) => void
  onReorderCategories: (ids: string[]) => void
}

export function CategoryTable({ categories, onCreateCategory, onEditCategory, onReorderCategories }: CategoryTableProps) {
  const moveCategory = (index: number, targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= categories.length) {
      return
    }

    const nextIds = categories.map((category) => category.id)
    const [selected] = nextIds.splice(index, 1)
    nextIds.splice(targetIndex, 0, selected)
    onReorderCategories(nextIds)
  }

  return (
    <Card className="overflow-hidden border-border/70">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">Create, edit, and reorder the category list used by products and POS navigation.</p>
        </div>

        <Button className="gap-2" onClick={onCreateCategory}>
          <Plus className="h-4 w-4" />
          Create category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-lg font-semibold">No categories yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Create your first category to organize products in the ERP table and POS grid.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Parent</th>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr key={category.id} className="border-t border-border/70">
                  <td className="px-6 py-4">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-xs text-muted-foreground">{category.description ?? 'No description'}</p>
                  </td>
                  <td className="px-6 py-4">{category.parent_id ?? 'Top level'}</td>
                  <td className="px-6 py-4">{category.sort_order}</td>
                  <td className="px-6 py-4">Active</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="icon-sm" onClick={() => moveCategory(index, index - 1)} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon-sm" onClick={() => moveCategory(index, index + 1)} disabled={index === categories.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => onEditCategory(category)}>
                        <PencilLine className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
