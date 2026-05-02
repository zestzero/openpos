import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useCart } from '../useCart'

function CartTotal() {
  const { total } = useCart()
  return <div>฿{(total / 100).toFixed(2)}</div>
}

function AddItemButton() {
  const { addItem } = useCart()

  return (
    <button
      type="button"
      onClick={() => {
        addItem({
          id: 'variant-1',
          product_id: 'product-1',
          sku: 'SKU-1',
          name: 'Americano',
          price: 12000,
          is_active: true,
          productName: 'Americano',
        })
      }}
    >
      Add item
    </button>
  )
}

describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shares cart totals across hook consumers', () => {
    render(
      <>
        <CartTotal />
        <AddItemButton />
      </>,
    )

    expect(screen.getByText('฿0.00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))

    expect(screen.getByText('฿120.00')).toBeInTheDocument()
  })
})
