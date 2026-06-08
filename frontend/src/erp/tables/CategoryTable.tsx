import { PencilLine, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { CatalogCategory } from '@/lib/erp-api'

type CategoryTableProps = {
  categories: CatalogCategory[]
  reorderBusy?: boolean
  onCreateCategory: () => void
  onEditCategory: (category: CatalogCategory) => void
}

export function CategoryTable({ categories, reorderBusy = false, onCreateCategory, onEditCategory }: CategoryTableProps) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-muted/25 px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">Create and edit the category list used by products and POS navigation.</p>
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
            <thead className="border-b border-border bg-muted/70 text-left text-xs uppercase tracking-[0.16em] text-foreground">
              <tr>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Parent</th>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
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
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => onEditCategory(category)} disabled={reorderBusy}>
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
