import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const activeSwitchClassName = 'h-5 w-9 data-[checked]:bg-emerald-600 dark:data-[checked]:bg-emerald-500'

function ActiveSwitch({
  label,
  description,
  ariaLabel,
  checked,
  onCheckedChange,
  compact = false,
  className,
}: {
  label: string
  description?: string
  ariaLabel?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border border-border bg-muted/20 text-sm font-medium text-foreground',
        compact ? 'inline-flex min-h-10 rounded-pill px-3 text-xs text-muted-foreground' : 'min-h-11 rounded-2xl bg-background px-4 py-3',
        className,
      )}
    >
      <span className={description ? 'flex flex-col gap-1' : undefined}>
        <span>{label}</span>
        {description ? <span className="text-xs font-normal text-muted-foreground">{description}</span> : null}
      </span>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={ariaLabel ?? label}
        className={activeSwitchClassName}
      />
    </div>
  )
}

export { ActiveSwitch }
