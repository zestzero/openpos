import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CategoryDrawer } from '../categories/CategoryDrawer'
import { CategoryTable } from '../tables/CategoryTable'
import { ImportDrawer } from '../import/ImportDrawer'
import { generateVariantBarcode } from '../products/variantBarcode'

function makeCategory(id: string, name: string) {
  return {
    id,
    name,
    description: '',
    parent_id: null,
    sort_order: 1,
  }
}

describe('ERP import workflow', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function renderWithQueryClient(ui: ReactElement) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
  }

  it('generates a stable barcode for a variant', () => {
    expect(
      generateVariantBarcode({
        productName: 'Green Tea',
        variantName: 'Large Cup',
      }),
    ).toBe('ERP-GREEN-TEA-LARGE-CUP')

    expect(
      generateVariantBarcode({
        productName: 'Green Tea',
        variantName: 'Large Cup',
        existingBarcodes: ['ERP-GREEN-TEA-LARGE-CUP'],
      }),
    ).toBe('ERP-GREEN-TEA-LARGE-CUP-2')
  })

  it('wires the category drawer parent controls', () => {
    const onSave = vi.fn()

    render(
      <CategoryDrawer
        open
        categories={[makeCategory('cat-1', 'Tea'), makeCategory('cat-2', 'Coffee')]}
        onOpenChange={() => undefined}
        onSave={onSave}
      />,
    )

    fireEvent.change(screen.getByLabelText('Parent category'), { target: { value: 'cat-2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save category' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ parentId: 'cat-2' }))
  })

  it('wires the category table edit control without reorder arrows', () => {
    const onEditCategory = vi.fn()

    render(
      <CategoryTable
        categories={[makeCategory('cat-1', 'Tea'), makeCategory('cat-2', 'Coffee')]}
        onCreateCategory={() => undefined}
        onEditCategory={onEditCategory}
      />,
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    expect(onEditCategory).toHaveBeenCalledWith(expect.objectContaining({ id: 'cat-1' }))
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('parses a CSV preview, lets owners generate a barcode, and submits the import', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: vi.fn().mockResolvedValue(JSON.stringify({ data: [] })),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithQueryClient(<ImportDrawer />)

    fireEvent.click(screen.getByRole('button', { name: 'Import CSV' }))

    const fileInput = screen.getByLabelText('Upload CSV or XLSX file')
    const file = new File(
      ['product_name,variant_name,sku,price\nGreen Tea,Large Cup,GT-LARGE,12900'],
      'catalog.csv',
      { type: 'text/csv' },
    )

    fireEvent.change(fileInput, { target: { files: [file] } })

    await screen.findByText('Green Tea')
    expect(screen.getByText('Large Cup')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Generate barcode' }))
    expect(screen.getByDisplayValue('ERP-GREEN-TEA-LARGE-CUP')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Import validated rows' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [requestUrl, requestInit] = fetchMock.mock.calls[0]

    expect(String(requestUrl)).toContain('/api/catalog/import')
    expect(requestInit).toMatchObject({ method: 'POST' })

    const body = JSON.parse(String(requestInit?.body ?? '{}'))
    expect(body.products).toHaveLength(1)
    expect(body.products[0].variants[0]).toMatchObject({
      sku: 'GT-LARGE',
      barcode: 'ERP-GREEN-TEA-LARGE-CUP',
      price: 12900,
    })
  })

  it('parses import aliases and blocks duplicate SKU and barcode rows', async () => {
    renderWithQueryClient(<ImportDrawer />)

    fireEvent.click(screen.getByRole('button', { name: 'Import CSV' }))

    const file = new File(
      [
        'product,variant,variant_sku,variant_barcode,price_satang,cost_satang,active\n' +
          'Green Tea,Large Cup,GT-LARGE,1234567890123,12900,8500,true\n' +
          'Green Tea,Medium Cup,GT-LARGE,1234567890123,11900,8000,true',
      ],
      'catalog.csv',
      { type: 'text/csv' },
    )

    const fileInput = screen.getByLabelText('Upload CSV or XLSX file')
    fireEvent.change(fileInput, { target: { files: [file] } })

    await screen.findAllByText('Green Tea')
    expect(screen.getByText('Large Cup')).toBeInTheDocument()
    expect(screen.getByText('Medium Cup')).toBeInTheDocument()
    expect(screen.getAllByText(/SKU must be unique inside the import file/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Barcode must be unique inside the import file/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Import validated rows' })).toBeDisabled()
  })

  it('blocks invalid rows and shows preview errors before submit', async () => {
    renderWithQueryClient(<ImportDrawer />)

    fireEvent.click(screen.getByRole('button', { name: 'Import CSV' }))

    const fileInput = screen.getByLabelText('Upload CSV or XLSX file')
    const file = new File(
      ['product_name,variant_name,sku,price\n,Large Cup,,'],
      'broken.csv',
      { type: 'text/csv' },
    )

    fireEvent.change(fileInput, { target: { files: [file] } })

    await screen.findByText('Missing product name')
    expect(screen.getByText(/SKU is required/)).toBeInTheDocument()
    expect(screen.getByText(/Price is required/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import validated rows' })).toBeDisabled()
  })

})
