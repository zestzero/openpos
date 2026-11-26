import { type ReactNode } from 'react'
import { FolderCog, Users, type LucideIcon } from 'lucide-react'

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
    <div className="flex h-full flex-col gap-6 md:flex-row">
      <aside className="flex shrink-0 flex-row gap-2 overflow-x-auto md:w-56 md:flex-col">
        <div className="mb-1 flex items-center gap-2 px-3 text-sm font-semibold text-muted-foreground md:mb-3">
          <FolderCog className="size-4" />
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
                'inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold',
                isActive ? 'bg-foreground text-accent' : 'bg-card text-foreground hover:bg-muted',
              )}
            >
              <Icon className="size-4" />
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
