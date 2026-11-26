import { cn } from '@/lib/utils'

type DeltaDirection = 'up' | 'down' | 'flat'

export function KpiStat({
  label,
  value,
  delta,
  note,
  highlight = false,
}: {
  label: string
  value: string
  delta?: { label: string; direction: DeltaDirection } | null
  note?: string
  highlight?: boolean
}) {
  return (
    <article
      className={cn(
        'flex min-h-40 flex-col rounded-card p-5',
        highlight ? 'bg-accent text-accent-foreground' : 'border border-border bg-card text-card-foreground',
      )}
    >
      <p className={cn('text-sm font-medium', highlight ? 'text-accent-foreground' : 'text-muted-foreground')}>{label}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
        <h3 className="text-4xl font-bold leading-none tracking-tight tabular-nums">{value}</h3>
        {delta ? <DeltaBadge label={delta.label} direction={delta.direction} /> : null}
      </div>
      {note ? (
        <p className={cn('mt-3 text-sm leading-5', highlight ? 'text-accent-foreground' : 'text-muted-foreground')}>{note}</p>
      ) : null}
    </article>
  )
}

function DeltaBadge({ label, direction }: { label: string; direction: DeltaDirection }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
        direction === 'up' && 'bg-success-soft text-success-foreground',
        direction === 'down' && 'bg-destructive-soft text-destructive-foreground',
        direction === 'flat' && 'bg-muted text-foreground',
      )}
    >
      {label}
    </span>
  )
}
