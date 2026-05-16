import { useMemo, useState } from 'react'

import { CategoryTable } from '@/erp/tables/CategoryTable'
import { ProductTable } from '@/erp/tables/ProductTable'
import {
  normalizeProductDraft,
  useArchiveProductMutation,
  useArchiveVariantMutation,
  useCategoriesQuery,
  useCreateCategoryMutation,
  useCreateProductMutation,
  useCreateVariantMutation,
  useProductsQuery,
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
import { activeVariantIds, buildBarcodeLabels } from './barcodeLabels'
import { BarcodeBatchPrintDialog } from './BarcodeBatchPrintDialog'
import { ProductDrawer } from './ProductDrawer'

export function ProductManagementPage() {
  const { data: categories = [] } = useCategoriesQuery()
  const { data: products = [] } = useProductsQuery()

  const createProductMutation = useCreateProductMutation()
  const updateProductMutation = useUpdateProductMutation()
  const createVariantMutation = useCreateVariantMutation()
  const updateVariantMutation = useUpdateVariantMutation()
  const archiveProductMutation = useArchiveProductMutation()
  const archiveVariantMutation = useArchiveVariantMutation()
  const archiveBusy = archiveProductMutation.isPending || archiveVariantMutation.isPending

  const createCategoryMutation = useCreateCategoryMutation()
  const updateCategoryMutation = useUpdateCategoryMutation()
  const [productDrawerOpen, setProductDrawerOpen] = useState(false)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [barcodePreviewOpen, setBarcodePreviewOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<CatalogProductRecord | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null)
  const [selectedBarcodeVariantIds, setSelectedBarcodeVariantIds] = useState<Set<string>>(() => new Set())

  const barcodeLabels = useMemo(() => buildBarcodeLabels(products, selectedBarcodeVariantIds), [products, selectedBarcodeVariantIds])

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

  const toggleVariantForBarcode = (variantId: string, checked: boolean) => {
    setSelectedBarcodeVariantIds((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(variantId)
      } else {
        next.delete(variantId)
      }
      return next
    })
  }

  const toggleProductVariantsForBarcode = (product: CatalogProductRecord, checked: boolean) => {
    const ids = activeVariantIds(product)
    setSelectedBarcodeVariantIds((current) => {
      const next = new Set(current)
      for (const id of ids) {
        if (checked) {
          next.add(id)
        } else {
          next.delete(id)
        }
      }
      return next
    })
  }

  const clearBarcodeSelection = () => {
    setSelectedBarcodeVariantIds(new Set())
  }

  return (
    <div className="space-y-6">
      <CategoryTable
        categories={categories}
        onCreateCategory={openCreateCategory}
        onEditCategory={openEditCategory}
      />

      <ProductTable
        products={products}
        categories={categories}
        archiveBusy={archiveBusy}
        selectedVariantIds={selectedBarcodeVariantIds}
        barcodeLabelCount={barcodeLabels.length}
        onCreateProduct={openCreateProduct}
        onEditProduct={openEditProduct}
        onArchiveProduct={async (product) => {
          await archiveProductMutation.mutateAsync({ id: product.product.id, values: normalizeProductDraft(product) })
        }}
        onArchiveVariant={archiveVariant}
        onReorderVariants={async () => undefined}
        onToggleProductVariants={toggleProductVariantsForBarcode}
        onToggleVariant={toggleVariantForBarcode}
        onOpenBarcodePreview={() => setBarcodePreviewOpen(true)}
        onClearBarcodeSelection={clearBarcodeSelection}
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

      <BarcodeBatchPrintDialog
        open={barcodePreviewOpen}
        labels={barcodeLabels}
        onOpenChange={setBarcodePreviewOpen}
        onClearSelection={clearBarcodeSelection}
      />

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
