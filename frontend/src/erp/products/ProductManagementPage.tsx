import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CategoryTable } from '@/erp/tables/CategoryTable'
import { ProductTable } from '@/erp/tables/ProductTable'
import {
  normalizeProductDraft,
  useAdjustStockMutation,
  useArchiveProductMutation,
  useArchiveVariantMutation,
  useCategoriesQuery,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useCreateVariantMutation,
  useProductsQuery,
  useReorderCategoriesMutation,
  useUpdateCategoryMutation,
  useUpdateProductMutation,
  useUpdateVariantMutation,
  type CatalogCategory,
  type CatalogProductRecord,
  type CategoryFormValues,
  type ProductFormValues,
  type VariantFormValues,
} from '@/lib/erp-api'

import { CategoryDrawer } from '@/erp/categories/CategoryDrawer'
import { ProductDrawer } from './ProductDrawer'

export function ProductManagementPage() {
  const { data: categories = [] } = useCategoriesQuery()
  const { data: products = [] } = useProductsQuery()

  const createProductMutation = useCreateProductMutation()
  const updateProductMutation = useUpdateProductMutation()
  const createVariantMutation = useCreateVariantMutation()
  const updateVariantMutation = useUpdateVariantMutation()
  const adjustStockMutation = useAdjustStockMutation()
  const archiveProductMutation = useArchiveProductMutation()
  const archiveVariantMutation = useArchiveVariantMutation()
  const archiveBusy = archiveProductMutation.isPending || archiveVariantMutation.isPending
  const restockBusy = adjustStockMutation.isPending

  const createCategoryMutation = useCreateCategoryMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const reorderCategoriesMutation = useReorderCategoriesMutation()
  const categoryBusy = reorderCategoriesMutation.isPending

  const [productDrawerOpen, setProductDrawerOpen] = useState(false)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CatalogProductRecord | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null)
  const [restockTarget, setRestockTarget] = useState<{ product: CatalogProductRecord; variantId: string; variantName: string } | null>(null)
  const [restockQuantity, setRestockQuantity] = useState('1')
  const [restockError, setRestockError] = useState<string | null>(null)

  const openCreateProduct = () => {
    setSelectedProduct(null)
    setProductDrawerOpen(true)
  }

  const openEditProduct = (product: CatalogProductRecord) => {
    setSelectedProduct(product)
    setProductDrawerOpen(true)
  }

  const openCreateCategory = () => {
    setSelectedCategory(null)
    setCategoryDrawerOpen(true)
  }

  const openEditCategory = (category: CatalogCategory) => {
    setSelectedCategory(category)
    setCategoryDrawerOpen(true)
  }

  const saveProduct = async (values: ProductFormValues) => {
    const trimmedValues: ProductFormValues = {
      ...values,
      variants: values.variants.filter((variant) => Boolean(
        variant.sku.trim()
        || variant.name.trim()
        || variant.barcode.trim()
        || variant.price > 0
        || variant.cost > 0,
      )),
    }

    if (selectedProduct) {
      const updated = await updateProductMutation.mutateAsync({ id: selectedProduct.product.id, values: trimmedValues })

      for (const variant of trimmedValues.variants) {
        if (variant.id) {
          await updateVariantMutation.mutateAsync({ id: variant.id, variant })
          continue
        }

        await createVariantMutation.mutateAsync({ productId: updated.product.id, variant })
      }
    } else {
      await createProductMutation.mutateAsync(trimmedValues)
    }

    setSelectedProduct(null)
    setProductDrawerOpen(false)
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

  const archiveVariant = async (product: CatalogProductRecord, variantId: string) => {
    const variant = product.variants.find((item) => item.id === variantId)
    if (!variant) {
      return
    }

    await archiveVariantMutation.mutateAsync({ id: variant.id, variant: toVariantFormValues(variant) })
  }

  const openRestockVariant = (product: CatalogProductRecord, variantId: string) => {
    const variant = product.variants.find((item) => item.id === variantId)
    if (!variant) {
      return
    }

    setRestockTarget({ product, variantId, variantName: variant.name })
    setRestockQuantity('1')
    setRestockError(null)
  }

  const closeRestockDialog = () => {
    if (restockBusy) {
      return
    }

    setRestockTarget(null)
    setRestockQuantity('1')
    setRestockError(null)
  }

  const submitRestock = async () => {
    if (!restockTarget) {
      return
    }

    const quantity = Number(restockQuantity)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setRestockError('Enter a whole number greater than zero.')
      return
    }

    try {
      setRestockError(null)
      await adjustStockMutation.mutateAsync({
        variantId: restockTarget.variantId,
        quantity,
        reason: 'RESTOCK',
      })
      toast.success(`Restocked ${restockTarget.variantName}`)
      closeRestockDialog()
    } catch (error) {
      setRestockError(error instanceof Error ? error.message : 'Unable to restock variant')
    }
  }

  return (
    <div className="space-y-6">
      <CategoryTable
        categories={categories}
        reorderBusy={categoryBusy}
        onCreateCategory={openCreateCategory}
        onEditCategory={openEditCategory}
        onReorderCategories={async (ids) => {
          await reorderCategoriesMutation.mutateAsync(ids)
        }}
      />

      <ProductTable
        products={products}
        categories={categories}
        archiveBusy={archiveBusy}
        restockBusy={restockBusy}
        onCreateProduct={openCreateProduct}
        onEditProduct={openEditProduct}
        onArchiveProduct={async (product) => {
          await archiveProductMutation.mutateAsync({ id: product.product.id, values: normalizeProductDraft(product) })
        }}
        onArchiveVariant={archiveVariant}
        onRestockVariant={openRestockVariant}
        onReorderVariants={async () => undefined}
      />

      <ProductDrawer
        open={productDrawerOpen}
        product={selectedProduct}
        categories={categories}
        onOpenChange={(open) => {
          setProductDrawerOpen(open)
          if (!open) {
            setSelectedProduct(null)
          }
        }}
        onSave={saveProduct}
      />

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

      <Dialog open={restockTarget !== null} onOpenChange={(open) => { if (!open) closeRestockDialog() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock variant</DialogTitle>
            <DialogDescription>
              Add stock back into the ledger for {restockTarget?.product.product.name ?? 'this product'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-card border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{restockTarget?.variantName}</p>
              <p>Positive quantities increase stock. Use the inventory ledger as the source of truth.</p>
            </div>

            <label className="space-y-2 text-sm font-medium text-foreground">
              <span>Quantity</span>
              <Input
                type="number"
                min="1"
                step="1"
                value={restockQuantity}
                onChange={(event) => setRestockQuantity(event.target.value)}
              />
            </label>

            {restockError ? <p className="text-sm text-destructive">{restockError}</p> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeRestockDialog} disabled={restockBusy}>
              Cancel
            </Button>
            <Button onClick={() => void submitRestock()} disabled={restockBusy}>
              {restockBusy ? 'Restocking...' : 'Restock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function toVariantFormValues(variant: {
  id: string
  sku: string
  barcode: string | null
  name: string
  price: number
  cost: number | null
  is_active: boolean
}): VariantFormValues {
  return {
    id: variant.id,
    sku: variant.sku,
    barcode: variant.barcode ?? '',
    name: variant.name,
    price: variant.price / 100,
    cost: (variant.cost ?? 0) / 100,
    isActive: variant.is_active,
  }
}
