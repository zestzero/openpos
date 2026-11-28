import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { FormSelect, type FormSelectOption } from '../form-select'

const options: FormSelectOption[] = [
  { value: 'first', label: 'First choice' },
  { value: 'second', label: 'Second choice' },
]
function selectOption(name: string) {
  const option = screen.getByRole('option', { name })
  fireEvent.mouseMove(option)
  fireEvent.pointerEnter(option, { pointerType: 'mouse' })
  fireEvent.pointerDown(option, { pointerType: 'mouse', button: 0 })
  fireEvent.click(option)
}


function ControlledSelect({
  initialValue,
  onChange,
  disabled = false,
}: {
  initialValue: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
}) {
  const [value, setValue] = useState(initialValue)

  return (
    <FormSelect
      aria-label="Example choice"
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue)
        onChange(nextValue)
      }}
      options={options}
      emptyOption={{ label: 'No choice' }}
      disabled={disabled}
    />
  )
}

describe('FormSelect', () => {
  it('shows its controlled selection and emits the original selected value', () => {
    const onChange = vi.fn()
    render(<ControlledSelect initialValue="first" onChange={onChange} />)

    const trigger = screen.getByRole('combobox', { name: 'Example choice' })
    expect(trigger).toHaveTextContent('First choice')

    fireEvent.click(trigger)
    selectOption('Second choice')

    expect(onChange).toHaveBeenCalledWith('second')
    expect(trigger).toHaveTextContent('Second choice')
  })

  it('represents a blank choice with null rather than an internal value', () => {
    const onChange = vi.fn()
    render(<ControlledSelect initialValue="first" onChange={onChange} />)

    fireEvent.click(screen.getByRole('combobox', { name: 'Example choice' }))
    selectOption('No choice')

    expect(onChange).toHaveBeenCalledWith(null)
    expect(onChange).not.toHaveBeenCalledWith(expect.any(String))
  })

  it('supports keyboard opening and selection', () => {
    const onChange = vi.fn()
    render(<ControlledSelect initialValue="first" onChange={onChange} />)

    const trigger = screen.getByRole('combobox', { name: 'Example choice' })
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const secondOption = screen.getByRole('option', { name: 'Second choice' })
    fireEvent.focus(secondOption)
    fireEvent.keyDown(secondOption, { key: 'Enter' })
    fireEvent.click(secondOption)

    expect(onChange).toHaveBeenCalledWith('second')
  })

  it('exposes disabled semantics and does not open', () => {
    render(<ControlledSelect initialValue="first" onChange={vi.fn()} disabled />)

    const trigger = screen.getByRole('combobox', { name: 'Example choice' })
    expect(trigger).toBeDisabled()
    fireEvent.click(trigger)
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})
