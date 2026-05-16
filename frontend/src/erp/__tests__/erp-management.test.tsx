import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentProps } from 'react'
import QRCode from 'qrcode'
import { vi } from 'vitest'

import { CategoryDrawer } from '../categories/CategoryDrawer'
import { CategoryManagementPage } from '../categories/CategoryManagementPage'
import { ProductManagementPage } from '../products/ProductManagementPage'
import { CategoryTable } from '../tables/CategoryTable'
import { ProductDrawer } from '../products/ProductDrawer'
import { BarcodeBatchPrintDialog } from '../products/BarcodeBatchPrintDialog'
import { ProductTable } from '../tables/ProductTable'
import {
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
} from '@/lib/erp-api'

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(async (payload: string) => `data:image/png;base64,qr-${payload}`),
  },
}))

vi.mock('@/lib/erp-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/erp-api')>()

  return {
    ...actual,
    useArchiveProductMutation: vi.fn(),
    useArchiveVariantMutation: vi.fn(),
    useCategoriesQuery: vi.fn(),
    useCreateCategoryMutation: vi.fn(),
    useCreateProductMutation: vi.fn(),
    useCreateVariantMutation: vi.fn(),
    useProductsQuery: vi.fn(),
    useUpdateCategoryMutation: vi.fn(),
    useUpdateProductMutation: vi.fn(),
    useUpdateVariantMutation: vi.fn(),
  }
})

function makeCategory(id: string, name: string) {
  return {
    id,
    name,
    description: '',
    parent_id: null,
    sort_order: 1,
  }
}

function makeProductRecord() {
  return {
    product: {
      id: 'prod-1',
      name: 'Jasmine Tea',
      description: 'Hot tea',
      category_id: 'cat-1',
      image_url: 'https://example.com/tea.png',
      is_active: true,
    },
    category: makeCategory('cat-1', 'Tea'),
    variants: [
      {
        id: 'var-1',
        product_id: 'prod-1',
        sku: 'TEA-001',
        barcode: '1234567890123',
        name: 'Large',
        price: 12900,
        cost: 8500,
        is_active: true,
      },
    ],
  }
}

function productTableSelectionProps(overrides: Partial<ComponentProps<typeof ProductTable>> = {}) {
  return {
    selectedVariantIds: new Set<string>(),
    barcodeLabelCount: 0,
    onToggleProductVariants: vi.fn(),
    onToggleVariant: vi.fn(),
    onOpenBarcodePreview: vi.fn(),
    onClearBarcodeSelection: vi.fn(),
    ...overrides,
  }
}

function mockMutation() {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }
}

function mockManagementHooks() {
  vi.mocked(useProductsQuery).mockReturnValue({ data: [], isLoading: false, error: null } as any)
  vi.mocked(useCategoriesQuery).mockReturnValue({ data: [], isLoading: false, error: null } as any)
  vi.mocked(useCreateProductMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useUpdateProductMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useArchiveProductMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useCreateVariantMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useUpdateVariantMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useArchiveVariantMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useCreateCategoryMutation).mockReturnValue(mockMutation() as any)
  vi.mocked(useUpdateCategoryMutation).mockReturnValue(mockMutation() as any)
}

describe('ERP catalog management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const qrCodeToDataURL = vi.mocked(QRCode.toDataURL) as unknown as ReturnType<typeof vi.fn>
    qrCodeToDataURL.mockReset()
    qrCodeToDataURL.mockImplementation(async (payload: string) => `data:image/png;base64,qr-${payload}`)
    mockManagementHooks()
  })

  it('renders the product management page without category actions', () => {
    render(<ProductManagementPage />)

    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create product' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Categories' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create category' })).not.toBeInTheDocument()
  })

  it('renders the category management page without product actions', () => {
    render(<CategoryManagementPage />)

    expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create category' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Products' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create product' })).not.toBeInTheDocument()
  })

  it('renders product and category empty states instead of placeholders', () => {
    render(
      <div>
        <ProductTable
          categories={[]}
          products={[]}
          onCreateProduct={() => undefined}
          onEditProduct={() => undefined}
          onArchiveProduct={() => undefined}
          onArchiveVariant={() => undefined}
          onReorderVariants={() => undefined}
          {...productTableSelectionProps()}
        />
        <CategoryTable
          categories={[]}
          onCreateCategory={() => undefined}
          onEditCategory={() => undefined}
        />
      </div>,
    )

    expect(screen.getAllByText('No products yet')[0]).toBeInTheDocument()
    expect(screen.getByText('Create your first product or import a CSV to start managing variants, stock, and reports.')).toBeInTheDocument()
    expect(screen.getByText('No categories yet')).toBeInTheDocument()
  })

  it('renders the product drawer with image and nested variant fields', () => {
    render(
        <ProductDrawer
          open
          categories={[
          makeCategory('cat-1', 'Tea'),
          makeCategory('cat-2', 'Coffee'),
          ]}
        onOpenChange={() => undefined}
        onSave={() => undefined}
      />,
    )

    expect(screen.getByText('Create product')).toBeInTheDocument()
    expect(screen.getByLabelText('Image URL')).toBeInTheDocument()
    expect(screen.getByText('Variant 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add variant' })).toBeInTheDocument()
  })

  it('saves edited product drawer values with nested variants intact', () => {
    const onSave = vi.fn()

    render(
      <ProductDrawer
        open
        product={makeProductRecord() as any}
        categories={[
          makeCategory('cat-1', 'Tea'),
          makeCategory('cat-2', 'Coffee'),
        ]}
        onOpenChange={() => undefined}
        onSave={onSave}
      />,
    )

    fireEvent.change(screen.getByLabelText('Product name'), { target: { value: 'Jasmine Tea Refill' } })
    fireEvent.change(screen.getByLabelText('Barcode'), { target: { value: '9876543210987' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save product' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Jasmine Tea Refill',
        variants: [
          expect.objectContaining({
            sku: 'TEA-001',
            barcode: '9876543210987',
            price: 129,
            cost: 85,
          }),
        ],
      }),
    )
  })

  it('renders the category drawer with parent category controls', () => {
    render(
        <CategoryDrawer
          open
          categories={[
          makeCategory('cat-1', 'Tea'),
          makeCategory('cat-2', 'Coffee'),
          ]}
        onOpenChange={() => undefined}
        onSave={() => undefined}
      />,
    )

    expect(screen.getByText('Create category')).toBeInTheDocument()
    expect(screen.getByLabelText('Parent category')).toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
  })

  it('formats money values in THB inside the product table', () => {
    render(
      <ProductTable
        categories={[
          makeCategory('cat-1', 'Tea'),
        ]}
        products={[makeProductRecord() as any]}
        onCreateProduct={() => undefined}
        onEditProduct={() => undefined}
        onArchiveProduct={() => undefined}
        onArchiveVariant={() => undefined}
        onReorderVariants={() => undefined}
        {...productTableSelectionProps()}
      />,
    )

    expect(screen.getByText('฿129.00 – ฿129.00')).toBeInTheDocument()
    expect(screen.getByText('Tea')).toBeInTheDocument()
  })

  it('wires the product table edit, archive, variant archive, and reorder actions without restock', () => {
    const onEditProduct = vi.fn()
    const onArchiveProduct = vi.fn()
    const onArchiveVariant = vi.fn()
    const onReorderVariants = vi.fn()

    render(
      <ProductTable
        categories={[makeCategory('cat-1', 'Tea')]}
        products={[makeProductRecord() as any]}
        onCreateProduct={() => undefined}
        onEditProduct={onEditProduct}
        onArchiveProduct={onArchiveProduct}
        onArchiveVariant={onArchiveVariant}
        onReorderVariants={onReorderVariants}
        {...productTableSelectionProps()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }))
    fireEvent.click(screen.getByRole('button', { name: 'Archive variant' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reorder variants' }))

    expect(onEditProduct).toHaveBeenCalledWith(expect.objectContaining({ product: expect.any(Object) }))
    expect(onArchiveProduct).toHaveBeenCalledWith(expect.objectContaining({ product: expect.any(Object) }))
    expect(onArchiveVariant).toHaveBeenCalledWith(expect.objectContaining({ product: expect.any(Object) }), 'var-1')
    expect(onReorderVariants).toHaveBeenCalledWith('prod-1', ['var-1'])
    expect(screen.queryByRole('button', { name: 'Restock' })).not.toBeInTheDocument()
  })

  it('selects variants for barcode batch printing', () => {
    const onToggleProductVariants = vi.fn()
    const onToggleVariant = vi.fn()
    const onOpenBarcodePreview = vi.fn()
    const onClearBarcodeSelection = vi.fn()

    const { rerender } = render(
      <ProductTable
        categories={[makeCategory('cat-1', 'Tea')]}
        products={[makeProductRecord() as any]}
        onCreateProduct={() => undefined}
        onEditProduct={() => undefined}
        onArchiveProduct={() => undefined}
        onArchiveVariant={() => undefined}
        onReorderVariants={() => undefined}
        {...productTableSelectionProps({ onToggleProductVariants, onToggleVariant, onOpenBarcodePreview, onClearBarcodeSelection })}
      />,
    )

    expect(screen.getByRole('button', { name: 'Print barcodes' })).toBeDisabled()
    fireEvent.click(screen.getByLabelText('Select barcode label for Jasmine Tea Large'))
    expect(onToggleVariant).toHaveBeenCalledWith('var-1', true)
    fireEvent.click(screen.getByLabelText('Select all active variants for Jasmine Tea'))
    expect(onToggleProductVariants).toHaveBeenCalledWith(expect.objectContaining({ product: expect.any(Object) }), true)

    rerender(
      <ProductTable
        categories={[makeCategory('cat-1', 'Tea')]}
        products={[makeProductRecord() as any]}
        onCreateProduct={() => undefined}
        onEditProduct={() => undefined}
        onArchiveProduct={() => undefined}
        onArchiveVariant={() => undefined}
        onReorderVariants={() => undefined}
        {...productTableSelectionProps({ selectedVariantIds: new Set(['var-1']), barcodeLabelCount: 1, onOpenBarcodePreview, onClearBarcodeSelection })}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Print barcodes (1)' }))
    expect(onOpenBarcodePreview).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Clear 1' }))
    expect(onClearBarcodeSelection).toHaveBeenCalled()
  })

  it('switches batch label preview from barcode to QR while keeping the same payload', async () => {
    let resolveQr!: (value: string) => void
    const qrPromise = new Promise<string>((resolve) => {
      resolveQr = resolve
    })

    vi.mocked(QRCode.toDataURL).mockImplementationOnce(() => qrPromise)
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => undefined)

    render(
      <BarcodeBatchPrintDialog
        open
        labels={[
          {
            id: 'var-1',
            productName: 'Jasmine Tea',
            variantName: 'Large',
            sku: 'TEA-001',
            price: '฿129.00',
            payload: '1234567890123',
            humanReadable: '1234567890123',
          },
        ]}
        onOpenChange={() => undefined}
        onClearSelection={() => undefined}
      />,
    )

    expect(screen.getByText('Label preview')).toBeInTheDocument()
    expect(screen.getByLabelText('Machine-readable Code 39 barcode 1234567890123')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Barcode' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'QR code' })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'QR code' }))

    expect(screen.getByRole('button', { name: 'Print labels' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Print labels' }))
    expect(printSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'QR code' })).toHaveAttribute('aria-pressed', 'true')

    await act(async () => {
      resolveQr('data:image/png;base64,qr-1234567890123')
      await qrPromise
    })

    expect(QRCode.toDataURL).toHaveBeenCalledWith('1234567890123', expect.any(Object))
    expect(await screen.findByAltText('QR code for 1234567890123')).toHaveAttribute('src', 'data:image/png;base64,qr-1234567890123')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Print labels' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Print labels' }))
    expect(printSpy).toHaveBeenCalledTimes(1)
    printSpy.mockRestore()
    expect(screen.queryByLabelText('Machine-readable Code 39 barcode 1234567890123')).not.toBeInTheDocument()
  })

  it('does not render category reorder arrows when category ordering is out of scope', () => {
    render(
      <CategoryTable
        categories={[makeCategory('cat-1', 'Tea'), makeCategory('cat-2', 'Coffee')]}
        onCreateCategory={() => undefined}
        onEditCategory={() => undefined}
      />,
    )

    expect(screen.queryByRole('button', { name: /up|down/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2)
  })
})
