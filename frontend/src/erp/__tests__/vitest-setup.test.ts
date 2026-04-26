import React from 'react'
import { render, screen } from '@testing-library/react'

import { formatTHB } from '@/lib/formatCurrency'

describe('ERP Vitest setup', () => {
  it('supports DOM assertions and shared THB formatting', () => {
    render(React.createElement('span', { role: 'status' }, 'Vitest is ready'))

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(formatTHB(123456)).toBe('฿1,234.56')
  })
})
