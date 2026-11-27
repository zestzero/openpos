
import type { ComponentProps } from 'react'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type FormSelectOption = {
  value: string
  label: string
}

export type FormSelectProps = {
  value: string | null
  onValueChange: (value: string | null) => void
  options: readonly FormSelectOption[]
  emptyOption?: { label: string }
  disabled?: boolean
  portalContainer?: ComponentProps<typeof SelectContent>['portalContainer']
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  className?: string
}

export function FormSelect({
  value,
  onValueChange,
  options,
  emptyOption,
  portalContainer,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  className,
}: FormSelectProps) {
  const items = emptyOption ? [{ value: null, label: emptyOption.label }, ...options] : options
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled} items={items}>
      <SelectTrigger
        disabled={disabled}
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={cn('h-11 text-sm', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent portalContainer={portalContainer}>
        {emptyOption ? <SelectItem value={null}>{emptyOption.label}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
