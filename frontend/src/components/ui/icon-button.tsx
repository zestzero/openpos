import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type IconButtonProps = React.ComponentProps<typeof Button> & {
  label: string
}

export function IconButton({ label, className, children, ...props }: IconButtonProps) {
  return (
    <Button size="icon" aria-label={label} className={cn('rounded-full', className)} {...props}>
      {children}
    </Button>
  )
}
