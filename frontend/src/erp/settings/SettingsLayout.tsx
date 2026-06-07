import { type ReactNode } from 'react'
import { FolderCog, Users, type LucideIcon } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SettingsNavItem {
  label: string
  icon: LucideIcon
  to: string
}

const settingsNavItems: SettingsNavItem[] = [
  { label: 'User Management', icon: Users, to: '/erp/settings/users' },
]

export function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  return (
    <div className="flex h-full gap-6">
      <aside className="w-56 shrink-0 space-y-1">
        <div className="mb-4 flex items-center gap-2 px-3 text-sm font-medium text-muted-foreground">
          <FolderCog className="h-4 w-4" />
          Settings
        </div>
        {settingsNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)

          return (
            <a
              key={item.label}
              href={item.to}
              className={cn(
                buttonVariants({ variant: isActive ? 'secondary' : 'ghost' }),
                'h-10 w-full justify-start gap-3 rounded-card px-3',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </a>
          )
        })}
      </aside>
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  )
}
