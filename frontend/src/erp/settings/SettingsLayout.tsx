import { type ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'

import { FolderCog, Languages, Users, type LucideIcon } from 'lucide-react'

import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { cn } from '@/lib/utils'
import { useI18n, type TranslationKey } from '@/lib/i18n'

interface SettingsNavItem {
  label: TranslationKey
  icon: LucideIcon
  to: string
}

const settingsNavItems: SettingsNavItem[] = [
  { label: 'erp.userManagement', icon: Users, to: '/erp/settings/users' },
]

export function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { t } = useI18n()
  return (
    <div className="flex h-full flex-col gap-6 md:flex-row">
      <aside className="flex shrink-0 flex-row gap-2 overflow-x-auto md:w-56 md:flex-col">
        <div className="mb-1 flex items-center gap-2 px-3 text-sm font-semibold text-muted-foreground md:mb-3">
          <FolderCog className="size-4" />
          {t('erp.settings')}
        </div>
        {settingsNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)

          return (
            <Link
              key={item.label}
              to={item.to}
              className={cn(
                'inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold',
                isActive ? 'bg-foreground text-accent' : 'bg-card text-foreground hover:bg-muted',
              )}
            >
              <Icon className="size-4" />
              {t(item.label)}
            </Link>
          )
        })}
        <div className="mt-2 space-y-2 md:mt-auto md:pt-4">
          <div className="flex items-center gap-2 px-3 text-sm font-semibold text-muted-foreground">
            <Languages className="size-4" />
            {t('language.label')}
          </div>
          <LanguageSwitcher />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        {children}
      </div>
    </div>
  )
}
