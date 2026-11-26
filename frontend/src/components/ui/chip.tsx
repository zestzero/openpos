import { cn } from '@/lib/utils'

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
}

export function Chip({ active = false, className, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-12 items-center justify-center rounded-full px-4 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
        active
          ? 'border border-border bg-card text-foreground shadow-card'
          : 'border border-transparent bg-muted text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}
