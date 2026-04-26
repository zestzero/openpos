import { render, screen } from '@testing-library/react'

import { CategoryDrawer } from '../categories/CategoryDrawer'
import { CategoryTable } from '../tables/CategoryTable'
import { ProductDrawer } from '../products/ProductDrawer'
import { ProductTable } from '../tables/ProductTable'

describe('ERP catalog management', () => {
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
        />
        <CategoryTable
          categories={[]}
          onCreateCategory={() => undefined}
          onEditCategory={() => undefined}
          onReorderCategories={() => undefined}
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
          { id: 'cat-1', name: 'Tea' },
          { id: 'cat-2', name: 'Coffee' },
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

  it('renders the category drawer with parent category controls', () => {
    render(
      <CategoryDrawer
        open
        categories={[
          { id: 'cat-1', name: 'Tea' },
          { id: 'cat-2', name: 'Coffee' },
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
          { id: 'cat-1', name: 'Tea' },
        ]}
        products={[
          {
            product: {
              id: 'prod-1',
              name: 'Jasmine Tea',
              description: 'Hot tea',
              category_id: 'cat-1',
              image_url: 'https://example.com/tea.png',
              is_active: true,
            },
            category: { id: 'cat-1', name: 'Tea' },
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
          },
        ]}
        onCreateProduct={() => undefined}
        onEditProduct={() => undefined}
        onArchiveProduct={() => undefined}
        onArchiveVariant={() => undefined}
        onReorderVariants={() => undefined}
      />,
    )

    expect(screen.getByText('฿129.00 – ฿129.00')).toBeInTheDocument()
    expect(screen.getByText('Tea')).toBeInTheDocument()
  })
})
